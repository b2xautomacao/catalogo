import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/components/layout/AppLayout';
import SimpleCategoryDialog from '@/components/products/SimpleCategoryDialog';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';

const Categories = () => {
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { categories, loading, deleteCategory, fetchCategories } = useCategories();
  const { toast } = useToast();

  const breadcrumbs = [
    { href: '/', label: 'Dashboard' },
    { label: 'Categorias', current: true },
  ];

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowCategoryDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      const { error } = await deleteCategory(id);
      if (error) {
        toast({
          title: "Erro ao excluir categoria",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Categoria excluída com sucesso",
        });
      }
    }
  };

  const handleCategorySaved = () => {
    setShowCategoryDialog(false);
    setEditingCategory(null);
    fetchCategories();
  };

  if (loading) {
    return (
      <AppLayout title="Categorias" breadcrumbs={breadcrumbs}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Carregando categorias...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Gerenciar Categorias" 
      subtitle="Organize seus produtos em categorias"
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">
        {/* Header com ações - Responsivo */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-center sm:justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button 
            onClick={() => setShowCategoryDialog(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        </div>

        {/* Grid de categorias - Responsivo */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <p className="text-lg mb-2">
                {searchTerm ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria cadastrada'}
              </p>
              <p className="text-sm">
                {searchTerm ? 'Tente ajustar sua pesquisa' : 'Comece criando sua primeira categoria'}
              </p>
            </div>
            {!searchTerm && (
              <Button 
                onClick={() => setShowCategoryDialog(true)}
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Categoria
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCategories.map((category) => (
              <Card key={category.id} className="relative group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">
                        {category.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={category.is_active ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {category.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {category.description && (
                    <CardDescription className="text-sm line-clamp-2 mb-3">
                      {category.description}
                    </CardDescription>
                  )}
                  
                  {/* Ações - Responsivas */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de categoria com props corretas */}
        <SimpleCategoryDialog
          open={showCategoryDialog}
          onOpenChange={setShowCategoryDialog}
          onCategoryCreated={handleCategorySaved}
        />
      </div>
    </AppLayout>
  );
};

export default Categories;
