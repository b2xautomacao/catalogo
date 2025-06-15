
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface N8NWebhook {
  id: string;
  webhook_type: string;
  webhook_url: string;
  is_active: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

export const useN8NWebhooks = () => {
  const [webhooks, setWebhooks] = useState<N8NWebhook[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWebhooks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('n8n_webhooks')
        .select('*')
        .order('webhook_type');

      if (error) throw error;

      setWebhooks(data || []);
      console.log('📡 N8N webhooks loaded:', data?.length || 0);
    } catch (error) {
      console.error('❌ Error fetching N8N webhooks:', error);
      toast.error('Erro ao carregar webhooks N8N');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWebhook = useCallback(async (webhookType: string, updates: Partial<N8NWebhook>) => {
    try {
      const { data, error } = await supabase
        .from('n8n_webhooks')
        .update(updates)
        .eq('webhook_type', webhookType)
        .select()
        .single();

      if (error) throw error;

      setWebhooks(prev => 
        prev.map(w => w.webhook_type === webhookType ? { ...w, ...data } : w)
      );

      console.log(`✅ N8N webhook updated: ${webhookType}`);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Error updating N8N webhook:', error);
      return { data: null, error };
    }
  }, []);

  const getActiveWebhook = useCallback((webhookType: string) => {
    return webhooks.find(w => w.webhook_type === webhookType && w.is_active);
  }, [webhooks]);

  const sendToN8N = useCallback(async (webhookType: string, payload: any) => {
    const webhook = getActiveWebhook(webhookType);
    
    if (!webhook) {
      throw new Error(`Webhook ${webhookType} not configured or inactive`);
    }

    try {
      const response = await fetch(webhook.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          webhook_type: webhookType,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`📤 N8N ${webhookType} sent successfully:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Error sending to N8N ${webhookType}:`, error);
      throw error;
    }
  }, [getActiveWebhook]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  return {
    webhooks,
    loading,
    fetchWebhooks,
    updateWebhook,
    getActiveWebhook,
    sendToN8N
  };
};
