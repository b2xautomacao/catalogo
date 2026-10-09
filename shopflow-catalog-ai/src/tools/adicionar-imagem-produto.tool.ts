import { McpServer } from '@modelcontextprotocol/server';
import { ProductMediaService } from '../services/product-media.service.js';
import { AdicionarImagemProdutoSchema } from '../schemas/media.schema.js';
import {
  StoreContextRequiredError,
  ProductNotFoundError,
  ForbiddenError,
  ImageSourceInvalidError,
  ImageSourceForbiddenError,
  ImageDownloadFailedError,
  ImageTooLargeError,
  ImageTypeNotSupportedError,
  ImageInvalidError,
  ImageUploadFailedError,
  IdempotencyConflictError,
} from '../domain/errors.js';

export function registerAdicionarImagemProdutoTool(
  server: McpServer,
  mediaService: ProductMediaService
) {
  server.registerTool(
    'adicionar_imagem_produto',
    {
      description:
        'Adiciona com segurança uma imagem ao produto a partir de uma source_url HTTPS externa. O servidor faz o download, valida integridade/MIME e armazena no storage oficial. Requer catalog:write.',
      inputSchema: AdicionarImagemProdutoSchema,
    },
    async (args) => {
      try {
        const result = await mediaService.adicionarImagem(args);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        if (error instanceof StoreContextRequiredError) {
          return {
            content: [{ type: 'text' as const, text: 'STORE_CONTEXT_REQUIRED' }],
          };
        }
        if (error instanceof ProductNotFoundError) {
          return {
            content: [{ type: 'text' as const, text: 'PRODUCT_NOT_FOUND' }],
          };
        }
        if (error instanceof ForbiddenError) {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: 'FORBIDDEN' }],
          };
        }
        if (error instanceof IdempotencyConflictError) {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: 'IDEMPOTENCY_CONFLICT' }],
          };
        }
        if (error instanceof ImageSourceForbiddenError) {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: 'IMAGE_SOURCE_FORBIDDEN' }],
          };
        }
        if (error instanceof ImageSourceInvalidError) {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: 'IMAGE_SOURCE_INVALID' }],
          };
        }
        if (error instanceof ImageTooLargeError) {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: 'IMAGE_TOO_LARGE' }],
          };
        }
        if (error instanceof ImageTypeNotSupportedError) {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: 'IMAGE_TYPE_NOT_SUPPORTED' }],
          };
        }
        if (error instanceof ImageInvalidError) {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: 'IMAGE_INVALID' }],
          };
        }
        if (error instanceof ImageDownloadFailedError) {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: 'IMAGE_DOWNLOAD_FAILED' }],
          };
        }
        if (error instanceof ImageUploadFailedError) {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: 'IMAGE_UPLOAD_FAILED' }],
          };
        }

        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text' as const, text: `Error adding product image: ${message}` }],
        };
      }
    }
  );
}
