import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Layers,
  Sparkles,
  Tag,
  DollarSign,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Product } from '@/types/product';
import {
  previewBulkUpdate,
  executeBulkUpdate,
  BulkPreviewResult,
} from '@/lib/bulkCatalogService';
import { useToast } from '@/hooks/use-toast';

interface BulkActionsBarProps {
  selectedProducts: Product[];
  storeId?: string;
  onClearSelection: () => void;
  onSuccess: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedProducts,
  storeId,
  onClearSelection,
  onSuccess,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<string>('');
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  if (selectedProducts.length === 0) return null;

  const handleOpenAction = (action: string, initialUpdates: Record<string, any>) => {
    setModalAction(action);
    setPendingUpdates(initialUpdates);
    setIsModalOpen(true);
  };

  const handleConfirmBulk = async () => {
    if (!storeId) {
      toast({
        title: 'Erro',
        description: 'Loja não identificada.',
        variant: 'destructive',
      });
      return;
    }

    setIsExecuting(true);
    const productIds = selectedProducts.map((p) => p.id);

    try {
      const result = await executeBulkUpdate({
        storeId,
        productIds,
        updates: pendingUpdates,
      });

      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: `${result.updatedCount} produto(s) atualizado(s) em lote com sucesso.`,
        });
        setIsModalOpen(false);
        onClearSelection();
        onSuccess();
      } else {
        toast({
          title: 'Erro na operação em lote',
          description: result.error || 'Não foi possível concluir a operação.',
          variant: 'destructive',
        });
      }
    } catch (e: any) {
      toast({
        title: 'Falha crítica',
        description: e.message || 'Erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const preview: BulkPreviewResult = previewBulkUpdate(selectedProducts, pendingUpdates);

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-600 text-white font-bold text-xs px-2.5 py-1">
            {selectedProducts.length} selecionado{selectedProducts.length > 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="h-6 w-px bg-slate-700 hidden sm:block" />

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenAction('ativar', { is_active: true })}
            className="text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 text-xs font-bold h-8"
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Ativar
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenAction('desativar', { is_active: false })}
            className="text-amber-400 hover:text-amber-300 hover:bg-slate-800 text-xs font-bold h-8"
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Desativar
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenAction('destacar', { is_featured: true })}
            className="text-purple-400 hover:text-purple-300 hover:bg-slate-800 text-xs font-bold h-8"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Destacar
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenAction('categoria', { category: '' })}
            className="text-blue-400 hover:text-blue-300 hover:bg-slate-800 text-xs font-bold h-8"
          >
            <Tag className="w-3.5 h-3.5 mr-1" />
            Categoria
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenAction('preco', { retail_price: 0 })}
            className="text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 text-xs font-bold h-8"
          >
            <DollarSign className="w-3.5 h-3.5 mr-1" />
            Preço
          </Button>
        </div>

        <div className="h-6 w-px bg-slate-700" />

        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
          className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs h-8"
        >
          Limpar
        </Button>
      </div>

      {/* Modal de Confirmação e Edição da Ação em Lote */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Atualizar {selectedProducts.length} produtos em lote
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {modalAction === 'categoria' && (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Nova Categoria</Label>
                <Input
                  placeholder="Ex: Calçados Femininos"
                  value={pendingUpdates.category || ''}
                  onChange={(e) =>
                    setPendingUpdates({ ...pendingUpdates, category: e.target.value })
                  }
                  className="bg-white"
                />
              </div>
            )}

            {modalAction === 'preco' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Novo Preço de Varejo (R$)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={pendingUpdates.retail_price || ''}
                    onChange={(e) =>
                      setPendingUpdates({
                        ...pendingUpdates,
                        retail_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Novo Preço de Atacado (R$) (Opcional)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={pendingUpdates.wholesale_price || ''}
                    onChange={(e) =>
                      setPendingUpdates({
                        ...pendingUpdates,
                        wholesale_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="bg-white"
                  />
                </div>
              </div>
            )}

            {/* Resumo / Preview de Impacto */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Resumo da Alteração
              </div>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>Total de produtos impactados: <strong>{selectedProducts.length}</strong></li>
                {preview.summary.map((s) => (
                  <li key={s.field}>
                    {s.label}: <strong>{String(s.newValue)}</strong>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-slate-400 italic pt-1">
                Esta ação é registrada no log de auditoria com garantia de idempotência.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isExecuting}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmBulk}
              disabled={isExecuting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Aplicando...
                </>
              ) : (
                'Confirmar e Aplicar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BulkActionsBar;
