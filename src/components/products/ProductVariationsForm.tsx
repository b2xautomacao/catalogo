import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Variation {
  color?: string;
  size?: string;
  stock: number;
  price_adjustment: number;
  sku?: string;
  is_active?: boolean;
  image_url?: string | null;
  image_file?: File;
}

interface ProductVariationsFormProps {
  variations: Variation[];
  onVariationsChange: (variations: Variation[]) => void;
  productImages?: string[]; // URLs das imagens do produto
}

const ProductVariationsForm = ({
  variations,
  onVariationsChange,
  productImages,
}: ProductVariationsFormProps) => {
  const [newVariation, setNewVariation] = useState<Variation>({
    color: "",
    size: "",
    stock: 0,
    price_adjustment: 0,
    sku: "",
    is_active: true,
  });

  console.log("🎨 PRODUCT VARIATIONS FORM - Renderizando:", {
    variationsCount: variations.length,
  });

  const addVariation = () => {
    if (!newVariation.color && !newVariation.size) return;

    const variationToAdd = {
      ...newVariation,
      is_active: newVariation.is_active !== false,
    };

    onVariationsChange([...variations, variationToAdd]);
    setNewVariation({
      color: "",
      size: "",
      stock: 0,
      price_adjustment: 0,
      sku: "",
      is_active: true,
    });
  };

  const removeVariation = (index: number) => {
    const variation = variations[index];

    // Limpar blob URLs se existirem
    if (variation.image_url && variation.image_url.startsWith("blob:")) {
      URL.revokeObjectURL(variation.image_url);
    }

    const updatedVariations = variations.filter((_, i) => i !== index);
    onVariationsChange(updatedVariations);
  };

  const updateVariation = (
    index: number,
    field: keyof Variation,
    value: string | number | boolean | File | null | undefined
  ) => {
    const updatedVariations = variations.map((variation, i) =>
      i === index ? { ...variation, [field]: value } : variation
    );
    onVariationsChange(updatedVariations);
  };

  const handleImageUpload = (index: number, file: File) => {
    console.log("📷 VARIATIONS FORM - Upload de imagem para variação:", index);
    const previewUrl = URL.createObjectURL(file);
    updateVariation(index, "image_file", file);
    updateVariation(index, "image_url", previewUrl);
  };

  const handleImageRemove = (index: number) => {
    console.log("🗑 VARIATIONS FORM - Removendo imagem da variação:", index);
    const variation = variations[index];

    if (variation.image_url && variation.image_url.startsWith("blob:")) {
      URL.revokeObjectURL(variation.image_url);
    }

    updateVariation(index, "image_file", undefined);
    updateVariation(index, "image_url", null);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold">Variações do Produto</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Adicione diferentes cores, tamanhos e opções para o seu produto
        </p>
      </div>

      {/* Lista de variações existentes */}
      {variations.length > 0 && (
        <div className="space-y-3">
          {variations.map((variation, index) => (
            <Card key={`variation-${index}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {variation.color && (
                      <Badge variant="outline">{variation.color}</Badge>
                    )}
                    {variation.size && (
                      <Badge variant="outline">{variation.size}</Badge>
                    )}
                    {variation.is_active === false && (
                      <Badge variant="secondary">Inativa</Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariation(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label htmlFor={`color-${index}`}>Cor</Label>
                    <Input
                      id={`color-${index}`}
                      value={variation.color || ""}
                      onChange={(e) =>
                        updateVariation(index, "color", e.target.value)
                      }
                      placeholder="Ex: Azul"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`size-${index}`}>Tamanho</Label>
                    <Input
                      id={`size-${index}`}
                      value={variation.size || ""}
                      onChange={(e) =>
                        updateVariation(index, "size", e.target.value)
                      }
                      placeholder="Ex: M"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`stock-${index}`}>Estoque</Label>
                    <Input
                      id={`stock-${index}`}
                      type="number"
                      value={variation.stock}
                      onChange={(e) =>
                        updateVariation(
                          index,
                          "stock",
                          parseInt(e.target.value) || 0
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor={`price-${index}`}>Ajuste Preço</Label>
                    <CurrencyInput
                      value={variation.price_adjustment}
                      onChange={(value) =>
                        updateVariation(index, "price_adjustment", value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`sku-${index}`}>SKU (Opcional)</Label>
                    <Input
                      id={`sku-${index}`}
                      value={variation.sku || ""}
                      onChange={(e) =>
                        updateVariation(index, "sku", e.target.value)
                      }
                      placeholder="Código único"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`active-${index}`}
                      checked={variation.is_active !== false}
                      onCheckedChange={(checked) =>
                        updateVariation(index, "is_active", checked)
                      }
                    />
                    <Label htmlFor={`active-${index}`}>Variação Ativa</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Foto da Variação</Label>
                  {/* Miniaturas das imagens do produto */}
                  {productImages && productImages.length > 0 && (
                    <div className="flex gap-2 mb-2">
                      {productImages.map((imgUrl, imgIdx) => (
                        <button
                          key={imgUrl}
                          type="button"
                          className={`w-14 h-14 rounded border-2 ${
                            variation.image_url === imgUrl
                              ? "border-blue-600"
                              : "border-gray-200"
                          } overflow-hidden focus:outline-none`}
                          onClick={() =>
                            updateVariation(index, "image_url", imgUrl)
                          }
                        >
                          <img
                            src={imgUrl}
                            alt="Miniatura"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Exibir miniatura da imagem selecionada ao lado do nome/cor */}
                  {variation.image_url && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        Imagem selecionada:
                      </span>
                      <img
                        src={variation.image_url}
                        alt="Selecionada"
                        className="w-10 h-10 rounded border object-cover"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Formulário para nova variação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar Nova Variação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label htmlFor="new-color">Cor</Label>
              <Input
                id="new-color"
                value={newVariation.color || ""}
                onChange={(e) =>
                  setNewVariation({ ...newVariation, color: e.target.value })
                }
                placeholder="Ex: Azul"
              />
            </div>

            <div>
              <Label htmlFor="new-size">Tamanho</Label>
              <Input
                id="new-size"
                value={newVariation.size || ""}
                onChange={(e) =>
                  setNewVariation({ ...newVariation, size: e.target.value })
                }
                placeholder="Ex: M"
              />
            </div>

            <div>
              <Label htmlFor="new-stock">Estoque</Label>
              <Input
                id="new-stock"
                type="number"
                value={newVariation.stock}
                onChange={(e) =>
                  setNewVariation({
                    ...newVariation,
                    stock: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="new-price">Ajuste Preço</Label>
              <CurrencyInput
                value={newVariation.price_adjustment}
                onChange={(value) =>
                  setNewVariation({ ...newVariation, price_adjustment: value })
                }
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={addVariation}
            disabled={!newVariation.color && !newVariation.size}
            className="w-full"
          >
            <Plus size={16} className="mr-2" />
            Adicionar Variação
          </Button>
        </CardContent>
      </Card>

      {variations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">
            💡 Resumo das Variações:
          </h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• {variations.length} variação(ões) configurada(s)</p>
            <p>
              • Estoque total: {variations.reduce((sum, v) => sum + v.stock, 0)}{" "}
              unidades
            </p>
            <p>
              • Variações ativas:{" "}
              {variations.filter((v) => v.is_active !== false).length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariationsForm;
