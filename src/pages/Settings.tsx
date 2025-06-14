
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Store, 
  CreditCard, 
  Truck, 
  MessageSquare, 
  Settings as SettingsIcon,
  Bot,
  Bell,
  User,
  Shield,
  ShoppingBag,
  ArrowLeft,
  Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StoreInfoSettings from '@/components/settings/StoreInfoSettings';
import PaymentSettings from '@/components/settings/PaymentSettings';
import ShippingSettings from '@/components/settings/ShippingSettings';
import DeliverySettings from '@/components/settings/DeliverySettings';
import WhatsAppSettings from '@/components/settings/WhatsAppSettings';
import AutomationSettings from '@/components/settings/AutomationSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import CatalogSettings from '@/components/settings/CatalogSettings';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('store');
  const navigate = useNavigate();

  const tabs = [
    {
      id: 'store',
      label: 'Dados da Loja',
      icon: Store,
      component: StoreInfoSettings
    },
    {
      id: 'catalog',
      label: 'Catálogos',
      icon: ShoppingBag,
      component: CatalogSettings
    },
    {
      id: 'payments',
      label: 'Pagamentos',
      icon: CreditCard,
      component: PaymentSettings
    },
    {
      id: 'shipping',
      label: 'Envios',
      icon: Truck,
      component: ShippingSettings
    },
    {
      id: 'delivery',
      label: 'Entregas',
      icon: Package,
      component: DeliverySettings
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageSquare,
      component: WhatsAppSettings
    },
    {
      id: 'automation',
      label: 'Automações',
      icon: Bot,
      component: AutomationSettings
    },
    {
      id: 'notifications',
      label: 'Notificações',
      icon: Bell,
      component: NotificationSettings
    },
    {
      id: 'security',
      label: 'Segurança',
      icon: Shield,
      component: SecuritySettings
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Configurações da Loja</h1>
              <p className="text-muted-foreground mt-2">Gerencie todas as configurações do seu catálogo e loja</p>
            </div>
          </div>
          <Button className="btn-primary">
            <SettingsIcon className="mr-2 h-5 w-5" />
            Salvar Todas as Configurações
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9 gap-2 h-auto p-2 bg-white rounded-xl shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                >
                  <Icon size={20} />
                  <span className="text-xs font-medium">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {tabs.map((tab) => {
            const Component = tab.component;
            return (
              <TabsContent key={tab.id} value={tab.id} className="space-y-6">
                <Card className="card-modern">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <tab.icon className="h-6 w-6 text-blue-600" />
                      Configurações de {tab.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Component />
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
