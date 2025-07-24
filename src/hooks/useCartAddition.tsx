
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useStorePriceModel } from '@/hooks/useStorePriceModel';
import { Product, ProductVariation } from '@/types/product';
import { createCartItem } from '@/utils/cartHelpers';
import { CatalogType } from '@/hooks/useCatalog';

interface UseCartAdditionProps {
  onAddToCart: (product: Product, quantity: number, variation?: ProductVariation) => void;
}

export const useCartAddition = ({ onAddToCart }: UseCartAdditionProps) => {
  const { toast } = useToast();

  const validateAndAddToCart = useCallback(
    (
      product: Product,
      quantity: number,
      catalogType: CatalogType,
      selectedVariation?: ProductVariation
    ) => {
      // Obter modelo de preço da loja
      const storeId = product.store_id;
      
      // Validações básicas
      if (quantity <= 0) {
        toast({
          title: "Quantidade inválida",
          description: "A quantidade deve ser maior que zero.",
          variant: "destructive",
        });
        return false;
      }

      // Validar estoque se não permite estoque negativo
      const availableStock = selectedVariation ? selectedVariation.stock : product.stock;
      if (!product.allow_negative_stock && availableStock < quantity) {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${availableStock} unidades disponíveis.`,
          variant: "destructive",
        });
        return false;
      }

      // Chamar função de adição ao carrinho
      onAddToCart(product, quantity, selectedVariation);
      
      toast({
        title: "Produto adicionado!",
        description: `${quantity} unidade(s) adicionada(s) ao carrinho.`,
      });
      
      return true;
    },
    [onAddToCart, toast]
  );

  const addToCartWithModelValidation = useCallback(
    (
      product: Product,
      quantity: number = 1,
      catalogType: CatalogType = 'retail',
      selectedVariation?: ProductVariation,
      priceModel?: string
    ) => {
      const modelKey = priceModel || 'retail_only';
      
      // Para wholesale_only, aplicar quantidade mínima
      let finalQuantity = quantity;
      if (modelKey === 'wholesale_only' && product.min_wholesale_qty) {
        finalQuantity = Math.max(quantity, product.min_wholesale_qty);
        
        if (finalQuantity !== quantity) {
          toast({
            title: "Quantidade ajustada",
            description: `Quantidade mínima para atacado: ${product.min_wholesale_qty} unidades.`,
          });
        }
      }

      return validateAndAddToCart(product, finalQuantity, catalogType, selectedVariation);
    },
    [validateAndAddToCart, toast]
  );

  return {
    validateAndAddToCart,
    addToCartWithModelValidation,
  };
};
