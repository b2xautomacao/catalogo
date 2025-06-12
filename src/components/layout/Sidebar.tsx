
import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  BarChart3, 
  MessageSquare, 
  Tag,
  Store
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/hooks/useAuth';

interface SidebarProps {
  userRole: UserRole;
  activePage: string;
  onPageChange: (page: string) => void;
}

const Sidebar = ({ userRole, activePage, onPageChange }: SidebarProps) => {
  const superadminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stores', label: 'Lojas', icon: Store },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'catalogs', label: 'Catálogos', icon: ShoppingCart },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { id: 'coupons', label: 'Cupons', icon: Tag },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const menuItems = userRole === 'superadmin' ? superadminMenuItems : adminMenuItems;

  return (
    <div className="w-64 bg-white border-r border-border h-screen flex flex-col">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold text-primary">ShopFlow</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {userRole === 'superadmin' ? 'Superadmin' : 'Admin da Loja'}
        </p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start gap-3 h-12 ${
                isActive 
                  ? 'bg-primary text-primary-foreground hover:bg-primary-600' 
                  : 'hover:bg-muted'
              }`}
              onClick={() => onPageChange(item.id)}
            >
              <Icon size={20} />
              {item.label}
            </Button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-primary-foreground">U</span>
          </div>
          <div>
            <p className="text-sm font-medium">Usuário</p>
            <p className="text-xs text-muted-foreground">usuario@exemplo.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
