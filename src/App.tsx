import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  useParams,
} from "react-router-dom";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Products from "./pages/Products";
import VariationGroups from "./pages/VariationGroups";
import Categories from "./pages/Categories";
import OrdersImproved from "./pages/OrdersImproved";
import ProtectedCoupons from "./pages/ProtectedCoupons";
import ProtectedDeliveries from "./pages/ProtectedDeliveries";
import Customers from "./pages/Customers";
import ProtectedReports from "./pages/ProtectedReports";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import Stores from "./pages/Stores";
import UserManagement from "./pages/UserManagement";
import PlanManagement from "./pages/PlanManagement";
import GlobalIntegrations from "./pages/GlobalIntegrations";
import Shipping from "./pages/Shipping";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import PaymentPending from "./pages/PaymentPending";
import NotFound from "./pages/NotFound";
import TestStore from "./pages/TestStore";
import TestGradeWizard from "./pages/TestGradeWizard";
import ResponsiveAppLayout from "./components/layout/ResponsiveAppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicCatalog from "./components/catalog/PublicCatalog";
import { useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient();

// Componente wrapper para o catálogo público que pega o storeSlug da URL
const PublicCatalogWrapper = () => {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  return <PublicCatalog storeIdentifier={storeSlug || ""} />;
};

// Componente para layout com título dinâmico
const DashboardLayout = () => {
  const { profile } = useAuth();
  const title =
    profile?.role === "superadmin"
      ? "Dashboard Administrativo"
      : "Dashboard da Loja";
  const subtitle =
    profile?.role === "superadmin"
      ? "Visão geral de todas as lojas do sistema"
      : "Gerencie seus produtos e vendas";

  return (
    <ResponsiveAppLayout
      title={title}
      subtitle={subtitle}
      breadcrumbs={[{ label: "Dashboard", current: true }]}
    >
      <Outlet />
    </ResponsiveAppLayout>
  );
};

function App() {
  return (
    <TooltipProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Toaster />
          <Sonner />

          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failure" element={<PaymentFailure />} />
            <Route path="/payment/pending" element={<PaymentPending />} />
            <Route path="/test-store" element={<TestStore />} />
            <Route path="/test-grade-wizard" element={<TestGradeWizard />} />
            <Route
              path="/catalog/:storeSlug"
              element={<PublicCatalogWrapper />}
            />

            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Index />} />
            </Route>

            <Route
              element={
                <ProtectedRoute>
                  <ResponsiveAppLayout
                    title="Produtos"
                    subtitle="Gerencie seu catálogo de produtos"
                  >
                    <Outlet />
                  </ResponsiveAppLayout>
                </ProtectedRoute>
              }
            >
              <Route path="/products" element={<Products />} />
              <Route path="/variation-groups" element={<VariationGroups />} />
              <Route path="/categories" element={<Categories />} />
            </Route>

            <Route
              element={
                <ProtectedRoute>
                  <ResponsiveAppLayout
                    title="Vendas"
                    subtitle="Gerencie pedidos e relatórios"
                  >
                    <Outlet />
                  </ResponsiveAppLayout>
                </ProtectedRoute>
              }
            >
              <Route path="/orders" element={<OrdersImproved />} />
              <Route path="/protected-coupons" element={<ProtectedCoupons />} />
              <Route
                path="/protected-deliveries"
                element={<ProtectedDeliveries />}
              />
              <Route path="/customers" element={<Customers />} />
              <Route path="/protected-reports" element={<ProtectedReports />} />
            </Route>

            <Route
              element={
                <ProtectedRoute>
                  <ResponsiveAppLayout
                    title="Configurações"
                    subtitle="Configure sua loja e integrações"
                  >
                    <Outlet />
                  </ResponsiveAppLayout>
                </ProtectedRoute>
              }
            >
              <Route path="/settings" element={<Settings />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/shipping" element={<Shipping />} />
            </Route>

            <Route
              element={
                <ProtectedRoute allowedRoles={["superadmin"]}>
                  <ResponsiveAppLayout
                    title="Administração"
                    subtitle="Gerencie o sistema"
                  >
                    <Outlet />
                  </ResponsiveAppLayout>
                </ProtectedRoute>
              }
            >
              <Route path="/stores" element={<Stores />} />
              <Route path="/user-management" element={<UserManagement />} />
              <Route path="/plan-management" element={<PlanManagement />} />
              <Route
                path="/global-integrations"
                element={<GlobalIntegrations />}
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </TooltipProvider>
  );
}

export default App;
