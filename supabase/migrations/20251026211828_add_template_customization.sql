-- Migration: Add Template Customization Fields to store_settings
-- Created: 2025-10-26
-- Description: Adds fields for advanced template customization including color palette extraction,
--              button styles, footer customization, and header badges

-- Add new columns to store_settings table
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS logo_color_palette jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS auto_extract_colors boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS button_style text DEFAULT 'modern' CHECK (button_style IN ('flat', 'modern', 'rounded')),
ADD COLUMN IF NOT EXISTS footer_style text DEFAULT 'dark' CHECK (footer_style IN ('dark', 'light', 'gradient')),
ADD COLUMN IF NOT EXISTS footer_bg_color text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS footer_text_color text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS header_badges_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS conversion_mode text DEFAULT 'simple' CHECK (conversion_mode IN ('simple', 'optimized'));

-- Add comments for documentation
COMMENT ON COLUMN store_settings.logo_color_palette IS 'JSON object containing extracted color palette from logo: {primary, secondary, accent, neutral, text, background}';
COMMENT ON COLUMN store_settings.auto_extract_colors IS 'Enable automatic color extraction from store logo';
COMMENT ON COLUMN store_settings.button_style IS 'Global button style for catalog: flat (minimal), modern (rounded with shadows), rounded (very rounded)';
COMMENT ON COLUMN store_settings.footer_style IS 'Footer appearance style: dark, light, or gradient';
COMMENT ON COLUMN store_settings.footer_bg_color IS 'Custom background color for footer (overrides footer_style)';
COMMENT ON COLUMN store_settings.footer_text_color IS 'Custom text color for footer (overrides footer_style)';
COMMENT ON COLUMN store_settings.header_badges_enabled IS 'Show conversion badges in header (Fast Delivery, Free Shipping, Secure Checkout)';
COMMENT ON COLUMN store_settings.conversion_mode IS 'Catalog conversion mode: simple (basic) or optimized (with urgency badges, reviews, etc)';

-- Create index on button_style for faster queries
CREATE INDEX IF NOT EXISTS idx_store_settings_button_style ON store_settings(button_style);

-- Create index on footer_style for faster queries
CREATE INDEX IF NOT EXISTS idx_store_settings_footer_style ON store_settings(footer_style);

-- Update existing records to have default values
UPDATE store_settings
SET 
  button_style = COALESCE(button_style, 'modern'),
  footer_style = COALESCE(footer_style, 'dark'),
  header_badges_enabled = COALESCE(header_badges_enabled, true),
  auto_extract_colors = COALESCE(auto_extract_colors, false),
  conversion_mode = COALESCE(conversion_mode, 'simple')
WHERE button_style IS NULL 
   OR footer_style IS NULL 
   OR header_badges_enabled IS NULL 
   OR auto_extract_colors IS NULL
   OR conversion_mode IS NULL;

