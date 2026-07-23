# 🧪 Guia de Testes - Sistema de Grade Flexível Completo

## 📋 Checklist de Validação Completa

---

## 🎯 TESTE 1: Cadastro com Div Expansível

### **1.1 Criar Novo Produto**

**Passos:**
```
1. Ir em Produtos
2. Clicar "➕ Novo Produto"
   ✓ Div deve expandir suavemente no topo
   ✓ Overlay deve escurecer a lista
   ✓ Deve mostrar "➕ Cadastrar Novo Produto"

3. Preencher Informações Básicas:
   - Nome: "Tênis Esportivo Teste"
   - Preço: 150.00
   - Categoria: "Calçados"
   ✓ Campos devem aceitar entrada
   ✓ Validações em tempo real

4. Clicar tab "2. Imagens"
   ✓ Deve navegar SEM salvar (criação não tem auto-save)
   ✓ Tab "1. Básico" deve ficar verde (completada)

5. Voltar para "1. Básico"
   ✓ Dados devem estar preservados
   ✓ Navegação livre funciona

6. Clicar "Salvar Produto"
   ✓ Toast: "✅ Produto criado"
   ✓ Div deve fechar
   ✓ Lista de produtos deve atualizar
   ✓ Novo produto deve aparecer
```

**Resultado Esperado:** ✅ Produto criado com sucesso

---

### **1.2 Editar Produto Existente**

**Passos:**
```
1. Na lista, clicar "Editar" em qualquer produto
   ✓ Div expande no topo
   ✓ Scroll automático para o topo
   ✓ Dados do produto devem carregar
   ✓ Deve mostrar "✏️ Editar Produto"

2. Modificar nome do produto
   ✓ Após 2 segundos: Toast "✓ Salvo automaticamente"
   ✓ Indicador: "Salvo há 0 min" (verde)

3. Ir para tab "3. Variações"
   ✓ Navegação livre funciona
   ✓ Auto-save não dispara (só quando muda dados)

4. Modificar algo nas variações
   ✓ Após 2 segundos: Auto-save dispara
   ✓ Indicador atualiza

5. Clicar "Salvar e Fechar"
   ✓ Salva imediatamente
   ✓ Div fecha
   ✓ Lista atualiza
```

**Resultado Esperado:** ✅ Auto-save funciona, navegação livre OK

---

## 🎯 TESTE 2: Grade Flexível - Cadastro

### **2.1 Configurar Grade com Opções Flexíveis**

**Passos:**
```
1. Criar novo produto "Tênis Grade Flex"
2. Ir para tab "3. Variações"
3. No SmartVariationManager, clicar UnifiedVariationWizard
4. Escolher "Grade System"
5. Selecionar cores: ["Preto", "Branco"]
6. Aplicar template "Grade Alta"
   ✓ Tamanhos aparecem: 36-42
   ✓ Quantidades aparecem: [1,2,2,3,2,2,1]

7. Rolar até "Opções de Venda Flexível (Opcional)"
8. Clicar "Configurar"
   ✓ Card azul expande

9. MODO RÁPIDO:
   a) Clicar "Modo Rápido"
   ✓ GradeWizardSimplified abre
   
   b) Passo 1: Escolher "Todas as opções"
   ✓ Card fica verde selecionado
   
   c) Clicar "Próximo"
   ✓ Vai para passo 2
   
   d) Passo 2: Escolher "10% de desconto"
   ✓ Card fica laranja
   
   e) Clicar "Próximo"
   f) Passo 3: Escolher "Limitado (até 3 cores)"
   ✓ Card fica roxo
   
   g) Clicar "Próximo"
   h) Passo 4: Ver resumo
   ✓ Mostra: "Grade Completa, Meia Grade, Montar Grade"
   ✓ Mostra: "10% de desconto"
   ✓ Mostra: "Até 3 cores"
   
   i) Clicar "Confirmar Configuração"
   ✓ Volta para formulário principal
   ✓ Configuração aplicada

10. Clicar "Gerar Grades + Opções Flexíveis"
    ✓ 2 grades criadas (Preto e Branco)
    ✓ Cada uma tem flexible_grade_config
    ✓ Toast de sucesso

11. Clicar "Salvar Produto"
    ✓ Produto salvo com grades flexíveis
```

**Resultado Esperado:** ✅ Grade flexível configurada e salva

---

### **2.2 Configurar Grade (Modo Avançado)**

**Passos:**
```
1. Criar produto "Tênis Flex Avançado"
2. Configurar grade normalmente
3. Em "Opções de Venda Flexível", clicar "Configurar"
4. NÃO clicar "Modo Rápido", usar tabs:

   TAB "Grade Completa":
   ✓ Toggle: Permitir grade completa = ON
   ✓ Ver preview com todos os tamanhos

   TAB "Meia Grade":
   a) Toggle: Permitir meia grade = ON
   b) Slider: Percentual = 50%
   ✓ Preview atualiza mostrando 50% dos pares
   
   c) Mínimo de pares: 6
   d) Desconto: 5%
   ✓ Preview mostra: "Com 5% de desconto"

   TAB "Mesclagem":
   a) Toggle: Permitir mesclagem = ON
   b) Mínimo de pares: 8
   c) Máximo de cores: 4
   d) Permitir qualquer tamanho: ON
   e) Ajuste de preço: 2.00

5. Ver "Resumo da Configuração"
   ✓ Grade Completa: Habilitada
   ✓ Meia Grade: Habilitada (50%)
   ✓ Mesclagem: Habilitada (mín. 8 pares)

6. Gerar e salvar
```

**Resultado Esperado:** ✅ Configuração avançada funciona

---

## 🎯 TESTE 3: Copiar e Adicionar Grade Similar

### **3.1 Copiar Variação**

**Passos:**
```
1. Editar produto com grades existentes
2. Ir para "Variações"
3. Na lista de variações, encontrar uma grade
4. Clicar ícone 📋 azul "Copiar"
   ✓ Toast: "✅ Variação copiada!"
   ✓ Nova grade aparece na lista
   ✓ SKU termina com "-COPY"
   ✓ Todos os dados copiados

5. Editar SKU da cópia
6. Auto-save salva em 2 segundos
```

**Resultado Esperado:** ✅ Cópia funciona, auto-save OK

---

### **3.2 Adicionar Grade Similar**

**Passos:**
```
1. Editar produto com grade
2. Na lista de variações, encontrar grade "Preto"
3. Clicar ícone ➕ roxo "Adicionar Similar"
   ✓ Dialog pergunta: "Digite a cor da nova grade:"

4. Digitar: "Azul Marinho"
5. Clicar OK
   ✓ Toast: "✅ Grade similar adicionada!"
   ✓ Nova grade "Azul Marinho" aparece
   ✓ Mantém mesmos tamanhos e quantidades
   ✓ SKU atualizado: "...-AZUL-MARINHO"
   ✓ grade_name: "Grade - Azul Marinho"

6. Verificar configuração da nova grade:
   ✓ flexible_grade_config copiado da original
   ✓ Todas as configurações mantidas

7. Auto-save salva em 2 segundos
```

**Resultado Esperado:** ✅ Adicionar similar funciona perfeitamente

---

## 🎯 TESTE 4: Catálogo Público - Grade Flexível

### **4.1 Visualizar Produto com Grade Flexível**

**Passos:**
```
1. Acessar catálogo público da loja
2. Encontrar produto com grade flexível criado
   ✓ Card do produto aparece normal

3. Abrir detalhes do produto
4. Na seção de variações:
   ✓ Ver grades disponíveis
   ✓ Badge "✨ Múltiplas Opções" deve aparecer

5. Clicar na grade
   ✓ GradeVariationCard seleciona
   ✓ FlexibleGradeSelector aparece embaixo
```

**Resultado Esperado:** ✅ Badge visível, seletor aparece

---

### **4.2 Selecionar Grade Completa**

**Passos:**
```
1. No FlexibleGradeSelector, ver 3 cards:
   - 📦 Grade Completa
   - 📈 Meia Grade
   - 👥 Monte Sua Grade

2. Clicar em "📦 Grade Completa"
   ✓ Card fica azul (selecionado)
   ✓ Aparece ✓ ícone de confirmação
   ✓ Alert embaixo mostra: "Grade Completa Selecionada: 21 pares..."

3. Ver preço:
   ✓ Preço total: R$ 630,00
   ✓ Preço unitário: R$ 30,00/par
   ✓ Badge: "Recomendado"

4. Clicar "Adicionar ao Carrinho"
   ✓ Item adicionado
   ✓ flexibleGradeMode: 'full'
```

**Resultado Esperado:** ✅ Seleção de grade completa OK

---

### **4.3 Selecionar Meia Grade**

**Passos:**
```
1. Clicar em "📈 Meia Grade"
   ✓ Card fica laranja (selecionado)
   ✓ Mostra quantidade de pares (ex: 12 pares)
   ✓ Mostra percentual (50%)

2. Ver preço:
   ✓ Preço total: R$ 324,00
   ✓ Preço unitário: R$ 27,00/par
   ✓ Badge: "-10%" (se configurado desconto)

3. Alert mostra:
   ✓ "Meia Grade Selecionada: 12 pares"
   ✓ Tamanhos incluídos
   ✓ "Economia de 10%"

4. Adicionar ao carrinho
   ✓ flexibleGradeMode: 'half'
   ✓ Preço correto aplicado
```

**Resultado Esperado:** ✅ Meia grade com desconto correto

---

### **4.4 Montar Grade Personalizada**

**Passos:**
```
1. Clicar em "👥 Monte Sua Grade"
   ✓ Card fica roxo
   ✓ CustomGradeBuilder aparece

2. Ver interface:
   ✓ Header roxo: "Monte Sua Grade Personalizada"
   ✓ Info: "Mínimo X pares"
   ✓ Info: "Máx. Y cores"
   ✓ Progress bar: 0 / X pares

3. Adicionar item:
   a) Selecionar cor: "Preto"
   b) Selecionar tamanho: "38"
   c) Quantidade: 3
   d) Clicar "Adicionar"
   ✓ Item aparece na lista
   ✓ Progress: 3 / X pares

4. Adicionar mais itens até atingir mínimo
   ✓ Progress bar vai enchendo
   ✓ Quando atinge mínimo: fica verde

5. Ver resumo:
   ✓ Total de Pares: correto
   ✓ Cores Diferentes: correto
   ✓ Total Estimado: cálculo correto

6. Tentar confirmar antes do mínimo:
   ✓ Botão "Confirmar" desabilitado
   ✓ Alert vermelho: "Quantidade mínima..."

7. Atingir mínimo e confirmar:
   ✓ Seleção confirmada
   ✓ Volta para FlexibleGradeSelector
   ✓ customSelection salvo

8. Adicionar ao carrinho
   ✓ flexibleGradeMode: 'custom'
   ✓ customGradeSelection com itens
   ✓ Preço calculado corretamente
```

**Resultado Esperado:** ✅ Montagem personalizada completa

---

## 🎯 TESTE 5: Sistema de Precificação

### **5.1 Preços com Tiers**

**Passos:**
```
1. Configurar loja com "Atacado Gradativo"
2. Criar produto com grade flexível
3. Configurar tiers:
   - Tier 1 (Varejo): 1-5 pares = R$ 30,00
   - Tier 2 (Atacarejo): 6-11 pares = R$ 28,00
   - Tier 3 (Atacado): 12+ pares = R$ 25,00

4. No catálogo, selecionar Meia Grade (12 pares):
   ✓ Deve aplicar Tier 3 (R$ 25,00/par)
   ✓ Se tem desconto de meia grade (10%):
     → Preço final: R$ 25,00 * 0,9 = R$ 22,50/par
   ✓ Total: R$ 22,50 * 12 = R$ 270,00

5. Ver "Próximo Tier Info":
   ✓ Não deve aparecer (já está no maior tier)

6. Selecionar Grade Completa (21 pares):
   ✓ Tier 3 aplicado
   ✓ Sem desconto de meia grade
   ✓ Total: R$ 25,00 * 21 = R$ 525,00

7. Selecionar Monte Sua Grade (8 pares):
   ✓ Tier 2 aplicado (R$ 28,00)
   ✓ Se tem ajuste de +R$ 2,00:
     → Preço: R$ 30,00/par
   ✓ Total: R$ 30,00 * 8 = R$ 240,00
   ✓ Ver próximo tier: "Faltam 4 pares para Tier 3"
```

**Resultado Esperado:** ✅ Tiers aplicados corretamente

---

### **5.2 Validação de Descontos**

**Passos:**
```
1. Grade com configuração:
   - allow_half_grade = true
   - half_grade_discount_percentage = 15
   - Preço base: R$ 40,00

2. Selecionar Meia Grade (10 pares):
   Cálculo esperado:
   - Base: R$ 40,00
   - Com desconto: R$ 40,00 * 0,85 = R$ 34,00
   - Total: R$ 34,00 * 10 = R$ 340,00
   
   ✓ Verificar se cálculo está correto
   ✓ Badge mostra "-15%"
   ✓ "Economia de R$ 60,00 vs grade completa"
```

**Resultado Esperado:** ✅ Descontos calculados corretamente

---

## 🎯 TESTE 6: Validações e Regras

### **6.1 Validação de Configuração**

**Passos:**
```
1. Criar grade flexível
2. Tentar configurar:
   - Percentual de meia grade: 80%
   ✓ Alert vermelho: "deve estar entre 25% e 75%"

3. Tentar:
   - Máximo de cores: 0
   ✓ Alert: "deve estar entre 1 e 10"

4. Tentar:
   - Desativar todos os modos
   ✓ Alert: "pelo menos um modo deve estar ativo"
```

**Resultado Esperado:** ✅ Validações funcionam

---

### **6.2 Validação de Seleção Customizada**

**Passos:**
```
1. No CustomGradeBuilder, tentar confirmar com:
   - Total: 2 pares (mínimo é 8)
   ✓ Botão "Confirmar" desabilitado
   ✓ Alert vermelho: "Quantidade mínima..."

2. Adicionar 5 cores diferentes (máximo é 3)
   ✓ Alert: "Máximo de 3 cores..."

3. Atingir mínimo correto
   ✓ Alert desaparece
   ✓ Botão "Confirmar" ativa
   ✓ Card resumo fica verde
```

**Resultado Esperado:** ✅ Validações impedem erros

---

## 🎯 TESTE 7: Banco de Dados

### **7.1 Verificar Persistência**

**SQL para testar:**
```sql
-- Verificar grade flexível salva
SELECT 
  id,
  grade_name,
  grade_color,
  is_grade,
  flexible_grade_config,
  grade_sale_mode
FROM product_variations
WHERE flexible_grade_config IS NOT NULL
LIMIT 5;
```

**Resultado Esperado:**
```json
{
  "flexible_grade_config": {
    "allow_full_grade": true,
    "allow_half_grade": true,
    "allow_custom_mix": true,
    "half_grade_percentage": 50,
    "half_grade_discount_percentage": 10,
    "custom_mix_min_pairs": 8,
    "custom_mix_max_colors": 3,
    ...
  }
}
```

---

### **7.2 Testar View Helper**

**SQL:**
```sql
SELECT * FROM v_flexible_grades
LIMIT 10;
```

**Resultado Esperado:**
- ✓ Mostra grades com configuração flexível
- ✓ Campos calculados corretos (allows_full, allows_half, etc)
- ✓ purchase_options_count correto (1, 2, ou 3)

---

## 🎯 TESTE 8: Fluxo End-to-End Completo

### **Cenário: Cliente Compra Meia Grade**

**Passos Completos:**
```
1. GESTOR: Cadastrar Produto
   → Configurar grade flexível
   → Habilitar meia grade com 10% desconto
   → Salvar

2. SISTEMA: Persistir no Banco
   → flexible_grade_config salvo
   → Validações SQL passam
   → Trigger não dispara erros

3. CLIENTE: Acessar Catálogo
   → Ver produto
   → Ver badge "Múltiplas Opções"

4. CLIENTE: Abrir Detalhes
   → Selecionar grade
   → FlexibleGradeSelector aparece
   → Ver 3 opções com preços

5. CLIENTE: Escolher Meia Grade
   → Card laranja selecionado
   → Preço com desconto mostrado
   → Alert com detalhes

6. CLIENTE: Adicionar ao Carrinho
   → useFlexibleGradePrice calcula preço
   → CartItem com flexibleGradeMode: 'half'
   → Preço correto no carrinho

7. CLIENTE: Finalizar Compra
   → Pedido criado
   → Dados corretos salvos
```

**Resultado Esperado:** ✅ Fluxo completo sem erros

---

## 🎯 TESTE 9: Performance

### **9.1 Teste de Carga**

**Passos:**
```
1. Criar produto com 10 grades diferentes
2. Cada grade com configuração flexível completa
3. Abrir produto no catálogo
   ✓ Tempo de carregamento < 1 segundo
   ✓ Sem travamentos

4. Trocar entre modos várias vezes
   ✓ Transições suaves
   ✓ Cálculos instantâneos (memoização)

5. No CustomGradeBuilder, adicionar/remover 20 itens
   ✓ Interface responsiva
   ✓ Sem lag
```

**Resultado Esperado:** ✅ Performance adequada

---

## 🎯 TESTE 10: Compatibilidade Regressiva

### **10.1 Grades Antigas (Sem Config Flexível)**

**Passos:**
```
1. Buscar produtos com grades antigas (sem flexible_grade_config)
2. Abrir no catálogo
   ✓ Funciona normalmente
   ✓ NÃO mostra badge "Múltiplas Opções"
   ✓ NÃO mostra FlexibleGradeSelector
   ✓ Comportamento tradicional mantido

3. Editar produto antigo
4. Adicionar configuração flexível
5. Salvar
   ✓ Agora passa a mostrar opções flexíveis
```

**Resultado Esperado:** ✅ 100% compatível com grades antigas

---

## 📊 RESUMO DE TESTES

### **Testes Críticos (Obrigatórios):**
- [ ] Teste 1.1: Criar novo produto com div expansível
- [ ] Teste 1.2: Editar produto com auto-save
- [ ] Teste 2.1: Configurar grade flexível (modo rápido)
- [ ] Teste 3.1: Copiar variação
- [ ] Teste 3.2: Adicionar grade similar
- [ ] Teste 4.1: Ver badge no catálogo
- [ ] Teste 4.2: Selecionar grade completa
- [ ] Teste 4.3: Selecionar meia grade
- [ ] Teste 4.4: Montar grade personalizada
- [ ] Teste 5.1: Preços com tiers corretos
- [ ] Teste 10.1: Compatibilidade com grades antigas

### **Testes Opcionais:**
- [ ] Teste 2.2: Modo avançado completo
- [ ] Teste 5.2: Validação de descontos
- [ ] Teste 6.1: Validação de configuração
- [ ] Teste 6.2: Validação de seleção
- [ ] Teste 7: Verificação de banco de dados
- [ ] Teste 8: Fluxo end-to-end completo
- [ ] Teste 9: Performance com muitas grades

---

## 🐛 CHECKLIST DE BUGS COMUNS

### **Ao Testar, Verificar:**

- [ ] Div expansível fecha corretamente (sem travar)
- [ ] Auto-save não dispara infinitamente
- [ ] Navegação entre tabs não perde dados
- [ ] Validações não bloqueiam salvamento desnecessariamente
- [ ] Badge "Múltiplas Opções" só aparece quando deve
- [ ] FlexibleGradeSelector só renderiza se tem config
- [ ] Preços calculados corretamente em todos os cenários
- [ ] SKU único gerado para grades similares
- [ ] Estoque não fica negativo
- [ ] Mobile funciona (scroll, touch, etc)

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

### **Mínimo para Produção:**

1. ✅ Div expansível abre/fecha sem erros
2. ✅ Auto-save funciona em edição
3. ✅ Copiar e Adicionar Similar funcionam
4. ✅ Grade flexível aparece no catálogo
5. ✅ Cliente consegue selecionar opções
6. ✅ Preços calculados corretamente
7. ✅ Compatível com grades antigas
8. ✅ 0 erros no console
9. ✅ 0 erros de lint
10. ✅ Mobile funciona básico

### **Ideal (100%):**

11. ⏳ Performance otimizada
12. ⏳ Todos os cenários de edge case testados
13. ⏳ Documentação de usuário criada
14. ⏳ Tour guiado funcional
15. ⏳ Analytics implementado

---

## 🚀 COMEÇAR TESTES

**Ordem Sugerida:**
1. Teste 1 (Div Expansível) - 5 min
2. Teste 3 (Copiar/Similar) - 5 min
3. Teste 2 (Grade Flexível Cadastro) - 10 min
4. Teste 4 (Catálogo) - 10 min
5. Teste 5 (Precificação) - 10 min
6. Teste 10 (Compatibilidade) - 5 min

**Total: ~45 minutos de testes**

---

**🎯 Pronto para começar os testes! Boa sorte! 🚀**

