import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type PriceModelType =
  | "retail_only"
  | "simple_wholesale"
  | "gradual_wholesale"
  | "wholesale_only";

export interface StorePriceModel {
  id: string;
  store_id: string;
  price_model: PriceModelType;
  simple_wholesale_enabled: boolean;
  simple_wholesale_name: string;
  simple_wholesale_min_qty: number;
  gradual_wholesale_enabled: boolean;
  gradual_tiers_count: number;
  tier_1_name: string;
  tier_2_name: string;
  tier_3_name: string;
  tier_4_name: string;
  tier_1_enabled: boolean;
  tier_2_enabled: boolean;
  tier_3_enabled: boolean;
  tier_4_enabled: boolean;
  show_price_tiers: boolean;
  show_savings_indicators: boolean;
  show_next_tier_hint: boolean;
  minimum_purchase_enabled: boolean;
  minimum_purchase_amount: number;
  minimum_purchase_message: string;
  created_at: string;
  updated_at: string;
}

export const useStorePriceModelWithWarning = (storeId: string | undefined) => {
  const [priceModel, setPriceModel] = useState<StorePriceModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoSettingUp, setIsAutoSettingUp] = useState(false);
  const [showAutoSetupNotification, setShowAutoSetupNotification] =
    useState(false);
  const [autoSetupSuccess, setAutoSetupSuccess] = useState(false);
  const { toast } = useToast();

  // Log para verificar quando o hook é chamado
  console.log(
    "🔍 useStorePriceModelWithWarning: Hook chamado com storeId:",
    storeId
  );

  const fetchPriceModel = async () => {
    if (!storeId) {
      console.log("🔍 useStorePriceModelWithWarning: storeId não fornecido");
      setPriceModel(null);
      setShowAutoSetupNotification(false);
      setIsAutoSettingUp(false);
      return;
    }

    console.log(
      "🔍 useStorePriceModelWithWarning: Iniciando busca para storeId:",
      storeId
    );

    setLoading(true);
    setError(null);
    setShowAutoSetupNotification(false);
    setIsAutoSettingUp(false);

    try {
      // Usar maybeSingle() para não falhar se não encontrar
      const { data, error } = await supabase
        .from("store_price_models")
        .select("*")
        .eq("store_id", storeId)
        .maybeSingle();

      console.log("🔍 useStorePriceModelWithWarning: Resultado da consulta:", {
        storeId,
        data,
        error,
        errorCode: error?.code,
      });

      if (error) {
        // Se for erro 406, significa que há problema de permissão ou tabela
        if (error.code === "406" || error.message?.includes("406")) {
          console.error(
            "❌ useStorePriceModelWithWarning: Erro 406 - Problema de permissão"
          );
          setError(
            "Erro de permissão ao acessar configurações de preço. Verifique as configurações do banco de dados."
          );
          return;
        } else {
          // Outros erros
          console.error(
            "❌ useStorePriceModelWithWarning: Erro na consulta:",
            error
          );
          setError(error.message);
          return;
        }
      }

      if (data) {
        // Modelo encontrado
        console.log(
          "✅ useStorePriceModelWithWarning: Modelo encontrado:",
          data
        );
        setPriceModel({
          ...data,
          price_model: data.price_model as PriceModelType,
          minimum_purchase_enabled: data.minimum_purchase_enabled || false,
          minimum_purchase_amount: data.minimum_purchase_amount || 0,
          minimum_purchase_message: data.minimum_purchase_message || "",
        });
      } else {
        // Nenhum modelo encontrado - criar automaticamente
        console.warn(
          "⚠️ useStorePriceModelWithWarning: Nenhum modelo encontrado para storeId:",
          storeId
        );
        console.log(
          "🔧 useStorePriceModelWithWarning: Criando modelo padrão automaticamente..."
        );

        // Mostrar notificação de configuração automática
        setIsAutoSettingUp(true);
        setShowAutoSetupNotification(true);

        // Criar modelo padrão automaticamente
        await createDefaultPriceModel();
      }
    } catch (error: any) {
      console.error(
        "❌ useStorePriceModelWithWarning: Erro inesperado:",
        error
      );
      setError(error.message);
      setIsAutoSettingUp(false);
      setShowAutoSetupNotification(false);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPriceModel = async () => {
    if (!storeId) return;

    try {
      const defaultModel = {
        store_id: storeId,
        price_model: "retail_only" as PriceModelType,
        simple_wholesale_enabled: false,
        simple_wholesale_name: "Atacado",
        simple_wholesale_min_qty: 10,
        gradual_wholesale_enabled: false,
        gradual_tiers_count: 2,
        tier_1_name: "Varejo",
        tier_2_name: "Atacarejo",
        tier_3_name: "Atacado Pequeno",
        tier_4_name: "Atacado Grande",
        tier_1_enabled: true,
        tier_2_enabled: false,
        tier_3_enabled: false,
        tier_4_enabled: false,
        show_price_tiers: true,
        show_savings_indicators: true,
        show_next_tier_hint: true,
        minimum_purchase_enabled: false,
        minimum_purchase_amount: 0.0,
        minimum_purchase_message:
          "Pedido mínimo de R$ {amount} para finalizar a compra",
      };

      const { data, error } = await supabase
        .from("store_price_models")
        .insert(defaultModel)
        .select()
        .single();

      if (error) throw error;

      setPriceModel({
        ...data,
        price_model: data.price_model as PriceModelType,
        minimum_purchase_enabled: data.minimum_purchase_enabled || false,
        minimum_purchase_amount: data.minimum_purchase_amount || 0,
        minimum_purchase_message: data.minimum_purchase_message || "",
      });

      // Mostrar sucesso
      setIsAutoSettingUp(false);
      setAutoSetupSuccess(true);
      setError(null);

      // Toast de sucesso
      toast({
        title: "Modelo de preços configurado!",
        description:
          "Configuramos automaticamente o modelo padrão para sua loja.",
        duration: 4000,
      });

      // Esconder notificação após 5 segundos
      setTimeout(() => {
        setShowAutoSetupNotification(false);
        setAutoSetupSuccess(false);
      }, 5000);
    } catch (error: any) {
      console.error("Error creating default price model:", error);
      setIsAutoSettingUp(false);
      setShowAutoSetupNotification(false);
      setError(error.message);

      toast({
        title: "Erro ao configurar modelo padrão",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updatePriceModel = async (updates: Partial<StorePriceModel>) => {
    if (!storeId) return;

    try {
      const { data, error } = await supabase
        .from("store_price_models")
        .upsert({
          store_id: storeId,
          ...updates,
        })
        .select()
        .single();

      if (error) throw error;

      setPriceModel({
        ...data,
        price_model: data.price_model as PriceModelType,
        minimum_purchase_enabled: data.minimum_purchase_enabled || false,
        minimum_purchase_amount: data.minimum_purchase_amount || 0,
        minimum_purchase_message: data.minimum_purchase_message || "",
      });

      toast({
        title: "Modelo de preço atualizado",
        description: "As configurações foram salvas com sucesso.",
      });
    } catch (error: any) {
      console.error("Error updating price model:", error);
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const dismissNotification = () => {
    setShowAutoSetupNotification(false);
    setAutoSetupSuccess(false);
  };

  const handleSetupClick = () => {
    // Aqui você pode navegar para a página de configuração ou abrir um modal
    console.log(
      "🔧 Navegando para configuração de preços para storeId:",
      storeId
    );
    // Exemplo: router.push(`/dashboard/settings/pricing?storeId=${storeId}`);
    // Ou abrir um modal de configuração
  };

  useEffect(() => {
    fetchPriceModel();
  }, [storeId]);

  return {
    priceModel,
    loading,
    error,
    isAutoSettingUp,
    showAutoSetupNotification,
    autoSetupSuccess,
    fetchPriceModel,
    updatePriceModel,
    createDefaultPriceModel,
    dismissNotification,
    handleSetupClick,
  };
};
