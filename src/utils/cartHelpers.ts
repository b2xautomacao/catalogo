import { Product } from "@/hooks/useProducts";
import { CatalogType } from "@/hooks/useCatalog";
import { CartItem } from "@/hooks/useCart";
import { ProductVariation } from "@/types/variation";
import { calculateHalfGradeInfo } from "@/types/flexible-grade";

export const createCartItem = (
  product: Product,
  catalogType: CatalogType,
  quantity: number = 1,
  variation?: ProductVariation,
  flexibleGradeMode?: 'full' | 'half' | 'custom',
  customSelection?: {
    items: Array<{
      color: string;
      size: string;
      quantity: number;
    }>;
    totalPairs: number;
  }
): CartItem => {
  console.log("🛒 CART HELPER - Criando item do carrinho:", {
    productId: product.id,
    productName: product.name,
    catalogType,
    quantity,
    variation: variation
      ? {
        id: variation.id,
        color: variation.color,
        size: variation.size,
        stock: variation.stock,
        price_adjustment: variation.price_adjustment,
      }
      : null,
  });

  // ⭐ FALLBACK: Se retail_price é 0/null, usar wholesale_price
  // Isso evita preços zerados em lojas atacado-only
  const retailPrice = product.retail_price || 0;
  const wholesalePrice = product.wholesale_price || 0;

  // Se retail_price é 0 mas wholesale_price existe, usar wholesale
  const effectiveRetailPrice = retailPrice > 0 ? retailPrice : wholesalePrice;

  // Para wholesale_only, sempre usar wholesale_price se disponível
  // Para outros casos, usar retail_price (com fallback para wholesale)
  const basePrice =
    catalogType === "wholesale"
      ? wholesalePrice || effectiveRetailPrice || 0
      : effectiveRetailPrice;

  // Calcular preço final (taxa base) considerando ajuste da variação
  const basePriceWithAdjustment = variation
    ? basePrice + (variation.price_adjustment || 0)
    : basePrice;
    
  let finalPrice = basePriceWithAdjustment;

  // ────────────────────────────────────────────────────────────────
  // 🔴 PREÇO DE GRADE: Usa o campo grade_price como fonte primária.
  // grade_price = preço FIXO da grade inteira (salvo no banco via Wizard).
  // Esse valor é sempre o preço de 1 grade completa, independente de pares.
  // ────────────────────────────────────────────────────────────────
  if (variation && variation.is_grade) {
    try {
      const totalPairs = Array.isArray(variation.grade_pairs)
        ? variation.grade_pairs.reduce((sum: number, pairs: number) => sum + pairs, 0)
        : 0;

      // 1️⃣ Fonte primária: grade_price (campo dedicado, preço fixo da grade inteira)
      // 2️⃣ Fallback para catálogo atacado: wholesale_price do produto (caso grade_price não exista)
      // 3️⃣ Fallback geral: basePriceWithAdjustment (legado)
      const gradeBasePrice = (variation.grade_price && variation.grade_price > 0)
        ? variation.grade_price
        : (catalogType === "wholesale" && wholesalePrice > 0)
          ? wholesalePrice
          : basePriceWithAdjustment;

      if (flexibleGradeMode === 'half' && variation.flexible_grade_config?.allow_half_grade) {
        const halfGradeInfo = calculateHalfGradeInfo(
          variation.grade_sizes!,
          variation.grade_pairs!,
          variation.flexible_grade_config
        );
        const halfGradeDiscount = (variation.flexible_grade_config.half_grade_discount_percentage || 0) / 100;

        if (catalogType === "wholesale") {
          // Atacado: preço da meia grade = fração proporcional do preço da grade inteira
          const fraction = totalPairs > 0 ? (halfGradeInfo.totalPairs / totalPairs) : 0.5;
          finalPrice = gradeBasePrice * fraction * (1 - halfGradeDiscount);
        } else {
          // Varejo: preço por par * número de pares da meia grade
          const pricePerPair = totalPairs > 0 ? (gradeBasePrice / totalPairs) : gradeBasePrice;
          finalPrice = pricePerPair * halfGradeInfo.totalPairs * (1 - halfGradeDiscount);
        }

        console.log("📦 CART HELPER - Cálculo MEIA GRADE:", {
          productName: product.name, catalogType, gradeBasePrice,
          totalPairsFull: totalPairs, totalPairsHalf: halfGradeInfo.totalPairs,
          discount: variation.flexible_grade_config.half_grade_discount_percentage,
          finalPrice: `R$ ${finalPrice.toFixed(2)}`,
        });

      } else if (
        flexibleGradeMode === 'custom' &&
        variation.flexible_grade_config?.allow_custom_mix &&
        customSelection
      ) {
        const customMixAdjustment = variation.flexible_grade_config.custom_mix_price_adjustment || 0;

        if (catalogType === "wholesale") {
          // Atacado: grade customizada = fração proporcional
          const fraction = totalPairs > 0 ? (customSelection.totalPairs / totalPairs) : 1;
          finalPrice = (gradeBasePrice * fraction) + customMixAdjustment;
        } else {
          // Varejo: preço por par * quantidade customizada
          const pricePerPair = totalPairs > 0 ? (gradeBasePrice / totalPairs) : gradeBasePrice;
          finalPrice = (pricePerPair * customSelection.totalPairs) + customMixAdjustment;
        }

        console.log("📦 CART HELPER - Cálculo GRADE CUSTOMIZADA:", {
          productName: product.name, catalogType, gradeBasePrice,
          totalPairs: customSelection.totalPairs, customMixAdjustment,
          finalPrice: `R$ ${finalPrice.toFixed(2)}`,
        });

      } else {
        // Grade completa (padrão)
        if (catalogType === "wholesale") {
          // ATACADO: o preço é da grade INTEIRA — nunca multiplica pelos pares
          finalPrice = gradeBasePrice;
        } else {
          // VAREJO: multiplica o preço unitário pelos pares totais
          finalPrice = totalPairs > 0 ? gradeBasePrice * totalPairs : gradeBasePrice;
        }

        console.log("📦 CART HELPER - Cálculo GRADE COMPLETA:", {
          productName: product.name, catalogType, gradeBasePrice, totalPairs,
          finalPrice: `R$ ${finalPrice.toFixed(2)}`,
          fonte: variation.grade_price ? "grade_price" : catalogType === "wholesale" ? "wholesale_price" : "basePriceWithAdjustment",
        });
      }
    } catch (error) {
      console.error("❌ Erro ao calcular preço da grade:", error);
      finalPrice = catalogType === "wholesale" ? basePriceWithAdjustment : basePriceWithAdjustment;
    }
  }

  // 🔴 CORREÇÃO: Calcular quantidade mínima respeitando modalidade
  // Se catalogType é "retail", quantidade mínima é sempre 1 (permite compra unitária)
  // Se catalogType é "wholesale", aplicar quantidade mínima de atacado
  let minQuantity = 1; // Padrão: permite compra unitária

  if (catalogType === "wholesale" && product.min_wholesale_qty) {
    minQuantity = product.min_wholesale_qty;
  }

  // Para produtos com grade, quantidade sempre é 1 (1 grade completa)
  let finalQuantity = Math.max(minQuantity, Math.floor(quantity));

  if (variation && variation.is_grade) {
    finalQuantity = 1; // Sempre 1 grade completa
    console.log("📦 CART HELPER - Produto com grade: quantidade fixada em 1");
  }

  // 🔴 CORREÇÃO: Se catalogType é "retail", garantir que quantidade pode ser 1
  if (catalogType === "retail") {
    finalQuantity = Math.max(1, Math.floor(quantity)); // Mínimo 1, mas pode ser qualquer quantidade
    console.log("🛒 CART HELPER - MODO VAREJO: Permitindo compra unitária (qtd:", finalQuantity, ")");
  }

  console.log("💰 CART HELPER - Cálculo de preço:", {
    retailPrice: product.retail_price,
    wholesalePrice: product.wholesale_price,
    effectiveRetailPrice,
    basePrice,
    variationAdjustment: variation?.price_adjustment || 0,
    finalPrice,
    catalogType,
    quantidadeOriginal: quantity,
    quantidadeMinima: minQuantity,
    quantidadeFinal: finalQuantity,
    isGrade: variation?.is_grade || false,
    gradeName: variation?.grade_name || null,
    usouFallback: effectiveRetailPrice === wholesalePrice && retailPrice === 0,
  });

  // Criar ID único considerando variação
  const itemId = variation
    ? `${product.id}-${catalogType}-${variation.id ||
    `${variation.color || "nocolor"}-${variation.size || "nosize"}`
    }`
    : `${product.id}-${catalogType}`;

  const cartItem: CartItem = {
    id: itemId,
    product: {
      id: product.id,
      name: product.name,
      description: (product as any).description || undefined, // Descrição para o resumo de pedido
      retail_price: product.retail_price,
      wholesale_price: product.wholesale_price,
      min_wholesale_qty: product.min_wholesale_qty,
      // Priorizar imagem da variação (cor selecionada) sobre imagem do produto
      image_url: variation?.image_url || product.image_url,
      store_id: product.store_id,
      stock: product.stock || 0,
      allow_negative_stock: product.allow_negative_stock || false,
    },
    quantity: finalQuantity,
    price: finalPrice,
    originalPrice:
      catalogType === "wholesale"
        ? product.wholesale_price || product.retail_price || 0
        : product.retail_price,
    variation: variation
      ? {
        id: variation.id,
        product_id: variation.product_id,
        color: variation.color,
        size: variation.size,
        sku: variation.sku,
        stock: variation.stock,
        price_adjustment: variation.price_adjustment || 0,
        is_active: variation.is_active,
        image_url: variation.image_url,
        hex_color: variation.hex_color, // Cor personalizada do lojista
        created_at: variation.created_at,
        updated_at: variation.updated_at,
        // Incluir campos da grade
        is_grade: variation.is_grade,
        grade_name: variation.grade_name,
        grade_color: variation.grade_color,
        grade_quantity: variation.grade_quantity,
        grade_sizes: variation.grade_sizes,
        grade_pairs: variation.grade_pairs,
        grade_price: variation.grade_price, // preço fixo da grade inteira
        variation_type: variation.variation_type,
      }
      : undefined,
    catalogType,
    // Adicionar informações de grade se for uma variação de grade
    gradeInfo:
      variation &&
        variation.is_grade &&
        variation.grade_sizes &&
        variation.grade_pairs
        ? {
          name: variation.grade_name || "Grade",
          sizes: Array.isArray(variation.grade_sizes)
            ? variation.grade_sizes
            : [],
          pairs: Array.isArray(variation.grade_pairs)
            ? variation.grade_pairs
            : [],
        }
        : undefined,
    // 🔴 NOVO: Adicionar modo de grade flexível e seleção customizada
    flexibleGradeMode: flexibleGradeMode || 'full',
    customGradeSelection: customSelection,
  };

  console.log("✅ CART HELPER - Item criado:", {
    id: cartItem.id,
    productName: cartItem.product.name,
    quantity: cartItem.quantity,
    price: cartItem.price,
    finalPrice: finalPrice,
    basePrice: basePrice,
    hasVariation: !!cartItem.variation,
    isGrade: !!cartItem.gradeInfo,
    variationDetails: cartItem.variation
      ? {
        color: cartItem.variation.color,
        size: cartItem.variation.size,
        priceAdjustment: cartItem.variation.price_adjustment,
        isGrade: cartItem.variation.is_grade,
        gradePairs: cartItem.variation.grade_pairs,
      }
      : null,
    gradeInfo: cartItem.gradeInfo
      ? {
        name: cartItem.gradeInfo.name,
        totalPairs: cartItem.gradeInfo.pairs.reduce(
          (sum, pairs) => sum + pairs,
          0
        ),
        sizes: cartItem.gradeInfo.sizes.length,
      }
      : null,
    // Debug das condições de grade
    gradeConditions: {
      hasVariation: !!variation,
      isGrade: variation?.is_grade,
      hasGradeSizes: !!variation?.grade_sizes,
      hasGradePairs: !!variation?.grade_pairs,
      gradeSizes: variation?.grade_sizes,
      gradePairs: variation?.grade_pairs,
    },
  });

  return cartItem;
};
