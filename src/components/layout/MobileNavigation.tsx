
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  Home, Package, ShoppingCart, Users, Settings
} from 'lucide-react';

const MobileNavigation = () => {
  const location = useLocation();
  const { profile } = useAuth();

  // Menu simplificado para navegação inferior mobile
  const mobileMenuItems = [
    { path: '/', icon: Home, label: 'Início', roles: ['superadmin', 'store_admin'] },
    { path: '/products', icon: Package, label: 'Produtos', roles: ['store_admin'] },
    { path: '/orders', icon: ShoppingCart, label: 'Pedidos', roles: ['store_admin'] },
    { path: '/customers', icon: Users, label: 'Clientes', roles: ['store_admin'] },
    { path: '/settings', icon: Settings, label: 'Config', roles: ['superadmin', 'store_admin'] },
  ];

  const filteredMenuItems = mobileMenuItems.filter(item => 
    item.roles.includes(profile?.role || 'store_admin')
  );

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      <nav className="flex justify-around py-2">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center px-3 py-2 min-w-0 flex-1 text-center ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileNavigation;
