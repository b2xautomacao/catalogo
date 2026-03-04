import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Truck, MapPin, CreditCard, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CartItemThumbnail from "./checkout/CartItemThumbnail";
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
import { useCart } from "@/hooks/useCart";
import { StoreSettings } from "@/hooks/useStoreSettings";
import { useToast } from "@/hooks/use-toast";

interface CheckoutProps {
  settings: StoreSettings;
  onClose: () => void;
}

interface CheckoutForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingMethod: string;
  shippingAddress?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  paymentMethod: string;
  notes?: string;
}

const Checkout: React.FC<CheckoutProps> = ({ settings, onClose }) => {
  const { items, totalAmount, clearCart } = useCart();
  const { toast } = useToast();
  const form = useForm<CheckoutForm>({
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      shippingMethod: "pickup",
      paymentMethod: "pix",
    },
  });

  const getAvailablePaymentMethods = () => {
    const methods = [];

    if (settings.payment_methods?.pix) {
      methods.push({ id: "pix", name: "PIX", icon: Smartphone });
    }

    if (settings.payment_methods?.credit_card) {
      methods.push({
        id: "credit_card",
        name: "Cartão de Crédito",
        icon: CreditCard,
      });
    }

    if (settings.payment_methods?.bank_slip) {
      methods.push({
        id: "bank_slip",
        name: "Boleto Bancário",
        icon: CreditCard,
      });
    }

    return methods;
  };

  const getAvailableShippingMethods = () => {
    const methods = [];

    // Sempre incluir a opção de retirada na loja
    methods.push({
      id: "pickup",
      name: "Retirar na Loja",
      description: "Retire gratuitamente em nossa loja",
      price: 0,
      icon: MapPin,
    });

    // Sempre incluir a opção de entrega a combinar
    methods.push({
      id: "delivery",
      name: "Entrega a Combinar",
      description: "Entrega combinada diretamente conosco",
      price: 0,
      icon: Truck,
    });

    return methods;
  };

  const onSubmit = async (data: CheckoutForm) => {
    try {
      const orderData = {
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.price,
          catalog_type: item.catalogType,
        })),
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone,
        shipping_method: data.shippingMethod,
        shipping_address: data.shippingAddress,
        payment_method: data.paymentMethod,
        total_amount: totalAmount,
        shipping_cost: 0,
        notes: data.notes,
      };

      // TODO: Enviar pedido para o backend
      console.log("Pedido criado:", orderData);

      // Se o checkout for via WhatsApp
      if (
        settings.whatsapp_number &&
        (data.paymentMethod === "cash" ||
          data.shippingMethod === "pickup" ||
          !settings.payment_methods?.credit_card)
      ) {
        const message = generateWhatsAppMessage(data, orderData);
        window.open(
          `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(
            message
          )}`,
          "_blank"
        );
      } else if (data.paymentMethod === "credit_card") {
        // TODO: Integração com Mercado Pago
        console.log("Processar pagamento com cartão");
      }

      clearCart();
      toast({
        title: "Pedido realizado!",
        description: "Seu pedido foi enviado com sucesso.",
      });
      onClose();
    } catch (error) {
      console.error("Erro ao processar pedido:", error);
      toast({
        title: "Erro ao processar pedido",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  };

  const generateWhatsAppMessage = (data: CheckoutForm, orderData: any) => {
    let message = `🛒 *Novo Pedido*\n\n`;
    message += `👤 *Cliente:* ${data.customerName}\n`;
    message += `📧 *Email:* ${data.customerEmail}\n`;
    message += `📱 *Telefone:* ${data.customerPhone}\n\n`;

    message += `📦 *Itens:*\n`;
    items.forEach((item) => {
      let variationText = "";
      if (item.gradeInfo) {
        variationText = ` - Grade: ${item.gradeInfo.name} (Tamanhos: ${item.gradeInfo.sizes?.join(", ")})`;
      } else if (item.variation) {
        const parts = [];
        if (item.variation.color) parts.push(`Cor: ${item.variation.color}`);
        if (item.variation.size) parts.push(`Tamanho: ${item.variation.size}`);
        if (parts.length > 0) variationText = ` - ${parts.join(", ")}`;
      }

      message += `• ${item.product.name}${variationText} (${item.quantity}x) - R$ ${(
        item.price * item.quantity
      ).toFixed(2)}\n`;
    });

    message += `\n💰 *Total:* R$ ${totalAmount.toFixed(2)}`;

    message += `\n📋 *Forma de Pagamento:* ${getPaymentMethodName(
      data.paymentMethod
    )}`;
    message += `\n🚚 *Entrega:* ${getShippingMethodName(data.shippingMethod)}`;

    if (data.shippingAddress && data.shippingMethod !== "pickup") {
      message += `\n📍 *Endereço:* ${data.shippingAddress.street}, ${data.shippingAddress.number}, ${data.shippingAddress.neighborhood}, ${data.shippingAddress.city} - ${data.shippingAddress.state}`;
    }

    if (data.notes) {
      message += `\n📝 *Observações:* ${data.notes}`;
    }

    return message;
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "pix":
        return "PIX";
      case "credit_card":
        return "Cartão de Crédito";
      case "bank_slip":
        return "Boleto Bancário";
      case "cash":
        return "Dinheiro";
      default:
        return method;
    }
  };

  const getShippingMethodName = (method: string) => {
    switch (method) {
      case "pickup":
        return "Retirada na Loja";
      case "delivery":
        return "Entrega a Combinar";
      case "shipping":
        return "Correios";
      default:
        return method;
    }
  };

  const paymentMethods = getAvailablePaymentMethods();
  const shippingMethods = getAvailableShippingMethods();
  const finalTotal = totalAmount;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Finalizar Pedido</h1>
        <Button variant="outline" onClick={onClose}>
          Voltar ao Carrinho
        </Button>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Formulário */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados do Cliente */}
            <Card>
              <CardHeader>
                <CardTitle>Dados do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="seu@email.com"
                            {...field}
                          />
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
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Método de Entrega */}
            <Card>
              <CardHeader>
                <CardTitle>Método de Entrega</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="shippingMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="space-y-3"
                        >
                          {shippingMethods.map((method) => (
                            <div
                              key={method.id}
                              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <RadioGroupItem
                                value={method.id}
                                id={method.id}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <method.icon size={16} />
                                  <label
                                    htmlFor={method.id}
                                    className="font-medium cursor-pointer"
                                  >
                                    {method.name}
                                  </label>
                                  <span className="text-green-600 font-bold">
                                    {method.price === 0
                                      ? "Grátis"
                                      : `R$ ${method.price.toFixed(2)}`}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {method.description}
                                </p>
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

            {/* Endereço de Entrega */}
            {form.watch("shippingMethod") === "delivery" && (
              <Card>
                <CardHeader>
                  <CardTitle>Endereço de Entrega</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="shippingAddress.street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rua</FormLabel>
                          <FormControl>
                            <Input placeholder="Rua" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shippingAddress.number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input placeholder="Número" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="shippingAddress.complement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input placeholder="Apto, Bloco" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="shippingAddress.neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input placeholder="Bairro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shippingAddress.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Cidade" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="shippingAddress.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Input placeholder="Estado" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shippingAddress.zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input placeholder="00000-000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Método de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle>Método de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="space-y-3"
                        >
                          {paymentMethods.map((method) => (
                            <div
                              key={method.id}
                              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <RadioGroupItem
                                value={method.id}
                                id={method.id}
                              />
                              <div className="flex items-center gap-2">
                                <method.icon size={16} />
                                <label
                                  htmlFor={method.id}
                                  className="font-medium cursor-pointer"
                                >
                                  {method.name}
                                </label>
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

            {/* Observações */}
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Observações sobre o pedido (opcional)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Resumo do Pedido */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start gap-4 py-3 border-b last:border-0"
                  >
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                      <CartItemThumbnail
                        imageUrl={item.variation?.image_url || item.product?.image_url}
                        productName={item.product?.name || "Produto"}
                        size="sm"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.product.name}</p>

                      {item.gradeInfo && (
                        <div className="flex flex-col gap-1 mt-1">
                          <span className="inline-block mt-0.5">
                            <Badge className="bg-blue-600 font-semibold text-white px-1.5 py-0 text-[10px]">
                              Grade: {item.gradeInfo.name}
                            </Badge>
                          </span>
                          {item.gradeInfo.sizes && item.gradeInfo.sizes.length > 0 && (
                            <span className="text-[10px] text-gray-500">
                              Tamanhos: {item.gradeInfo.sizes.join(", ")}
                            </span>
                          )}
                        </div>
                      )}

                      {item.variation && (
                        <p className="text-xs text-gray-500 truncate mt-0.5 font-medium">
                          {[item.variation.color, item.variation.size].filter(Boolean).join(" - ")}
                        </p>
                      )}

                      <p className="text-xs text-gray-600 mt-1">
                        {item.quantity}x R$ {item.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-bold whitespace-nowrap">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>R$ {totalAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>R$ {finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button type="submit" className="w-full btn-primary" size="lg">
                  Finalizar Pedido
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Checkout;
