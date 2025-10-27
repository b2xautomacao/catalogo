import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { extractColorsFromImage, ColorPalette, getDefaultPaletteForTemplate } from '@/utils/colorExtractor';
import { useToast } from '@/hooks/use-toast';

interface UseSmartColorsReturn {
  palette: ColorPalette | null;
  loading: boolean;
  error: string | null;
  extractFromLogo: (logoUrl: string) => Promise<void>;
  applyPalette: (palette: ColorPalette) => void;
  resetToDefault: (templateName: string) => void;
  savePalette: (storeId: string, palette: ColorPalette) => Promise<boolean>;
}

export const useSmartColors = (storeId?: string, autoExtract: boolean = false): UseSmartColorsReturn => {
  const [palette, setPalette] = useState<ColorPalette | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Extrai cores do logo
   */
  const extractFromLogo = async (logoUrl: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🎨 Extraindo cores do logo:', logoUrl);
      const extractedPalette = await extractColorsFromImage(logoUrl);
      
      setPalette(extractedPalette);
      applyPalette(extractedPalette);

      console.log('✅ Paleta extraída:', extractedPalette);
      
      toast({
        title: 'Cores extraídas!',
        description: 'Paleta de cores gerada automaticamente do seu logo.',
      });

      return;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao extrair cores';
      console.error('❌ Erro ao extrair cores:', err);
      setError(errorMessage);
      
      toast({
        title: 'Erro ao extrair cores',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Aplica paleta de cores ao documento
   */
  const applyPalette = (colorPalette: ColorPalette) => {
    const root = document.documentElement;

    root.style.setProperty('--template-primary', colorPalette.primary);
    root.style.setProperty('--template-secondary', colorPalette.secondary);
    root.style.setProperty('--template-accent', colorPalette.accent);
    root.style.setProperty('--template-neutral', colorPalette.neutral);
    root.style.setProperty('--template-text', colorPalette.text);
    root.style.setProperty('--template-background', colorPalette.background);

    // Aplicar também em variáveis CSS customizadas
    root.style.setProperty('--primary', colorPalette.primary);
    root.style.setProperty('--secondary', colorPalette.secondary);

    console.log('✅ Paleta aplicada ao documento');
  };

  /**
   * Reseta para cores padrão do template
   */
  const resetToDefault = (templateName: string) => {
    const defaultPalette = getDefaultPaletteForTemplate(templateName);
    setPalette(defaultPalette);
    applyPalette(defaultPalette);

    toast({
      title: 'Cores resetadas',
      description: `Paleta padrão do template ${templateName} restaurada.`,
    });
  };

  /**
   * Salva paleta no banco de dados
   */
  const savePalette = async (storeIdToSave: string, paletteToSave: ColorPalette): Promise<boolean> => {
    try {
      console.log('💾 Salvando paleta no banco:', storeIdToSave);

      // Usar type assertion para contornar tipos não atualizados
      const { error } = await supabase
        .from('store_settings')
        .update({
          logo_color_palette: paletteToSave,
          primary_color: paletteToSave.primary,
          secondary_color: paletteToSave.secondary,
          accent_color: paletteToSave.accent,
          background_color: paletteToSave.background,
          text_color: paletteToSave.text,
        } as any)
        .eq('store_id', storeIdToSave);

      if (error) {
        console.error('❌ Erro ao salvar paleta:', error);
        toast({
          title: 'Erro ao salvar cores',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      console.log('✅ Paleta salva com sucesso');
      toast({
        title: 'Cores salvas!',
        description: 'Sua paleta de cores foi salva com sucesso.',
      });
      
      return true;
    } catch (err) {
      console.error('❌ Erro ao salvar paleta:', err);
      return false;
    }
  };

  /**
   * Carrega paleta salva ao montar o componente
   */
  useEffect(() => {
    const loadSavedPalette = async () => {
      if (!storeId) return;

      try {
        // Usar type assertion para contornar tipos não atualizados
        const { data, error } = await supabase
          .from('store_settings')
          .select('*')
          .eq('store_id', storeId)
          .maybeSingle() as any;

        if (error) {
          console.error('Erro ao carregar paleta salva:', error);
          return;
        }

        if (data?.logo_color_palette) {
          const savedPalette = data.logo_color_palette as ColorPalette;
          setPalette(savedPalette);
          applyPalette(savedPalette);
        } else if (data?.primary_color) {
          // Fallback: construir paleta dos campos individuais
          const fallbackPalette: ColorPalette = {
            primary: data.primary_color || '#0057FF',
            secondary: data.secondary_color || '#FF6F00',
            accent: data.accent_color || '#8E2DE2',
            neutral: '#64748B',
            text: data.text_color || '#1E293B',
            background: data.background_color || '#F8FAFC',
          };
          setPalette(fallbackPalette);
          applyPalette(fallbackPalette);
        }
      } catch (err) {
        console.error('Erro ao carregar paleta:', err);
      }
    };

    loadSavedPalette();
  }, [storeId]);

  return {
    palette,
    loading,
    error,
    extractFromLogo,
    applyPalette,
    resetToDefault,
    savePalette,
  };
};

