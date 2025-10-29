import React, { useState } from 'react';
import { useBanners } from '@/hooks/useBanners';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Folder, 
  Tag, 
  Heart, 
  ShoppingCart, 
  Star, 
  TrendingUp,
  ChevronRight,
  ExternalLink,
  Phone,
  MapPin,
  Clock,
  Award,
  Shield
} from 'lucide-react';

interface ProfessionalSidebarProps {
  storeId: string;
  store?: any;
  className?: string;
  onCategorySelect?: (categoryId: string | null) => void;
  selectedCategory?: string | null;
  whatsappNumber?: string;
}

const ProfessionalSidebar: React.FC<ProfessionalSidebarProps> = ({ 
  storeId, 
  store,
  className = '',
  onCategorySelect,
  selectedCategory,
  whatsappNumber
}) => {
  const { banners, loading: bannersLoading } = useBanners(storeId, 'sidebar');
  const { categories, loading: categoriesLoading } = useCategories();
  const [expandedSections, setExpandedSections] = useState<string[]>(['categories', 'contact']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleCategoryClick = (categoryId: string | null) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
  };

  // Trust badges data
  const trustBadges = [
    { icon: <Shield className="h-4 w-4" />, text: "Compra Segura", color: "bg-green-100 text-green-700" },
    { icon: <Award className="h-4 w-4" />, text: "Qualidade Garantida", color: "bg-blue-100 text-blue-700" },
    { icon: <Clock className="h-4 w-4" />, text: "Entrega Rápida", color: "bg-purple-100 text-purple-700" },
  ];

  return (
    <aside className={`space-y-4 ${className}`}>
      {/* Navegação por Categorias */}
      {!categoriesLoading && categories && categories.length > 0 && (
        <Card>
          <CardHeader 
            className="pb-3 cursor-pointer" 
            onClick={() => toggleSection('categories')}
          >
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Categorias
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform ${
                expandedSections.includes('categories') ? 'rotate-90' : ''
              }`} />
            </CardTitle>
          </CardHeader>
          
          {expandedSections.includes('categories') && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                {/* Todas as categorias */}
                <button
                  onClick={() => handleCategoryClick(null)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-gray-100 flex items-center justify-between ${
                    selectedCategory === null ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <span>Todos os produtos</span>
                  <Tag className="h-3 w-3" />
                </button>
                
                {/* Lista de categorias */}
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-gray-100 flex items-center justify-between ${
                      selectedCategory === category.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <span>{category.name}</span>
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                  </button>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Banners Promocionais */}
      {!bannersLoading && banners && banners.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Promoções
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {banners.slice(0, 3).map((banner) => (
                <div key={banner.id} className="sidebar-banner">
                  {banner.link_url ? (
                    <a 
                      href={banner.link_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      <div className="relative overflow-hidden rounded-lg">
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      {banner.title && (
                        <h4 className="text-sm font-medium text-gray-800 mt-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {banner.title}
                        </h4>
                      )}
                    </a>
                  ) : (
                    <>
                      <div className="relative overflow-hidden rounded-lg">
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="w-full h-24 object-cover"
                          loading="lazy"
                        />
                      </div>
                      {banner.title && (
                        <h4 className="text-sm font-medium text-gray-800 mt-2 line-clamp-2">
                          {banner.title}
                        </h4>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trust Badges */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Garantias
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {trustBadges.map((badge, index) => (
              <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${badge.color}`}>
                {badge.icon}
                <span className="text-sm font-medium">{badge.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Informações de Contato */}
      {store && (
        <Card>
          <CardHeader 
            className="pb-3 cursor-pointer" 
            onClick={() => toggleSection('contact')}
          >
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contato
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform ${
                expandedSections.includes('contact') ? 'rotate-90' : ''
              }`} />
            </CardTitle>
          </CardHeader>
          
          {expandedSections.includes('contact') && (
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Nome da loja */}
                <div>
                  <h4 className="font-semibold text-gray-800">{store.name}</h4>
                  {store.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                      {store.description}
                    </p>
                  )}
                </div>
                
                {/* Endereço */}
                {store.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{store.address}</span>
                  </div>
                )}
                
                {/* WhatsApp */}
                {whatsappNumber && (
                  <Button
                    onClick={() => window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`, '_blank')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                )}
                
                {/* Horário de funcionamento */}
                {store.business_hours && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{store.business_hours}</span>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => {
                // Scroll to top or trigger search for favorites
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <Heart className="h-4 w-4 mr-2" />
              Favoritos
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => {
                // Trigger cart view
                console.log('Show cart');
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Meu Carrinho
            </Button>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
};

export default ProfessionalSidebar;
