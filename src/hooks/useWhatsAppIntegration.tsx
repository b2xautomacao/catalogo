
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface WhatsAppIntegration {
  id: string;
  store_id: string;
  instance_name: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  connection_status: string;
  last_connected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QRCodeData {
  qr_code: string;
  expires_at: number;
}

export const useWhatsAppIntegration = (storeId?: string) => {
  const { profile } = useAuth();
  const [integration, setIntegration] = useState<WhatsAppIntegration | null>(null);
  const [qrCode, setQrCode] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const currentStoreId = storeId || profile?.store_id;

  const fetchIntegration = useCallback(async () => {
    if (!currentStoreId) return;

    try {
      const { data, error } = await supabase
        .from('whatsapp_integrations')
        .select('*')
        .eq('store_id', currentStoreId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching WhatsApp integration:', error);
        return;
      }

      setIntegration(data);
      console.log('📱 WhatsApp integration loaded:', data?.status || 'not configured');
    } catch (error) {
      console.error('💥 Error in fetchIntegration:', error);
    }
  }, [currentStoreId]);

  const performAction = useCallback(async (action: string) => {
    if (!currentStoreId) {
      toast.error('Store não identificado');
      return { success: false };
    }

    setLoading(true);
    if (action === 'connect') {
      setConnecting(true);
    }

    try {
      console.log(`🔧 Performing WhatsApp action: ${action}`);

      const { data, error } = await supabase.functions.invoke('whatsapp-integration-manager', {
        body: {
          action,
          store_id: currentStoreId
        }
      });

      if (error) {
        console.error('❌ Error calling WhatsApp integration manager:', error);
        throw error;
      }

      console.log('✅ WhatsApp action response:', data);

      if (data.success) {
        // Se temos QR code, configurar expiração
        if (data.qr_code) {
          const expiresAt = Date.now() + 45000; // 45 segundos
          setQrCode({
            qr_code: data.qr_code,
            expires_at: expiresAt
          });

          // Auto-limpar QR code após expiração
          setTimeout(() => {
            setQrCode(null);
            setConnecting(false);
          }, 45000);
        }

        // Atualizar integração local
        await fetchIntegration();

        toast.success(data.message || 'Ação executada com sucesso');
        return { success: true, data };
      } else {
        throw new Error(data.error || 'Falha na ação');
      }

    } catch (error) {
      console.error('💥 Error in performAction:', error);
      toast.error(error.message || 'Erro ao executar ação');
      return { success: false, error };
    } finally {
      setLoading(false);
      if (action === 'connect') {
        // Manter connecting até QR code expirar
      } else {
        setConnecting(false);
      }
    }
  }, [currentStoreId, fetchIntegration]);

  const createIntegration = useCallback(() => performAction('create'), [performAction]);
  const connectWhatsApp = useCallback(() => performAction('connect'), [performAction]);
  const verifyConnection = useCallback(() => performAction('verify'), [performAction]);
  const restartIntegration = useCallback(() => performAction('restart'), [performAction]);
  const disconnectWhatsApp = useCallback(() => performAction('disconnect'), [performAction]);
  const deleteIntegration = useCallback(() => performAction('delete'), [performAction]);

  // Verificar status da conexão periodicamente quando conectando
  useEffect(() => {
    if (!connecting || !integration) return;

    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from('whatsapp_integrations')
        .select('status, connection_status, last_connected_at')
        .eq('store_id', currentStoreId)
        .maybeSingle();

      if (data && data.status === 'connected') {
        setConnecting(false);
        setQrCode(null);
        setIntegration(prev => prev ? { ...prev, ...data } : null);
        toast.success('WhatsApp conectado com sucesso!');
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [connecting, integration, currentStoreId]);

  useEffect(() => {
    fetchIntegration();
  }, [fetchIntegration]);

  return {
    integration,
    qrCode,
    loading,
    connecting,
    createIntegration,
    connectWhatsApp,
    verifyConnection,
    restartIntegration,
    disconnectWhatsApp,
    deleteIntegration,
    refreshIntegration: fetchIntegration
  };
};
