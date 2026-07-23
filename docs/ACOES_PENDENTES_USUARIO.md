# ⚠️ Ações Pendentes do Usuário

**Data**: Outubro 2025
**Prioridade**: 🟡 Média (opcional para desenvolvimento, importante para produção)

---

## 📋 Checklist de Ações

### ✅ Completadas
- [x] Implementação da FASE 1 de Conversão
- [x] Correção de erros de lint
- [x] Integração de componentes
- [x] Documentação

### ⚠️ Pendentes (Ação Manual no Supabase)

#### 1️⃣ Migration: Flexible Grade Config
**Status**: ⚠️ Pendente
**Arquivo**: `MIGRATION_SIMPLIFICADA_SEM_VALIDACAO.sql`
**Local**: Raiz do projeto

**Como executar**:
1. Abra o Supabase Dashboard
2. Vá em: `SQL Editor`
3. Cole o conteúdo do arquivo `MIGRATION_SIMPLIFICADA_SEM_VALIDACAO.sql`
4. Clique em `RUN`
5. Verifique se não há erros

**O que faz**:
- Adiciona coluna `flexible_grade_config` (JSONB) na tabela `product_variations`
- Adiciona coluna `grade_sale_mode` (TEXT) na tabela `product_variations`
- Permite salvar configurações de grade flexível

**Prioridade**: 🟡 Média (necessária se você usar grades flexíveis)

---

#### 2️⃣ SQL: Corrigir Preços de Atacado
**Status**: ⚠️ Pendente
**Descrição**: Alguns produtos podem ter `retail_price = 0` mas possuir `wholesale_price`. Isso causa exibição incorreta no carrinho.

**SQL para executar**:
```sql
-- Atualizar produtos com retail_price = 0 mas com wholesale_price válido
UPDATE products
SET retail_price = wholesale_price
WHERE retail_price = 0 
  AND wholesale_price > 0;

-- Verificar quantos produtos foram atualizados
SELECT 
  COUNT(*) as produtos_corrigidos,
  SUM(wholesale_price) as valor_total_corrigido
FROM products
WHERE retail_price = wholesale_price
  AND wholesale_price > 0;
```

**Como executar**:
1. Abra o Supabase Dashboard
2. Vá em: `SQL Editor`
3. Cole o SQL acima
4. Clique em `RUN`
5. Verifique o resultado

**Prioridade**: 🟢 Baixa (já tem fallback no código, mas recomendado para consistência)

---

## 🔍 Verificação de Sucesso

### Para Migration (Flexible Grade):
Execute no SQL Editor:
```sql
-- Verificar se as colunas foram criadas
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'product_variations'
  AND column_name IN ('flexible_grade_config', 'grade_sale_mode');
```

**Resultado esperado**:
```
column_name            | data_type | is_nullable
-----------------------|-----------|------------
flexible_grade_config  | jsonb     | YES
grade_sale_mode        | text      | YES
```

---

### Para Correção de Preços:
Execute no SQL Editor:
```sql
-- Verificar se ainda há produtos com retail_price = 0
SELECT 
  id,
  name,
  retail_price,
  wholesale_price
FROM products
WHERE retail_price = 0 
  AND wholesale_price > 0
ORDER BY name;
```

**Resultado esperado**: Nenhum produto encontrado (ou lista vazia)

---

## 📝 Notas Importantes

1. **Backup**: Antes de executar qualquer migration, faça backup do banco (Supabase faz automaticamente)

2. **Ambiente**: Execute primeiro em desenvolvimento/staging antes de produção

3. **Fallback**: Mesmo sem executar as migrations, o sistema continua funcionando:
   - Flexible Grade: Simplesmente não permite configuração flexível
   - Preços: O código já tem fallback para usar `wholesale_price` se `retail_price = 0`

4. **Opcional**: Essas migrations são **opcionais** para desenvolvimento, mas **recomendadas** para produção

---

## 🚀 Próximos Passos (Após Executar)

Após executar as migrations:

1. ✅ Testar cadastro de produto com grade flexível
2. ✅ Verificar se `flexible_grade_config` é salvo corretamente
3. ✅ Confirmar que preços de atacado aparecem corretamente no carrinho
4. ✅ Testar checkout end-to-end

---

## 📞 Suporte

Se encontrar erros ao executar as migrations:
1. Copie a mensagem de erro completa
2. Verifique se já não executou anteriormente
3. Me envie o erro para análise

---

**Última atualização**: Outubro 2025

