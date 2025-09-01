import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { useCatalogSettings } from "@/hooks/useCatalogSettings";
import { Plus, Edit, Trash2, Gift, Package, Clock, Users } from "lucide-react";

interface OrderBumpConfig {
  id: string;
  product_id: string;
  store_id: string;
  discount_percentage: number;
  urgency_text: string;
  social_proof_text: string;
  bundle_price: number | null;
  is_limited_time: boolean;
  limited_quantity: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface Product {
  id: string;
  name: string;
  retail_price: number;
  image_url?: string;
}

export default function OrderBumpSettings() {
  const { toast } = useToast();
  const { storeId } = useCatalogSettings();
  const { products } = useProducts();

  const [orderBumps, setOrderBumps] = useState<OrderBumpConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingOrderBump, setEditingOrderBump] =
    useState<OrderBumpConfig | null>(null);

  const [formData, setFormData] = useState({
    product_id: "",
    discount_percentage: 0,
    urgency_text: "",
    social_proof_text: "",
    bundle_price: 0,
    is_limited_time: false,
    limited_quantity: 0,
    is_active: true,
  });

  // Carregar order bumps existentes
  useEffect(() => {
    if (storeId) {
      fetchOrderBumps();
    }
  }, [storeId]);

  const fetchOrderBumps = async () => {
    if (!storeId) return;

    try {
      setLoading(true);
      // Simular dados para demonstração
      const mockOrderBumps: OrderBumpConfig[] = [
        {
          id: "1",
          product_id: "prod-1",
          store_id: storeId,
          discount_percentage: 15,
          urgency_text: "Últimas unidades!",
          social_proof_text: "95% dos clientes escolheram!",
          bundle_price: null,
          is_limited_time: true,
          limited_quantity: 10,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setOrderBumps(mockOrderBumps);
    } catch (error) {
      console.error("Erro ao carregar order bumps:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações de order bump",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeId) return;

    try {
      const orderBumpData = {
        ...formData,
        store_id: storeId,
        updated_at: new Date().toISOString(),
      };

      if (editingOrderBump) {
        // Atualizar existente
        const updatedOrderBumps = orderBumps.map((ob) =>
          ob.id === editingOrderBump.id ? { ...ob, ...orderBumpData } : ob
        );
        setOrderBumps(updatedOrderBumps);

        toast({
          title: "Sucesso",
          description: "Order bump atualizado com sucesso!",
        });
      } else {
        // Criar novo
        const newOrderBump: OrderBumpConfig = {
          id: Date.now().toString(),
          ...orderBumpData,
          created_at: new Date().toISOString(),
        };

        setOrderBumps([newOrderBump, ...orderBumps]);

        toast({
          title: "Sucesso",
          description: "Order bump criado com sucesso!",
        });
      }

      // Limpar formulário e fechar diálogo
      setFormData({
        product_id: "",
        discount_percentage: 0,
        urgency_text: "",
        social_proof_text: "",
        bundle_price: 0,
        is_limited_time: false,
        limited_quantity: 0,
        is_active: true,
      });
      setEditingOrderBump(null);
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Erro ao salvar order bump:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração de order bump",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (orderBump: OrderBumpConfig) => {
    setEditingOrderBump(orderBump);
    setFormData({
      product_id: orderBump.product_id,
      discount_percentage: orderBump.discount_percentage,
      urgency_text: orderBump.urgency_text || "",
      social_proof_text: orderBump.social_proof_text || "",
      bundle_price: orderBump.bundle_price || 0,
      is_limited_time: orderBump.is_limited_time,
      limited_quantity: orderBump.limited_quantity || 0,
      is_active: orderBump.is_active,
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este order bump?")) return;

    try {
      const updatedOrderBumps = orderBumps.filter((ob) => ob.id !== id);
      setOrderBumps(updatedOrderBumps);

      toast({
        title: "Sucesso",
        description: "Order bump excluído com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao excluir order bump:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir order bump",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const updatedOrderBumps = orderBumps.map((ob) =>
        ob.id === id
          ? {
              ...ob,
              is_active: !currentStatus,
              updated_at: new Date().toISOString(),
            }
          : ob
      );
      setOrderBumps(updatedOrderBumps);

      toast({
        title: "Sucesso",
        description: `Order bump ${
          !currentStatus ? "ativado" : "desativado"
        } com sucesso!`,
      });
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do order bump",
        variant: "destructive",
      });
    }
  };

  const getProductName = (productId: string) => {
    const product = products?.find((p) => p.id === productId);
    return product?.name || "Produto não encontrado";
  };

  const getProductPrice = (productId: string) => {
    const product = products?.find((p) => p.id === productId);
    return product?.retail_price || 0;
  };

  const calculateFinalPrice = (
    productId: string,
    discountPercentage: number
  ) => {
    const originalPrice = getProductPrice(productId);
    return originalPrice * (1 - discountPercentage / 100);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-6 w-6 text-orange-500" />
            Order Bumps
          </h2>
          <p className="text-gray-600 mt-1">
            Configure ofertas especiais para aumentar o valor médio dos pedidos
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Order Bump
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingOrderBump ? "Editar Order Bump" : "Novo Order Bump"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product_id">Produto *</Label>
                  <Select
                    value={formData.product_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, product_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - R$ {product.retail_price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="discount_percentage">Desconto (%) *</Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_percentage: Number(e.target.value),
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="urgency_text">Texto de Urgência</Label>
                  <Input
                    id="urgency_text"
                    value={formData.urgency_text}
                    onChange={(e) =>
                      setFormData({ ...formData, urgency_text: e.target.value })
                    }
                    placeholder="Ex: Últimas unidades!"
                  />
                </div>

                <div>
                  <Label htmlFor="social_proof_text">
                    Texto de Prova Social
                  </Label>
                  <Input
                    id="social_proof_text"
                    value={formData.social_proof_text}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        social_proof_text: e.target.value,
                      })
                    }
                    placeholder="Ex: 95% dos clientes escolheram!"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bundle_price">Preço do Pacote</Label>
                  <Input
                    id="bundle_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.bundle_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bundle_price: Number(e.target.value),
                      })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_limited_time"
                    checked={formData.is_limited_time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_limited_time: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="is_limited_time">Tempo limitado</Label>
                </div>
              </div>

              {formData.is_limited_time && (
                <div>
                  <Label htmlFor="limited_quantity">Quantidade Limitada</Label>
                  <Input
                    id="limited_quantity"
                    type="number"
                    min="1"
                    value={formData.limited_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limited_quantity: Number(e.target.value),
                      })
                    }
                    placeholder="Ex: 10"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="is_active">Ativo</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingOrderBump(null);
                    setFormData({
                      product_id: "",
                      discount_percentage: 0,
                      urgency_text: "",
                      social_proof_text: "",
                      bundle_price: 0,
                      is_limited_time: false,
                      limited_quantity: 0,
                      is_active: true,
                    });
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingOrderBump ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {orderBumps.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum Order Bump configurado
            </h3>
            <p className="text-gray-500 mb-4">
              Crie sua primeira oferta especial para aumentar o valor médio dos
              pedidos
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Order Bump
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orderBumps.map((orderBump) => {
            const productName = getProductName(orderBump.product_id);
            const originalPrice = getProductPrice(orderBump.product_id);
            const finalPrice = calculateFinalPrice(
              orderBump.product_id,
              orderBump.discount_percentage
            );
            const savings = originalPrice - finalPrice;

            return (
              <Card key={orderBump.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Package className="h-5 w-5 text-blue-500" />
                        <h3 className="font-semibold text-lg">{productName}</h3>
                        <Badge
                          variant={
                            orderBump.is_active ? "default" : "secondary"
                          }
                        >
                          {orderBump.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Preço original:</span>
                          <p className="font-medium">
                            R$ {originalPrice.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Desconto:</span>
                          <p className="font-medium text-green-600">
                            {orderBump.discount_percentage}% OFF
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Preço final:</span>
                          <p className="font-medium text-green-600">
                            R$ {finalPrice.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Economia:</span>
                          <p className="font-medium text-green-600">
                            R$ {savings.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {(orderBump.urgency_text ||
                        orderBump.social_proof_text) && (
                        <div className="mt-3 space-y-2">
                          {orderBump.urgency_text && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-orange-500" />
                              <span className="text-orange-600">
                                {orderBump.urgency_text}
                              </span>
                            </div>
                          )}
                          {orderBump.social_proof_text && (
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-4 w-4 text-blue-500" />
                              <span className="text-blue-600">
                                {orderBump.social_proof_text}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {orderBump.is_limited_time &&
                        orderBump.limited_quantity && (
                          <div className="mt-3">
                            <Badge variant="destructive" className="text-xs">
                              Quantidade limitada: {orderBump.limited_quantity}
                            </Badge>
                          </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(orderBump)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleActive(orderBump.id, orderBump.is_active)
                        }
                      >
                        {orderBump.is_active ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(orderBump.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
