# 📊 Sistema de Importação em Massa - VendeMais

## 🎯 Objetivo

Implementar sistema de cadastro de produtos em massa via planilha Excel, permitindo importação rápida e eficiente de produtos com variações, preços por tier e configurações completas.

## 📋 Estrutura da Planilha Base

### Aba: PRODUTOS

| Campo                    | Tipo    | Obrigatório | Descrição                  | Exemplo               |
| ------------------------ | ------- | ----------- | -------------------------- | --------------------- |
| Nome\*                   | Texto   | SIM         | Nome do produto            | Camiseta Básica       |
| Descrição                | Texto   | NÃO         | Descrição detalhada        | Camiseta 100% algodão |
| Categoria\*              | Texto   | SIM         | Nome da categoria          | Roupas                |
| Preço Varejo\*           | Decimal | SIM         | Preço unitário             | 29.90                 |
| Preço Atacarejo          | Decimal | NÃO         | Preço para atacarejo       | 25.90                 |
| Qtd Atacarejo            | Inteiro | NÃO         | Qtd mínima atacarejo       | 5                     |
| Preço Atacado Pequeno    | Decimal | NÃO         | Preço atacado pequeno      | 22.90                 |
| Qtd Atacado Pequeno      | Inteiro | NÃO         | Qtd mínima atacado pequeno | 10                    |
| Preço Atacado Grande     | Decimal | NÃO         | Preço atacado grande       | 19.90                 |
| Qtd Atacado Grande       | Inteiro | NÃO         | Qtd mínima atacado grande  | 20                    |
| Estoque\*                | Inteiro | SIM         | Quantidade em estoque      | 100                   |
| SKU                      | Texto   | NÃO         | Código único               | CAM001                |
| Código de Barras         | Texto   | NÃO         | Código de barras           | 7891234567890         |
| Peso (kg)                | Decimal | NÃO         | Peso do produto            | 0.2                   |
| Largura (cm)             | Decimal | NÃO         | Largura                    | 20                    |
| Altura (cm)              | Decimal | NÃO         | Altura                     | 30                    |
| Comprimento (cm)         | Decimal | NÃO         | Comprimento                | 2                     |
| Ativo                    | Texto   | NÃO         | SIM/NÃO                    | SIM                   |
| Destaque                 | Texto   | NÃO         | SIM/NÃO                    | NÃO                   |
| Permite Estoque Negativo | Texto   | NÃO         | SIM/NÃO                    | NÃO                   |
| Tags                     | Texto   | NÃO         | Tags separadas por vírgula | básica,algodão        |
| Observações              | Texto   | NÃO         | Observações adicionais     | Produto básico        |

### Aba: CATEGORIAS

| Campo     | Tipo    | Obrigatório | Descrição              |
| --------- | ------- | ----------- | ---------------------- |
| Nome\*    | Texto   | SIM         | Nome da categoria      |
| Descrição | Texto   | NÃO         | Descrição da categoria |
| Ativo     | Texto   | NÃO         | SIM/NÃO                |
| Ordem     | Inteiro | NÃO         | Ordem de exibição      |

### Aba: VARIACOES

| Campo           | Tipo    | Obrigatório | Descrição           |
| --------------- | ------- | ----------- | ------------------- |
| Produto SKU\*   | Texto   | SIM         | SKU do produto      |
| Tamanho         | Texto   | NÃO         | Tamanho da variação |
| Cor             | Texto   | NÃO         | Cor da variação     |
| Estoque         | Inteiro | NÃO         | Estoque da variação |
| Preço Adicional | Decimal | NÃO         | Preço adicional     |
| Ativo           | Texto   | NÃO         | SIM/NÃO             |

## 🤖 Agente IA para Processamento

### Funcionalidades do Agente:

1. **Validação de Dados**: Verificar formato, obrigatoriedade e consistência
2. **Normalização**: Padronizar dados (preços, textos, etc.)
3. **Mapeamento**: Converter dados da planilha para formato do sistema
4. **Criação de Relacionamentos**: Vincular produtos, categorias e variações
5. **Upload de Imagens**: Associar imagens aos produtos
6. **Relatório de Erros**: Listar problemas encontrados

## 🛠️ Implementação Técnica

### 1. **Backend - API de Importação**

```typescript
// Endpoints necessários:
POST /api/import/products/validate - Validar planilha
POST /api/import/products/process - Processar importação
GET /api/import/products/status/:id - Status da importação
GET /api/import/products/template - Download template
```

### 2. **Frontend - Interface de Importação**

- Upload de planilha
- Preview dos dados
- Configurações de importação
- Progresso em tempo real
- Relatório de resultados

### 3. **Processamento Assíncrono**

- Queue de processamento
- Validação em lotes
- Rollback em caso de erro
- Logs detalhados

## 📁 Estrutura de Arquivos

```
src/
├── components/
│   └── products/
│       ├── BulkImportModal.tsx
│       ├── ImportProgress.tsx
│       └── ImportResults.tsx
├── hooks/
│   └── useBulkImport.tsx
├── services/
│   └── bulkImportService.ts
└── utils/
    ├── excelParser.ts
    └── productValidator.ts
```

## 🔄 Fluxo de Importação

1. **Upload da Planilha**

   - Validação de formato (.xlsx)
   - Verificação de estrutura
   - Preview dos dados

2. **Validação**

   - Dados obrigatórios
   - Formato de preços
   - Existência de categorias
   - Unicidade de SKUs

3. **Processamento**

   - Criação de categorias
   - Criação de produtos
   - Criação de variações
   - Upload de imagens

4. **Resultado**
   - Relatório de sucesso/erro
   - Produtos criados
   - Produtos com problemas

## 🎨 Interface do Usuário

### Modal de Importação:

- Drag & drop da planilha
- Configurações de importação
- Preview dos dados
- Botão de iniciar importação

### Tela de Progresso:

- Barra de progresso
- Status atual
- Logs em tempo real
- Botão de cancelar

### Tela de Resultados:

- Resumo da importação
- Lista de produtos criados
- Lista de erros
- Opções de download

## 🔧 Configurações de Importação

### Opções Disponíveis:

- **Modo de Importação**: Criar novo / Atualizar existente
- **Tratamento de Erros**: Parar no erro / Continuar ignorando
- **Upload de Imagens**: Automático / Manual
- **Validação de Estoque**: Permitir negativo / Bloquear
- **Criação de Categorias**: Automática / Manual

## 📊 Relatórios e Logs

### Relatório de Importação:

- Total de produtos processados
- Produtos criados com sucesso
- Produtos com erros
- Tempo de processamento
- Categorias criadas
- Variações criadas

### Logs Detalhados:

- Cada operação realizada
- Erros encontrados
- Warnings
- Tempo de cada etapa

## 🚀 Próximos Passos

1. **Criar template da planilha**
2. **Implementar parser Excel**
3. **Criar validador de dados**
4. **Desenvolver interface de upload**
5. **Implementar processamento assíncrono**
6. **Criar sistema de relatórios**
7. **Testes e validação**

## 💡 Benefícios Esperados

- **Redução de 90%** no tempo de cadastro
- **Padronização** dos dados
- **Menos erros** de digitação
- **Facilidade** para migração de outros sistemas
- **Escalabilidade** para grandes volumes
