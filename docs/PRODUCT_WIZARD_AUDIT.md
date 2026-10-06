# B2XCATALOGO — Product Wizard Audit & Incremental Integration Plan
**Documento Arquitetural — Sprint 10**
**Status:** AUDITED / MAPPED / ACTIONABLE PLAN
**Data:** 05/10/2026

---

## 1. Executive Summary

A **Sprint 10** estabelece a auditoria arquitetural profunda e o plano de integração incremental do **Wizard de Cadastro e Edição de Produtos** (`PremiumProductWizard`) no ecossistema B2XCATALOGO.

O objetivo central desta auditoria é responder de forma inequívoca e com base em evidências de código:
> *Como incorporar as novas capacidades de Grade Normalizada (`grade_templates`, `product_grade_snapshots`), Ledger de Inventário (`stock_movements`, `apply_stock_adjustment`) e Precificação Multinível (`product_price_tiers`) ao fluxo atual sem provocar uma mudança brusca para o usuário e sem quebrar produtos existentes?*

### Princípio Fundamental: Existing Wizard First
- **Nenhum redesign radical**: A experiência de 5 passos do `PremiumProductWizard` é mantida.
- **Zero quebras para produtos simples**: O fluxo para lojistas que vendem produtos unitários simples continua exatamente igual e sem atrito.
- **Camada de Adaptação (Adapter Layer)**: O wizard converte seu estado de tela em chamadas para o backend normalizado, preservando a interface familiar e a compatibilidade retroativa.

---

## 2. Current Wizard Routes & Entry Points

O catálogo opera como uma Single Page Application (SPA) React com rotas gerenciadas pelo `react-router-dom`:

| Rota / Ponto de Entrada | Componente | Descrição |
| :--- | :--- | :--- |
| `/products` ou `/admin/products` | [`ProductsPage.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/components/products/ProductsPage.tsx) | Página principal de listagem e gestão de catálogo. Dispara o modal do wizard. |
| Botão `"Novo Produto"` | `handleNewProduct` | Abre [`PremiumProductWizard`](file:///e:/projetos/B2XCATALOGO/catalogo/src/components/products/PremiumProductWizard.tsx) com `editingProduct = null`. |
| Ação `"Editar"` no card/tabela | `handleEdit(product)` | Abre `PremiumProductWizard` com `editingProduct = product`. |
| Ação `"Duplicar"` | `handleDuplicate(product)` | Executa `duplicateProduct` em `useProducts.tsx`, clonando produto e variações. |
| Ação `"Gerenciar Estoque"` | `handleManageStock(product)` | Abre [`ProductStockManagerModal.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/components/products/ProductStockManagerModal.tsx). |

---

## 3. Current Wizard Steps

O wizard ativo em produção (`PremiumProductWizard`) organiza o cadastro em **5 etapas sequenciais**:

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                        PremiumProductWizard (Dialog)                       │
├──────────────┬──────────────┬──────────────┬───────────────┬───────────────┤
│   Passo 0    │   Passo 1    │   Passo 2    │    Passo 3    │    Passo 4    │
│ Informações  │    Oferta    │ Precificação │    Imagens    │  Search (SEO) │
│              │ (Variações & │ (Varejo /    │    & Vídeo    │               │
│              │    Grade)    │   Atacado)   │               │               │
└──────────────┴──────────────┴──────────────┴───────────────┴───────────────┘
```

### Detalhamento por Etapa:

1. **Passo 0 — Informações Básicas** ([`BasicInfoStep.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/components/products/wizard/premium/BasicInfoStep.tsx)):
   - **Campos**: Nome (`name`), Categoria (`category`), Tipo de produto (`product_category_type`: `calcado`, `roupa_superior`, `roupa_inferior`, `acessorio`), Gênero (`product_gender`: `masculino`, `feminino`, `unissex`, `infantil`), Material (`material`), Descrição (`description`), Tabela de medidas (`measurements`), Instruções de cuidado (`care_instructions`).
   - **Recursos**: Geração de texto, medidas e cuidados via IA (`ai-content-generator` edge function) e templates em `localStorage`.
   - **Validação de Avanço**: Requer preenchimento obrigatório de `name`.

2. **Passo 1 — Oferta (Variações & Grade)** ([`VariationsStep.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/components/products/wizard/premium/VariationsStep.tsx)):
   - **Seletor de Estratégia (`variationType`)**:
     - `none` (produto simples)
     - `color_only` (apenas cores)
     - `size_only` (apenas tamanhos)
     - `material_only` (apenas materiais)
     - `color_size` (matriz cor × tamanho)
     - `color_material` (matriz cor × material)
     - `grade_system` (sistema de caixas/grades para calçados/atacado)
   - **Seletor de Grade**: Aciona [`UnifiedGradeManager.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/components/products/wizard/UnifiedGradeManager.tsx) e [`GradeConfigurationForm.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/components/products/wizard/GradeConfigurationForm.tsx).
   - **Gerenciador de Pares**: Configura tamanhos e quantidades por caixa (`sizePairConfigs`).
   - **Preview e Estoque Rápido**: Permite editar estoque individual ou em lote (`bulkStock`).

3. **Passo 2 — Precificação** ([`PricingStep.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/components/products/wizard/premium/PricingStep.tsx)):
   - **Preços Base**: Varejo (`retail_price`), Atacado (`wholesale_price`), Quantidade Mínima de Atacado (`min_wholesale_qty`).
   - **Preços de Grade**: Campo dedicado `grade_price` para cada variação de grade com indicador de amostragem `R$ / par`.
   - **Ajuste por Variação Simples**: Campo `price_adjustment` em relação ao preço base.
   - **Estoque Agregado**: `stock` (estoque inicial total) e `stock_alert_threshold` (alerta de estoque baixo).

4. **Passo 3 — Imagens & Vídeo** ([`ImagesStep.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/components/products/wizard/premium/ImagesStep.tsx)):
   - **Galeria Multimídia**: Upload de até 10 fotos gerenciadas via [`DraftImagesContext.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/contexts/DraftImagesContext.tsx).
   - **Vínculo Cor ↔ Imagem**: Cada foto pode ser associada a uma cor específica (`color_association`).
   - **Foto de Capa**: Marcação de imagem primária (`isPrimary`).
   - **Vídeos**: Campo `video_url` para links do YouTube ou Vimeo.

5. **Passo 4 — Search (SEO)** ([`SEOStep.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/components/products/wizard/premium/SEOStep.tsx)):
   - **Campos**: `seo_slug`, `meta_title`, `meta_description`, `keywords`.
   - **Otimização IA**: Botão para gerar metatags completas via edge function.
   - **Preview do Google**: Simulação visual em tempo real do resultado de busca.

---

## 4. Form State Model & Context Architecture

O wizard utiliza gerenciamento de estado desacoplado em memória durante a navegação entre passos:

```text
┌────────────────────────────────────────────────────────┐
│               DraftImagesProvider (Context)            │
│  - draftImages: DraftImage[]                           │
│  - uploadAllImages(productId): Promise<string[]>       │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│         usePremiumProductWizard (React Hook State)      │
│  - currentStep: number (0..4)                          │
│  - formData: PremiumWizardFormData                     │
│  - updateFormData(updates: Partial<FormData>)          │
│  - saveProduct(editingProductId, uploadAllImages)      │
└────────────────────────────────────────────────────────┘
```

- **Fonte da Verdade em Rascunho**: O estado local do React (`formData` no hook `usePremiumProductWizard`).
- **Nenhum Rascunho no Banco de Dados**: Nenhuma mutação é enviada ao Supabase enquanto o usuário navega entre os passos 0, 1, 2, 3 e 4.
- **Imagens Temporárias**: Mantidas como `File` e `preview: URL.createObjectURL()` em memória até o momento da gravação final.

---

## 5. Create Flow (Criação de Produto)

```text
Usuário clica em "Concluir Cadastro" (Passo 4)
                      │
                      ▼
┌────────────────────────────────────────────────────────┐
│ 1. usePremiumProductWizard.saveProduct()               │
│    supabase.from("products").insert(productData)       │
│    → Retorna newProduct.id                             │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────┐
│ 2. uploadAllImages(newProduct.id)                      │
│    supabase.storage.from("product-images").upload(...) │
│    supabase.from("product_images").insert(...)         │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────┐
│ 3. useProductVariations.saveVariations()               │
│    supabase.from("product_variations").insert(...)     │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
              Toast de Sucesso & Recarregar Lista
```

---

## 6. Update Flow (Edição de Produto)

```text
Usuário clica em "Editar Produto"
                      │
                      ▼
┌────────────────────────────────────────────────────────┐
│ 1. useEffect popula formData com dados do produto      │
│ 2. loadExistingImages(editingProduct.id)               │
└─────────────────────┬──────────────────────────────────┘
                      │ Usuário altera campos e clica "Concluir"
                      ▼
┌────────────────────────────────────────────────────────┐
│ 3. supabase.from("products").update(productData)       │
│    .eq("id", editingProductId)                         │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────┐
│ 4. uploadAllImages(editingProductId) (novas fotos)     │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────┐
│ 5. useProductVariations.saveVariations()               │
│    DELETE FROM product_variations WHERE product_id=id  │
│    INSERT INTO product_variations (...)                │
└────────────────────────────────────────────────────────┘
```

> [!WARNING]
> **Ponto Crítico de Atenção**: O método `saveVariations` atual executa `DELETE + INSERT` em `product_variations`. Ao introduzir o vínculo canônico com `product_grade_snapshots.pack_variation_id`, esse comportamento deve ser atualizado para preservar ou reconciliar os IDs das variações existentes a fim de evitar desvincular o snapshot.

---

## 7. Grade Flow no Wizard Atual

O fluxo de grade é acionado no Passo 1 (`VariationsStep`) quando o usuário seleciona a opção `"Sistema de Grades"`:

```text
VariationsStep.tsx
       │
       ▼
UnifiedGradeManager.tsx
       │
       ▼
GradeConfigurationForm.tsx
  ├── 1. Seleciona Cores (useStoreColors)
  ├── 2. Seleciona Materiais (opcional)
  ├── 3. Seleciona Template (Grade Alta / Baixa / Custom)
  ├── 4. Ajusta pares por tamanho (sizePairConfigs)
  └── 5. Clica em "Gerar Grades"
```

---

## 8. Grade Alta & Grade Baixa no Código Atual

As grades padrão estão hardcoded no frontend no arquivo [`GradeConfigurationForm.tsx:L107-148`](file:///e:/projetos/B2XCATALOGO/catalogo/src/components/products/wizard/GradeConfigurationForm.tsx#L107-L148):

```typescript
const gradeTemplates = [
  {
    name: "Grade Baixa",
    sizes: ["35", "36", "37", "38", "39"],
    distribution: [1, 2, 2, 2, 1], // Total: 8 pares
  },
  {
    name: "Grade Alta",
    sizes: ["36", "37", "38", "39", "40", "41", "42"],
    distribution: [1, 2, 2, 3, 2, 2, 1], // Total: 13 pares
  },
  // ...
];
```

Também aparecem grades customizadas da loja carregadas via hook `useStoreGrades(storeId)` da tabela legada `store_grades`.

---

## 9. Custom Grade no Wizard Atual

Quando o usuário deseja uma grade diferente:
1. Ele pode selecionar um template existente e alterar as quantidades nos inputs numéricos (`adjustPairs` / `updateSizePair`).
2. Ele pode adicionar novos tamanhos clicando em `"Adicionar Tamanho"` (`addSizePair`).
3. Ele pode aplicar a `"Curva ABC"` (`generateOptimizedDistribution`), que distribui automaticamente os pares concentrando maior quantidade nos números centrais (ex: 38 e 39).
4. **Gap Atual**: A grade criada não oferece botão para "Salvar como Novo Modelo de Grade Reutilizável" na loja. Ela fica salva apenas como uma variação avulsa do produto.

---

## 10. Variation Flow & Compatibility Projection

Ao gerar as grades, `GradeConfigurationForm.tsx` constrói em memória objetos `ProductVariation`:

```typescript
const gradeVariation: ProductVariation = {
  id: `grade-${Date.now()}-${color}-${material}-${Math.random()}`,
  product_id: productId || "",
  color,
  material: material || undefined,
  hex_color: resolveColorHex(color),
  size: null,
  stock: totalPairsPerGrade,
  price_adjustment: 0,
  is_active: true,
  sku: uniqueSKU,
  is_grade: true,
  grade_name: `${gradeName} - ${color}`,
  grade_color: color,
  grade_sizes: sizePairConfigs.map((c) => c.size),
  grade_pairs: sizePairConfigs.map((c) => c.pairs),
  grade_quantity: totalPairsPerGrade,
};
```

Essas variações são salvas em `product_variations` com as colunas legadas `grade_sizes` e `grade_pairs` em formato `jsonb`.

---

## 11. Inventory Flow no Wizard Atual

### Onde o estoque é coletado:
1. **Passo 1 (`VariationsStep`)**: Campo `Estoque Rápido` (`bulkStock`) e input numérico individual por variação (`v.stock`).
2. **Passo 2 (`PricingStep`)**: Campo `Estoque Inicial Total` (`formData.stock`).
3. **Modal Externo (`ProductStockManagerModal.tsx`)**: Permite ajustar o campo `stock` de cada variação via mutação direta `supabase.from("product_variations").update({ stock: variation.newStock })`.

### Unidade de Medida na UI:
- No cadastro de grade, a UI exibe o estoque como um número simples, sem explicitar que o estoque da variação de grade representa **Caixas Fechadas** e que o estoque total do produto representa **Pares Físicos Equivalentes**.

---

## 12. Pricing Flow & Price Tiers Audit

### No Wizard Atual (`PricingStep.tsx`):
- **Varejo (`retail_price`)**: Preço unitário de venda ao consumidor.
- **Atacado Simples (`wholesale_price`)**: Preço diferenciado com quantidade mínima (`min_wholesale_qty`).
- **Preço da Grade (`grade_price`)**: Preço fixo por caixa completa da grade.
- **Ajuste Simples (`price_adjustment`)**: Acréscimo/desconto por tamanho/cor.

### Gap de Atacarejo (`product_price_tiers`):
- A tabela `product_price_tiers` e o componente [`ProductPriceTiersManager.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/components/products/ProductPriceTiersManager.tsx) existem no código, mas **não estão integrados no `PricingStep.tsx` do `PremiumProductWizard`**.
- O atacarejo progressivo (ex: 1 a 5 peças = R$ 100; 6 a 11 peças = R$ 85; 12+ peças = R$ 70) está indisponível no fluxo atual de cadastro rápido.

---

## 13. Hardcoded Rules & Constantes Encontradas

| Arquivo | Linha | Hardcode / Regra Estática | Impacto |
| :--- | :--- | :--- | :--- |
| [`GradeConfigurationForm.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/components/products/wizard/GradeConfigurationForm.tsx#L107-L148) | 107–148 | `const gradeTemplates = [{ name: "Grade Baixa", sizes: [...], distribution: [1,2,2,2,1] }, ...]` | Templates não utilizam `grade_templates` do backend. |
| [`VariationsStep.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/components/products/wizard/premium/VariationsStep.tsx#L45-L50) | 45–50 | `const sizeGrades = { calcado: ["33", ...], roupa: ["PP", ...], ... }` | Lista de tamanhos fixa por tipo de produto. |
| [`cartHelpers.ts`](file:///e:/projetos/B2XCATALOGO/catalogo/src/utils/cartHelpers.ts#L62) | 62 | `grade_price = preço FIXO da grade inteira` | Dependência de `product_variations.grade_price`. |
| [`useProductVariations.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/hooks/useProductVariations.tsx#L97-L101) | 97–101 | `DELETE FROM product_variations WHERE product_id = prodId` | Recriação destrutiva de variações ao editar. |

---

## 14. Direct Database Mutations Audit

| Arquivo | Linha | Operação | Classificação | Ação de Migração Recomendada |
| :--- | :--- | :--- | :--- | :--- |
| [`usePremiumProductWizard.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/hooks/usePremiumProductWizard.tsx#L175-L185) | 175–185 | `.from("products").insert/update(...)` | `SAFE` | Manter CRUD padrão com Tenant Guard. |
| [`useProductVariations.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/hooks/useProductVariations.tsx#L97-L156) | 97–156 | `.from("product_variations").delete().insert(...)` | `MUST MIGRATE` | Substituir por upsert atômico que preserve snapshot links. |
| [`ProductStockManagerModal.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/components/products/ProductStockManagerModal.tsx#L117-L120) | 117–120 | `.from("product_variations").update({ stock: ... })` | `MUST MIGRATE` | Substituir por `apply_stock_adjustment` RPC (Ledger). |
| [`GradeConfigurationForm.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/components/products/wizard/GradeConfigurationForm.tsx#L297-L322) | 297–322 | Criação de grade com `grade_sizes` e `grade_pairs` JSON | `MUST MIGRATE` | Criar `product_grade_snapshots` + `pack_variation_id`. |

---

## 15. Risk Matrix

| Área de Mudança | Risco | Justificativa | Estratégia de Mitigação |
| :--- | :---: | :--- | :--- |
| **Troca de UI do Wizard** | `HIGH` | Quebra fluxo de trabalho diário de lojistas em produção. | **NÃO FAZER**. Manter UI e botões idênticos. |
| **Substituição de DELETE em Variações** | `HIGH` | Risco de quebrar relações com pedidos ou snapshots. | Implementar Upsert reconciliador por ID/SKU. |
| **Migração de Estoque para Ledger** | `MEDIUM` | Lojista ajustando estoque diretamente sem passar por RPC. | Chamar `apply_stock_adjustment` com `operation_id` nos modais. |
| **Carregar Templates de `grade_templates`** | `LOW` | Substituir array estático por query da tabela de templates. | Hook `useGradeTemplates` com fallback para array estático. |
| **Geração de Snapshot na Aplicação** | `LOW` | Persistir snapshot sem alterar a projeção legada. | Transação atômica gerando snapshot + variação de compatibilidade. |
| **Inclusão de Price Tiers no Passo 2** | `LOW` | Nova seção colapsável no formulário de preços. | Componente opcional/progressivo sem obrigar preenchimento. |

---

## 16. Matriz de Integração de Domínio

| Capacidade | Wizard Atual | Backend Atual | Novo Domínio | Gap Identificado | Risco |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Produto Simples** | `BasicInfoStep` + `PricingStep` | `products` | `products` | Nenhum (perfeito). | `LOW` |
| **Varejo & Atacado** | `PricingStep` (inputs escalares) | `products` | `products` | Nenhum (perfeito). | `LOW` |
| **Atacarejo Progressivo** | Não exibido no wizard | `product_price_tiers` | `product_price_tiers` | Ausência no `PricingStep`. | `LOW` |
| **Grade Alta / Baixa** | Array hardcoded no frontend | `store_grades` (legado) | `grade_templates` (`is_system=true`) | Não consome templates do banco. | `LOW` |
| **Grade Customizada** | Formulário de pares avulso | `product_variations` JSON | `grade_templates` (`store_id`) | Não permite salvar modelo reutilizável. | `LOW` |
| **Snapshot de Grade** | Não cria snapshot | `product_variations` JSON | `product_grade_snapshots` + items | Falta criação atômica do snapshot. | `MEDIUM` |
| **Ajuste de Estoque** | `.update({ stock })` direto | `product_variations.stock` | `stock_movements` (RPC Ledger) | Mutações diretas sem auditoria no ledger. | `MEDIUM` |
| **Fotos por Cor** | `ImagesStep` (`color_association`) | `product_images` | `product_images` | Nenhum (funciona perfeitamente). | `LOW` |

---

## 17. Mapa de Componentes & Dependências

```text
src/components/products/
├── ProductsPage.tsx
│   ├── PremiumProductWizard.tsx
│   │   ├── DraftImagesContext.tsx (Provedor de Imagens Temporárias)
│   │   └── usePremiumProductWizard.tsx (Hook de Estado & Persistência)
│   │       ├── BasicInfoStep.tsx (Passo 0)
│   │       ├── VariationsStep.tsx (Passo 1)
│   │       │   ├── UnifiedGradeManager.tsx
│   │       │   │   └── GradeConfigurationForm.tsx
│   │       │   │       ├── useStoreGrades.tsx
│   │       │   │       ├── useStoreColors.tsx
│   │       │   │       ├── FlexibleGradeConfigForm.tsx
│   │       │   │       └── ColorPickerPopover.tsx
│   │       │   └── ColorPickerPopover.tsx
│   │       ├── PricingStep.tsx (Passo 2)
│   │       │   └── CurrencyInput.tsx
│   │       ├── ImagesStep.tsx (Passo 3)
│   │       └── SEOStep.tsx (Passo 4)
│   ├── ProductList.tsx
│   ├── ProductStockManagerModal.tsx
│   └── BulkStockModal.tsx
```

---

## 18. Estratégia de Leitura e Escrita Retrocompatível

### Estratégia de Leitura (Read Strategy):
```text
Ao abrir produto para edição:
  SE product_grade_snapshots existe para a variação (via pack_variation_id)
    → Carregar dados a partir do Snapshot e seus Itens
  SENÃO (produto legado)
    → Carregar dados a partir de product_variations.grade_sizes e grade_pairs
```

### Estratégia de Escrita (Write Strategy):
```text
Ao salvar novo produto com grade:
  1. Cria snapshot em product_grade_snapshots
  2. Cria itens em product_grade_snapshot_items (variation_id = null)
  3. Cria pack variation em product_variations (is_grade = true, grade_sizes, grade_pairs, stock = 0)
  4. Atualiza snapshot: pack_variation_id = pack_variation.id
  5. Mantém grade_sizes e grade_pairs populados na variação (Compatibility Projection)
```

---

## 19. Plano de Implementação Incremental (Fases Recomendadas)

A evolução do wizard deve ser executada em pequenas Sprints incrementais e estritamente seguras:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Sprint 10.1 — Grade Domain Adapter & Template Integration [INTEGRATED] │
│ • Hook useGradeTemplates() consumindo grade_templates / items do DB.   │
│ • Substituído array hardcoded em GradeConfigurationForm mantendo a UI. │
│ • Total derivado dinamicamente de grade_template_items (Grade Alta=13).│
│ • Opção "Salvar como Modelo da Loja" integrada ao fluxo personalizado. │
│ • Testes unitários do adapter & builds Frontend/MCP com 100% sucesso.  │
│ • Risco: BAIXO. Nenhuma mudança visual ou quebra de fluxo.             │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ Sprint 10.2 — Atomic Snapshot Generation & Reconciliation [INTEGRATED] │
│ • Implementado variationReconciliationService (diff não-destrutivo).   │
│ • Eliminado DELETE all -> INSERT all em useProductVariations.          │
│ • Preservação de IDs de variações existentes (UPDATE/UNCHANGED).       │
│ • Preservação de saldo de estoque existente contra sobrescrita de UI.  │
│ • Geração atômica de product_grade_snapshots + items + pack_variation. │
│ • Política de remoção segura (soft-deactivate com is_active = false    │
│   quando há dependências em stock_movements/snapshots/pedidos).        │
│ • Preflight gate atômico para custom templates (createCustomTemplate). │
│ • Projeção de compatibilidade (grade_sizes/pairs) 100% mantida.        │
│ • Risco mitigado: ALTO -> BAIXO. Zero perda de referências de banco.   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ Sprint 10.3 — Price Tiers Integration in PricingStep [INTEGRATED]      │
│ • Integrado priceTierDomainService (validação, normalização e diff).   │
│ • Seção colapsável de atacarejo com progressive disclosure.           │
│ • Suporte a 1..4 faixas progressivas (ex: 3+, 6+, 12+ peças).          │
│ • Cálculo dinâmico de desconto % relativo ao preço de varejo.          │
│ • Reconciliação não-destrutiva de product_price_tiers no save do wizard│
│ • Zero interferência no fluxo de produtos simples e atacado direto.    │
│ • Risco: BAIXO. 18/18 testes frontend + 103/103 MCP passing.           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ Sprint 10.4 — Inventory Ledger Integration in Stock UX [INTEGRATED]    │
│ • Eliminado direct write (UPDATE product_variations.stock).            │
│ • ProductStockManagerModal conectado à RPC apply_stock_adjustment.     │
│ • Suporte a operações increase (+), decrease (-), count (balanço).     │
│ • Distinção comercial vs física: Unit (pares/un) vs Pack (caixas).    │
│ • Grade Alta (13 pares/cx: 4 cx = 52 un) e Grade Baixa (8 pares/cx).  │
│ • Rastreabilidade completa com reason_code e operation_id idempotente. │
│ • Risco: BAIXO. 25/25 testes frontend + 103/103 MCP passing.           │
└──────────────────────────────────┬─────────────────────────────────────┘
```

---

## 20. Decisões Arquiteturais Registradas

1. **Manter o `PremiumProductWizard`**: É o wizard moderno em uso e com melhor arquitetura de steps e IA. Não há justificativa para substituí-lo.
2. **Adapter Layer**: O wizard não deve conter SQL ou chamadas diretas de banco espalhadas. Toda conversão de formato será isolada em adapters de domínio.
3. **Imutabilidade Preservada**: Produtos criados pelo wizard gerarão snapshots imutáveis, garantindo que alterações futuras em templates de loja não afetem o catálogo existente.
4. **Sem Migrations Destrutivas**: Todas as novas colunas e tabelas continuarão aditivas com retrocompatibilidade garantida.
