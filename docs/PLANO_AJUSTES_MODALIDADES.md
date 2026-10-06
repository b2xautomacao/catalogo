# 📋 PLANO DE AJUSTES - Modalidades de Catálogo e Grades

## 🔴 PROBLEMAS CRÍTICOS

### 1. Catálogo Híbrido não selecionável na criação
**Arquivos afetados:**
- `src/components/onboarding/OnboardingWizard.tsx` - Não tem opção de catalog_mode
- `src/hooks/useStoreWizard.tsx` - Cria store_settings sem catalog_mode
- `src/components/settings/CatalogModeSettings.tsx` - Interface existe mas pode ter bloqueio

**Solução:**
- Adicionar campo `catalog_mode` no onboarding
- Garantir que `catalog_mode` seja salvo na criação inicial
- Verificar se há bloqueio por plano (não encontrado ainda)

### 2. "Monte sua grade" não funciona para produtos unitários
**Problema:** Sistema não diferencia produto unitário de grade
**Arquivos afetados:**
- `src/components/catalog/CustomGradeBuilder.tsx`
- `src/components/catalog/FlexibleGradeSelector.tsx`
- `src/components/catalog/ProductVariationSelector.tsx`

**Solução:**
- Detectar se produto é unitário (sem variações de grade, sem is_grade)
- Se unitário, não mostrar opções de grade flexível
- Permitir compra unitária direta

### 3. Varejo convertendo automaticamente para Atacado
**Problema:** Lógica de quantidade mínima sobrepõe modalidade selecionada
**Arquivos afetados:**
- `src/hooks/useCart.tsx` - função `recalculateItemPrices`
- `src/utils/cartHelpers.ts` - função `createCartItem`
- `src/hooks/useCartPriceCalculation.tsx`

**Solução:**
- Separar lógica de modalidade (retail/wholesale) da lógica de quantidade mínima
- Se `catalogType === "retail"` → SEMPRE usar preço varejo, independente de quantidade
- Se `catalogType === "wholesale"` → aplicar regra de quantidade mínima
- Respeitar `catalog_mode` da loja (hybrid/toggle/separated)

### 4. Modalidade Varejo não funcional
**Requisitos:**
- Escolher qualquer cor
- Escolher qualquer numeração
- Comprar unidade individual
- Sem exigência de grade fechada
- Sem conversão automática para atacado

**Solução:**
- Garantir que `catalogType === "retail"` seja respeitado em todo o fluxo
- Não aplicar `min_wholesale_qty` quando em modo varejo
- Permitir quantidade = 1 em varejo

## 🟡 PROBLEMAS MÉDIOS

### 5. "Meia Grade" não funciona
**Arquivos afetados:**
- `src/components/catalog/FlexibleGradeSelector.tsx` - linha 237 onClick

**Solução:**
- Verificar se `handleModeSelection('half')` está sendo chamado
- Verificar se `onModeSelect` está sendo propagado corretamente
- Adicionar logs de debug

### 6. UX da seleção de grade (Desktop)
**Problemas:**
- Grade confusa
- Numeração pouco clara
- Texto com pouco contraste

**Arquivos afetados:**
- `src/components/catalog/GradeVariationCard.tsx`
- `src/components/catalog/FlexibleGradeSelector.tsx`

**Solução:**
- Melhorar contraste de texto
- Reorganizar layout
- Ajustar espaçamento
- Melhorar hierarquia visual

---

## 📝 ORDEM DE IMPLEMENTAÇÃO

1. ✅ Corrigir seleção de Catálogo Híbrido
2. ✅ Corrigir conversão varejo→atacado no carrinho
3. ✅ Implementar modalidade varejo 100% funcional
4. ✅ Corrigir "Monte sua grade" para produtos unitários
5. ✅ Corrigir "Meia Grade"
6. ✅ Melhorar UX da seleção de grade
