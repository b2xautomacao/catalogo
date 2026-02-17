import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { CatalogStoreIdProvider } from "@/contexts/CatalogStoreIdContext";
import { SaasRouter } from "@/components/routing/SaasRouter";
import { logSubdomainInfo } from "@/utils/subdomainRouter";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        if (error?.message?.includes('JWT')) return false;
        return failureCount < 3;
      },
    },
  },
});

function App() {
  // Log subdomain info for debugging in development
  React.useEffect(() => {
    logSubdomainInfo();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-background font-sans antialiased">
                <SaasRouter />
              </div>
              <Toaster />
              <Sonner />
              </BrowserRouter>
            </CartProvider>
          </CatalogStoreIdProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;