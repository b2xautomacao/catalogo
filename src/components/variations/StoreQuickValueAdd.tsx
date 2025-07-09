
import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useStoreVariations,
  VariationGroup,
} from "@/hooks/useStoreVariations";
import { useToast } from "@/hooks/use-toast";

interface StoreQuickValueAddProps {
  group: VariationGroup;
  onValueAdded?: () => void;
}

const ColorSelector: React.FC<{
  selectedColors: string[];
  onColorsChange: (colors: string[], hexColors: string[]) => void;
}> = ({ selectedColors, onColorsChange }) => {
  const [customColor, setCustomColor] = useState("");
  const [customHex, setCustomHex] = useState("#000000");

  const predefinedColors = [
    { name: "Preto", hex: "#000000" },
    { name: "Branco", hex: "#FFFFFF" },
    { name: "Vermelho", hex: "#FF0000" },
    { name: "Azul", hex: "#0000FF" },
    { name: "Verde", hex: "#008000" },
    { name: "Amarelo", hex: "#FFFF00" },
    { name: "Rosa", hex: "#FFC0CB" },
    { name: "Roxo", hex: "#800080" },
    { name: "Laranja", hex: "#FFA500" },
    { name: "Cinza", hex: "#808080" },
    { name: "Marrom", hex: "#A52A2A" },
    { name: "Dourado", hex: "#FFD700" },
  ];

  const toggleColor = (colorName: string, hexColor: string) => {
    const hexColors = selectedColors.map((name) => {
      const found = predefinedColors.find((c) => c.name === name);
      return found ? found.hex : "#000000";
    });

    if (selectedColors.includes(colorName)) {
      const newColors = selectedColors.filter((c) => c !== colorName);
      const newHexColors = newColors.map((name) => {
        const found = predefinedColors.find((c) => c.name === name);
        return found ? found.hex : "#000000";
      });
      onColorsChange(newColors, newHexColors);
    } else {
      onColorsChange([...selectedColors, colorName], [...hexColors, hexColor]);
    }
  };

  const addCustomColor = () => {
    if (customColor.trim() && !selectedColors.includes(customColor.trim())) {
      const hexColors = selectedColors.map((name) => {
        const found = predefinedColors.find((c) => c.name === name);
        return found ? found.hex : "#000000";
      });
      onColorsChange(
        [...selectedColors, customColor.trim()],
        [...hexColors, customHex]
      );
      setCustomColor("");
      setCustomHex("#000000");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Cores Predefinidas</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {predefinedColors.map((color) => (
            <Button
              key={color.name}
              variant={
                selectedColors.includes(color.name) ? "default" : "outline"
              }
              size="sm"
              onClick={() => toggleColor(color.name, color.hex)}
              className="justify-start text-xs"
            >
              <div
                className="w-3 h-3 rounded-full mr-2 border border-gray-300"
                style={{ backgroundColor: color.hex }}
              />
              {color.name}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">Cor Personalizada</Label>
        <div className="flex gap-2 mt-2">
          <Input
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            placeholder="Ex: Azul Royal"
            className="flex-1"
          />
          <input
            type="color"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            className="w-12 h-10 border rounded"
          />
          <Button onClick={addCustomColor} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selectedColors.length > 0 && (
        <div>
          <Label className="text-sm font-medium">Cores Selecionadas</Label>
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedColors.map((color) => (
              <Badge
                key={color}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => {
                  const colorToRemove = predefinedColors.find(
                    (c) => c.name === color
                  );
                  if (colorToRemove) {
                    toggleColor(color, colorToRemove.hex);
                  } else {
                    const newColors = selectedColors.filter((c) => c !== color);
                    const newHexColors = newColors.map((name) => {
                      const found = predefinedColors.find(
                        (c) => c.name === name
                      );
                      return found ? found.hex : "#000000";
                    });
                    onColorsChange(newColors, newHexColors);
                  }
                }}
              >
                {color} ×
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StoreQuickValueAdd: React.FC<StoreQuickValueAddProps> = ({
  group,
  onValueAdded,
}) => {
  const { createValue } = useStoreVariations(group.store_id);
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [hexColor, setHexColor] = useState("#000000");
  const [loading, setLoading] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (group.attribute_key === "color") {
      if (selectedColors.length === 0 && !newValue.trim()) {
        return;
      }
    } else if (!newValue.trim()) {
      return;
    }

    setLoading(true);
    try {
      if (group.attribute_key === "color" && selectedColors.length > 0) {
        const colorValue = selectedColors.join(" e ");
        const valueData = {
          store_id: group.store_id,
          group_id: group.id,
          master_value_id: '',
          value: colorValue,
          hex_color: selectedColors.length === 1 ? hexColor : null,
          is_active: true,
          display_order: 999,
        };

        const result = await createValue(valueData);
        if (result) {
          setSelectedColors([]);
          setNewValue("");
          setHexColor("#000000");
          setIsOpen(false);
          onValueAdded?.();
          toast({
            title: "Valor adicionado",
            description: "Novo valor de variação criado com sucesso",
          });
        }
      } else {
        const valueData = {
          store_id: group.store_id,
          group_id: group.id,
          master_value_id: '',
          value: newValue.trim(),
          hex_color: group.attribute_key === "color" ? hexColor : null,
          is_active: true,
          display_order: 999,
        };

        const result = await createValue(valueData);
        if (result) {
          setNewValue("");
          setHexColor("#000000");
          setIsOpen(false);
          onValueAdded?.();
          toast({
            title: "Valor adicionado",
            description: "Novo valor de variação criado com sucesso",
          });
        }
      }
    } catch (error) {
      console.error("Erro ao adicionar valor:", error);
      toast({
        title: "Erro",
        description: "Falha ao adicionar valor de variação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleColorsChange = (colors: string[], hexColors: string[]) => {
    setSelectedColors(colors);
    if (colors.length === 1 && hexColors.length === 1) {
      setHexColor(hexColors[0]);
    }
  };

  const isColorGroup = group.attribute_key === "color";
  const canSubmit = isColorGroup
    ? selectedColors.length > 0 || newValue.trim().length > 0
    : newValue.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar {group.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isColorGroup ? (
            <div className="space-y-4">
              <ColorSelector
                selectedColors={selectedColors}
                onColorsChange={handleColorsChange}
              />

              <div className="border-t pt-4">
                <Label htmlFor="manual-color">Ou digite manualmente</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="manual-color"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Ex: Azul Royal, Verde Militar"
                  />
                  <input
                    type="color"
                    value={hexColor}
                    onChange={(e) => setHexColor(e.target.value)}
                    className="w-12 h-10 border rounded"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <Label htmlFor="value">Novo valor para {group.name}</Label>
              <Input
                id="value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={`Ex: ${
                  group.attribute_key === "size"
                    ? "46"
                    : group.attribute_key === "material"
                    ? "Algodão Orgânico"
                    : "Novo valor"
                }`}
                required
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? "Adicionando..." : "Adicionar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StoreQuickValueAdd;
