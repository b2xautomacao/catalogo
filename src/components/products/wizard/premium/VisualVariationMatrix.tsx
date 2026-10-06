import React from "react";
import { ProductVariation } from "@/types/product";
import { buildVariationMatrix } from "@/lib/variationMatrixService";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Check, Minus, Layers, Box } from "lucide-react";

interface VisualVariationMatrixProps {
  variations: ProductVariation[];
}

export const VisualVariationMatrix: React.FC<VisualVariationMatrixProps> = ({ variations }) => {
  if (variations.length === 0) return null;

  const matrix = buildVariationMatrix(variations);

  return (
    <div className="space-y-6 pt-2">
      {/* 1. Matriz Canônica Visual de Variações Unitárias (se houver variações simples) */}
      {matrix.unitVariations.length > 0 && matrix.colors.length > 0 && matrix.sizes.length > 0 && (
        <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Matriz de Combinações ({matrix.unitVariations.length} variações ativas)
              </h4>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Unidades / Pares Individuais</span>
          </div>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="py-2.5 px-4 font-bold text-slate-700">Cor</th>
                  {matrix.sizes.map((size) => (
                    <th key={size} className="py-2.5 px-3 text-center font-bold text-slate-700">
                      {size}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matrix.colors.map(({ color, hexColor }) => (
                  <tr key={color} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-slate-800 flex items-center gap-2.5">
                      <div
                        className="w-4 h-4 rounded-full border border-slate-300 shadow-xs flex-shrink-0"
                        style={{ backgroundColor: hexColor || "#CBD5E1" }}
                      />
                      <span>{color}</span>
                    </td>
                    {matrix.sizes.map((size) => {
                      const cell = matrix.cells[color]?.[size];
                      return (
                        <td key={size} className="py-2.5 px-3 text-center">
                          {cell ? (
                            <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            </div>
                          ) : (
                            <span className="text-slate-300 inline-block font-bold">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 2. Grade Cards Informativos (Packs de Grade Fechada) */}
      {matrix.packVariations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Box className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Grades Fechadas / Caixas ({matrix.packVariations.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {matrix.packVariations.map((v, idx) => {
              const sizes = Array.isArray(v.grade_sizes) ? v.grade_sizes : [];
              const pairs = Array.isArray(v.grade_pairs) ? v.grade_pairs : [];
              const pairsPerPack = pairs.reduce((sum, p) => sum + Number(p), 0) || v.grade_quantity || 1;
              const boxStock = typeof v.stock === 'number' ? v.stock : 0;
              const totalEquivalentPairs = boxStock * pairsPerPack;

              return (
                <Card
                  key={v.id || idx}
                  className="border border-emerald-100 bg-gradient-to-br from-emerald-50/40 via-white to-white shadow-xs rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {v.grade_name || "Grade"}
                        </span>
                        {v.color && (
                          <Badge variant="outline" className="text-[10px] font-bold border-emerald-200 text-emerald-800 bg-emerald-50/50">
                            {v.color}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {pairsPerPack} pares por caixa
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-700">
                        {boxStock} caixa{boxStock !== 1 ? "s" : ""}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {totalEquivalentPairs} pares eq.
                      </div>
                    </div>
                  </div>

                  {/* Distribuição por tamanho na caixa */}
                  {sizes.length > 0 && (
                    <div className="pt-2 border-t border-emerald-100/60">
                      <div className="flex flex-wrap gap-1.5">
                        {sizes.map((s, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex flex-col items-center justify-center px-2 py-1 bg-white border border-slate-200 rounded-lg text-center shadow-2xs min-w-[32px]"
                          >
                            <span className="text-[9px] font-bold text-slate-500">{s}</span>
                            <span className="text-[10px] font-extrabold text-slate-900">
                              {pairs[sIdx] ?? 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
export default VisualVariationMatrix;
