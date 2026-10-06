# VARIATION & COLOR MATRIX ARCHITECTURE

## 1. Visão Geral
A arquitetura de **Variation & Color Matrix** formaliza o domínio de variações do B2XCATALOGO separando estritamente:
- **Unit Variations (`is_grade = false`)**: representam itens vendáveis individuais físicos (ex: calçado `Preto / 38`, camisa `Azul / M`).
- **Pack Variations (`is_grade = true`)**: representam caixas fechadas / grades (ex: `Grade Alta / Preto`, `Grade Baixa / Branco`).

## 2. Matriz Canônica de Variações
A matriz é construída a partir do serviço canônico `buildVariationMatrix`:
- Eixo Y: Cores com seus respectivos hexadecimais canônicos.
- Eixo X: Tamanhos (suporta `34`, `38`, `PP`, `P`, `M`, `G`, `GG`, `Único`, etc.).
- Células: Mapeadas para o ID persistido da `product_variation`, preservando estoque, SKU e status ativo.

## 3. Mapeamento de Componentes de Grade (Snapshot Item Matching)
Ao gerar ou modificar um snapshot de grade, cada item do snapshot (`size`, `quantity`) é mapeado através de `resolveSnapshotComponentMapping`:
1. **Match Inequívoco**: Se exatamente uma Unit Variation compatível (`product_id`, `color`, `size`, `is_grade = false`) existir, o item de snapshot recebe `snapshot_item.variation_id = variation.id`.
2. **Missing Component**: Se nenhuma Unit Variation correspondente for encontrada, `variation_id = null`. O sistema **NUNCA** inventa variações unitárias fictícias.
3. **Ambiguous Component**: Se houver duplicidade cadastral, classifica o diagnóstico como `AMBIGUOUS_COMPONENT_VARIATION` e define `variation_id = null` para segurança transacional.
4. **Isolamento de Tenant / Produto**: É terminantemente proibido associar variações de outro produto ou outra loja (`store_id`).
