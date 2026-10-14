import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { McpServer } from '@modelcontextprotocol/server';
import { AgentSession } from '../src/auth/agent-session.js';
import { AgentContext } from '../src/auth/agent-context.js';
import { CatalogService } from '../src/services/catalog.service.js';
import { StoreService } from '../src/services/store.service.js';
import { InventoryService } from '../src/services/inventory.service.js';
import { GradeService } from '../src/services/grade.service.js';
import { ProductMediaService } from '../src/services/product-media.service.js';

import { registerCatalogHealthTool } from '../src/tools/catalog-health.tool.js';
import { registerListarProdutosTool } from '../src/tools/listar-produtos.tool.js';
import { registerObterProdutoTool } from '../src/tools/obter-produto.tool.js';
import { registerBuscarCatalogoTool } from '../src/tools/buscar-catalogo.tool.js';
import { registerBuscarLojasTool } from '../src/tools/buscar-lojas.tool.js';
import { registerSelecionarLojaTool } from '../src/tools/selecionar-loja.tool.js';
import { registerObterLojaAtivaTool } from '../src/tools/obter-loja-ativa.tool.js';
import { registerCriarProdutoTool } from '../src/tools/criar-produto.tool.js';
import { registerAtualizarProdutoTool } from '../src/tools/atualizar-produto.tool.js';
import { registerDesativarProdutoTool } from '../src/tools/desativar-produto.tool.js';
import { registerAtualizarProdutosEmLoteTool } from '../src/tools/atualizar-produtos-em-lote.tool.js';
import { registerReconciliarVariacoesProdutoTool } from '../src/tools/reconciliar-variacoes-produto.tool.js';
import { registerConsultarEstoqueTool } from '../src/tools/consultar-estoque.tool.js';
import { registerAjustarEstoqueTool } from '../src/tools/ajustar-estoque.tool.js';
import { registerListarModelosGradeTool } from '../src/tools/listar-modelos-grade.tool.js';
import { registerObterModeloGradeTool } from '../src/tools/obter-modelo-grade.tool.js';
import { registerCriarModeloGradeTool } from '../src/tools/criar-modelo-grade.tool.js';
import { registerAplicarGradeProdutoTool } from '../src/tools/aplicar-grade-produto.tool.js';
import { registerAdicionarImagemProdutoTool } from '../src/tools/adicionar-imagem-produto.tool.js';
import { registerListarImagensProdutoTool } from '../src/tools/listar-imagens-produto.tool.js';
import { registerDefinirImagemPrincipalTool } from '../src/tools/definir-imagem-principal.tool.js';
import { registerRemoverImagemProdutoTool } from '../src/tools/remover-imagem-produto.tool.js';
import { registerObterPoliticaCadastroProdutoTool } from '../src/tools/obter-politica-cadastro-produto.tool.js';
import { registerObterDefaultsCadastroProdutoTool } from '../src/tools/obter-defaults-cadastro-produto.tool.js';
import { registerAtualizarDefaultsCadastroProdutoTool } from '../src/tools/atualizar-defaults-cadastro-produto.tool.js';
import { registerPrepararProdutoTool } from '../src/tools/preparar-produto.tool.js';
import { registerAnalisarImportacaoProdutosTool } from '../src/tools/analisar-importacao-produtos.tool.js';
import { registerCriarCategoriaTool } from '../src/tools/criar-categoria.tool.js';
import { registerListarCategoriasTool } from '../src/tools/listar-categorias.tool.js';

describe('Phase L: MCP Tool Schema Lint & Identifier Compliance', () => {
  const IDENTIFIER_REGEX = /^[a-zA-Z0-9_.-]{1,64}$/;

  function createTestServer() {
    const server = new McpServer({
      name: 'shopflow-catalog-ai-test',
      version: '1.0.0',
    });

    const mockContext: AgentContext = {
      sessionId: 'test-session-1',
      principalId: 'test-user',
      principalType: 'tenant',
      activeStoreId: '11111111-1111-1111-1111-111111111111',
      storeAccess: { mode: 'restricted', storeIds: ['11111111-1111-1111-1111-111111111111'] },
      scopes: [
        'catalog:read',
        'catalog:write',
        'stock:read',
        'stock:adjust',
        'grade:read',
        'grade:write',
        'store:list',
        'store:select',
      ],
      name: 'Test Agent',
    };

    const session = new AgentSession(mockContext);
    const catalogService = new CatalogService(session);
    const storeService = new StoreService(session);
    const inventoryService = new InventoryService(session);
    const gradeService = new GradeService(session);
    const mediaService = new ProductMediaService(session);

    registerCatalogHealthTool(server, catalogService);
    registerListarProdutosTool(server, catalogService);
    registerObterProdutoTool(server, catalogService);
    registerBuscarCatalogoTool(server, catalogService);
    registerBuscarLojasTool(server, storeService);
    registerSelecionarLojaTool(server, storeService);
    registerObterLojaAtivaTool(server, storeService);
    registerCriarProdutoTool(server, catalogService);
    registerAtualizarProdutoTool(server, catalogService);
    registerDesativarProdutoTool(server, catalogService);
    registerAtualizarProdutosEmLoteTool(server, catalogService);
    registerReconciliarVariacoesProdutoTool(server, catalogService);
    registerConsultarEstoqueTool(server, inventoryService);
    registerAjustarEstoqueTool(server, inventoryService);
    registerListarModelosGradeTool(server, gradeService);
    registerObterModeloGradeTool(server, gradeService);
    registerCriarModeloGradeTool(server, gradeService);
    registerAplicarGradeProdutoTool(server, gradeService);
    registerAdicionarImagemProdutoTool(server, mediaService);
    registerListarImagensProdutoTool(server, mediaService);
    registerDefinirImagemPrincipalTool(server, mediaService);
    registerRemoverImagemProdutoTool(server, mediaService);
    registerObterPoliticaCadastroProdutoTool(server, catalogService);
    registerObterDefaultsCadastroProdutoTool(server, catalogService);
    registerAtualizarDefaultsCadastroProdutoTool(server, catalogService);
    registerPrepararProdutoTool(server, catalogService);
    registerAnalisarImportacaoProdutosTool(server, catalogService);
    registerCriarCategoriaTool(server, catalogService);
    registerListarCategoriasTool(server, catalogService);

    return server;
  }

  it('L1 & L2: All 29 MCP tools have valid names and compliant schema property identifiers', () => {
    const server = createTestServer();
    const registeredTools = (server as any)._registeredTools as Record<string, any>;
    assert.ok(registeredTools, 'Server must have registered tools map/record');

    const toolNames = Object.keys(registeredTools);
    assert.equal(toolNames.length, 29, `Expected exactly 29 tools, found ${toolNames.length}`);

    const invalidIdentifiers: Array<{ tool: string; property: string }> = [];

    function validateProperties(schemaObj: any, toolName: string, path = '') {
      if (!schemaObj || typeof schemaObj !== 'object') return;

      if (schemaObj.properties && typeof schemaObj.properties === 'object') {
        for (const propName of Object.keys(schemaObj.properties)) {
          const fullPath = path ? `${path}.${propName}` : propName;
          if (!IDENTIFIER_REGEX.test(propName)) {
            invalidIdentifiers.push({ tool: toolName, property: fullPath });
          }
          validateProperties(schemaObj.properties[propName], toolName, fullPath);
        }
      }

      if (schemaObj.items) {
        validateProperties(schemaObj.items, toolName, `${path}[]`);
      }
    }

    for (const [toolName, toolDef] of Object.entries(registeredTools)) {
      assert.match(
        toolName,
        IDENTIFIER_REGEX,
        `Tool name "${toolName}" must match MCP identifier pattern`
      );

      // JSON Schema extraction from Zod parameter definition
      let jsonSchema: any;
      if (toolDef.inputSchema) {
        if (typeof (toolDef.inputSchema as any)._def !== 'undefined') {
          // Zod schema: inspect shape or _def
          const shape = (toolDef.inputSchema as any).shape || (toolDef.inputSchema as any)._def?.shape?.();
          if (shape) {
            for (const key of Object.keys(shape)) {
              if (!IDENTIFIER_REGEX.test(key)) {
                invalidIdentifiers.push({ tool: toolName, property: key });
              }
            }
          }
        } else {
          jsonSchema = toolDef.inputSchema;
          validateProperties(jsonSchema, toolName);
        }
      }
    }

    assert.equal(
      invalidIdentifiers.length,
      0,
      `Found ${invalidIdentifiers.length} invalid identifiers: ${JSON.stringify(invalidIdentifiers, null, 2)}`
    );
  });

  it('L3: preparar_produto schema specifically has NO accented property names', () => {
    const server = createTestServer();
    const registeredTools = (server as any)._registeredTools as Record<string, any>;
    const prepTool = registeredTools['preparar_produto'];
    assert.ok(prepTool, 'preparar_produto tool must be registered');

    const shape = (prepTool.inputSchema as any).shape || (prepTool.inputSchema as any)._def?.shape?.();
    assert.ok(shape, 'preparar_produto must have shape');

    const propertyKeys = Object.keys(shape);

    assert.equal(propertyKeys.includes('preço'), false, 'Schema must not contain "preço"');
    assert.equal(propertyKeys.includes('preço_atacado'), false, 'Schema must not contain "preço_atacado"');
    assert.equal(propertyKeys.includes('gênero'), false, 'Schema must not contain "gênero"');

    // Confirm canonical ASCII alternatives exist
    assert.ok(propertyKeys.includes('retail_price'));
    assert.ok(propertyKeys.includes('price'));
    assert.ok(propertyKeys.includes('preco'));
    assert.ok(propertyKeys.includes('wholesale_price'));
    assert.ok(propertyKeys.includes('preco_atacado'));
    assert.ok(propertyKeys.includes('product_gender'));
    assert.ok(propertyKeys.includes('genero'));
  });
});
