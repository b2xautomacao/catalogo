
-- Adicionar colunas necessárias na tabela orders
ALTER TABLE public.orders 
ADD COLUMN notes text,
ADD COLUMN shipping_method text,
ADD COLUMN payment_method text,
ADD COLUMN shipping_cost numeric DEFAULT 0.00;
