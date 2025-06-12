
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, Users, DollarSign, Plus, Settings, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProducts, CreateProductData } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import ProductFormModal from '@/components/products/ProductFormModal';
import DashboardCard from './DashboardCard';
import NavigationPanel from './NavigationPanel';

const StoreDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { products, loading, createProduct } = useProducts(profile?.store_id || '');
  const [showProductForm, setShowProductForm] = useState(false);
  const { toast } = useToast();

  const handleCreateProduct = async (productData: CreateProductData) => {
    if (!profile?.store_id) {
      toast({
        title: "Erro",
        description: "Loja não identificada",
        variant: "destructive",
      });
      return;
    }

    const dataWithStore: CreateProductData = {
      ...productData,
      store_id: profile.store_id
    };

    const { error } = await createProduct(dataWithStore);
    
    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar produto",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Produto criado com sucesso",
      });
    }
  };

  const totalProducts = products.length;
  const activeProducts = products.filter(product => product.is_active).length;
  const lowStockProducts = products.filter(product => product.stock <= 5).length;
  const totalValue = products.reduce((sum, product) => sum + (product.retail_price * product.stock), 0);

  return (
    <div className="space-y-8 animate-fadeInUp">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard da Loja</h1>
          <p className="text-gray-600 mt-2">Gerencie seus produtos e vendas</p>
        </div>
        <Button onClick={() => setShowProductForm(true)} className="btn-primary">
          <Plus className="mr-2 h-5 w-5" />
          Novo Produto
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total de Produtos"
          value={totalProducts}
          subtitle={`${activeProducts} ativos`}
          icon={Package}
          variant="primary"
          trend={{ value: 15.3, isPositive: true }}
        />

        <DashboardCard
          title="Valor do Estoque"
          value={`R$ ${totalValue.toFixed(2)}`}
          subtitle="Inventário total"
          icon={DollarSign}
          variant="success"
          trend={{ value: 8.7, isPositive: true }}
        />

        <DashboardCard
          title="Estoque Baixo"
          value={lowStockProducts}
          subtitle="Produtos com ≤ 5 unidades"
          icon={AlertTriangle}
          variant="warning"
          trend={{ value: -12.1, isPositive: false }}
        />

        <DashboardCard
          title="Pedidos Hoje"
          value={0}
          subtitle="Vendas do dia"
          icon={ShoppingCart}
          variant="secondary"
          trend={{ value: 0, isPositive: true }}
        />
      </div>

      {/* Painel de Navegação */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Acesso Rápido</h2>
        <NavigationPanel />
      </div>

      {/* Produtos e Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Produtos Recentes */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Produtos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="loading-spinner"></div>
                <span className="ml-2">Carregando produtos...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {products.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{product.name}</h3>
                          <Badge variant={product.is_active ? "default" : "secondary"} className="text-xs">
                            {product.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                          {product.stock <= 5 && (
                            <Badge variant="destructive" className="text-xs">Estoque Baixo</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {product.category || "Sem categoria"} • {product.stock} unidades
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">R$ {product.retail_price.toFixed(2)}</p>
                      {product.wholesale_price && (
                        <p className="text-xs text-muted-foreground">
                          Atacado: R$ {product.wholesale_price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {products.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="mb-2">Nenhum produto cadastrado ainda</p>
                    <Button onClick={() => setShowProductForm(true)} variant="outline">
                      Cadastrar Primeiro Produto
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Vendas Simulado */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Performance de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Vendas Hoje</span>
                <span className="text-sm text-green-600">+0%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full">
                <div className="h-full w-0 bg-green-500 rounded-full"></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Meta Mensal</span>
                <span className="text-sm text-blue-600">45%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full">
                <div className="h-full w-2/5 bg-blue-500 rounded-full"></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Produtos Ativos</span>
                <span className="text-sm text-purple-600">{((activeProducts / totalProducts) * 100 || 0).toFixed(1)}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${(activeProducts / totalProducts) * 100 || 0}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal para criar novo produto */}
      <ProductFormModal
        open={showProductForm}
        onOpenChange={setShowProductForm}
        onSubmit={handleCreateProduct}
      />
    </div>
  );
};

export default StoreDashboard;
