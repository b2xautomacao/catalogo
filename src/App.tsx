
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
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Categories from "./pages/Categories";
import Reports from "./pages/Reports";
import PublicCatalogPage from "./pages/PublicCatalogPage";
import PublicWholesalePage from "./pages/PublicWholesalePage";
import AppLayout from "./components/layout/AppLayout";

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
                  {/* Dashboard principal */}
                  <Route 
                    path="/" 
                    element={
                      <AppLayout title="Dashboard">
                        <Index />
                      </AppLayout>
                    } 
                  />
                  
                  {/* Páginas administrativas */}
                  <Route 
                    path="/settings" 
                    element={
                      <AppLayout title="Configurações" subtitle="Gerencie as configurações da sua loja">
                        <Settings />
                      </AppLayout>
                    } 
                  />
                  
                  <Route 
                    path="/products" 
                    element={
                      <AppLayout title="Produtos" subtitle="Gerencie o catálogo de produtos">
                        <Products />
                      </AppLayout>
                    } 
                  />
                  
                  <Route 
                    path="/orders" 
                    element={
                      <AppLayout title="Pedidos" subtitle="Acompanhe e gerencie pedidos">
                        <Orders />
                      </AppLayout>
                    } 
                  />
                  
                  <Route 
                    path="/customers" 
                    element={
                      <AppLayout title="Clientes" subtitle="Gerencie sua base de clientes">
                        <Customers />
                      </AppLayout>
                    } 
                  />
                  
                  <Route 
                    path="/categories" 
                    element={
                      <AppLayout title="Categorias" subtitle="Organize produtos por categoria">
                        <Categories />
                      </AppLayout>
                    } 
                  />
                  
                  <Route 
                    path="/reports" 
                    element={
                      <AppLayout title="Relatórios" subtitle="Análises e métricas do negócio">
                        <Reports />
                      </AppLayout>
                    } 
                  />

                  {/* Páginas do catálogo público (sem sidebar) */}
                  <Route path="/catalog/:storeIdentifier" element={<PublicCatalogPage />} />
                  <Route path="/wholesale/:storeIdentifier" element={<PublicWholesalePage />} />
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
