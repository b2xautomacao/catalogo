
import React from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { useStoreData } from '@/hooks/useStoreData';
import { useAuth } from '@/hooks/useAuth';
import { Facebook, Instagram, Twitter, Phone, Mail, MapPin, Clock } from 'lucide-react';

const PreviewFooter: React.FC = () => {
  const { configuration } = useEditorStore();
  const { profile } = useAuth();
  const { store } = useStoreData(profile?.store_id);
  const footerConfig = configuration.footer || {};

  if (!configuration.sections.footer) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="py-12"
      style={{ 
        backgroundColor: footerConfig.backgroundColor || '#1E293B',
        color: footerConfig.textColor || '#FFFFFF'
      }}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Informações da loja */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {store?.logo_url ? (
                <img 
                  src={store.logo_url} 
                  alt={`Logo ${store.name}`}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ background: `linear-gradient(135deg, ${configuration.colors.primary}, ${configuration.colors.accent})` }}
                >
                  {store?.name?.charAt(0).toUpperCase() || 'L'}
                </div>
              )}
              <h3 className="text-xl font-bold">{store?.name || 'Minha Loja'}</h3>
            </div>
            
            {footerConfig.customText && (
              <p className="opacity-80 mb-4">{footerConfig.customText}</p>
            )}
            
            {!footerConfig.customText && store?.description && (
              <p className="opacity-80 mb-4">{store.description}</p>
            )}

            {/* Redes Sociais */}
            {footerConfig.showSocial !== false && (
              <div className="flex space-x-3">
                <button className="p-2 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors">
                  <Facebook size={20} />
                </button>
                <button className="p-2 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors">
                  <Instagram size={20} />
                </button>
                <button className="p-2 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors">
                  <Twitter size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Links rápidos */}
          {footerConfig.showQuickLinks !== false && (
            <div>
              <h4 className="font-semibold mb-4">Links Rápidos</h4>
              <ul className="space-y-2 opacity-80">
                <li><a href="#" className="hover:opacity-100">Produtos</a></li>
                <li><a href="#" className="hover:opacity-100">Categorias</a></li>
                <li><a href="#" className="hover:opacity-100">Sobre Nós</a></li>
                <li><a href="#" className="hover:opacity-100">Contato</a></li>
              </ul>  
            </div>
          )}

          {/* Atendimento */}
          <div>
            <h4 className="font-semibold mb-4">Atendimento</h4>
            <ul className="space-y-2 opacity-80">
              <li><a href="#" className="hover:opacity-100">FAQ</a></li>
              <li><a href="#" className="hover:opacity-100">Política de Privacidade</a></li>
              <li><a href="#" className="hover:opacity-100">Termos de Uso</a></li>
              <li><a href="#" className="hover:opacity-100">Trocas e Devoluções</a></li>
            </ul>
          </div>

          {/* Contato */}
          {footerConfig.showContact !== false && (
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <div className="space-y-3 opacity-80">
                {store?.address && (
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-3 flex-shrink-0" />
                    <span className="text-sm">{store.address}</span>
                  </div>
                )}
                {store?.phone && (
                  <div className="flex items-center">
                    <Phone size={16} className="mr-3 flex-shrink-0" />
                    <span className="text-sm">{store.phone}</span>
                  </div>
                )}
                {store?.email && (
                  <div className="flex items-center">
                    <Mail size={16} className="mr-3 flex-shrink-0" />
                    <span className="text-sm">{store.email}</span>
                  </div>
                )}
                {footerConfig.showBusinessHours !== false && (
                  <div className="flex items-center">
                    <Clock size={16} className="mr-3 flex-shrink-0" />
                    <span className="text-sm">Seg - Sex: 9h às 18h</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white border-opacity-20 mt-8 pt-8 text-center opacity-60">
          <p className="text-sm">
            {footerConfig.copyrightText || `© ${currentYear} ${store?.name || 'Minha Loja'}. Todos os direitos reservados.`}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PreviewFooter;
