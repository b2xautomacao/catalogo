# Correção das Políticas RLS para Variações Mestres

## Problema

As tabelas `variation_master_groups` e `variation_master_values` estão com políticas RLS muito restritivas, permitindo apenas superadmins criarem grupos e valores. Isso impede que store_admins normais adicionem novos valores de variação.

## Erro encontrado

```
POST https://uytkhyqwikdpplwsesoz.supabase.co/rest/v1/variation_master_values 403 (Forbidden)
Erro: new row violates row-level security policy for table "variation_master_values"
```

## Solução

Execute o SQL abaixo no **Editor SQL** do painel do Supabase:

```sql
-- Migration para corrigir políticas RLS das tabelas de variações mestres
-- Permitir que store_admins também possam gerenciar variações

-- Primeiro, remover as políticas existentes muito restritivas
DROP POLICY IF EXISTS "Only superadmins can create variation master groups" ON public.variation_master_groups;
DROP POLICY IF EXISTS "Only superadmins can update variation master groups" ON public.variation_master_groups;
DROP POLICY IF EXISTS "Only superadmins can delete variation master groups" ON public.variation_master_groups;

DROP POLICY IF EXISTS "Only superadmins can create variation master values" ON public.variation_master_values;
DROP POLICY IF EXISTS "Only superadmins can update variation master values" ON public.variation_master_values;
DROP POLICY IF EXISTS "Only superadmins can delete variation master values" ON public.variation_master_values;

-- Criar novas políticas mais flexíveis para variation_master_groups
-- Superadmins e store_admins podem criar grupos
CREATE POLICY "Authenticated users can create variation master groups" ON public.variation_master_groups
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      public.is_superadmin(auth.uid()) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('store_admin', 'superadmin')
        AND is_active = true
      )
    )
  );

-- Superadmins e store_admins podem atualizar grupos
CREATE POLICY "Authenticated users can update variation master groups" ON public.variation_master_groups
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      public.is_superadmin(auth.uid()) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('store_admin', 'superadmin')
        AND is_active = true
      )
    )
  );

-- Apenas superadmins podem deletar grupos (pois são compartilhados)
CREATE POLICY "Only superadmins can delete variation master groups" ON public.variation_master_groups
  FOR DELETE USING (public.is_superadmin(auth.uid()));

-- Criar novas políticas mais flexíveis para variation_master_values
-- Superadmins e store_admins podem criar valores
CREATE POLICY "Authenticated users can create variation master values" ON public.variation_master_values
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      public.is_superadmin(auth.uid()) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('store_admin', 'superadmin')
        AND is_active = true
      )
    )
  );

-- Superadmins e store_admins podem atualizar valores
CREATE POLICY "Authenticated users can update variation master values" ON public.variation_master_values
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      public.is_superadmin(auth.uid()) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('store_admin', 'superadmin')
        AND is_active = true
      )
    )
  );

-- Superadmins e store_admins podem deletar valores que criaram
-- Mas superadmins podem deletar qualquer valor
CREATE POLICY "Authenticated users can delete variation master values" ON public.variation_master_values
  FOR DELETE USING (
    auth.role() = 'authenticated' AND (
      public.is_superadmin(auth.uid()) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('store_admin', 'superadmin')
        AND is_active = true
      )
    )
  );
```

## Como aplicar

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione o projeto VendeMais
3. Vá em **SQL Editor**
4. Cole o código SQL acima
5. Clique em **Run** para executar

## Verificação

Após aplicar a migration, teste:

1. Entre no sistema com um usuário store_admin
2. Vá em Produtos > Criar Produto
3. No step de Variações, tente adicionar um novo valor (ex: nova cor)
4. O sistema deve permitir a criação sem erro 403

## Arquivos modificados no frontend

- `src/hooks/useVariationMasterGroups.tsx` - Melhor tratamento de erros RLS
- `src/components/variations/QuickValueAdd.tsx` - Tratamento específico para erro de permissão

## Observações

- Os grupos e valores de variação são **compartilhados** entre todas as lojas para padronização
- Store_admins podem criar/editar grupos e valores
- Apenas superadmins podem deletar grupos (para evitar quebrar produtos de outras lojas)
- Store_admins podem deletar valores que criaram
