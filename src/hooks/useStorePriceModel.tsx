import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type PriceModelType =
  | "retail_only"
  | "wholesale_only"
  | "simple_wholesale"
  | "gradual_wholesale";

export interface StorePriceModel {
  id: string;
  store_id: string;
  price_model: PriceModelType;
  tier_1_enabled: boolean;
  tier_1_name: string;
  tier_2_enabled: boolean;
  tier_2_name: string;
  tier_3_enabled: boolean;
  tier_3_name: string;
  tier_4_enabled: boolean;
  tier_4_name: string;
  simple_wholesale_enabled: boolean;
  simple_wholesale_name: string;
  simple_wholesale_min_qty: number;
  simple_wholesale_by_cart_total?: boolean;
  simple_wholesale_cart_min_qty?: number;
  gradual_wholesale_enabled: boolean;
  gradual_tiers_count: number;
  show_price_tiers: boolean;
  show_savings_indicators: boolean;
  show_next_tier_hint: boolean;
  minimum_purchase_enabled: boolean;
  minimum_purchase_amount: number;
  minimum_purchase_message: string;
  created_at: string;
  updated_at: string;
}

export const useStorePriceModel = (storeId: string | undefined) => {
  const [priceModel, setPriceModel] = useState<StorePriceModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Log para verificar quando o hook é chamado
  console.log("🔍 useStorePriceModel: Hook chamado com storeId:", storeId);

  const fetchPriceModel = async () => {
    if (!storeId) {
      console.log("🔍 useStorePriceModel: storeId não fornecido");
      setPriceModel(null);
      return;
    }

    console.log(
      "🔍 useStorePriceModel: Iniciando busca para storeId:",
      storeId
    );

    setLoading(true);
    setError(null);

    try {
      // Primeiro, vamos verificar se existem registros na tabela
      const { data: allData, error: allError } = await supabase
        .from("store_price_models")
        .select("*");

      console.log(
        "🔍 useStorePriceModel: Todos os registros na tabela:",
        allData
      );
      console.log("🔍 useStorePriceModel: Erro na consulta geral:", allError);

      const { data, error } = await supabase
        .from("store_price_models")
        .select("*")
        .eq("store_id", storeId)
        .single();

      console.log("🔍 useStorePriceModel: Resultado da consulta específica:", {
        storeId,
        data,
        error,
        errorCode: error?.code,
      });

      if (error) {
        if (error.code === "PGRST116") {
          // Not found - criar modelo padrão automaticamente
          console.warn(
            "⚠️ useStorePriceModel: Nenhum modelo encontrado para storeId:",
            storeId
          );
          console.log(
            "🔧 useStorePriceModel: Criando modelo padrão automaticamente..."
          );

          // Mostrar toast de configuração
          toast({
            title: "Configurando modelo de preços...",
            description:
              "Estamos configurando automaticamente o modelo padrão para sua loja.",
            duration: 3000,
          });

          // Criar modelo padrão automaticamente
          await createDefaultPriceModel();
        } else if (error.code === "406" || error.message?.includes("406")) {
          // Erro 406 - tentar criar modelo padrão
          console.warn(
            "⚠️ useStorePriceModel: Erro 406 detectado, criando modelo padrão..."
          );

          toast({
            title: "Configurando modelo de preços...",
            description:
              "Estamos configurando automaticamente o modelo padrão para sua loja.",
            duration: 3000,
          });

          await createDefaultPriceModel();
        } else {
          throw error;
        }
      } else if (data) {
        console.log("✅ useStorePriceModel: Modelo encontrado:", data);
        console.log("🔍 useStorePriceModel: Campos de pedido mínimo:", {
          minimum_purchase_enabled: (data as any).minimum_purchase_enabled,
          minimum_purchase_amount: (data as any).minimum_purchase_amount,
          minimum_purchase_message: (data as any).minimum_purchase_message,
        });
        const row = data as Record<string, unknown>;
        setPriceModel({
          ...data,
          price_model: data.price_model as PriceModelType,
          simple_wholesale_by_cart_total: row.simple_wholesale_by_cart_total === true,
          simple_wholesale_cart_min_qty: typeof row.simple_wholesale_cart_min_qty === "number" ? row.simple_wholesale_cart_min_qty : 10,
          minimum_purchase_enabled:
            (data as any).minimum_purchase_enabled || false,
          minimum_purchase_amount: (data as any).minimum_purchase_amount || 0,
          minimum_purchase_message:
            (data as any).minimum_purchase_message || "",
        });
      } else {
        // Dados vazios - criar modelo padrão automaticamente
        console.warn(
          "⚠️ useStorePriceModel: Dados vazios retornados para storeId:",
          storeId
        );
        console.log(
          "🔧 useStorePriceModel: Criando modelo padrão automaticamente..."
        );

        // Mostrar toast de configuração
        toast({
          title: "Configurando modelo de preços...",
          description:
            "Estamos configurando automaticamente o modelo padrão para sua loja.",
          duration: 3000,
        });

        // Criar modelo padrão automaticamente
        await createDefaultPriceModel();
      }
    } catch (error: any) {
      console.error("❌ useStorePriceModel: Erro na busca:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePriceModel = async (updates: Partial<StorePriceModel>) => {
    if (!storeId) return;

    console.log("🔄 useStorePriceModel: Atualizando modelo com:", updates);

    try {
      // Primeiro, tentar atualizar o registro existente
      const { data: updateData, error: updateError } = await supabase
        .from("store_price_models")
        .update(updates)
        .eq("store_id", storeId)
        .select()
        .single();

      if (updateError) {
        console.log(
          "⚠️ useStorePriceModel: Erro no update, tentando insert:",
          updateError
        );

        // Se não existe, criar um novo registro
        const { data: insertData, error: insertError } = await supabase
          .from("store_price_models")
          .insert({
            store_id: storeId,
            ...updates,
          })
          .select()
          .single();

        if (insertError) {
          console.error("❌ useStorePriceModel: Erro no insert:", insertError);
          throw insertError;
        }

        console.log(
          "✅ useStorePriceModel: Modelo criado com sucesso:",
          insertData
        );
        setPriceModel({
          ...insertData,
          price_model: insertData.price_model as PriceModelType,
          minimum_purchase_enabled:
            (insertData as any).minimum_purchase_enabled || false,
          minimum_purchase_amount:
            (insertData as any).minimum_purchase_amount || 0,
          minimum_purchase_message:
            (insertData as any).minimum_purchase_message || "",
        });
      } else {
        const row = updateData as Record<string, unknown>;
        console.log(
          "✅ useStorePriceModel: Modelo atualizado com sucesso:",
          updateData,
          "simple_wholesale_by_cart_total:",
          row.simple_wholesale_by_cart_total
        );
        setPriceModel({
          ...updateData,
          price_model: updateData.price_model as PriceModelType,
          simple_wholesale_by_cart_total: row.simple_wholesale_by_cart_total === true,
          simple_wholesale_cart_min_qty: typeof row.simple_wholesale_cart_min_qty === "number" ? row.simple_wholesale_cart_min_qty : 10,
          minimum_purchase_enabled:
            (updateData as any).minimum_purchase_enabled || false,
          minimum_purchase_amount:
            (updateData as any).minimum_purchase_amount || 0,
          minimum_purchase_message:
            (updateData as any).minimum_purchase_message || "",
        });
      }

      console.log(
        "🔍 useStorePriceModel: Campos de pedido mínimo após operação:",
        {
          minimum_purchase_enabled: (updateData as any)
            ?.minimum_purchase_enabled,
          minimum_purchase_amount: (updateData as any)?.minimum_purchase_amount,
          minimum_purchase_message: (updateData as any)
            ?.minimum_purchase_message,
        }
      );

      toast({
        title: "Modelo de preço atualizado",
        description: "As configurações foram salvas com sucesso.",
      });
    } catch (error: any) {
      console.error("❌ useStorePriceModel: Erro ao atualizar modelo:", error);
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createDefaultPriceModel = async () => {
    if (!storeId) return;

    try {
      const defaultModel = {
        store_id: storeId,
        price_model: "retail_only" as PriceModelType,
        tier_1_enabled: true,
        tier_1_name: "Varejo",
        tier_2_enabled: false,
        tier_2_name: "Atacarejo",
        tier_3_enabled: false,
        tier_3_name: "Atacado Pequeno",
        tier_4_enabled: false,
        tier_4_name: "Atacado Grande",
        simple_wholesale_enabled: false,
        simple_wholesale_name: "Atacado",
        simple_wholesale_min_qty: 10,
        simple_wholesale_by_cart_total: false,
        simple_wholesale_cart_min_qty: 10,
        gradual_wholesale_enabled: false,
        gradual_tiers_count: 2,
        show_price_tiers: true,
        show_savings_indicators: true,
        show_next_tier_hint: true,
        minimum_purchase_enabled: false,
        minimum_purchase_amount: 0,
        minimum_purchase_message:
          "Pedido mínimo de R$ {amount} para finalizar a compra",
      };

      await updatePriceModel(defaultModel);

      // Mostrar toast de sucesso
      toast({
        title: "Modelo de preços configurado!",
        description:
          "Configuramos automaticamente o modelo padrão para sua loja.",
        duration: 4000,
      });

      console.log("✅ useStorePriceModel: Modelo padrão criado com sucesso");
    } catch (error) {
      console.error(
        "❌ useStorePriceModel: Erro ao criar modelo padrão:",
        error
      );
      toast({
        title: "Erro ao configurar modelo padrão",
        description:
          "Não foi possível criar o modelo de preços automaticamente.",
        variant: "destructive",
      });
    }
  };

  const isModelActive = (modelType: string) => {
    if (!priceModel) return false;

    switch (modelType) {
      case "retail_only":
        return priceModel.price_model === "retail_only";
      case "wholesale_only":
        return priceModel.price_model === "wholesale_only";
      case "simple_wholesale":
        return priceModel.simple_wholesale_enabled;
      case "gradual_wholesale":
        return priceModel.gradual_wholesale_enabled;
      default:
        return false;
    }
  };

  const changePriceModel = async (newModel: PriceModelType) => {
    await updatePriceModel({ price_model: newModel });
  };

  const getSettings = () => {
    return priceModel;
  };

  useEffect(() => {
    console.log(
      "🔍 useStorePriceModel: useEffect disparado com storeId:",
      storeId
    );
    if (storeId) {
      fetchPriceModel();
    } else {
      console.log(
        "🔍 useStorePriceModel: storeId não fornecido, limpando estado"
      );
      setPriceModel(null);
      setError(null);
    }
  }, [storeId]);

  // Log para verificar o valor que está sendo retornado
  console.log("🔍 useStorePriceModel: Retornando valor:", {
    priceModel,
    loading,
    error,
    storeId,
  });

  return {
    priceModel: priceModel,
    loading,
    error,
    updatePriceModel,
    createDefaultPriceModel,
    refetch: fetchPriceModel,
    isModelActive,
    changePriceModel,
    getSettings,
  };
};
