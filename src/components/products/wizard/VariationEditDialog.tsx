import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package,
  Palette,
  Ruler,
  Package2,
  Save,
  X,
  AlertTriangle,
} from "lucide-react";
import { ProductVariation } from "@/types/product";
import { useToast } from "@/hooks/use-toast";
import { useStoreColors } from "@/hooks/useStoreColors";

interface VariationEditDialogProps {
  variation: ProductVariation | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedVariation: ProductVariation) => void;
  storeId?: string;
}

const VariationEditDialog: React.FC<VariationEditDialogProps> = ({
  variation,
  isOpen,
  onClose,
  onSave,
  storeId,
}) => {
  const { toast } = useToast();
  const [editedVariation, setEditedVariation] =
    useState<ProductVariation | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { colors: storeColors } = useStoreColors(storeId);

  // Inicializar dados quando a variação muda
  useEffect(() => {
    if (variation) {
      setEditedVariation({ ...variation });
    }
  }, [variation]);

  const handleSave = async () => {
    if (!editedVariation) return;

    setIsSaving(true);
    try {
      // Validar dados obrigatórios
      if (
        !editedVariation.color &&
        !editedVariation.size &&
        !editedVariation.material
      ) {
        toast({
          title: "Dados obrigatórios",
          description:
            "Preencha pelo menos uma característica (cor, tamanho ou material).",
          variant: "destructive",
        });
        return;
      }

      // Atualizar timestamp
      const updatedVariation = {
        ...editedVariation,
        updated_at: new Date().toISOString(),
      };

      onSave(updatedVariation);

      toast({
        title: "✅ Variação atualizada!",
        description: "As alterações foram salvas com sucesso.",
      });

      onClose();
    } catch (error) {
      console.error("Erro ao salvar variação:", error);
      toast({
        title: "❌ Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedVariation(variation ? { ...variation } : null);
    onClose();
  };

  if (!editedVariation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Editar Variação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações básicas */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-medium text-gray-900">Características</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="color" className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <Palette className="w-4 h-4" />
                      Cor
                    </div>
                    {storeColors.length > 0 && (
                      <div className="flex gap-1 shrink-0">
                        {storeColors.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setEditedVariation({
                              ...editedVariation,
                              color: c.name,
                              hex_color: c.hex_color
                            })}
                            className="w-4 h-4 rounded-full border border-gray-300 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                            style={{ backgroundColor: c.hex_color }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    )}
                  </Label>
                  <Input
                    id="color"
                    value={editedVariation.color || ""}
                    onChange={(e) =>
                      setEditedVariation({
                        ...editedVariation,
                        color: e.target.value,
                      })
                    }
                    placeholder="Ex: Azul Petróleo"
                  />
                  {/* Cor personalizada (hex) */}
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="color"
                      id="hex_color"
                      value={(editedVariation as any).hex_color || "#9CA3AF"}
                      onChange={(e) =>
                        setEditedVariation({
                          ...editedVariation,
                          hex_color: e.target.value,
                        } as any)
                      }
                      className="w-9 h-9 shrink-0 rounded cursor-pointer border border-gray-300 p-0.5 bg-white"
                      title="Escolha a cor exata"
                    />
                    <span className="text-xs text-gray-500">
                      Cor personalizada:{" "}
                      <code className="font-mono bg-gray-100 px-1 rounded">
                        {(editedVariation as any).hex_color || "#9CA3AF"}
                      </code>
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="size" className="flex items-center gap-1">
                    <Ruler className="w-4 h-4" />
                    Tamanho
                  </Label>
                  <Input
                    id="size"
                    value={editedVariation.size || ""}
                    onChange={(e) =>
                      setEditedVariation({
                        ...editedVariation,
                        size: e.target.value,
                      })
                    }
                    placeholder="Ex: M"
                  />
                </div>

                <div>
                  <Label htmlFor="material" className="flex items-center gap-1">
                    <Package2 className="w-4 h-4" />
                    Material
                  </Label>
                  <Input
                    id="material"
                    value={editedVariation.material || ""}
                    onChange={(e) =>
                      setEditedVariation({
                        ...editedVariation,
                        material: e.target.value,
                      })
                    }
                    placeholder="Ex: Algodão"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações comerciais */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-medium text-gray-900">
                Informações Comerciais
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={editedVariation.sku || ""}
                    onChange={(e) =>
                      setEditedVariation({
                        ...editedVariation,
                        sku: e.target.value,
                      })
                    }
                    placeholder="Código único"
                  />
                </div>

                <div>
                  <Label htmlFor="stock">Estoque</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={editedVariation.stock || 0}
                    onChange={(e) =>
                      setEditedVariation({
                        ...editedVariation,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="price">Ajuste de Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={editedVariation.price_adjustment || 0}
                    onChange={(e) =>
                      setEditedVariation({
                        ...editedVariation,
                        price_adjustment: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={editedVariation.is_active}
                  onCheckedChange={(checked) =>
                    setEditedVariation({
                      ...editedVariation,
                      is_active: !!checked,
                    })
                  }
                />
                <Label htmlFor="active">Variação ativa</Label>
              </div>
            </CardContent>
          </Card>

          {/* Informações da grade (se aplicável) */}
          {editedVariation.is_grade && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-medium text-blue-900 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Configuração da Grade
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {editedVariation.grade_name && (
                    <div>
                      <Label>Nome da Grade</Label>
                      <Input
                        value={editedVariation.grade_name}
                        onChange={(e) =>
                          setEditedVariation({
                            ...editedVariation,
                            grade_name: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}

                  {editedVariation.grade_quantity !== null && (
                    <div>
                      <Label>Quantidade Total</Label>
                      <Input
                        type="number"
                        min="0"
                        value={editedVariation.grade_quantity || 0}
                        onChange={(e) =>
                          setEditedVariation({
                            ...editedVariation,
                            grade_quantity: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  )}
                </div>

                {editedVariation.grade_sizes && (
                  <div>
                    <Label>Tamanhos da Grade</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editedVariation.grade_sizes.map((size, index) => (
                        <Badge key={index} variant="outline">
                          {size}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Alertas */}
          {editedVariation.is_grade && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> Esta é uma variação de grade.
                Alterações podem afetar a configuração completa da grade.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VariationEditDialog;
