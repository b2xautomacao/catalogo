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
import OrderTracking from "./pages/OrderTracking";
import AdminSettings from "./pages/AdminSettings";
import GlobalIntegrations from "./pages/GlobalIntegrations";
import Automations from "./pages/Automations";
import UserManagement from "./pages/UserManagement";
import Analytics from "./pages/Analytics";
import AISettings from "./pages/AISettings";
import AppLayout from "./components/layout/AppLayout";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/auth/ProtectedRoute";

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

                  {/* Dashboard principal */}
                  <Route
                    path="/"
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
