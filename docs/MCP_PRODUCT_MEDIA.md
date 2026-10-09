# B2XCATALOGO — MCP Product Media Architecture
## Upload, Importação e Gestão de Imagens de Produto via MCP

### 1. Visão Geral e Contexto
O ecossistema MCP do **B2XCATALOGO** (`shopflow-catalog-ai`) expandiu sua capacidade de catálogo para oferecer suporte nativo, seguro e atômico à gestão de fotos e mídias de produtos através do protocolo MCP.

Anteriormente, o agente de IA conseguia criar o registro do produto via `criar_produto`, mas precisava informar ao usuário:
> *"O MCP atual não possui campo para enviar imagem ao produto."*

Com a implementação desta sprint de mídia, o agente de IA agora possui um fluxo completo, autônomo e de alta confiabilidade:
```text
criar_produto
      ↓
adicionar_imagem_produto (download seguro server-side de source_url HTTPS)
      ↓
ajustar_estoque (lançamento de saldo físico inicial no ledger)
      ↓
listar_imagens_produto / definir_imagem_principal / remover_imagem_produto
```

---

### 2. Decisão Arquitetural: `source_url` vs `base64`

Rejeitamos terminantemente a injeção de blobs `base64` gigantes dentro do payload de criação de produto:
- **Tamanho excessivo de payload**: Base64 infla payloads em mais de 33%, sobrecarregando o runtime MCP e limites HTTP de JSON-RPC.
- **Memória e Logs**: Imagens inline causam consumo massivo de heap no Node.js e corrompem logs de auditoria e métricas com dumps binários.
- **Resiliência e Idempotência**: Falhas de download de imagem não devem abortar a integridade da criação do produto nem gerar estados ambíguos.
- **Compatibilidade com Modelos Generativos**: Modelos como ChatGPT, Codex, Claude, Midjourney e fluxos de automação n8n entregam imagens prontas hospedadas em URLs públicas seguras (HTTPS).

**Fluxo Adotado:**
```text
Imagem Externa / Gerada (HTTPS)
               ↓
    adicionar_imagem_produto
               ↓
      ProductMediaService
               ↓
  Validação SSRF + DNS Rebinding
               ↓
Download Seguro (Stream ≤ 10MB + Sniffing Magic Bytes)
               ↓
  Upload Canônico Supabase Storage ("product-images")
               ↓
Persistência em public.product_images + Sync products.image_url
```

---

### 3. Modelo Canônico e Zero Segundo Modelo
Não foi criada nenhuma tabela paralela nem storage bucket alternativo. O MCP reutiliza exatamente a mesma infraestrutura canônica do catálogo:
- **Tabela**: `public.product_images`
  - `id`: UUID (Chave primária)
  - `product_id`: UUID (FK para `products.id`)
  - `image_url`: string (URL pública canônica no Supabase Storage)
  - `image_order`: integer (1 a 10)
  - `alt_text`: string (acessibilidade e SEO)
  - `is_primary`: boolean (indica se é a imagem de capa)
  - `color_association`: string opcional (vínculo de cor)
- **Tabela `products`**:
  - `image_url`: string | null (sincronizada automaticamente com a imagem principal do produto)
- **Bucket de Armazenamento**:
  - Bucket `'product-images'` (público)
  - Caminho estruturado: `products/<productId>/<uuid>.<ext>`

---

### 4. As 4 Novas MCP Tools (Total de 21 Ferramentas)

| Ferramenta | Categoria | Scope Requerido | Nível de Risco | Idempotência |
|---|---|---|---|---|
| `adicionar_imagem_produto` | Imagens e Mídia | `catalog:write` | `WRITE` | Sim (`operation_id`) |
| `listar_imagens_produto` | Imagens e Mídia | `catalog:read` | `READ` | N/A |
| `definir_imagem_principal` | Imagens e Mídia | `catalog:write` | `WRITE` | N/A |
| `remover_imagem_produto` | Imagens e Mídia | `catalog:write` | `WRITE` | N/A |

#### 4.1 `adicionar_imagem_produto`
Adiciona com segurança uma imagem externa ao produto da loja ativa.
- **Entrada**:
  ```typescript
  {
    product_id: string; // UUID
    source_url: string; // URL HTTPS
    alt_text?: string;
    is_primary?: boolean;
    position?: number; // 1 a 10
    color?: string;
    operation_id?: string;
  }
  ```
- **Comportamento de Primeira Imagem**: Se o produto ainda não possui nenhuma imagem, a primeira imagem adicionada recebe automaticamente `is_primary = true`, `image_order = 1` e sincroniza `products.image_url`.
- **Compensação Atômica**: Se o upload no Supabase Storage suceder mas o insert no banco de dados falhar, o serviço remove imediatamente o arquivo recém-enviado do bucket.

#### 4.2 `listar_imagens_produto`
Retorna as imagens de um produto ordenadas por prioridade.
- **Entrada**: `{ product_id: string }`
- **Retorno**: Array de objetos contendo `id`, `product_id`, `image_url`, `alt_text`, `is_primary`, `image_order`, `color_association`.
- **Segurança**: Nunca retorna service keys, paths internos privados ou credenciais.

#### 4.3 `definir_imagem_principal`
Promove uma imagem existente a capa principal do produto.
- **Entrada**: `{ product_id: string, image_id: string }`
- **Efeito**: Define a imagem alvo como `is_primary = true`, rebaixa as outras imagens para `is_primary = false` e atualiza a coluna `products.image_url`.

#### 4.4 `remover_imagem_produto`
Remove uma imagem do banco e exclui o arquivo correspondente do Supabase Storage.
- **Entrada**: `{ product_id: string, image_id: string }`
- **Promoção Automática**: Se a imagem excluída era a imagem principal e ainda restam fotos, a próxima imagem na fila é promovida a principal (`is_primary = true`, `image_order = 1`). Se não restarem imagens, `products.image_url` é redefinido para `null`.

---

### 5. Arquitetura de Defesa SSRF (Server-Side Request Forgery)
Para garantir que a ingestão de URLs externas não seja explorada para varredura ou vazamento de rede interna:
1. **Protocolo Estrito**: Apenas URLs iniciadas com `https://` são aceitas em produção.
2. **Blocklist de IPs e Hostnames**:
   - `localhost`, `127.0.0.1`, `::1`
   - Redes Privadas IPv4 (RFC 1918): `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
   - Carrier-grade NAT: `100.64.0.0/10`
   - Link-local e Metadata Cloud: `169.254.0.0/16` (especialmente `169.254.169.254`)
   - Multicast e Broadcast: `224.0.0.0/4`, `255.255.255.255`
   - Endereços IPv6 Privados: `fe80::/10` (link-local), `fc00::/7` (unique local), `::ffff:127.0.0.1` (IPv4-mapped)
3. **Resolução de DNS & Prevenção de DNS Rebinding**: O host é resolvido via DNS e cada endereço IP retornado é validado contra a blocklist antes de qualquer tráfego HTTP.
4. **Validação de Redirecionamentos**: O download é executado com `redirect: 'manual'`. A cada redirecionamento HTTP (301, 302, 307, 308), a nova URL é submetida novamente à validação SSRF completa (máximo de 3 redirects).
5. **Limites de Stream e Timeout**: Timeout de 10 segundos com `AbortController` e limite de 10 MB em streaming.

---

### 6. Validação de Conteúdo & Magic Bytes
Não confiamos apenas no cabeçalho `Content-Type` fornecido pelo servidor remoto:
- **Sniffing de Magic Bytes**:
  - JPEG: `0xFF, 0xD8, 0xFF`
  - PNG: `0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A`
  - WebP: `RIFF` nos bytes 0..3 e `WEBP` nos bytes 8..11
- **Bloqueio Terminante de SVG e HTML**: Payloads contendo tags `<svg`, `<?xml`, `<!DOCTYPE` ou `<html` são rejeitados com `IMAGE_TYPE_NOT_SUPPORTED` para impedir injeção de scripts (XSS).

---

### 7. Isolamento Multi-Tenant
Todas as operações de mídia derivam a autoridade de tenant estritamente de `session.activeStoreId`.
- Se uma credencial da Loja A tentar adicionar, listar, alterar ou remover imagem de um produto pertencente à Loja B: a resposta é `PRODUCT_NOT_FOUND` (prevenindo enumeração).
- Tentativas de passar `store_id` pelo payload do cliente são ignoradas.

---

### 8. Idempotência com `operation_id`
Para retentativas seguras em conexões intermitentes:
- Mesma chave `operation_id` + mesmo produto + mesma URL: Retorna o objeto da imagem já criada com `duplicate: true`, sem novo download nem nova escrita.
- Mesma chave `operation_id` + parâmetros divergentes: Rejeitado imediatamente com `IDEMPOTENCY_CONFLICT`.

---

### 9. Exemplo Canônico: Cadastro do "Perfume Rose Noir"
Demonstração de execução sequencial pelo agente de IA:

#### Passo 1 — Criar o Produto:
```json
{
  "tool": "criar_produto",
  "arguments": {
    "name": "Perfume Rose Noir",
    "retail_price": 259,
    "wholesale_price": 189,
    "category": "Perfumes"
  }
}
```
*Retorno*: `{ "created": true, "product": { "id": "uuid-rose-noir-123", ... } }`

#### Passo 2 — Adicionar Imagem:
```json
{
  "tool": "adicionar_imagem_produto",
  "arguments": {
    "product_id": "uuid-rose-noir-123",
    "source_url": "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800",
    "alt_text": "Frasco de Perfume Rose Noir 100ml",
    "is_primary": true,
    "operation_id": "rose-noir-media-001"
  }
}
```
*Retorno*: `{ "image": { "id": "img-456", "image_url": "https://.../product-images/...", "is_primary": true }, "duplicate": false }`

#### Passo 3 — Lançar Saldo Físico Inicial de Estoque (10 unidades):
```json
{
  "tool": "ajustar_estoque",
  "arguments": {
    "product_id": "uuid-rose-noir-123",
    "operation": "increase",
    "quantity": 10,
    "reason_code": "initial_balance",
    "operation_id": "rose-noir-stock-001"
  }
}
```
*Retorno*: `{ "adjusted": true, "current_stock": 10, ... }`
