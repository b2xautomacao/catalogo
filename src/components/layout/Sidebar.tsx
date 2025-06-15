
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const Sidebar = () => {
  const location = useLocation();
  const { isSuperadmin } = useAuth();

  const storeAdminNavigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Produtos', href: '/products', icon: Package },
    { name: 'Pedidos', href: '/orders', icon: ShoppingCart },
    { name: 'Cupons', href: '/coupons', icon: Tag },
    { name: 'Entrega', href: '/deliveries', icon: Truck },
    { name: 'Relatórios', href: '/reports', icon: BarChart3 },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ];

  const superadminNavigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Lojas', href: '/stores', icon: Store },
    { name: 'Usuários', href: '/users', icon: Users },
    { name: 'Gestão de Planos', href: '/plan-management', icon: Crown },
    { name: 'Faturamento', href: '/billing', icon: CreditCard },
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
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
