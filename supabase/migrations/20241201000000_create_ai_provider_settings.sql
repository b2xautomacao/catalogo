-- Create AI Provider Settings table
CREATE TABLE IF NOT EXISTS ai_provider_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL, -- Changed from UUID to TEXT to support "global"
  default_provider TEXT NOT NULL DEFAULT 'openai' CHECK (default_provider IN ('openai', 'gemini', 'anthropic', 'custom')),
  
  -- OpenAI Configuration
  openai_config JSONB DEFAULT '{"api_key": "", "model": "gpt-3.5-turbo", "max_tokens": 1000, "temperature": 0.7}',
  
  -- Gemini Configuration
  gemini_config JSONB DEFAULT '{"api_key": "", "model": "gemini-pro", "max_tokens": 1000, "temperature": 0.7}',
  
  -- Anthropic Configuration
  anthropic_config JSONB DEFAULT '{"api_key": "", "model": "claude-3-sonnet-20240229", "max_tokens": 1000, "temperature": 0.7}',
  
  -- Custom AI Configuration
  custom_ai_config JSONB DEFAULT '{"api_key": "", "api_endpoint": "", "model": "custom", "max_tokens": 1000, "temperature": 0.7}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(store_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_provider_settings_store_id ON ai_provider_settings(store_id);

-- Enable Row Level Security
ALTER TABLE ai_provider_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own AI provider settings" ON ai_provider_settings
  FOR SELECT USING (
    store_id = 'global' OR store_id IN (
      SELECT id::text FROM stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own AI provider settings" ON ai_provider_settings
  FOR INSERT WITH CHECK (
    store_id = 'global' OR store_id IN (
      SELECT id::text FROM stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own AI provider settings" ON ai_provider_settings
  FOR UPDATE USING (
    store_id = 'global' OR store_id IN (
      SELECT id::text FROM stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own AI provider settings" ON ai_provider_settings
  FOR DELETE USING (
    store_id = 'global' OR store_id IN (
      SELECT id::text FROM stores WHERE owner_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_provider_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_ai_provider_settings_updated_at
  BEFORE UPDATE ON ai_provider_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_provider_settings_updated_at();

-- Insert global configuration
INSERT INTO ai_provider_settings (store_id, default_provider) 
VALUES ('global', 'openai') 
ON CONFLICT (store_id) DO NOTHING;
