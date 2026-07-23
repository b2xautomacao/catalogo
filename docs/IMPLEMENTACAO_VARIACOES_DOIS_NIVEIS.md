# Implementação de Variações em Dois Níveis

## Contexto do Problema

O sistema atual usa tabelas `variation_master_groups` e `variation_master_values` que são **globais** e só permitem edição por **superadmins**. Precisamos implementar um sistema em **dois níveis**:

1. **Variações Globais** - Disponíveis para todas as lojas (gerenciadas por superadmins)
2. **Variações por Loja** - Específicas de cada loja (gerenciadas pelos store_admins)

## Solução Proposta

### 1. Estrutura de Banco de Dados

#### Novas Tabelas

**`store_variation_groups`** - Grupos de variação por loja

```sql
CREATE TABLE public.store_variation_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  master_group_id UUID REFERENCES public.variation_master_groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  attribute_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, attribute_key)
);
```

**`store_variation_values`** - Valores de variação por loja

```sql
CREATE TABLE public.store_variation_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.store_variation_groups(id) ON DELETE CASCADE,
  master_value_id UUID REFERENCES public.variation_master_values(id) ON DELETE SET NULL,
  value TEXT NOT NULL,
  hex_color TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, group_id, value)
);
```

### 2. Políticas RLS

As políticas permitirão que:

- **Store_admins** vejam/criem/editem variações da sua loja
- **Público** veja variações de lojas ativas (para catálogos)
- **Superadmins** tenham acesso completo

### 3. Inicialização Automática

Quando uma nova loja é criada:

1. **Trigger automático** copia grupos globais para a loja
2. **Trigger automático** copia valores globais para a loja
3. **Lojista pode adicionar** novos grupos/valores específicos

### 4. Frontend - Hook useStoreVariations

Criação de um novo hook que gerencia variações por loja:

- Busca grupos/valores específicos da loja do usuário
- Permite criar novos valores sem erro de permissão
- Mantém isolamento entre lojas

## Implementação

### Passo 1: Criar Migration SQL

Execute no **Editor SQL** do Supabase:

```sql
-- 1. Criar tabelas store_variation_groups e store_variation_values
-- 2. Configurar RLS com permissões corretas
-- 3. Criar função de inicialização automática
-- 4. Configurar trigger para novas lojas
-- 5. Inicializar lojas existentes
```

**📁 Arquivo**: `supabase/migrations/store-variations.sql`

### Passo 2: Atualizar Frontend

1. **Novo Hook**: `src/hooks/useStoreVariations.tsx`
2. **Modificar**: `src/components/products/MasterVariationSelector.tsx`
3. **Atualizar**: `src/components/variations/QuickValueAdd.tsx`

### Passo 3: Migrar Lógica

Substituir `useVariationMasterGroups` por `useStoreVariations` nos componentes de produto.

## Benefícios

✅ **Isolamento por Loja**: Cada loja gerencia suas próprias variações  
✅ **Herança Global**: Lojas começam com variações padrão  
✅ **Flexibilidade**: Lojistas podem adicionar variações específicas  
✅ **Compatibilidade**: Mantém variações globais para novos recursos  
✅ **Performance**: Consultas otimizadas por loja

## Fluxo de Trabalho

1. **Superadmin** gerencia variações globais (cores básicas, tamanhos padrão)
2. **Nova loja** herda automaticamente todas as variações globais
3. **Store_admin** pode adicionar variações específicas (ex: "Azul Royal", "Tamanho 46")
4. **Variações da loja** são usadas nos produtos sem restrições de permissão

## Arquivos para Modificar

- [ ] `supabase/migrations/store-variations.sql` (NOVO)
- [ ] `src/hooks/useStoreVariations.tsx` (NOVO)
- [ ] `src/components/products/MasterVariationSelector.tsx` (MODIFICAR)
- [ ] `src/components/variations/QuickValueAdd.tsx` (MODIFICAR)
- [ ] `src/hooks/useVariationMasterGroups.tsx` (MANTER para superadmins)

## Status

❌ **Migration SQL** - Criada, aguardando aplicação no Supabase  
❌ **Hook useStoreVariations** - Criado, aguardando integração  
❌ **Componentes Frontend** - Aguardando atualização  
❌ **Teste de Funcionalidade** - Aguardando implementação completa

## Próximos Passos

1. **Aplicar migration SQL** no painel do Supabase
2. **Integrar useStoreVariations** nos componentes
3. **Testar criação de variações** por store_admin
4. **Validar isolamento** entre lojas
5. **Documentar uso** para lojistas
