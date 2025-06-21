
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ShoppingCart, Package, ArrowLeftRight } from 'lucide-react';
import { useCatalogMode } from '@/hooks/useCatalogMode';

interface CatalogModeToggleProps {
  storeIdentifier?: string;
  className?: string;
}

const CatalogModeToggle: React.FC<CatalogModeToggleProps> = ({ 
  storeIdentifier,
  className = ""
}) => {
  const { 
    catalogMode, 
    currentCatalogType, 
    toggleCatalogType,
    isRetailActive,
    isWholesaleActive
  } = useCatalogMode(storeIdentifier);

  // Só mostrar o toggle se estiver no modo 'toggle' e ambos os catálogos estiverem ativos
  if (catalogMode !== 'toggle' || !isRetailActive || !isWholesaleActive) {
    return null;
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-medium text-gray-900">Modo de Visualização</h3>
            <p className="text-sm text-gray-600">
              Alterne entre preços de varejo e atacado
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant={currentCatalogType === 'retail' ? 'default' : 'outline'}
            className="cursor-pointer transition-all"
            onClick={toggleCatalogType}
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            Varejo
          </Badge>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCatalogType}
            className="h-8 w-8 p-0 rounded-full"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          
          <Badge 
            variant={currentCatalogType === 'wholesale' ? 'default' : 'outline'}
            className="cursor-pointer transition-all"
            onClick={toggleCatalogType}
          >
            <Package className="h-3 w-3 mr-1" />
            Atacado
          </Badge>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        {currentCatalogType === 'retail' ? (
          <span>Visualizando preços de varejo • Clique para ver preços de atacado</span>
        ) : (
          <span>Visualizando preços de atacado • Clique para ver preços de varejo</span>
        )}
      </div>
    </Card>
  );
};

export default CatalogModeToggle;
