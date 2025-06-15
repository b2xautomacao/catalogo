import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Menu } from 'lucide-react';
import ProfileDropdown from '@/components/billing/ProfileDropdown';
import { PlanStatusBadge } from '@/components/billing/PlanStatusBadge';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { profile } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: 'User', label: 'Dashboard', roles: ['superadmin', 'store_admin'] },
    { path: '/products', icon: 'Store', label: 'Produtos', roles: ['store_admin'] },
    { path: '/categories', icon: 'Settings', label: 'Categorias', roles: ['store_admin'] },
    { path: '/orders', icon: 'User', label: 'Pedidos', roles: ['store_admin'] },
    { path: '/customers', icon: 'User', label: 'Clientes', roles: ['store_admin'] },
    { path: '/coupons', icon: 'User', label: 'Cupons', roles: ['store_admin'] },
    { path: '/deliveries', icon: 'User', label: 'Gestão de Entregas', roles: ['store_admin'] },
    { path: '/shipping', icon: 'User', label: 'Envios', roles: ['store_admin'] },
    { path: '/billing', icon: 'CreditCard', label: 'Faturamento', roles: ['store_admin'] },
    { path: '/reports', icon: 'User', label: 'Relatórios', roles: ['superadmin', 'store_admin'] },
    { path: '/stores', icon: 'Store', label: 'Lojas', roles: ['superadmin'] },
    { path: '/users', icon: 'User', label: 'Usuários', roles: ['superadmin'] },
    { path: '/settings', icon: 'Settings', label: 'Configurações', roles: ['superadmin', 'store_admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(profile?.role || 'store_admin')
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 lg:px-6 py-3 h-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Menu mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Menu de Navegação</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <nav className="space-y-2">
                  {filteredMenuItems.map((item) => {
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
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          {/* Título */}
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1 hidden sm:block">{subtitle}</p>
            )}
          </div>
        </div>
        
        {profile && <ProfileDropdown />}
        {profile && <PlanStatusBadge />}
      </div>
    </header>
  );
};

export default Header;
