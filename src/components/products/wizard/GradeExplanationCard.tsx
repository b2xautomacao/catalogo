import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shirt,
  Package,
  Grid,
  Info,
  Lightbulb,
  CheckCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const GradeExplanationCard: React.FC = () => {
  const exampleGrades = [
    {
      name: "Grade Baixa",
      sizes: ["33", "34", "35", "36", "37", "38"],
      description: "Tamanhos menores, ideal para pés pequenos",
      color: "bg-blue-50 border-blue-200",
    },
    {
      name: "Grade Alta",
      sizes: ["35", "36", "37", "38", "39", "40"],
      description: "Tamanhos maiores, ideal para pés grandes",
      color: "bg-green-50 border-green-200",
    },
    {
      name: "Grade Infantil",
      sizes: ["26/27", "28/29", "30/31", "32/33"],
      description: "Tamanhos para crianças",
      color: "bg-purple-50 border-purple-200",
    },
  ];

  const colorExamples = [
    { name: "Preto", hex: "#000000" },
    { name: "Branco", hex: "#FFFFFF" },
    { name: "Azul", hex: "#0066CC" },
  ];

  return (
    <div className="space-y-6">
      {/* Explicação Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />O que são Grades?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Grade</strong> é um conjunto de tamanhos que você vende
              junto como um "kit". É muito comum em calçados, onde você não
              vende apenas um par, mas sim uma coleção de tamanhos.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                Exemplo Prático:
              </h4>
              <p className="text-sm text-gray-600">
                Você tem um sapato feminino em 3 cores: Preto, Branco e Azul.
                Para cada cor, você quer vender 2 tipos de grade:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • <strong>Grade Baixa:</strong> tamanhos 33, 34, 35, 36, 37,
                  38
                </li>
                <li>
                  • <strong>Grade Alta:</strong> tamanhos 35, 36, 37, 38, 39, 40
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Resultado:
              </h4>
              <p className="text-sm text-gray-600">
                Você terá 6 variações no total:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Preto - Grade Baixa (6 tamanhos)</li>
                <li>• Preto - Grade Alta (6 tamanhos)</li>
                <li>• Branco - Grade Baixa (6 tamanhos)</li>
                <li>• Branco - Grade Alta (6 tamanhos)</li>
                <li>• Azul - Grade Baixa (6 tamanhos)</li>
                <li>• Azul - Grade Alta (6 tamanhos)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualização das Grades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-blue-600" />
            Exemplos de Grades Comuns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exampleGrades.map((grade, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${grade.color}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shirt className="w-4 h-4" />
                  <h4 className="font-medium">{grade.name}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {grade.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {grade.sizes.map((size) => (
                    <Badge key={size} variant="secondary" className="text-xs">
                      {size}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Simulação Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            Como Ficaria no Seu Catálogo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Veja como seus produtos apareceriam no catálogo com grades:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {colorExamples.map((color) => (
                <div key={color.name} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="font-medium">Sapato {color.name}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600 text-white text-xs">
                        Grade: Baixa
                      </Badge>
                      <span className="text-xs text-gray-600">6 tamanhos</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Tamanhos: 33, 34, 35, 36, 37, 38
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Vantagem:</strong> Seus clientes veem claramente que
                estão comprando um conjunto completo de tamanhos, não apenas um
                par individual. Isso é especialmente útil para revendedores.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Quando Usar Grades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-orange-600" />
            Quando Usar Grades?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-700 mb-2">
                ✅ Use Grades Quando:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Vende calçados para revendedores</li>
                <li>• Vende produtos em kits de tamanhos</li>
                <li>• Quer mostrar conjuntos completos</li>
                <li>• Trabalha com atacado de tamanhos</li>
                <li>• Seus clientes compram múltiplos tamanhos</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-red-700 mb-2">
                ❌ NÃO Use Grades Quando:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Vende apenas um tamanho por vez</li>
                <li>• Seus produtos são únicos (sem tamanhos)</li>
                <li>• Trabalha apenas com varejo individual</li>
                <li>• Não tem estoque de múltiplos tamanhos</li>
                <li>• Seus clientes escolhem tamanhos específicos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GradeExplanationCard;
