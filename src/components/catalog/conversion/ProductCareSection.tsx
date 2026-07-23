/**
 * ProductCareSection - Seção de Cuidados do Produto
 * Instruções de manutenção e conservação do produto
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Droplet, 
  Sun, 
  Wind, 
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface CareInstruction {
  id: string;
  type: 'do' | 'dont' | 'warning';
  icon: 'water' | 'sun' | 'iron' | 'wash' | 'dry' | 'bleach' | 'protect' | 'custom';
  instruction: string;
}

interface ProductCareSectionProps {
  careInstructions?: CareInstruction[];
  productCategory?: string;
  material?: string;
  isCollapsible?: boolean;
  defaultOpen?: boolean;
}

const ProductCareSection: React.FC<ProductCareSectionProps> = ({
  careInstructions,
  productCategory = 'calcado',
  material,
  isCollapsible = true,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Instruções padrão por categoria se não houver personalização
  const getDefaultInstructions = (): CareInstruction[] => {
    const categoryInstructions: Record<string, CareInstruction[]> = {
      calcado: [
        {
          id: '1',
          type: 'do',
          icon: 'water',
          instruction: 'Limpe com pano úmido e sabão neutro',
        },
        {
          id: '2',
          type: 'do',
          icon: 'dry',
          instruction: 'Seque à sombra em local arejado',
        },
        {
          id: '3',
          type: 'do',
          icon: 'protect',
          instruction: 'Use impermeabilizante para proteção',
        },
        {
          id: '4',
          type: 'dont',
          icon: 'sun',
          instruction: 'Não exponha ao sol direto por longos períodos',
        },
        {
          id: '5',
          type: 'dont',
          icon: 'wash',
          instruction: 'Não lave em máquina de lavar',
        },
        {
          id: '6',
          type: 'warning',
          icon: 'bleach',
          instruction: 'Nunca use alvejantes ou produtos químicos agressivos',
        },
      ],
      roupa_superior: [
        {
          id: '1',
          type: 'do',
          icon: 'wash',
          instruction: 'Lave com cores semelhantes',
        },
        {
          id: '2',
          type: 'do',
          icon: 'water',
          instruction: 'Use água fria ou morna (máx. 30°C)',
        },
        {
          id: '3',
          type: 'do',
          icon: 'dry',
          instruction: 'Seque à sombra',
        },
        {
          id: '4',
          type: 'dont',
          icon: 'iron',
          instruction: 'Não passe em temperatura alta',
        },
        {
          id: '5',
          type: 'dont',
          icon: 'bleach',
          instruction: 'Não use alvejante',
        },
      ],
    };

    return categoryInstructions[productCategory] || categoryInstructions['calcado'];
  };

  const instructions = careInstructions && careInstructions.length > 0 
    ? careInstructions 
    : getDefaultInstructions();

  // Agrupar por tipo
  const doInstructions = instructions.filter(i => i.type === 'do');
  const dontInstructions = instructions.filter(i => i.type === 'dont');
  const warningInstructions = instructions.filter(i => i.type === 'warning');

  const iconMap = {
    water: <Droplet className="w-5 h-5" />,
    sun: <Sun className="w-5 h-5" />,
    iron: <Heart className="w-5 h-5" />,
    wash: <Droplet className="w-5 h-5" />,
    dry: <Wind className="w-5 h-5" />,
    bleach: <AlertTriangle className="w-5 h-5" />,
    protect: <ShieldCheck className="w-5 h-5" />,
    custom: <CheckCircle className="w-5 h-5" />,
  };

  const content = (
    <div className="space-y-4">
      {/* Material Info */}
      {material && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            <strong>Material:</strong> {material}
          </p>
        </div>
      )}

      {/* O QUE FAZER */}
      {doInstructions.length > 0 && (
        <div>
          <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Cuidados recomendados
          </h4>
          <ul className="space-y-2">
            {doInstructions.map((instruction) => (
              <li 
                key={instruction.id}
                className="flex items-start gap-2 text-sm text-gray-700 bg-green-50 p-2 rounded-lg border border-green-200"
              >
                <div className="text-green-600 mt-0.5">
                  {iconMap[instruction.icon]}
                </div>
                <span>{instruction.instruction}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* O QUE NÃO FAZER */}
      {dontInstructions.length > 0 && (
        <div>
          <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            Evite
          </h4>
          <ul className="space-y-2">
            {dontInstructions.map((instruction) => (
              <li 
                key={instruction.id}
                className="flex items-start gap-2 text-sm text-gray-700 bg-red-50 p-2 rounded-lg border border-red-200"
              >
                <div className="text-red-600 mt-0.5">
                  {iconMap[instruction.icon]}
                </div>
                <span>{instruction.instruction}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AVISOS */}
      {warningInstructions.length > 0 && (
        <div>
          <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Atenção
          </h4>
          <ul className="space-y-2">
            {warningInstructions.map((instruction) => (
              <li 
                key={instruction.id}
                className="flex items-start gap-2 text-sm text-gray-700 bg-orange-50 p-2 rounded-lg border border-orange-200"
              >
                <div className="text-orange-600 mt-0.5">
                  {iconMap[instruction.icon]}
                </div>
                <span>{instruction.instruction}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Dica Geral */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3">
        <p className="text-sm text-purple-900">
          <strong>Dica:</strong> Seguindo estas recomendações, seu produto terá maior durabilidade e manterá a qualidade original por mais tempo.
        </p>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader 
        className={`${isCollapsible ? 'cursor-pointer hover:bg-gray-50' : ''} bg-gradient-to-r from-teal-50 to-cyan-50`}
        onClick={() => isCollapsible && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-teal-600" />
            Cuidados do Produto
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-teal-100 text-teal-700">
              Manutenção
            </Badge>
            {isCollapsible && (
              isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </div>
      </CardHeader>
      {(isOpen || !isCollapsible) && (
        <CardContent className="p-4">
          {content}
        </CardContent>
      )}
    </Card>
  );
};

export default ProductCareSection;

