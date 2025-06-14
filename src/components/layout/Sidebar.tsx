
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  Tag, 
  BarChart3,
  Store,
  UserCheck,
  Grid3X3,
  Truck,
  MapPin
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Sidebar = () => {
  const location = useLocation();
  const { profile } = useAuth();

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard', roles: ['superadmin', 'store_admin'] },
    { path: '/products', icon: Package, label: 'Produtos', roles: ['store_admin'] },
    { path: '/categories', icon: Grid3X3, label: 'Categorias', roles: ['store_admin'] },
    { path: '/orders', icon: ShoppingCart, label: 'Pedidos', roles: ['store_admin'] },
    { path: '/customers', icon: Users, label: 'Clientes', roles: ['store_admin'] },
    { path: '/coupons', icon: Tag, label: 'Cupons', roles: ['store_admin'] },
    { path: '/deliveries', icon: MapPin, label: 'Gestão de Entregas', roles: ['store_admin'] },
    { path: '/shipping', icon: Truck, label: 'Envios', roles: ['store_admin'] },
    { path: '/reports', icon: BarChart3, label: 'Relatórios', roles: ['superadmin', 'store_admin'] },
    { path: '/stores', icon: Store, label: 'Lojas', roles: ['superadmin'] },
    { path: '/users', icon: UserCheck, label: 'Usuários', roles: ['superadmin'] },
    { path: '/settings', icon: Settings, label: 'Configurações', roles: ['superadmin', 'store_admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(profile?.role || 'store_admin')
  );

  return (
    <div className="fixed left-0 top-16 h-full w-64 bg-white border-r border-gray-200 z-40">
      <div className="p-6">
        <nav className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* User Info */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {profile?.role === 'superadmin' ? 'Super Admin' : 'Admin da Loja'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
