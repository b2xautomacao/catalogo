
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';

type WatermarkPosition = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface WatermarkConfig {
  text: string;
  position: WatermarkPosition;
  opacity: number;
  fontSize: number;
  color: string;
  logoSize?: number;
  useStoreLogo: boolean;
  logoUrl?: string;
}

export const useImageWatermark = () => {
  const { profile } = useAuth();
  const { settings } = useCatalogSettings();
  const [processing, setProcessing] = useState(false);

  const applyWatermark = async (file: File, config?: WatermarkConfig): Promise<File> => {
    if (!config && !settings?.watermark_enabled) {
      return file;
    }

    try {
      setProcessing(true);
      
      // Usar configuração personalizada ou configurações da loja
      const watermarkConfig = config || {
        text: settings?.watermark_text || 'Minha Loja',
        position: settings?.watermark_position as WatermarkPosition || 'bottom-right',
        opacity: settings?.watermark_opacity || 0.7,
        fontSize: settings?.watermark_size || 24,
        color: settings?.watermark_color || '#ffffff',
        useStoreLogo: settings?.watermark_type === 'logo',
        logoUrl: settings?.watermark_logo_url
      };

      // Criar canvas para aplicar watermark
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Canvas not supported');

      // Carregar imagem original
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Desenhar imagem original
          ctx.drawImage(img, 0, 0);
          
          if (watermarkConfig.useStoreLogo && watermarkConfig.logoUrl) {
            // Aplicar logo
            const logo = new Image();
            logo.onload = () => {
              const logoSize = watermarkConfig.logoSize || 80;
              let x, y;
              
              switch (watermarkConfig.position) {
                case 'center':
                  x = (canvas.width - logoSize) / 2;
                  y = (canvas.height - logoSize) / 2;
                  break;
                case 'top-left':
                  x = 20;
                  y = 20;
                  break;
                case 'top-right':
                  x = canvas.width - logoSize - 20;
                  y = 20;
                  break;
                case 'bottom-left':
                  x = 20;
                  y = canvas.height - logoSize - 20;
                  break;
                case 'bottom-right':
                default:
                  x = canvas.width - logoSize - 20;
                  y = canvas.height - logoSize - 20;
                  break;
              }
              
              ctx.globalAlpha = watermarkConfig.opacity;
              ctx.drawImage(logo, x, y, logoSize, logoSize);
              
              // Converter para File
              canvas.toBlob((blob) => {
                if (blob) {
                  const newFile = new File([blob], file.name, { type: file.type });
                  URL.revokeObjectURL(imageUrl);
                  resolve(newFile);
                } else {
                  reject(new Error('Failed to create blob'));
                }
              }, file.type, 0.9);
            };
            logo.src = watermarkConfig.logoUrl;
          } else {
            // Aplicar texto
            ctx.font = `${watermarkConfig.fontSize}px Arial`;
            ctx.fillStyle = watermarkConfig.color;
            ctx.globalAlpha = watermarkConfig.opacity;
            
            // Calcular posição
            const textMetrics = ctx.measureText(watermarkConfig.text);
            let x, y;
            
            switch (watermarkConfig.position) {
              case 'center':
                x = (canvas.width - textMetrics.width) / 2;
                y = canvas.height / 2;
                break;
              case 'top-left':
                x = 20;
                y = watermarkConfig.fontSize + 20;
                break;
              case 'top-right':
                x = canvas.width - textMetrics.width - 20;
                y = watermarkConfig.fontSize + 20;
                break;
              case 'bottom-left':
                x = 20;
                y = canvas.height - 20;
                break;
              case 'bottom-right':
              default:
                x = canvas.width - textMetrics.width - 20;
                y = canvas.height - 20;
                break;
            }
            
            // Desenhar watermark
            ctx.fillText(watermarkConfig.text, x, y);
            
            // Converter para File
            canvas.toBlob((blob) => {
              if (blob) {
                const newFile = new File([blob], file.name, { type: file.type });
                URL.revokeObjectURL(imageUrl);
                resolve(newFile);
              } else {
                reject(new Error('Failed to create blob'));
              }
            }, file.type, 0.9);
          }
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(imageUrl);
          reject(new Error('Failed to load image'));
        };
        img.src = imageUrl;
      });
      
    } catch (error) {
      console.error('Error applying watermark:', error);
      return file; // Retornar arquivo original em caso de erro
    } finally {
      setProcessing(false);
    }
  };

  return {
    applyWatermark,
    processing,
    watermarkEnabled: settings?.watermark_enabled || false
  };
};
