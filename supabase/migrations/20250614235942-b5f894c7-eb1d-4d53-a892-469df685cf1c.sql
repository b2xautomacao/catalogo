
-- Criar tabela de benefícios do sistema (catálogo master)
CREATE TABLE public.system_benefits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  benefit_key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de benefícios por plano (substitui plan_features)
CREATE TABLE public.plan_benefits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  benefit_id UUID NOT NULL REFERENCES public.system_benefits(id) ON DELETE CASCADE,
  limit_value TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, benefit_id)
);

-- Inserir benefícios padrão do sistema
INSERT INTO public.system_benefits (name, description, benefit_key, category) VALUES
('Agente de IA', 'Acesso completo aos recursos de inteligência artificial', 'ai_agent', 'ai'),
('Imagens por Produto', 'Número máximo de imagens permitidas por produto', 'max_images_per_product', 'products'),
('Membros da Equipe', 'Quantidade de membros que podem ser adicionados à equipe', 'max_team_members', 'team'),
('Integração WhatsApp', 'Conectar e automatizar comunicação via WhatsApp', 'whatsapp_integration', 'integrations'),
('Pagamento PIX', 'Aceitar pagamentos via PIX', 'payment_pix', 'payments'),
('Pagamento Cartão', 'Aceitar pagamentos com cartão de crédito', 'payment_credit_card', 'payments'),
('Domínio Personalizado', 'Usar domínio próprio para o catálogo', 'custom_domain', 'branding'),
('Acesso à API', 'Integração via API REST completa', 'api_access', 'integrations'),
('Cupons de Desconto', 'Criar e gerenciar cupons promocionais', 'discount_coupons', 'marketing'),
('Recuperação de Carrinho', 'Automatização para carrinhos abandonados', 'abandoned_cart_recovery', 'marketing'),
('Múltiplas Variações', 'Produtos com variações de cor, tamanho, etc', 'multi_variations', 'products'),
('Calculadora de Frete', 'Cálculo automático de frete por CEP', 'shipping_calculator', 'shipping'),
('Suporte Dedicado', 'Atendimento prioritário e personalizado', 'dedicated_support', 'support'),
('Gestão de Equipe', 'Recursos avançados de gerenciamento de equipe', 'team_management', 'team');

-- Trigger para atualizar updated_at
CREATE TRIGGER update_system_benefits_updated_at 
  BEFORE UPDATE ON public.system_benefits 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.system_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_benefits ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para system_benefits (visível para todos os usuários autenticados)
CREATE POLICY "System benefits are viewable by authenticated users" 
  ON public.system_benefits FOR SELECT 
  TO authenticated 
  USING (true);

-- Políticas RLS para plan_benefits (visível para todos os usuários autenticados)
CREATE POLICY "Plan benefits are viewable by authenticated users" 
  ON public.plan_benefits FOR SELECT 
  TO authenticated 
  USING (true);

-- Políticas para superadmin gerenciar benefícios
CREATE POLICY "Superadmins can manage system benefits" 
  ON public.system_benefits FOR ALL 
  TO authenticated 
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can manage plan benefits" 
  ON public.plan_benefits FOR ALL 
  TO authenticated 
  USING (public.is_superadmin(auth.uid()));

-- Função para verificar se usuário tem benefício específico
CREATE OR REPLACE FUNCTION public.has_benefit_access(_store_id UUID, _benefit_key TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM store_subscriptions ss
    JOIN plan_benefits pb ON pb.plan_id = ss.plan_id
    JOIN system_benefits sb ON sb.id = pb.benefit_id
    WHERE ss.store_id = _store_id
      AND ss.status IN ('active', 'trialing')
      AND (ss.ends_at IS NULL OR ss.ends_at > NOW())
      AND sb.benefit_key = _benefit_key
      AND sb.is_active = true
      AND pb.is_enabled = true
  );
$$;

-- Função para obter limite de benefício
CREATE OR REPLACE FUNCTION public.get_benefit_limit(_store_id UUID, _benefit_key TEXT)
RETURNS TEXT
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT pb.limit_value
  FROM store_subscriptions ss
  JOIN plan_benefits pb ON pb.plan_id = ss.plan_id
  JOIN system_benefits sb ON sb.id = pb.benefit_id
  WHERE ss.store_id = _store_id
    AND ss.status IN ('active', 'trialing')
    AND (ss.ends_at IS NULL OR ss.ends_at > NOW())
    AND sb.benefit_key = _benefit_key
    AND sb.is_active = true
    AND pb.is_enabled = true
  LIMIT 1;
$$;
