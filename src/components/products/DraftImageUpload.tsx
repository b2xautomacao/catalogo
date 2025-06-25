
import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DraftImage } from '@/hooks/useDraftImages';

interface DraftImageUploadProps {
  draftImages: DraftImage[];
  onImageAdd: (file: File) => void;
  onImageRemove: (id: string) => void;
  maxImages?: number;
  uploading?: boolean;
}

const DraftImageUpload = ({ 
  draftImages, 
  onImageAdd, 
  onImageRemove, 
  maxImages = 5,
  uploading = false
}: DraftImageUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  console.log('🖼 DRAFT IMAGE UPLOAD - Imagens:', draftImages.length);
  console.log('🖼 DRAFT IMAGE UPLOAD - Uploading:', uploading);

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
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    console.log('📁 DRAFT IMAGE UPLOAD - Arquivos selecionados:', files.length);
    
    if (draftImages.length >= maxImages) {
      toast({
        title: "Limite atingido",
        description: `Você pode adicionar no máximo ${maxImages} imagens`,
        variant: "destructive",
      });
      return;
    }

    const remainingSlots = maxImages - draftImages.length;
    const filesToProcess = files.slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione apenas arquivos de imagem",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }

      console.log('➕ DRAFT IMAGE UPLOAD - Adicionando arquivo:', file.name);
      onImageAdd(file);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {draftImages.map((image, index) => {
          console.log('🎨 DRAFT IMAGE UPLOAD - Renderizando imagem:', index, {
            id: image.id,
            hasPreview: !!image.preview,
            hasUrl: !!image.url,
            uploaded: image.uploaded,
            isExisting: image.isExisting
          });

          return (
            <div key={image.id} className="relative group">
              <div className="w-24 h-24 rounded-lg border-2 border-gray-200 overflow-hidden">
                <img
                  src={image.preview || image.url || ''}
                  alt={`Produto ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('❌ DRAFT IMAGE UPLOAD - Erro ao carregar imagem:', image.id);
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDlWN0MyMSA1Ljg5NTQzIDIwLjEwNDYgNSAxOSA1SDVDMy44OTU0MyA1IDMgNS44OTU0MyAzIDdWMTdDMyAxOC4xMDQ2IDMuODk1NDMgMTkgNSAxOUgxOUMyMC4xMDQ2IDE5IDIxIDE4LjEwNDYgMjEgMTdWMTVNMjEgOUwxNSAxNUw5IDlNMjEgOUgxNE0yMSA5VjE1IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                  }}
                />
              </div>
              
              <button
                onClick={() => {
                  console.log('🗑 DRAFT IMAGE UPLOAD - Removendo imagem:', image.id);
                  onImageRemove(image.id);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={uploading}
              >
                <X size={14} />
              </button>
              
              {index === 0 && (
                <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Principal
                </div>
              )}
              
              {image.uploaded && (
                <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  ✓
                </div>
              )}

              {!image.uploaded && !image.isExisting && (
                <div className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                  Nova
                </div>
              )}
            </div>
          );
        })}
        
        {draftImages.length < maxImages && (
          <div
            className={`w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !uploading && document.getElementById('draft-image-upload')?.click()}
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            ) : (
              <Upload size={20} className="text-gray-400" />
            )}
          </div>
        )}
      </div>

      <input
        id="draft-image-upload"
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        disabled={uploading}
      />

      <div className="text-sm text-gray-500">
        <p>Adicione até {maxImages} imagens • Máximo 5MB por imagem</p>
        <p>A primeira imagem será a principal • Arraste e solte ou clique para selecionar</p>
        {uploading && <p className="text-blue-600">Enviando imagens...</p>}
      </div>
    </div>
  );
};

export default DraftImageUpload;
