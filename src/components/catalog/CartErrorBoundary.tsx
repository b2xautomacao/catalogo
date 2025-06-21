
import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class CartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 CartErrorBoundary: Erro capturado no carrinho:', error, errorInfo);
    
    // Limpar dados corrompidos do localStorage
    try {
      localStorage.removeItem('cart-items');
      console.log('🧹 CartErrorBoundary: localStorage do carrinho limpo');
    } catch (e) {
      console.error('❌ Erro ao limpar localStorage:', e);
    }
  }

  handleReset = () => {
    // Limpar localStorage e resetar estado
    try {
      localStorage.removeItem('cart-items');
      this.setState({ hasError: false, error: undefined });
      // Recarregar a página para garantir estado limpo
      window.location.reload();
    } catch (error) {
      console.error('❌ Erro ao resetar carrinho:', error);
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="fixed bottom-20 right-6 z-50">
          <Alert className="w-80 bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-3">
                <p className="font-medium">Erro no carrinho de compras</p>
                <p className="text-sm">
                  Houve um problema com os dados do seu carrinho. 
                  Clique em "Resetar" para continuar suas compras.
                </p>
                <Button
                  onClick={this.handleReset}
                  size="sm"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resetar Carrinho
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CartErrorBoundary;
