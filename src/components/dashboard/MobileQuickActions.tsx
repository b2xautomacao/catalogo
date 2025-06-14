
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Package, ShoppingCart, Tag, Users } from 'lucide-react';

interface MobileQuickActionsProps {
  onNewProduct: () => void;
}

const MobileQuickActions = ({ onNewProduct }: MobileQuickActionsProps) => {
  const actions = [
    {
      title: 'Novo Produto',
      icon: Package,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: onNewProduct
    },
    {
      title: 'Ver Pedidos',
      icon: ShoppingCart,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => window.location.href = '/orders'
    },
    {
      title: 'Criar Cupom',
      icon: Tag,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => window.location.href = '/coupons'
    },
    {
      title: 'Ver Clientes',
      icon: Users,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => window.location.href = '/customers'
    }
  ];

  return (
    <Card className="md:hidden">
      <CardHeader>
        <CardTitle className="text-lg">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              className={`${action.color} text-white h-16 flex flex-col items-center justify-center gap-1 transition-all duration-200`}
            >
              <action.icon size={20} />
              <span className="text-xs font-medium">{action.title}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileQuickActions;
