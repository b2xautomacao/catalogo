
import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  Users,
  Tag,
  Truck,
  Store,
  Crown,
  CreditCard,
  Zap,
  Globe
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedMenuItem } from '@/components/billing/ProtectedMenuItem';

const Sidebar = () => {
  const location = useLocation();
  const { isSuperadmin } = useAuth();

  const storeAdminNavigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Produtos', href: '/products', icon: Package },
    { name: 'Pedidos', href: '/orders', icon: ShoppingCart },
    { 
      name: 'Cupons', 
      href: '/coupons', 
      icon: Tag,
      benefitKey: 'discount_coupons',
      requiresPremium: true
    },
    { 
      name: 'Entrega', 
      href: '/deliveries', 
      icon: Truck,
      benefitKey: 'shipping_calculator',
      requiresPremium: true
    },
    { 
      name: 'Relatórios', 
      href: '/reports', 
      icon: BarChart3,
      benefitKey: 'dedicated_support',
      requiresPremium: true
    },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ];

  const superadminNavigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Lojas', href: '/stores', icon: Store },
    { name: 'Usuários', href: '/users', icon: Users },
    { name: 'Gestão de Planos', href: '/plan-management', icon: Crown },
    { name: 'Financeiro', href: '/billing', icon: CreditCard },
    { name: 'Integrações Globais', href: '/global-integrations', icon: Globe },
    { name: 'Relatórios', href: '/reports', icon: BarChart3 },
  ];

  const navigation = isSuperadmin ? superadminNavigation : storeAdminNavigation;

  return (
    <div className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-40 hidden lg:flex lg:flex-col">
      <div className="flex flex-1 flex-col overflow-y-auto py-4">
        <div className="flex flex-shrink-0 items-center px-4 mb-8">
          <div className="flex items-center gap-2">
            <Zap className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">CatalogoAI</span>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-2">
          {navigation.map((item) => (
            <ProtectedMenuItem
              key={item.name}
              name={item.name}
              href={item.href}
              icon={item.icon}
              benefitKey={item.benefitKey}
              requiresPremium={item.requiresPremium}
            />
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
