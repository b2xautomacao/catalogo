-- Migration: Corrigir erro 406 na tabela store_price_models
-- Data: 2025-01-29

-- 1. Remover todas as políticas existentes da tabela store_price_models
DROP POLICY IF EXISTS "Store admins can manage their price models" ON store_price_models;
DROP POLICY IF EXISTS "Public can read price models" ON store_price_models;

-- 2. Recriar políticas RLS mais simples e seguras
CREATE POLICY "Enable read access for all users" ON store_price_models
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON store_price_models
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for store admins" ON store_price_models
  FOR UPDATE USING (
    store_id IN (
      SELECT store_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('store_admin', 'superadmin')
    )
  );

CREATE POLICY "Enable delete for store admins" ON store_price_models
  FOR DELETE USING (
    store_id IN (
      SELECT store_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('store_admin', 'superadmin')
    )
  );

-- 3. Verificar se a tabela existe e tem a estrutura correta
DO $$
BEGIN
    -- Verificar se a tabela existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'store_price_models' 
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Tabela store_price_models não existe!';
    END IF;
    
    -- Verificar se RLS está habilitado
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'store_price_models' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE store_price_models ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS habilitado na tabela store_price_models';
    END IF;
    
    RAISE NOTICE 'Tabela store_price_models verificada com sucesso';
END $$;

-- 4. Verificar se as colunas de pedido mínimo existem
DO $$
BEGIN
    -- Verificar se a coluna minimum_purchase_enabled existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'store_price_models' 
        AND column_name = 'minimum_purchase_enabled'
    ) THEN
        ALTER TABLE store_price_models 
        ADD COLUMN minimum_purchase_enabled BOOLEAN DEFAULT false;
        RAISE NOTICE 'Coluna minimum_purchase_enabled criada';
    END IF;

    -- Verificar se a coluna minimum_purchase_amount existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'store_price_models' 
        AND column_name = 'minimum_purchase_amount'
    ) THEN
        ALTER TABLE store_price_models 
        ADD COLUMN minimum_purchase_amount DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Coluna minimum_purchase_amount criada';
    END IF;

    -- Verificar se a coluna minimum_purchase_message existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'store_price_models' 
        AND column_name = 'minimum_purchase_message'
    ) THEN
        ALTER TABLE store_price_models 
        ADD COLUMN minimum_purchase_message TEXT DEFAULT 'Pedido mínimo de R$ {amount} para finalizar a compra';
        RAISE NOTICE 'Coluna minimum_purchase_message criada';
    END IF;
END $$;

-- 5. Atualizar registros existentes com valores padrão
UPDATE store_price_models 
SET 
    minimum_purchase_enabled = COALESCE(minimum_purchase_enabled, false),
    minimum_purchase_amount = COALESCE(minimum_purchase_amount, 0.00),
    minimum_purchase_message = COALESCE(minimum_purchase_message, 'Pedido mínimo de R$ {amount} para finalizar a compra')
WHERE 
    minimum_purchase_enabled IS NULL 
    OR minimum_purchase_amount IS NULL 
    OR minimum_purchase_message IS NULL;

-- 6. Verificar a estrutura final da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'store_price_models' 
ORDER BY ordinal_position;

-- 7. Testar se a consulta funciona
SELECT 
    store_id,
    price_model,
    minimum_purchase_enabled,
    minimum_purchase_amount,
    minimum_purchase_message,
    created_at,
    updated_at
FROM store_price_models 
ORDER BY updated_at DESC 
LIMIT 5;

-- 8. Comentário explicativo
COMMENT ON TABLE store_price_models IS 'Configuração do modelo de preço por loja - Corrigido erro 406';
