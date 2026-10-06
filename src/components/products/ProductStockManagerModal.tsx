import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import {
  Package,
  Save,
  RotateCcw,
  AlertTriangle,
  Plus,
  Minus,
  Scale,
  X,
  Layers,
  Boxes,
} from "lucide-react";
import {
  StockOperation,
  StockReasonCode,
  STOCK_REASON_LABELS,
  calculatePairsPerPack,
  calculateEquivalentUnits,
  generateOperationId,
  applyStockAdjustment,
} from "@/lib/inventoryDomainService";

interface ProductStockManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onStockUpdated?: () => void;
}

interface StockTargetItem {
  id: string | null; // null para produto simples, UUID para variação
  name: string;
  sku: string;
  is_grade: boolean;
  grade_pairs?: any;
  pairsPerPack: number;
  currentStock: number;
  currentPhysical: number;
  color?: string;
  hex_color?: string;

  // Estado da Ação de Ajuste
  operation: StockOperation;
  quantity: number;
  countedQuantity: number;
  reasonCode: StockReasonCode;
  notes: string;
  hasChanges: boolean;
}

const ProductStockManagerModal: React.FC<ProductStockManagerModalProps> = ({
  isOpen,
  onClose,
  product,
  onStockUpdated,
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [targets, setTargets] = useState<StockTargetItem[]>([]);
  const [saving, setSaving] = useState(false);

  // Inicializar alvos de estoque quando o modal abre
  useEffect(() => {
    if (!isOpen || !product) return;

    if (product.variations && product.variations.length > 0) {
      // Produto com variações (Unitárias ou Grades)
      const mappedTargets: StockTargetItem[] = product.variations.map((v) => {
        const isGrade = !!v.is_grade;
        const pairsPerPack = calculatePairsPerPack(isGrade, v.grade_pairs);
        const currentStock = v.stock || 0;
        const currentPhysical = calculateEquivalentUnits(currentStock, isGrade, v.grade_pairs);

        const name = isGrade
          ? `${v.grade_name || "Grade"} ${v.color ? `· ${v.color}` : ""}`
          : [v.color, v.size].filter(Boolean).join(" / ") || v.sku || "Variação";

        return {
          id: v.id,
          name,
          sku: v.sku || "",
          is_grade: isGrade,
          grade_pairs: v.grade_pairs,
          pairsPerPack,
          currentStock,
          currentPhysical,
          color: v.color || undefined,
          hex_color: v.hex_color || undefined,
          operation: "increase",
          quantity: 1,
          countedQuantity: currentStock,
          reasonCode: "inventory_count",
          notes: "",
          hasChanges: false,
        };
      });
      setTargets(mappedTargets);
    } else {
      // Produto Simples (sem variações)
      const currentStock = product.stock || 0;
      setTargets([
        {
          id: null,
          name: product.name,
          sku: (product as any).sku || "",
          is_grade: false,
          pairsPerPack: 1,
          currentStock,
          currentPhysical: currentStock,
          operation: "increase",
          quantity: 1,
          countedQuantity: currentStock,
          reasonCode: "inventory_count",
          notes: "",
          hasChanges: false,
        },
      ]);
    }
  }, [isOpen, product]);

  // Atualizar operação ou campos de um item
  const updateTargetField = (
    index: number,
    updates: Partial<StockTargetItem>
  ) => {
    setTargets((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, ...updates };

        // Determinar se há mudança real
        let hasChanges = false;
        if (updated.operation === "increase" || updated.operation === "decrease") {
          hasChanges = updated.quantity > 0;
        } else if (updated.operation === "count") {
          hasChanges = updated.countedQuantity !== updated.currentStock;
        }

        return {
          ...updated,
          hasChanges,
        };
      })
    );
  };

  // Resetar todas as alterações
  const resetAllChanges = () => {
    setTargets((prev) =>
      prev.map((item) => ({
        ...item,
        operation: "increase",
        quantity: 1,
        countedQuantity: item.currentStock,
        reasonCode: "inventory_count",
        notes: "",
        hasChanges: false,
      }))
    );
  };

  // Calcular novo saldo previsto e equivalente físico
  const calculatePredicted = (item: StockTargetItem) => {
    let projectedStock = item.currentStock;
    if (item.hasChanges) {
      if (item.operation === "increase") {
        projectedStock = item.currentStock + item.quantity;
      } else if (item.operation === "decrease") {
        projectedStock = item.currentStock - item.quantity;
      } else if (item.operation === "count") {
        projectedStock = item.countedQuantity;
      }
    }
    const projectedPhysical = projectedStock * item.pairsPerPack;
    return { projectedStock, projectedPhysical };
  };

  // Salvar alterações através da RPC canônica
  const saveChanges = async () => {
    const changedTargets = targets.filter((t) => t.hasChanges);

    if (changedTargets.length === 0) {
      toast({
        title: "Nenhuma alteração",
        description: "Configure uma entrada, saída ou contagem para salvar.",
      });
      return;
    }

    const effectiveStoreId = product.store_id || profile?.store_id;
    if (!effectiveStoreId) {
      toast({
        title: "Erro de autenticação",
        description: "Identificador da loja não encontrado.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      let successCount = 0;

      for (const target of changedTargets) {
        const operationId = generateOperationId();

        await applyStockAdjustment(supabase, {
          store_id: effectiveStoreId,
          product_id: product.id,
          variation_id: target.id || null,
          operation: target.operation,
          quantity: target.operation !== "count" ? target.quantity : undefined,
          counted_quantity: target.operation === "count" ? target.countedQuantity : undefined,
          reason_code: target.reasonCode,
          operation_id: operationId,
          source_type: "manual_adjustment",
          notes: target.notes?.trim() || undefined,
        });

        successCount++;
      }

      toast({
        title: "Estoque registrado no Ledger!",
        description: `${successCount} ajuste(s) de estoque gravado(s) com sucesso.`,
      });

      if (onStockUpdated) {
        onStockUpdated();
      }

      onClose();
    } catch (error: any) {
      console.error("Erro ao registrar ajuste de estoque:", error);
      toast({
        title: "Erro ao registrar estoque",
        description: error.message || "Falha na comunicação com o ledger de estoque.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Totais
  const totalCurrentPhysical = useMemo(
    () => targets.reduce((sum, t) => sum + t.currentPhysical, 0),
    [targets]
  );
  const totalProjectedPhysical = useMemo(
    () => targets.reduce((sum, t) => sum + calculatePredicted(t).projectedPhysical, 0),
    [targets]
  );
  const totalChanges = targets.filter((t) => t.hasChanges).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-hidden flex flex-col p-6">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Package className="h-5 w-5 text-blue-600" />
            Gestão de Estoque — {product.name}
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Todos os ajustes são registrados no Ledger com rastreabilidade e equivalência física.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 pt-4">
          {/* Card Resumo do Produto */}
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Itens / Variações</div>
                  <div className="text-xl font-bold text-slate-800">{targets.length}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Pares / Físico Atual</div>
                  <div className="text-xl font-bold text-blue-700">{totalCurrentPhysical} un</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Físico Projetado</div>
                  <div className={`text-xl font-bold ${totalChanges > 0 ? "text-emerald-700" : "text-slate-800"}`}>
                    {totalProjectedPhysical} un
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Ajustes Pendentes</div>
                  <div className="text-xl font-bold text-amber-600">{totalChanges}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Alvos de Estoque */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {targets.map((target, index) => {
              const { projectedStock, projectedPhysical } = calculatePredicted(target);
              const isPack = target.is_grade;
              const unitLabel = isPack ? "caixas" : "pares/un";

              return (
                <Card
                  key={target.id || `simple-${index}`}
                  className={`transition-colors border ${
                    target.hasChanges ? "border-blue-300 bg-blue-50/20" : "border-slate-200 bg-white"
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Header do Item */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {target.hex_color && (
                          <div
                            className="w-4 h-4 rounded-full border border-white shadow-sm ring-1 ring-slate-200"
                            style={{ backgroundColor: target.hex_color }}
                          />
                        )}
                        <span className="font-bold text-slate-900 text-sm">{target.name}</span>
                        {target.sku && (
                          <Badge variant="outline" className="text-[10px] text-slate-600 bg-slate-50">
                            {target.sku}
                          </Badge>
                        )}
                        {isPack && (
                          <Badge className="bg-emerald-50 border-emerald-200 text-emerald-700 text-[10px]">
                            <Boxes className="w-3 h-3 mr-1" />
                            {target.pairsPerPack} pares/caixa
                          </Badge>
                        )}
                      </div>

                      {/* Saldo Atual & Projetado */}
                      <div className="flex items-center gap-3 text-xs">
                        <div>
                          <span className="text-slate-500">Saldo atual: </span>
                          <span className="font-bold text-slate-800">
                            {target.currentStock} {unitLabel}
                          </span>
                          {isPack && (
                            <span className="text-slate-500 font-medium"> ({target.currentPhysical} pares)</span>
                          )}
                        </div>

                        {target.hasChanges && (
                          <div className="text-blue-700 font-bold flex items-center gap-1 bg-blue-100/70 px-2 py-0.5 rounded">
                            <span>→ Novo:</span>
                            <span>
                              {projectedStock} {unitLabel}
                              {isPack && ` (${projectedPhysical} pares)`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Controles de Ação de Estoque */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100 items-end">
                      {/* Tipo de Operação */}
                      <div className="sm:col-span-3 space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-600">Tipo de Ação</Label>
                        <Select
                          value={target.operation}
                          onValueChange={(val: StockOperation) =>
                            updateTargetField(index, { operation: val })
                          }
                        >
                          <SelectTrigger className="h-9 text-xs bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="increase">
                              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                                <Plus className="w-3.5 h-3.5" /> Entrada (+)
                              </span>
                            </SelectItem>
                            <SelectItem value="decrease">
                              <span className="flex items-center gap-1.5 text-red-700 font-medium">
                                <Minus className="w-3.5 h-3.5" /> Saída (-)
                              </span>
                            </SelectItem>
                            <SelectItem value="count">
                              <span className="flex items-center gap-1.5 text-blue-700 font-medium">
                                <Scale className="w-3.5 h-3.5" /> Contagem / Balanço
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Quantidade */}
                      <div className="sm:col-span-3 space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-600">
                          {target.operation === "count" ? "Novo Saldo Total" : `Qtd. a ${target.operation === "increase" ? "Adicionar" : "Retirar"}`}
                        </Label>
                        <Input
                          type="number"
                          min={target.operation === "count" ? "0" : "1"}
                          value={target.operation === "count" ? target.countedQuantity : target.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            if (target.operation === "count") {
                              updateTargetField(index, { countedQuantity: Math.max(0, val) });
                            } else {
                              updateTargetField(index, { quantity: Math.max(1, val) });
                            }
                          }}
                          className="h-9 text-xs font-bold bg-white text-center"
                        />
                      </div>

                      {/* Motivo */}
                      <div className="sm:col-span-3 space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-600">Motivo</Label>
                        <Select
                          value={target.reasonCode}
                          onValueChange={(val: StockReasonCode) =>
                            updateTargetField(index, { reasonCode: val })
                          }
                        >
                          <SelectTrigger className="h-9 text-xs bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STOCK_REASON_LABELS).map(([code, label]) => (
                              <SelectItem key={code} value={code} className="text-xs">
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Observações */}
                      <div className="sm:col-span-3 space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-600">Observações (opcional)</Label>
                        <Input
                          type="text"
                          placeholder="Ex: NF 1234, lote 5"
                          value={target.notes}
                          onChange={(e) => updateTargetField(index, { notes: e.target.value })}
                          className="h-9 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Footer de Ações */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2">
              {totalChanges > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {totalChanges} item(ns) com alteração
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetAllChanges}
                disabled={totalChanges === 0 || saving}
                className="text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Resetar
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={saving}
                className="text-xs"
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Cancelar
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={saveChanges}
                disabled={totalChanges === 0 || saving}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1.5" />
                    Registrando no Ledger...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Confirmar no Ledger
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductStockManagerModal;
