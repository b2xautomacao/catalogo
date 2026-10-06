# Advanced Catalog Search & Product Intelligence Architecture

## 1. Overview
The Advanced Catalog Search subsystem provides multi-dimensional catalog exploration, fuzzy & text search, and deterministic diagnostics to aid store operators in maintaining catalog health and readiness.

## 2. Searchable Attributes
- **Product Entity:** Name, Description, SKU, Category, Material, Gender, Category Type, Price.
- **Variations Entity:** Name, Variation SKU, Color, Size.
- **Grades Entity:** Grade Template Name, Grade Snapshot Items (sizes/quantities).

## 3. Stock Semantics (Unit vs Pack)
Stock filtering recognizes physical equivalent units versus commercial packaging units:
- Unit variations are counted 1:1.
- Pack variations (e.g. Grade Alta = 13 pairs) are multiplied by pack size when computing total physical availability.
- Low stock filtering is evaluated against `stock_alert_threshold` (default: 5 units).

## 4. Deterministic Product Diagnostics (Operational Intelligence)
Products are categorized by deterministic operational health indicators:
- `sem_imagem`: No active or primary product image.
- `sem_preco`: Retail price is zero or missing.
- `sem_estoque`: Total physical stock is zero.
- `baixo_estoque`: Total physical stock is positive but below alert threshold.
- `sem_sku`: Missing product SKU.
- `variacao_incompleta`: Simple variation missing size or color attributes.
- `grade_sem_estoque`: Product with attached grade where pack stock is zero.

## 5. MCP Tool: `buscar_catalogo`
Enforces strict schema validation (prohibiting arbitrary SQL injection), session tenant isolation, and granular pagination.
