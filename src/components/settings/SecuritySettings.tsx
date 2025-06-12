
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Shield, Key, Eye, AlertTriangle } from 'lucide-react';

const SecuritySettings = () => {
  const { toast } = useToast();

  const handleChangePassword = () => {
    toast({
      title: "Senha alterada",
      description: "Sua senha foi atualizada com sucesso",
    });
  };

  const handle2FAToggle = () => {
    toast({
      title: "2FA atualizado",
      description: "Autenticação de dois fatores foi configurada",
    });
  };

  return (
    <div className="space-y-6">
      {/* Alteração de Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Alteração de Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Senha Atual:</label>
            <Input type="password" placeholder="Digite sua senha atual" />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Nova Senha:</label>
            <Input type="password" placeholder="Digite a nova senha" />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Confirmar Nova Senha:</label>
            <Input type="password" placeholder="Confirme a nova senha" />
          </div>

          <Button onClick={handleChangePassword} className="w-full">
            Alterar Senha
          </Button>
        </CardContent>
      </Card>

      {/* Autenticação de Dois Fatores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autenticação de Dois Fatores (2FA)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Ativar 2FA</p>
              <p className="text-sm text-muted-foreground">
                Adiciona uma camada extra de segurança à sua conta
              </p>
            </div>
            <Switch onCheckedChange={handle2FAToggle} />
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Importante</p>
                <p className="text-sm text-yellow-700">
                  Certifique-se de ter acesso ao seu aplicativo autenticador antes de ativar o 2FA
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessões Ativas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Sessões Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Chrome - Windows</p>
                <p className="text-sm text-muted-foreground">IP: 192.168.1.100 • Ativo agora</p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Atual
              </span>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Safari - iPhone</p>
                <p className="text-sm text-muted-foreground">IP: 192.168.1.101 • Há 2 horas</p>
              </div>
              <Button variant="outline" size="sm">
                Encerrar
              </Button>
            </div>

            <Button variant="destructive" className="w-full">
              Encerrar Todas as Outras Sessões
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Segurança */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Segurança</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Login automático</p>
              <p className="text-sm text-muted-foreground">Manter conectado por 30 dias</p>
            </div>
            <Switch defaultChecked={true} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notificar logins suspeitos</p>
              <p className="text-sm text-muted-foreground">Receber alerta sobre acessos não reconhecidos</p>
            </div>
            <Switch defaultChecked={true} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Logout automático</p>
              <p className="text-sm text-muted-foreground">Desconectar após 2 horas de inatividade</p>
            </div>
            <Switch defaultChecked={false} />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">IPs Permitidos (opcional):</label>
            <Input placeholder="192.168.1.0/24, 10.0.0.0/8" />
            <p className="text-xs text-muted-foreground mt-1">
              Deixe em branco para permitir acesso de qualquer IP
            </p>
          </div>
        </CardContent>
      </Card>

      <Button className="btn-primary w-full">
        Salvar Configurações de Segurança
      </Button>
    </div>
  );
};

export default SecuritySettings;
