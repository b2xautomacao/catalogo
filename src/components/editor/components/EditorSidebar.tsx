
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layout, Palette, Settings, ShoppingCart, Zap, Layers } from 'lucide-react';
import HeaderSettings from './settings/HeaderSettings';
import ProductCardSettings from './settings/ProductCardSettings';
import CheckoutSettings from './settings/CheckoutSettings';
import GlobalSettings from './settings/GlobalSettings';
import SectionsManager from './settings/SectionsManager';
import { TemplateSelector } from './TemplateSelector';
import { CheckoutEditorPanel } from './CheckoutEditorPanel';

const EditorSidebar: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Editor Visual Avançado</h2>
        <p className="text-sm text-gray-600">Personalize e otimize sua loja</p>
      </div>

      <Tabs defaultValue="templates" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-6 m-4 text-xs">
          <TabsTrigger value="templates" className="flex flex-col gap-1 py-3">
            <Palette size={14} />
            <span>Templates</span>
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex flex-col gap-1 py-3">
            <Layout size={14} />
            <span>Layout</span>
          </TabsTrigger>
          <TabsTrigger value="checkout" className="flex flex-col gap-1 py-3">
            <ShoppingCart size={14} />
            <span>Checkout</span>
          </TabsTrigger>
          <TabsTrigger value="conversion" className="flex flex-col gap-1 py-3">
            <Zap size={14} />
            <span>Conversão</span>
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex flex-col gap-1 py-3">
            <Layers size={14} />
            <span>Seções</span>
          </TabsTrigger>
          <TabsTrigger value="global" className="flex flex-col gap-1 py-3">
            <Settings size={14} />
            <span>Global</span>
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            <TabsContent value="templates" className="space-y-6 mt-0">
              <TemplateSelector />
            </TabsContent>

            <TabsContent value="layout" className="space-y-6 mt-0">
              <HeaderSettings />
              <ProductCardSettings />
            </TabsContent>

            <TabsContent value="checkout" className="space-y-6 mt-0">
              <CheckoutEditorPanel />
            </TabsContent>

            <TabsContent value="conversion" className="space-y-6 mt-0">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Otimização de Conversão</h3>
                  <p className="text-sm text-gray-600">
                    Configure elementos para aumentar suas vendas
                  </p>
                </div>
                {/* Será expandido com mais configurações */}
                <CheckoutSettings />
              </div>
            </TabsContent>

            <TabsContent value="sections" className="space-y-6 mt-0">
              <SectionsManager />
            </TabsContent>

            <TabsContent value="global" className="space-y-6 mt-0">
              <GlobalSettings />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default EditorSidebar;
