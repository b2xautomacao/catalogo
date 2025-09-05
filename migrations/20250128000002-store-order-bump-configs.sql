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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_store_order_bump_configs_store_id ON store_order_bump_configs(store_id);
CREATE INDEX IF NOT EXISTS idx_store_order_bump_configs_product_id ON store_order_bump_configs(product_id);

-- RLS (Row Level Security)
ALTER TABLE store_order_bump_configs ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas os order bumps da sua loja
CREATE POLICY "Users can view order bumps from their store" ON store_order_bump_configs
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores 
      WHERE id IN (
        SELECT store_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Política para permitir que usuários criem order bumps para sua loja
CREATE POLICY "Users can create order bumps for their store" ON store_order_bump_configs
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM stores 
      WHERE id IN (
        SELECT store_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Política para permitir que usuários atualizem order bumps da sua loja
CREATE POLICY "Users can update order bumps from their store" ON store_order_bump_configs
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM stores 
      WHERE id IN (
        SELECT store_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Política para permitir que usuários deletem order bumps da sua loja
CREATE POLICY "Users can delete order bumps from their store" ON store_order_bump_configs
  FOR DELETE USING (
    store_id IN (
      SELECT id FROM stores 
      WHERE id IN (
        SELECT store_id FROM profiles WHERE id = auth.uid()
      )
    )
  );



