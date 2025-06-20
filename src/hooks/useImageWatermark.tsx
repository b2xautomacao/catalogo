
import { useState } from 'react';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';

export interface WatermarkConfig {
  text?: string;
  logoUrl?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  fontSize: number;
  color: string;
  logoSize?: number;
  useStoreLogo?: boolean;
}

export const useImageWatermark = () => {
  const [processing, setProcessing] = useState(false);
  const { settings } = useCatalogSettings();

  // Função para obter configurações da loja
  const getStoreWatermarkConfig = (): WatermarkConfig | null => {
    if (!settings?.watermark_enabled) return null;

    return {
      text: settings.watermark_text,
      logoUrl: settings.watermark_logo_url,
      position: settings.watermark_position,
      opacity: settings.watermark_opacity,
      fontSize: settings.watermark_size,
      color: settings.watermark_color,
      logoSize: settings.watermark_size,
      useStoreLogo: settings.watermark_type === 'logo' && !!settings.watermark_logo_url
    };
  };

  const applyWatermark = async (
    imageFile: File, 
    config?: WatermarkConfig
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      setProcessing(true);
      
      // Usar configurações da loja se não fornecidas
      const watermarkConfig = config || getStoreWatermarkConfig();
      
      if (!watermarkConfig) {
        // Retornar arquivo original se marca d'água não está configurada
        setProcessing(false);
        resolve(imageFile);
        return;
      }
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = async () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Desenhar imagem original
          ctx!.drawImage(img, 0, 0);
          
          // Configurar marca d'água
          ctx!.globalAlpha = watermarkConfig.opacity;
          
          // Se há logo para usar
          if (watermarkConfig.logoUrl && watermarkConfig.useStoreLogo) {
            await applyLogoWatermark(ctx!, canvas, watermarkConfig);
          }
          
          // Se há texto para usar
          if (watermarkConfig.text && !watermarkConfig.useStoreLogo) {
            applyTextWatermark(ctx!, canvas, watermarkConfig);
          }
          
          // Converter canvas para blob e depois para File
          canvas.toBlob((blob) => {
            if (blob) {
              const watermarkedFile = new File(
                [blob], 
                imageFile.name, 
                { type: imageFile.type }
              );
              resolve(watermarkedFile);
            } else {
              reject(new Error('Falha ao aplicar marca d\'água'));
            }
            setProcessing(false);
          }, imageFile.type, 0.9);
          
        } catch (error) {
          setProcessing(false);
          reject(error);
        }
      };
      
      img.onerror = () => {
        setProcessing(false);
        reject(new Error('Falha ao carregar imagem'));
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  };

  const applyLogoWatermark = async (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    config: WatermarkConfig
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const logoImg = new Image();
      
      logoImg.onload = () => {
        try {
          const logoSize = config.logoSize || 80;
          let x, y;
          
          switch (config.position) {
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
              x = canvas.width - logoSize - 20;
              y = canvas.height - logoSize - 20;
              break;
            case 'center':
              x = (canvas.width - logoSize) / 2;
              y = (canvas.height - logoSize) / 2;
              break;
            default:
              x = canvas.width - logoSize - 20;
              y = canvas.height - logoSize - 20;
          }
          
          ctx.drawImage(logoImg, x, y, logoSize, logoSize);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      logoImg.onerror = () => {
        reject(new Error('Falha ao carregar logo'));
      };
      
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = config.logoUrl!;
    });
  };

  const applyTextWatermark = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    config: WatermarkConfig
  ) => {
    ctx.fillStyle = config.color;
    ctx.font = `${config.fontSize}px Arial`;
    
    const textMetrics = ctx.measureText(config.text!);
    let x, y;
    
    switch (config.position) {
      case 'top-left':
        x = 20;
        y = config.fontSize + 20;
        break;
      case 'top-right':
        x = canvas.width - textMetrics.width - 20;
        y = config.fontSize + 20;
        break;
      case 'bottom-left':
        x = 20;
        y = canvas.height - 20;
        break;
      case 'bottom-right':
        x = canvas.width - textMetrics.width - 20;
        y = canvas.height - 20;
        break;
      case 'center':
        x = (canvas.width - textMetrics.width) / 2;
        y = canvas.height / 2;
        break;
      default:
        x = 20;
        y = canvas.height - 20;
    }
    
    ctx.fillText(config.text!, x, y);
  };

  return {
    applyWatermark,
    processing,
    getStoreWatermarkConfig,
    isWatermarkEnabled: settings?.watermark_enabled || false
  };
};
