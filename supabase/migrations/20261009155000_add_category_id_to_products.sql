-- Migration: Add category_id to products table
-- Ensures canonical relational link to categories(id) with safe nullification on category delete.
-- Idempotent and tenant-safe.

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
