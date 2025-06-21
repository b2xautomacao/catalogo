
import React from 'react';
import { Facebook, Instagram, Twitter, Phone, Mail, MapPin } from 'lucide-react';

const PreviewFooter: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Informações da loja */}
          <div>
            <h3 className="text-lg font-bold mb-4">Minha Loja</h3>
            <p className="text-gray-400 mb-4">
              Sua loja online com os melhores produtos e atendimento especializado.
            </p>
            <div className="flex space-x-4">
              <Facebook size={20} className="hover:text-blue-400 cursor-pointer" />
              <Instagram size={20} className="hover:text-pink-400 cursor-pointer" />
              <Twitter size={20} className="hover:text-blue-300 cursor-pointer" />
            </div>
          </div>

          {/* Links rápidos */}
          <div>
            <h4 className="font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Produtos</a></li>
              <li><a href="#" className="hover:text-white">Categorias</a></li>
              <li><a href="#" className="hover:text-white">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-white">Contato</a></li>
            </ul>
          </div>

          {/* Atendimento */}
          <div>
            <h4 className="font-semibold mb-4">Atendimento</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">FAQ</a></li>
              <li><a href="#" className="hover:text-white">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-white">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-white">Trocas e Devoluções</a></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <div className="space-y-3 text-gray-400">
              <div className="flex items-center">
                <Phone size={16} className="mr-3" />
                <span>(11) 9999-9999</span>
              </div>
              <div className="flex items-center">
                <Mail size={16} className="mr-3" />
                <span>contato@minhaloja.com</span>
              </div>
              <div className="flex items-center">
                <MapPin size={16} className="mr-3" />
                <span>São Paulo, SP</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Minha Loja. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default PreviewFooter;
