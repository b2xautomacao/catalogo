
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ProductVariation } from '@/types/product';
import { Package, Palette, Hash, CheckCircle2, AlertTriangle } from 'lucide-react';

interface VariationInfoPanelProps {
  variation: ProductVariation;
  basePrice: number;
  showAdvancedInfo?: boolean;
}

const VariationInfoPanel: React.FC<VariationInfoPanelProps> = ({
  variation,
  basePrice,
  showAdvancedInfo = true,
}) => {
  const isGrade = variation.is_grade || variation.variation_type === 'grade';
  const finalPrice = basePrice + (variation.price_adjustment || 0);
  const hasStock = variation.stock > 0;

  return (
    <div className="p-4 bg-slate-50 rounded-lg border-2 border-slate-200 space-y-4">
      {/* Header com contraste melhorado */}
      <div className="flex items-center justify-between">
        <h5 className="font-bold text-lg flex items-center gap-2 text-slate-800">
          {isGrade ? (
            <>
              <Package className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800">Grade Selecionada</span>
            </>
          ) : (
            <>
              <Palette className="h-5 w-5 text-primary" />
              <span className="text-slate-800">Variação Selecionada</span>
            </>
          )}
        </h5>
        
        <Badge 
          variant={hasStock ? "default" : "destructive"}
          className={`flex items-center gap-1 font-semibold px-3 py-1 ${
            hasStock 
              ? "bg-green-100 text-green-800 border-green-300" 
              : "bg-red-100 text-red-800 border-red-300"
          }`}
        >
          {hasStock ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              {variation.stock} disponível
            </>
          ) : (
            <>
              <AlertTriangle className="h-3 w-3" />
              Esgotado
            </>
          )}
        </Badge>
      </div>

      {/* Basic Info com contraste melhorado */}
      <div className="grid grid-cols-2 gap-4">
        {isGrade ? (
          <>
            {variation.grade_name && (
              <div className="bg-white p-3 rounded-md border">
                <span className="text-sm font-medium text-slate-600">Nome da Grade:</span>
                <p className="font-bold text-slate-800 text-lg">{variation.grade_name}</p>
              </div>
            )}
            {variation.grade_color && (
              <div className="bg-white p-3 rounded-md border">
                <span className="text-sm font-medium text-slate-600">Cor:</span>
                <p className="font-bold text-slate-800 text-lg">{variation.grade_color}</p>
              </div>
            )}
          </>
        ) : (
          <>
            {variation.color && (
              <div className="bg-white p-3 rounded-md border">
                <span className="text-sm font-medium text-slate-600">Cor:</span>
                <p className="font-bold text-slate-800">{variation.color}</p>
              </div>
            )}
            {variation.size && (
              <div className="bg-white p-3 rounded-md border">
                <span className="text-sm font-medium text-slate-600">Tamanho:</span>
                <p className="font-bold text-slate-800">{variation.size}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Grade Composition com contraste melhorado */}
      {isGrade && variation.grade_sizes && variation.grade_sizes.length > 0 && (
        <div className="space-y-3 bg-white p-4 rounded-md border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <h6 className="text-base font-bold text-blue-800">
              Composição da Grade:
            </h6>
            <Badge variant="outline" className="text-sm bg-blue-100 text-blue-800 border-blue-300 font-semibold">
              {variation.grade_sizes.length} tamanhos
            </Badge>
          </div>
          
          {/* Grade com contraste melhorado */}
          <div className="grid grid-cols-4 gap-2">
            {variation.grade_sizes.map((size, index) => {
              const pairCount = variation.grade_pairs && variation.grade_pairs[index] ? variation.grade_pairs[index] : 0;
              return (
                <div 
                  key={index}
                  className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-md border-2 border-blue-200 text-center min-h-[3rem]"
                >
                  <span className="text-sm font-bold text-blue-800">{size}</span>
                  {pairCount > 0 && (
                    <span className="text-xs text-blue-600 font-semibold">
                      {pairCount} pares
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Total Pairs Summary com contraste melhorado */}
          {variation.grade_pairs && variation.grade_pairs.length > 0 && (
            <div className="flex items-center justify-between text-sm bg-blue-100 rounded-md p-3 border border-blue-300">
              <span className="font-medium text-blue-700">Total de pares:</span>
              <span className="font-bold text-blue-800 text-lg">
                {variation.grade_pairs.reduce((total, pairs) => total + (pairs || 0), 0)} pares
              </span>
            </div>
          )}
        </div>
      )}

      {/* Price Info com contraste melhorado */}
      <div className="flex items-center justify-between p-4 bg-green-50 rounded-md border-2 border-green-200">
        <div>
          <span className="text-sm font-medium text-green-700">Preço final:</span>
          <p className="text-2xl font-bold text-green-800">
            R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        {variation.price_adjustment !== 0 && (
          <div className="text-right">
            <span className="text-sm font-medium text-slate-600">Ajuste:</span>
            <p className={`font-bold text-lg ${
              variation.price_adjustment > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {variation.price_adjustment > 0 ? '+' : ''}
              R$ {variation.price_adjustment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}
      </div>

      {/* Advanced Info com contraste melhorado */}
      {showAdvancedInfo && (
        <div className="space-y-3 pt-3 border-t-2 border-slate-200">
          {variation.sku && (
            <div className="flex items-center gap-2 bg-white p-2 rounded border">
              <Hash className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-mono text-slate-700 font-medium">
                SKU: <span className="font-bold text-slate-800">{variation.sku}</span>
              </span>
            </div>
          )}
          
          {variation.image_url && (
            <div className="bg-white p-3 rounded border">
              <span className="text-sm font-medium text-slate-600 block mb-2">
                Imagem da variação:
              </span>
              <img
                src={variation.image_url}
                alt={`${variation.color || variation.grade_name || 'Variação'}`}
                className="w-24 h-24 object-cover rounded-md border-2 border-slate-200"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VariationInfoPanel;
