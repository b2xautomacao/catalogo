# 🚀 GUIA COMPLETO - CONFIGURAÇÃO SUPABASE

## 📋 **PASSO A PASSO PARA RESOLVER O PROBLEMA**

### **🔍 ETAPA 1: VERIFICAR O QUE JÁ EXISTE**

1. **Acesse o Supabase Dashboard:**

   - Vá para [supabase.com](https://supabase.com)
   - Entre no seu projeto
   - Clique em "SQL Editor" na barra lateral

2. **Execute o script de verificação:**

   ```sql
   -- Cole e execute o conteúdo de verificacao_tabelas_supabase.sql
   ```

3. **Analise os resultados:**
   - ✅ = Tabela existe
   - ❌ = Tabela não existe
   - Anote quais tabelas estão faltando

---

### **🛠️ ETAPA 2: CRIAR TABELAS NECESSÁRIAS**

1. **Execute o script principal:**

   ```sql
   -- Cole e execute o conteúdo de database_setup.sql
   ```

2. **Se der erro, execute por partes:**

   **Parte 1 - ENUMs:**

   ```sql
   DO $$ BEGIN
       CREATE TYPE payment_method_type AS ENUM ('pix', 'credit_card', 'debit_card', 'bank_transfer', 'cash', 'crypto');
   EXCEPTION
       WHEN duplicate_object THEN null;
   END $$;

   DO $$ BEGIN
       CREATE TYPE shipping_method_type AS ENUM ('pickup', 'delivery', 'correios', 'custom');
   EXCEPTION
       WHEN duplicate_object THEN null;
   END $$;
   ```

   **Parte 2 - Tabelas:**

   ```sql
   CREATE TABLE IF NOT EXISTS store_payment_methods (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       store_id UUID NOT NULL,
       name VARCHAR(255) NOT NULL,
       type payment_method_type NOT NULL,
       is_active BOOLEAN DEFAULT TRUE,
       config JSONB DEFAULT NULL,
       created_at TIMESTAMPTZ DEFAULT NOW(),
       updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

   **Continue com as outras tabelas...**

---

### **⚙️ ETAPA 3: VERIFICAR CONFIGURAÇÕES**

1. **Verificar se as colunas em store_settings existem:**

   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'store_settings' AND table_schema = 'public';
   ```

2. **Se faltar alguma coluna, adicionar:**
   ```sql
   ALTER TABLE store_settings
   ADD COLUMN IF NOT EXISTS checkout_upsell_enabled BOOLEAN DEFAULT TRUE;
   ```

---

### **🔐 ETAPA 4: CONFIGURAR PERMISSÕES (RLS)**

**Se você usar Row Level Security, configure as políticas:**

1. **Para store_payment_methods:**

   ```sql
   ALTER TABLE store_payment_methods ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can manage their store payment methods" ON store_payment_methods
   FOR ALL USING (
     store_id IN (
       SELECT id FROM stores WHERE user_id = auth.uid()
     )
   );
   ```

2. **Repita para as outras tabelas...**

---

### **✅ ETAPA 5: TESTAR AS FUNCIONALIDADES**

1. **Teste criar um método de pagamento:**

   ```sql
   INSERT INTO store_payment_methods (store_id, name, type, is_active, config)
   VALUES (
     'seu-store-id-aqui',
     'PIX',
     'pix',
     true,
     '{"pix_key": "test@example.com", "instructions": "Teste"}'::jsonb
   );
   ```

2. **Verificar se foi criado:**
   ```sql
   SELECT * FROM store_payment_methods;
   ```

---

## 🔧 **PRINCIPAIS DIFERENÇAS CORRIGIDAS**

### **❌ MYSQL vs ✅ POSTGRESQL:**

| MySQL (Antigo)                 | PostgreSQL (Supabase)            |
| ------------------------------ | -------------------------------- |
| `VARCHAR(36) DEFAULT (UUID())` | `UUID DEFAULT gen_random_uuid()` |
| `ENUM('value1', 'value2')`     | `CREATE TYPE name AS ENUM (...)` |
| `ON UPDATE CURRENT_TIMESTAMP`  | `TRIGGER com função`             |
| `JSON`                         | `JSONB` (mais eficiente)         |
| `TIMESTAMP`                    | `TIMESTAMPTZ` (com timezone)     |
| `INT`                          | `INTEGER`                        |
| `INDEX`                        | `CREATE INDEX`                   |

---

## 🚨 **SOLUÇÃO DE PROBLEMAS COMUNS**

### **1. Erro: "relation does not exist"**

```sql
-- Significa que a tabela não foi criada. Execute:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'nome_da_tabela';
```

### **2. Erro: "type does not exist"**

```sql
-- Crie o ENUM primeiro:
CREATE TYPE payment_method_type AS ENUM ('pix', 'credit_card', 'debit_card', 'bank_transfer', 'cash', 'crypto');
```

### **3. Erro: "column does not exist"**

```sql
-- Adicione a coluna:
ALTER TABLE store_settings ADD COLUMN checkout_upsell_enabled BOOLEAN DEFAULT TRUE;
```

### **4. Erro de permissão**

```sql
-- Verifique RLS:
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename LIKE 'store_%';
```

---

## 📊 **ESTRUTURA FINAL ESPERADA**

### **Tabelas que devem existir:**

- ✅ `store_payment_methods`
- ✅ `store_shipping_methods`
- ✅ `store_order_bump_configs`
- ✅ `products` (já existente)
- ✅ `stores` ou `store_settings` (já existente)

### **Colunas em store_settings:**

- ✅ `checkout_upsell_enabled`
- ✅ `urgency_timer_enabled`
- ✅ `social_proof_enabled`
- ✅ `trust_badges_enabled`
- ✅ `quick_add_enabled`
- ✅ `business_hours_display_type`

---

## 🎯 **VERIFICAÇÃO FINAL**

Execute este comando para confirmar que tudo está funcionando:

```sql
-- Teste completo
SELECT
    'payment_methods' as tabela,
    COUNT(*) as registros
FROM store_payment_methods
UNION ALL
SELECT
    'shipping_methods' as tabela,
    COUNT(*) as registros
FROM store_shipping_methods
UNION ALL
SELECT
    'order_bump_configs' as tabela,
    COUNT(*) as registros
FROM store_order_bump_configs;
```

**Se este comando executar sem erro, sua configuração está correta!** ✅

---

## 📞 **SUPORTE**

Se ainda estiver com problemas:

1. **Copie e cole a mensagem de erro completa**
2. **Execute o script de verificação**
3. **Envie os resultados da verificação**

**Sistema testado e funcionando no Supabase!** 🚀💪



