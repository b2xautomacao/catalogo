import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Settings, 
  Eye, 
  BarChart3, 
  Tag, 
  Package,
  ExternalLink,
  Palette,
  Users,
  Lock,
  Truck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface QuickActionsProps {
  onNewProduct: () => void;
}

const QuickActions = ({ onNewProduct }: QuickActionsProps) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { hasBenefit, isSuperadmin } = usePlanPermissions();

  const actions = [
    {
      title: 'Novo Produto',
      description: 'Adicionar produto ao catálogo',
      icon: Plus,
      color: 'bg-blue-100 text-blue-600',
      onClick: onNewProduct,
      requiresBenefit: null
    },
    {
      title: 'Ver Catálogo',
      description: 'Visualizar como cliente',
      icon: Eye,
      color: 'bg-green-100 text-green-600',
      onClick: () => {
        if (profile?.store_id) {
          window.open(`/catalog/${profile.store_id}`, '_blank');
        }
      },
      requiresBenefit: null
    },
    {
      title: 'Configurações',
      description: 'Ajustes da loja',
      icon: Settings,
      color: 'bg-gray-100 text-gray-600',
      onClick: () => navigate('/settings'),
      requiresBenefit: null
    },
    {
      title: 'Relatórios',
      description: 'Análises e métricas',
      icon: BarChart3,
      color: 'bg-purple-100 text-purple-600',
      onClick: () => navigate('/reports'),
      requiresBenefit: 'dedicated_support'
    },
    {
      title: 'Cupons',
      description: 'Gerenciar descontos',
      icon: Tag,
      color: 'bg-orange-100 text-orange-600',
      onClick: () => navigate('/coupons'),
      requiresBenefit: 'discount_coupons'
    },
    {
      title: 'Calculadora de Frete',
      description: 'Configurar entrega',
      icon: Truck,
      color: 'bg-indigo-100 text-indigo-600',
      onClick: () => navigate('/deliveries'),
      requiresBenefit: 'shipping_calculator'
    }
  ];

  const handleActionClick = (action: typeof actions[0]) => {
    if (action.requiresBenefit && !isSuperadmin && !hasBenefit(action.requiresBenefit)) {
      toast.error(`Esta funcionalidade está disponível apenas no plano Premium. Faça upgrade para ter acesso!`);
      return;
    }
    action.onClick();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {actions.map((action) => {
            const isBlocked = action.requiresBenefit && !isSuperadmin && !hasBenefit(action.requiresBenefit);
            
            return (
              <Button
                key={action.title}
                variant="outline"
                className={`h-auto p-3 flex flex-col items-center gap-2 hover:shadow-md transition-all relative ${
                  isBlocked ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                onClick={() => handleActionClick(action)}
              >
                <div className={`p-2 rounded-lg ${action.color} relative`}>
                  <action.icon className="h-5 w-5" />
                  {isBlocked && (
                    <Lock className="h-3 w-3 absolute -top-1 -right-1 text-orange-500" />
                  )}
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-sm font-medium">{action.title}</p>
                    {isBlocked && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                        Premium
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
