
import React, { useState } from 'react';
import { Settings as SettingsIcon, Store, Palette, Truck, CreditCard, MessageSquare, Globe, Shield, Image, ArrowLeftRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import StoreInfoSettings from '@/components/settings/StoreInfoSettings';
import CatalogSettings from '@/components/settings/CatalogSettings';
import ProtectedShippingSettings from '@/components/settings/ProtectedShippingSettings';
import ProtectedPaymentSettings from '@/components/settings/ProtectedPaymentSettings';
import ProtectedWhatsAppSettings from '@/components/settings/ProtectedWhatsAppSettings';
import DomainSettings from '@/components/settings/DomainSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import BannerManager from '@/components/settings/BannerManager';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('store');

  const breadcrumbs = [
    { href: '/', label: 'Dashboard' },
    { label: 'Configurações', current: true },
  ];

  return (
    <AppLayout 
      title="Configurações" 
      subtitle="Gerencie as configurações da sua loja"
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Loja</span>
            </TabsTrigger>
            <TabsTrigger value="catalog" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Catálogo</span>
            </TabsTrigger>
            <TabsTrigger value="banners" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Banners</span>
            </TabsTrigger>
            <TabsTrigger value="shipping" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Entrega</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Pagamento</span>
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger value="domain" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Domínio</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="store" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Informações da Loja
                </CardTitle>
                <CardDescription>
                  Gerencie as informações básicas da sua loja
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StoreInfoSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="catalog" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Configurações do Catálogo
                </CardTitle>
                <CardDescription>
                  Personalize a aparência, funcionamento e compartilhamento do seu catálogo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CatalogSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banners" className="space-y-6">
            <BannerManager />
          </TabsContent>

          <TabsContent value="shipping" className="space-y-6">
            <ProtectedShippingSettings />
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <ProtectedPaymentSettings />
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-6">
            <ProtectedWhatsAppSettings />
          </TabsContent>

          <TabsContent value="domain" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Configurações de Domínio
                </CardTitle>
                <CardDescription>
                  Configure seu domínio personalizado e URLs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DomainSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Configurações de Segurança
                </CardTitle>
                <CardDescription>
                  Gerencie a segurança e privacidade da sua loja
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SecuritySettings />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
