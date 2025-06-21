
import { useEffect, useState, useCallback } from 'react';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { useEditorStore } from '../stores/useEditorStore';
import { useAuth } from '@/hooks/useAuth';

export const useTemplateSync = () => {
  const { profile } = useAuth();
  const { settings, updateSettings, loading } = useCatalogSettings(profile?.store_id);
  const { configuration, updateConfiguration, loadFromDatabase, isDirty } = useEditorStore();
  const [isConnected, setIsConnected] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Aplicar estilos CSS globais
  const applyGlobalStyles = useCallback((currentSettings: any) => {
    if (!currentSettings) return;

    const root = document.documentElement;
    
    // Aplicar cores CSS customizadas
    root.style.setProperty('--template-primary', currentSettings.primary_color || '#0057FF');
    root.style.setProperty('--template-secondary', currentSettings.secondary_color || '#FF6F00');
    root.style.setProperty('--template-accent', currentSettings.accent_color || '#8E2DE2');
    root.style.setProperty('--template-background', currentSettings.background_color || '#F8FAFC');
    root.style.setProperty('--template-text', currentSettings.text_color || '#1E293B');
    root.style.setProperty('--template-border', currentSettings.border_color || '#E2E8F0');
    root.style.setProperty('--template-surface', '#FFFFFF');
    
    // Aplicar gradientes
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

    console.log('useTemplateSync: Estilos aplicados:', {
      primary: currentSettings.primary_color,
      secondary: currentSettings.secondary_color
    });
  }, []);

  // Carregar configurações do banco na inicialização - simplificado
  useEffect(() => {
    if (settings && !hasLoadedOnce && profile?.store_id) {
      console.log('useTemplateSync: Carregando configurações:', settings);
      loadFromDatabase(settings);
      applyGlobalStyles(settings);
      setIsConnected(true);
      setHasLoadedOnce(true);
    }
  }, [settings, hasLoadedOnce, profile?.store_id, loadFromDatabase, applyGlobalStyles]);

  // Aplicar estilos quando as configurações mudarem
  useEffect(() => {
    if (settings && !loading) {
      applyGlobalStyles(settings);
    }
  }, [settings, loading, applyGlobalStyles]);

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
    isConnected: isConnected && !!settings && !loading && !!profile?.store_id,
    loading
  };
};
