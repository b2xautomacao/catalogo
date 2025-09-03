-- Configurações de métodos de pagamento por loja
CREATE TABLE IF NOT EXISTS store_payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'pix', 'credit_card', 'debit_card', 'bank_transfer', 'cash', 'crypto'
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}', -- Configurações específicas do método
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Configurações de métodos de entrega por loja
CREATE TABLE IF NOT EXISTS store_shipping_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'pickup', 'delivery', 'correios', 'custom'
  is_active BOOLEAN DEFAULT true,
  price DECIMAL(10,2) DEFAULT 0,
  estimated_days INTEGER,
  config JSONB DEFAULT '{}', -- Configurações específicas do método
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Configurações de Order Bump por loja
CREATE TABLE IF NOT EXISTS store_order_bump_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  urgency_text TEXT,
  social_proof_text TEXT,
  bundle_price DECIMAL(10,2),
  is_limited_time BOOLEAN DEFAULT false,
  limited_quantity INTEGER,
  trigger_conditions JSONB DEFAULT '{}', -- Condições para exibir o order bump
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Adicionar novas colunas à tabela store_settings para configurações de checkout
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS checkout_upsell_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS urgency_timer_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS social_proof_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS trust_badges_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS quick_add_enabled BOOLEAN DEFAULT true;

-- Inserir métodos de pagamento padrão para lojas existentes
INSERT INTO store_payment_methods (store_id, name, type, config)
SELECT 
  id,
  'PIX',
  'pix',
  jsonb_build_object('instructions', 'Pagamento instantâneo via PIX')
FROM stores
WHERE NOT EXISTS (
  SELECT 1 FROM store_payment_methods 
  WHERE store_payment_methods.store_id = stores.id 
  AND type = 'pix'
);

INSERT INTO store_payment_methods (store_id, name, type, config)
SELECT 
  id,
  'Cartão de Crédito',
  'credit_card',
  jsonb_build_object('instructions', 'Aceitamos as principais bandeiras')
FROM stores
WHERE NOT EXISTS (
  SELECT 1 FROM store_payment_methods 
  WHERE store_payment_methods.store_id = stores.id 
  AND type = 'credit_card'
);

-- Inserir métodos de entrega padrão para lojas existentes
INSERT INTO store_shipping_methods (store_id, name, type, price, config)
SELECT 
  id,
  'Retirada na Loja',
  'pickup',
  0,
  jsonb_build_object('pickup_address', 'Endereço da loja')
FROM stores
WHERE NOT EXISTS (
  SELECT 1 FROM store_shipping_methods 
  WHERE store_shipping_methods.store_id = stores.id 
  AND type = 'pickup'
);

INSERT INTO store_shipping_methods (store_id, name, type, price, estimated_days, config)
SELECT 
  id,
  'Entrega Local',
  'delivery',
  15.90,
  3,
  jsonb_build_object('delivery_radius', 10, 'custom_instructions', 'Entrega em até 3 dias úteis')
FROM stores
WHERE NOT EXISTS (
  SELECT 1 FROM store_shipping_methods 
  WHERE store_shipping_methods.store_id = stores.id 
  AND type = 'delivery'
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_store_payment_methods_store_id ON store_payment_methods(store_id);
CREATE INDEX IF NOT EXISTS idx_store_shipping_methods_store_id ON store_shipping_methods(store_id);
CREATE INDEX IF NOT EXISTS idx_store_order_bump_configs_store_id ON store_order_bump_configs(store_id);
CREATE INDEX IF NOT EXISTS idx_store_order_bump_configs_product_id ON store_order_bump_configs(product_id);



