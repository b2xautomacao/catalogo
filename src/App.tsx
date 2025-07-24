
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import StoreDashboard from '@/components/dashboard/StoreDashboard';

// Importações de páginas que podem existir
const ProductsPage = React.lazy(() => import('@/pages/ProductsPage').catch(() => ({ default: () => <div>Página de Produtos em desenvolvimento</div> })));
const AuthPage = React.lazy(() => import('@/pages/AuthPage').catch(() => ({ default: () => <div>Página de Auth em desenvolvimento</div> })));

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
          <Routes>
            {/* Rota de autenticação */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Rotas protegidas */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout title="Dashboard">
                    <StoreDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <AppLayout title="Produtos">
                    <ProductsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Rota catch-all */}
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <AppLayout title="Dashboard">
                    <StoreDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </React.Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
