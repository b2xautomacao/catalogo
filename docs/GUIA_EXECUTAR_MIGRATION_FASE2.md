# 🚨 GUIA: Executar Migration FASE 2

**Status**: ⚠️ NECESSÁRIO EXECUTAR
**Prioridade**: 🔴 ALTA (sistema não funciona sem isso)

---

## ⚠️ **PROBLEMA**

Os campos **não estão persistindo**:
- ❌ `product_gender`
- ❌ `product_category_type`
- ❌ `material`

**Causa**: Colunas não existem no banco de dados

**Solução**: Executar `MIGRATION_FASE2_CONVERSAO.sql`

---

## 📋 **PASSO A PASSO (Supabase)**

### 1. Abra o Supabase Dashboard
```
https://supabase.com/dashboard
```

### 2. Acesse SQL Editor
```
Projeto > SQL Editor > New Query
```

### 3. Cole a Migration
Abra o arquivo: **`MIGRATION_FASE2_CONVERSAO.sql`** (na raiz do projeto)

**Copie TODO o conteúdo** (183 linhas)

### 4. Execute (RUN)
Clique no botão **RUN** (ou Ctrl+Enter)

### 5. Verifique o Resultado
Você deve ver:
```
✅ Success. No rows returned
```

---

## ✅ **O QUE ESSA MIGRATION FAZ**

### Adiciona Colunas em `products`:
```sql
✅ product_gender (masculino/feminino/unissex/infantil)
✅ product_category_type (calcado/roupa_superior/roupa_inferior/acessorio)
✅ material (texto livre)
✅ product_weight (peso em kg)
✅ dimensions (dimensões em JSONB)
✅ has_custom_size_chart (boolean)
```

### Cria 4 Novas Tabelas:
```sql
✅ product_videos (vídeos do produto)
✅ product_testimonials (depoimentos)
✅ product_size_charts (tabelas personalizadas)
✅ product_care_instructions (instruções de cuidado)
```

### Cria Índices Otimizados:
```sql
✅ 6 índices para performance
```

---

## 🔍 **VERIFICAR SE DEU CERTO**

Após executar, rode no SQL Editor:

```sql
-- Verificar novas colunas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN (
    'product_gender',
    'product_category_type',
    'material'
  )
ORDER BY column_name;
```

**Resultado esperado**:
```
column_name           | data_type
----------------------|----------
material              | text
product_category_type | text
product_gender        | text
```

Se aparecer **3 linhas**, está tudo certo! ✅

---

## 🚨 **POSSÍVEIS ERROS E SOLUÇÕES**

### Erro 1: "relation already exists"
```
Causa: Tabela já foi criada antes
Solução: IGNORE - está tudo certo!
```

### Erro 2: "column already exists"
```
Causa: Coluna já foi adicionada antes
Solução: IGNORE - está tudo certo!
```

### Erro 3: "permission denied"
```
Causa: Usuário sem permissão
Solução: Use a conta ADMIN do Supabase
```

---

## 🎯 **APÓS EXECUTAR**

### 1. Teste Cadastrar Produto:
```
1. Produtos > Novo Produto
2. Preencha Nome
3. Selecione Gênero: Masculino
4. Selecione Tipo: Calçado
5. Material: Couro sintético
6. Salve

Verifique no banco:
SELECT product_gender, product_category_type, material
FROM products
WHERE name = 'Nome do produto';
```

**Deve aparecer os valores!** ✅

---

## 📄 **MIGRATION COMPLETA**

Arquivo: **`MIGRATION_FASE2_CONVERSAO.sql`**

Localização: **Raiz do projeto** (E:\VendeMais)

Tamanho: 183 linhas

---

## ⚠️ **IMPORTANTE**

**SEM ESSA MIGRATION**:
- ❌ Gênero não salva
- ❌ Tipo não salva
- ❌ Material não salva
- ❌ Vídeo não salva
- ❌ Tabela de medidas não aparece
- ❌ Cuidados não aparecem

**COM A MIGRATION**:
- ✅ Tudo funciona perfeitamente!

---

## 🚀 **EXECUTE AGORA!**

```
1. Supabase Dashboard
2. SQL Editor
3. Cole MIGRATION_FASE2_CONVERSAO.sql
4. RUN
5. ✅ Pronto!
```

---

**Qualquer erro ao executar, me avise e eu ajudo!** 😊

