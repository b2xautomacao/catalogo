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
    async (storeId: string) => {
      console.log("🔍 CATÁLOGO - Carregando produtos para loja:", storeId);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*, product_images(*)")
          .eq("store_id", storeId)
          .eq("is_active", true)
          .order("name");

        if (error) throw error;

        if (data && data.length > 0) {
          // OTIMIZAÇÃO: Buscar todas as variações da LOJA de uma vez usando JOIN
          // Isso evita passar centenas de IDs na query e estourar o limite de URL/timeout
          const { data: allVariations, error: variationsError } = await supabase
            .from("product_variations")
            .select("*, products!inner(store_id)")
            .eq("products.store_id", storeId);

          if (variationsError) {
            console.error("❌ Erro ao buscar variações:", variationsError);
          }

          const productsWithVariations = data.map((product) => ({
            ...product,
            variations: (allVariations || []).filter(
              (v) => v.product_id === product.id
            ),
          })) as Product[];

          setProducts(productsWithVariations);
          setFilteredProducts(productsWithVariations);
          return productsWithVariations;
        }

        setProducts([]);
        setFilteredProducts([]);
        return [];
      } catch (error) {
        console.error("❌ CATÁLOGO - Erro ao carregar produtos:", error);
        return [];
      }
    },
    []
  );

  const initializeCatalog = useCallback(
    async (slug: string) => {
      // Se já estamos carregando este slug, evitamos chamadas duplicatas
      if (loadedStoreRef.current === slug && !loading) {
        return true;
      }

      try {
        setLoading(true);
        console.log("🚀 CATÁLOGO - Inicializando para:", slug);
        
        // Verificar cache
        const cached = catalogCache.get(slug);
        const now = Date.now();
        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
          console.log("📦 CATÁLOGO - Usando dados do cache local");
          setStore(cached.store);
          setProducts(cached.products);
          setFilteredProducts(cached.products);
          setCatalogType(cached.store.price_model === "wholesale_only" ? "wholesale" : "retail");
          loadedStoreRef.current = slug;
          setLoading(false);
          return true;
        }

        const storeData = await loadStore(slug);
        if (storeData) {
          const productsData = await loadProducts(storeData.id);

          const determinedType: CatalogType = storeData.price_model === "wholesale_only" ? "wholesale" : "retail";
          setCatalogType(determinedType);

          // Salvar no cache
          catalogCache.set(slug, {
            store: storeData,
            products: productsData,
            timestamp: Date.now(),
            expiresIn: CACHE_DURATION
          });

          loadedStoreRef.current = slug;
          return true;
        }
        return false;
      } catch (error) {
        console.error("❌ CATÁLOGO - Erro na inicialização:", error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadStore, loadProducts] // Removido store e products das dependências para evitar loop infinito
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
