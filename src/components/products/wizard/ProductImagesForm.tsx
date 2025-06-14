
import React, { useState } from 'react';
import { Upload, X, GripVertical, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DraftImage } from '@/hooks/useDraftImages';

interface ProductImagesFormProps {
  draftImages: DraftImage[];
  onImageAdd: (file: File) => void;
  onImageRemove: (id: string) => void;
  maxImages?: number;
}

const ProductImagesForm = ({ 
  draftImages, 
  onImageAdd, 
  onImageRemove, 
  maxImages = 10 
}: ProductImagesFormProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const { toast } = useToast();

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

      onImageAdd(file);
    });
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('image-upload')?.click()}
      >
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Arraste e solte suas imagens aqui
        </p>
        <p className="text-sm text-gray-500 mb-4">
          ou clique para selecionar arquivos
        </p>
        <p className="text-xs text-gray-400">
          Máximo {maxImages} imagens • Até 5MB cada • JPG, PNG, WebP
        </p>
      </div>

      <input
        id="image-upload"
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Images Grid */}
      {draftImages.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Imagens do Produto</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {draftImages.map((image, index) => (
              <div
                key={image.id}
                className="relative group aspect-square rounded-lg border-2 border-gray-200 overflow-hidden hover:border-blue-300 transition-colors"
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragEnd={() => setDraggedIndex(null)}
              >
                <img
                  src={image.url}
                  alt={`Produto ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Principal Badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    Principal
                  </div>
                )}
                
                {/* Uploaded Badge */}
                {image.uploaded && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    ✓
                  </div>
                )}
                
                {/* Remove Button */}
                <button
                  onClick={() => onImageRemove(image.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
                
                {/* Drag Handle */}
                <div className="absolute bottom-1 right-1 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                  <GripVertical size={16} />
                </div>
                
                {/* Order Number */}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <Star className="w-4 h-4 inline mr-1" />
              A primeira imagem será a imagem principal do produto. Arraste para reordenar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImagesForm;
