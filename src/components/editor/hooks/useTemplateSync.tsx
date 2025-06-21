
import { useEffect } from 'react';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { useEditorStore } from '../stores/useEditorStore';
import { useAuth } from '@/hooks/useAuth';

export const useTemplateSync = () => {
  const { profile } = useAuth();
  const { settings, updateSettings } = useCatalogSettings();
  const { configuration, updateConfiguration, syncWithDatabase } = useEditorStore();

  // Sincronizar configurações do banco com o editor
  useEffect(() => {
    if (settings && profile?.store_id) {
      // Atualizar configurações do editor com dados do banco
      updateConfiguration('global.primaryColor', settings.primary_color);
      updateConfiguration('global.secondaryColor', settings.secondary_color);
      updateConfiguration('global.accentColor', settings.accent_color);
      updateConfiguration('global.backgroundColor', settings.background_color);
      updateConfiguration('global.textColor', settings.text_color);
      updateConfiguration('global.templateName', settings.template_name);
      
      // Configurações de checkout
      updateConfiguration('checkout.colors.primary', settings.primary_color);
      updateConfiguration('checkout.colors.secondary', settings.secondary_color);
      updateConfiguration('checkout.colors.accent', settings.accent_color);
      updateConfiguration('checkout.showPrices', settings.show_prices);
      updateConfiguration('checkout.allowFilters', settings.allow_categories_filter);
    }
  }, [settings, profile?.store_id, updateConfiguration]);

  // Função para salvar no banco
  const saveToDatabase = async () => {
    if (!settings || !updateSettings) return;

    const updates = {
      template_name: configuration.global.templateName,
      primary_color: configuration.global.primaryColor,
      secondary_color: configuration.global.secondaryColor,
      accent_color: configuration.global.accentColor,
      background_color: configuration.global.backgroundColor,
      text_color: configuration.global.textColor,
      border_color: configuration.global.borderColor,
      show_prices: configuration.checkout.showPrices,
      allow_categories_filter: configuration.checkout.allowFilters,
    };

    return await updateSettings(updates);
  };

  return {
    settings,
    saveToDatabase,
    isConnected: !!settings
  };
};
