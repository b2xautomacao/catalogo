import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeData {
  orders: number;
  revenue: number;
  views: number;
  lastUpdate: Date;
}

export const useRealtimeAnalytics = (storeId?: string) => {
  const [realtimeData, setRealtimeData] = useState<RealtimeData>({
    orders: 0,
    revenue: 0,
    views: 0,
    lastUpdate: new Date(),
  });
  const [isConnected, setIsConnected] = useState(false);

  const updateMetrics = useCallback((newData: Partial<RealtimeData>) => {
    setRealtimeData((prev) => ({
      ...prev,
      ...newData,
      lastUpdate: new Date(),
    }));
  }, []);

  useEffect(() => {
    const timestamp = Date.now();
    const channelName = storeId ? `analytics-${storeId}-${timestamp}` : `analytics-global-${timestamp}`;
    
    console.log("📡 ANALYTICS - Iniciando assinatura em tempo real:", channelName);

    const realtimeChannel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          ...(storeId && { filter: `store_id=eq.${storeId}` }),
        },
        (payload) => {
          console.log("Novo pedido em tempo real:", payload);
          setRealtimeData((prev) => ({
            ...prev,
            orders: prev.orders + 1,
            revenue: prev.revenue + (payload.new.total_amount || 0),
            lastUpdate: new Date(),
          }));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "analytics_views",
          ...(storeId && { filter: `store_id=eq.${storeId}` }),
        },
        (payload) => {
          console.log("Nova visualização em tempo real:", payload);
          setRealtimeData((prev) => ({
            ...prev,
            views: prev.views + (payload.new.view_count || 1),
            lastUpdate: new Date(),
          }));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "analytics_metrics",
          ...(storeId && { filter: `store_id=eq.${storeId}` }),
        },
        (payload) => {
          if (payload.new.metric_type === "purchase") {
            setRealtimeData((prev) => ({
              ...prev,
              revenue: prev.revenue + (payload.new.metric_value || 0),
              lastUpdate: new Date(),
            }));
          }
        }
      )
      .subscribe((status) => {
        console.log("Status da conexão WebSocket (Analytics):", status);
        setIsConnected(status === "SUBSCRIBED");
      });


    return () => {
      console.log("📡 ANALYTICS - Removendo assinatura:", channelName);
      supabase.removeChannel(realtimeChannel);
    };
  }, [storeId]); // Apenas storeId importa para recriar o canal

  const refreshData = useCallback(async () => {
    try {
      let ordersQuery = supabase
        .from("orders")
        .select("total_amount")
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        );

      if (storeId) {
        ordersQuery = ordersQuery.eq("store_id", storeId);
      }

      const { data: ordersData } = await ordersQuery;

      const orders = ordersData?.length || 0;
      const revenue =
        ordersData?.reduce(
          (sum, order) => sum + (order.total_amount || 0),
          0
        ) || 0;
      const views = 0; 

      updateMetrics({ orders, revenue, views });
    } catch (error) {
      console.error("Erro ao atualizar dados em tempo real:", error);
    }
  }, [storeId, updateMetrics]);

  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  return {
    realtimeData,
    isConnected,
    refreshData,
  };
};
