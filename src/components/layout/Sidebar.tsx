import React from "react";
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
  Palette,
  Shield,
  CreditCard,
  Globe,
  Database,
  FileText,
  Zap,
  Crown,
  Building2,
  TrendingUp,
  Activity,
  DollarSign,
  LayoutGrid,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import SuperAdminSidebar from "./SuperAdminSidebar";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile, loading } = useAuth();

  // Se for superadmin, usar sidebar específica do admin SaaS
  if (profile?.role === "superadmin") {
    return <SuperAdminSidebar />;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Menu items para lojistas (store_admin)
  const menuItems = [
    {
      icon: Home,
      label: "Dashboard",
      href: "/",
      isActive: location.pathname === "/",
    },
    {
      icon: Package,
      label: "Produtos",
      href: "/products",
      isActive: location.pathname === "/products",
    },
    {
      icon: Palette,
      label: "Grupos de Variações",
      href: "/variation-groups",
      isActive: location.pathname === "/variation-groups",
    },
    {
      icon: Grid3X3,
      label: "Categorias",
      href: "/categories",
      isActive: location.pathname === "/categories",
    },
    {
      icon: ShoppingCart,
      label: "Pedidos",
      href: "/orders",
      isActive: location.pathname === "/orders",
    },
    {
      icon: LayoutGrid,
      label: "Grades de Tamanho",
      href: "/store-grades",
      isActive: location.pathname === "/store-grades",
    },
    {
      icon: Palette,
      label: "Cores da Loja",
      href: "/store-colors",
      isActive: location.pathname === "/store-colors",
    },
    {
      icon: Percent,
      label: "Cupons",
      href: "/protected-coupons",
      isActive: location.pathname === "/protected-coupons",
    },
    {
      icon: Truck,
      label: "Entregas",
      href: "/protected-deliveries",
      isActive: location.pathname === "/protected-deliveries",
    },
    {
      icon: Users,
      label: "Clientes",
      href: "/customers",
      isActive: location.pathname === "/customers",
    },
    {
      icon: BarChart,
      label: "Relatórios",
      href: "/protected-reports",
      isActive: location.pathname === "/protected-reports",
    },
    {
      icon: Settings,
      label: "Configurações",
      href: "/settings",
      isActive: location.pathname === "/settings",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white py-4">
      {/* User Profile Section */}
      <div className="px-4 mb-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full text-left hover:bg-gray-50 rounded-lg p-2 transition-colors">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  {loading ? (
                    <Skeleton className="h-10 w-10 rounded-full" />
                  ) : (
                    <>
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-blue-500 text-white">
                        {profile?.full_name?.charAt(0) ||
                          profile?.email?.charAt(0)}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div className="flex flex-col space-y-1 flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none truncate">
                    {loading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      profile?.full_name || "Usuário"
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {loading ? (
                      <Skeleton className="h-3 w-16" />
                    ) : (
                      profile?.email || "email@exemplo.com"
                    )}
                  </p>
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-2">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.href)}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 text-sm rounded-lg w-full text-left transition-colors",
                item.isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
