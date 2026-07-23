
import React from 'react';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter, Shield, Truck, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IndustrialFooterProps {
  storeName: string;
  storePhone?: string;
  storeEmail?: string;
  storeAddress?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

const IndustrialFooter: React.FC<IndustrialFooterProps> = ({
  storeName,
  storePhone,
  storeEmail,
  storeAddress,
  socialLinks
}) => {
  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      {/* Barra superior com diferenciais */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 py-6 border-b border-slate-700">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-lg">QUALIDADE GARANTIDA</h4>
                <p className="text-slate-300 text-sm">Produtos industriais certificados</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Truck size={24} className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-lg">ENTREGA RÁPIDA</h4>
                <p className="text-slate-300 text-sm">Logística especializada</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                <Award size={24} className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-lg">EXPERIÊNCIA</h4>
                <p className="text-slate-300 text-sm">Anos no mercado industrial</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal do footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Informações da empresa */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-red-400">
              {storeName}
            </h3>
            <p className="text-slate-300 mb-6 leading-relaxed">
              Soluções industriais de qualidade para sua empresa. 
              Móveis de aço, equipamentos e acessórios industriais.
            </p>
            
            {/* Redes sociais */}
            <div className="flex gap-4">
              {socialLinks?.facebook && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-10 h-10 p-0 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700 clip-path-button"
                  onClick={() => window.open(socialLinks.facebook, '_blank')}
                >
                  <Facebook size={16} />
                </Button>
              )}
              {socialLinks?.instagram && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-10 h-10 p-0 bg-slate-800 hover:bg-pink-600 text-slate-300 hover:text-white border border-slate-700 clip-path-button"
                  onClick={() => window.open(socialLinks.instagram, '_blank')}
                >
                  <Instagram size={16} />
                </Button>
              )}
              {socialLinks?.twitter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-10 h-10 p-0 bg-slate-800 hover:bg-blue-400 text-slate-300 hover:text-white border border-slate-700 clip-path-button"
                  onClick={() => window.open(socialLinks.twitter, '_blank')}
                >
                  <Twitter size={16} />
                </Button>
              )}
            </div>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">CONTATO</h4>
            <div className="space-y-4">
              {storePhone && (
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-red-400" />
                  <span className="text-slate-300">{storePhone}</span>
                </div>
              )}
              {storeEmail && (
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-red-400" />
                  <span className="text-slate-300">{storeEmail}</span>
                </div>
              )}
              {storeAddress && (
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-red-400 mt-1" />
                  <span className="text-slate-300">{storeAddress}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-red-400" />
                <span className="text-slate-300">Seg-Sex: 8h às 18h</span>
              </div>
            </div>
          </div>

          {/* Categorias */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">CATEGORIAS</h4>
            <ul className="space-y-3">
              <li>
                <Button variant="ghost" className="p-0 h-auto text-slate-300 hover:text-red-400 font-medium">
                  Móveis de Aço
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="p-0 h-auto text-slate-300 hover:text-red-400 font-medium">
                  Equipamentos Industriais
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="p-0 h-auto text-slate-300 hover:text-red-400 font-medium">
                  Acessórios
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="p-0 h-auto text-slate-300 hover:text-red-400 font-medium">
                  Soluções Customizadas
                </Button>
              </li>
            </ul>
          </div>

          {/* Informações */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">INFORMAÇÕES</h4>
            <ul className="space-y-3">
              <li>
                <Button variant="ghost" className="p-0 h-auto text-slate-300 hover:text-red-400 font-medium">
                  Sobre Nós
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="p-0 h-auto text-slate-300 hover:text-red-400 font-medium">
                  Política de Privacidade
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="p-0 h-auto text-slate-300 hover:text-red-400 font-medium">
                  Termos de Uso
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="p-0 h-auto text-slate-300 hover:text-red-400 font-medium">
                  Fale Conosco
                </Button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Rodapé inferior */}
      <div className="bg-gradient-to-r from-slate-950 to-slate-900 border-t border-slate-800 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm mb-4 md:mb-0">
               2024 {storeName}. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <span>Desenvolvido com tecnologia avançada</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Sistema Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra decorativa */}
      <div className="h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600"></div>
    </footer>
  );
};

export default IndustrialFooter;
