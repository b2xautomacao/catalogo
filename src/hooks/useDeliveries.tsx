
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Delivery {
  id: string;
  orderId: string;
  customer_name: string;
  customer_phone: string | null;
  delivery_status: 'preparing' | 'in_transit' | 'delivered' | 'problem';
  estimated_delivery_date: string | null;
  carrier: string | null;
  delivery_address: any;
  tracking_code: string | null;
  total_amount: number;
  created_at: string;
  shipping_method: string | null;
}

export const useDeliveries = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  const fetchDeliveries = async () => {
    if (!profile?.store_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          customer_phone,
          delivery_status,
          estimated_delivery_date,
          carrier,
          delivery_address,
          tracking_code,
          total_amount,
          created_at,
          shipping_method
        `)
        .eq('store_id', profile.store_id)
        .in('status', ['confirmed', 'preparing', 'shipping', 'delivered'])
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mappedDeliveries: Delivery[] = (data || []).map(order => ({
        id: order.id,
        orderId: order.id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        delivery_status: (order.delivery_status || 'preparing') as Delivery['delivery_status'],
        estimated_delivery_date: order.estimated_delivery_date,
        carrier: order.carrier,
        delivery_address: order.delivery_address,
        tracking_code: order.tracking_code,
        total_amount: order.total_amount,
        created_at: order.created_at,
        shipping_method: order.shipping_method
      }));

      setDeliveries(mappedDeliveries);
    } catch (err) {
      console.error('Erro ao carregar entregas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar entregas');
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (orderId: string, status: Delivery['delivery_status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_status: status })
        .eq('id', orderId);

      if (error) throw error;
      
      await fetchDeliveries();
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  const getDeliveryStats = () => {
    const stats = {
      preparing: deliveries.filter(d => d.delivery_status === 'preparing').length,
      in_transit: deliveries.filter(d => d.delivery_status === 'in_transit').length,
      delivered: deliveries.filter(d => d.delivery_status === 'delivered').length,
      problem: deliveries.filter(d => d.delivery_status === 'problem').length
    };
    return stats;
  };

  useEffect(() => {
    fetchDeliveries();
  }, [profile?.store_id]);

  return {
    deliveries,
    loading,
    error,
    fetchDeliveries,
    updateDeliveryStatus,
    getDeliveryStats
  };
};
