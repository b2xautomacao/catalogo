
-- Habilitar extensão unaccent (se necessário)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Criar tabela para integrações WhatsApp
CREATE TABLE public.whatsapp_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connecting', 'connected', 'error')),
  evolution_api_url TEXT,
  evolution_api_token TEXT,
  connection_status TEXT DEFAULT 'disconnected',
  last_connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para configuração global dos webhooks N8N (superadmin)
CREATE TABLE public.n8n_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_type TEXT NOT NULL UNIQUE CHECK (webhook_type IN ('order_notifications', 'whatsapp_integration', 'system_notifications')),
  webhook_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar url_slug para stores (se não existir)
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS url_slug TEXT UNIQUE;

-- Função para gerar slug único baseado no nome da loja (versão simplificada)
CREATE OR REPLACE FUNCTION generate_store_slug(store_name TEXT, store_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Converter nome para slug básico (sem unaccent, versão simplificada)
  base_slug := lower(
    regexp_replace(
      regexp_replace(store_name, '[^a-zA-Z0-9\s]', '', 'g'), 
      '\s+', '-', 'g'
    )
  );
  
  -- Limitar a 50 caracteres
  base_slug := substring(base_slug from 1 for 50);
  
  -- Remover hífens no início e fim
  base_slug := trim(both '-' from base_slug);
  
  -- Se ficou vazio, usar um padrão
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'loja';
  END IF;
  
  final_slug := base_slug;
  
  -- Verificar unicidade e adicionar contador se necessário
  WHILE EXISTS (
    SELECT 1 FROM public.stores 
    WHERE url_slug = final_slug 
    AND id != store_id
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Atualizar lojas existentes sem slug
UPDATE public.stores 
SET url_slug = generate_store_slug(name, id)
WHERE url_slug IS NULL;

-- Trigger para gerar slug automaticamente em novas lojas
CREATE OR REPLACE FUNCTION auto_generate_store_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.url_slug IS NULL OR NEW.url_slug = '' THEN
    NEW.url_slug := generate_store_slug(NEW.name, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_generate_store_slug
  BEFORE INSERT OR UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_store_slug();

-- Habilitar RLS para whatsapp_integrations
ALTER TABLE public.whatsapp_integrations ENABLE ROW LEVEL SECURITY;

-- Policy para usuários verem apenas integrações da própria loja
CREATE POLICY "Users can view their store WhatsApp integrations"
  ON public.whatsapp_integrations
  FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Policy para usuários criarem integração para própria loja
CREATE POLICY "Users can create WhatsApp integrations for their store"
  ON public.whatsapp_integrations
  FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Policy para usuários atualizarem integração da própria loja
CREATE POLICY "Users can update their store WhatsApp integrations"
  ON public.whatsapp_integrations
  FOR UPDATE
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Policy para usuários deletarem integração da própria loja
CREATE POLICY "Users can delete their store WhatsApp integrations"
  ON public.whatsapp_integrations
  FOR DELETE
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- RLS para n8n_webhooks (apenas superadmin)
ALTER TABLE public.n8n_webhooks ENABLE ROW LEVEL SECURITY;

-- Policy para superadmin gerenciar webhooks N8N
CREATE POLICY "Superadmin can manage N8N webhooks"
  ON public.n8n_webhooks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_whatsapp_integrations_updated_at
  BEFORE UPDATE ON public.whatsapp_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_n8n_webhooks_updated_at
  BEFORE UPDATE ON public.n8n_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir webhooks padrão para configuração
INSERT INTO public.n8n_webhooks (webhook_type, webhook_url, description) VALUES
  ('whatsapp_integration', 'https://webhook.n8n.io/whatsapp-integration', 'Webhook para gerenciar integrações WhatsApp via Evolution API'),
  ('order_notifications', 'https://webhook.n8n.io/order-notifications', 'Webhook para envio de notificações de pedidos via WhatsApp'),
  ('system_notifications', 'https://webhook.n8n.io/system-notifications', 'Webhook para notificações do sistema aos lojistas')
ON CONFLICT (webhook_type) DO NOTHING;
