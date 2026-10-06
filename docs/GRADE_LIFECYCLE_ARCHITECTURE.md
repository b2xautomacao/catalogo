# GRADE LIFECYCLE & REPLACEMENT ARCHITECTURE

## 1. Princípio da Imutabilidade de Snapshots
Os `product_grade_snapshots` e seus `product_grade_snapshot_items` são **estritamente imutáveis**.
Nunca é executado um `UPDATE` destrutivo em snapshot_items de uma composição histórica ativa.

## 2. Tipos de Alteração em Grades
1. **Mudanças Não-Estruturais (Metadata Only)**:
   - Alteração de título de exibição, preço avulso ou SEO não geram novo snapshot.
2. **Mudanças Estruturais (Structural Composition Change)**:
   - Alteração de curva de tamanhos, proporção de pares por caixa ou substituição de template (ex: Grade Alta para Grade Baixa).
   - O snapshot anterior é arquivado (`is_active = false`, `replaced_by_snapshot_id = novo_snapshot.id`, `replaced_at = now()`).
   - Um novo snapshot ativo é gerado com `is_active = true`.

## 3. Segurança de Inventário em Substituição de Grade
- O estoque de uma grade antiga (ex: 5 caixas) **NUNCA** é transferido silenciosamente para uma nova composição.
- A nova grade inicia estritamente com `stock = 0`.
- O saldo anterior permanece associado ao histórico da grade anterior até que haja ajuste explícito de inventário.

## 4. Legacy Migration-on-Write
- Abrir e salvar um produto legado sem alterar sua grade preserva seu estado sem executar migrações automáticas indesejadas.
- Uma modificação explícita na grade aciona o gerador de snapshot normalizado.
