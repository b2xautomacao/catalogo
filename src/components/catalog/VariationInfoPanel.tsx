
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
  const finalPrice = (basePrice || 0) + (variation.price_adjustment || 0);
  const hasStock = variation.stock > 0;

  return (
    <div className="p-6 bg-white rounded-xl border-2 border-blue-300 shadow-lg space-y-6">
      {/* Header com contraste melhorado */}
      <div className="flex items-center justify-between">
        <h5 className="font-black text-xl flex items-center gap-3 text-blue-900">
          {isGrade ? (
            <>
              <Package className="h-6 w-6 text-blue-700" />
              <span>Grade Selecionada</span>
            </>
          ) : (
            <>
              <Palette className="h-6 w-6 text-blue-700" />
              <span>Variação Selecionada</span>
            </>
          )}
        </h5>
        
        <Badge 
          variant={hasStock ? "default" : "destructive"}
          className={`flex items-center gap-2 font-bold px-4 py-2 text-sm ${
            hasStock 
              ? "bg-green-600 text-white border-green-700" 
              : "bg-red-600 text-white border-red-700"
          }`}
        >
          {hasStock ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {variation.stock} disponível
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4" />
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
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <span className="text-sm font-bold text-blue-800 block mb-1">Nome da Grade:</span>
                <p className="font-black text-blue-900 text-xl">{variation.grade_name}</p>
              </div>
            )}
            {variation.grade_color && (
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <span className="text-sm font-bold text-blue-800 block mb-1">Cor:</span>
                <p className="font-black text-blue-900 text-xl">{variation.grade_color}</p>
              </div>
            )}
          </>
        ) : (
          <>
            {variation.color && (
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <span className="text-sm font-bold text-blue-800 block mb-1">Cor:</span>
                <p className="font-black text-blue-900 text-lg">{variation.color}</p>
              </div>
            )}
            {variation.size && (
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <span className="text-sm font-bold text-blue-800 block mb-1">Tamanho:</span>
                <p className="font-black text-blue-900 text-lg">{variation.size}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Grade Composition com contraste melhorado */}
      {isGrade && variation.grade_sizes && variation.grade_sizes.length > 0 && (
        <div className="space-y-4 bg-blue-100 p-6 rounded-xl border-3 border-blue-300">
          <div className="flex items-center justify-between">
            <h6 className="text-lg font-black text-blue-900">
              Composição da Grade:
            </h6>
            <Badge variant="outline" className="text-sm bg-blue-200 text-blue-900 border-blue-400 font-black px-3 py-1">
              {variation.grade_sizes.length} tamanhos
            </Badge>
          </div>
          
          {/* Grade com contraste melhorado */}
          <div className="grid grid-cols-4 gap-3">
            {variation.grade_sizes.map((size, index) => {
              const pairCount = variation.grade_pairs && variation.grade_pairs[index] ? variation.grade_pairs[index] : 0;
              return (
                <div 
                  key={index}
                  className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border-3 border-blue-400 text-center min-h-[4rem] shadow-md"
                >
                  <span className="text-lg font-black text-blue-900">{size}</span>
                  {pairCount > 0 && (
                    <span className="text-sm text-blue-700 font-bold mt-1">
                      {pairCount} pares
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Total Pairs Summary com contraste melhorado */}
          {variation.grade_pairs && variation.grade_pairs.length > 0 && (
            <div className="flex items-center justify-between text-base bg-white rounded-lg p-4 border-3 border-blue-400 shadow-md">
              <span className="font-bold text-blue-800">Total de pares:</span>
              <span className="font-black text-blue-900 text-xl">
                {variation.grade_pairs.reduce((total, pairs) => total + (pairs || 0), 0)} pares
              </span>
            </div>
          )}
        </div>
      )}

      {/* Price Info com contraste melhorado */}
      <div className="flex items-center justify-between p-6 bg-green-100 rounded-xl border-3 border-green-300 shadow-md">
        <div>
          <span className="text-base font-bold text-green-800 block mb-1">Preço final:</span>
          <p className="text-3xl font-black text-green-900">
            R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        {variation.price_adjustment !== 0 && (
          <div className="text-right">
            <span className="text-base font-bold text-gray-700 block mb-1">Ajuste:</span>
            <p className={`font-black text-xl ${
              variation.price_adjustment > 0 ? 'text-red-700' : 'text-green-700'
            }`}>
              {variation.price_adjustment > 0 ? '+' : ''}
              R$ {variation.price_adjustment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}
      </div>

      {/* Advanced Info com contraste melhorado */}
      {showAdvancedInfo && (
        <div className="space-y-4 pt-4 border-t-3 border-blue-200">
          {variation.sku && (
            <div className="flex items-center gap-3 bg-gray-100 p-4 rounded-lg border-2 border-gray-300">
              <Hash className="h-5 w-5 text-gray-600" />
              <span className="text-base font-mono text-gray-800 font-bold">
                SKU: <span className="font-black text-gray-900">{variation.sku}</span>
              </span>
            </div>
          )}
          
          {variation.image_url && (
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
              <span className="text-base font-bold text-gray-800 block mb-3">
                Imagem da variação:
              </span>
              <img
                src={variation.image_url}
                alt={`${variation.color || variation.grade_name || 'Variação'}`}
                className="w-32 h-32 object-cover rounded-lg border-3 border-gray-400 shadow-md"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VariationInfoPanel;
