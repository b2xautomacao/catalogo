
-- Expandir tabela stores com campos básicos da loja
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Adicionar índice para busca por CNPJ
CREATE INDEX IF NOT EXISTS idx_stores_cnpj ON public.stores(cnpj) WHERE cnpj IS NOT NULL;

-- Adicionar índice para busca por email
CREATE INDEX IF NOT EXISTS idx_stores_email ON public.stores(email) WHERE email IS NOT NULL;
