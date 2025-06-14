
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Coupons from "./pages/Coupons";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import UserManagement from "./pages/UserManagement";
import Catalog from "./pages/Catalog";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import PaymentPending from "./pages/PaymentPending";
import Categories from "./pages/Categories";
import OrdersImproved from "./pages/OrdersImproved";
import Customers from "./pages/Customers";
import Shipping from "./pages/Shipping";
import Deliveries from "./pages/Deliveries";
import AppLayout from "./components/layout/AppLayout";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/catalog/:storeIdentifier" element={<Catalog />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-failure" element={<PaymentFailure />} />
              <Route path="/payment-pending" element={<PaymentPending />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout title="Dashboard">
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/orders" element={<OrdersImproved />} />
                        <Route path="/coupons" element={<Coupons />} />
                        <Route path="/customers" element={<Customers />} />
                        <Route path="/deliveries" element={<Deliveries />} />
                        <Route path="/shipping" element={<Shipping />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/users" element={<UserManagement />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
