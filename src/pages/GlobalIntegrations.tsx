import React, { useState } from "react";
import {
  Globe,
  Database,
  CreditCard,
  Mail,
  MessageSquare,
  Zap,
  Shield,
  CheckCircle,
  XCircle,
  Settings,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GlobalIntegrations = () => {
  const [activeTab, setActiveTab] = useState("active");

  const integrations = [
    {
      id: "supabase",
      name: "Supabase",
      description: "Banco de dados e autenticação",
      status: "active",
      icon: Database,
      category: "Database",
      lastSync: "2 minutos atrás",
    },
    {
      id: "mercadopago",
      name: "Mercado Pago",
      description: "Gateway de pagamento",
      status: "active",
      icon: CreditCard,
      category: "Payment",
      lastSync: "5 minutos atrás",
    },
    {
      id: "whatsapp",
      name: "WhatsApp Business",
      description: "Notificações e suporte",
      status: "active",
      icon: MessageSquare,
      category: "Communication",
      lastSync: "1 minuto atrás",
    },
    {
      id: "email",
      name: "Email Service",
      description: "Envio de emails transacionais",
      status: "inactive",
      icon: Mail,
      category: "Communication",
      lastSync: "Nunca",
    },
    {
      id: "webhooks",
      name: "Webhooks",
      description: "Integrações customizadas",
      status: "active",
      icon: Zap,
      category: "Custom",
      lastSync: "30 segundos atrás",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Ativo</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inativo</Badge>;
      case "error":
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Database":
        return "bg-blue-100 text-blue-700";
      case "Payment":
        return "bg-green-100 text-green-700";
      case "Communication":
        return "bg-purple-100 text-purple-700";
      case "Custom":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Integrações Globais
          </h1>
          <p className="text-gray-600">
            Gerencie todas as integrações do sistema VendeMais
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Integração
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Ativas</TabsTrigger>
          <TabsTrigger value="inactive">Inativas</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations
              .filter((integration) => integration.status === "active")
              .map((integration) => (
                <Card
                  key={integration.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <integration.icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {integration.name}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {integration.description}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(integration.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Categoria:</span>
                      <Badge className={getCategoryColor(integration.category)}>
                        {integration.category}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Última sincronização:
                      </span>
                      <span className="text-gray-700">
                        {integration.lastSync}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="w-4 h-4 mr-2" />
                        Configurar
                      </Button>
                      <Button variant="outline" size="sm">
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations
              .filter((integration) => integration.status === "inactive")
              .map((integration) => (
                <Card
                  key={integration.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <integration.icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {integration.name}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {integration.description}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(integration.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Categoria:</span>
                      <Badge className={getCategoryColor(integration.category)}>
                        {integration.category}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Última sincronização:
                      </span>
                      <span className="text-gray-700">
                        {integration.lastSync}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1">
                        <Zap className="w-4 h-4 mr-2" />
                        Ativar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <Card
                key={integration.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          integration.status === "active"
                            ? "bg-blue-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <integration.icon
                          className={`w-5 h-5 ${
                            integration.status === "active"
                              ? "text-blue-600"
                              : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {integration.name}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {integration.description}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(integration.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Categoria:</span>
                    <Badge className={getCategoryColor(integration.category)}>
                      {integration.category}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Última sincronização:</span>
                    <span className="text-gray-700">
                      {integration.lastSync}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant={
                        integration.status === "active" ? "outline" : "default"
                      }
                      size="sm"
                      className="flex-1"
                    >
                      {integration.status === "active" ? (
                        <>
                          <Settings className="w-4 h-4 mr-2" />
                          Configurar
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Ativar
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      {integration.status === "active" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Settings className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GlobalIntegrations;
