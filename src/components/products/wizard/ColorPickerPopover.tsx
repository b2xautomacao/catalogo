import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Palette, Plus, Check, Loader2 } from "lucide-react";
import { useStoreColors } from "@/hooks/useStoreColors";
import { useToast } from "@/hooks/use-toast";

interface ColorPickerPopoverProps {
  onColorSelect: (color: { name: string; hex: string; saved?: boolean }) => void;
  storeId?: string;
  trigger?: React.ReactNode;
}

const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  onColorSelect,
  storeId,
  trigger,
}) => {
  const { toast } = useToast();
  const { colors: storeColors, createColor } = useStoreColors(storeId);
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#000000");
  const [saveGlobal, setSaveGlobal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, dê um nome para a cor.",
        variant: "destructive",
      });
      return;
    }

    if (!hex.startsWith("#") || hex.length !== 7) {
      toast({
        title: "Cor inválida",
        description: "Por favor, selecione uma cor válida.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let saved = false;
      if (saveGlobal && storeId) {
        await createColor({
          name: name.trim(),
          hex_color: hex,
          store_id: storeId,
        });
        saved = true;
      }

      onColorSelect({ name: name.trim(), hex, saved });
      setIsOpen(false);
      setName("");
      setHex("#000000");
      setSaveGlobal(false);

      toast({
        title: saved ? "Cor salva e selecionada!" : "Cor selecionada!",
        description: `A cor "${name}" foi adicionada com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao adicionar cor:", error);
      toast({
        title: "Erro ao adicionar cor",
        description: "Ocorreu um problema ao salvar a cor globalmente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Cor Personalizada
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Nova Cor</h4>
            <p className="text-sm text-muted-foreground">
              Personalize o tom da cor e salve se desejar.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="grid gap-1">
              <Label htmlFor="color-name">Nome da Cor</Label>
              <Input
                id="color-name"
                placeholder="Ex: Marsala, Azul Royal..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="color-hex">Tom da Cor</Label>
              <div className="flex gap-2">
                <Input
                  id="color-hex"
                  type="color"
                  className="w-12 h-10 p-1 cursor-pointer"
                  value={hex}
                  onChange={(e) => setHex(e.target.value)}
                />
                <Input
                  value={hex.toUpperCase()}
                  onChange={(e) => setHex(e.target.value)}
                  className="font-mono"
                  maxLength={7}
                />
              </div>
            </div>

            {storeId && (
              <div className="flex items-center space-x-2 py-2">
                <Checkbox
                  id="save-global"
                  checked={saveGlobal}
                  onCheckedChange={(checked) => setSaveGlobal(!!checked)}
                />
                <Label
                  htmlFor="save-global"
                  className="text-sm font-normal cursor-pointer"
                >
                  Salvar permanentemente nas cores da loja
                </Label>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleAdd}
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {saveGlobal ? "Salvar e Adicionar" : "Adicionar Cor"}
            </Button>
          </div>

          {storeColors.length > 0 && (
            <div className="pt-2 border-t mt-2">
              <Label className="text-xs uppercase text-muted-foreground font-semibold mb-2 block">
                Cores da Loja
              </Label>
              <div className="grid grid-cols-6 gap-2">
                {storeColors.slice(0, 12).map((color) => (
                  <button
                    key={color.id}
                    className="w-8 h-8 rounded-full border border-gray-200 hover:scale-110 transition-transform relative group"
                    style={{ backgroundColor: color.hex_color }}
                    title={color.name}
                    onClick={() => {
                      setName(color.name);
                      setHex(color.hex_color);
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 rounded-full transition-opacity">
                      <Check className="w-4 h-4 text-white drop-shadow-md" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColorPickerPopover;
