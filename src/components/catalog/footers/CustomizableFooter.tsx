import React, { useState } from 'react';
import { Store } from '@/hooks/useCatalog';
import { CatalogSettingsData } from '@/hooks/useCatalogSettings';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface CustomizableFooterProps {
  store: Store;
  whatsappNumber?: string;
  storeSettings?: CatalogSettingsData | null;
  style?: 'dark' | 'light' | 'gradient';
  bgColor?: string;
  textColor?: string;
}

const CustomizableFooter: React.FC<CustomizableFooterProps> = ({
  store,
  whatsappNumber,
  storeSettings,
  style = 'dark',
  bgColor,
  textColor,
}) => {
  const currentYear = new Date().getFullYear();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Verificar se footer está habilitado
  if (storeSettings?.footer_enabled === false) {
    return null;
  }

  // Determinar cores baseado no estilo
  const getFooterStyles = () => {
    if (bgColor && textColor) {
      return {
        backgroundColor: bgColor,
        color: textColor,
      };
    }

    switch (style) {
      case 'light':
        return {
          backgroundColor: '#FFFFFF',
          color: '#1E293B',
          borderTop: '1px solid #E2E8F0',
        };
      
      case 'gradient':
        return {
          background: `linear-gradient(135deg, var(--template-primary, #0057FF), var(--template-accent, #8E2DE2))`,
          color: '#FFFFFF',
        };
      
      case 'dark':
      default:
        return {
          backgroundColor: 'var(--template-text, #1E293B)',
          color: '#FFFFFF',
        };
    }
  };

  const footerStyles = getFooterStyles();
  const isLightStyle = style === 'light';

  // Verificar se há redes sociais
  const hasSocialMedia = !!(
    storeSettings?.facebook_url ||
    storeSettings?.instagram_url ||
    storeSettings?.twitter_url ||
    storeSettings?.linkedin_url ||
    storeSettings?.youtube_url ||
    storeSettings?.tiktok_url
  );

  return (
    <footer style={footerStyles} className="mt-auto">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Sobre a Loja */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={`Logo ${store.name}`}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white"
                  style={{ background: 'var(--template-primary, #0057FF)' }}
                >
                  {store.name.charAt(0).toUpperCase()}
                </div>
              )}
              <h3 className="text-xl font-bold">{store.name}</h3>
            </div>
            
            <div className="mb-4" style={{ opacity: 0.8 }}>
              <p className={`text-sm leading-relaxed ${
                store.description && store.description.length > 150 && !isDescriptionExpanded
                  ? "line-clamp-3" 
                  : ""
              }`}>
                {store.description || "Oferecemos produtos de qualidade com os melhores preços do mercado."}
              </p>
              {store.description && store.description.length > 150 && (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="text-xs hover:underline mt-1 transition-colors"
                  style={{ color: isLightStyle ? 'var(--template-primary)' : '#93C5FD' }}
                >
                  {isDescriptionExpanded ? 'Ver menos' : 'Continuar lendo...'}
                </button>
              )}
            </div>

            {/* Redes Sociais */}
            {hasSocialMedia && (
              <div className="flex flex-wrap gap-2">
                {storeSettings?.facebook_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`${isLightStyle ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                    onClick={() => window.open(storeSettings.facebook_url, '_blank')}
                  >
                    <Facebook size={20} />
                  </Button>
                )}
                {storeSettings?.instagram_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`${isLightStyle ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                    onClick={() => window.open(storeSettings.instagram_url, '_blank')}
                  >
                    <Instagram size={20} />
                  </Button>
                )}
                {storeSettings?.twitter_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`${isLightStyle ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                    onClick={() => window.open(storeSettings.twitter_url, '_blank')}
                  >
                    <Twitter size={20} />
                  </Button>
                )}
                {storeSettings?.linkedin_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`${isLightStyle ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                    onClick={() => window.open(storeSettings.linkedin_url, '_blank')}
                  >
                    <Linkedin size={20} />
                  </Button>
                )}
                {storeSettings?.youtube_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`${isLightStyle ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                    onClick={() => window.open(storeSettings.youtube_url, '_blank')}
                  >
                    <Youtube size={20} />
                  </Button>
                )}
                {storeSettings?.tiktok_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`${isLightStyle ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                    onClick={() => window.open(storeSettings.tiktok_url, '_blank')}
                  >
                    <Video size={20} />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Links Rápidos */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <a href="#produtos" className="text-sm hover:underline transition-colors" style={{ opacity: 0.8 }}>
                  Nossos Produtos
                </a>
              </li>
              <li>
                <a href="#contato" className="text-sm hover:underline transition-colors" style={{ opacity: 0.8 }}>
                  Contato
                </a>
              </li>
              <li>
                <a href="#sobre" className="text-sm hover:underline transition-colors" style={{ opacity: 0.8 }}>
                  Sobre Nós
                </a>
              </li>
            </ul>
          </div>

          {/* Informações de Contato */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contato</h4>
            <div className="space-y-3">
              {store.address && (
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="mt-0.5" style={{ opacity: 0.6 }} />
                  <span className="text-sm leading-relaxed" style={{ opacity: 0.8 }}>
                    {store.address}
                  </span>
                </div>
              )}
              {(store.phone || whatsappNumber) && (
                <div className="flex items-center gap-3">
                  <Phone size={16} style={{ opacity: 0.6 }} />
                  <span className="text-sm" style={{ opacity: 0.8 }}>
                    {store.phone || whatsappNumber}
                  </span>
                </div>
              )}
              {store.email && (
                <div className="flex items-center gap-3">
                  <Mail size={16} style={{ opacity: 0.6 }} />
                  <span className="text-sm" style={{ opacity: 0.8 }}>{store.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Horário de Funcionamento */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Horário</h4>
            <div className="flex items-start gap-3">
              <Clock size={16} className="mt-0.5" style={{ opacity: 0.6 }} />
              <span className="text-sm font-medium" style={{ opacity: 0.8 }}>
                Seg - Sex: 9h às 18h
                <br />
                Sáb: 9h às 13h
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div 
        className="container mx-auto px-4 py-6"
        style={{ 
          ...footerStyles,
          opacity: 0.9,
          borderTop: isLightStyle ? '1px solid #E2E8F0' : 'none' 
        }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-center md:text-left" style={{ opacity: 0.8 }}>
            {storeSettings?.footer_copyright_text ||
              `© ${currentYear} ${store.name}. Todos os direitos reservados.`}
          </p>

          {storeSettings?.footer_custom_text && (
            <p className="text-sm text-center" style={{ opacity: 0.8 }}>
              {storeSettings.footer_custom_text}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
};

export default CustomizableFooter;

