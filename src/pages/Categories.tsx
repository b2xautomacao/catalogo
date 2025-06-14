import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Package, Trash2, Search } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import CategoryFormDialog from '@/components/products/CategoryFormDialog';

const Categories = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { categories, loading, deleteCategory, fetchCategories } = useCategories();
  const { products } = useProducts(profile?.store_id || '');
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Filtrar categorias baseado na busca
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Contar produtos por categoria
  const getProductCount = (categoryName: string) => {
    return products.filter(product => product.category === categoryName).length;
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    const productCount = getProductCount(categoryName);
    
    if (productCount > 0) {
      toast({
        title: "Não é possível excluir",
        description: `A categoria "${categoryName}" possui ${productCount} produto(s) associado(s). Remova ou altere a categoria dos produtos primeiro.`,
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"?`)) {
      const { error } = await deleteCategory(categoryId);
      
      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir categoria",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Categoria excluída com sucesso",
        });
      }
    }
  };

  const handleCategoryCreated = async () => {
    await fetchCategories();
    setShowCreateForm(false);
    toast({
      title: "Sucesso",
      description: "Categoria criada com sucesso",
    });
  };

  const breadcrumbs = [
    { href: '/', label: 'Dashboard' },
    { label: 'Categorias', current: true },
  ];

  return (
    <AppLayout
      title="Categorias"
      subtitle="Organize seus produtos em categorias"
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold gradient-text">Gestão de Categorias</h1>
              <p className="text-muted-foreground mt-2 text-sm md:text-base">
                Organize seus produtos em categorias para facilitar a navegação
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreateForm(true)} className="btn-primary">
            <Plus className="mr-2 h-5 w-5" />
            Nova Categoria
          </Button>
        </div>

        {/* Barra de Busca */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{categories.length}</p>
                  <p className="text-sm text-muted-foreground">Total de Categorias</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {categories.filter(cat => getProductCount(cat.name) > 0).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Com Produtos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {products.filter(product => !product.category).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Produtos Sem Categoria</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Categorias */}
        <Card>
          <CardHeader>
            <CardTitle>
              Categorias
              {searchTerm && (
                <Badge variant="secondary" className="ml-2">
                  {filteredCategories.length} de {categories.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="loading-spinner"></div>
                <span className="ml-2">Carregando categorias...</span>
              </div>
            ) : filteredCategories.length > 0 ? (
              <div className="space-y-4">
                {filteredCategories.map((category) => {
                  const productCount = getProductCount(category.name);
                  return (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{category.name}</h3>
                            <Badge variant={productCount > 0 ? "default" : "secondary"}>
                              {productCount} produto(s)
                            </Badge>
                          </div>
                          {category.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {category.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Criada em {new Date(category.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/products?category=${category.name}`)}
                        >
                          Ver Produtos
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          disabled={productCount > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="mb-2">
                  {searchTerm 
                    ? 'Nenhuma categoria encontrada com os termos de busca'
                    : 'Nenhuma categoria cadastrada ainda'
                  }
                </p>
                {searchTerm ? (
                  <Button onClick={() => setSearchTerm('')} variant="outline">
                    Limpar Busca
                  </Button>
                ) : (
                  <Button onClick={() => setShowCreateForm(true)} variant="outline">
                    Criar Primeira Categoria
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal para criar categoria */}
      <CategoryFormDialog 
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onCategoryCreated={handleCategoryCreated}
      />
    </AppLayout>
  );
};

export default Categories;
