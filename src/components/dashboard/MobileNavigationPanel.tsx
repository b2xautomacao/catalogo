
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Package, ShoppingCart, Settings, BarChart3, 
  Users, Tag, Truck, CreditCard
} from 'lucide-react';

interface NavigationItem {
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  color: string;
  bgColor: string;
}

const MobileNavigationPanel = () => {
  const navigate = useNavigate();

  const navigationItems: NavigationItem[] = [
    {
      title: 'Produtos',
      description: 'Gerencie catálogo',
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
      description: 'Promoções',
      icon: Tag,
      route: '/coupons',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Relatórios',
      description: 'Análises',
      icon: BarChart3,
      route: '/reports',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      title: 'Envios',
      description: 'Entregas',
      icon: Truck,
      route: '/shipping',
      color: 'text-teal-600',
      bgColor: 'bg-teal-100'
    },
    {
      title: 'Pagamentos',
      description: 'Métodos',
      icon: CreditCard,
      route: '/payments',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100'
    },
    {
      title: 'Configurações',
      description: 'Ajustes',
      icon: Settings,
      route: '/settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
      {navigationItems.map((item) => (
        <Card 
          key={item.route}
          className="cursor-pointer hover:scale-105 transition-all duration-300 group shadow-md hover:shadow-lg"
          onClick={() => navigate(item.route)}
        >
          <CardContent className="flex flex-col items-center justify-center p-3 md:p-6 text-center">
            <div className={`${item.bgColor} p-2 md:p-4 rounded-lg md:rounded-xl mb-2 md:mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <item.icon className={`h-5 w-5 md:h-8 md:w-8 ${item.color}`} />
            </div>
            <h3 className="font-semibold text-xs md:text-sm mb-1 truncate w-full">
              {item.title}
            </h3>
            <p className="text-xs text-muted-foreground hidden md:block truncate">
              {item.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MobileNavigationPanel;
