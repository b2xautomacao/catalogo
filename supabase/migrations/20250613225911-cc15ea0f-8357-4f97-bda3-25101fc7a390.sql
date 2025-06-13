
-- Criar tabela payments para gerenciar pagamentos
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'money', 'card', 'bank_slip')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded')),
  reference_id TEXT,
  confirmed_by UUID REFERENCES public.profiles(id),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campos de controle de impressões na tabela orders
ALTER TABLE public.orders 
ADD COLUMN tracking_code TEXT,
ADD COLUMN label_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN label_generated_by UUID REFERENCES public.profiles(id),
ADD COLUMN picking_list_printed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN picking_list_printed_by UUID REFERENCES public.profiles(id),
ADD COLUMN content_declaration_printed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN content_declaration_printed_by UUID REFERENCES public.profiles(id),
ADD COLUMN receipt_printed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN receipt_printed_by UUID REFERENCES public.profiles(id);

-- Trigger para atualizar updated_at na tabela payments
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS na tabela payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Política para permitir que admins da loja vejam pagamentos de pedidos da sua loja
CREATE POLICY "Store admins can view payments from their store orders" ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      INNER JOIN public.profiles p ON p.store_id = o.store_id
      WHERE o.id = payments.order_id 
      AND p.id = auth.uid()
    )
  );

-- Política para permitir que admins da loja criem pagamentos para pedidos da sua loja
CREATE POLICY "Store admins can create payments for their store orders" ON public.payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      INNER JOIN public.profiles p ON p.store_id = o.store_id
      WHERE o.id = payments.order_id 
      AND p.id = auth.uid()
    )
  );

-- Política para permitir que admins da loja atualizem pagamentos de pedidos da sua loja
CREATE POLICY "Store admins can update payments from their store orders" ON public.payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      INNER JOIN public.profiles p ON p.store_id = o.store_id
      WHERE o.id = payments.order_id 
      AND p.id = auth.uid()
    )
  );

-- Índices para melhorar performance
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_orders_tracking_code ON public.orders(tracking_code);
