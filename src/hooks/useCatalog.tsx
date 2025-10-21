import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductVariation } from "@/types/product";
import { useStoreResolver } from "@/hooks/useStoreResolver";

export type CatalogType = "retail" | "wholesale";

// Interface Store alinhada com os dados reais do Supabase
export interface Store {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  url_slug: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  cnpj: string | null;
  plan_type: string;
  monthly_fee: number;
  // Campo do price_model
  price_model?: string;
}

// 🚀 Cache global para dados do catálogo
const catalogCache = new Map<string, {
  store: Store;
  products: Product[];
  timestamp: number;
  expiresIn: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useCatalog = (storeSlug?: string) => {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [catalogType, setCatalogType] = useState<CatalogType>("retail");

  const { resolveStoreId } = useStoreResolver();

  // Use refs to avoid recreating functions on every render
  const loadedStoreRef = useRef<string | null>(null);
  const loadedCatalogTypeRef = useRef<CatalogType | null>(null);

  const loadStore = useCallback(async (slug: string) => {
    console.log("🏪 CATÁLOGO - Iniciando carregamento da loja:", slug);
    setLoading(true);
    setStoreError(null);

    try {
      // Primeiro, buscar dados da loja
      const { data: storeData, error: storeError } = await supabase
        .from("stores")
        .select("*")
        .eq("url_slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (storeError) {
        console.error("❌ Erro ao buscar loja:", storeError);
        setStoreError(`Erro ao buscar loja: ${storeError.message}`);
        setStore(null);
        return false;
      }

      if (!storeData) {
        console.warn("⚠️ Loja não encontrada:", slug);
        setStoreError("Loja não encontrada ou inativa");
        setStore(null);
        return false;
      }

      // Segundo, buscar dados do price_model
      const { data: priceModelData, error: priceModelError } = await supabase
        .from("store_price_models")
        .select("price_model")
        .eq("store_id", storeData.id)
        .maybeSingle();

      if (priceModelError) {
        console.warn("⚠️ Erro ao buscar price_model:", priceModelError);
      }

      // Processar dados do price_model
      console.log("🔍 [useCatalog] Debug price_model:", {
        storeId: storeData.id,
        storeName: storeData.name,
        priceModelData,
        priceModelError,
        extractedPriceModel: priceModelData?.price_model,
      });

      const processedStoreData = {
        ...storeData,
        price_model: priceModelData?.price_model || "retail_only",
      };

      // Determinar catalogType baseado no price_model
      const determinedCatalogType: CatalogType =
        processedStoreData.price_model === "wholesale_only"
          ? "wholesale"
          : "retail";

      console.log("✅ Loja carregada:", {
        id: processedStoreData.id,
        name: processedStoreData.name,
        url_slug: processedStoreData.url_slug,
        is_active: processedStoreData.is_active,
        price_model: processedStoreData.price_model,
        catalogType: determinedCatalogType,
      });

      console.log("🎯 [useCatalog] DECISÃO FINAL:", {
        priceModelValue: processedStoreData.price_model,
        isWholesaleOnly: processedStoreData.price_model === "wholesale_only",
        finalCatalogType: determinedCatalogType,
      });

      setStore(processedStoreData);
      setCatalogType(determinedCatalogType);
      setStoreError(null);
      return processedStoreData;
    } catch (error) {
      console.error("🚨 Erro crítico ao carregar loja:", error);
      setStoreError("Erro crítico ao carregar loja.");
      setStore(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProducts = useCallback(
    async (storeId: string, type: CatalogType) => {
      console.log("📦 CATÁLOGO - Carregando produtos (OTIMIZADO):", { storeId, type });
      const startTime = performance.now();
      setLoading(true);

      try {
        // 🚀 OTIMIZAÇÃO: Usar Promise.all para buscar dados em paralelo
        const [productsResult, imagesResult] = await Promise.all([
          // Buscar produtos
          supabase
            .from("products")
            .select("*")
            .eq("store_id", storeId)
            .eq("is_active", true)
            .order("name", { ascending: true }),
          
          // 🚀 NOVA: Buscar todas as imagens dos produtos de uma vez
          supabase
            .from("product_images")
            .select("*")
            .order("is_primary", { ascending: false })
            .order("image_order", { ascending: true })
        ]);

        const { data: productsData, error: productsError } = productsResult;
        const { data: allImages, error: imagesError } = imagesResult;

        if (productsError) {
          console.error("❌ Erro ao buscar produtos:", productsError);
          return false;
        }

        if (imagesError) {
          console.warn("⚠️ Erro ao buscar imagens:", imagesError);
        }

        // Buscar variações específicas dos produtos da loja
        const productIds = productsData?.map((p) => p.id) || [];
        let variationsData: any[] = [];

        if (productIds.length > 0) {
          console.log(`🔍 Buscando variações para ${productIds.length} produtos...`);
          
          const { data: allVariations, error: variationsError } = await supabase
            .from("product_variations")
            .select("*")
            .in("product_id", productIds)
            .eq("is_active", true)
            .order("display_order", { ascending: true });

          if (variationsError) {
            console.error("❌ Erro ao buscar variações:", variationsError);
          } else {
            variationsData = allVariations || [];
            console.log(`✅ Variações carregadas: ${variationsData.length}`);
          }
        }

        const imagesData = allImages?.filter(img => productIds.includes(img.product_id)) || [];

        console.log(
          `🔍 CATÁLOGO - Dados carregados: ${productsData?.length} produtos, ${variationsData.length} variações, ${imagesData.length} imagens`
        );

        // 🚀 OTIMIZAÇÃO: Mapear produtos com variações E imagens
        const productsWithVariations: Product[] = (productsData || []).map(
          (product) => {
            const productVariations = variationsData
              .filter((v) => v.product_id === product.id)
              .map((v) => ({
                id: v.id,
                product_id: v.product_id,
                color: v.color,
                size: v.size,
                sku: v.sku,
                stock: v.stock,
                price_adjustment: v.price_adjustment,
                is_active: v.is_active,
                image_url: v.image_url,
                created_at: v.created_at,
                updated_at: v.updated_at,
                variation_type: v.variation_type,
                name: (v as any).name,
                is_grade: (v as any).is_grade,
                grade_name: (v as any).grade_name,
                grade_color: (v as any).grade_color,
                grade_quantity: (v as any).grade_quantity,
                grade_sizes: (v as any).grade_sizes,
                grade_pairs: (v as any).grade_pairs,
                display_order: v.display_order,
              })) as ProductVariation[];

            // 🐛 DEBUG: Log específico para o produto problemático
            if (product.id === '9d556c2d-2c20-44c2-ae00-512475aca6c4') {
              console.log('🔍 DEBUG - Produto Tênis Adidas NMB:');
              console.log(`   Variações encontradas: ${productVariations.length}`);
              console.log(`   Variações no banco para este produto:`, variationsData.filter(v => v.product_id === product.id));
              console.log(`   Cores:`, [...new Set(productVariations.map(v => v.color).filter(Boolean))]);
              console.log(`   Tamanhos:`, [...new Set(productVariations.map(v => v.size).filter(Boolean))]);
            }

            // 🚀 NOVA: Adicionar imagens ao produto
            const productImages = imagesData.filter(img => img.product_id === product.id);

            return {
              ...product,
              variations: productVariations,
              images: productImages, // 🚀 Adicionar imagens pré-carregadas
            };
          }
        );

        console.log("✅ CATÁLOGO - Produtos carregados:", {
          total: productsWithVariations.length,
          withVariations: productsWithVariations.filter(
            (p) => p.variations?.length > 0
          ).length,
          withoutVariations: productsWithVariations.filter(
            (p) => !p.variations?.length
          ).length,
        });

        // Debug: verificar variações carregadas
        console.log("🔍 CATÁLOGO - Debug variações carregadas:", {
          totalVariations: variationsData.length,
          variationsWithGrades: variationsData.filter(
            (v) => (v as any).is_grade === true
          ).length,
          sampleVariations: variationsData.slice(0, 3).map((v) => ({
            id: v.id,
            product_id: v.product_id,
            color: v.color,
            is_grade: (v as any).is_grade,
            variation_type: v.variation_type,
            grade_name: (v as any).grade_name,
            grade_color: (v as any).grade_color,
            grade_sizes: (v as any).grade_sizes,
            grade_pairs: (v as any).grade_pairs,
          })),
        });

        // Debug específico para grades
        const productsWithGrades = productsWithVariations.filter((p) =>
          p.variations?.some((v) => v.is_grade === true)
        );

        // Debug detalhado para o produto específico
        const adidasProduct = productsWithVariations.find(
          (p) => p.name === "Tênis Adidas Ultraboost"
        );
        if (adidasProduct) {
          console.log("🔍 CATÁLOGO - Debug Adidas Ultraboost:", {
            productName: adidasProduct.name,
            variationsCount: adidasProduct.variations?.length,
            variations: adidasProduct.variations?.map((v) => ({
              id: v.id,
              color: v.color,
              size: v.size,
              is_grade: v.is_grade,
              variation_type: v.variation_type,
              grade_name: v.grade_name,
              grade_color: v.grade_color,
              grade_sizes: v.grade_sizes,
              grade_pairs: v.grade_pairs,
              // Verificar se todos os campos estão presentes
              allFields: Object.keys(v),
            })),
          });
        }

        console.log("🔍 CATÁLOGO - Debug grades:", {
          totalProducts: productsWithVariations.length,
          productsWithVariations: productsWithVariations.filter(
            (p) => p.variations?.length > 0
          ).length,
          productsWithGrades: productsWithGrades.length,
          gradeProducts: productsWithGrades.map((p) => ({
            name: p.name,
            variations: p.variations
              ?.filter((v) => v.is_grade)
              .map((v) => ({
                id: v.id,
                name: v.name,
                is_grade: v.is_grade,
                grade_name: v.grade_name,
                grade_color: v.grade_color,
                grade_sizes: v.grade_sizes,
                grade_pairs: v.grade_pairs,
              })),
          })),
        });

        if (type === "wholesale") {
          const wholesaleProducts = productsWithVariations.filter(
            (product) =>
              product.wholesale_price !== null && product.wholesale_price > 0
          );
          console.log(
            "🏪 CATÁLOGO - Produtos atacado filtrados:",
            wholesaleProducts.length
          );
          setProducts(wholesaleProducts);
          setFilteredProducts(wholesaleProducts);
        } else {
          setProducts(productsWithVariations);
          setFilteredProducts(productsWithVariations);
        }

        const endTime = performance.now();
        const loadTime = (endTime - startTime).toFixed(2);
        console.log(`⚡ CATÁLOGO - Tempo de carregamento: ${loadTime}ms`);

        return true;
      } catch (error) {
        console.error("🚨 Erro ao carregar produtos:", error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const initializeCatalog = useCallback(
    async (slug: string) => {
      console.log("🚀 CATÁLOGO - Inicializando:", { slug });
      const startTime = performance.now();

      // 🚀 OTIMIZAÇÃO: Verificar cache primeiro
      const cached = catalogCache.get(slug);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log("⚡ CATÁLOGO - Usando dados do cache", {
          age: `${((now - cached.timestamp) / 1000).toFixed(1)}s`,
          productsCount: cached.products.length
        });
        
        setStore(cached.store);
        setProducts(cached.products);
        setFilteredProducts(cached.products);
        
        const determinedCatalogType: CatalogType =
          cached.store.price_model === "wholesale_only" ? "wholesale" : "retail";
        setCatalogType(determinedCatalogType);
        
        loadedStoreRef.current = slug;
        loadedCatalogTypeRef.current = determinedCatalogType;
        
        const endTime = performance.now();
        console.log(`⚡ CACHE HIT - Tempo: ${(endTime - startTime).toFixed(2)}ms`);
        return true;
      }

      // Avoid reloading if same store
      if (loadedStoreRef.current === slug && store) {
        console.log("ℹ️ CATÁLOGO - Já carregado no estado, não recarregando");
        return true;
      }

      setLoading(true);
      setStoreError(null);

      const storeData = await loadStore(slug);
      if (!storeData) {
        setLoading(false);
        return false;
      }

      // Determinar catalogType baseado no price_model da loja carregada
      const determinedCatalogType: CatalogType =
        storeData.price_model === "wholesale_only" ? "wholesale" : "retail";

      const productsLoaded = await loadProducts(
        storeData.id,
        determinedCatalogType
      );

      if (productsLoaded) {
        loadedStoreRef.current = slug;
        loadedCatalogTypeRef.current = determinedCatalogType;
        
        // 🚀 OTIMIZAÇÃO: Salvar no cache
        catalogCache.set(slug, {
          store: storeData,
          products: products,
          timestamp: Date.now(),
          expiresIn: CACHE_DURATION
        });
        
        console.log("✅ CATÁLOGO - Inicialização concluída e dados salvos no cache");
      }

      setLoading(false);
      
      const endTime = performance.now();
      console.log(`⚡ CATÁLOGO COMPLETO - Tempo total: ${(endTime - startTime).toFixed(2)}ms`);
      
      return productsLoaded;
    },
    [loadStore, loadProducts, store, products]
  );

  // Only initialize when store slug changes
  useEffect(() => {
    if (storeSlug && loadedStoreRef.current !== storeSlug) {
      console.log("🔄 CATÁLOGO - Mudança detectada, reinicializando:", {
        storeSlug,
      });
      initializeCatalog(storeSlug);
    }
  }, [storeSlug, initializeCatalog]);

  const searchProducts = useCallback(
    (query: string) => {
      const searchTerm = query.toLowerCase();
      const results = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          (product.description &&
            product.description.toLowerCase().includes(searchTerm)) ||
          (product.category &&
            product.category.toLowerCase().includes(searchTerm))
      );
      console.log("🔍 CATÁLOGO - Busca realizada:", {
        query,
        results: results.length,
      });
      setFilteredProducts(results);
    },
    [products]
  );

  const filterProducts = useCallback(
    (
      options: {
        category?: string;
        minPrice?: number;
        maxPrice?: number;
        inStock?: boolean;
        variations?: {
          sizes?: string[];
          colors?: string[];
          materials?: string[];
        };
      } = {}
    ) => {
      console.log("🎯 CATÁLOGO - Aplicando filtros:", options);

      let filtered = [...products];

      // Filtro por categoria
      if (options.category) {
        filtered = filtered.filter(
          (product) => product.category === options.category
        );
      }

      // Filtro por preço
      if (options.minPrice !== undefined || options.maxPrice !== undefined) {
        filtered = filtered.filter((product) => {
          const price = product.retail_price;
          const min = options.minPrice ?? 0;
          const max = options.maxPrice ?? Infinity;
          return price >= min && price <= max;
        });
      }

      // Filtro por estoque
      if (options.inStock) {
        filtered = filtered.filter((product) => {
          // Verificar estoque do produto principal
          if (product.stock > 0) return true;

          // Verificar estoque nas variações
          if (product.variations && product.variations.length > 0) {
            return product.variations.some((v) => v.stock > 0);
          }

          return false;
        });
      }

      // Filtros por variações
      if (options.variations) {
        const { sizes, colors, materials } = options.variations;

        if (sizes?.length || colors?.length || materials?.length) {
          filtered = filtered.filter((product) => {
            if (!product.variations || !Array.isArray(product.variations)) {
              return false;
            }

            return product.variations.some((variation: any) => {
              let matches = true;

              if (sizes?.length) {
                matches = matches && sizes.includes(variation.size);
              }

              if (colors?.length) {
                matches = matches && colors.includes(variation.color);
              }

              if (materials?.length) {
                matches = matches && materials.includes(variation.material);
              }

              return matches;
            });
          });
        }
      }

      console.log("✅ CATÁLOGO - Filtros aplicados:", {
        original: products.length,
        filtered: filtered.length,
      });

      setFilteredProducts(filtered);
    },
    [products]
  );

  return {
    store,
    storeError,
    products,
    filteredProducts,
    loading,
    catalogType, // Agora retorna o catalogType determinado automaticamente
    initializeCatalog,
    searchProducts,
    filterProducts,
  };
};
