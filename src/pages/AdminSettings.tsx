import React, { useState } from "react";
import {
  Settings as SettingsIcon,
  Database,
  Shield,
  Globe,
  Users,
  CreditCard,
  Zap,
  Activity,
  BarChart,
  FileText,
  MonitorSpeaker,
  Crown,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState("system");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações Administrativas</h1>
          <p className="text-gray-600">Gerencie configurações globais do sistema VendeMais</p>
        </div>
        <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
          <Crown className="w-3 h-3 mr-1" />
          Super Admin
        </Badge>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Integrações</span>
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Monitoramento</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Configurações do Banco de Dados
                </CardTitle>
                <CardDescription>
                  Gerencie configurações e conexões do banco de dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Host do Banco</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="localhost"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Porta</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="5432"
                    disabled
                  />
                </div>
                <Button disabled className="w-full">
                  <Database className="w-4 h-4 mr-2" />
                  Testar Conexão
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Configurações de Performance
                </CardTitle>
                <CardDescription>
                  Otimize a performance do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cache TTL (minutos)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="30"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Connections</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="100"
                    disabled
                  />
                </div>
                <Button disabled className="w-full">
                  <Zap className="w-4 h-4 mr-2" />
                  Aplicar Configurações
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configurações de Segurança
              </CardTitle>
              <CardDescription>
                Gerencie políticas de segurança e autenticação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sessão Timeout (minutos)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="60"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tentativas de Login</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="5"
                  disabled
                />
              </div>
              <Button disabled className="w-full">
                <Shield className="w-4 h-4 mr-2" />
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Integrações Globais
              </CardTitle>
              <CardDescription>
                Configure integrações com serviços externos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key Supabase</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="••••••••••••••••"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Webhook URL</label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://api.exemplo.com/webhook"
                  disabled
                />
              </div>
              <Button disabled className="w-full">
                <Globe className="w-4 h-4 mr-2" />
                Testar Integrações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Status do Sistema
                </CardTitle>
                <CardDescription>
                  Monitore a saúde do sistema em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status do Banco</span>
                  <Badge className="bg-green-100 text-green-700">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Status</span>
                  <Badge className="bg-green-100 text-green-700">Operacional</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uptime</span>
                  <span className="text-sm text-gray-600">99.9%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Métricas do Sistema
                </CardTitle>
                <CardDescription>
                  Visualize métricas de performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU Usage</span>
                    <span>23%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '23%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span>67%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '67%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
