import React from "react";
import { useTenantTheme } from "@/hooks/useTenantTheme";
import { CatalogSettingsData } from "@/hooks/useCatalogSettings";
import ModernCatalogTemplate from "./templates/layouts/ModernCatalogTemplate";
import IndustrialCatalogTemplate from "./templates/layouts/IndustrialCatalogTemplate";
import MinimalCatalogTemplate from "./templates/layouts/MinimalCatalogTemplate";
import MinimalCleanTemplate from "./templates/layouts/MinimalCleanTemplate";
import ElegantCatalogTemplate from "./templates/layouts/ElegantCatalogTemplate";
import { Store } from "@/hooks/useCatalog";
import { CatalogType } from "@/hooks/useCatalog";

interface TemplateWrapperProps {
  templateName: string;
  store: Store;
  catalogType: CatalogType;
  cartItemsCount: number;
  wishlistCount: number;
  whatsappNumber?: string;
  sellerName?: string;
  storeSettings?: CatalogSettingsData | null;
  onSearch: (query: string) => void;
  onToggleFilters: () => void;
  onCartClick: () => void;
  children: React.ReactNode;
  products?: any[];
  onProductSelect?: (product: any) => void;
}

const TemplateWrapper: React.FC<TemplateWrapperProps> = ({
  templateName,
  store,
  catalogType,
  cartItemsCount,
  wishlistCount,
  whatsappNumber,
  sellerName,
  storeSettings,
  onSearch,
  onToggleFilters,
  onCartClick,
  children,
  products,
  onProductSelect,
}) => {
  // Sempre chamar hooks na mesma ordem, independente de condições
  const storeId = store?.url_slug || store?.id || "";
  const { settings } = useTenantTheme(storeId);

  const templateProps = {
    store,
    catalogType,
    cartItemsCount,
    wishlistCount,
    whatsappNumber,
    sellerName,
    storeSettings,
    onSearch,
    onToggleFilters,
    onCartClick,
    children,
    editorSettings: settings,
    products,
    onProductSelect,
  };

  // Verificação de segurança após os hooks
  if (!store || !storeId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Carregando template...</p>
        </div>
      </div>
    );
  }

  switch (templateName) {
    case "industrial":
      return <IndustrialCatalogTemplate {...templateProps} />;
    case "minimal":
      return <MinimalCatalogTemplate {...templateProps} />;
    case "minimal_clean":
      return <MinimalCleanTemplate {...templateProps} />;
    case "elegant":
      return <ElegantCatalogTemplate {...templateProps} />;
    case "modern":
    default:
      return <ModernCatalogTemplate {...templateProps} />;
  }
};

export default TemplateWrapper;
