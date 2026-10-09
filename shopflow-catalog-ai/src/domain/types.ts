export interface Product {
  id: string;
  name: string;
  sku: string | null;
  retail_price: number;
  wholesale_price: number | null;
  stock: number;
  is_active: boolean;
}

export interface DetailedProduct extends Product {
  images: Array<{
    id: string;
    image_url: string;
    image_order: number;
    is_primary: boolean;
  }>;
  variations: Array<{
    id: string;
    name: string | null;
    sku: string | null;
    color: string | null;
    size: string | null;
    stock: number;
    price_adjustment: number | null;
  }>;
}

export interface ListProductsFilters {
  nome?: string;
  sku?: string;
  ativo?: boolean;
  limit: number;
  offset: number;
}

export interface StoreDescriptor {
  id: string;
  name: string;
  url_slug: string | null;
  description: string | null;
  address: string | null;
  is_active: boolean;
}

export interface StoreSearchResponse {
  matches: StoreDescriptor[];
  count: number;
  selectionRequired: boolean;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  sku?: string;
  retail_price: number;
  wholesale_price?: number;
  min_wholesale_qty?: number;
  category?: string;
  category_id?: string;
  material?: string;
  product_gender?: 'masculino' | 'feminino' | 'unissex' | 'infantil';
  product_category_type?: 'calcado' | 'roupa_superior' | 'roupa_inferior' | 'acessorio';
  seo_slug?: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
}

export interface UpdateProductInput {
  product_id: string;
  name?: string;
  description?: string;
  sku?: string;
  retail_price?: number;
  wholesale_price?: number | null;
  min_wholesale_qty?: number;
  category?: string | null;
  category_id?: string | null;
  material?: string | null;
  product_gender?: 'masculino' | 'feminino' | 'unissex' | 'infantil' | null;
  product_category_type?: 'calcado' | 'roupa_superior' | 'roupa_inferior' | 'acessorio' | null;
  seo_slug?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  keywords?: string | null;
}

export interface SafeProductResult {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  category: string | null;
  category_id?: string | null;
  retail_price: number;
  wholesale_price: number | null;
  min_wholesale_qty?: number | null;
  material?: string | null;
  product_gender?: 'masculino' | 'feminino' | 'unissex' | 'infantil' | null;
  product_category_type?: 'calcado' | 'roupa_superior' | 'roupa_inferior' | 'acessorio' | null;
  seo_slug?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  is_active: boolean;
}

export interface MissingDecision {
  field: string;
  question: string;
}

export interface ProductCompletenessPreflight {
  complete: boolean;
  missing: MissingDecision[];
  resolved: {
    category?: { id: string; name: string };
    product_category_type?: 'calcado' | 'roupa_superior' | 'roupa_inferior' | 'acessorio';
    product_gender?: 'masculino' | 'feminino' | 'unissex' | 'infantil';
    min_wholesale_qty?: number;
    seo_slug?: string;
    meta_title?: string;
    meta_description?: string;
  };
}

export interface NeedsInputProductResult {
  status: 'needs_input';
  created: false;
  missing_fields: string[];
  questions: string[];
  preflight: Record<string, any>;
}

export interface CreatedProductResult extends SafeProductResult {
  status: 'created';
  created: true;
  product: SafeProductResult;
  next_actions: string[];
  structured_next_actions?: ExecutableNextAction[];
}

export type CreateProductResult = CreatedProductResult | NeedsInputProductResult;

export interface DeactivateProductInput {
  product_id: string;
}

export interface DeactivateProductResult {
  deactivated: boolean;
  alreadyInactive: boolean;
  product: SafeProductResult;
}

export interface ProductImageRecord {
  id: string;
  product_id: string;
  variation_id?: string | null;
  image_url: string;
  image_order: number;
  alt_text?: string | null;
  is_primary: boolean;
  color_association?: string | null;
  created_at?: string;
}

export interface ProductImageDto {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  image_order: number;
  color_association: string | null;
}

export interface TenantIntakeDefaults {
  store_id?: string;
  default_min_wholesale_qty: number | null;
  auto_generate_sku: boolean;
  auto_generate_slug: boolean;
  auto_generate_seo: boolean;
  auto_set_first_image_primary: boolean;
  inventory_import_mode: 'initial_balance' | 'increase';
  unknown_category_policy: 'ask' | 'block';
  created_at?: string;
  updated_at?: string;
}

export type IntakeDecision = 'auto' | 'ask' | 'block';

export type ResolutionSource =
  | 'explicit'
  | 'tenant_default'
  | 'exact_match'
  | 'normalized_match'
  | 'safe_derivation'
  | 'generated'
  | 'unresolved';

export interface FieldResolutionMeta {
  field: string;
  decision: IntakeDecision;
  source: ResolutionSource;
  confidence: number;
  value?: any;
  question?: string;
  allowed_values?: string[];
}

export interface ProductIntakePolicyResult {
  required: string[];
  conditional: Record<string, string>;
  derivable: string[];
  resolvable: string[];
  tenant_defaults: TenantIntakeDefaults;
  never_invent: string[];
  decision_policy: {
    auto: string[];
    ask: string[];
    block: string[];
  };
  stock_policy: {
    mode: 'ledger_only';
    rule: string;
  };
  image_policy: {
    mode: 'post_creation';
    tool: string;
    rule: string;
  };
  summary: string;
}

export interface PreparedInventoryAdjustment {
  operation: 'increase' | 'decrease' | 'count';
  reason: 'inventory_count' | 'damage' | 'loss' | 'found_stock' | 'correction' | 'initial_balance' | 'other';
  quantity: number;
  operation_id: string;
  notes?: string;
}

export interface VariationIntent {
  mode: 'none' | 'size_only' | 'color_only' | 'color_size';
  colors?: string[];
  sizes?: string[];
}

export interface GradeIntent {
  template: string;
  template_id?: string;
}

export interface ExecutablePayloads {
  criar_produto: Record<string, any>;
  ajustar_estoque?: PreparedInventoryAdjustment;
  reconciliar_variacoes_produto?: Record<string, any>;
  aplicar_grade_produto?: Record<string, any>;
}

export interface ExecutableNextAction {
  tool: string;
  required: boolean;
  reason: string;
  prepared_input?: Record<string, any>;
}

export interface CategorySuggestionInfo {
  name?: string;
  requested: string;
  suggestions: string[];
  can_create: boolean;
  suggested_action?: {
    tool: 'criar_categoria';
    input: { name: string; description?: string };
  };
}

export interface PreparedProductResult {
  preparation_id?: string;
  status: 'ready' | 'needs_input' | 'blocked';
  resolved_data: Record<string, any>;
  executable_payloads?: ExecutablePayloads;
  inventory_intent?: PreparedInventoryAdjustment;
  variation_intent?: VariationIntent;
  grade_intent?: GradeIntent;
  unresolved_category?: CategorySuggestionInfo;
  next_actions?: ExecutableNextAction[];
  decisions: FieldResolutionMeta[];
  issues?: Array<{
    field: string;
    code: string;
    message: string;
  }>;
}

export interface BatchImportItemResult {
  index: number;
  raw_input: Record<string, any>;
  status: 'ready' | 'needs_input' | 'invalid';
  resolved_data?: Record<string, any>;
  executable_payloads?: ExecutablePayloads;
  inventory_intent?: PreparedInventoryAdjustment;
  unresolved_category?: CategorySuggestionInfo;
  next_actions?: ExecutableNextAction[];
  decisions: FieldResolutionMeta[];
  issues?: Array<{
    field: string;
    code: string;
    message: string;
  }>;
}

export interface GroupedDecision {
  type: 'bulk_decision' | 'decision_group' | 'category_mapping';
  field: string;
  affected_count: number;
  question: string;
  suggested_default?: any;
  affected_products?: string[];
  unmapped_categories?: string[];
}

export interface AnalyzeImportResult {
  summary: {
    total: number;
    ready: number;
    needs_input: number;
    invalid: number;
  };
  grouped_decisions: GroupedDecision[];
  items: BatchImportItemResult[];
  ready_products: Record<string, any>[];
}

export interface UpdateTenantIntakeDefaultsInput {
  default_min_wholesale_qty?: number | null;
  auto_generate_sku?: boolean;
  auto_generate_slug?: boolean;
  auto_generate_seo?: boolean;
  auto_set_first_image_primary?: boolean;
  inventory_import_mode?: 'initial_balance' | 'increase';
  unknown_category_policy?: 'ask' | 'block';
}

