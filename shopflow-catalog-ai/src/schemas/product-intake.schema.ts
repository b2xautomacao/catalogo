import { z } from 'zod';

export const ObterPoliticaCadastroProdutoSchema = z.object({}).strict();

export const ObterDefaultsCadastroProdutoSchema = z.object({}).strict();

export const AtualizarDefaultsCadastroProdutoSchema = z
  .object({
    default_min_wholesale_qty: z
      .number()
      .int()
      .min(1, 'Quantidade mínima de atacado padrão deve ser maior ou igual a 1')
      .nullable()
      .optional()
      .describe('Quantidade mínima padrão para aplicar preço de atacado'),
    auto_generate_sku: z
      .boolean()
      .optional()
      .describe('Se verdadeiro, gera SKU automaticamente caso não informado'),
    auto_generate_slug: z
      .boolean()
      .optional()
      .describe('Se verdadeiro, gera slug automaticamente caso não informado'),
    auto_generate_seo: z
      .boolean()
      .optional()
      .describe('Se verdadeiro, gera título e descrição SEO factuais automaticamente'),
    auto_set_first_image_primary: z
      .boolean()
      .optional()
      .describe('Se verdadeiro, define a primeira imagem como principal automaticamente'),
    inventory_import_mode: z
      .enum(['initial_balance', 'increase'])
      .optional()
      .describe('Modo de lançamento no ledger para estoques vindos de importação'),
    unknown_category_policy: z
      .enum(['ask', 'block'])
      .optional()
      .describe('Política para categorias não encontradas (ask: solicitar decisão, block: rejeitar)'),
  })
  .strict();

export const PrepararProdutoSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional().describe('Nome do produto'),
    nome: z.string().trim().min(1).max(255).optional().describe('Alias para nome do produto'),
    product: z.string().trim().min(1).max(255).optional().describe('Alias para nome do produto'),
    produto: z.string().trim().min(1).max(255).optional().describe('Alias para nome do produto'),

    retail_price: z.number().min(0).optional().describe('Preço de venda no varejo'),
    price: z.number().min(0).optional().describe('Alias para preço de varejo'),
    preco: z.number().min(0).optional().describe('Alias para preço de varejo'),
    preço: z.number().min(0).optional().describe('Alias para preço de varejo'),
    valor: z.number().min(0).optional().describe('Alias para preço de varejo'),

    wholesale_price: z.number().min(0).nullable().optional().describe('Preço de venda no atacado'),
    atacado: z.number().min(0).nullable().optional().describe('Alias para preço de atacado'),
    preco_atacado: z.number().min(0).nullable().optional().describe('Alias para preço de atacado'),
    preço_atacado: z.number().min(0).nullable().optional().describe('Alias para preço de atacado'),

    min_wholesale_qty: z.number().int().min(1).nullable().optional().describe('Quantidade mínima de atacado'),
    qtd_atacado: z.number().int().min(1).nullable().optional().describe('Alias para quantidade mínima de atacado'),
    min_atacado: z.number().int().min(1).nullable().optional().describe('Alias para quantidade mínima de atacado'),
    moq: z.number().int().min(1).nullable().optional().describe('Alias para MOQ'),

    category: z.string().trim().min(1).max(100).optional().describe('Nome da categoria'),
    categoria: z.string().trim().min(1).max(100).optional().describe('Alias para categoria'),
    category_id: z.string().uuid().optional().describe('UUID da categoria na loja ativa'),

    stock: z.number().int().min(0).optional().describe('Intenção de estoque inicial'),
    estoque: z.number().int().min(0).optional().describe('Alias para estoque inicial'),
    quantidade: z.number().int().min(0).optional().describe('Alias para quantidade de estoque'),
    qty: z.number().int().min(0).optional().describe('Alias para estoque'),

    sku: z.string().trim().max(100).optional().describe('Código SKU do produto'),
    description: z.string().trim().max(2000).optional().describe('Descrição comercial do produto'),
    descricao: z.string().trim().max(2000).optional().describe('Alias para descrição'),
    material: z.string().trim().max(100).optional().describe('Material ou composição'),
    product_gender: z.enum(['masculino', 'feminino', 'unissex', 'infantil']).optional().describe('Gênero do produto'),
    genero: z.enum(['masculino', 'feminino', 'unissex', 'infantil']).optional().describe('Alias para gênero'),
    gênero: z.enum(['masculino', 'feminino', 'unissex', 'infantil']).optional().describe('Alias para gênero'),
    product_category_type: z.enum(['calcado', 'roupa_superior', 'roupa_inferior', 'acessorio']).optional().describe('Tipo de categoria'),
    tipo: z.enum(['calcado', 'roupa_superior', 'roupa_inferior', 'acessorio']).optional().describe('Alias para tipo'),
    seo_slug: z.string().trim().max(255).optional().describe('Slug amigável para URL'),
    meta_title: z.string().trim().max(255).optional().describe('Título SEO'),
    meta_description: z.string().trim().max(500).optional().describe('Descrição SEO'),
    image_url: z.string().url().optional().describe('URL da imagem do produto'),
    imagem: z.string().url().optional().describe('Alias para URL da imagem'),
  })
  .passthrough();

export const AnalisarImportacaoProdutosSchema = z
  .object({
    products: z
      .array(z.record(z.string(), z.any()))
      .min(1, 'O lote deve conter pelo menos 1 produto para análise')
      .max(100, 'O lote não pode exceder 100 produtos por requisição')
      .describe('Lista de produtos com campos livres, aliases de CSV ou JSON canônico'),
    import_id: z
      .string()
      .trim()
      .max(100)
      .optional()
      .describe('Identificador opcional do lote de importação'),
  })
  .strict();
