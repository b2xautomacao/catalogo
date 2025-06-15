
-- Inserir benefícios do sistema se não existirem
INSERT INTO system_benefits (name, description, benefit_key, category, is_active) VALUES
('Agente de IA', 'Assistente inteligente para descrições e conteúdo automatizado', 'ai_agent', 'ai', true),
('Máximo de Imagens por Produto', 'Limite de imagens que podem ser carregadas por produto', 'max_images_per_product', 'products', true),
('Máximo de Membros da Equipe', 'Limite de usuários que podem acessar a loja', 'max_team_members', 'team', true),
('Integração WhatsApp', 'Conectar loja com WhatsApp para vendas e atendimento', 'whatsapp_integration', 'integrations', true),
('Pagamento PIX', 'Aceitar pagamentos via PIX', 'payment_pix', 'payments', true),
('Pagamento Cartão de Crédito', 'Aceitar pagamentos via cartão de crédito', 'payment_credit_card', 'payments', true),
('Domínio Personalizado', 'Usar domínio próprio para o catálogo', 'custom_domain', 'branding', true),
('Acesso à API', 'Integração via API para sistemas externos', 'api_access', 'integrations', true),
('Cupons de Desconto', 'Criar e gerenciar cupons promocionais', 'discount_coupons', 'marketing', true),
('Recuperação de Carrinho Abandonado', 'Notificações automáticas para carrinho abandonado', 'abandoned_cart_recovery', 'marketing', true),
('Múltiplas Variações', 'Produtos com várias opções (cor, tamanho, etc)', 'multi_variations', 'products', true),
('Calculadora de Frete', 'Cálculo automático de frete por CEP', 'shipping_calculator', 'shipping', true),
('Suporte Dedicado', 'Atendimento prioritário e dedicado', 'dedicated_support', 'support', true),
('Gestão de Equipe', 'Gerenciar permissões e acessos da equipe', 'team_management', 'team', true)
ON CONFLICT (benefit_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active;

-- Configurar benefícios do plano básico (limitados)
INSERT INTO plan_benefits (plan_id, benefit_id, is_enabled, limit_value)
SELECT 
  (SELECT id FROM subscription_plans WHERE type = 'basic'),
  sb.id,
  CASE 
    WHEN sb.benefit_key IN ('payment_pix', 'max_images_per_product') THEN true
    ELSE false
  END,
  CASE
    WHEN sb.benefit_key = 'max_images_per_product' THEN '3'
    WHEN sb.benefit_key = 'payment_pix' THEN 'unlimited'
    ELSE NULL
  END
FROM system_benefits sb
ON CONFLICT (plan_id, benefit_id) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  limit_value = EXCLUDED.limit_value;

-- Configurar benefícios do plano premium (todos liberados)
INSERT INTO plan_benefits (plan_id, benefit_id, is_enabled, limit_value)
SELECT 
  (SELECT id FROM subscription_plans WHERE type = 'premium'),
  sb.id,
  true,
  CASE
    WHEN sb.benefit_key = 'max_images_per_product' THEN '20'
    WHEN sb.benefit_key = 'max_team_members' THEN '10'
    ELSE 'unlimited'
  END
FROM system_benefits sb
ON CONFLICT (plan_id, benefit_id) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  limit_value = EXCLUDED.limit_value;

-- Atualizar assinaturas existentes que estão como 'trialing' para ter um trial_ends_at definido
UPDATE store_subscriptions 
SET trial_ends_at = NOW() + INTERVAL '7 days'
WHERE status = 'trialing' AND trial_ends_at IS NULL;
