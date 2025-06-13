
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_method: 'pix' | 'money' | 'card' | 'bank_slip';
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  reference_id: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentData {
  order_id: string;
  amount: number;
  payment_method: 'pix' | 'money' | 'card' | 'bank_slip';
  reference_id?: string;
  due_date?: string;
  notes?: string;
}

export const usePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  const fetchPaymentsByOrder = async (orderId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setPayments(data || []);
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar pagamentos';
      setError(errorMessage);
      return { data: [], error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async (paymentData: CreatePaymentData) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: createError } = await supabase
        .from('payments')
        .insert([paymentData])
        .select()
        .single();

      if (createError) throw createError;
      
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar pagamento';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (paymentId: string, referenceId?: string, notes?: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'confirmed',
          confirmed_by: profile?.id,
          confirmed_at: new Date().toISOString(),
          reference_id: referenceId || null,
          notes: notes || null
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (updateError) throw updateError;
      
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao confirmar pagamento';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatus = (orderId: string): 'pending' | 'partial' | 'paid' | 'overpaid' => {
    const orderPayments = payments.filter(p => p.order_id === orderId && p.status === 'confirmed');
    
    if (orderPayments.length === 0) return 'pending';
    
    const totalPaid = orderPayments.reduce((sum, p) => sum + p.amount, 0);
    const orderTotal = orderPayments[0]?.amount || 0; // Isso precisa vir do pedido
    
    if (totalPaid === orderTotal) return 'paid';
    if (totalPaid > orderTotal) return 'overpaid';
    return 'partial';
  };

  return {
    payments,
    loading,
    error,
    fetchPaymentsByOrder,
    createPayment,
    confirmPayment,
    getPaymentStatus
  };
};
