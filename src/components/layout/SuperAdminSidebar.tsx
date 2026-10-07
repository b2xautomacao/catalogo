import {
  Activity,
  TrendingUp,
  Brain,
  Crown,
  Zap,
  Settings,
  Bot,
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

const SuperAdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const superAdminMenuItems = [
    {
      section: "Visão Geral",
      items: [
        {
          icon: Activity,
          label: "Dashboard Admin",
          href: "/",
          isActive: location.pathname === "/",
          description: "Painel administrativo principal",
          badge: null,
        },
        {
          icon: TrendingUp,
          label: "Analytics",
          href: "/analytics",
          isActive: location.pathname === "/analytics",
          description: "Métricas e KPIs do sistema",
          badge: null,
        },
      ],
    },
    {
      section: "Inteligência Artificial",
      items: [
        {
          icon: Bot,
          label: "IA",
          href: "/ia",
          isActive: location.pathname.startsWith("/ia"),
          description: "Tenant MCP Hub, Credenciais e Docs",
          badge: "NOVO",
        },
      ],
    },
    {
      section: "Sistema",
      items: [
        {
          icon: Brain,
          label: "Configurações de IA",
          href: "/ai-settings",
          isActive: location.pathname === "/ai-settings",
          description: "OpenAI, Gemini e outras IAs",
          badge: null,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Crown className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">VendeMais SaaS</h2>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full text-left hover:bg-gray-50 rounded-lg p-3 transition-colors">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  {loading ? (
                    <Skeleton className="h-10 w-10 rounded-full" />
                  ) : (
                    <>
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-semibold">
                        {profile?.full_name?.charAt(0) || profile?.email?.charAt(0)}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div className="flex flex-col space-y-1 flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none truncate">
                    {loading ? <Skeleton className="h-4 w-24" /> : profile?.full_name || "Usuário"}
                  </p>
                  <div className="flex items-center gap-2">
                    <Crown className="w-3 h-3 text-purple-600" />
                    <span className="text-xs font-medium text-purple-600">Super Admin</span>
                  </div>
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuItem onClick={handleSignOut}>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-6">
          {superAdminMenuItems.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <div className="px-3 mb-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {section.section}
                </h3>
              </div>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.href)}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-3 text-sm rounded-lg transition-all duration-200 group",
                      item.isActive
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 font-medium border border-blue-100 shadow-sm"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon
                        className={cn(
                          "w-5 h-5 flex-shrink-0 transition-colors",
                          item.isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
                        )}
                      />
                      <div className="text-left">
                        <div className="truncate font-medium">{item.label}</div>
                        <div className="text-xs text-gray-500 truncate">{item.description}</div>
                      </div>
                    </div>
                    {item.badge && (
                      <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium">
                        {item.badge}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Sistema VendeMais</span>
          </div>
          <div className="flex items-center justify-between text-xs text-blue-700">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Sistema Online</span>
            </div>
            <Badge variant="outline" className="border-green-200 text-green-700">
              v2.1.0
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSidebar;
