# 🔍 DIAGNÓSTICO: Campos Não Persistem

**Status**: 🔧 Em investigação
**Prioridade**: 🔴 ALTA

---

## ✅ **CORREÇÕES APLICADAS**

### 1. Código Atualizado
```typescript
// ANTES (não incluía os campos):
const productData = {
  name: data.name,
  description: data.description,
  // ... outros campos
  // ❌ Faltavam: product_gender, product_category_type, material
};

// DEPOIS (inclui os campos):
const productData = {
  name: data.name,
  description: data.description,
  // ... outros campos
  // ✅ Adicionados:
  product_gender: data.product_gender || null,
  product_category_type: data.product_category_type || null,
  material: data.material || null,
};
```

### 2. Interface Atualizada
```typescript
export interface ProductFormData {
  // ... campos existentes
  // ✅ Adicionados:
  product_gender?: 'masculino' | 'feminino' | 'unissex' | 'infantil';
  product_category_type?: 'calcado' | 'roupa_superior' | 'roupa_inferior' | 'acessorio';
  material?: string;
  video_url?: string;
  video_type?: 'youtube' | 'vimeo' | 'direct';
  video_thumbnail?: string;
}
```

### 3. Logs de Debug Adicionados
```typescript
console.log("🔍 DEBUG - Dados que serão salvos:", {
  product_gender: productData.product_gender,
  product_category_type: productData.product_category_type,
  material: productData.material,
});
```

---

## 🔍 **VERIFICAÇÕES NECESSÁRIAS**

### 1. Verificar se a Migration Foi Executada

Execute no Supabase SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('product_gender', 'product_category_type', 'material')
ORDER BY column_name;
```

**Deve retornar 3 linhas**:
```
column_name           | data_type
----------------------|----------
material              | text
product_category_type | text
product_gender        | text
```

**Se NÃO retornar 3 linhas**: A migration não foi executada ou deu erro

---

### 2. Testar Cadastro com Debug

No navegador:

1. Abra DevTools (F12)
2. Vá em Console
3. Produtos > Novo Produto
4. Preencha:
   - Nome: "Teste"
   - Gênero: Masculino
   - Tipo: Calçado
   - Material: Couro
5. Clique em Salvar
6. **PROCURE** no console por:

```
🔍 DEBUG - Dados que serão salvos: {
  product_gender: "masculino",
  product_category_type: "calcado",
  material: "Couro"
}
```

**Se aparecer `undefined` ou `null`**: O formulário não está capturando os valores

**Se aparecer os valores corretos**: O problema está no banco de dados

---

### 3. Verificar Erro no Console

Procure por erros tipo:

```
❌ Erro ao salvar produto: {
  code: 'PGRST204',
  message: "Could not find the 'product_gender' column..."
}
```

**Se aparecer esse erro**: A migration não foi executada

---

## 🚨 **POSSÍVEIS CAUSAS**

### Causa 1: Migration Não Executada
```
Solução: Execute MIGRATION_FASE2_CONVERSAO.sql no Supabase
```

### Causa 2: Migration Executada com Erro
```
Solução: Verifique a aba "Results" no SQL Editor
         Procure por mensagens de erro
```

### Causa 3: Cache do Supabase
```
Solução: 
1. Supabase Dashboard
2. Settings > API
3. Clique em "Restart Project"
4. Aguarde 1-2 minutos
5. Teste novamente
```

### Causa 4: RLS (Row Level Security)
```
Solução: Verifique se não há políticas bloqueando UPDATE
```

---

## 🔧 **MIGRATION SIMPLIFICADA (Se a outra não funcionar)**

Execute esta versão mais simples:

```sql
-- Adicionar colunas uma por uma (mais seguro)
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_gender TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_category_type TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS material TEXT;

-- Verificar
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('product_gender', 'product_category_type', 'material');
```

---

## ✅ **TESTE MANUAL NO BANCO**

Execute no SQL Editor:

```sql
-- 1. Criar produto de teste
INSERT INTO products (
  name,
  category,
  retail_price,
  store_id,
  product_gender,
  product_category_type,
  material
) VALUES (
  'TESTE Manual',
  'Teste',
  100.00,
  (SELECT id FROM stores LIMIT 1), -- Pega primeiro store
  'masculino',
  'calcado',
  'Teste material'
) RETURNING id, name, product_gender, product_category_type, material;
```

**Se funcionar**: O problema está no código frontend (vou ajustar)  
**Se NÃO funcionar**: O problema está no banco (migration não executou)

---

## 📊 **CHECKLIST DE DIAGNÓSTICO**

Execute cada verificação:

```
[ ] Query 1: Colunas existem no banco?
[ ] Query 2: Tabelas foram criadas?
[ ] Query 3: INSERT manual funciona?
[ ] Console: Logs de debug aparecem?
[ ] Console: Valores estão corretos no log?
[ ] Console: Algum erro 400/PGRST204?
```

---

## 🎯 **PRÓXIMOS PASSOS**

1. **Execute a Query 1** (verificar colunas)
2. **Me envie o resultado**
3. **Abra o Console do navegador** (F12)
4. **Tente cadastrar um produto**
5. **Me envie os logs** que aparecerem com "🔍 DEBUG"

Com essas informações, vou identificar exatamente o problema!

---

**Criado**: `VERIFICACAO_MIGRATION_FASE2.sql` - queries prontas para copiar/colar
**Criado**: `DIAGNOSTICO_PERSISTENCIA.md` - guia completo

---

**Execute as queries e me avise o resultado!** 😊

