
import React from 'react';
import {
  Home,
  Package,
  Grid3X3,
  ShoppingCart,
  Users,
  Settings,
  Percent,
  Truck,
  BarChart,
  Store,
  UserPlus,
  Palette
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const menuItems = [
    { 
      icon: Home, 
      label: 'Dashboard', 
      href: '/', 
      isActive: location.pathname === '/' 
    },
    { 
      icon: Package, 
      label: 'Produtos', 
      href: '/products', 
      isActive: location.pathname === '/products' 
    },
    { 
      icon: Palette, 
      label: 'Grupos de Variações', 
      href: '/variation-groups', 
      isActive: location.pathname === '/variation-groups' 
    },
    { 
      icon: Grid3X3, 
      label: 'Categorias', 
      href: '/categories', 
      isActive: location.pathname === '/categories' 
    },
    { 
      icon: ShoppingCart, 
      label: 'Pedidos', 
      href: '/orders', 
      isActive: location.pathname === '/orders' 
    },
    { 
      icon: Percent, 
      label: 'Cupons', 
      href: '/protected-coupons', 
      isActive: location.pathname === '/protected-coupons' 
    },
    { 
      icon: Truck, 
      label: 'Entregas', 
      href: '/protected-deliveries', 
      isActive: location.pathname === '/protected-deliveries' 
    },
    { 
      icon: Users, 
      label: 'Clientes', 
      href: '/customers', 
      isActive: location.pathname === '/customers' 
    },
    { 
      icon: BarChart, 
      label: 'Relatórios', 
      href: '/protected-reports', 
      isActive: location.pathname === '/protected-reports' 
    },
    { 
      icon: Settings, 
      label: 'Configurações', 
      href: '/settings', 
      isActive: location.pathname === '/settings' 
    }
  ];

  const adminMenuItems = [
    { 
      icon: Store, 
      label: 'Lojas', 
      href: '/stores', 
      isActive: location.pathname === '/stores' 
    },
    { 
      icon: UserPlus, 
      label: 'Usuários', 
      href: '/user-management', 
      isActive: location.pathname === '/user-management' 
    }
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r py-4">
      <div className="px-4 mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full text-left">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  {loading ? (
                    <Skeleton className="h-8 w-8 rounded-full" />
                  ) : (
                    <>
                      <AvatarImage src="" />
                      <AvatarFallback>{profile?.full_name?.charAt(0) || profile?.email?.charAt(0)}</AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {loading ? <Skeleton className="h-4 w-24" /> : profile?.full_name || "Carregando..."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {loading ? <Skeleton className="h-4 w-16" /> : profile?.email || "Carregando..."}
                  </p>
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 pt-1" align="start">
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              Configurações
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.href)}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 hover:bg-gray-200 rounded-md w-full",
              item.isActive ? "bg-gray-200 font-medium" : "text-gray-600"
            )}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {profile?.role === 'superadmin' && (
        <>
          <hr className="my-4 border-gray-200" />
          <div className="space-y-1">
            {adminMenuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.href)}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 hover:bg-gray-200 rounded-md w-full",
                  item.isActive ? "bg-gray-200 font-medium" : "text-gray-600"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;
