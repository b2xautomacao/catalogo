
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CouponForm from '@/components/coupons/CouponForm';
import CouponsList from '@/components/coupons/CouponsList';
import { useCoupons, Coupon } from '@/hooks/useCoupons';
import { useToast } from '@/hooks/use-toast';

const Coupons = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const { coupons, createCoupon, updateCoupon, deleteCoupon, loading } = useCoupons();
  const { toast } = useToast();

  const handleCreateCoupon = async (data: any) => {
    const { error } = await createCoupon(data);
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o cupom",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Cupom criado com sucesso",
      });
      setShowForm(false);
    }
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
  };

  const handleUpdateCoupon = async (data: any) => {
    if (!editingCoupon) return;
    const { error } = await updateCoupon(editingCoupon.id, data);
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cupom",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Cupom atualizado com sucesso",
      });
      setEditingCoupon(null);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    const { error } = await deleteCoupon(id);
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cupom",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Cupom excluído com sucesso",
      });
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    const { error } = await updateCoupon(id, { is_active: isActive });
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do cupom",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: `Cupom ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      });
    }
  };

  return (
    <div className="space-y-6">
        {/* Action Button */}
        <div className="flex justify-end">
          <Button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="mr-2 h-5 w-5" />
            Novo Cupom
          </Button>
        </div>

        {/* Lista de Cupons */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Cupons Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <CouponsList
              coupons={coupons}
              onEdit={handleEditCoupon}
              onDelete={handleDeleteCoupon}
              onToggleStatus={handleToggleStatus}
            />
          </CardContent>
        </Card>

        {/* Dialog para criar novo cupom */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Cupom de Desconto</DialogTitle>
            </DialogHeader>
            <CouponForm 
              onSubmit={handleCreateCoupon}
            />
          </DialogContent>
        </Dialog>

        {/* Dialog para editar cupom */}
        <Dialog open={!!editingCoupon} onOpenChange={(open) => !open && setEditingCoupon(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Cupom</DialogTitle>
            </DialogHeader>
            {editingCoupon && (
              <CouponForm 
                coupon={editingCoupon}
                onSubmit={handleUpdateCoupon}
              />
            )}
          </DialogContent>
        </Dialog>
    </div>
  );
};

export default Coupons;
