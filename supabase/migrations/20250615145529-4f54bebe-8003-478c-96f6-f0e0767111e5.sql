
-- Criação da tabela customers no banco de dados público
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text NOT NULL,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilita RLS (Row Level Security) - neste caso, o checkout é público, então liberamos SELECT/INSERT para anônimos.
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Permissão para qualquer inserir (checkout público)
CREATE POLICY "Permitir inserir cliente pela web (público)" ON public.customers
FOR INSERT
WITH CHECK (true);

-- Permissão para leitura (para possíveis relatórios)
CREATE POLICY "Permitir leitura pública dos clientes" ON public.customers
FOR SELECT
USING (true);

-- Permissão de UPDATE apenas para admin (requer autenticação, simples aqui não é necessário, só uso insert)
