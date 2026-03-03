import React, { useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProductImages } from "@/hooks/useProductImages";
import { useColorImageLinker, ColorImageMap } from "@/hooks/useColorImageLinker";
import {
    Palette,
    Check,
    X,
    Loader2,
    ImageIcon,
    Save,
    Unlink,
} from "lucide-react";

interface QuickColorImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    productName: string;
    onSaved?: () => void;
}

const QuickColorImageModal: React.FC<QuickColorImageModalProps> = ({
    isOpen,
    onClose,
    productId,
    productName,
    onSaved,
}) => {
    const { images: productImages } = useProductImages(productId);
    const { isLoading, isSaving, loadColorImageMap, saveColorImageMap } =
        useColorImageLinker();

    const [colorMap, setColorMap] = useState<ColorImageMap>({});
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Carregar mapa cor-imagem ao abrir
    useEffect(() => {
        if (isOpen && productId) {
            loadColorImageMap(productId).then((map) => {
                setColorMap(map);
                setHasChanges(false);
                // Selecionar primeira cor automaticamente
                const colors = Object.keys(map);
                if (colors.length > 0) {
                    setSelectedColor(colors[0]);
                }
            });
        }
    }, [isOpen, productId, loadColorImageMap]);

    // Vincular imagem à cor selecionada
    const handleImageSelect = useCallback(
        (imageUrl: string) => {
            if (!selectedColor) return;
            setColorMap((prev) => ({ ...prev, [selectedColor]: imageUrl }));
            setHasChanges(true);
        },
        [selectedColor]
    );

    // Desvincular imagem de uma cor
    const handleUnlinkImage = useCallback(
        (color: string) => {
            setColorMap((prev) => ({ ...prev, [color]: null }));
            setHasChanges(true);
        },
        []
    );

    // Salvar vinculações
    const handleSave = useCallback(async () => {
        const success = await saveColorImageMap(productId, colorMap);
        if (success) {
            setHasChanges(false);
            onSaved?.();
            onClose();
        }
    }, [productId, colorMap, saveColorImageMap, onSaved, onClose]);

    const colors = Object.keys(colorMap);
    const allImages = productImages.map((img) => img.image_url).filter(Boolean);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-purple-600" />
                        Vincular Imagens às Cores
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        {productName} — Selecione uma cor e clique na imagem para vincular
                    </p>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : colors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Palette className="h-12 w-12 mb-3 opacity-30" />
                        <p className="text-sm">
                            Este produto não tem variações com cor cadastradas.
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 grid grid-cols-[280px_1fr] gap-4 min-h-0 overflow-hidden">
                        {/* ═══ Coluna Esquerda: Cores ═══ */}
                        <div className="space-y-2 overflow-y-auto pr-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Cores ({colors.length})
                            </p>
                            {colors.map((color) => {
                                const imageUrl = colorMap[color];
                                const isSelected = selectedColor === color;

                                return (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all ${isSelected
                                                ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200 shadow-sm"
                                                : "border-border hover:border-purple-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        {/* Thumbnail da imagem vinculada */}
                                        <div className="relative w-12 h-12 rounded-md flex-shrink-0 overflow-hidden bg-gray-100 border">
                                            {imageUrl ? (
                                                <>
                                                    <img
                                                        src={imageUrl}
                                                        alt={color}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {/* Botão desvincular */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUnlinkImage(color);
                                                        }}
                                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon className="h-5 w-5 text-gray-300" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Nome da cor */}
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium capitalize block truncate">
                                                {color}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {imageUrl ? (
                                                    <span className="text-green-600 flex items-center gap-1">
                                                        <Check className="h-3 w-3" /> Vinculada
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 flex items-center gap-1">
                                                        <Unlink className="h-3 w-3" /> Sem imagem
                                                    </span>
                                                )}
                                            </span>
                                        </div>

                                        {/* Indicador selecionado */}
                                        {isSelected && (
                                            <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* ═══ Coluna Direita: Grid de Imagens ═══ */}
                        <div className="overflow-y-auto">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Imagens da Galeria ({allImages.length})
                            </p>
                            {allImages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <ImageIcon className="h-10 w-10 mb-2 opacity-30" />
                                    <p className="text-sm">Nenhuma imagem cadastrada</p>
                                </div>
                            ) : !selectedColor ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Palette className="h-10 w-10 mb-2 opacity-30" />
                                    <p className="text-sm">Selecione uma cor à esquerda</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-3">
                                    {allImages.map((imageUrl, index) => {
                                        const isLinkedToSelected =
                                            colorMap[selectedColor] === imageUrl;
                                        // Verificar se a imagem está vinculada a outra cor
                                        const linkedToOther = Object.entries(colorMap).find(
                                            ([c, url]) => url === imageUrl && c !== selectedColor
                                        );

                                        return (
                                            <button
                                                key={index}
                                                onClick={() => handleImageSelect(imageUrl)}
                                                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.02] ${isLinkedToSelected
                                                        ? "border-green-500 ring-2 ring-green-200 shadow-md"
                                                        : linkedToOther
                                                            ? "border-amber-300 opacity-70"
                                                            : "border-transparent hover:border-purple-300"
                                                    }`}
                                            >
                                                <img
                                                    src={imageUrl}
                                                    alt={`Imagem ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />

                                                {/* Badge: vinculada a esta cor */}
                                                {isLinkedToSelected && (
                                                    <div className="absolute top-1 right-1 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center shadow">
                                                        <Check className="h-4 w-4" />
                                                    </div>
                                                )}

                                                {/* Badge: vinculada a outra cor */}
                                                {linkedToOther && (
                                                    <div className="absolute bottom-1 left-1 bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize">
                                                        {linkedToOther[0]}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <DialogFooter className="flex items-center justify-between gap-2 pt-3 border-t">
                    <div className="text-xs text-muted-foreground">
                        {hasChanges && (
                            <span className="text-amber-600 font-medium">
                                ⚠ Alterações não salvas
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} disabled={isSaving}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !hasChanges}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Salvar Vinculações
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default QuickColorImageModal;
