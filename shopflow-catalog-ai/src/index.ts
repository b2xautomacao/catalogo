import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { ContextProviderFactory } from './auth/context-provider.js';
import { AgentSession } from './auth/agent-session.js';
import { CatalogService } from './services/catalog.service.js';
import { StoreService } from './services/store.service.js';
import { InventoryService } from './services/inventory.service.js';
import { GradeService } from './services/grade.service.js';
import { registerCatalogHealthTool } from './tools/catalog-health.tool.js';
import { registerListarProdutosTool } from './tools/listar-produtos.tool.js';
import { registerObterProdutoTool } from './tools/obter-produto.tool.js';
import { registerBuscarCatalogoTool } from './tools/buscar-catalogo.tool.js';
import { registerBuscarLojasTool } from './tools/buscar-lojas.tool.js';
import { registerSelecionarLojaTool } from './tools/selecionar-loja.tool.js';
import { registerObterLojaAtivaTool } from './tools/obter-loja-ativa.tool.js';
import { registerCriarProdutoTool } from './tools/criar-produto.tool.js';
import { registerAtualizarProdutoTool } from './tools/atualizar-produto.tool.js';
import { registerDesativarProdutoTool } from './tools/desativar-produto.tool.js';
import { registerAtualizarProdutosEmLoteTool } from './tools/atualizar-produtos-em-lote.tool.js';
import { registerReconciliarVariacoesProdutoTool } from './tools/reconciliar-variacoes-produto.tool.js';
import { registerConsultarEstoqueTool } from './tools/consultar-estoque.tool.js';
import { registerAjustarEstoqueTool } from './tools/ajustar-estoque.tool.js';
import { registerListarModelosGradeTool } from './tools/listar-modelos-grade.tool.js';
import { registerObterModeloGradeTool } from './tools/obter-modelo-grade.tool.js';
import { registerCriarModeloGradeTool } from './tools/criar-modelo-grade.tool.js';
import { registerAplicarGradeProdutoTool } from './tools/aplicar-grade-produto.tool.js';
import { ProductMediaService } from './services/product-media.service.js';
import { registerAdicionarImagemProdutoTool } from './tools/adicionar-imagem-produto.tool.js';
import { registerListarImagensProdutoTool } from './tools/listar-imagens-produto.tool.js';
import { registerDefinirImagemPrincipalTool } from './tools/definir-imagem-principal.tool.js';
import { registerRemoverImagemProdutoTool } from './tools/remover-imagem-produto.tool.js';
import { registerObterPoliticaCadastroProdutoTool } from './tools/obter-politica-cadastro-produto.tool.js';
import { registerObterDefaultsCadastroProdutoTool } from './tools/obter-defaults-cadastro-produto.tool.js';
import { registerAtualizarDefaultsCadastroProdutoTool } from './tools/atualizar-defaults-cadastro-produto.tool.js';
import { registerPrepararProdutoTool } from './tools/preparar-produto.tool.js';
import { registerAnalisarImportacaoProdutosTool } from './tools/analisar-importacao-produtos.tool.js';
import { registerCriarCategoriaTool } from './tools/criar-categoria.tool.js';
import './config/env.js'; // Triggers env validation on startup — fatal if invalid

async function main() {
  const contextProvider = ContextProviderFactory.create();
  const initialContext = await contextProvider.getContext();
  const session = new AgentSession(initialContext);

  const catalogService = new CatalogService(session);
  const storeService = new StoreService(session);
  const inventoryService = new InventoryService(session);
  const gradeService = new GradeService(session);
  const mediaService = new ProductMediaService(session);

  await serveStdio(() => {
    const server = new McpServer({
      name: "shopflow-catalog-ai",
      version: "1.0.0"
    });

    // Read-Only Catalog Tools (4)
    registerCatalogHealthTool(server, catalogService);
    registerListarProdutosTool(server, catalogService);
    registerObterProdutoTool(server, catalogService);
    registerBuscarCatalogoTool(server, catalogService);

    // Store Resolution & Selection Tools (3)
    registerBuscarLojasTool(server, storeService);
    registerSelecionarLojaTool(server, storeService);
    registerObterLojaAtivaTool(server, storeService);

    // Safe Catalog Write & Lifecycle Tools (5)
    registerCriarProdutoTool(server, catalogService);
    registerAtualizarProdutoTool(server, catalogService);
    registerDesativarProdutoTool(server, catalogService);
    registerAtualizarProdutosEmLoteTool(server, catalogService);
    registerReconciliarVariacoesProdutoTool(server, catalogService);

    // Safe Inventory Read & Write Tools (2)
    registerConsultarEstoqueTool(server, inventoryService);
    registerAjustarEstoqueTool(server, inventoryService);

    // Normalized Grade Template & Snapshot Tools (4)
    registerListarModelosGradeTool(server, gradeService);
    registerObterModeloGradeTool(server, gradeService);
    registerCriarModeloGradeTool(server, gradeService);
    registerAplicarGradeProdutoTool(server, gradeService);

    // Product Media Management Tools (4)
    registerAdicionarImagemProdutoTool(server, mediaService);
    registerListarImagensProdutoTool(server, mediaService);
    registerDefinirImagemPrincipalTool(server, mediaService);
    registerRemoverImagemProdutoTool(server, mediaService);

    // Product Intake Automation & Tenant Defaults Tools (6)
    registerObterPoliticaCadastroProdutoTool(server, catalogService);
    registerObterDefaultsCadastroProdutoTool(server, catalogService);
    registerAtualizarDefaultsCadastroProdutoTool(server, catalogService);
    registerPrepararProdutoTool(server, catalogService);
    registerAnalisarImportacaoProdutosTool(server, catalogService);
    registerCriarCategoriaTool(server, catalogService);

    return server;
  }, {
    onerror: (err) => console.error('[MCP Error]', err.message)
  });
}

main().catch((err) => {
  console.error('Fatal initialization error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
