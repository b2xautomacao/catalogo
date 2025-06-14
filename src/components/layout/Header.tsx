
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useAuthSession } from '@/hooks/useAuthSession';
import { Badge } from '@/components/ui/badge';
import { LogOut, Settings, User, Crown, Store, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { profile } = useAuth();
  const { signOut } = useAuthSession();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast.error('Erro ao fazer logout');
        return;
      }
      toast.success('Logout realizado com sucesso');
      navigate('/auth');
    } catch (err) {
      toast.error('Erro inesperado');
    }
  };

  const getRoleIcon = () => {
    if (profile?.role === 'superadmin') return <Crown className="h-3 w-3" />;
    if (profile?.role === 'store_admin') return <Store className="h-3 w-3" />;
    return <User className="h-3 w-3" />;
  };

  const getRoleLabel = () => {
    if (profile?.role === 'superadmin') return 'Superadmin';
    if (profile?.role === 'store_admin') return 'Admin da Loja';
    return 'Usuário';
  };

  const getRoleBadgeVariant = () => {
    if (profile?.role === 'superadmin') return 'default';
    return 'secondary';
  };

  const menuItems = [
    { path: '/', icon: User, label: 'Dashboard', roles: ['superadmin', 'store_admin'] },
    { path: '/products', icon: Store, label: 'Produtos', roles: ['store_admin'] },
    { path: '/categories', icon: Settings, label: 'Categorias', roles: ['store_admin'] },
    { path: '/orders', icon: User, label: 'Pedidos', roles: ['store_admin'] },
    { path: '/customers', icon: User, label: 'Clientes', roles: ['store_admin'] },
    { path: '/coupons', icon: User, label: 'Cupons', roles: ['store_admin'] },
    { path: '/deliveries', icon: User, label: 'Gestão de Entregas', roles: ['store_admin'] },
    { path: '/shipping', icon: User, label: 'Envios', roles: ['store_admin'] },
    { path: '/reports', icon: User, label: 'Relatórios', roles: ['superadmin', 'store_admin'] },
    { path: '/stores', icon: Store, label: 'Lojas', roles: ['superadmin'] },
    { path: '/users', icon: User, label: 'Usuários', roles: ['superadmin'] },
    { path: '/settings', icon: Settings, label: 'Configurações', roles: ['superadmin', 'store_admin'] },
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
        
        {profile && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {profile.full_name || 'Usuário'}
              </p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <Badge variant={getRoleBadgeVariant()} className="text-xs">
                  {getRoleIcon()}
                  <span className="ml-1">{getRoleLabel()}</span>
                </Badge>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-white">
                      {profile.full_name 
                        ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                        : profile.email.substring(0, 2).toUpperCase()
                      }
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile.full_name || 'Usuário'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
