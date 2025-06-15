
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Phone, Bot } from 'lucide-react';
import { WhatsAppIntegration } from '@/components/settings/WhatsAppIntegration';

const WhatsAppSettings = () => {
  return (
    <div className="space-y-6">
      {/* Integração WhatsApp Automática */}
      <WhatsAppIntegration />
      
      <Separator />

      {/* Configurações manuais (mantidas para compatibilidade) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Configurações Manuais do WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp_number">Número do WhatsApp</Label>
            <Input
              id="whatsapp_number"
              placeholder="(11) 99999-9999"
              type="tel"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Integração Manual Ativa</Label>
              <p className="text-sm text-muted-foreground">
                Ativar redirecionamento manual para WhatsApp
              </p>
            </div>
            <Switch />
          </div>

          <div className="pt-4">
            <Button>Salvar Configurações</Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações sobre tipos de integração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Tipos de Integração WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-green-600 mb-2">🤖 Integração Automática</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Notificações automáticas de pedidos</li>
                <li>• QR Code para conexão</li>
                <li>• Mensagens personalizadas</li>
                <li>• Status em tempo real</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-blue-600 mb-2">📱 Integração Manual</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Redirecionamento para WhatsApp</li>
                <li>• Número fixo configurado</li>
                <li>• Mensagem básica de pedido</li>
                <li>• Processo manual</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppSettings;
