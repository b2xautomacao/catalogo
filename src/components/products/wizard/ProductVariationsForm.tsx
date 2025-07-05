import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ProductVariation } from "@/types/variation";
import ProductVariationsManager from "../ProductVariationsManager";
import HierarchicalVariationsManager from "../HierarchicalVariationsManager";
import MasterVariationSelector from "../MasterVariationSelector";
import VariationImageManager from "../VariationImageManager";
import { Settings, Layers, Palette } from "lucide-react";

interface ProductVariationsFormProps {
  variations: ProductVariation[];
  onVariationsChange: (variations: ProductVariation[]) => void;
  productId?: string;
}

const ProductVariationsForm: React.FC<ProductVariationsFormProps> = ({
  variations,
  onVariationsChange,
  productId,
}) => {
  const [systemType, setSystemType] = useState<
    "simple" | "hierarchical" | "master"
  >("master");

  // Verificar se há variações com cor para mostrar o upload de imagens
  const hasColorVariations = variations.some((v) => v.color && v.color.trim());

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Variações do Produto</h3>
        <p className="text-sm text-muted-foreground">
          Configure diferentes versões do seu produto com preços, estoques e
          características próprias.
        </p>
      </div>

      <Tabs
        value={systemType}
        onValueChange={(value) =>
          setSystemType(value as "simple" | "hierarchical" | "master")
        }
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="master" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Sistema Inteligente
            <Badge variant="default" className="ml-1">
              Recomendado
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="simple" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Sistema Simples
          </TabsTrigger>
          <TabsTrigger value="hierarchical" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Sistema Hierárquico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="master" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Sistema Inteligente de Variações
                <Badge variant="default">Novo</Badge>
              </CardTitle>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  🎯 <strong>Sistema mais eficiente</strong> - Use grupos
                  pré-cadastrados
                </p>
                <p>
                  ⚡ <strong>Cadastro super rápido</strong> - Selecione e
                  combine valores existentes
                </p>
                <p>
                  ➕ <strong>Adicione novos valores</strong> durante o cadastro
                  se necessário
                </p>
                <p>
                  🎨 <strong>Padronização automática</strong> - Mantém
                  consistência entre produtos
                </p>
                <p>
                  🖼️ <strong>Upload de imagens por cor</strong> - Imagens
                  específicas para cada variação
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <MasterVariationSelector
                variations={variations}
                onVariationsChange={onVariationsChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simple" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-600" />
                Sistema Simples de Variações
              </CardTitle>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Cada variação é cadastrada individualmente</p>
                <p>• Adequado para produtos com poucas variações</p>
                <p>• Sistema tradicional e fácil de usar</p>
                <p>• Upload de imagens por variação de cor</p>
              </div>
            </CardHeader>
            <CardContent>
              <ProductVariationsManager
                variations={variations}
                onChange={onVariationsChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hierarchical" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Sistema Hierárquico de Variações
                <Badge variant="default">Avançado</Badge>
              </CardTitle>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  ✅{" "}
                  <strong>
                    Ideal para produtos com múltiplas características
                  </strong>{" "}
                  (ex: cor + tamanho)
                </p>
                <p>
                  ✅ <strong>Cadastro 10x mais rápido</strong> para produtos com
                  muitas variações
                </p>
                <p>
                  ✅ <strong>Experiência melhor</strong> para o cliente no
                  catálogo
                </p>
                <p>
                  ✅ <strong>Gestão organizada</strong> de estoque por grupo
                </p>
                <p>
                  ✅ <strong>Upload de imagens por cor</strong> - Imagens
                  específicas por variação
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {productId ? (
                <HierarchicalVariationsManager
                  productId={productId}
                  variations={variations}
                  onChange={onVariationsChange}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    O sistema hierárquico estará disponível após salvar o
                    produto
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload de Imagens por Variação de Cor */}
      {hasColorVariations && (
        <VariationImageManager
          productId={productId}
          variations={variations}
          onImagesUpdated={(cor, imageUrl) => {
            console.log(
              "🔄 PRODUCT VARIATIONS FORM - Atualizando imagem para cor:",
              cor,
              "URL:",
              imageUrl
            );
            const updatedVariations = variations.map((v) => {
              if (v.color && v.color.toLowerCase() === cor.toLowerCase()) {
                console.log(
                  "✅ PRODUCT VARIATIONS FORM - Atualizando variação:",
                  v.color,
                  "com imagem:",
                  imageUrl
                );
                return { ...v, image_url: imageUrl };
              }
              return v;
            });
            console.log(
              "📊 PRODUCT VARIATIONS FORM - Total de variações atualizadas:",
              updatedVariations.filter((v) => v.image_url).length
            );
            onVariationsChange(updatedVariations);
          }}
        />
      )}

      {variations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resumo das Variações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                Total de variações: <strong>{variations.length}</strong>
              </p>
              <p>
                Estoque total das variações:{" "}
                <strong>
                  {variations.reduce((sum, v) => sum + v.stock, 0)}
                </strong>
              </p>
              <p>
                Variações com imagem própria:{" "}
                <strong>
                  {variations.filter((v) => v.image_url || v.image_file).length}
                </strong>
              </p>
              <p>
                Variações ativas:{" "}
                <strong>{variations.filter((v) => v.is_active).length}</strong>
              </p>
              <p>
                Variações de cor:{" "}
                <strong>
                  {variations.filter((v) => v.color && v.color.trim()).length}
                </strong>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductVariationsForm;
