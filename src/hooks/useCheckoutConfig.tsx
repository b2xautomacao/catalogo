import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCatalogSettings } from "@/hooks/useCatalogSettings";
import { useProducts } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";

export interface PaymentMethod {
  id: string;
  name: string;
  type:
    | "pix"
    | "credit_card"
    | "debit_card"
    | "bank_transfer"
    | "cash"
    | "crypto";
  is_active: boolean;
  config?: {
    pix_key?: string;
    pix_key_type?: string;
    gateway_config?: any;
    instructions?: string;
  };
}

export interface ShippingMethod {
  id: string;
  name: string;
  type: "pickup" | "delivery" | "correios" | "custom";
  is_active: boolean;
  price: number;
  estimated_days?: number;
  config?: {
    instructions?: string;
    pickup_address?: string;
    delivery_zones?: string[];
    custom_instructions?: string;
  };
}

export interface OrderBumpConfig {
  id: string;
  store_id: string;
  product_id: string;
  is_active: boolean;
  discount_percentage: number;
  urgency_text: string;
  social_proof_text: string;
  bundle_price?: number;
  is_limited_time: boolean;
  limited_quantity: number;
  trigger_conditions: any;
}

export interface OrderBumpProduct {
  id: string;
  name: string;
  retail_price: number;
  stock: number;
  allow_negative_stock: boolean;
  images?: string[];
  description?: string;
  weight?: number;
  store_id?: string; // Adicionar store_id
  image_url?: string; // Adicionar image_url
  is_order_bump: boolean;
  discount_percentage?: number;
  final_price?: number;
  order_bump_config?: {
    discount_percentage: number;
    urgency_text: string;
    social_proof_text: string;
    bundle_price?: number;
    is_limited_time: boolean;
    limited_quantity: number;
  };
}

export interface CheckoutConfig {
  payment_methods: PaymentMethod[];
  shipping_methods: ShippingMethod[];
  order_bump_products: OrderBumpProduct[];
  order_bump_configs: OrderBumpConfig[];
  store_settings?: {
    urgency_timer_enabled?: boolean;
    social_proof_enabled?: boolean;
    checkout_upsell_enabled?: boolean;
    trust_badges_enabled?: boolean;
  };
}

import { useCurrentStoreId } from "@/contexts/CurrentStoreIdContext";

export const useCheckoutConfig = (explicitStoreId?: string) => {
  const contextStoreId = useCurrentStoreId();
  const storeId = explicitStoreId || contextStoreId;
  const { products } = useProducts();
  const { toast } = useToast();
  const [config, setConfig] = useState<CheckoutConfig>({
    payment_methods: [],
    shipping_methods: [],
    order_bump_products: [],
    order_bump_configs: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCheckoutConfig = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Buscar métodos de pagamento
      const { data: paymentMethods, error: paymentError } = await (
        supabase as any
      )
        .from("store_payment_methods")
        .select("*")
        .eq("store_id", storeId)
        .eq("is_active", true);

      if (paymentError) {
        console.error("Erro ao buscar métodos de pagamento:", paymentError);
      }

      // Buscar métodos de entrega
      const { data: shippingMethods, error: shippingError } = await (
        supabase as any
      )
        .from("store_shipping_methods")
        .select("*")
        .eq("store_id", storeId)
        .eq("is_active", true);

      if (shippingError) {
        console.error("Erro ao buscar métodos de entrega:", shippingError);
      }

      // Buscar configurações de order bump
      const { data: orderBumpConfigs, error: orderBumpError } = await (
        supabase as any
      )
        .from("store_order_bump_configs")
        .select("*")
        .eq("store_id", storeId)
        .eq("is_active", true);

      if (orderBumpError) {
        console.error("Erro ao buscar order bumps:", orderBumpError);
      }

      // Processar produtos de order bump
      let orderBumpProducts: OrderBumpProduct[] = [];
      if (orderBumpConfigs && products) {
        const productIds = orderBumpConfigs.map((bump) => bump.product_id);

        // Buscar produtos dos order bumps
        const { data: orderBumpProductsData, error: productsError } =
          await supabase.from("products").select("*").in("id", productIds);

        if (productsError) {
          console.error(
            "Erro ao buscar produtos dos order bumps:",
            productsError
          );
        }

        if (orderBumpProductsData) {
          orderBumpProducts = orderBumpConfigs
            .map((bump) => {
              const product = orderBumpProductsData.find(
                (p) => p.id === bump.product_id
              );
              if (!product) return null;

              const finalPrice =
                product.retail_price * (1 - bump.discount_percentage / 100);

              return {
                id: product.id,
                name: product.name,
                retail_price: product.retail_price,
                stock: product.stock || 0,
                allow_negative_stock: product.allow_negative_stock || false,
                images: [], // Product images are fetched separately
                description: product.description,
                weight: product.weight,
                store_id: product.store_id, // Incluir store_id
                image_url: product.image_url, // Incluir image_url
                is_order_bump: true,
                discount_percentage: bump.discount_percentage,
                final_price: finalPrice,
                // Incluir configuração completa do order bump
                order_bump_config: {
                  discount_percentage: bump.discount_percentage,
                  urgency_text: bump.urgency_text,
                  social_proof_text: bump.social_proof_text,
                  bundle_price: bump.bundle_price,
                  is_limited_time: bump.is_limited_time,
                  limited_quantity: bump.limited_quantity,
                },
              };
            })
            .filter(Boolean) as OrderBumpProduct[];
        }
      }

      // Atualizar configuração
      setConfig({
        payment_methods: paymentMethods || [],
        shipping_methods: shippingMethods || [],
        order_bump_products: orderBumpProducts,
        order_bump_configs: orderBumpConfigs || [],
      });

      setError(null);
    } catch (err) {
      console.error("Erro ao buscar configuração do checkout:", err);
      setError("Erro ao carregar configuração do checkout");
      toast({
        title: "Erro",
        description: "Erro ao carregar configuração do checkout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [storeId, products, toast]);

  useEffect(() => {
    fetchCheckoutConfig();
  }, [fetchCheckoutConfig]);

  // Função para adicionar método de pagamento padrão "A Combinar"
  const addDefaultPaymentMethod = useCallback(async () => {
    if (!storeId) return;

    try {
      const { error } = await (supabase as any)
        .from("store_payment_methods")
        .insert({
          store_id: storeId,
          name: "A Combinar",
          type: "cash",
          is_active: true,
          config: {
            instructions: "Forma de pagamento será definida via WhatsApp",
          },
        });

      if (error) {
        console.error("Erro ao adicionar método padrão:", error);
      } else {
        fetchCheckoutConfig();
      }
    } catch (err) {
      console.error("Erro ao adicionar método padrão:", err);
    }
  }, [storeId, fetchCheckoutConfig]);

  // Função para adicionar método de entrega padrão "A Combinar"
  const addDefaultShippingMethod = useCallback(async () => {
    if (!storeId) return;

    try {
      const { error } = await (supabase as any)
        .from("store_shipping_methods")
        .insert({
          store_id: storeId,
          name: "A Combinar",
          type: "custom",
          is_active: true,
          price: 0,
          config: {
            custom_instructions:
              "Detalhes da entrega serão definidos via WhatsApp",
          },
        });

      if (error) {
        console.error("Erro ao adicionar método padrão:", error);
      } else {
        fetchCheckoutConfig();
      }
    } catch (err) {
      console.error("Erro ao adicionar método padrão:", err);
    }
  }, [storeId, fetchCheckoutConfig]);

  // Verificar se precisa adicionar métodos padrão
  useEffect(() => {
    if (!loading && storeId && storeId !== 'null' && config.payment_methods.length === 0) {
      // Verificar no banco se já existe um método "A Combinar"
      const checkAndAddDefaultPayment = async () => {
        if (!storeId || storeId === 'null') return;
        
        const { data: existingMethods } = await (supabase as any)
          .from("store_payment_methods")
          .select("id")
          .eq("store_id", storeId)
          .eq("name", "A Combinar")
          .eq("is_active", true);

        if (!existingMethods || existingMethods.length === 0) {
          addDefaultPaymentMethod();
        }
      };

      checkAndAddDefaultPayment();
    }

    if (!loading && storeId && storeId !== 'null' && config.shipping_methods.length === 0) {
      // Verificar no banco se já existe um método "A Combinar"
      const checkAndAddDefaultShipping = async () => {
        if (!storeId || storeId === 'null') return;
        
        const { data: existingMethods } = await (supabase as any)
          .from("store_shipping_methods")
          .select("id")
          .eq("store_id", storeId)
          .eq("name", "A Combinar")
          .eq("is_active", true);

        if (!existingMethods || existingMethods.length === 0) {
          addDefaultShippingMethod();
        }
      };

      checkAndAddDefaultShipping();
    }
  }, [
    loading,
    config.payment_methods.length,
    config.shipping_methods.length,
    storeId,
    addDefaultPaymentMethod,
    addDefaultShippingMethod,
  ]);

  return {
    config,
    loading,
    error,
    refetch: fetchCheckoutConfig,
  };
};
