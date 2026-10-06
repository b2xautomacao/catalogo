import React from "react";
import { PremiumWizardFormData } from "@/hooks/usePremiumProductWizard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles, Box, Layers, DollarSign, Image as ImageIcon } from "lucide-react";
import { buildVariationMatrix } from "@/lib/variationMatrixService";
import { calculateCanonicalPhysicalStock } from "@/lib/gradeCompositionService";

interface ProductSummaryReviewProps {
  formData: PremiumWizardFormData;
}

export const ProductSummaryReview: React.FC<ProductSummaryReviewProps> = ({ formData }) => {
  const matrix = buildVariationMatrix(formData.variations || []);

  const looseUnits = matrix.unitVariations.map((v) => ({ stock: v.stock || 0 }));
  const packs = matrix.packVariations.map((v) => {
    const pairs = Array.isArray(v.grade_pairs) ? v.grade_pairs : [];
    const pairsPerPack = pairs.reduce((sum, p) => sum + Number(p), 0) || v.grade_quantity || 1;
    return { stock: v.stock || 0, pairsPerPack };
  });

  const stockSummary = calculateCanonicalPhysicalStock(looseUnits, packs);

  return (
    <Card className="border border-blue-100 bg-gradient-to-br from-blue-50/40 via-white to-slate-50/60 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-blue-100/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Resumo da Configuração do Produto</h4>
            <p className="text-[11px] text-slate-500">Revise os pontos principais antes de salvar</p>
          </div>
        </div>
        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5">
          Pronto para Salvar
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Informações e Preço */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
            Precificação
          </div>
          <div className="text-base font-extrabold text-slate-900">
            R$ {formData.retail_price ? Number(formData.retail_price).toFixed(2) : "0,00"}
          </div>
          <div className="text-[10px] text-slate-500 flex flex-col gap-0.5">
            {formData.wholesale_price && (
              <span>Atacado: R$ {Number(formData.wholesale_price).toFixed(2)}</span>
            )}
            {formData.price_tiers && formData.price_tiers.length > 0 && (
              <span className="text-blue-600 font-bold">
                {formData.price_tiers.length} faixa(s) de atacarejo ativas
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Variações & Grade */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            Variações & Grades
          </div>
          <div className="text-base font-extrabold text-slate-900">
            {formData.variations.length} variação(ões)
          </div>
          <div className="text-[10px] text-slate-500 space-y-0.5">
            <div>{matrix.unitVariations.length} unitárias (pares)</div>
            <div>{matrix.packVariations.length} grade(s) fechada(s)</div>
          </div>
        </div>

        {/* Card 3: Estoque Físico Equivalente */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
            <Box className="w-3.5 h-3.5 text-emerald-600" />
            Estoque Físico Total
          </div>
          <div className="text-base font-extrabold text-emerald-700">
            {stockSummary.totalPhysicalStock} unidades
          </div>
          <div className="text-[10px] text-slate-500 space-y-0.5">
            <div>{stockSummary.totalLooseStock} pares avulsos</div>
            <div>
              {stockSummary.totalPackStock} caixas ({stockSummary.totalPackPhysicalUnits} pares)
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProductSummaryReview;
