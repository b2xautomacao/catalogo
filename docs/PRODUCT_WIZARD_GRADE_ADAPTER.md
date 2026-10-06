# B2XCATALOGO — Product Wizard Grade Adapter & Template Integration
## Documento Arquitetural e de Integração — Sprint 10.1

### 1. Visão Geral

A Sprint 10.1 conecta o formulário de configuração de grades do Wizard ([`GradeConfigurationForm.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/components/products/wizard/GradeConfigurationForm.tsx)) ao domínio normalizado de templates de grade do banco de dados ([`grade_templates`](file:///e:/projetos/B2XCATALOGO/catalogo/src/types/grade.ts) e [`grade_template_items`](file:///e:/projetos/B2XCATALOGO/catalogo/src/types/grade.ts)), eliminando a dependência de constantes estáticas hardcoded no React.

---

### 2. Arquitetura da Camada de Domínio

```text
┌────────────────────────────────────────────────────────┐
│               GradeConfigurationForm.tsx               │
│          (Interface Familiar do Wizard)                │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             src/lib/gradeDomainAdapter.ts              │
│  • templateToWizardGrade(template)                     │
│  • wizardGradeToTemplateItems(configs)                 │
│  • calculateTemplateTotal / calculateWizardGradeTotal  │
│  (Camada Pura: Sem business logic de nomes ou switches)│
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│           src/hooks/useGradeTemplates.tsx              │
│  • Carrega system templates (is_system = true)         │
│  • Carrega custom templates da loja autenticada        │
│  • RLS & Tenant Isolation                              │
│  • Derivação dinâmica de total_units                   │
│  • createCustomTemplate() com refetch imediato         │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                 Supabase Database                      │
│  • grade_templates                                     │
│  • grade_template_items                                │
└────────────────────────────────────────────────────────┘
```

---

### 3. Componentes Criados e Modificados

| Arquivo | Tipo | Responsabilidade |
| :--- | :--- | :--- |
| [`src/types/grade.ts`](file:///e:/projetos/B2XCATALOGO/catalogo/src/types/grade.ts) | Novo | Definições de tipo para `GradeTemplate`, `GradeTemplateItem`, `SizePairConfig` e `CreateCustomTemplateInput`. |
| [`src/lib/gradeDomainAdapter.ts`](file:///e:/projetos/B2XCATALOGO/catalogo/src/lib/gradeDomainAdapter.ts) | Novo | Funções de conversão bidirecional entre registros normalizados e estado de formulário do wizard. |
| [`src/hooks/useGradeTemplates.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/hooks/useGradeTemplates.tsx) | Novo | Hook React com suporte a RLS, carregamento de modelos do sistema e da loja, e persistência de modelos customizados. |
| [`src/components/products/wizard/GradeConfigurationForm.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/components/products/wizard/GradeConfigurationForm.tsx) | Modificado | Substituição do array hardcoded por `useGradeTemplates()`, mantendo 100% da identidade visual, suporte a Curva ABC e opção discreta de "Salvar como modelo da loja". |
| [`src/integrations/supabase/types.ts`](file:///e:/projetos/B2XCATALOGO/catalogo/src/integrations/supabase/types.ts) | Modificado | Inclusão dos tipos de schema para `grade_templates` e `grade_template_items`. |
| [`src/lib/__tests__/gradeDomainAdapter.test.ts`](file:///e:/projetos/B2XCATALOGO/catalogo/src/lib/__tests__/gradeDomainAdapter.test.ts) | Novo | Testes unitários para conversão, derivação de total (13 pares na Grade Alta, 8 na Grade Baixa) e ordenação por posição. |

---

### 4. Garantias de Não-Regressão

1. **Zero Migrations & Zero Schema Changes**: Nenhuma migration foi criada ou necessária nesta sprint.
2. **Zero Alterações de Estoque & Preços**: O ledger de estoque e price tiers continuam intocados para suas respectivas fases.
3. **Persistência Legada Preservada**: A geração de variações para o produto (`useProductVariations.saveVariations`) permanece intacta nesta Sprint 10.1 (a geração atômica de snapshots ocorrerá na Sprint 10.2).
4. **Isolamento Multitenant (RLS)**: Templates de sistema são globais; templates customizados são visíveis apenas pela loja dona.
