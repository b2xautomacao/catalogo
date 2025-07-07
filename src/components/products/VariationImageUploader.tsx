
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Image as ImageIcon, X, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VariationImageUploaderProps {
  colorName: string;
  onImageSelected: (colorName: string, file: File) => void;
  onImageRemoved: (colorName: string) => void;
  currentImage?: string | File;
  disabled?: boolean;
}

const VariationImageUploader: React.FC<VariationImageUploaderProps> = ({
  colorName,
  onImageSelected,
  onImageRemoved,
  currentImage,
  disabled = false,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (currentImage) {
      if (typeof currentImage === "string") {
        setPreviewUrl(currentImage);
      } else if (currentImage instanceof File) {
        const url = URL.createObjectURL(currentImage);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    } else {
      setPreviewUrl(null);
    }
  }, [currentImage]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validações
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas arquivos de imagem",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    console.log(`📷 VARIATION IMAGE - Imagem selecionada para ${colorName}:`, file.name);
    onImageSelected(colorName, file);

    // Limpar input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    console.log(`🗑️ VARIATION IMAGE - Removendo imagem para ${colorName}`);
    onImageRemoved(colorName);
    setPreviewUrl(null);
  };

  const handleUploadClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Imagem para {colorName}
          </div>
          {previewUrl && (
            <Badge variant="secondary" className="text-xs">
              Imagem definida
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {previewUrl ? (
          <div className="relative">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
              <img
                src={previewUrl}
                alt={`Imagem da variação ${colorName}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error(`❌ Erro ao carregar preview para ${colorName}`);
                  setPreviewUrl(null);
                }}
              />
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0"
              onClick={handleRemoveImage}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
              disabled
                ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                : "border-gray-300 hover:border-primary hover:bg-gray-50"
            }`}
            onClick={handleUploadClick}
          >
            <Upload className={`w-8 h-8 mb-2 ${disabled ? "text-gray-400" : "text-gray-500"}`} />
            <p className={`text-sm text-center ${disabled ? "text-gray-400" : "text-gray-600"}`}>
              {disabled ? "Salve o produto primeiro" : "Clique para selecionar"}
            </p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG • Máx 5MB</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {!previewUrl && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleUploadClick}
            disabled={disabled}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            {disabled ? "Salve primeiro para adicionar" : "Selecionar Imagem"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default VariationImageUploader;
