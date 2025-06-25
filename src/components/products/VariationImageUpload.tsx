
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface VariationImageUploadProps {
  imageUrl?: string;
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
  disabled?: boolean;
}

const VariationImageUpload: React.FC<VariationImageUploadProps> = ({
  imageUrl,
  onImageUpload,
  onImageRemove,
  disabled = false
}) => {
  const [dragOver, setDragOver] = useState(false);

  console.log('🖼 VARIATION IMAGE UPLOAD - Renderizando:', {
    hasImage: !!imageUrl,
    imageUrl: imageUrl?.substring(0, 50) + '...',
    disabled
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('📁 VARIATION IMAGE UPLOAD - Arquivo selecionado:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      onImageUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      console.log('📁 VARIATION IMAGE UPLOAD - Arquivo arrastado:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      onImageUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm">Imagem da Variação</Label>
      
      {imageUrl ? (
        <Card className="relative">
          <CardContent className="p-2">
            <div className="relative">
              <img
                src={imageUrl}
                alt="Variação"
                className="w-full h-20 object-cover rounded"
                onError={(e) => {
                  console.error('❌ VARIATION IMAGE UPLOAD - Erro ao carregar imagem');
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDlWN0MyMSA1Ljg5NTQzIDIwLjEwNDYgNSAxOSA1SDVDMy44OTU0MyA1IDMgNS44OTU0MyAzIDdWMTdDMyAxOC4xMDQ2IDMuODk1NDMgMTkgNSAxOUgxOUMyMC4xMDQ2IDE5IDIxIDE4LjEwNDYgMjEgMTdWMTVNMjEgOUwxNSAxNUw5IDlNMjEgOUgxNE0yMSA5VjE1IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0"
                onClick={() => {
                  console.log('🗑 VARIATION IMAGE UPLOAD - Removendo imagem');
                  onImageRemove();
                }}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          className={`
            border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
            ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && document.getElementById('variation-image-input')?.click()}
        >
          <div className="flex flex-col items-center gap-2">
            <Image className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm">
              <span className="text-primary">Clique para enviar</span>
              <span className="text-muted-foreground"> ou arraste aqui</span>
            </div>
            <p className="text-xs text-muted-foreground">
              PNG, JPG até 2MB
            </p>
          </div>
        </div>
      )}
      
      <Input
        id="variation-image-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      
      <p className="text-xs text-muted-foreground">
        Deixe vazio para usar a imagem principal do produto
      </p>
    </div>
  );
};

export default VariationImageUpload;
