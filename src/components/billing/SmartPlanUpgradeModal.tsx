
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Crown, Star, Zap, CreditCard, AlertTriangle, Info } from 'lucide-react';
import { useSubscriptionPlans, SubscriptionPlan } from '@/hooks/useSubscriptionPlans';
import { usePaymentGateways } from '@/hooks/usePaymentGateways';
import { useAuth } from '@/hooks/useAuth';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { toast } from 'sonner';

interface SmartPlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan?: SubscriptionPlan | null;
  currentPlan?: SubscriptionPlan | null;
}

const SmartPlanUpgradeModal: React.FC<SmartPlanUpgradeModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  currentPlan
}) => {
  const { plans, loading: plansLoading } = useSubscriptionPlans();
  const { activeGateway, loading: gatewayLoading, hasValidCredentials } = usePaymentGateways();
  const { profile } = useAuth();
  const { createCheckout, loading: paymentLoading, error: paymentError, hasCredentials } = useMercadoPago(profile?.store_id);
  const [processing, setProcessing] = useState(false);

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'basic': return <Star className="h-5 w-5 text-blue-600" />;
      case 'premium': return <Zap className="h-5 w-5 text-orange-600" />;
      case 'enterprise': return <Crown className="h-5 w-5 text-purple-600" />;
      default: return <Star className="h-5 w-5" />;
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'basic': return 'border-blue-200 bg-blue-50';
      case 'premium': return 'border-orange-200 bg-orange-50 ring-2 ring-orange-300';
      case 'enterprise': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const calculateUpgradeValue = (targetPlan: SubscriptionPlan) => {
    if (!currentPlan) return targetPlan.price_monthly;
    return targetPlan.price_monthly - currentPlan.price_monthly;
  };

  const canUpgradeToThis = (plan: SubscriptionPlan) => {
    if (!currentPlan) return true;
    
    const planHierarchy = { basic: 1, premium: 2, enterprise: 3 };
    return planHierarchy[plan.type] > planHierarchy[currentPlan.type];
  };

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (!activeGateway) {
      toast.error('Nenhum gateway de pagamento configurado. Entre em contato com o suporte.');
      return;
    }

    if (!profile?.store_id) {
      toast.error('Loja não identificada. Faça login novamente.');
      return;
    }

    // Verificar se tem credenciais válidas baseado no gateway ativo
    if (activeGateway.name === 'mercadopago') {
      if (!hasCredentials) {
        toast.error('Credenciais do Mercado Pago não configuradas. Configure nas configurações de pagamento.');
        return;
      }
    } else if (activeGateway.name === 'asaas') {
      if (!hasValidCredentials(activeGateway)) {
        toast.error('Credenciais do Asaas não configuradas adequadamente.');
        return;
      }
    } else if (activeGateway.name === 'stripe') {
      if (!hasValidCredentials(activeGateway)) {
        toast.error('Credenciais do Stripe não configuradas adequadamente.');
        return;
      }
    }

    setProcessing(true);
    
    try {
      const upgradeValue = calculateUpgradeValue(plan);
      
      if (activeGateway.name === 'mercadopago') {
        // Usar Mercado Pago
        const checkoutData = {
          items: [{
            id: plan.id,
            title: `Upgrade para ${plan.name}`,
            quantity: 1,
            unit_price: upgradeValue,
            currency_id: 'BRL'
          }],
          payer: {
            name: profile.full_name || 'Cliente',
            email: profile.email,
            phone: '11999999999' // Valor padrão já que phone não existe no UserProfile
          },
          back_urls: {
            success: `${window.location.origin}/payment-success?plan_id=${plan.id}`,
            failure: `${window.location.origin}/payment-failure`,
            pending: `${window.location.origin}/payment-pending?plan_id=${plan.id}`
          },
          auto_return: 'approved',
          external_reference: `upgrade_${profile.store_id}_${plan.id}_${Date.now()}`
        };

        const result = await createCheckout(checkoutData);
        
        if (result?.init_point) {
          toast.success('Redirecionando para pagamento...');
          window.open(result.init_point, '_blank');
          onClose();
        } else {
          throw new Error('Erro ao criar checkout do Mercado Pago');
        }
      } else {
        // Para outros gateways no futuro
        toast.info(`Integração com ${activeGateway.name} ainda não implementada.`);
      }
      
    } catch (error) {
      console.error('Erro no upgrade:', error);
      toast.error('Erro ao processar upgrade. Verifique suas configurações e tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  if (plansLoading || gatewayLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Carregando Planos...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Filtrar apenas planos que são upgrades do atual
  const availablePlans = plans.filter(plan => 
    plan.is_active && canUpgradeToThis(plan)
  );

  if (availablePlans.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nenhum Upgrade Disponível</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <Crown className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Você já possui o melhor plano disponível ou não há planos superiores para upgrade.
            </p>
            <Button onClick={onClose}>Entendi</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!activeGateway) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gateway Não Configurado</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              O sistema de pagamento não está configurado. Entre em contato com o suporte para realizar o upgrade.
            </p>
            <Button onClick={onClose}>Entendi</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            Fazer Upgrade do Seu Plano
          </DialogTitle>
          {currentPlan && (
            <div className="text-center">
              <p className="text-gray-600">
                Plano atual: <span className="font-semibold">{currentPlan.name}</span>
              </p>
              <Badge variant="outline" className="mt-2">
                R$ {currentPlan.price_monthly.toFixed(2)}/mês
              </Badge>
            </div>
          )}
        </DialogHeader>

        {/* Aviso sobre gateway ativo */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              Pagamentos processados via: <strong>{activeGateway?.name.toUpperCase()}</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {availablePlans.map((plan) => {
            const upgradeValue = calculateUpgradeValue(plan);
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${getPlanColor(plan.type)} ${
                  selectedPlan?.id === plan.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                {plan.type === 'premium' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-orange-500 text-white">Mais Popular</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    {getPlanIcon(plan.type)}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  
                  {currentPlan ? (
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">
                        +R$ {upgradeValue.toFixed(2)}
                        <span className="text-sm font-normal text-gray-600">/mês</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Total: R$ {plan.price_monthly.toFixed(2)}/mês
                      </div>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold">
                      R$ {plan.price_monthly.toFixed(2)}
                      <span className="text-sm font-normal text-gray-600">/mês</span>
                    </div>
                  )}
                  
                  {plan.price_yearly && (
                    <p className="text-sm text-gray-600">
                      ou R$ {plan.price_yearly.toFixed(2)}/ano
                    </p>
                  )}
                </CardHeader>

                <CardContent>
                  <p className="text-gray-600 mb-4 text-center min-h-[3rem]">
                    {plan.description}
                  </p>

                  <div className="space-y-3 mb-6">
                    {getPlanFeatures(plan.type).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={() => handleUpgrade(plan)}
                    disabled={processing || paymentLoading}
                    className="w-full"
                    variant={plan.type === 'premium' ? 'default' : 'outline'}
                  >
                    {processing ? 'Processando...' : `Upgrade por +R$ ${upgradeValue.toFixed(2)}/mês`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {paymentError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800">{paymentError}</span>
            </div>
          </div>
        )}

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Gateway ativo: {activeGateway.name.toUpperCase()}</p>
          <p>Cancelamento a qualquer momento • Suporte 24/7</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const getPlanFeatures = (planType: string): string[] => {
  const features = {
    basic: [
      'Até 3 imagens por produto',
      'Catálogo básico',
      'Suporte por email',
      '1 membro da equipe'
    ],
    premium: [
      'Até 10 imagens por produto',
      'Integração WhatsApp',
      'Agente de IA',
      'Pagamento PIX e Cartão',
      'Até 5 membros da equipe',
      'Cupons de desconto',
      'Calculadora de frete'
    ],
    enterprise: [
      'Imagens ilimitadas',
      'Todas as integrações',
      'IA avançada',
      'Domínio personalizado',
      'Equipe ilimitada',
      'Suporte dedicado',
      'API personalizada',
      'Relatórios avançados'
    ]
  };

  return features[planType as keyof typeof features] || [];
};

export default SmartPlanUpgradeModal;
