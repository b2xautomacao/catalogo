
import { useCatalogSettings } from '@/hooks/useCatalogSettings';

export const useMobileLayout = (storeIdentifier?: string) => {
  const { settings } = useCatalogSettings(storeIdentifier);
  
  const mobileColumns = settings?.mobile_columns || 2;
  
  // Gerar classes CSS baseadas na configuração
  const getMobileGridClasses = () => {
    const baseClasses = 'grid gap-4';
    
    if (mobileColumns === 1) {
      return `${baseClasses} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`;
    } else {
      return `${baseClasses} grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`;
    }
  };

  // CSS customizado para o componente de produto
  const getProductCardClasses = () => {
    if (mobileColumns === 1) {
      return 'w-full'; // Produto ocupa toda a largura
    } else {
      return 'w-full'; // Produto se adapta à grade
    }
  };

  return {
    mobileColumns,
    getMobileGridClasses,
    getProductCardClasses,
  };
};
