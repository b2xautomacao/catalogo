/**
 * ProductVideoSection - Seção de Vídeo do Produto
 * Exibe vídeo cadastrado do produto com fallback para imagens
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, X } from "lucide-react";

interface ProductVideoSectionProps {
  videoUrl?: string;
  videoType?: 'youtube' | 'vimeo' | 'direct';
  thumbnailUrl?: string;
  productName: string;
}

const ProductVideoSection: React.FC<ProductVideoSectionProps> = ({
  videoUrl,
  videoType = 'youtube',
  thumbnailUrl,
  productName,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!videoUrl) return null;

  // Extrair ID do vídeo do YouTube
  const getYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Extrair ID do Vimeo
  const getVimeoId = (url: string): string | null => {
    const regExp = /vimeo.*\/(\d+)/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const renderVideo = () => {
    if (videoType === 'youtube') {
      const videoId = getYouTubeId(videoUrl);
      if (!videoId) return null;

      return (
        <div className="relative w-full pt-[56.25%]">
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}`}
            title={`Vídeo: ${productName}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    if (videoType === 'vimeo') {
      const videoId = getVimeoId(videoUrl);
      if (!videoId) return null;

      return (
        <div className="relative w-full pt-[56.25%]">
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            src={`https://player.vimeo.com/video/${videoId}?autoplay=${isPlaying ? 1 : 0}`}
            title={`Vídeo: ${productName}`}
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Vídeo direto (MP4, etc)
    return (
      <video
        className="w-full rounded-lg"
        controls
        autoPlay={isPlaying}
        poster={thumbnailUrl}
      >
        <source src={videoUrl} type="video/mp4" />
        Seu navegador não suporta vídeo HTML5.
      </video>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Play className="w-5 h-5 text-purple-600" />
            Vídeo do Produto
          </CardTitle>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            Vídeo
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {!isPlaying && thumbnailUrl ? (
          <div 
            className="relative cursor-pointer group"
            onClick={() => setIsPlaying(true)}
          >
            <img
              src={thumbnailUrl}
              alt={`Thumbnail do vídeo: ${productName}`}
              className="w-full rounded-lg"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all flex items-center justify-center rounded-lg">
              <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-10 h-10 text-purple-600 ml-1" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {isPlaying && thumbnailUrl && (
              <button
                onClick={() => setIsPlaying(false)}
                className="absolute top-2 right-2 z-10 bg-black/70 text-white p-2 rounded-full hover:bg-black transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {renderVideo()}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductVideoSection;

