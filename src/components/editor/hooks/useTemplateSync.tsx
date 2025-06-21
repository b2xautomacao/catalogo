
import { useEffect } from 'react';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { useEditorStore } from '../stores/useEditorStore';
import { useAuth } from '@/hooks/useAuth';

export const useTemplateSync = () => {
  const { profile } = useAuth();
  const { settings, updateSettings, loading } = useCatalogSettings(profile?.store_id);
  const { configuration, updateConfiguration, loadFromDatabase, isDirty } = useEditorStore();

  // Carregar configurações do banco na inicialização
  useEffect(() => {
    if (settings && !loading && profile?.store_id) {
      console.log('useTemplateSync: Carregando configurações do banco:', settings);
      loadFromDatabase(settings);
    }
  }, [settings, loading, profile?.store_id, loadFromDatabase]);

  // Aplicar estilos CSS globais quando as configurações mudarem
  useEffect(() => {
    if (settings && !loading) {
      applyGlobalStyles(settings);
    }
  }, [settings, loading]);

  // Aplicar estilos CSS globais
  const applyGlobalStyles = (currentSettings: any) => {
    const root = document.documentElement;
    
    // Aplicar cores CSS customizadas
    root.style.setProperty('--template-primary', currentSettings.primary_color || '#0057FF');
    root.style.setProperty('--template-secondary', currentSettings.secondary_color || '#FF6F00');
    root.style.setProperty('--template-accent', currentSettings.accent_color || '#8E2DE2');
    root.style.setProperty('--template-background', currentSettings.background_color || '#F8FAFC');
    root.style.setProperty('--template-text', currentSettings.text_color || '#1E293B');
    root.style.setProperty('--template-border', currentSettings.border_color || '#E2E8F0');
    root.style.setProperty('--template-surface', '#FFFFFF');
    
    // Aplicar gradientes dos botões
    root.style.setProperty('--template-gradient-from', currentSettings.primary_color || '#0057FF');
    root.style.setProperty('--template-gradient-to', currentSettings.secondary_color || '#FF6F00');
    
    // Aplicar configurações de layout
    if (currentSettings.font_family) {
      root.style.setProperty('--template-font-family', currentSettings.font_family);
    }
    
    if (currentSettings.border_radius) {
      root.style.setProperty('--template-border-radius', `${currentSettings.border_radius}px`);
    }
    
    if (currentSettings.layout_spacing) {
      root.style.setProperty('--template-spacing', `${currentSettings.layout_spacing}px`);
    }

    console.log('useTemplateSync: Estilos globais aplicados:', {
      primary: currentSettings.primary_color,
      secondary: currentSettings.secondary_color,
      accent: currentSettings.accent_color,
      background: currentSettings.background_color,
      text: currentSettings.text_color,
      border: currentSettings.border_color,
      template: currentSettings.template_name
    });
  };

  // Função para salvar no banco
  const saveToDatabase = async () => {
    if (!settings || !updateSettings || !profile?.store_id) {
      throw new Error('Configurações não disponíveis para salvar');
    }

    console.log('useTemplateSync: Salvando configurações:', configuration);

    const updates = {
      template_name: configuration.global.template,
      primary_color: configuration.colors.primary,
      secondary_color: configuration.colors.secondary,
      accent_color: configuration.colors.accent,
      background_color: configuration.colors.background,
      text_color: configuration.colors.text,
      border_color: configuration.colors.border,
      font_family: configuration.global.fontFamily,
      layout_spacing: configuration.global.layoutSpacing,
      border_radius: configuration.global.borderRadius,
      show_prices: configuration.checkout.showPrices,
      allow_categories_filter: configuration.checkout.allowFilters,
    };

    const result = await updateSettings(updates);
    
    if (result.error) {
      throw new Error('Erro ao salvar no banco de dados');
    }

    // Aplicar estilos atualizados
    applyGlobalStyles(result.data);

    // Marcar como salvo
    useEditorStore.setState({ isDirty: false });
    
    return result;
  };

  return {
    settings,
    saveToDatabase,
    isConnected: !!settings && !loading && !!profile?.store_id,
    loading
  };
};
