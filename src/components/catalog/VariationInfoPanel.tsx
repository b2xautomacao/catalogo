
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductVariation } from "@/types/variation";
import { formatCurrency } from "@/lib/utils";
import { Package, Palette, Info, AlertTriangle } from "lucide-react";

export interface VariationInfoPanelProps {
  variation: ProductVariation;
  basePrice?: number;
  showAdvancedInfo?: boolean;
  showStock?: boolean;
}

const VariationInfoPanel: React.FC<VariationInfoPanelProps> = ({
  variation,
  basePrice = 0,
  showAdvancedInfo = false,
  showStock = false,
}) => {
  const finalPrice = basePrice + (variation.price_adjustment || 0);
  const isOutOfStock = variation.stock === 0;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          Variação Selecionada
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Atributos da variação */}
        <div className="flex flex-wrap items-center gap-2">
          {variation.color && (
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">
                {variation.hex_color && (
                  <div
                    className="w-3 h-3 rounded-full mr-2 border"
                    style={{ backgroundColor: variation.hex_color }}
                  />
                )}
                {variation.color}
              </Badge>
            </div>
          )}
          
          {variation.size && (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">
                Tamanho: {variation.size}
              </Badge>
            </div>
          )}
          
          {variation.material && (
            <Badge variant="secondary">
              Material: {variation.material}
            </Badge>
          )}
        </div>

        {/* Informações básicas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {variation.sku && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">SKU:</span>
              <div className="font-mono text-sm">{variation.sku}</div>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Preço:</span>
            <div className="text-lg font-semibold text-primary">
              {formatCurrency(finalPrice)}
              {variation.price_adjustment !== 0 && (
                <span className="text-sm text-muted-foreground ml-2">
                  ({variation.price_adjustment > 0 ? '+' : ''}
                  {formatCurrency(variation.price_adjustment)})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Estoque - apenas se showStock for true */}
        {showStock && (
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Disponibilidade:</span>
            <div className="flex items-center gap-2">
              <span className={`font-medium ${
                isOutOfStock ? 'text-red-600' : 'text-green-600'
              }`}>
                {variation.stock} unidades disponíveis
              </span>
              {isOutOfStock && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Esgotado
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Informações avançadas */}
        {showAdvancedInfo && (
          <div className="border-t pt-3 space-y-3">
            <h5 className="font-medium text-sm text-muted-foreground">
              Informações Técnicas
            </h5>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Status:</span>
                <div className={`font-medium ${
                  variation.is_active ? 'text-green-600' : 'text-red-600'
                }`}>
                  {variation.is_active ? 'Ativo' : 'Inativo'}
                </div>
              </div>
              
              {variation.display_order !== undefined && (
                <div>
                  <span className="text-muted-foreground">Ordem:</span>
                  <div className="font-medium">{variation.display_order}</div>
                </div>
              )}
            </div>

            {variation.created_at && (
              <div className="text-xs text-muted-foreground">
                Criado em: {new Date(variation.created_at).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VariationInfoPanel;
