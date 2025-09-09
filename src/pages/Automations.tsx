import React, { useState } from "react";
import {
  Zap,
  Play,
  Pause,
  Settings,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  Copy,
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
import { Switch } from "@/components/ui/switch";

const Automations = () => {
  const [activeTab, setActiveTab] = useState("active");

  const automations = [
    {
      id: "welcome-email",
      name: "Email de Boas-vindas",
      description: "Envia email automático para novos usuários",
      status: "active",
      trigger: "Usuário se registra",
      action: "Enviar email de boas-vindas",
      lastRun: "2 horas atrás",
      nextRun: "Em 1 hora",
      executions: 1247,
    },
    {
      id: "low-stock-alert",
      name: "Alerta de Estoque Baixo",
      description: "Notifica quando produto fica com estoque baixo",
      status: "active",
      trigger: "Estoque < 10 unidades",
      action: "Enviar notificação WhatsApp",
      lastRun: "30 minutos atrás",
      nextRun: "Contínuo",
      executions: 89,
    },
    {
      id: "order-confirmation",
      name: "Confirmação de Pedido",
      description: "Confirma pedidos automaticamente",
      status: "active",
      trigger: "Novo pedido criado",
      action: "Enviar confirmação por email",
      lastRun: "5 minutos atrás",
      nextRun: "Imediato",
      executions: 3421,
    },
    {
      id: "payment-reminder",
      name: "Lembrete de Pagamento",
      description: "Lembra clientes de pagamentos pendentes",
      status: "paused",
      trigger: "Pagamento pendente há 24h",
      action: "Enviar lembrete por WhatsApp",
      lastRun: "1 dia atrás",
      nextRun: "Pausado",
      executions: 156,
    },
    {
      id: "abandoned-cart",
      name: "Carrinho Abandonado",
      description: "Recupera carrinhos abandonados",
      status: "inactive",
      trigger: "Carrinho abandonado há 1h",
      action: "Enviar email de recuperação",
      lastRun: "Nunca",
      nextRun: "Inativo",
      executions: 0,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Ativo</Badge>;
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-700">Pausado</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inativo</Badge>;
      case "error":
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "paused":
        return <Pause className="w-4 h-4 text-yellow-600" />;
      case "inactive":
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automações</h1>
          <p className="text-gray-600">
            Gerencie workflows e automações do sistema
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Automação
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Ativas</TabsTrigger>
          <TabsTrigger value="paused">Pausadas</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {automations
              .filter((automation) => automation.status === "active")
              .map((automation) => (
                <Card
                  key={automation.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Zap className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {automation.name}
                          </CardTitle>
                          <CardDescription>
                            {automation.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(automation.status)}
                        {getStatusBadge(automation.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Trigger
                        </h4>
                        <p className="text-sm text-gray-900">
                          {automation.trigger}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Ação
                        </h4>
                        <p className="text-sm text-gray-900">
                          {automation.action}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Última Execução
                        </h4>
                        <p className="text-sm text-gray-900">
                          {automation.lastRun}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Próxima Execução
                        </h4>
                        <p className="text-sm text-gray-900">
                          {automation.nextRun}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Total de Execuções
                        </h4>
                        <p className="text-sm text-gray-900">
                          {automation.executions.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm">
                        <Pause className="w-4 h-4 mr-2" />
                        Pausar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Configurar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="paused" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {automations
              .filter((automation) => automation.status === "paused")
              .map((automation) => (
                <Card
                  key={automation.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Zap className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {automation.name}
                          </CardTitle>
                          <CardDescription>
                            {automation.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(automation.status)}
                        {getStatusBadge(automation.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Trigger
                        </h4>
                        <p className="text-sm text-gray-900">
                          {automation.trigger}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Ação
                        </h4>
                        <p className="text-sm text-gray-900">
                          {automation.action}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Última Execução
                        </h4>
                        <p className="text-sm text-gray-900">
                          {automation.lastRun}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Próxima Execução
                        </h4>
                        <p className="text-sm text-gray-900">
                          {automation.nextRun}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Total de Execuções
                        </h4>
                        <p className="text-sm text-gray-900">
                          {automation.executions.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm">
                        <Play className="w-4 h-4 mr-2" />
                        Reativar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Configurar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {automations.map((automation) => (
              <Card
                key={automation.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          automation.status === "active"
                            ? "bg-blue-100"
                            : automation.status === "paused"
                            ? "bg-yellow-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <Zap
                          className={`w-5 h-5 ${
                            automation.status === "active"
                              ? "text-blue-600"
                              : automation.status === "paused"
                              ? "text-yellow-600"
                              : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {automation.name}
                        </CardTitle>
                        <CardDescription>
                          {automation.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(automation.status)}
                      {getStatusBadge(automation.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Trigger
                      </h4>
                      <p className="text-sm text-gray-900">
                        {automation.trigger}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Ação
                      </h4>
                      <p className="text-sm text-gray-900">
                        {automation.action}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Última Execução
                      </h4>
                      <p className="text-sm text-gray-900">
                        {automation.lastRun}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Próxima Execução
                      </h4>
                      <p className="text-sm text-gray-900">
                        {automation.nextRun}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Total de Execuções
                      </h4>
                      <p className="text-sm text-gray-900">
                        {automation.executions.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {automation.status === "active" ? (
                      <Button variant="outline" size="sm">
                        <Pause className="w-4 h-4 mr-2" />
                        Pausar
                      </Button>
                    ) : automation.status === "paused" ? (
                      <Button size="sm">
                        <Play className="w-4 h-4 mr-2" />
                        Reativar
                      </Button>
                    ) : (
                      <Button size="sm">
                        <Play className="w-4 h-4 mr-2" />
                        Ativar
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Configurar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicar
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

export default Automations;
