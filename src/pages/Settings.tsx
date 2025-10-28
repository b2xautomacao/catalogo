import React, { useState } from "react";
import {
  Settings as SettingsIcon,
  Store,
  Palette,
  Truck,
  CreditCard,
  MessageSquare,
  Globe,
  Shield,
  Image,
  ArrowLeftRight,
  DollarSign,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import StoreInfoSettings from "@/components/settings/StoreInfoSettings";
import CatalogSettings from "@/components/settings/CatalogSettings";
import ProtectedShippingSettings from "@/components/settings/ProtectedShippingSettings";
import ProtectedPaymentSettings from "@/components/settings/ProtectedPaymentSettings";
import ProtectedWhatsAppSettings from "@/components/settings/ProtectedWhatsAppSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import BannerManager from "@/components/settings/BannerManager";
import MinimumPurchaseConfig from "@/components/settings/MinimumPurchaseConfig";
import PricingModeSelector from "@/components/products/PricingModeSelector";
import PriceModelDebug from "@/components/debug/PriceModelDebug";
import ButtonTest from "@/components/debug/ButtonTest";

import { useStoreData } from "@/hooks/useStoreData";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("store");

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9">
          <TabsTrigger value="store" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Loja</span>
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Catálogo</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Preços</span>
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
                Personalize a aparência, funcionamento e compartilhamento do seu
                catálogo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CatalogSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PricingModeSelector />
            <MinimumPurchaseConfig />
          </div>
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
          {/* DomainSettings agora está em CatalogSettings > Aba Domínios */}
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
  );
};

export default Settings;
