# B2XCATALOGO — Arquitetura de Roteamento de Hosts e Tenants

## 1. Visão Geral

O B2XCATALOGO opera em um modelo multi-tenant híbrido, suportando resolução dinâmica de lojas por subdomínio nos domínios base da plataforma (`gargalozero.com.br` e `aoseudispor.com.br`), além de domínios customizados de lojistas.

Para garantir que os serviços de infraestrutura e inteligência artificial da plataforma nunca colidam com o roteamento dinâmico de lojas, foi estabelecida uma política rigorosa de **Hosts e Subdomínios Reservados de Plataforma** (`RESERVED PLATFORM HOSTS`).

---

## 2. Princípio Fundamental de Separação

> **HARD RULE:**
> O serviço de Inteligência Artificial (`mcp.gargalozero.com.br`) é uma infraestrutura global e NUNCA representa uma loja ou tenant.
> O contexto de tenant no MCP é determinado estritamente pelo par:
> `credential` + `StoreAccess` + `activeStore`
> e **JAMAIS** é derivado a partir do hostname.

---

## 3. Matriz Canônica de Classificação de Hosts

A classificação de qualquer requisição de entrada é centralizada em [`src/lib/platformHosts.ts`](file:///e:/projetos/B2XCATALOGO/catalogo/src/lib/platformHosts.ts):

| Hostname | Tipo Resolvido | Ação no Backend / Frontend |
|---|---|---|
| `mcp.gargalozero.com.br` | `platform` (service: `mcp`) | Encaminhado diretamente ao MCP Runtime (:3000). **Zero lookup no banco de lojas.** |
| `mcp.aoseudispor.com.br` | `platform` (service: `mcp`) | Reservado de plataforma. Zero lookup de loja. |
| `admin.gargalozero.com.br` | `platform` (service: `admin`) | Interface administrativa da plataforma. Zero lookup de loja. |
| `api.gargalozero.com.br` | `platform` (service: `api`) | API da plataforma. Zero lookup de loja. |
| `app.gargalozero.com.br` | `platform` (service: `app`) | SPA / Dashboard geral. Zero lookup de loja. |
| `www.gargalozero.com.br` | `platform` (service: `web`) | Portal institucional. Zero lookup de loja. |
| `gargalozero.com.br` | `root` | Root domain. |
| `aoseudispor.com.br` | `root` | Root domain. |
| `loja1.gargalozero.com.br` | `tenant` (slug: `loja1`) | Consulta Supabase (`store_settings.subdomain = 'loja1'`). |
| `loja1.aoseudispor.com.br` | `tenant` (slug: `loja1`) | Consulta Supabase (`store_settings.subdomain = 'loja1'`). |
| `minhaloja.com.br` | `custom_domain` | Consulta Supabase (`store_settings.custom_domain = 'minhaloja.com.br'`). |

---

## 4. Subdomínios Reservados de Plataforma

A lista abaixo representa a Fonte Única da Verdade (`RESERVED_PLATFORM_SUBDOMAINS`):

```typescript
export const RESERVED_PLATFORM_SUBDOMAINS = new Set([
  'mcp',
  'www',
  'app',
  'admin',
  'api',
  'mail',
  'ftp',
  'status',
  'portal',
  'dashboard',
  'auth',
  'root',
  'system',
  'static',
  'cdn',
  'media',
  'assets',
  'files',
  'storage',
  'ws',
  'gateway',
]);
```

### Regras de Validação:
1. **Case-Insensitive:** `MCP`, `Mcp`, `ADMIN` são normalizados e bloqueados.
2. **Whitespace Trimming:** Espaços antes ou depois do slug são removidos antes da validação.
3. **Bloqueio em Tempo de Execução:** Tentativas de registrar ou alterar slug para um desses nomes disparam erro com mensagem amigável:
   > *"Este endereço é reservado pela plataforma. Escolha outro subdomínio."*
4. **Proteção na Resolução:** Se uma requisição chegar com um subdomínio reservado, as funções `useDomainDetection`, `useSubdomainStore`, `useStoreResolver` e `checkSubdomainAvailability` encerram o processamento imediatamente sem disparar nenhuma query ao banco `stores` ou `store_settings`.

---

## 5. Roteamento de Infraestrutura (EasyPanel / Reverse Proxy)

### Precedência Obrigatória de Proxies:
1. Regra Específica: `mcp.gargalozero.com.br` → Serviço `B2XCATALOGO-MCP` (porta interna 3000).
2. Regra Wildcard: `*.gargalozero.com.br` → Serviço `B2XCATALOGO-WEB` (porta interna 80).

Com essa precedência, o tráfego destinado ao MCP jamais atinge o container frontend do Nginx, eliminando a ocorrência de respostas `405 Method Not Allowed` em formato HTML.
