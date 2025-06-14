
-- Adicionar colunas para dados do Mercado Pago na tabela payments
ALTER TABLE public.payments 
ADD COLUMN mercadopago_payment_id TEXT,
ADD COLUMN mercadopago_preference_id TEXT,
ADD COLUMN mercadopago_collection_id TEXT,
ADD COLUMN mercadopago_status TEXT,
ADD COLUMN mercadopago_response JSONB;

-- Índice para busca rápida por payment_id do Mercado Pago
CREATE INDEX idx_payments_mercadopago_payment_id ON public.payments(mercadopago_payment_id);

-- Função para atualizar status do pagamento baseado no retorno do Mercado Pago
CREATE OR REPLACE FUNCTION public.update_payment_from_mercadopago(
  _order_id UUID,
  _mp_payment_id TEXT,
  _mp_status TEXT,
  _mp_response JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payment_uuid UUID;
  order_total NUMERIC;
BEGIN
  -- Buscar o valor total do pedido
  SELECT total_amount INTO order_total
  FROM public.orders 
  WHERE id = _order_id;
  
  -- Inserir ou atualizar pagamento
  INSERT INTO public.payments (
    order_id,
    amount,
    payment_method,
    status,
    mercadopago_payment_id,
    mercadopago_status,
    mercadopago_response,
    reference_id
  ) VALUES (
    _order_id,
    order_total,
    'mercadopago',
    CASE 
      WHEN _mp_status = 'approved' THEN 'confirmed'
      WHEN _mp_status = 'pending' THEN 'pending'
      WHEN _mp_status = 'rejected' THEN 'failed'
      ELSE 'pending'
    END,
    _mp_payment_id,
    _mp_status,
    _mp_response,
    _mp_payment_id
  )
  ON CONFLICT (order_id, mercadopago_payment_id) 
  DO UPDATE SET
    status = CASE 
      WHEN _mp_status = 'approved' THEN 'confirmed'
      WHEN _mp_status = 'pending' THEN 'pending'
      WHEN _mp_status = 'rejected' THEN 'failed'
      ELSE 'pending'
    END,
    mercadopago_status = _mp_status,
    mercadopago_response = _mp_response,
    updated_at = NOW()
  RETURNING id INTO payment_uuid;
  
  -- Atualizar status do pedido se pagamento foi aprovado
  IF _mp_status = 'approved' THEN
    UPDATE public.orders 
    SET status = 'confirmed', updated_at = NOW()
    WHERE id = _order_id AND status = 'pending';
  END IF;
  
  RETURN payment_uuid;
END;
$$;

-- Política RLS para permitir leitura de pagamentos por external_reference
CREATE POLICY "Allow read payments by external reference" ON public.payments
  FOR SELECT
  USING (true);
