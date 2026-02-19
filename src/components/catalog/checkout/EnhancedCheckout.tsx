import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Truck,
  MapPin,
  CreditCard,
  Smartphone,
  User,
  Mail,
  Phone,
  Clock,
  Gift,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { useCheckoutConfig } from "@/hooks/useCheckoutConfig";
import { useToast } from "@/hooks/use-toast";
import { useOrders, CreateOrderData } from "@/hooks/useOrders";
import OrderBump from "./OrderBump";
import TrustBadges from "./TrustBadges";
import { formatCurrency } from "@/lib/utils";

interface EnhancedCheckoutProps {
  storeId: string;
  storeName: string;
  storePhone?: string;
  sellerName?: string;
  onClose: () => void;
}

interface CheckoutForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingMethod: string;
  paymentMethod: string;
  shippingAddress?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  notes?: string;
}

const EnhancedCheckout: React.FC<EnhancedCheckoutProps> = ({
  storeId,
  storeName,
  storePhone,
  sellerName,
  onClose,
}) => {
  const { items, totalAmount, addItem, clearCart } = useCart();
  const { config, loading: configLoading } = useCheckoutConfig();
  const { toast } = useToast();
  const { createOrder, isCreatingOrder } = useOrders();

  const [currentStep, setCurrentStep] = useState(1);
  const [shippingCost, setShippingCost] = useState(0);
  const [orderBumpTotal, setOrderBumpTotal] = useState(0);
  const [urgencyTime, setUrgencyTime] = useState(600); // 10 minutos
  const [socialProofCount, setSocialProofCount] = useState(0);

  const form = useForm<CheckoutForm>({
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      shippingMethod: "combine",
      paymentMethod: "pix",
      shippingAddress: {
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: "",
      },
    },
  });

  // Verificar se o método de entrega requer endereço
  const requiresAddress = form.watch("shippingMethod") !== "pickup";

  // Função para buscar endereço pelo CEP
  const searchAddressByCep = async (cep: string) => {
    if (cep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        form.setValue("shippingAddress.street", data.logradouro || "");
        form.setValue("shippingAddress.neighborhood", data.bairro || "");
        form.setValue("shippingAddress.city", data.localidade || "");
        form.setValue("shippingAddress.state", data.uf || "");

        toast({
          title: "Endereço encontrado!",
          description: "Preencha apenas o número e complemento.",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast({
        title: "Erro ao buscar CEP",
        description: "Verifique o CEP informado.",
        variant: "destructive",
      });
    }
  };

  // Timer de urgência - desabilitado temporariamente
  useEffect(() => {
    // if (!config?.urgency_timer_enabled) return;
    // Timer desabilitado até implementar a funcionalidade

    const timer = setInterval(() => {
      setUrgencyTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [config]);

  // Simulação de proof social
  useEffect(() => {
    const interval = setInterval(() => {
      setSocialProofCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const finalTotal = totalAmount + shippingCost + orderBumpTotal;

  const handleOrderBumpAdd = (product: any) => {
    const discountedPrice =
      product.retail_price *
      (1 - (product.order_bump_config?.discount_percentage || 0) / 100);
    addItem({
      id: `${product.id}-orderbump`,
      product,
      quantity: 1,
      price: discountedPrice,
      originalPrice: product.retail_price,
      catalogType: "retail" as const,
      // isOrderBump: true, // Removido para compatibilidade com CartItem
    });
    setOrderBumpTotal((prev) => prev + discountedPrice);

    toast({
      title: "Produto adicionado!",
      description: `${product.name} foi adicionado com desconto especial.`,
    });
  };

  const onSubmit = async (data: CheckoutForm) => {
    try {
      toast({
        title: "Processando pedido...",
        description: "Aguarde enquanto finalizamos seu pedido.",
      });

      // Preparar dados do pedido
      const orderData: CreateOrderData = {
        customer_name: data.customerName,
        customer_email: data.customerEmail || undefined,
        customer_phone: data.customerPhone || undefined,
        total_amount: finalTotal,
        order_type: "retail",
        items: items.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          variation_id: item.variation?.id || null,
          variation_details: item.variation
            ? {
                color: item.variation.color,
                size: item.variation.size,
              }
            : null,
          // Dados específicos do Order Bump
          is_order_bump: (item.product as any)?.isOrderBump || false,
          original_price: (item.product as any)?.originalPrice || item.price,
          discount_percentage: (item.product as any)?.discountPercentage || 0,
        })),
        shipping_address: data.shippingAddress || undefined,
        shipping_method: data.shippingMethod,
        payment_method: data.paymentMethod,
        shipping_cost: shippingCost,
        notes: data.notes,
        store_id: storeId,
      };

      // Criar pedido no sistema
      const createdOrder = await createOrder(orderData);

      // Gerar mensagem do WhatsApp
      if (storePhone) {
        const message = generateWhatsAppMessage(data, createdOrder);
        const whatsappUrl = `https://wa.me/${storePhone.replace(
          /\D/g,
          ""
        )}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
      }

      clearCart();
      toast({
        title: "Pedido finalizado!",
        description: `Pedido #${
          (createdOrder as any)?.data?.id?.slice(-8) || "N/A"
        } criado com sucesso.`,
      });
      onClose();
    } catch (error) {
      console.error("EnhancedCheckout: Erro ao processar pedido:", error);
      toast({
        title: "Erro ao processar pedido",
        description:
          error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const generateWhatsAppMessage = (data: CheckoutForm, order?: any) => {
    const headerTitle = sellerName
      ? `🛒 *NOVO PEDIDO - ${storeName}* (Atendimento: ${sellerName})\n\n`
      : `🛒 *NOVO PEDIDO - ${storeName}*\n\n`;
    let message = headerTitle;
    message += `👤 *Cliente:* ${data.customerName}\n`;
    message += `📧 *Email:* ${data.customerEmail}\n`;
    message += `📱 *Telefone:* ${data.customerPhone}\n\n`;

    // Informações do pedido
    if (order?.id) {
      message += `📋 *Pedido:* #${order.id.slice(-8)}\n\n`;
    }

    message += `📦 *ITENS DO PEDIDO:*\n`;

    // Separar itens normais e order bumps
    const normalItems = items.filter(
      (item) => !(item.product as any)?.isOrderBump
    );
    const orderBumpItems = items.filter(
      (item) => (item.product as any)?.isOrderBump
    );

    // Itens normais
    normalItems.forEach((item, index) => {
      message += `${index + 1}. ${item.product.name}\n`;
      message += `   Qtd: ${item.quantity}x\n`;
      message += `   Preço: ${formatCurrency(item.price)}\n`;
      if (item.variation) {
        message += `   Variação: ${item.variation.color || ""} ${
          item.variation.size || ""
        }\n`;
      }
      message += `   Subtotal: ${formatCurrency(
        item.price * item.quantity
      )}\n\n`;
    });

    // Order Bumps (ofertas especiais)
    if (orderBumpItems.length > 0) {
      message += `🎁 *OFERTAS ESPECIAIS:*\n`;
      orderBumpItems.forEach((item, index) => {
        const originalPrice =
          (item.product as any)?.originalPrice || item.price;
        const discountPercentage =
          (item.product as any)?.discountPercentage || 0;

        message += `${index + 1}. ${item.product.name} 🔥\n`;
        message += `   Qtd: ${item.quantity}x\n`;
        if (discountPercentage > 0) {
          message += `   Preço original: ${formatCurrency(originalPrice)}\n`;
          message += `   Desconto: ${discountPercentage}% OFF\n`;
          message += `   Preço final: ${formatCurrency(item.price)}\n`;
        } else {
          message += `   Preço: ${formatCurrency(item.price)}\n`;
        }
        if (item.variation) {
          message += `   Variação: ${item.variation.color || ""} ${
            item.variation.size || ""
          }\n`;
        }
        message += `   Subtotal: ${formatCurrency(
          item.price * item.quantity
        )}\n\n`;
      });
    }

    // Debug do total
    console.log("🛒 EnhancedCheckout - Debug total:", {
      totalAmount,
      shippingCost,
      finalTotal,
      cartItemsCount: items.length,
      cartItems: items.map((item) => ({
        name: item.product?.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      })),
    });

    message += `💰 *RESUMO FINANCEIRO:*\n`;
    message += `Subtotal produtos: ${formatCurrency(totalAmount)}\n`;
    if (shippingCost > 0) {
      message += `Frete: ${formatCurrency(shippingCost)}\n`;
    }
    if (orderBumpItems.length > 0) {
      const orderBumpTotal = orderBumpItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const orderBumpSavings = orderBumpItems.reduce((sum, item) => {
        const originalPrice =
          (item.product as any)?.originalPrice || item.price;
        return sum + (originalPrice - item.price) * item.quantity;
      }, 0);

      message += `Ofertas especiais: ${formatCurrency(orderBumpTotal)}\n`;
      if (orderBumpSavings > 0) {
        message += `💚 Economia: ${formatCurrency(orderBumpSavings)}\n`;
      }
    }
    message += `*TOTAL FINAL: ${formatCurrency(finalTotal)}*\n\n`;

    message += `🚚 *Entrega:* ${
      config?.shipping_methods.find((m) => m.id === data.shippingMethod)
        ?.name || "A Combinar"
    }\n`;
    message += `💳 *Pagamento:* ${
      config?.payment_methods.find((m) => m.id === data.paymentMethod)?.name ||
      "A Combinar"
    }\n`;

    if (data.notes) {
      message += `📝 *Observações:* ${data.notes}\n`;
    }

    return message;
  };

  const steps = [
    { id: 1, title: "Dados Pessoais", icon: <User className="h-4 w-4" /> },
    {
      id: 2,
      title: "Entrega & Pagamento",
      icon: <Truck className="h-4 w-4" />,
    },
    { id: 3, title: "Confirmação", icon: <CheckCircle className="h-4 w-4" /> },
  ];

  if (configLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header com urgência */}
      {urgencyTime > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              <span className="font-bold">OFERTA ESPECIAL - Finalize em:</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
              <Clock className="h-4 w-4" />
              <span className="font-mono font-bold text-lg">
                {formatTime(urgencyTime)}
              </span>
            </div>
          </div>
          <p className="text-sm mt-1">
            Aproveite desccontos exclusivos válidos apenas nesta sessão!
          </p>
        </div>
      )}

      {/* Social Proof em tempo real */}
      {true && (
        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-green-800 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>
              🔥 <strong>{socialProofCount + 847} pessoas</strong> estão
              visualizando produtos agora
            </span>
          </div>
        </div>
      )}

      {/* Stepper */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                currentStep >= step.id
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {step.icon}
              <span className="font-medium text-sm hidden sm:block">
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
            )}
          </div>
        ))}
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Coluna Principal - Formulário */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Dados Pessoais */}
            {currentStep >= 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Seus Dados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp *</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="seu@email.com"
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {currentStep === 1 && (
                    <div className="space-y-3">
                      <Button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="w-full"
                        disabled={
                          !form.watch("customerName") ||
                          !form.watch("customerPhone")
                        }
                      >
                        Continuar <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="w-full"
                      >
                        Continuar Comprando
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Entrega e Pagamento */}
            {currentStep >= 2 && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Como deseja receber?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="shippingMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              {config?.shipping_methods.map((method) => (
                                <div
                                  key={method.id}
                                  className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
                                >
                                  <RadioGroupItem
                                    value={method.id}
                                    id={method.id}
                                  />
                                  <div className="flex-1 flex items-center justify-between">
                                    <div>
                                      <label
                                        htmlFor={method.id}
                                        className="font-medium cursor-pointer"
                                      >
                                        {method.name}
                                      </label>
                                      {method.estimated_days && (
                                        <p className="text-sm text-gray-600">
                                          Entrega em {method.estimated_days}{" "}
                                          dias úteis
                                        </p>
                                      )}
                                    </div>
                                    <span className="font-bold text-green-600">
                                      {method.price === 0
                                        ? "O mais escolhido!"
                                        : formatCurrency(method.price)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Campos de endereço quando necessário */}
                {requiresAddress && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Endereço de Entrega
                        {form.watch("shippingMethod") === "combine" && (
                          <Badge variant="secondary" className="text-xs">
                            Opcional
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="shippingAddress.zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CEP *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="00000-000"
                                  {...field}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(
                                      /\D/g,
                                      ""
                                    );
                                    field.onChange(value);
                                    if (value.length === 8) {
                                      searchAddressByCep(value);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="shippingAddress.street"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rua/Avenida *</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome da rua" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="shippingAddress.number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número *</FormLabel>
                              <FormControl>
                                <Input placeholder="123" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="shippingAddress.complement"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Complemento</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Apto, bloco, etc."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="shippingAddress.neighborhood"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bairro *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Nome do bairro"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="shippingAddress.city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cidade *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Nome da cidade"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="shippingAddress.state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estado *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="SP, RJ, MG, etc."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Forma de Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              {config?.payment_methods.map((method) => (
                                <div
                                  key={method.id}
                                  className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
                                >
                                  <RadioGroupItem
                                    value={method.id}
                                    id={method.id}
                                  />
                                  <div className="flex-1">
                                    <label
                                      htmlFor={method.id}
                                      className="font-medium cursor-pointer flex items-center gap-2"
                                    >
                                      {method.type === "pix" && "💰"}
                                      {method.type === "credit_card" && "💳"}
                                      {method.type === "bank_transfer" && "🏦"}
                                      {method.name}
                                    </label>
                                    {method.config?.instructions && (
                                      <p className="text-sm text-gray-600 mt-1">
                                        {method.config.instructions}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {currentStep === 2 && (
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="flex-1"
                    >
                      Revisar Pedido <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Step 3: Confirmação */}
            {currentStep >= 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Observações Finais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Alguma observação sobre o pedido..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isCreatingOrder}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      {isCreatingOrder ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processando...
                        </div>
                      ) : (
                        `🚀 Finalizar Pedido - ${formatCurrency(finalTotal)}`
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna Lateral - Resumo e Order Bumps */}
          <div className="space-y-6">
            {/* Order Bumps */}
            {config?.order_bump_products?.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Gift className="h-5 w-5 text-orange-500" />
                  Ofertas Especiais
                </h3>
                <OrderBump
                  products={config.order_bump_products}
                  onAddProduct={handleOrderBumpAdd}
                  cartItems={items}
                />
              </div>
            )}
            {/* Resumo do Pedido */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-xs text-gray-600">
                        {item.quantity}x {formatCurrency(item.price)}
                        {/* Badge removido para compatibilidade */}
                      </p>
                    </div>
                    <p className="font-bold">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>

                  {shippingCost > 0 && (
                    <div className="flex justify-between">
                      <span>Frete:</span>
                      <span>{formatCurrency(shippingCost)}</span>
                    </div>
                  )}

                  {orderBumpTotal > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Ofertas especiais:</span>
                      <span>{formatCurrency(orderBumpTotal)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <TrustBadges enabled={true} />
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EnhancedCheckout;
