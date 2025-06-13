
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useLogoUpload } from '@/hooks/useLogoUpload';
import { useStores } from '@/hooks/useStores';

const LogoUpload = () => {
  const { uploadLogo, deleteLogo, uploading } = useLogoUpload();
  const { currentStore, updateCurrentStore } = useStores();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const logoUrl = await uploadLogo(file);
      if (logoUrl) {
        // Atualizar logo da loja no banco
        await updateCurrentStore({ logo_url: logoUrl });
      }
    } catch (error) {
      console.error('LogoUpload: Erro no upload:', error);
    }
  };

  const handleRemoveLogo = async () => {
    if (currentStore?.logo_url) {
      const success = await deleteLogo(currentStore.logo_url);
      if (success) {
        // Remover logo da loja no banco
        await updateCurrentStore({ logo_url: null });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Logo da Loja
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentStore?.logo_url ? (
          <div className="relative">
            <div className="w-32 h-32 rounded-lg border-2 border-gray-200 overflow-hidden mx-auto">
              <img
                src={currentStore.logo_url}
                alt="Logo da loja"
                className="w-full h-full object-cover"
              />
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemoveLogo}
              disabled={uploading}
              className="mt-2 w-full"
            >
              <X className="mr-2 h-4 w-4" />
              Remover Logo
            </Button>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600">Enviando logo...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  Arraste e solte uma imagem ou clique para selecionar
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, WebP ou GIF • Máximo 5MB
                </p>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={uploading}
        />

        <div className="text-xs text-gray-500">
          <p>• O logo aparecerá no topo do seu catálogo</p>
          <p>• Recomendamos uma imagem quadrada para melhor resultado</p>
          <p>• A imagem será redimensionada automaticamente</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LogoUpload;
