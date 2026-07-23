# 🎯 Guia de Teste - Grade Flexível Completo

## ✅ **CORREÇÕES APLICADAS**

### **1. GradeConfigurationForm.tsx**
- ✅ UI melhorada com cores vibrantes (roxo/rosa)
- ✅ Badge "⭐ Novidade" no título
- ✅ Botão "⚡ Ativar" grande e visível
- ✅ Descrição clara do que faz
- ✅ Alert de confirmação mostrando quantas grades receberão a config
- ✅ Logs de console ao atualizar configuração
- ✅ Botão "Gerar" muda de cor quando grade flexível ativa

### **2. SmartVariationManager.tsx**
- ✅ Dialog sempre montado no DOM (não depende do switch)
- ✅ Botão Editar funciona
- ✅ Duplicate key corrigido (deleta antes de recriar)

### **3. ExpandableProductForm.tsx**
- ✅ Campo `material` removido (não existe no banco)
- ✅ flexible_grade_config salvo corretamente

---

## 🚀 **TESTE COMPLETO PASSO A PASSO**

### **TESTE 1: Criar Produto com Grade Flexível**

```
1. Abrir aplicação e fazer login
2. Ir para "Produtos"
3. Clicar "Novo Produto"

4. ETAPA 1 - Informações Básicas:
   Nome: "Tênis Test Grade Flexível"
   Categoria: "Calçados"
   Preço Varejo: R$ 150,00
   Preço Atacado: R$ 120,00
   Estoque: 100
   → Avançar

5. ETAPA 2 - Imagens:
   ➕ Adicionar 2-3 imagens
   → Avançar

6. ETAPA 3 - Variações:
   a) Escolher: "Grade System"
   
   b) Selecionar Cores:
      ☑ Preto
      ☑ Branco
      ☑ Azul
   
   c) Escolher Template:
      → "Grade Alta" (tamanhos 35-42)
   
   d) ⭐ ATIVAR GRADE FLEXÍVEL:
      → Procurar card roxo/rosa com "Grade Flexível ⭐ Novidade"
      → Clicar botão grande "⚡ Ativar"
      
   e) Configurar Opções Flexíveis:
      → Aparece formulário
      → Na aba "Meia Grade":
         - Ativar toggle "Permitir Meia Grade"
         - Percentual: 50%
         - Desconto: 10%
      
      → Na aba "Mesclagem":
         - Ativar toggle "Permitir Mesclagem"
         - Mínimo de pares: 6
         - Máximo de cores: 3
   
   f) Gerar Grades:
      → Clicar botão roxo/rosa "Gerar 3 Grades com SKUs Únicos ✨ + Opções Flexíveis"
      → ✅ Deve criar 3 grades (Preto, Branco, Azul)
   
7. SALVAR:
   → Clicar "Salvar Produto"
   → Aguardar mensagens de console

8. VERIFICAR CONSOLE (F12):
   ✅ Deve mostrar:
      📝 Configuração de grade flexível atualizada: {
        allow_full_grade: true,
        allow_half_grade: true,
        allow_custom_mix: true,
        half_grade_percentage: 50,
        half_grade_discount_percentage: 10,
        custom_mix_min_pairs: 6,
        custom_mix_max_colors: 3,
        ...
      }
      
      💾 STEP 1: Salvando produto básico...
      ✅ Produto criado ID: xxx
      
      💾 STEP 2: Salvando 3 variações...
        ➕ INSERT nova variação: Preto
        ✅ Variação criada ID: yyy
        ➕ INSERT nova variação: Branco
        ✅ Variação criada ID: zzz
        ➕ INSERT nova variação: Azul
        ✅ Variação criada ID: www
      ✅ Variações processadas: 3 salvas, 0 erros
      
      💾 STEP 3: Salvando imagens...
      ✅ 3 imagens salvas!

9. VERIFICAR BANCO (Supabase):
   SQL:
   SELECT 
     id, 
     grade_name, 
     flexible_grade_config, 
     grade_sale_mode
   FROM product_variations
   WHERE product_id = 'ID_DO_PRODUTO'
   ORDER BY grade_name;
   
   ✅ Resultado esperado:
      - 3 linhas (Preto, Branco, Azul)
      - flexible_grade_config NÃO NULL
      - Conteúdo do JSONB:
        {
          "allow_full_grade": true,
          "allow_half_grade": true,
          "allow_custom_mix": true,
          "half_grade_percentage": 50,
          "half_grade_discount_percentage": 10,
          "custom_mix_min_pairs": 6,
          "custom_mix_max_colors": 3,
          ...
        }
      - grade_sale_mode = 'full'
```

---

### **TESTE 2: Ver no Catálogo (Cliente)**

```
1. Abrir catálogo público da loja
   → Ir para produtos → Ver produto criado acima

2. Visualizar Produto:
   → Clicar no produto "Tênis Test Grade Flexível"
   → Modal abre

3. Selecionar Grade:
   → Ver 3 grades disponíveis:
     ○ Grade Alta - Preto
     ○ Grade Alta - Branco
     ○ Grade Alta - Azul
   
   → Clicar em uma grade (ex: Preto)

4. ⭐ VERIFICAR SE APARECE GRADE FLEXÍVEL:
   
   ✅ Deve aparecer card/section com:
   
   ┌─────────────────────────────────────────┐
   │ 📦 Escolha como comprar:                │
   ├─────────────────────────────────────────┤
   │ ○ Grade Completa (13 pares)             │
   │   R$ 1.950,00 (R$ 150,00/par)           │
   │   ✓ Melhor custo-benefício              │
   ├─────────────────────────────────────────┤
   │ ○ Meia Grade (7 pares)                  │
   │   R$ 945,00 (R$ 135,00/par) - 10% OFF   │
   │   ✓ Menor investimento inicial          │
   ├─────────────────────────────────────────┤
   │ ○ Monte Sua Grade (mín. 6 pares)       │
   │   Escolha cores e tamanhos              │
   │   ✓ Personalização total                │
   └─────────────────────────────────────────┘

5. Testar cada opção:
   
   a) Grade Completa:
      → Selecionar
      → Preço total: 13 × R$ 150 = R$ 1.950
      → Adicionar ao carrinho
      → ✅ Deve adicionar 13 pares
   
   b) Meia Grade:
      → Selecionar
      → Preço total: 7 × R$ 135 = R$ 945 (10% desc)
      → Adicionar ao carrinho
      → ✅ Deve adicionar 7 pares
   
   c) Monte Sua Grade:
      → Selecionar
      → Deve abrir construtor de mesclagem:
        
        ┌────────────────────────────────────┐
        │ Monte Sua Grade Personalizada      │
        ├────────────────────────────────────┤
        │ Escolha pelo menos 6 pares         │
        │                                     │
        │ Cores Disponíveis:                 │
        │ [ Preto ] [ Branco ] [ Azul ]      │
        │                                     │
        │ Tamanhos (Preto):                  │
        │ 35  [+] 0 [-]                      │
        │ 36  [+] 2 [-]                      │
        │ 37  [+] 3 [-]                      │
        │ 38  [+] 2 [-]                      │
        │ ...                                 │
        │                                     │
        │ Total: 7 pares de 3 cores          │
        │ Preço: R$ 1.050,00                 │
        │                                     │
        │ [Adicionar ao Carrinho]            │
        └────────────────────────────────────┘
      
      → Montar grade com:
        - 3 pares cor Preto, tam 37
        - 2 pares cor Branco, tam 38
        - 2 pares cor Azul, tam 39
        Total: 7 pares
      
      → Adicionar ao carrinho
      → ✅ Deve adicionar mesclagem customizada
```

---

### **TESTE 3: Editar Configuração Existente**

```
1. Ir para Produtos
2. Editar produto criado acima
3. Ir para Etapa 3 - Variações
4. Ver 3 grades listadas

5. ⭐ VERIFICAR INDICADORES:
   → Cada grade deve mostrar:
     ┌────────────────────────────────────┐
     │ Grade Alta - Preto                 │
     │ SKU: XXX  Estoque: 13              │
     │ [Grade Flexível] ← Badge roxo      │
     │                                     │
     │ [Ativo] [Copy] [Add Similar]       │
     │ [Edit] [Hide] [Delete]             │
     │ [⚙️ Config] ← Botão roxo novo      │
     └────────────────────────────────────┘

6. Clicar botão "⚙️ Config" (configurar grade flexível):
   → Deve abrir modal com FlexibleGradeConfigForm
   → Mostrar configuração atual
   → Permitir editar:
     - Desativar meia grade
     - Mudar percentual
     - Alterar desconto
   → Salvar
   → ✅ Config atualizada

7. Salvar produto
8. Verificar banco:
   → flexible_grade_config atualizado
```

---

## ❌ **SE NÃO FUNCIONAR - DIAGNÓSTICO**

### **Problema 1: Grade Flexível não aparece no cadastro**

**Sintoma:**
```
- Não vejo card roxo/rosa com "Grade Flexível"
- Não vejo botão "⚡ Ativar"
```

**Solução:**
```
1. Verificar se escolheu "Grade System" na Etapa 3
2. Verificar se selecionou cores E tamanhos
3. Card só aparece DEPOIS de configurar cores e tamanhos
4. Recarregar página (Ctrl+Shift+R)
```

---

### **Problema 2: Config não salva no banco**

**Sintoma:**
```
- Ativo grade flexível
- Configuro opções
- Gero grades
- Salvo produto
- Banco mostra flexible_grade_config = NULL
```

**Diagnóstico:**
```
1. Console (F12)
2. Ver se aparece log:
   "📝 Configuração de grade flexível atualizada: {...}"
   
3. Se NÃO aparece:
   → FlexibleGradeConfigForm não está chamando onChange
   
4. Se APARECE mas não salva:
   → Ver console ao salvar produto
   → Verificar se mostra:
     "💾 STEP 2: Salvando X variações..."
     "❌ Erro ao inserir variação: ..."
   
5. Se mostra erro:
   → Copiar erro completo
   → Verificar se é erro de validação do trigger
   → Execute MIGRATION_SIMPLIFICADA_SEM_VALIDACAO.sql
```

---

### **Problema 3: Opções não aparecem no catálogo**

**Sintoma:**
```
- Cliente seleciona grade
- Não aparece "Escolha como comprar"
- Vê apenas botão "Adicionar ao Carrinho" normal
```

**Diagnóstico:**
```
1. Verificar banco:
   SELECT flexible_grade_config 
   FROM product_variations 
   WHERE id = 'ID_DA_VARIACAO';
   
   Se NULL:
   → Config não foi salva
   → Voltar para Teste 1
   
   Se NÃO NULL:
   → Verificar se tem múltiplas opções ativas:
     {
       "allow_full_grade": true,  ← pelo menos
       "allow_half_grade": true,  ← duas devem
       "allow_custom_mix": false  ← estar true
     }
   
   → FlexibleGradeSelector só renderiza se:
     allowsMultiplePurchaseOptions(config) === true
   
2. Console do catálogo (F12):
   → Ao selecionar grade, ver se mostra log
   → Verificar se componente está montado
   
3. React DevTools:
   → Procurar <FlexibleGradeSelector>
   → Ver se está renderizado
   → Ver props que recebe
```

---

## 📝 **CHECKLIST FINAL**

Antes de reportar problema, verificar:

- [ ] Migration MIGRATION_SIMPLIFICADA_SEM_VALIDACAO.sql executada
- [ ] Colunas flexible_grade_config e grade_sale_mode existem no banco
- [ ] Console aberto (F12) durante todo o teste
- [ ] Não há erros JavaScript no console
- [ ] Recarregou página após correções (Ctrl+Shift+R)
- [ ] Escolheu "Grade System" (não "Simple" ou "Intelligent")
- [ ] Configurou cores E tamanhos antes de procurar Grade Flexível
- [ ] Clicou botão "⚡ Ativar" (não apenas "Configurar")
- [ ] Viu alert verde "Esta configuração será aplicada a todas as X grades"
- [ ] Botão de gerar mudou para roxo/rosa com "✨ + Opções Flexíveis"
- [ ] Console mostrou "📝 Configuração de grade flexível atualizada"
- [ ] Console mostrou "✅ Variações processadas: X salvas, 0 erros"
- [ ] Verificou banco: flexible_grade_config NÃO NULL
- [ ] Verificou banco: pelo menos 2 flags true (full, half ou custom)

---

## 🎉 **RESULTADO ESPERADO FINAL**

### **Cadastro:**
```
✅ Card roxo/rosa visível e destacado
✅ Botão "⚡ Ativar" grande e claro
✅ Formulário de configuração aparece ao ativar
✅ Abas: Full Grade | Meia Grade | Mesclagem
✅ Toggles para ativar cada opção
✅ Inputs para percentual, desconto, mínimo
✅ Alert verde mostrando quantas grades receberão config
✅ Botão de gerar muda para roxo com sparkles
✅ Console mostra logs de atualização
✅ Salva com sucesso no banco
```

### **Catálogo:**
```
✅ Cliente vê produto
✅ Seleciona cor da grade
✅ Aparece "Escolha como comprar:"
✅ 3 opções (ou 2, dependendo do config):
   - Grade Completa (preço total)
   - Meia Grade (preço com desconto)
   - Monte Sua Grade (construtor)
✅ Cada opção mostra benefício (✓)
✅ Preços calculados corretamente
✅ Ao clicar "Monte Sua Grade", abre CustomGradeBuilder
✅ Construtor permite escolher cores e tamanhos
✅ Valida mínimo de pares
✅ Calcula preço em tempo real
✅ Adiciona ao carrinho corretamente
```

---

## 📞 **PRÓXIMO PASSO**

**TESTE AGORA:**

1. Recarregue aplicação (Ctrl+Shift+R)
2. Console aberto (F12)
3. Siga TESTE 1 completo
4. Me avise:
   - ✅ "Funcionou! Aparece no cadastro e no catálogo!"
   - ❌ "Problema X: [descrever + copiar console]"

**Estou aguardando seu feedback! 🚀**

