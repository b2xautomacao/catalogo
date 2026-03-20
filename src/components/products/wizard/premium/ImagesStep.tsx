import React, { useRef } from "react";
import { useDraftImagesContext } from "@/contexts/DraftImagesContext";
import { Button } from "@/components/ui/button";
import { Upload, X, Star, Trash2, Camera, Link as LinkIcon, Image as ImageIcon, Video, Play, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PremiumWizardFormData } from "@/hooks/usePremiumProductWizard";

interface ImagesStepProps {
  formData: PremiumWizardFormData;
  updateFormData: (updates: Partial<PremiumWizardFormData>) => void;
}

const ImagesStep: React.FC<ImagesStepProps> = ({ formData, updateFormData }) => {
  const { draftImages, addDraftImages, removeDraftImage, setPrimaryImage, setColorAssociation } = useDraftImagesContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const remaining = 10 - draftImages.length;
      if (remaining <= 0) return;
      
      const filesToAdd = Array.from(e.target.files).slice(0, remaining);
      addDraftImages(filesToAdd);
    }
  };

  // Cores únicas das variações para associar
  const availableColors = Array.from(new Set(formData.variations.map(v => v.color)));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-center justify-between">
         <div>
            <h3 className="text-xl font-bold text-slate-900">Galeria Multimídia</h3>
            <p className="text-sm text-slate-500 font-medium">Fotos (Máx 10) e Vídeos (Máx 2)</p>
         </div>
         <Badge variant="outline" className="h-6 px-3 bg-blue-50 text-blue-600 border-blue-200 font-bold">
            {draftImages.length}/10 Fotos
         </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Botão de Upload */}
        {draftImages.length < 10 && (
            <button
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-400 transition-all flex flex-col items-center justify-center gap-2 group"
            >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-blue-700 uppercase">Adicionar Fotos</span>
            <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />
            </button>
        )}

        {/* Galeria de Fotos */}
        {draftImages.map((image) => (
          <div 
            key={image.id} 
            className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all shadow-sm ${
              image.isPrimary ? "border-amber-400 ring-2 ring-amber-100" : "border-slate-100"
            }`}
          >
             <img 
               src={image.preview || image.url} 
               alt="Preview" 
               className="w-full h-full object-cover"
             />
             
             {/* Overlay de Ações e Associação de Cor */}
             <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity space-y-2">
                <div className="flex justify-between items-center">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-white hover:bg-red-500/50 hover:text-white"
                        onClick={() => removeDraftImage(image.id)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                    
                    {!image.isPrimary && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-[9px] font-bold text-white hover:bg-amber-500/50 uppercase bg-white/10 backdrop-blur-md px-2"
                            onClick={() => setPrimaryImage(image.id)}
                        >
                            Capa
                        </Button>
                    )}
                </div>

                {/* Associação de Cor */}
                <Select 
                    value={image.color_association || "none"} 
                    onValueChange={(v) => setColorAssociation(image.id, v === "none" ? undefined : v)}
                >
                    <SelectTrigger className="h-7 bg-white/90 backdrop-blur-sm text-[9px] font-bold border-none shadow-lg">
                        <SelectValue placeholder="Vincular Cor" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none" className="text-[10px]">Geral (Sem Cor)</SelectItem>
                        {availableColors.map(color => (
                            <SelectItem key={color} value={color} className="text-[10px]">{color}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
             </div>

             {/* Badge Principal */}
             {image.isPrimary && (
               <div className="absolute top-2 left-2 bg-amber-400 text-white p-1 rounded-md shadow-md">
                  <Star className="w-3 h-3 fill-white" />
               </div>
             )}
             
             {/* Badge de Cor Vinculada */}
             {image.color_association && (
               <div className="absolute top-2 right-2 bg-blue-500 text-white px-1.5 py-0.5 rounded text-[8px] font-bold shadow-sm">
                  {image.color_association}
               </div>
             )}
          </div>
        ))}
      </div>

      {/* Seção de Vídeos */}
      <div className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
            <Label className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <Video className="w-4 h-4 text-purple-500" />
                Vídeos de Demonstração (Limite: 2)
            </Label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-dashed border-slate-200 bg-slate-50/50">
               <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <Play className="w-3 h-3 text-red-500" /> Vídeo 1 (Link YouTube/Vimeo)
                  </div>
                  <Input 
                    value={formData.video_url}
                    onChange={(e) => updateFormData({ video_url: e.target.value })}
                    placeholder="Cole o link do vídeo aqui..."
                    className="h-10 bg-white"
                  />
               </CardContent>
            </Card>

            <Card className="border-dashed border-slate-200 bg-slate-50/50 opacity-60">
               <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <Play className="w-3 h-3" /> Vídeo 2 (Dica: Use Reels ou TikTok)
                  </div>
                  <Input 
                    disabled
                    placeholder="Em breve: Upload direto"
                    className="h-10 bg-white"
                  />
               </CardContent>
            </Card>
        </div>
      </div>

       <div className="mt-8 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div className="flex-1">
             <h4 className="text-sm font-bold text-amber-900">Associe fotos às cores</h4>
             <p className="text-[11px] text-amber-700 font-medium">Vincular uma foto a uma cor faz com que ela apareça automaticamente quando o cliente selecionar aquela cor no catálogo! 🎨</p>
          </div>
       </div>
    </div>
  );
};

export default ImagesStep;
