import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PremiumWizardFormData } from "@/hooks/usePremiumProductWizard";
import { useCategories } from "@/hooks/useCategories";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Tag, FileText, Shirt } from "lucide-react";

interface BasicInfoStepProps {
  formData: PremiumWizardFormData;
  updateFormData: (updates: Partial<PremiumWizardFormData>) => void;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ formData, updateFormData }) => {
  const { categories } = useCategories();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lado Esquerdo: Nome e Categoria */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              Nome do Produto *
            </Label>
            <Input
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              placeholder="Ex: Camiseta Cotton Premium"
              className="h-11 bg-white/50 backdrop-blur-sm focus:bg-white transition-all border-slate-200"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-500" />
              Categoria *
            </Label>
            <Select
              value={formData.category}
              onValueChange={(v) => updateFormData({ category: v })}
            >
              <SelectTrigger className="h-11 bg-white/50 backdrop-blur-sm border-slate-200">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
             <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-500">Gênero</Label>
                <Select
                  value={formData.product_gender || ""}
                  onValueChange={(v) => updateFormData({ product_gender: v as any })}
                >
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="unissex">Unissex</SelectItem>
                    <SelectItem value="infantil">Infantil</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-500">Material</Label>
                <Input
                  value={formData.material}
                  onChange={(e) => updateFormData({ material: e.target.value })}
                  placeholder="Ex: Algodão"
                  className="h-10 text-xs"
                />
             </div>
          </div>
        </div>

        {/* Lado Direito: Descrição */}
        <div className="space-y-2 flex flex-col h-full">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            Descrição Completa
          </Label>
          <Textarea
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Conte os detalhes do seu produto, benefícios e diferenciais..."
            className="flex-1 min-h-[180px] bg-white/50 backdrop-blur-sm border-slate-200 resize-none p-4"
          />
        </div>
      </div>

      {/* Cards de Sugestão de Tipo */}
      <div className="pt-4 border-t border-slate-100">
        <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
          Tipo de Produto (Define a Tabela de Medidas)
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { id: 'calcado', label: 'Calçado', icon: '👟' },
            { id: 'roupa_superior', label: 'Roupa Superior', icon: '👕' },
            { id: 'roupa_inferior', label: 'Roupa Inferior', icon: '👖' },
            { id: 'acessorio', label: 'Acessório', icon: '🎒' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => updateFormData({ product_category_type: type.id as any })}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all hover:shadow-md ${
                formData.product_category_type === type.id 
                  ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20" 
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="text-2xl">{type.icon}</span>
              <span className="text-xs font-semibold text-slate-700">{type.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BasicInfoStep;
