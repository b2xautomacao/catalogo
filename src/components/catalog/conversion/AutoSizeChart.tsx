/**
 * AutoSizeChart - Tabela de Medidas Automática
 * Gera tabelas de tamanho baseadas no gênero do produto (masculino/feminino/unissex)
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ruler, ChevronDown, ChevronUp } from "lucide-react";

export type ProductGender = 'masculino' | 'feminino' | 'unissex' | 'infantil';
export type ProductCategory = 'calcado' | 'roupa_superior' | 'roupa_inferior' | 'acessorio';

interface SizeData {
  size: string;
  br: string;
  us: string;
  eu: string;
  cm?: string;
  measurements?: {
    bust?: string;
    waist?: string;
    hip?: string;
    length?: string;
  };
}

interface AutoSizeChartProps {
  gender: ProductGender;
  category: ProductCategory;
  customSizes?: SizeData[];
  isCollapsible?: boolean;
  defaultOpen?: boolean;
}

const AutoSizeChart: React.FC<AutoSizeChartProps> = ({
  gender,
  category,
  customSizes,
  isCollapsible = true,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Tabelas padrão de calçados
  const shoeSizesMale: SizeData[] = [
    { size: '38', br: '38', us: '6', eu: '38', cm: '24.5' },
    { size: '39', br: '39', us: '7', eu: '39', cm: '25.0' },
    { size: '40', br: '40', us: '7.5', eu: '40', cm: '25.5' },
    { size: '41', br: '41', us: '8', eu: '41', cm: '26.0' },
    { size: '42', br: '42', us: '9', eu: '42', cm: '26.5' },
    { size: '43', br: '43', us: '10', eu: '43', cm: '27.0' },
    { size: '44', br: '44', us: '11', eu: '44', cm: '27.5' },
    { size: '45', br: '45', us: '12', eu: '45', cm: '28.0' },
  ];

  const shoeSizesFemale: SizeData[] = [
    { size: '33', br: '33', us: '5', eu: '35', cm: '21.5' },
    { size: '34', br: '34', us: '5.5', eu: '36', cm: '22.0' },
    { size: '35', br: '35', us: '6', eu: '36', cm: '22.5' },
    { size: '36', br: '36', us: '6.5', eu: '37', cm: '23.0' },
    { size: '37', br: '37', us: '7', eu: '38', cm: '23.5' },
    { size: '38', br: '38', us: '7.5', eu: '38', cm: '24.0' },
    { size: '39', br: '39', us: '8', eu: '39', cm: '24.5' },
    { size: '40', br: '40', us: '9', eu: '40', cm: '25.0' },
  ];

  const shoeSizesKids: SizeData[] = [
    { size: '20', br: '20', us: '5C', eu: '20', cm: '12.5' },
    { size: '22', br: '22', us: '6C', eu: '22', cm: '13.5' },
    { size: '24', br: '24', us: '8C', eu: '24', cm: '14.5' },
    { size: '26', br: '26', us: '9C', eu: '26', cm: '15.5' },
    { size: '28', br: '28', us: '11C', eu: '28', cm: '17.0' },
    { size: '30', br: '30', us: '12C', eu: '30', cm: '18.0' },
    { size: '32', br: '32', us: '1Y', eu: '32', cm: '19.5' },
    { size: '34', br: '34', us: '3Y', eu: '34', cm: '21.0' },
  ];

  // Tabelas padrão de roupas
  const clothingSizesMale: SizeData[] = [
    { 
      size: 'PP', 
      br: 'PP', 
      us: 'XS', 
      eu: 'XS',
      measurements: { bust: '88-92', waist: '74-78', hip: '88-92', length: '68' }
    },
    { 
      size: 'P', 
      br: 'P', 
      us: 'S', 
      eu: 'S',
      measurements: { bust: '92-96', waist: '78-82', hip: '92-96', length: '70' }
    },
    { 
      size: 'M', 
      br: 'M', 
      us: 'M', 
      eu: 'M',
      measurements: { bust: '96-100', waist: '82-86', hip: '96-100', length: '72' }
    },
    { 
      size: 'G', 
      br: 'G', 
      us: 'L', 
      eu: 'L',
      measurements: { bust: '100-104', waist: '86-90', hip: '100-104', length: '74' }
    },
    { 
      size: 'GG', 
      br: 'GG', 
      us: 'XL', 
      eu: 'XL',
      measurements: { bust: '104-108', waist: '90-94', hip: '104-108', length: '76' }
    },
  ];

  const clothingSizesFemale: SizeData[] = [
    { 
      size: 'PP', 
      br: 'PP', 
      us: 'XS', 
      eu: 'XS',
      measurements: { bust: '80-84', waist: '60-64', hip: '86-90', length: '60' }
    },
    { 
      size: 'P', 
      br: 'P', 
      us: 'S', 
      eu: 'S',
      measurements: { bust: '84-88', waist: '64-68', hip: '90-94', length: '62' }
    },
    { 
      size: 'M', 
      br: 'M', 
      us: 'M', 
      eu: 'M',
      measurements: { bust: '88-92', waist: '68-72', hip: '94-98', length: '64' }
    },
    { 
      size: 'G', 
      br: 'G', 
      us: 'L', 
      eu: 'L',
      measurements: { bust: '92-96', waist: '72-76', hip: '98-102', length: '66' }
    },
    { 
      size: 'GG', 
      br: 'GG', 
      us: 'XL', 
      eu: 'XL',
      measurements: { bust: '96-100', waist: '76-80', hip: '102-106', length: '68' }
    },
  ];

  // Selecionar tabela apropriada
  const getSizeData = (): SizeData[] => {
    if (customSizes && customSizes.length > 0) {
      return customSizes;
    }

    if (category === 'calcado') {
      if (gender === 'infantil') return shoeSizesKids;
      if (gender === 'feminino') return shoeSizesFemale;
      return shoeSizesMale; // masculino ou unissex
    }

    if (category === 'roupa_superior' || category === 'roupa_inferior') {
      if (gender === 'feminino') return clothingSizesFemale;
      return clothingSizesMale;
    }

    return [];
  };

  const sizeData = getSizeData();

  if (sizeData.length === 0) return null;

  const isShoe = category === 'calcado';
  const hasDetailedMeasurements = sizeData[0]?.measurements;

  const content = (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-3 px-2 font-semibold">Tamanho</th>
            <th className="text-center py-3 px-2 font-semibold">BR</th>
            <th className="text-center py-3 px-2 font-semibold">US</th>
            <th className="text-center py-3 px-2 font-semibold">EU</th>
            {isShoe && (
              <th className="text-center py-3 px-2 font-semibold">CM</th>
            )}
            {hasDetailedMeasurements && (
              <>
                <th className="text-center py-3 px-2 font-semibold">Busto/Peito (cm)</th>
                <th className="text-center py-3 px-2 font-semibold">Cintura (cm)</th>
                <th className="text-center py-3 px-2 font-semibold">Quadril (cm)</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {sizeData.map((size, index) => (
            <tr 
              key={size.size}
              className={`border-b border-gray-200 hover:bg-gray-50 ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
              }`}
            >
              <td className="py-2 px-2 font-semibold">{size.size}</td>
              <td className="text-center py-2 px-2">{size.br}</td>
              <td className="text-center py-2 px-2">{size.us}</td>
              <td className="text-center py-2 px-2">{size.eu}</td>
              {isShoe && (
                <td className="text-center py-2 px-2">{size.cm}</td>
              )}
              {hasDetailedMeasurements && size.measurements && (
                <>
                  <td className="text-center py-2 px-2">{size.measurements.bust || '-'}</td>
                  <td className="text-center py-2 px-2">{size.measurements.waist || '-'}</td>
                  <td className="text-center py-2 px-2">{size.measurements.hip || '-'}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Dicas de medição */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900 font-semibold mb-2">Como medir corretamente:</p>
        <ul className="text-xs text-blue-800 space-y-1">
          {isShoe ? (
            <>
              <li>• Meça seu pé em pé, no final do dia</li>
              <li>• Use uma régua ou fita métrica do calcanhar até o dedo mais longo</li>
              <li>• Adicione 0.5-1cm para conforto</li>
            </>
          ) : (
            <>
              <li>• Use uma fita métrica flexível</li>
              <li>• Meça sobre roupas leves ou diretamente sobre a pele</li>
              <li>• Mantenha a postura relaxada e natural</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader 
        className={`${isCollapsible ? 'cursor-pointer hover:bg-gray-50' : ''} bg-gradient-to-r from-indigo-50 to-purple-50`}
        onClick={() => isCollapsible && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Ruler className="w-5 h-5 text-indigo-600" />
            Tabela de Medidas
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
              {gender === 'masculino' ? 'Masculino' :
               gender === 'feminino' ? 'Feminino' :
               gender === 'infantil' ? 'Infantil' :
               'Unissex'}
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

export default AutoSizeChart;

