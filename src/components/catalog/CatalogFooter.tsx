import React, { useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StoreData } from '@/hooks/useStoreData';
import { CatalogSettingsData } from '@/hooks/useCatalogSettings';
import { useTemplateColors } from '@/hooks/useTemplateColors';

interface CatalogFooterProps {
  store: StoreData;
  whatsappNumber?: string;
  storeSettings?: CatalogSettingsData | null;
}

const CatalogFooter: React.FC<CatalogFooterProps> = ({ store, whatsappNumber, storeSettings }) => {
  const currentYear = new Date().getFullYear();
  const { applyColorsToDocument } = useTemplateColors(store.url_slug || store.id);

  useEffect(() => {
    applyColorsToDocument();
  }, [applyColorsToDocument]);

  // Extrair dados de pagamento das configurações
  const getPaymentMethods = () => {
    if (!storeSettings?.payment_methods) return [];
    
    const methods = [];
    if (storeSettings.payment_methods.pix) methods.push('PIX');
    if (storeSettings.payment_methods.credit_card) methods.push('Cartão');
    if (storeSettings.payment_methods.bank_slip) methods.push('Boleto');
    
    return methods;
  };

  // Extrair horário de funcionamento das configurações
  const getBusinessHours = () => {
    if (!storeSettings?.business_hours || typeof storeSettings.business_hours !== 'object') {
      return 'Seg - Sex: 9h às 18h';
    }

    // Se tiver horários configurados, usar o primeiro disponível como exemplo
    const hours = storeSettings.business_hours as any;
    if (hours.monday && !hours.monday.closed) {
      return `Seg - Sex: ${hours.monday.open} às ${hours.monday.close}`;
    }
    
    return 'Seg - Sex: 9h às 18h';
  };

  // Verificar se há redes sociais configuradas
  const hasSocialMedia = () => {
    return !!(storeSettings?.facebook_url || storeSettings?.instagram_url || storeSettings?.twitter_url);
  };

  const paymentMethods = getPaymentMethods();

  return (
    <>
      <style>{`
        .catalog-footer {
          background: var(--template-text, #1E293B);
          color: white;
        }
        
        .footer-logo-gradient {
          background: linear-gradient(135deg, var(--template-primary, #0057FF), var(--template-accent, #8E2DE2));
        }
        
        .footer-link {
          color: rgba(255, 255, 255, 0.7);
          transition: color 0.2s ease;
        }
        
        .footer-link:hover {
          color: var(--template-primary, #0057FF);
        }
        
        .footer-social-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.2s ease;
        }
        
        .footer-social-button:hover {
          background: var(--template-primary, #0057FF);
          border-color: var(--template-primary, #0057FF);
        }
        
        .footer-separator {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .footer-bottom {
          background: rgba(0, 0, 0, 0.2);
        }
        
        .footer-payment-method {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .footer-shipping-option {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
      
      <footer className="catalog-footer text-white">
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
                  <div className="footer-logo-gradient w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold">
                    {store.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <h3 className="text-xl font-bold">{store.name}</h3>
              </div>
              <p className="text-gray-300 mb-4">
                {store.description || 'Oferecemos produtos de qualidade com os melhores preços do mercado.'}
              </p>
              
              {/* Redes Sociais */}
              {hasSocialMedia() && (
                <div className="flex space-x-3">
                  {storeSettings?.facebook_url && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="footer-social-button text-gray-300 hover:text-white"
                      onClick={() => window.open(storeSettings.facebook_url, '_blank')}
                    >
                      <Facebook size={20} />
                    </Button>
                  )}
                  {storeSettings?.instagram_url && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="footer-social-button text-gray-300 hover:text-white"
                      onClick={() => window.open(storeSettings.instagram_url, '_blank')}
                    >
                      <Instagram size={20} />
                    </Button>
                  )}
                  {storeSettings?.twitter_url && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="footer-social-button text-gray-300 hover:text-white"
                      onClick={() => window.open(storeSettings.twitter_url, '_blank')}
                    >
                      <Twitter size={20} />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Links Rápidos */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Links Rápidos</h4>
              <ul className="space-y-2">
                <li><a href="#produtos" className="footer-link transition-colors">Nossos Produtos</a></li>
                <li><a href="#sobre" className="footer-link transition-colors">Sobre Nós</a></li>
                <li><a href="#contato" className="footer-link transition-colors">Contato</a></li>
                <li><a href="#faq" className="footer-link transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Informações de Contato */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Contato</h4>
              <div className="space-y-3">
                {store.address && (
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="text-gray-300">{store.address}</span>
                  </div>
                )}
                {(whatsappNumber || store.phone) && (
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-gray-400" />
                    <span className="text-gray-300">{whatsappNumber || store.phone}</span>
                  </div>
                )}
                {store.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-gray-300">{store.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-gray-300">{getBusinessHours()}</span>
                </div>
              </div>
            </div>

            {/* Políticas e Formas de Pagamento */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Informações</h4>
              <ul className="space-y-2 mb-6">
                <li><a href="#privacidade" className="footer-link transition-colors">Política de Privacidade</a></li>
                <li><a href="#termos" className="footer-link transition-colors">Termos de Uso</a></li>
                <li><a href="#trocas" className="footer-link transition-colors">Trocas e Devoluções</a></li>
                <li><a href="#entrega" className="footer-link transition-colors">Política de Entrega</a></li>
              </ul>

              {/* Formas de Pagamento - apenas se configuradas */}
              {paymentMethods.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-300 mb-2">Formas de Pagamento:</p>
                  <div className="flex flex-wrap gap-1">
                    {paymentMethods.map((method) => (
                      <div key={method} className="footer-payment-method px-2 py-1 rounded text-xs">
                        {method}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="footer-separator" />

        {/* Bottom Footer */}
        <div className="footer-bottom container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © {currentYear} {store.name}. Todos os direitos reservados.
            </p>
            
            {/* Opções de Entrega - se configuradas */}
            {storeSettings?.shipping_options && (
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>Opções de Entrega:</span>
                <div className="flex gap-2">
                  {storeSettings.shipping_options.pickup && (
                    <div className="footer-shipping-option px-2 py-1 rounded text-xs">Retirada</div>
                  )}
                  {storeSettings.shipping_options.delivery && (
                    <div className="footer-shipping-option px-2 py-1 rounded text-xs">Entrega</div>
                  )}
                  {storeSettings.shipping_options.shipping && (
                    <div className="footer-shipping-option px-2 py-1 rounded text-xs">Correios</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Floating Button - Posicionado embaixo */}
        {whatsappNumber && (
          <Button
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg z-40 transition-all duration-300 transform hover:scale-105"
            onClick={() => {
              const message = `Olá! Estou interessado nos produtos da ${store.name}`;
              window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
            }}
          >
            <Phone className="w-6 h-6" />
          </Button>
        )}
      </footer>
    </>
  );
};

export default CatalogFooter;
