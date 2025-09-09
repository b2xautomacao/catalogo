import React, { useState } from "react";
import {
  BarChart,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  Eye,
  Calendar,
  Download,
  RefreshCw,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Analytics = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("30d");

  const metrics = [
    {
      title: "Receita Total",
      value: "R$ 45.230,00",
      change: "+12.5%",
      changeType: "positive",
      icon: DollarSign,
      description: "vs mês anterior",
    },
    {
      title: "Novos Usuários",
      value: "1.234",
      change: "+8.2%",
      changeType: "positive",
      icon: Users,
      description: "vs mês anterior",
    },
    {
      title: "Pedidos",
      value: "3.456",
      change: "+15.3%",
      changeType: "positive",
      icon: ShoppingCart,
      description: "vs mês anterior",
    },
    {
      title: "Visualizações",
      value: "89.123",
      change: "-2.1%",
      changeType: "negative",
      icon: Eye,
      description: "vs mês anterior",
    },
  ];

  const topStores = [
    { name: "Loja ABC", revenue: "R$ 12.450,00", orders: 234, growth: "+15%" },
    { name: "Loja XYZ", revenue: "R$ 8.920,00", orders: 189, growth: "+8%" },
    { name: "Loja 123", revenue: "R$ 6.780,00", orders: 156, growth: "+22%" },
    { name: "Loja DEF", revenue: "R$ 5.340,00", orders: 134, growth: "+5%" },
    { name: "Loja GHI", revenue: "R$ 4.120,00", orders: 98, growth: "+12%" },
  ];

  const recentActivity = [
    {
      type: "new_store",
      message: "Nova loja 'Moda & Estilo' foi criada",
      time: "2 minutos atrás",
      icon: "🏪",
    },
    {
      type: "high_revenue",
      message: "Loja ABC atingiu R$ 10k em vendas hoje",
      time: "15 minutos atrás",
      icon: "💰",
    },
    {
      type: "new_user",
      message: "5 novos usuários se registraram",
      time: "1 hora atrás",
      icon: "👥",
    },
    {
      type: "system",
      message: "Backup automático concluído",
      time: "2 horas atrás",
      icon: "💾",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">
            Métricas e insights do sistema VendeMais
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metric.value}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge
                      variant={
                        metric.changeType === "positive"
                          ? "default"
                          : "destructive"
                      }
                      className="text-xs"
                    >
                      {metric.change}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {metric.description}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <metric.icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Top Lojas por Receita
                </CardTitle>
                <CardDescription>
                  Lojas com maior faturamento no período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topStores.map((store, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {store.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {store.orders} pedidos
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {store.revenue}
                        </p>
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          {store.growth}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Crescimento Mensal
                </CardTitle>
                <CardDescription>
                  Evolução da receita nos últimos meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Janeiro 2024</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: "75%" }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">R$ 38.450</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Fevereiro 2024
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: "85%" }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">R$ 42.120</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Março 2024</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: "100%" }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">R$ 45.230</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Receita</CardTitle>
              <CardDescription>
                Detalhamento da receita por período e categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">
                    Gráfico de receita será implementado aqui
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Usuários</CardTitle>
              <CardDescription>
                Crescimento e comportamento dos usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">
                    Gráfico de usuários será implementado aqui
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>Últimas atividades no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="text-2xl">{activity.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
