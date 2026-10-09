/**
 * MCP Documentation Registry — Single Source of Truth
 * Powers the interactive Docs Portal, Markdown Documentation Export, and Scoped AI Guide.
 */

export interface McpParameterDoc {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: any;
}

export interface McpToolDoc {
  name: string;
  category: 'catalog' | 'inventory' | 'grade' | 'store' | 'media';
  categoryLabel: string;
  requiredScope: string;
  description: string;
  whenToUse: string;
  riskTier: 'READ' | 'WRITE' | 'SENSITIVE_WRITE';
  parameters: McpParameterDoc[];
  outputDescription: string;
  errors: string[];
  exampleRequest: Record<string, any>;
  exampleResponse: Record<string, any>;
  securityNotes?: string;
  supportsIdempotency?: boolean;
}

export interface McpScopeDoc {
  scope: string;
  label: string;
  category: 'catalog' | 'stock' | 'grade' | 'store';
  categoryLabel: string;
  description: string;
  riskTier: 'READ' | 'WRITE' | 'SENSITIVE_WRITE';
  isTenantDefault?: boolean;
}

export interface McpErrorDoc {
  code: string;
  httpStatus: number;
  title: string;
  description: string;
  cause: string;
  solution: string;
  retryable: boolean;
}

export interface McpRateLimitDoc {
  tier: 'READ' | 'WRITE' | 'SENSITIVE_WRITE';
  label: string;
  limitPerMinute: number;
  description: string;
  tools: string[];
}

export const MCP_SCOPES: McpScopeDoc[] = [
  {
    scope: 'catalog:read',
    label: 'Consultar catálogo',
    category: 'catalog',
    categoryLabel: 'Catálogo de Produtos',
    description: 'Permite buscar, listar e consultar detalhes e variações de produtos.',
    riskTier: 'READ',
    isTenantDefault: true,
  },
  {
    scope: 'catalog:write',
    label: 'Criar e alterar produtos',
    category: 'catalog',
    categoryLabel: 'Catálogo de Produtos',
    description: 'Permite cadastrar novos produtos, editar metadados, desativar itens e atualizações em lote.',
    riskTier: 'WRITE',
  },
  {
    scope: 'stock:read',
    label: 'Consultar estoque',
    category: 'stock',
    categoryLabel: 'Estoque & Inventário',
    description: 'Permite verificar o saldo físico e comercial de produtos, variações e grades.',
    riskTier: 'READ',
    isTenantDefault: true,
  },
  {
    scope: 'stock:adjust',
    label: 'Ajustar estoque',
    category: 'stock',
    categoryLabel: 'Estoque & Inventário',
    description: 'Permite registrar entradas, saídas e contagens no ledger de inventário.',
    riskTier: 'SENSITIVE_WRITE',
  },
  {
    scope: 'grade:read',
    label: 'Consultar grades',
    category: 'grade',
    categoryLabel: 'Grades de Tamanho',
    description: 'Permite listar e inspecionar modelos de grade (Grade Alta, Baixa e Customizadas).',
    riskTier: 'READ',
    isTenantDefault: true,
  },
  {
    scope: 'grade:write',
    label: 'Criar e aplicar grades',
    category: 'grade',
    categoryLabel: 'Grades de Tamanho',
    description: 'Permite criar novos modelos de grade na loja e aplicar grades com snapshots imutáveis a produtos.',
    riskTier: 'SENSITIVE_WRITE',
  },
  {
    scope: 'store:list',
    label: 'Listar lojas disponíveis',
    category: 'store',
    categoryLabel: 'Contexto Multi-Loja (Super Admin)',
    description: 'Permite pesquisar e listar lojas autorizadas para a credencial.',
    riskTier: 'READ',
  },
  {
    scope: 'store:select',
    label: 'Selecionar loja ativa',
    category: 'store',
    categoryLabel: 'Contexto Multi-Loja (Super Admin)',
    description: 'Permite alternar a loja ativa da sessão para operações multi-tenant.',
    riskTier: 'WRITE',
  },
];

export const MCP_TOOLS: McpToolDoc[] = [
  {
    name: 'catalog_health',
    category: 'catalog',
    categoryLabel: 'Catálogo',
    requiredScope: 'catalog:read',
    description: 'Verifica a conectividade e saúde do runtime do catálogo.',
    whenToUse: 'Antes de iniciar sessões operacionais para confirmar que o serviço e o banco estão acessíveis.',
    riskTier: 'READ',
    parameters: [],
    outputDescription: 'Status de saúde com conectividade do banco e modo de autenticação.',
    errors: ['INVALID_CREDENTIAL', 'SCOPE_DENIED'],
    exampleRequest: {},
    exampleResponse: {
      ok: true,
      database: 'reachable',
      authenticated: true,
      principalType: 'tenant',
      storeContext: true,
    },
  },
  {
    name: 'listar_produtos',
    category: 'catalog',
    categoryLabel: 'Catálogo',
    requiredScope: 'catalog:read',
    description: 'Lista produtos da loja ativa com paginação e filtros opcionais.',
    whenToUse: 'Para obter listas paginadas de produtos por status ou nome.',
    riskTier: 'READ',
    parameters: [
      { name: 'nome', type: 'string', required: false, description: 'Filtro parcial por nome do produto.' },
      { name: 'sku', type: 'string', required: false, description: 'Filtro exato por SKU.' },
      { name: 'ativo', type: 'boolean', required: false, description: 'Filtrar por produtos ativos ou inativos.' },
      { name: 'limit', type: 'number', required: false, description: 'Limite de itens (padrão 20, máximo 50).' },
      { name: 'offset', type: 'number', required: false, description: 'Deslocamento da paginação.' },
    ],
    outputDescription: 'Array com produtos resumidos da loja ativa.',
    errors: ['STORE_CONTEXT_REQUIRED', 'SCOPE_DENIED'],
    exampleRequest: { limit: 10, ativo: true },
    exampleResponse: [
      {
        id: '9f243026-6136-4d04-bf76-749e7bdf5e27',
        name: 'Sandália Rasteira Elegance',
        sku: 'RAS-001',
        retail_price: 89.9,
        wholesale_price: 59.9,
        stock: 45,
        is_active: true,
      },
    ],
  },
  {
    name: 'obter_produto',
    category: 'catalog',
    categoryLabel: 'Catálogo',
    requiredScope: 'catalog:read',
    description: 'Retorna a ficha completa de um produto, incluindo imagens e variações.',
    whenToUse: 'Para inspecionar todas as cores, tamanhos, fotos e estoque de um produto específico.',
    riskTier: 'READ',
    parameters: [
      { name: 'id', type: 'string (UUID)', required: true, description: 'ID do produto no catálogo.' },
    ],
    outputDescription: 'Objeto completo do produto com lista de variações e imagens.',
    errors: ['PRODUCT_NOT_FOUND', 'STORE_CONTEXT_REQUIRED', 'SCOPE_DENIED'],
    exampleRequest: { id: '9f243026-6136-4d04-bf76-749e7bdf5e27' },
    exampleResponse: {
      id: '9f243026-6136-4d04-bf76-749e7bdf5e27',
      name: 'Sandália Rasteira Elegance',
      retail_price: 89.9,
      stock: 45,
      variations: [
        { id: 'v1', color: 'Preto', size: '36', stock: 12, sku: 'RAS-001-36' },
      ],
      images: [{ id: 'img1', image_url: 'https://...', is_primary: true }],
    },
  },
  {
    name: 'buscar_catalogo',
    category: 'catalog',
    categoryLabel: 'Catálogo',
    requiredScope: 'catalog:read',
    description: 'Busca textual avançada em produtos, variações, cores, tamanhos e grades.',
    whenToUse: 'Para pesquisas flexíveis de clientes ou agentes procurando por termos, modelos ou atributos.',
    riskTier: 'READ',
    parameters: [
      { name: 'query', type: 'string', required: false, description: 'Termo de pesquisa (nome, sku, cor, tamanho).' },
      { name: 'category', type: 'string', required: false, description: 'Filtro por categoria.' },
      { name: 'in_stock_only', type: 'boolean', required: false, description: 'Filtrar somente produtos com estoque positivo.' },
      { name: 'has_grade', type: 'boolean', required: false, description: 'Filtrar somente produtos com grade fechada.' },
      { name: 'color', type: 'string', required: false, description: 'Filtro por cor.' },
      { name: 'size', type: 'string', required: false, description: 'Filtro por tamanho.' },
      { name: 'limit', type: 'number', required: false, description: 'Limite de resultados (máximo 50).' },
    ],
    outputDescription: 'Resultados de busca enriquecidos com destaques.',
    errors: ['STORE_CONTEXT_REQUIRED', 'SCOPE_DENIED'],
    exampleRequest: { query: 'rasteira preto 36', in_stock_only: true },
    exampleResponse: {
      total: 1,
      items: [{ id: '9f243026-...', name: 'Sandália Rasteira Elegance', stock: 45 }],
    },
  },
  {
    name: 'criar_produto',
    category: 'catalog',
    categoryLabel: 'Catálogo',
    requiredScope: 'catalog:write',
    description: 'Cadastra um produto comercialmente completo na loja ativa com preflight de completude, resolução de categoria, inferência de tipo/gênero, validação de atacado (MOQ), slug automático e SEO factual.',
    whenToUse: 'Para criação segura e completa de novos produtos por IAs. Se faltarem decisões comerciais obrigatórias (como gênero em perfumes ou MOQ em preço de atacado), retorna status "needs_input" com as perguntas necessárias antes de persistir.',
    riskTier: 'WRITE',
    parameters: [
      { name: 'name', type: 'string', required: true, description: 'Nome do produto.' },
      { name: 'retail_price', type: 'number', required: true, description: 'Preço de varejo unitário.' },
      { name: 'category', type: 'string', required: false, description: 'Nome da categoria cadastrada no catálogo da loja ativa.' },
      { name: 'category_id', type: 'string (UUID)', required: false, description: 'UUID da categoria na loja ativa.' },
      { name: 'wholesale_price', type: 'number', required: false, description: 'Preço de atacado (se informado, exige min_wholesale_qty).' },
      { name: 'min_wholesale_qty', type: 'number', required: false, description: 'Quantidade mínima para o preço de atacado.' },
      { name: 'product_gender', type: 'string (enum)', required: false, description: 'Gênero: "masculino", "feminino", "unissex" ou "infantil".' },
      { name: 'product_category_type', type: 'string (enum)', required: false, description: 'Tipo: "calcado", "roupa_superior", "roupa_inferior" ou "acessorio".' },
      { name: 'material', type: 'string', required: false, description: 'Composição de material.' },
      { name: 'description', type: 'string', required: false, description: 'Descrição textual do produto.' },
      { name: 'sku', type: 'string', required: false, description: 'Código SKU único na loja.' },
      { name: 'seo_slug', type: 'string', required: false, description: 'Slug amigável (auto-derivado com unicidade se omitido).' },
      { name: 'meta_title', type: 'string', required: false, description: 'Título SEO (auto-derivado se omitido).' },
      { name: 'meta_description', type: 'string', required: false, description: 'Descrição SEO factual (auto-derivada se omitida).' },
    ],
    outputDescription: 'Retorna status "created" com o produto completo e próximas ações sugeridas, ou "needs_input" com perguntas pontuais caso faltem decisões obrigatórias.',
    errors: ['CATEGORY_NOT_FOUND', 'CATEGORY_AMBIGUOUS', 'SKU_ALREADY_EXISTS', 'STORE_CONTEXT_REQUIRED', 'SCOPE_DENIED'],
    exampleRequest: {
      name: 'Perfume Rose Noir',
      retail_price: 259,
      wholesale_price: 189,
      min_wholesale_qty: 6,
      category: 'Perfumes',
      product_gender: 'unissex',
    },
    exampleResponse: {
      status: 'created',
      created: true,
      product: {
        id: 'uuid-gerado',
        name: 'Perfume Rose Noir',
        category: 'Perfumes',
        category_id: 'uuid-cat-perfumes',
        product_category_type: 'acessorio',
        product_gender: 'unissex',
        retail_price: 259,
        wholesale_price: 189,
        min_wholesale_qty: 6,
        seo_slug: 'perfume-rose-noir',
        meta_title: 'Perfume Rose Noir | Perfumes no Catálogo',
        meta_description: 'Perfume Rose Noir disponível por R$ 259.00. Confira no catálogo.',
        is_active: true,
      },
      next_actions: ['adicionar_imagem_produto', 'ajustar_estoque'],
    },
  },
  {
    name: 'atualizar_produto',
    category: 'catalog',
    categoryLabel: 'Catálogo',
    requiredScope: 'catalog:write',
    description: 'Atualiza informações cadastrais de um produto existente.',
    whenToUse: 'Para editar preços, descrições ou categorias de um item cadastrado.',
    riskTier: 'WRITE',
    parameters: [
      { name: 'product_id', type: 'string (UUID)', required: true, description: 'ID do produto a ser alterado.' },
      { name: 'name', type: 'string', required: false, description: 'Novo nome do produto.' },
      { name: 'retail_price', type: 'number', required: false, description: 'Novo preço de varejo.' },
      { name: 'wholesale_price', type: 'number', required: false, description: 'Novo preço de atacado.' },
      { name: 'description', type: 'string', required: false, description: 'Nova descrição.' },
      { name: 'sku', type: 'string', required: false, description: 'Novo SKU.' },
    ],
    outputDescription: 'Objeto atualizado do produto.',
    errors: ['PRODUCT_NOT_FOUND', 'NO_CHANGES_PROVIDED', 'SCOPE_DENIED'],
    exampleRequest: { product_id: 'uuid-prod', retail_price: 139.9 },
    exampleResponse: { id: 'uuid-prod', retail_price: 139.9, is_active: true },
  },
  {
    name: 'desativar_produto',
    category: 'catalog',
    categoryLabel: 'Catálogo',
    requiredScope: 'catalog:write',
    description: 'Desativa um produto com exclusão lógica segura (soft delete).',
    whenToUse: 'Quando um item não deve mais ser exibido aos clientes mas seu histórico deve ser preservado.',
    riskTier: 'WRITE',
    parameters: [
      { name: 'product_id', type: 'string (UUID)', required: true, description: 'ID do produto a desativar.' },
    ],
    outputDescription: 'Confirmação de desativação do produto.',
    errors: ['PRODUCT_NOT_FOUND', 'SCOPE_DENIED'],
    exampleRequest: { product_id: 'uuid-prod' },
    exampleResponse: { deactivated: true, alreadyInactive: false, product: { id: 'uuid-prod', is_active: false } },
  },
  {
    name: 'atualizar_produtos_em_lote',
    category: 'catalog',
    categoryLabel: 'Catálogo',
    requiredScope: 'catalog:write',
    description: 'Atualiza múltiplos produtos de forma transacional com allowlist estrita e idempotência.',
    whenToUse: 'Para reajustes em lote de preços, categorias ou status de até 100 produtos.',
    riskTier: 'SENSITIVE_WRITE',
    supportsIdempotency: true,
    parameters: [
      { name: 'product_ids', type: 'string[] (UUIDs)', required: true, description: 'Lista de IDs dos produtos (máximo 100).' },
      { name: 'updates', type: 'object', required: true, description: 'Campos permitidos: is_active, category, retail_price, wholesale_price, etc.' },
      { name: 'operation_id', type: 'string', required: true, description: 'Identificador único da operação para garantir idempotência.' },
    ],
    outputDescription: 'Relatório estruturado da operação em lote.',
    errors: ['LIMIT_EXCEEDED', 'UNALLOWED_BULK_FIELD', 'SCOPE_DENIED'],
    exampleRequest: {
      product_ids: ['uuid-1', 'uuid-2'],
      updates: { is_active: true },
      operation_id: 'bulk-reajuste-2026-10-07-001',
    },
    exampleResponse: { success: true, updated_count: 2, failed_count: 0 },
  },
  {
    name: 'consultar_estoque',
    category: 'inventory',
    categoryLabel: 'Estoque',
    requiredScope: 'stock:read',
    description: 'Consulta saldo físico, comercial e status de reconciliação de um produto ou variação.',
    whenToUse: 'Para checar disponibilidade física exata antes de confirmar vendas ou propor reposições.',
    riskTier: 'READ',
    parameters: [
      { name: 'product_id', type: 'string (UUID)', required: true, description: 'ID do produto.' },
      { name: 'variation_id', type: 'string (UUID)', required: false, description: 'ID da variação ou caixa de grade (opcional).' },
    ],
    outputDescription: 'Saldo comercial, saldo físico agregado e status de reconciliação.',
    errors: ['INVENTORY_TARGET_NOT_FOUND', 'SCOPE_DENIED'],
    exampleRequest: { product_id: 'uuid-prod', variation_id: 'uuid-var' },
    exampleResponse: {
      product_id: 'uuid-prod',
      current_stock: 10,
      physical_stock: 130,
      unit_kind: 'pack',
      reconciliation_status: 'synced',
    },
  },
  {
    name: 'ajustar_estoque',
    category: 'inventory',
    categoryLabel: 'Estoque',
    requiredScope: 'stock:adjust',
    description: 'Aplica ajuste no ledger de estoque (increase, decrease ou count) com garantia de idempotência.',
    whenToUse: 'Para registrar entrada de mercadoria, saída manual ou balanço físico de inventário.',
    riskTier: 'SENSITIVE_WRITE',
    supportsIdempotency: true,
    parameters: [
      { name: 'product_id', type: 'string (UUID)', required: true, description: 'ID do produto alvo.' },
      { name: 'operation', type: 'string (increase | decrease | count)', required: true, description: 'Tipo de operação.' },
      { name: 'quantity', type: 'number', required: false, description: 'Quantidade para increase/decrease (maior que 0).' },
      { name: 'counted_quantity', type: 'number', required: false, description: 'Quantidade física contada para count.' },
      { name: 'variation_id', type: 'string (UUID)', required: false, description: 'ID da variação ou caixa de grade.' },
      { name: 'reason', type: 'string', required: true, description: 'Código do motivo (ex: inventory_count, receipt, loss).' },
      { name: 'operation_id', type: 'string', required: true, description: 'Chave de idempotência única.' },
      { name: 'notes', type: 'string', required: false, description: 'Observações do ajuste.' },
    ],
    outputDescription: 'Resultado do ajuste com novo saldo e rastreamento físico de componentes.',
    errors: ['INSUFFICIENT_STOCK', 'IDEMPOTENCY_CONFLICT', 'INVALID_STOCK_OPERATION', 'SCOPE_DENIED'],
    exampleRequest: {
      product_id: 'uuid-prod',
      operation: 'increase',
      quantity: 5,
      reason: 'receipt',
      operation_id: 'ajuste-nf-10928',
    },
    exampleResponse: { applied: true, previous_stock: 10, current_stock: 15, delta: 5 },
  },
  {
    name: 'listar_modelos_grade',
    category: 'grade',
    categoryLabel: 'Grades',
    requiredScope: 'grade:read',
    description: 'Lista modelos de grade disponíveis (Grade Alta, Grade Baixa e modelos customizados da loja).',
    whenToUse: 'Para inspecionar as composições de pares por caixa antes de aplicar a produtos.',
    riskTier: 'READ',
    parameters: [
      { name: 'query', type: 'string', required: false, description: 'Filtro por nome do modelo.' },
      { name: 'type', type: 'string (system | custom | all)', required: false, description: 'Filtro por tipo de modelo.' },
    ],
    outputDescription: 'Lista de modelos com total de unidades e metadados.',
    errors: ['STORE_CONTEXT_REQUIRED', 'SCOPE_DENIED'],
    exampleRequest: { type: 'all' },
    exampleResponse: [
      { id: 'uuid-alta', name: 'Grade Alta', is_system: true, total_units: 13 },
      { id: 'uuid-baixa', name: 'Grade Baixa', is_system: true, total_units: 8 },
    ],
  },
  {
    name: 'obter_modelo_grade',
    category: 'grade',
    categoryLabel: 'Grades',
    requiredScope: 'grade:read',
    description: 'Retorna a composição completa de tamanhos e quantidades de um modelo de grade.',
    whenToUse: 'Para conhecer a distribuição detalhada de pares (ex: 36:1, 37:2, 38:2, 39:3, 40:2, 41:2, 42:1).',
    riskTier: 'READ',
    parameters: [
      { name: 'grade_template_id', type: 'string (UUID)', required: true, description: 'ID do modelo de grade.' },
    ],
    outputDescription: 'Ficha do modelo com array ordenado de itens (tamanho e quantidade).',
    errors: ['GRADE_TEMPLATE_NOT_FOUND', 'SCOPE_DENIED'],
    exampleRequest: { grade_template_id: 'uuid-alta' },
    exampleResponse: {
      id: 'uuid-alta',
      name: 'Grade Alta',
      total_units: 13,
      items: [{ size: '36', quantity: 1 }, { size: '37', quantity: 2 }, { size: '38', quantity: 2 }],
    },
  },
  {
    name: 'criar_modelo_grade',
    category: 'grade',
    categoryLabel: 'Grades',
    requiredScope: 'grade:write',
    description: 'Cria um novo modelo de grade personalizado exclusivo da loja.',
    whenToUse: 'Quando a loja trabalha com uma proporção de caixas não atendida pelas grades padrão.',
    riskTier: 'WRITE',
    parameters: [
      { name: 'name', type: 'string', required: true, description: 'Nome do modelo customizado.' },
      { name: 'items', type: 'object[]', required: true, description: 'Distribuição de tamanhos: [{ size: "38", quantity: 3 }]' },
      { name: 'product_category_type', type: 'string', required: false, description: 'Tipo de produto (padrão calcado).' },
    ],
    outputDescription: 'Modelo de grade customizado criado e pronto para uso.',
    errors: ['GRADE_TEMPLATE_ALREADY_EXISTS', 'TEMPLATE_ITEMS_REQUIRED', 'SCOPE_DENIED'],
    exampleRequest: {
      name: 'Grade Especial 10 Pares',
      items: [{ size: '37', quantity: 4 }, { size: '38', quantity: 4 }, { size: '39', quantity: 2 }],
    },
    exampleResponse: { id: 'uuid-custom', name: 'Grade Especial 10 Pares', total_units: 10 },
  },
  {
    name: 'aplicar_grade_produto',
    category: 'grade',
    categoryLabel: 'Grades',
    requiredScope: 'grade:write',
    description: 'Aplica um modelo de grade a um produto, gerando pack variation e snapshot imutável.',
    whenToUse: 'Para disponibilizar vendas em caixas fechadas com garantia de histórico imutável.',
    riskTier: 'SENSITIVE_WRITE',
    parameters: [
      { name: 'product_id', type: 'string (UUID)', required: true, description: 'ID do produto.' },
      { name: 'template_id', type: 'string (UUID)', required: true, description: 'ID do modelo de grade a aplicar.' },
      { name: 'color', type: 'string', required: true, description: 'Cor da grade (ex: Preto, Branco).' },
      { name: 'name', type: 'string', required: false, description: 'Título comercial da grade (padrão Grade).' },
      { name: 'sku', type: 'string', required: false, description: 'SKU da caixa de grade.' },
      { name: 'grade_price', type: 'number', required: false, description: 'Preço da caixa fechada.' },
    ],
    outputDescription: 'Confirmação do snapshot imutável e da pack variation gerada.',
    errors: ['PRODUCT_NOT_FOUND', 'GRADE_ITEMS_REQUIRED', 'SCOPE_DENIED'],
    exampleRequest: {
      product_id: 'uuid-prod',
      template_id: 'uuid-alta',
      color: 'Preto',
      grade_price: 778.7,
    },
    exampleResponse: {
      snapshot_id: 'uuid-snap',
      pack_variation_id: 'uuid-var',
      total_units: 13,
      stock: 0,
    },
  },
  {
    name: 'buscar_lojas',
    category: 'store',
    categoryLabel: 'Lojas',
    requiredScope: 'store:list',
    description: 'Pesquisa lojas autorizadas para o agente (recurso Multi-Loja / Super Admin).',
    whenToUse: 'Em integrações globais de administração para localizar lojas por nome ou slug.',
    riskTier: 'READ',
    parameters: [
      { name: 'query', type: 'string', required: false, description: 'Termo de busca (nome ou slug da loja).' },
    ],
    outputDescription: 'Lista de lojas autorizadas.',
    errors: ['STORE_NOT_FOUND', 'SCOPE_DENIED'],
    exampleRequest: { query: 'calcados' },
    exampleResponse: { matches: [{ id: 'store-1', name: 'Calçados Matriz' }], count: 1 },
  },
  {
    name: 'selecionar_loja',
    category: 'store',
    categoryLabel: 'Lojas',
    requiredScope: 'store:select',
    description: 'Define a loja ativa na sessão atual do agente para operações subsequentes.',
    whenToUse: 'Obrigatório para credenciais multi-loja antes de operar catálogo ou estoque.',
    riskTier: 'WRITE',
    parameters: [
      { name: 'store_id', type: 'string (UUID)', required: true, description: 'ID da loja autorizada a ativar.' },
    ],
    outputDescription: 'Confirmação da ativação da loja na sessão.',
    errors: ['STORE_NOT_FOUND', 'STORE_ACCESS_DENIED', 'SCOPE_DENIED'],
    exampleRequest: { store_id: 'store-1' },
    exampleResponse: { selected: true, activeStoreId: 'store-1', storeName: 'Calçados Matriz' },
  },
  {
    name: 'obter_loja_ativa',
    category: 'store',
    categoryLabel: 'Lojas',
    requiredScope: 'store:list',
    description: 'Informa qual loja está atualmente selecionada no contexto da sessão.',
    whenToUse: 'Para diagnosticar o contexto operacional ativo do agente.',
    riskTier: 'READ',
    parameters: [],
    outputDescription: 'Dados da loja ativa ou indicação de ausência de contexto.',
    errors: ['SCOPE_DENIED'],
    exampleRequest: {},
    exampleResponse: { hasActiveStore: true, activeStoreId: 'store-1', storeName: 'Calçados Matriz' },
  },
  {
    name: 'adicionar_imagem_produto',
    category: 'media',
    categoryLabel: 'Imagens e Mídia',
    requiredScope: 'catalog:write',
    description: 'Adiciona com segurança uma imagem ao produto a partir de uma source_url HTTPS externa. O servidor faz download, valida integridade/MIME e armazena no storage oficial.',
    whenToUse: 'Após criar um produto ou quando o usuário solicitar adicionar foto/imagem ao produto.',
    riskTier: 'WRITE',
    supportsIdempotency: true,
    parameters: [
      { name: 'product_id', type: 'string (UUID)', required: true, description: 'ID do produto no catálogo.' },
      { name: 'source_url', type: 'string (HTTPS URL)', required: true, description: 'URL externa segura contendo a imagem (JPG, PNG ou WebP).' },
      { name: 'alt_text', type: 'string', required: false, description: 'Texto alternativo para acessibilidade/SEO.' },
      { name: 'is_primary', type: 'boolean', required: false, description: 'Se verdadeiro, define esta imagem como a capa principal do produto.' },
      { name: 'position', type: 'number', required: false, description: 'Posição de exibição da imagem (1 a 10).' },
      { name: 'color', type: 'string', required: false, description: 'Cor ou variação associada à imagem.' },
      { name: 'operation_id', type: 'string', required: false, description: 'Identificador único de idempotência para retentativas seguras.' },
    ],
    outputDescription: 'Objeto com a imagem criada e indicador se foi repetição idempotente.',
    errors: [
      'IMAGE_SOURCE_INVALID',
      'IMAGE_SOURCE_FORBIDDEN',
      'IMAGE_DOWNLOAD_FAILED',
      'IMAGE_TOO_LARGE',
      'IMAGE_TYPE_NOT_SUPPORTED',
      'IMAGE_INVALID',
      'IMAGE_UPLOAD_FAILED',
      'PRODUCT_NOT_FOUND',
      'IDEMPOTENCY_CONFLICT',
      'SCOPE_DENIED',
      'STORE_CONTEXT_REQUIRED',
    ],
    exampleRequest: {
      product_id: '9f243026-6136-4d04-bf76-749e7bdf5e27',
      source_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800',
      alt_text: 'Frasco de perfume elegante',
      is_primary: true,
      operation_id: 'media-op-001',
    },
    exampleResponse: {
      image: {
        id: 'img-123',
        product_id: '9f243026-6136-4d04-bf76-749e7bdf5e27',
        image_url: 'https://uytkhyqwikdpplwsesoz.supabase.co/storage/v1/object/public/product-images/products/9f243026-6136-4d04-bf76-749e7bdf5e27/uuid.webp',
        alt_text: 'Frasco de perfume elegante',
        is_primary: true,
        image_order: 1,
        color_association: null,
      },
      duplicate: false,
    },
  },
  {
    name: 'listar_imagens_produto',
    category: 'media',
    categoryLabel: 'Imagens e Mídia',
    requiredScope: 'catalog:read',
    description: 'Lista todas as imagens cadastradas para um produto específico da loja ativa.',
    whenToUse: 'Para inspecionar as fotos existentes de um produto antes ou após alterações de mídia.',
    riskTier: 'READ',
    parameters: [
      { name: 'product_id', type: 'string (UUID)', required: true, description: 'ID do produto no catálogo.' },
    ],
    outputDescription: 'Array com todas as imagens sanitizadas do produto.',
    errors: ['PRODUCT_NOT_FOUND', 'SCOPE_DENIED', 'STORE_CONTEXT_REQUIRED'],
    exampleRequest: { product_id: '9f243026-6136-4d04-bf76-749e7bdf5e27' },
    exampleResponse: [
      {
        id: 'img-123',
        product_id: '9f243026-6136-4d04-bf76-749e7bdf5e27',
        image_url: 'https://uytkhyqwikdpplwsesoz.supabase.co/storage/v1/object/public/product-images/products/9f243026-6136-4d04-bf76-749e7bdf5e27/uuid.webp',
        alt_text: 'Frasco de perfume elegante',
        is_primary: true,
        image_order: 1,
        color_association: null,
      },
    ],
  },
  {
    name: 'definir_imagem_principal',
    category: 'media',
    categoryLabel: 'Imagens e Mídia',
    requiredScope: 'catalog:write',
    description: 'Define uma imagem existente como a imagem principal (capa de exibição) do produto.',
    whenToUse: 'Para alternar a imagem de destaque do produto.',
    riskTier: 'WRITE',
    parameters: [
      { name: 'product_id', type: 'string (UUID)', required: true, description: 'ID do produto no catálogo.' },
      { name: 'image_id', type: 'string (UUID)', required: true, description: 'ID da imagem que será promovida a principal.' },
    ],
    outputDescription: 'Objeto de sucesso e dados da imagem promovida.',
    errors: ['PRODUCT_NOT_FOUND', 'IMAGE_NOT_FOUND', 'SCOPE_DENIED', 'STORE_CONTEXT_REQUIRED'],
    exampleRequest: {
      product_id: '9f243026-6136-4d04-bf76-749e7bdf5e27',
      image_id: 'img-123',
    },
    exampleResponse: {
      success: true,
      image: {
        id: 'img-123',
        product_id: '9f243026-6136-4d04-bf76-749e7bdf5e27',
        image_url: 'https://uytkhyqwikdpplwsesoz.supabase.co/storage/v1/object/public/product-images/products/9f243026-6136-4d04-bf76-749e7bdf5e27/uuid.webp',
        is_primary: true,
        image_order: 1,
      },
    },
  },
  {
    name: 'remover_imagem_produto',
    category: 'media',
    categoryLabel: 'Imagens e Mídia',
    requiredScope: 'catalog:write',
    description: 'Remove persistentemente uma imagem do produto e do Object Storage canônico.',
    whenToUse: 'Para excluir fotos antigas, desnecessárias ou incorretas do produto.',
    riskTier: 'WRITE',
    parameters: [
      { name: 'product_id', type: 'string (UUID)', required: true, description: 'ID do produto no catálogo.' },
      { name: 'image_id', type: 'string (UUID)', required: true, description: 'ID da imagem a ser removida.' },
    ],
    outputDescription: 'Confirmação de remoção e novo ID de imagem principal, se promovido.',
    errors: ['PRODUCT_NOT_FOUND', 'IMAGE_NOT_FOUND', 'SCOPE_DENIED', 'STORE_CONTEXT_REQUIRED'],
    exampleRequest: {
      product_id: '9f243026-6136-4d04-bf76-749e7bdf5e27',
      image_id: 'img-123',
    },
    exampleResponse: {
      removed: true,
      image_id: 'img-123',
      new_primary_id: null,
    },
  },
  {
    name: 'obter_politica_cadastro_produto',
    category: 'catalog',
    categoryLabel: 'Catálogo',
    requiredScope: 'catalog:read',
    description: 'Consulta a política canônica de intake e cadastro de produtos da loja ativa.',
    whenToUse: 'Antes de realizar cadastros para descobrir campos obrigatórios, deriváveis, defaults do lojista e regras estritas de não-invenção.',
    riskTier: 'READ',
    parameters: [],
    outputDescription: 'Contrato estruturado da política de cadastro (required, conditional, derivable, tenant_defaults, never_invent, decision_policy).',
    errors: ['STORE_CONTEXT_REQUIRED', 'SCOPE_DENIED'],
    exampleRequest: {},
    exampleResponse: {
      required: ['name', 'retail_price', 'category'],
      conditional: {
        min_wholesale_qty: 'Obrigatório se atacado for informado (salvo se tenant default existir)',
      },
      derivable: ['sku', 'seo_slug', 'meta_title', 'meta_description'],
      never_invent: ['brand', 'volume', 'technical_specifications', 'material', 'gender', 'wholesale_minimum'],
    },
  },
  {
    name: 'obter_defaults_cadastro_produto',
    category: 'catalog',
    categoryLabel: 'Catálogo',
    requiredScope: 'catalog:read',
    description: 'Consulta as preferências e valores padrão (Tenant Defaults) configurados pelo lojista para cadastro de produtos.',
    whenToUse: 'Para conhecer a quantidade mínima de atacado padrão e regras de automação ativas.',
    riskTier: 'READ',
    parameters: [],
    outputDescription: 'Configurações de defaults do tenant (default_min_wholesale_qty, auto_generate_sku, auto_generate_slug, etc.).',
    errors: ['STORE_CONTEXT_REQUIRED', 'SCOPE_DENIED'],
    exampleRequest: {},
    exampleResponse: {
      default_min_wholesale_qty: 6,
      auto_generate_sku: true,
      auto_generate_slug: true,
      auto_generate_seo: true,
      auto_set_first_image_primary: true,
      inventory_import_mode: 'initial_balance',
      unknown_category_policy: 'ask',
    },
  },
  {
    name: 'atualizar_defaults_cadastro_produto',
    category: 'catalog',
    categoryLabel: 'Catálogo',
    requiredScope: 'catalog:write',
    description: 'Atualiza as configurações de valores padrão (Tenant Defaults) para cadastro de produtos na loja ativa.',
    whenToUse: 'Para definir quantidade mínima de atacado padrão (ex: 6 peças) ou ajustar políticas de importação.',
    riskTier: 'WRITE',
    parameters: [
      { name: 'default_min_wholesale_qty', type: 'number', required: false, description: 'Quantidade mínima de atacado padrão.' },
      { name: 'auto_generate_sku', type: 'boolean', required: false, description: 'Gerar SKU automaticamente se omitido.' },
      { name: 'auto_generate_slug', type: 'boolean', required: false, description: 'Gerar slug automaticamente se omitido.' },
      { name: 'auto_generate_seo', type: 'boolean', required: false, description: 'Gerar SEO factual automaticamente se omitido.' },
    ],
    outputDescription: 'Confirmação e dados atualizados dos defaults do tenant.',
    errors: ['STORE_CONTEXT_REQUIRED', 'SCOPE_DENIED'],
    exampleRequest: { default_min_wholesale_qty: 6 },
    exampleResponse: { status: 'updated', defaults: { default_min_wholesale_qty: 6 } },
  },
  {
    name: 'preparar_produto',
    category: 'catalog',
    categoryLabel: 'Catálogo',
    requiredScope: 'catalog:read',
    description: 'Executa preflight e preparação de cadastro de produto a partir de texto livre ou dados básicos, SEM PERSISTIR no banco.',
    whenToUse: 'Sempre que o usuário enviar uma descrição livre ou dados soltos de um produto, para verificar o que falta antes de salvar.',
    riskTier: 'READ',
    parameters: [
      { name: 'name', type: 'string', required: false, description: 'Nome do produto (ou alias nome/produto).' },
      { name: 'retail_price', type: 'number', required: false, description: 'Preço de varejo (ou alias preco/valor).' },
      { name: 'wholesale_price', type: 'number', required: false, description: 'Preço de atacado (opcional).' },
      { name: 'category', type: 'string', required: false, description: 'Nome da categoria (ou alias categoria).' },
      { name: 'stock', type: 'number', required: false, description: 'Intenção de estoque inicial (não grava diretamente).' },
    ],
    outputDescription: 'Objeto de status (ready, needs_input ou blocked), dados comerciais resolvidos e intenção de estoque.',
    errors: ['STORE_CONTEXT_REQUIRED', 'SCOPE_DENIED'],
    exampleRequest: {
      name: 'Perfume Rose Noir',
      retail_price: 259,
      wholesale_price: 189,
      category: 'Perfumes',
    },
    exampleResponse: {
      status: 'needs_input',
      decisions: [
        { field: 'product_gender', decision: 'ask', question: 'Este perfume é feminino, masculino ou unissex?' },
      ],
    },
  },
  {
    name: 'analisar_importacao_produtos',
    category: 'catalog',
    categoryLabel: 'Catálogo',
    requiredScope: 'catalog:read',
    description: 'Analisa e prepara um lote de produtos (CSV/planilha/ERP, máx. 100 itens) sem persistir, agrupando decisões repetitivas.',
    whenToUse: 'Para importações em massa e planilhas, identificando produtos prontos e perguntas consolidadas.',
    riskTier: 'READ',
    parameters: [
      { name: 'products', type: 'array de objetos', required: true, description: 'Lista de produtos com aliases ou formato canônico.' },
      { name: 'import_id', type: 'string', required: false, description: 'Identificador opcional do lote.' },
    ],
    outputDescription: 'Resumo estatístico (ready, needs_input, invalid), decisões agrupadas e lista de produtos prontos.',
    errors: ['STORE_CONTEXT_REQUIRED', 'SCOPE_DENIED', 'IMPORT_BATCH_TOO_LARGE'],
    exampleRequest: {
      products: [
        { produto: 'Perfume Rose Noir', preco: 259, atacado: 189, estoque: 10, categoria: 'Perfumes' },
      ],
    },
    exampleResponse: {
      summary: { total: 1, ready: 0, needs_input: 1, invalid: 0 },
      grouped_decisions: [],
      ready_products: [],
    },
  },
];

export const MCP_RATE_LIMITS: McpRateLimitDoc[] = [
  {
    tier: 'READ',
    label: 'Leitura',
    limitPerMinute: 120,
    description: 'Consultas de catálogo, listagens, busca e leitura de saldo de estoque.',
    tools: [
      'catalog_health',
      'listar_produtos',
      'obter_produto',
      'buscar_catalogo',
      'consultar_estoque',
      'listar_modelos_grade',
      'obter_modelo_grade',
      'buscar_lojas',
      'obter_loja_ativa',
      'listar_imagens_produto',
      'obter_politica_cadastro_produto',
      'obter_defaults_cadastro_produto',
      'preparar_produto',
      'analisar_importacao_produtos',
    ],
  },
  {
    tier: 'WRITE',
    label: 'Escrita',
    limitPerMinute: 60,
    description: 'Criação e edição de produtos individuais, modelos de grade e seleção de loja.',
    tools: [
      'criar_produto',
      'atualizar_produto',
      'desativar_produto',
      'criar_modelo_grade',
      'selecionar_loja',
      'adicionar_imagem_produto',
      'definir_imagem_principal',
      'remover_imagem_produto',
      'atualizar_defaults_cadastro_produto',
    ],
  },
  {
    tier: 'SENSITIVE_WRITE',
    label: 'Operações Sensíveis',
    limitPerMinute: 20,
    description: 'Ajustes transacionais de estoque, operações em lote e aplicação de grades.',
    tools: [
      'ajustar_estoque',
      'atualizar_produtos_em_lote',
      'aplicar_grade_produto',
    ],
  },
];

export const MCP_ERROR_CATALOG: McpErrorDoc[] = [
  {
    code: 'INVALID_CREDENTIAL',
    httpStatus: 401,
    title: 'Credencial Inválida ou Ausente',
    description: 'A chave de API informada no cabeçalho Authorization não existe, foi revogada ou expirou.',
    cause: 'Header de autenticação ausente, token malformado ou credencial revogada pelo lojista.',
    solution: 'Verifique se o token Bearer enviado corresponde a uma credencial ativa gerada no painel IA.',
    retryable: false,
  },
  {
    code: 'SCOPE_DENIED',
    httpStatus: 403,
    title: 'Permissão Insuficiente (Scope)',
    description: 'A credencial não possui a permissão requerida para invocar a ferramenta solicitada.',
    cause: 'Tentativa de executar ação de escrita (ex: ajustar_estoque) com credencial de leitura (stock:read).',
    solution: 'Crie ou utilize uma credencial com os scopes apropriados para a operação.',
    retryable: false,
  },
  {
    code: 'STORE_ACCESS_DENIED',
    httpStatus: 403,
    title: 'Acesso à Loja Não Autorizado',
    description: 'A credencial não possui permissão para acessar ou selecionar a loja solicitada.',
    cause: 'Tentativa de acessar store_id fora do conjunto autorizado da credencial.',
    solution: 'Selecione apenas lojas pertencentes à sua organização ou solicite permissão de Super Admin.',
    retryable: false,
  },
  {
    code: 'STORE_CONTEXT_REQUIRED',
    httpStatus: 400,
    title: 'Contexto de Loja Obrigatório',
    description: 'A ferramenta exige uma loja ativa selecionada na sessão antes da execução.',
    cause: 'Credencial multi-loja chamou ferramenta de catálogo sem antes executar selecionar_loja.',
    solution: 'Invoque primeiro selecionar_loja com o store_id desejado antes de operar o catálogo.',
    retryable: true,
  },
  {
    code: 'PRODUCT_NOT_FOUND',
    httpStatus: 404,
    title: 'Produto Não Encontrado',
    description: 'O ID do produto fornecido não existe na loja ativa atual.',
    cause: 'ID incorreto ou pertencente a outra loja (isolamento estrito multi-tenant).',
    solution: 'Utilize listar_produtos ou buscar_catalogo para obter o ID válido do produto.',
    retryable: false,
  },
  {
    code: 'INVENTORY_TARGET_NOT_FOUND',
    httpStatus: 404,
    title: 'Alvo de Estoque Não Encontrado',
    description: 'O produto ou variação especificada não foi encontrada na loja para consulta ou ajuste de estoque.',
    cause: 'Variation ID incorreto ou produto inexistente.',
    solution: 'Confirme os IDs de produto e variação antes de invocar consultar_estoque ou ajustar_estoque.',
    retryable: false,
  },
  {
    code: 'INSUFFICIENT_STOCK',
    httpStatus: 400,
    title: 'Estoque Insuficiente',
    description: 'A operação de diminuição resultaria em estoque negativo em um produto que não permite saldo negativo.',
    cause: 'Tentativa de diminuir mais unidades do que o saldo disponível com allow_negative_stock=false.',
    solution: 'Consulte o saldo disponível com consultar_estoque antes de emitir a baixa.',
    retryable: false,
  },
  {
    code: 'IDEMPOTENCY_CONFLICT',
    httpStatus: 409,
    title: 'Conflito de Idempotência',
    description: 'O operation_id enviado já foi utilizado anteriormente nesta loja com parâmetros diferentes.',
    cause: 'Reutilização indevida de operation_id para uma operação de negócio diferente.',
    solution: 'Nunca reutilize o mesmo operation_id com dados diferentes. Gere um novo UUID ou sufixo para novo ajuste.',
    retryable: false,
  },
  {
    code: 'RATE_LIMITED',
    httpStatus: 429,
    title: 'Limite de Requisições Atingido',
    description: 'A credencial ultrapassou a taxa máxima de requisições por minuto permitida para o tipo de operação.',
    cause: 'Disparo excessivo de chamadas em curto intervalo de tempo.',
    solution: 'Aguarde o tempo indicado no cabeçalho Retry-After e implemente backoff exponencial no agente.',
    retryable: true,
  },
  {
    code: 'TIMEOUT',
    httpStatus: 504,
    title: 'Tempo Limite Excedido',
    description: 'A execução da ferramenta demorou mais de 30 segundos para ser processada.',
    cause: 'Sobrecarga transitória ou lentidão de rede.',
    solution: 'Repita a operação utilizando o mesmo operation_id caso tenha sido uma operação de escrita.',
    retryable: true,
  },
  {
    code: 'INTERNAL_ERROR',
    httpStatus: 500,
    title: 'Erro Interno do Servidor',
    description: 'Ocorreu uma falha inesperada no processamento da requisição.',
    cause: 'Falha temporária de infraestrutura.',
    solution: 'Tente novamente após alguns instantes. Se persistir, consulte o suporte.',
    retryable: true,
  },
];

/**
 * Generates full Markdown documentation for LLMs and technical consumers.
 */
export function generateMarkdownDocs(endpointUrl: string): string {
  const toolsByCategory = MCP_TOOLS.reduce<Record<string, McpToolDoc[]>>((acc, tool) => {
    if (!acc[tool.categoryLabel]) acc[tool.categoryLabel] = [];
    acc[tool.categoryLabel].push(tool);
    return acc;
  }, {});

  let md = `# B2XCATALOGO — MCP Server Documentation

> Protocolo de Contexto de Modelo (Model Context Protocol) para Catálogo, Estoque e Grades.

## 1. Visão Geral
O servidor MCP do B2XCATALOGO permite que qualquer inteligência artificial (Claude, ChatGPT, Codex, Gemini ou agentes autônomos) consulte e opere o catálogo da sua loja com isolamento rigoroso por tenant e permissões granulares baseadas em scopes.

- **Transporte**: HTTP remoto (JSON-RPC 2.0 / MCP Protocol)
- **URL Base do Endpoint**: \`${endpointUrl}\`
- **Autenticação**: Bearer Token com API Key gerada no painel B2XCATALOGO
- **Formato da Chave**: \`b2x_live_<prefixo>_<segredo>\`

---

## 2. Autenticação e Cabeçalhos
Toda chamada deve incluir o cabeçalho \`Authorization\`:

\`\`\`http
POST /mcp HTTP/1.1
Host: ${endpointUrl.replace(/^https?:\/\//, '').split('/')[0]}
Authorization: Bearer <SUA_CHAVE_API>
Content-Type: application/json
\`\`\`

---

## 3. Scopes & Permissões
Cada credencial possui uma lista estrita de permissões autorizadas:

| Scope | Categoria | Risco | Descrição |
|---|---|---|---|
`;

  for (const s of MCP_SCOPES) {
    md += `| \`${s.scope}\` | ${s.categoryLabel} | ${s.riskTier} | ${s.description} |\n`;
  }

  md += `
---

## 4. Limites de Taxa (Rate Limits)
O runtime aplica janelas deslizantes de rate limiting por credencial:

| Categoria | Limite | Operações |
|---|---|---|
`;

  for (const r of MCP_RATE_LIMITS) {
    md += `| **${r.label}** | ${r.limitPerMinute} req/min | ${r.tools.map((t) => `\`${t}\``).join(', ')} |\n`;
  }

  md += `
---

## 5. Cadastro Inteligente & Product Intake Automation
O fluxo de ingestão e criação do MCP B2X distingue rigorosamente entre:
- **Product Intake Policy**: Contrato canônico obtido via \`obter_politica_cadastro_produto\`, informando campos obrigatórios, condicionais, deriváveis, resolvíveis e valores proibidos de invenção.
- **Tenant Defaults**: Preferências de loja consultadas e mantidas via \`obter_defaults_cadastro_produto\` e \`atualizar_defaults_cadastro_produto\`. Permite definir quantidade mínima de atacado padrão (\`default_min_wholesale_qty\`), eliminando perguntas repetitivas de forma segura.
- **Preparação de Produto (\`preparar_produto\`)**: Executa preflight de itens individuais a partir de dados livres ou aliases de planilhas/ERPs sem persistir no banco. Retorna \`status: 'ready'\`, \`status: 'needs_input'\` ou \`status: 'blocked'\`.
- **Importação em Lote (\`analisar_importacao_produtos\`)**: Recebe lotes de até 100 produtos, carrega categorias em batch, aplica defaults do tenant, agrupa decisões repetitivas (MOQ coletivo, pendências de gênero e categorias desconhecidas) e fornece a lista de produtos prontos para execução.
- **Estoque Ledger-Only**: O saldo físico não é injetado diretamente no cadastro; é representado como \`inventory_intent\` e lançado no ledger via \`ajustar_estoque\` (\`initial_balance\`).
- **Imagens em Fluxo Dedicado**: A primeira imagem pode ser adicionada via \`adicionar_imagem_produto\` e promovida a principal de forma segura.

---

## 6. Regras Críticas de Operação & Idempotência
1. **Zero Mutações Diretas em Saldo**: Mutações em estoque ocorrem unicamente via ledger (\`ajustar_estoque\`).
2. **Idempotência Obrigatória**: Operações de escrita sensíveis exigem \`operation_id\`.
   - Repetição do mesmo \`operation_id\` com o mesmo payload = sucesso sem dupla mutação (\`duplicate: true\`).
3. **Isolamento de Loja**: O agente opera estritamente no contexto da loja autorizada. Tentativas de acessar IDs de outra loja retornam \`NOT_FOUND\` para prevenir enumeração.
4. **Intake Inteligente**: Ao receber pedidos com texto livre, listas ou planilhas, execute \`preparar_produto\` ou \`analisar_importacao_produtos\` antes da persistência.
5. **Fluxo Completo de Produto + Imagem + Estoque**:
   - 1º Preparar/Criar produto comercialmente completo via \`criar_produto\`.
   - 2º Adicionar imagens via \`adicionar_imagem_produto\` (URL HTTPS externa; download seguro server-side). A primeira imagem se torna automaticamente a principal.
   - 3º Lançar saldo físico inicial via \`ajustar_estoque\` (motivo \`initial_balance\`).

---

## 7. Catálogo de Ferramentas (${MCP_TOOLS.length} Tools)
`;

  for (const [category, tools] of Object.entries(toolsByCategory)) {
    md += `\n### ${category}\n`;
    for (const tool of tools) {
      md += `
#### \`${tool.name}\`
- **Descrição**: ${tool.description}
- **Scope Requerido**: \`${tool.requiredScope}\`
- **Quando usar**: ${tool.whenToUse}
- **Risco**: ${tool.riskTier}${tool.supportsIdempotency ? ' | Suporta Idempotência' : ''}

**Parâmetros de Entrada:**
`;
      if (tool.parameters.length === 0) {
        md += `*Nenhum parâmetro requerido.*\n`;
      } else {
        md += `| Parâmetro | Tipo | Obrigatório | Descrição |\n|---|---|---|---|\n`;
        for (const p of tool.parameters) {
          md += `| \`${p.name}\` | \`${p.type}\` | ${p.required ? '**Sim**' : 'Não'} | ${p.description} |\n`;
        }
      }

      md += `
**Exemplo de Chamada:**
\`\`\`json
${JSON.stringify({ tool: tool.name, arguments: tool.exampleRequest }, null, 2)}
\`\`\`

**Exemplo de Resposta:**
\`\`\`json
${JSON.stringify(tool.exampleResponse, null, 2)}
\`\`\`
`;
    }
  }

  md += `
---

## 7. Catálogo de Erros
| Código | HTTP Status | Causa | Solução | Retry? |
|---|---|---|---|---|
`;

  for (const err of MCP_ERROR_CATALOG) {
    md += `| \`${err.code}\` | ${err.httpStatus} | ${err.cause} | ${err.solution} | ${err.retryable ? 'Sim' : 'Não'} |\n`;
  }

  md += `
---

## 8. Boas Práticas de Segurança
- Mantenha 1 credencial dedicada para cada agente/integração.
- Conceda apenas os scopes indispensáveis (Princípio do Mínimo Privilégio).
- Nunca compartilhe a chave de API em canais públicos ou frontends sem autenticação.
- Em caso de suspeita de comprometimento, revogue a credencial imediatamente pelo painel B2XCATALOGO.
`;

  return md;
}

/**
 * Generates a concise AI System Instructions / Prompt Guide.
 * When scopes are provided, it dynamically filters tools to ONLY those allowed by the credential!
 */
export function generateAiGuide(options: {
  endpointUrl: string;
  storeName?: string;
  scopes?: string[];
  apiKeyPlaceholder?: string;
}): string {
  const {
    endpointUrl,
    storeName = 'B2XCATALOGO',
    scopes,
    apiKeyPlaceholder = '<COLE_SUA_CHAVE_AQUI>',
  } = options;

  // Filter tools if scopes provided
  const allowedTools = scopes
    ? MCP_TOOLS.filter((t) => scopes.includes(t.requiredScope))
    : MCP_TOOLS;

  const hasWriteCatalog = !scopes || scopes.includes('catalog:write');
  const hasAdjustStock = !scopes || scopes.includes('stock:adjust');
  const hasWriteGrade = !scopes || scopes.includes('grade:write');
  const isReadOnly = !hasWriteCatalog && !hasAdjustStock && !hasWriteGrade;

  let guide = `# Guia de Integração IA — ${storeName} MCP

Você tem acesso ao catálogo e estoque da loja "${storeName}" através do protocolo MCP do B2XCATALOGO.

## Configuração de Conexão
- **Endpoint MCP**: \`${endpointUrl}\`
- **Autenticação**: Bearer Token
- **API Key**: \`${apiKeyPlaceholder}\`

## Suas Capacidades Autorizadas
`;

  if (isReadOnly) {
    guide += `Esta integração opera em modo **SOMENTE LEITURA**.
Você pode:
- Pesquisar produtos e atributos no catálogo (\`buscar_catalogo\`);
- Listar produtos com filtros e paginação (\`listar_produtos\`);
- Consultar detalhes de produtos e variações (\`obter_produto\`);
- Verificar estoque e disponibilidade física (\`consultar_estoque\`);
- Consultar modelos de grade disponíveis (\`listar_modelos_grade\`, \`obter_modelo_grade\`).

Você **NÃO pode**:
- Criar, editar ou desativar produtos;
- Alterar ou movimentar saldos de estoque;
- Criar ou aplicar novas grades.
`;
  } else {
    guide += `Esta integração possui permissões operacionais configuradas:
`;
    if (scopes) {
      for (const s of scopes) {
        const doc = MCP_SCOPES.find((sc) => sc.scope === s);
        if (doc) {
          guide += `- **${doc.label}** (\`${s}\`): ${doc.description}\n`;
        }
      }
    } else {
      guide += `- Acesso completo a consultas e operações autorizadas.\n`;
    }
  }

  guide += `
## Ferramentas Disponíveis (${allowedTools.length} ferramentas):
${allowedTools.map((t) => `- \`${t.name}\`: ${t.description} (Scope: \`${t.requiredScope}\`)`).join('\n')}

## Regras Obrigatórias de Execução:
1. **Contexto da Loja**: Nunca invente IDs de lojas ou produtos. Use \`buscar_catalogo\` ou \`listar_produtos\` para obter identificadores reais.
${
  hasAdjustStock || hasWriteCatalog
    ? `2. **Idempotência**: Em operações de alteração (\`ajustar_estoque\` e \`atualizar_produtos_em_lote\`), sempre gere um \`operation_id\` descritivo e único (ex: \`ajuste-20261007-001\`). Se receber timeout ou resposta incerta, repita com o **mesmo** \`operation_id\`. Nunca use novo operation_id para a mesma tentativa.\n`
    : ''
}3. **Respeito aos Scopes**: Não tente invocar ferramentas fora do seu escopo para evitar bloqueios de taxa ou erros 403.
${
  hasWriteCatalog
    ? `4. **Product Intake & Criação Completa**: Ao cadastrar produtos a partir de linguagem natural, listas ou planilhas/CSV, consulte a Política de Cadastro (\`obter_politica_cadastro_produto\`) ou utilize \`preparar_produto\` / \`analisar_importacao_produtos\` antes da persistência. Aplique os Tenant Defaults configurados (\`obter_defaults_cadastro_produto\`), como quantidade mínima de atacado padrão. Não invente gênero, marca, material ou especificações. Nunca pergunte dados deriváveis (slug, SEO, SKU) ao usuário.\n5. **Criação de Produtos com Imagem e Estoque**: Quando o usuário pedir cadastro com foto e estoque, execute em cadeia: (1) \`criar_produto\` → (2) \`adicionar_imagem_produto\` usando a URL da imagem → (3) \`ajustar_estoque\` (motivo \`initial_balance\`). Nunca responda que o MCP não suporta imagens!\n`
    : ''
}6. **Segurança**: Nunca exponha chaves de autenticação ou dados privados da loja em respostas públicas.
`;

  return guide;
}
