-- Create store_colors table
CREATE TABLE IF NOT EXISTS public.store_colors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  hex_color text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_store_color_name UNIQUE (store_id, name)
);

-- Enable RLS for store_colors
ALTER TABLE public.store_colors ENABLE ROW LEVEL SECURITY;

-- Policies for store_colors
CREATE POLICY "Users can view colors of their store"
  ON public.store_colors
  FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert colors in their store"
  ON public.store_colors
  FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update colors in their store"
  ON public.store_colors
  FOR UPDATE
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete colors in their store"
  ON public.store_colors
  FOR DELETE
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );


-- Create store_grades table
CREATE TABLE IF NOT EXISTS public.store_grades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  sizes jsonb NOT NULL,
  default_quantities jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_store_grade_name UNIQUE (store_id, name)
);

-- Enable RLS for store_grades
ALTER TABLE public.store_grades ENABLE ROW LEVEL SECURITY;

-- Policies for store_grades
CREATE POLICY "Users can view grades of their store"
  ON public.store_grades
  FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert grades in their store"
  ON public.store_grades
  FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update grades in their store"
  ON public.store_grades
  FOR UPDATE
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete grades in their store"
  ON public.store_grades
  FOR DELETE
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );
