
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import DashboardCards from '@/components/dashboard/DashboardCards';
import ProductList from '@/components/products/ProductList';
import AIDescriptionGenerator from '@/components/ai/AIDescriptionGenerator';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';

const Index = () => {
  const { profile, signOut } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mock data para produtos
  const mockProducts = [
    {
      id: '1',
      name: 'Camiseta Premium Algodão',
      category: 'Roupas',
      price: 49.90,
      wholesalePrice: 35.00,
      stock: 25,
      status: 'active' as const,
      image: '/placeholder.svg'
    },
    {
      id: '2',
      name: 'Tênis Esportivo Confort',
      category: 'Calçados',
      price: 189.90,
      wholesalePrice: 140.00,
      stock: 12,
      status: 'active' as const,
      image: '/placeholder.svg'
    },
    {
      id: '3',
      name: 'Mochila Executiva',
      category: 'Acessórios',
      price: 89.90,
      stock: 3,
      status: 'inactive' as const,
      image: '/placeholder.svg'
    }
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao fazer logout",
        variant: "destructive",
      });
    }
  };

  const handleProductEdit = (product: any) => {
    toast({
      title: "Editar Produto",
      description: `Abrindo editor para ${product.name}`,
    });
  };

  const handleProductDelete = (id: string) => {
    toast({
      title: "Produto Excluído",
      description: "Produto removido com sucesso",
    });
  };

  const handleGenerateDescription = (id: string) => {
    const product = mockProducts.find(p => p.id === id);
    if (product) {
      setSelectedProduct(product);
      setShowAIDialog(true);
    }
  };

  const handleAddProduct = () => {
    toast({
      title: "Adicionar Produto",
      description: "Abrindo formulário de novo produto",
    });
  };

  const renderPageContent = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <DashboardCards userRole={profile?.role === 'superadmin' ? 'superadmin' : 'admin'} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card-modern">
                <h3 className="text-lg font-semibold mb-4">Vendas Recentes</h3>
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">Pedido #{1000 + item}</p>
                        <p className="text-sm text-muted-foreground">Cliente Exemplo {item}</p>
                      </div>
                      <span className="font-semibold text-primary">R$ {(Math.random() * 200 + 50).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-modern">
                <h3 className="text-lg font-semibold mb-4">Produtos em Baixo Estoque</h3>
                <div className="space-y-3">
                  {mockProducts.filter(p => p.stock <= 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                      </div>
                      <span className="font-semibold text-destructive">{product.stock} unidades</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'products':
        return (
          <div className="space-y-6">
            <ProductList
              products={mockProducts}
              onEdit={handleProductEdit}
              onDelete={handleProductDelete}
              onGenerateDescription={handleGenerateDescription}
            />
          </div>
        );
      
      case 'catalogs':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card-modern">
                <h3 className="text-lg font-semibold mb-4">Catálogo Varejo</h3>
                <p className="text-muted-foreground mb-4">Catálogo público para vendas ao consumidor final</p>
                <div className="space-y-2">
                  <p className="text-sm"><strong>Produtos ativos:</strong> 156</p>
                  <p className="text-sm"><strong>Última atualização:</strong> Hoje, 14:30</p>
                  <p className="text-sm"><strong>Visualizações hoje:</strong> 1.247</p>
                </div>
              </div>
              
              <div className="card-modern">
                <h3 className="text-lg font-semibold mb-4">Catálogo Atacado</h3>
                <p className="text-muted-foreground mb-4">Catálogo para vendas em grande quantidade</p>
                <div className="space-y-2">
                  <p className="text-sm"><strong>Produtos ativos:</strong> 98</p>
                  <p className="text-sm"><strong>Última atualização:</strong> Ontem, 16:45</p>
                  <p className="text-sm"><strong>Pedidos hoje:</strong> 12</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="card-modern text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Página em Desenvolvimento</h3>
            <p className="text-muted-foreground">Esta funcionalidade será implementada em breve.</p>
          </div>
        );
    }
  };

  const getPageTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      products: 'Produtos',
      catalogs: 'Catálogos',
      orders: 'Pedidos',
      coupons: 'Cupons',
      whatsapp: 'WhatsApp',
      reports: 'Relatórios',
      settings: 'Configurações',
      stores: 'Lojas',
      users: 'Usuários'
    };
    return titles[activePage as keyof typeof titles] || 'Dashboard';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex">
        <Sidebar 
          userRole={profile?.role || 'store_admin'} 
          activePage={activePage} 
          onPageChange={setActivePage} 
        />
        
        <div className="flex-1">
          <Header 
            title={getPageTitle()}
            showAddButton={activePage === 'products'}
            onAddClick={handleAddProduct}
            addButtonText="Adicionar Produto"
          />
          
          <main className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">
                  Bem-vindo, {profile?.full_name || profile?.email}
                </h2>
                <p className="text-muted-foreground">
                  {profile?.role === 'superadmin' ? 'Superadministrador' : 'Administrador da Loja'}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut size={16} />
                Sair
              </Button>
            </div>
            
            {renderPageContent()}
          </main>
        </div>

        <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerar Descrição com IA</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <AIDescriptionGenerator
                productName={selectedProduct.name}
                category={selectedProduct.category}
                onDescriptionGenerated={(description, seo) => {
                  console.log('Descrição gerada:', description);
                  console.log('SEO gerado:', seo);
                  setShowAIDialog(false);
                  toast({
                    title: "Sucesso!",
                    description: "Descrição e SEO aplicados ao produto",
                  });
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
};

export default Index;
