import React from "react";
import {
  Shield,
  Lock,
  CreditCard,
  Truck,
  CheckCircle,
  Award,
  Users,
  Star,
} from "lucide-react";

interface TrustBadgesProps {
  enabled?: boolean;
}

const TrustBadges: React.FC<TrustBadgesProps> = ({ enabled = true }) => {
  if (!enabled) return null;

  const badges = [
    {
      icon: <Shield className="h-5 w-5 text-green-600" />,
      title: "Compra 100% Segura",
      description: "Seus dados protegidos",
    },
    {
      icon: <Lock className="h-5 w-5 text-blue-600" />,
      title: "SSL Certificado",
      description: "Criptografia de ponta",
    },
    {
      icon: <CreditCard className="h-5 w-5 text-purple-600" />,
      title: "Pagamento Seguro",
      description: "PIX, cartão e mais",
    },
    {
      icon: <Truck className="h-5 w-5 text-orange-600" />,
      title: "Entrega Garantida",
      description: "Prazo respeitado",
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      title: "Satisfação Garantida",
      description: "30 dias para trocar",
    },
    {
      icon: <Award className="h-5 w-5 text-yellow-600" />,
      title: "Loja Verificada",
      description: "Empresa registrada",
    },
  ];

  const stats = [
    {
      icon: <Users className="h-4 w-4" />,
      value: "+15.000",
      label: "Clientes satisfeitos",
    },
    {
      icon: <Star className="h-4 w-4" />,
      title: "4.9",
      label: "Avaliação média",
    },
    {
      icon: <Shield className="h-4 w-4" />,
      value: "99.8%",
      label: "Entregas no prazo",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Badges principais - compactos */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg border">
        <h4 className="font-semibold text-sm text-gray-700 mb-3 text-center">
           Compra Protegida
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {badges.slice(0, 4).map((badge, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-white rounded border hover:shadow-sm transition-shadow"
            >
              {badge.icon}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-800 truncate">
                  {badge.title}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estatísticas sociais - mais compactas */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-3 rounded-lg border border-blue-200">
        <div className="flex items-center justify-around text-center">
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-blue-600">
                {stat.icon}
                <span className="font-bold text-sm">
                  {stat.value || stat.title}
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges de segurança - horizontal responsivo */}
      <div className="flex flex-wrap items-center justify-center gap-3 py-2 text-xs">
        <div className="flex items-center gap-1 text-gray-600 bg-white px-2 py-1 rounded border">
          <Lock className="h-3 w-3" />
          <span>SSL</span>
        </div>
        <div className="flex items-center gap-1 text-gray-600 bg-white px-2 py-1 rounded border">
          <Shield className="h-3 w-3" />
          <span>Seguro</span>
        </div>
        <div className="flex items-center gap-1 text-gray-600 bg-white px-2 py-1 rounded border">
          <CheckCircle className="h-3 w-3" />
          <span>Verificado</span>
        </div>
      </div>
    </div>
  );
};

export default TrustBadges;
