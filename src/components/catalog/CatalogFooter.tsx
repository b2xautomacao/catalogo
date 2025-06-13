import React from 'react';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StoreData } from '@/hooks/useStoreData';

interface CatalogFooterProps {
  store: StoreData;
  whatsappNumber?: string;
}

const CatalogFooter: React.FC<CatalogFooterProps> = ({ store, whatsappNumber }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Sobre a Loja */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                {store.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-xl font-bold">{store.name}</h3>
            </div>
            <p className="text-gray-300 mb-4">
              {store.description || 'Oferecemos produtos de qualidade com os melhores preços do mercado.'}
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-gray-800">
                <Facebook size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-gray-800">
                <Instagram size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-gray-800">
                <Twitter size={20} />
              </Button>
            </div>
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
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-gray-400" />
                <span className="text-gray-300">{store.address || 'Rua Exemplo, 123 - São Paulo, SP'}</span>
              </div>
              {whatsappNumber && (
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-gray-400" />
                  <span className="text-gray-300">{whatsappNumber}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-gray-400" />
                <span className="text-gray-300">{store.email || `contato@${store.name.toLowerCase().replace(/\s+/g, '')}.com.br`}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-gray-400" />
                <span className="text-gray-300">Seg - Sex: 9h às 18h</span>
              </div>
            </div>
          </div>

          {/* Políticas e Segurança */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Políticas</h4>
            <ul className="space-y-2 mb-6">
              <li><a href="#privacidade" className="text-gray-300 hover:text-white transition-colors">Política de Privacidade</a></li>
              <li><a href="#termos" className="text-gray-300 hover:text-white transition-colors">Termos de Uso</a></li>
              <li><a href="#trocas" className="text-gray-300 hover:text-white transition-colors">Trocas e Devoluções</a></li>
              <li><a href="#entrega" className="text-gray-300 hover:text-white transition-colors">Política de Entrega</a></li>
            </ul>

            {/* Selo de Segurança */}
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-2xl mb-1">🔒</div>
              <p className="text-xs text-gray-300">Site Seguro</p>
              <p className="text-xs text-gray-400">SSL Certificado</p>
            </div>
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
          
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Formas de Pagamento:</span>
            <div className="flex gap-2">
              <div className="bg-gray-800 px-2 py-1 rounded text-xs">PIX</div>
              <div className="bg-gray-800 px-2 py-1 rounded text-xs">Cartão</div>
              <div className="bg-gray-800 px-2 py-1 rounded text-xs">Boleto</div>
            </div>
          </div>
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
