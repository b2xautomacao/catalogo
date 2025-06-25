
import React, { useState } from 'react';
import { Plus, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  DndContext, 
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { useBanners, Banner } from '@/hooks/useBanners';
import { useBannerSorting } from '@/hooks/useBannerSorting';
import { useToast } from '@/hooks/use-toast';
import SortableBannerItem from './banner/SortableBannerItem';
import BannerForm from './banner/BannerForm';

const BannerManager: React.FC = () => {
  const { banners, loading, createBanner, updateBanner, deleteBanner, refetch } = useBanners();
  const { toast } = useToast();
  
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [localBanners, setLocalBanners] = useState<Banner[]>([]);

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { isDragging, isSaving, handleDragStart, handleDragEnd } = useBannerSorting();

  // Sincronizar banners locais quando os dados chegam
  React.useEffect(() => {
    setLocalBanners(banners);
  }, [banners]);

  const resetForm = () => {
    setEditingBanner(null);
    setShowForm(false);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setShowForm(true);
  };

  const handleFormSubmit = async (bannerData: any) => {
    try {
      if (editingBanner) {
        const { error } = await updateBanner(editingBanner.id, bannerData);
        if (error) throw error;
        toast({ title: 'Banner atualizado com sucesso!' });
      } else {
        const { error } = await createBanner({
          ...bannerData,
          store_id: '',
        } as any);
        if (error) throw error;
        toast({ title: 'Banner criado com sucesso!' });
      }
      resetForm();
    } catch (error) {
      toast({
        title: 'Erro ao salvar banner',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este banner?')) return;

    try {
      const { error } = await deleteBanner(id);
      if (error) throw error;
      toast({ title: 'Banner excluído com sucesso!' });
    } catch (error) {
      toast({
        title: 'Erro ao excluir banner',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    }
  };

  const handleDragEndLocal = (event: any) => {
    handleDragEnd(event, localBanners, setLocalBanners, refetch);
  };

  const getBannerTypeLabel = (type: string) => {
    const types = {
      hero: 'Principal',
      category: 'Categoria',
      sidebar: 'Lateral',
      promotional: 'Promocional'
    };
    return types[type as keyof typeof types] || type;
  };

  const getBannerTypeColor = (type: string) => {
    const colors = {
      hero: 'bg-blue-100 text-blue-800',
      category: 'bg-green-100 text-green-800',
      sidebar: 'bg-orange-100 text-orange-800',
      promotional: 'bg-red-100 text-red-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Gerenciar Banners
            {isSaving && (
              <span className="text-sm text-blue-600 font-normal">
                (Salvando...)
              </span>
            )}
          </CardTitle>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingBanner ? 'Editar Banner' : 'Novo Banner'}
                </DialogTitle>
              </DialogHeader>
              <BannerForm
                editingBanner={editingBanner}
                onSubmit={handleFormSubmit}
                onCancel={resetForm}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {localBanners.length === 0 ? (
          <div className="text-center py-8">
            <Image className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Nenhum banner criado ainda.</p>
            <p className="text-sm text-gray-400">Crie seu primeiro banner para personalizar o catálogo.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEndLocal}
          >
            <SortableContext
              items={localBanners.map(banner => banner.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {localBanners.map((banner) => (
                  <SortableBannerItem
                    key={banner.id}
                    banner={banner}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    getBannerTypeLabel={getBannerTypeLabel}
                    getBannerTypeColor={getBannerTypeColor}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
};

export default BannerManager;
