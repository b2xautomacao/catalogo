import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MCP_TOOLS,
  MCP_SCOPES,
  MCP_RATE_LIMITS,
  MCP_ERROR_CATALOG,
  generateMarkdownDocs,
  generateAiGuide,
} from '../mcpDocsRegistry';
import {
  maskKeyPrefix,
  getCredentialStatus,
  hashApiKeySHA256,
} from '../apiKeyCrypto';

describe('SPRINT IA — Tenant MCP Hub Consistency & Security Tests', () => {
  const EXPECTED_TOOL_COUNT = 17;
  const EXPECTED_SCOPE_COUNT = 8;
  const EXPECTED_ERROR_COUNT = 11;

  it('1. Consistency: Registered MCP Tools == Documented MCP Tools (Exatamente 17)', () => {
    assert.equal(
      MCP_TOOLS.length,
      EXPECTED_TOOL_COUNT,
      `O MCP deve possuir exatamente ${EXPECTED_TOOL_COUNT} ferramentas registradas e documentadas. Encontrado: ${MCP_TOOLS.length}`
    );

    const expectedToolNames = [
      'catalog_health',
      'listar_produtos',
      'obter_produto',
      'buscar_catalogo',
      'criar_produto',
      'atualizar_produto',
      'desativar_produto',
      'atualizar_produtos_em_lote',
      'consultar_estoque',
      'ajustar_estoque',
      'listar_modelos_grade',
      'obter_modelo_grade',
      'criar_modelo_grade',
      'aplicar_grade_produto',
      'buscar_lojas',
      'obter_loja_ativa',
      'selecionar_loja',
    ];

    const registeredNames = MCP_TOOLS.map((t) => t.name);

    for (const name of expectedToolNames) {
      assert.ok(
        registeredNames.includes(name),
        `Ferramenta oficial '${name}' deve estar registrada e documentada.`
      );
    }
  });

  it('2. Consistency: Registered Scopes == Documented Scopes (Exatamente 8)', () => {
    assert.equal(
      MCP_SCOPES.length,
      EXPECTED_SCOPE_COUNT,
      `O sistema deve possuir exatamente ${EXPECTED_SCOPE_COUNT} escopos canônicos documentados.`
    );

    const validScopeStrings = MCP_SCOPES.map((s) => s.scope);

    // Cada uma das 17 ferramentas deve apontar para um escopo canônico válido
    for (const tool of MCP_TOOLS) {
      assert.ok(
        validScopeStrings.includes(tool.requiredScope),
        `A ferramenta '${tool.name}' requer escopo '${tool.requiredScope}', que deve existir na lista de scopes canônicos.`
      );
    }
  });

  it('3. Consistency: Error Catalog possui 11 códigos de erro padronizados', () => {
    assert.equal(
      MCP_ERROR_CATALOG.length,
      EXPECTED_ERROR_COUNT,
      `O catálogo de erros deve conter ${EXPECTED_ERROR_COUNT} códigos de erro.`
    );

    const errorCodes = MCP_ERROR_CATALOG.map((e) => e.code);
    assert.ok(errorCodes.includes('INVALID_CREDENTIAL'));
    assert.ok(errorCodes.includes('SCOPE_DENIED'));
    assert.ok(errorCodes.includes('STORE_ACCESS_DENIED'));
    assert.ok(errorCodes.includes('STORE_CONTEXT_REQUIRED'));
    assert.ok(errorCodes.includes('IDEMPOTENCY_CONFLICT'));
    assert.ok(errorCodes.includes('RATE_LIMITED'));
  });

  it('4. Markdown Documentation: Gera documentação completa para LLMs sem segredos brutos', () => {
    const md = generateMarkdownDocs('https://mcp.exemplo.com.br/mcp');

    assert.ok(md.includes('# B2XCATALOGO — MCP Server Documentation'));
    assert.ok(md.includes('https://mcp.exemplo.com.br/mcp'));
    assert.ok(md.includes('Rate Limits'));
    assert.ok(md.includes('Catálogo de Erros'));

    // Verifica que todas as 17 ferramentas estão no Markdown
    for (const tool of MCP_TOOLS) {
      assert.ok(
        md.includes(`#### \`${tool.name}\``),
        `O Markdown gerado deve conter a seção da ferramenta '${tool.name}'.`
      );
    }

    // NUNCA deve conter segredos brutos
    assert.ok(!md.includes('b2x_live_secret'));
    assert.ok(!md.includes('service_role'));
  });

  it('5. Scoped AI Guide: Credencial Read-Only filtra estritamente e NÃO inclui ferramentas de escrita', () => {
    const readOnlyScopes = ['catalog:read', 'stock:read', 'grade:read'];
    const guide = generateAiGuide({
      storeName: 'Loja Exemplo',
      scopes: readOnlyScopes,
      endpointUrl: 'https://mcp.exemplo.com.br/mcp',
    });

    // Ferramentas de leitura DEVEM estar presentes
    assert.ok(guide.includes('buscar_catalogo'));
    assert.ok(guide.includes('consultar_estoque'));
    assert.ok(guide.includes('obter_produto'));

    // Ferramentas de escrita NÃO DEVEM estar presentes
    assert.ok(!guide.includes('`criar_produto`'));
    assert.ok(!guide.includes('`atualizar_produto`'));
    assert.ok(!guide.includes('`desativar_produto`'));
    assert.ok(!guide.includes('`ajustar_estoque`'));
    assert.ok(!guide.includes('`aplicar_grade_produto`'));

    // Deve conter orientações claras
    assert.ok(guide.includes('Você pode:'));
    assert.ok(guide.includes('Você **NÃO pode**:'));
    assert.ok(guide.includes('Criar, editar ou desativar produtos'));
    assert.ok(guide.includes('Alterar ou movimentar saldos de estoque'));

    // Deve conter placeholder seguro e nunca chave real
    assert.ok(guide.includes('<COLE_SUA_CHAVE_AQUI>'));
    assert.ok(!guide.includes('b2x_live_secret'));
  });

  it('6. Scoped AI Guide: Credencial com stock:adjust inclui ajustar_estoque e idempotência', () => {
    const stockScopes = ['stock:read', 'stock:adjust'];
    const guide = generateAiGuide({
      storeName: 'Loja Calçados',
      scopes: stockScopes,
      endpointUrl: 'https://mcp.exemplo.com.br/mcp',
    });

    assert.ok(guide.includes('consultar_estoque'));
    assert.ok(guide.includes('ajustar_estoque'));
    assert.ok(guide.includes('Idempotência'));
    assert.ok(guide.includes('operation_id'));

    // Não deve conter ferramentas de escrita de catálogo
    assert.ok(!guide.includes('`criar_produto`'));
  });

  it('7. Key Crypto & Masking: Máscara de prefixo segura e resolução correta de status', async () => {
    // 7.1 Masking de prefixo
    const prefix = 'b2x_live_ab1234567890cdef';
    const masked = maskKeyPrefix(prefix);
    assert.equal(masked, 'b2x_live_ab12••••••');

    // 7.2 Status ATIVA
    assert.equal(getCredentialStatus(null, null), 'ATIVA');

    // 7.3 Status REVOGADA
    assert.equal(
      getCredentialStatus(new Date().toISOString(), null),
      'REVOGADA'
    );

    // 7.4 Status EXPIRADA
    const pastDate = new Date(Date.now() - 100000).toISOString();
    assert.equal(getCredentialStatus(null, pastDate), 'EXPIRADA');

    // 7.5 Hashing SHA-256
    const testSecret = 'b2x_live_test_secret_123456';
    const hash = await hashApiKeySHA256(testSecret);
    assert.equal(typeof hash, 'string');
    assert.equal(hash.length, 64);
    assert.equal(/^[0-9a-f]{64}$/.test(hash), true);

    // Mesmo segredo deve produzir o mesmo hash (determinístico)
    const hash2 = await hashApiKeySHA256(testSecret);
    assert.equal(hash, hash2);
  });
});
