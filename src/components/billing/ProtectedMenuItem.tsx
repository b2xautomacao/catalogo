
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LucideIcon, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ProtectedMenuItemProps {
  name: string;
  href: string;
  icon: LucideIcon;
  benefitKey?: string;
  requiresPremium?: boolean;
  children?: React.ReactNode;
}

export const ProtectedMenuItem: React.FC<ProtectedMenuItemProps> = ({
  name,
  href,
  icon: Icon,
  benefitKey,
  requiresPremium = false,
  children
}) => {
  const location = useLocation();
  const { hasBenefit, subscription } = usePlanPermissions();
  
  const isActive = location.pathname === href;
  
  // Verificar se tem acesso ao benefício
  const hasAccess = benefitKey ? hasBenefit(benefitKey) : true;
  
  // Se requer premium mas não tem acesso, mostrar como bloqueado
  const isBlocked = requiresPremium && !hasAccess;

  const handleClick = (e: React.MouseEvent) => {
    if (isBlocked) {
      e.preventDefault();
      const planName = subscription?.plan.type === 'basic' ? 'Premium' : 'superior';
      toast.error(`Esta funcionalidade está disponível apenas no plano ${planName}. Faça upgrade para ter acesso!`);
    }
  };

  const baseClasses = 'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors';
  
  const activeClasses = isActive 
    ? 'bg-blue-100 text-blue-900'
    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';

  const blockedClasses = isBlocked 
    ? 'opacity-60 cursor-not-allowed'
    : '';

  return (
    <div className="relative">
      <Link
        to={href}
        onClick={handleClick}
        className={cn(baseClasses, activeClasses, blockedClasses)}
      >
        <div className="flex items-center flex-1">
          <Icon
            className={cn(
              'mr-3 h-5 w-5 flex-shrink-0',
              isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500',
              isBlocked && 'text-gray-300'
            )}
          />
          <span className="flex-1">{name}</span>
          
          {isBlocked && (
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-gray-400" />
              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                Premium
              </Badge>
            </div>
          )}
        </div>
      </Link>
      {children}
    </div>
  );
};
