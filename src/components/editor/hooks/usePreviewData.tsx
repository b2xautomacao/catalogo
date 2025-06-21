
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { Product } from '@/hooks/useProducts';

export const usePreviewData = () => {
  const { profile } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();

  // Produtos de exemplo para preview quando não há produtos reais - com todas as propriedades obrigatórias
  const mockProducts: Product[] = [
    {
      id: '1',
      store_id: 'preview-store',
      name: 'Produto Exemplo 1',
      description: 'Descrição do produto exemplo',
      category: 'Categoria Exemplo',
      retail_price: 29.90,
      wholesale_price: 24.90,
      stock: 10,
      reserved_stock: 0,
      min_wholesale_qty: 1,
      allow_negative_stock: false,
      stock_alert_threshold: 5,
      is_active: true,
      is_featured: false,
      image_url: null,
      meta_title: null,
      meta_description: null,
      seo_slug: null,
      keywords: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      store_id: 'preview-store',
      name: 'Produto Exemplo 2',
      description: 'Descrição do segundo produto',
      category: 'Categoria Exemplo',
      retail_price: 49.90,
      wholesale_price: 39.90,
      stock: 5,
      reserved_stock: 0,
      min_wholesale_qty: 1,
      allow_negative_stock: false,
      stock_alert_threshold: 5,
      is_active: true,
      is_featured: true,
      image_url: null,
      meta_title: null,
      meta_description: null,
      seo_slug: null,
      keywords: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      store_id: 'preview-store',
      name: 'Produto Exemplo 3',
      description: 'Descrição do terceiro produto',
      category: 'Outra Categoria',
      retail_price: 79.90,
      wholesale_price: 64.90,
      stock: 8,
      reserved_stock: 0,
      min_wholesale_qty: 1,
      allow_negative_stock: false,
      stock_alert_threshold: 5,
      is_active: true,
      is_featured: false,
      image_url: null,
      meta_title: null,
      meta_description: null,
      seo_slug: null,
      keywords: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const mockCategories = [
    { id: '1', name: 'Categoria Exemplo', description: 'Exemplo de categoria' },
    { id: '2', name: 'Outra Categoria', description: 'Outra categoria de exemplo' }
  ];

  // Usar produtos reais se disponíveis, senão usar mock
  const previewProducts = (products && products.length > 0) ? products.slice(0, 6) : mockProducts;
  const previewCategories = (categories && categories.length > 0) ? categories.slice(0, 4) : mockCategories;

  return {
    products: previewProducts,
    categories: previewCategories,
    loading: productsLoading || categoriesLoading,
    hasRealData: !!(products && products.length > 0)
  };
};
