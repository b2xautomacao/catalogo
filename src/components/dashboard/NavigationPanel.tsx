
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Package, ShoppingCart, Settings, BarChart3, 
  Users, Tag, Truck, FileText, Bell, Zap,
  Palette, Globe, MessageSquare, CreditCard
} from 'lucide-react';

interface NavigationItem {
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  color: string;
  bgColor: string;
}

const NavigationPanel = () => {
  const navigate = useNavigate();

  const navigationItems: NavigationItem[] = [
    {
      title: 'Produtos',
      description: 'Gerencie seu catálogo',
      icon: Package,
      route: '/products',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Pedidos',
      description: 'Acompanhe vendas',
      icon: ShoppingCart,
      route: '/orders',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Clientes',
      description: 'Base de clientes',
      icon: Users,
      route: '/customers',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Cupons',
      description: 'Descontos e promoções',
      icon: Tag,
      route: '/coupons',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Relatórios',
      description: 'Análises e métricas',
      icon: BarChart3,
      route: '/reports',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      title: 'Envios',
      description: 'Gestão de entregas',
      icon: Truck,
      route: '/shipping',
      color: 'text-teal-600',
      bgColor: 'bg-teal-100'
    },
    {
      title: 'Catálogos',
      description: 'Templates e design',
      icon: Palette,
      route: '/catalogs',
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    },
    {
      title: 'WhatsApp',
      description: 'Automação e chat',
      icon: MessageSquare,
      route: '/whatsapp',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      title: 'Pagamentos',
      description: 'Métodos e taxas',
      icon: CreditCard,
      route: '/payments',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100'
    },
    {
      title: 'Integrações',
      description: 'APIs e automações',
      icon: Zap,
      route: '/integrations',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Notificações',
      description: 'Alertas e avisos',
      icon: Bell,
      route: '/notifications',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Configurações',
      description: 'Ajustes da loja',
      icon: Settings,
      route: '/settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {navigationItems.map((item) => (
        <Card 
          key={item.route}
          className="card-modern cursor-pointer hover:scale-105 transition-all duration-300 group"
          onClick={() => navigate(item.route)}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className={`${item.bgColor} p-4 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <item.icon className={`h-8 w-8 ${item.color}`} />
            </div>
            <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default NavigationPanel;
