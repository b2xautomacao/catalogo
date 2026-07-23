# 🚀 Instruções para Aplicar Migração Order Bump

## ⚠️ Problema Identificado

O erro "Erro ao salvar order bump" está ocorrendo porque a tabela `store_order_bump_configs` não existe no banco de dados.

## 📋 Solução

### 1. Acesse o Supabase Dashboard

- Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Faça login na sua conta
- Selecione o projeto correto

### 2. Execute as Migrações

- No menu lateral, clique em **"SQL Editor"**
- Clique em **"New query"**

#### Migração 1: Tabela Principal

- Copie e cole o conteúdo do arquivo `migrations/20250128000002-store-order-bump-configs.sql`
- Clique em **"Run"** para executar a migração

#### Migração 2: Correção de Colunas (se necessário)

- Se você receber erro sobre coluna `bundle_price` não encontrada:
- Copie e cole o conteúdo do arquivo `migrations/20250128000003-fix-order-bump-bundle-price.sql`
- Clique em **"Run"** para executar a migração

### 3. Verificar se a Migração Foi Aplicada

- No menu lateral, clique em **"Table Editor"**
- Verifique se a tabela `store_order_bump_configs` aparece na lista
- A tabela deve ter as seguintes colunas:
  - `id` (UUID, Primary Key)
  - `store_id` (UUID, Foreign Key)
  - `product_id` (UUID, Foreign Key)
  - `is_active` (Boolean)
  - `discount_percentage` (Decimal)
  - `urgency_text` (Text)
  - `social_proof_text` (Text)
  - `bundle_price` (Decimal)
  - `is_limited_time` (Boolean)
  - `limited_quantity` (Integer)
  - `trigger_conditions` (JSONB)
  - `created_at` (Timestamp)
  - `updated_at` (Timestamp)

## 🔧 Conteúdo das Migrações

### Migração 1: Tabela Principal

```sql
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
  trigger_conditions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_store_order_bump_configs_store_id ON store_order_bump_configs(store_id);
CREATE INDEX IF NOT EXISTS idx_store_order_bump_configs_product_id ON store_order_bump_configs(product_id);

-- RLS (Row Level Security)
ALTER TABLE store_order_bump_configs ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view order bumps from their store" ON store_order_bump_configs
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores
      WHERE id IN (
        SELECT store_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create order bumps for their store" ON store_order_bump_configs
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM stores
      WHERE id IN (
        SELECT store_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update order bumps from their store" ON store_order_bump_configs
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM stores
      WHERE id IN (
        SELECT store_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete order bumps from their store" ON store_order_bump_configs
  FOR DELETE USING (
    store_id IN (
      SELECT id FROM stores
      WHERE id IN (
        SELECT store_id FROM profiles WHERE id = auth.uid()
      )
    )
  );
```

### Migração 2: Correção de Colunas (se necessário)

```sql
-- Adicionar coluna bundle_price se não existir
ALTER TABLE store_order_bump_configs
ADD COLUMN IF NOT EXISTS bundle_price DECIMAL(10,2);

-- Adicionar outras colunas que podem estar faltando
ALTER TABLE store_order_bump_configs
ADD COLUMN IF NOT EXISTS trigger_conditions JSONB DEFAULT '{}';

-- Verificar se a tabela tem todas as colunas necessárias
DO $$
BEGIN
    -- Verificar se a coluna bundle_price existe
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'store_order_bump_configs'
        AND column_name = 'bundle_price'
    ) THEN
        ALTER TABLE store_order_bump_configs ADD COLUMN bundle_price DECIMAL(10,2);
    END IF;

    -- Verificar se a coluna trigger_conditions existe
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'store_order_bump_configs'
        AND column_name = 'trigger_conditions'
    ) THEN
        ALTER TABLE store_order_bump_configs ADD COLUMN trigger_conditions JSONB DEFAULT '{}';
    END IF;
END $$;
```

## ✅ Após Aplicar a Migração

1. **Recarregue a página** do Order Bump Settings
2. **Teste criar um novo Order Bump**
3. **Verifique se os dados persistem** após recarregar a página

## 🎯 Resultado Esperado

Após aplicar a migração:

- ✅ Order Bumps serão salvos no banco de dados
- ✅ Dados persistirão após recarregar a página
- ✅ Nomes dos produtos serão exibidos corretamente
- ✅ Todas as operações CRUD funcionarão normalmente

## 🆘 Se Ainda Houver Problemas

Se após aplicar a migração ainda houver erros:

1. Verifique se a tabela foi criada corretamente
2. Verifique se as políticas RLS estão ativas
3. Verifique se o usuário tem permissões adequadas
4. Consulte os logs do console do navegador para mais detalhes
