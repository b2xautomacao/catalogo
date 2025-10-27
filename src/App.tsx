import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import Products from "./pages/Products";
import OrdersImproved from "./pages/OrdersImproved";
import Customers from "./pages/Customers";
import Categories from "./pages/Categories";
import Reports from "./pages/Reports";
import PublicCatalogPage from "./pages/PublicCatalogPage";
import PublicWholesalePage from "./pages/PublicWholesalePage";
import ProductPage from "./pages/ProductPage";
import OrderTracking from "./pages/OrderTracking";
import AdminSettings from "./pages/AdminSettings";
import GlobalIntegrations from "./pages/GlobalIntegrations";
import Automations from "./pages/Automations";
import UserManagement from "./pages/UserManagement";
import Analytics from "./pages/Analytics";
import AISettings from "./pages/AISettings";
import Organizations from "./pages/Organizations";
import Stores from "./pages/Stores";
import Billing from "./pages/Billing";
import PlanManagement from "./pages/PlanManagement";
import Revenue from "./pages/Revenue";
import Monitoring from "./pages/Monitoring";
import Logs from "./pages/Logs";
import Alerts from "./pages/Alerts";
import GlobalCustomers from "./pages/GlobalCustomers";
import Security from "./pages/Security";
import AppLayout from "./components/layout/AppLayout";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DomainRouter from "./components/routing/DomainRouter";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-background font-sans antialiased">
                <Routes>
                  {/* Rota de autenticação */}
                  <Route path="/auth" element={<Auth />} />

                  {/* Páginas públicas */}
                  <Route path="/tracking" element={<OrderTracking />} />
                  <Route
                    path="/tracking/:orderId"
                    element={<OrderTracking />}
                  />

                  {/* Rota raiz inteligente - detecta domínio */}
                  <Route
                    path="/"
                    element={<DomainRouter />}
                  />

                  {/* Dashboard principal (quando logado) */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <AppLayout title="Dashboard">
                          <Index />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Páginas administrativas */}
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Configurações"
                          subtitle="Gerencie as configurações da sua loja"
                        >
                          <Settings />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/products"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Produtos"
                          subtitle="Gerencie o catálogo de produtos"
                        >
                          <Products />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Pedidos"
                          subtitle="Acompanhe e gerencie pedidos"
                        >
                          <OrdersImproved />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/customers"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Clientes"
                          subtitle="Gerencie sua base de clientes"
                        >
                          <Customers />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/categories"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Categorias"
                          subtitle="Organize produtos por categoria"
                        >
                          <Categories />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Relatórios"
                          subtitle="Análises e métricas do negócio"
                        >
                          <Reports />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Páginas do catálogo público (sem sidebar) */}
                  <Route
                    path="/catalog/:storeIdentifier"
                    element={<PublicCatalogPage />}
                  />
                  <Route
                    path="/wholesale/:storeIdentifier"
                    element={<PublicWholesalePage />}
                  />
                  
                  {/* Página dedicada do produto */}
                  <Route
                    path="/produto/:productId"
                    element={<ProductPage />}
                  />

                  {/* Rotas de Super Admin */}
                  <Route
                    path="/admin-settings"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Configurações Admin"
                          subtitle="Configurações administrativas do sistema"
                        >
                          <AdminSettings />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/global-integrations"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Integrações Globais"
                          subtitle="Gerencie todas as integrações do sistema"
                        >
                          <GlobalIntegrations />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/automations"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Automações"
                          subtitle="Gerencie workflows e automações"
                        >
                          <Automations />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/user-management"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Gestão de Usuários"
                          subtitle="Administre usuários e permissões"
                        >
                          <UserManagement />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Analytics"
                          subtitle="Métricas e insights do sistema"
                        >
                          <Analytics />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/ai-settings"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Configurações de IA"
                          subtitle="Configure provedores de inteligência artificial"
                        >
                          <AISettings />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Novas rotas do superadmin */}
                  <Route
                    path="/organizations"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Organizações"
                          subtitle="Gerencie todas as organizações do sistema"
                        >
                          <Organizations />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/stores"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Lojas"
                          subtitle="Gerencie todas as lojas cadastradas no sistema"
                        >
                          <Stores />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/billing"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Cobranças"
                          subtitle="Gerencie cobranças e pagamentos do sistema"
                        >
                          <Billing />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/plan-management"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Gerenciamento de Planos"
                          subtitle="Configure e gerencie os planos disponíveis no sistema"
                        >
                          <PlanManagement />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/revenue"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Receitas"
                          subtitle="Acompanhe o desempenho financeiro do sistema"
                        >
                          <Revenue />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/monitoring"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Monitoramento"
                          subtitle="Acompanhe a saúde e performance do sistema"
                        >
                          <Monitoring />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/logs"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Logs do Sistema"
                          subtitle="Visualize e analise os logs de atividade do sistema"
                        >
                          <Logs />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/alerts"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Alertas"
                          subtitle="Gerencie alertas e notificações do sistema"
                        >
                          <Alerts />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/global-customers"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Clientes Globais"
                          subtitle="Gerencie todos os clientes de todas as lojas"
                        >
                          <GlobalCustomers />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/security"
                    element={
                      <ProtectedRoute>
                        <AppLayout
                          title="Segurança"
                          subtitle="Configure e monitore as configurações de segurança do sistema"
                        >
                          <Security />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </div>
              <Toaster />
              <Sonner />
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
