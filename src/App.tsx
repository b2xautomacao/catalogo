
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Products from '@/pages/Products';
import OrdersImproved from '@/pages/OrdersImproved';
import Customers from '@/pages/Customers';
import Coupons from '@/pages/Coupons';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import UserManagement from '@/pages/UserManagement';
import NotFound from '@/pages/NotFound';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header title="Produtos" />
                    <main className="flex-1 overflow-auto">
                      <Products />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header title="Pedidos" />
                    <main className="flex-1 overflow-auto">
                      <OrdersImproved />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/customers" element={
              <ProtectedRoute>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header title="Clientes" />
                    <main className="flex-1 overflow-auto">
                      <Customers />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/coupons" element={
              <ProtectedRoute>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header title="Cupons" />
                    <main className="flex-1 overflow-auto">
                      <Coupons />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header title="Relatórios" />
                    <main className="flex-1 overflow-auto">
                      <Reports />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header title="Usuários" />
                    <main className="flex-1 overflow-auto">
                      <UserManagement />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header title="Configurações" />
                    <main className="flex-1 overflow-auto">
                      <Settings />
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
