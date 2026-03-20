import React, { useRef } from "react";
import { useDraftImagesContext } from "@/contexts/DraftImagesContext";
import { Button } from "@/components/ui/button";
import { Upload, X, Star, Trash2, Camera, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ImagesStep: React.FC = () => {
  const { draftImages, addDraftImages, removeDraftImage, setPrimaryImage } = useDraftImagesContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addDraftImages(Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="text-center space-y-2">
         <h3 className="text-xl font-bold text-slate-900">Fotos do Produto</h3>
         <p className="text-sm text-slate-500 font-medium">As fotos são o principal fator de conversão do seu catálogo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Botão de Upload Grande */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-400 transition-all flex flex-col items-center justify-center gap-3 group"
        >
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
             <Camera className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-blue-700">Adicionar Fotos</span>
          <span className="text-[10px] text-slate-400 uppercase">JPG, PNG (Máx 5MB)</span>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </button>

        {/* Galeria de Previsão */}
        {draftImages.map((image) => (
          <div 
            key={image.id} 
            className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
              image.isPrimary ? "border-amber-400 shadow-lg scale-[1.02]" : "border-transparent"
            }`}
          >
             <img 
               src={image.preview} 
               alt="Preview" 
               className="w-full h-full object-cover"
             />
             
             {/* Overlay de Ações */}
             <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => removeDraftImage(image.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                
                {!image.isPrimary && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-[10px] font-bold text-white hover:bg-white/20 uppercase bg-white/10 backdrop-blur-md px-3"
                    onClick={() => setPrimaryImage(image.id)}
                  >
                    Principal
                  </Button>
                )}
             </div>

             {/* Badge Principal */}
             {image.isPrimary && (
               <div className="absolute top-3 left-3 bg-amber-400 text-white p-1 rounded-md shadow-md animate-bounce">
                  <Star className="w-3 h-3 fill-white" />
               </div>
             )}
          </div>
        ))}
      </div>

       {/* Dica do Especialista */}
       <div className="mt-8 p-4 rounded-2xl bg-slate-900 text-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
             <ImageIcon className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
             <h4 className="text-sm font-bold">Dica: Use fundo branco</h4>
             <p className="text-[11px] text-slate-400">Produtos com fundo neutro convertem até 40% mais em catálogos eletrônicos.</p>
          </div>
          <LinkIcon className="w-4 h-4 text-slate-600" />
       </div>
    </div>
  );
};

export default ImagesStep;
