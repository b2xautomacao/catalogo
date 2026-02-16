// Tipos para o sistema de modelos de preço configuráveis

export type PriceModelType =
  | "retail_only"
  | "simple_wholesale"
  | "gradual_wholesale"
  | "wholesale_only";

export type TierType = "retail" | "simple_wholesale" | "gradual_wholesale";

export interface StorePriceModel {
  id: string;
  store_id: string;

  // Modelo escolhido pela loja
  price_model: PriceModelType;

  // Configurações para atacado simples
  simple_wholesale_enabled: boolean;
  simple_wholesale_name: string;
  simple_wholesale_min_qty: number;
  /** Quando true, atacado é aplicado a todos os itens da loja se o total de unidades no carrinho atingir simple_wholesale_cart_min_qty */
  simple_wholesale_by_cart_total?: boolean;
  /** Quantidade mínima total no carrinho (soma de todos os itens da loja) para ativar atacado em todos */
  simple_wholesale_cart_min_qty?: number;

  // Configurações para atacado gradativo
  gradual_wholesale_enabled: boolean;
  gradual_tiers_count: number; // 2, 3 ou 4

  // Nomes dos níveis (configuráveis)
  tier_1_name: string;
  tier_2_name: string;
  tier_3_name: string;
  tier_4_name: string;

  // Ativar/desativar níveis específicos
  tier_1_enabled: boolean;
  tier_2_enabled: boolean;
  tier_3_enabled: boolean;
  tier_4_enabled: boolean;

  // Configurações de exibição
  show_price_tiers: boolean;
  show_savings_indicators: boolean;
  show_next_tier_hint: boolean;

  // Configurações de pedido mínimo
  minimum_purchase_enabled: boolean;
  minimum_purchase_amount: number;
  minimum_purchase_message: string;

  created_at: string;
  updated_at: string;
}

export interface ProductPriceTier {
  id: string;
  product_id: string;

  // Identificação do nível
  tier_name: string;
  tier_order: number; // 1, 2, 3, 4
  tier_type: TierType;

  // Configurações de preço
  price: number;
  min_quantity: number;

  // Status
  is_active: boolean;

  created_at: string;
  updated_at: string;
}

// Tipos para configuração de interface
export interface PriceModelConfig {
  model: PriceModelType;
  enabled: boolean;
  displayName: string;
  description: string;
  features: string[];
}

export interface TierConfig {
  order: number;
  name: string;
  type: TierType;
  enabled: boolean;
  defaultMinQty: number;
  description: string;
}

// Tipos para cálculo de preços
export interface PriceCalculation {
  currentTier: ProductPriceTier;
  nextTier?: ProductPriceTier;
  savings: {
    amount: number;
    percentage: number;
  };
  nextTierHint: {
    quantityNeeded: number;
    potentialSavings: number;
  };
}

// Tipos para configuração de interface do usuário
export interface PriceModelSettings {
  // Modelo geral
  selectedModel: PriceModelType;

  // Atacado simples
  simpleWholesale: {
    enabled: boolean;
    name: string;
    minQuantity: number;
  };

  // Atacado gradativo
  gradualWholesale: {
    enabled: boolean;
    tiersCount: number;
    tiers: {
      [key: number]: {
        name: string;
        enabled: boolean;
        defaultMinQty: number;
      };
    };
  };

  // Exibição
  display: {
    showPriceTiers: boolean;
    showSavingsIndicators: boolean;
    showNextTierHint: boolean;
  };
}

// Tipos para produtos com múltiplos níveis
export interface ProductWithTiers {
  id: string;
  name: string;
  description?: string;
  price_tiers: ProductPriceTier[];
  store_price_model: StorePriceModel;
}

// Tipos para checkout com múltiplos níveis
export interface CheckoutItemWithTiers {
  product_id: string;
  quantity: number;
  selected_tier: ProductPriceTier;
  available_tiers: ProductPriceTier[];
  price_calculation: PriceCalculation;
}

// Constantes para configuração
export const PRICE_MODEL_CONFIGS: Record<PriceModelType, PriceModelConfig> = {
  retail_only: {
    model: "retail_only",
    enabled: true,
    displayName: "Apenas Varejo",
    description: "Venda apenas no varejo, sem opções de atacado",
    features: [
      "Preço único para todos os clientes",
      "Simplicidade na gestão",
      "Ideal para lojas pequenas",
    ],
  },
  simple_wholesale: {
    model: "simple_wholesale",
    enabled: true,
    displayName: "Varejo + Atacado",
    description: "Varejo + 1 nível de atacado com quantidade mínima fixa",
    features: [
      "Preço de varejo para compras pequenas",
      "Preço de atacado para compras acima da quantidade mínima",
      "Configuração simples",
    ],
  },
  wholesale_only: {
    model: "wholesale_only",
    enabled: true,
    displayName: "Apenas Atacado",
    description: "Venda apenas no atacado com quantidade mínima obrigatória",
    features: [
      "Preço único de atacado",
      "Quantidade mínima obrigatória",
      "Ideal para atacadistas",
      "Foco em vendas em volume",
    ],
  },
  gradual_wholesale: {
    model: "gradual_wholesale",
    enabled: true,
    displayName: "Atacado Gradativo",
    description: "Múltiplos níveis de preço com descontos progressivos",
    features: [
      "Até 4 níveis de preço",
      "Descontos progressivos por quantidade",
      "Flexibilidade total na configuração",
      "Ideal para atacadistas",
    ],
  },
};

export const DEFAULT_TIER_CONFIGS: TierConfig[] = [
  {
    order: 1,
    name: "Varejo",
    type: "retail",
    enabled: true,
    defaultMinQty: 1,
    description: "Preço para compras unitárias",
  },
  {
    order: 2,
    name: "Atacarejo",
    type: "gradual_wholesale",
    enabled: false,
    defaultMinQty: 5,
    description: "Preço para pequenas quantidades",
  },
  {
    order: 3,
    name: "Atacado Pequeno",
    type: "gradual_wholesale",
    enabled: false,
    defaultMinQty: 10,
    description: "Preço para quantidades médias",
  },
  {
    order: 4,
    name: "Atacado Grande",
    type: "gradual_wholesale",
    enabled: false,
    defaultMinQty: 50,
    description: "Preço para grandes quantidades",
  },
];
