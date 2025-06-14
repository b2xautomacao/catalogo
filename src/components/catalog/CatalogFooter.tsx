
import React from 'react';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StoreData } from '@/hooks/useStoreData';
import { CatalogSettingsData } from '@/hooks/useCatalogSettings';

interface CatalogFooterProps {
  store: StoreData;
  whatsappNumber?: string;
  storeSettings?: CatalogSettingsData | null;
}

const CatalogFooter: React.FC<CatalogFooterProps> = ({ store, whatsappNumber, storeSettings }) => {
  const currentYear = new Date().getFullYear();

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
    <footer className="bg-gray-900 text-white">
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
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
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
                    className="text-gray-300 hover:text-white hover:bg-gray-800"
                    onClick={() => window.open(storeSettings.facebook_url, '_blank')}
                  >
                    <Facebook size={20} />
                  </Button>
                )}
                {storeSettings?.instagram_url && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-300 hover:text-white hover:bg-gray-800"
                    onClick={() => window.open(storeSettings.instagram_url, '_blank')}
                  >
                    <Instagram size={20} />
                  </Button>
                )}
                {storeSettings?.twitter_url && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-300 hover:text-white hover:bg-gray-800"
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
              <li><a href="#produtos" className="text-gray-300 hover:text-white transition-colors">Nossos Produtos</a></li>
              <li><a href="#sobre" className="text-gray-300 hover:text-white transition-colors">Sobre Nós</a></li>
              <li><a href="#contato" className="text-gray-300 hover:text-white transition-colors">Contato</a></li>
              <li><a href="#faq" className="text-gray-300 hover:text-white transition-colors">FAQ</a></li>
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
              <li><a href="#privacidade" className="text-gray-300 hover:text-white transition-colors">Política de Privacidade</a></li>
              <li><a href="#termos" className="text-gray-300 hover:text-white transition-colors">Termos de Uso</a></li>
              <li><a href="#trocas" className="text-gray-300 hover:text-white transition-colors">Trocas e Devoluções</a></li>
              <li><a href="#entrega" className="text-gray-300 hover:text-white transition-colors">Política de Entrega</a></li>
            </ul>

            {/* Formas de Pagamento - apenas se configuradas */}
            {paymentMethods.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-300 mb-2">Formas de Pagamento:</p>
                <div className="flex flex-wrap gap-1">
                  {paymentMethods.map((method) => (
                    <div key={method} className="bg-gray-700 px-2 py-1 rounded text-xs">
                      {method}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator className="bg-gray-800" />

      {/* Bottom Footer */}
      <div className="container mx-auto px-4 py-6">
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
                  <div className="bg-gray-800 px-2 py-1 rounded text-xs">Retirada</div>
                )}
                {storeSettings.shipping_options.delivery && (
                  <div className="bg-gray-800 px-2 py-1 rounded text-xs">Entrega</div>
                )}
                {storeSettings.shipping_options.shipping && (
                  <div className="bg-gray-800 px-2 py-1 rounded text-xs">Correios</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Floating Button */}
      {whatsappNumber && (
        <Button
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg z-50"
          onClick={() => {
            const message = `Olá! Estou interessado nos produtos da ${store.name}`;
            window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
          }}
        >
          <Phone className="w-6 h-6" />
        </Button>
      )}
    </footer>
  );
};

export default CatalogFooter;
