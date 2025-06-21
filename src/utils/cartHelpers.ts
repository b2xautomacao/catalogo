
import { Product } from '@/hooks/useProducts';
import { CatalogType } from '@/hooks/useCatalog';
import { CartItem } from '@/hooks/useCart';

export const createCartItem = (
  product: Product, 
  catalogType: CatalogType,
  quantity: number = 1,
  variations?: { size?: string; color?: string }
): CartItem => {
  const price = catalogType === 'wholesale' && product.wholesale_price 
    ? product.wholesale_price 
    : product.retail_price;

  return {
    id: `${product.id}-${catalogType}-${JSON.stringify(variations || {})}`,
    product: {
      id: product.id,
      name: product.name,
      retail_price: product.retail_price,
      wholesale_price: product.wholesale_price,
      min_wholesale_qty: product.min_wholesale_qty,
      image_url: product.image_url
    },
    quantity,
    price,
    originalPrice: product.retail_price, // Adicionar originalPrice obrigatório
    variations,
    catalogType
  };
};
