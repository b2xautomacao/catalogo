
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ResponsiveDashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
  onClick?: () => void;
}

const ResponsiveDashboardCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  variant = 'primary',
  onClick 
}: ResponsiveDashboardCardProps) => {
  const getCardClasses = () => {
    const baseClasses = "relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ease-out";
    const interactiveClasses = onClick ? 'cursor-pointer hover:transform hover:scale-102 hover:-translate-y-1' : '';
    
    let variantClasses = '';
    switch (variant) {
      case 'primary':
        variantClasses = 'bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/25';
        break;
      case 'secondary':
        variantClasses = 'bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg shadow-slate-500/25';
        break;
      case 'success':
        variantClasses = 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25';
        break;
      case 'warning':
        variantClasses = 'bg-gradient-to-br from-amber-500 to-red-500 shadow-lg shadow-amber-500/25';
        break;
    }
    
    return `${baseClasses} ${variantClasses} ${interactiveClasses}`;
  };

  const getIconContainerClass = () => {
    return "flex-shrink-0 w-14 h-14 md:w-16 md:h-16 lg:w-18 lg:h-18 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/30 transition-all duration-300 ease-out hover:bg-white/30 hover:scale-105";
  };

  return (
    <div 
      className={getCardClasses()}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4 md:mb-5">
        <div className="flex-1 min-w-0">
          <p className="text-white/90 text-sm md:text-base font-semibold truncate mb-1">
            {title}
          </p>
        </div>
        <div className={getIconContainerClass()}>
          <Icon className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-sm" />
        </div>
      </div>

      {/* Valor principal e trend */}
      <div className="flex items-end justify-between mb-3 md:mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-white text-3xl md:text-4xl xl:text-5xl font-bold leading-none tracking-tight truncate drop-shadow-sm">
            {value}
          </h3>
        </div>
        {trend && (
          <div className="flex items-center ml-3">
            <span className={`text-sm md:text-base font-bold flex items-center gap-1 ${
              trend.isPositive ? 'text-green-200' : 'text-red-200'
            } drop-shadow-sm`}>
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-white/80 text-sm md:text-base truncate mb-4 md:mb-5 font-medium">
          {subtitle}
        </p>
      )}
      
      {/* Progress bar para trend */}
      {trend && (
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
          <div 
            className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${
              trend.isPositive ? 'bg-gradient-to-r from-green-300 to-emerald-400' : 'bg-gradient-to-r from-red-300 to-rose-400'
            }`}
            style={{ 
              width: `${Math.min(Math.abs(trend.value), 100)}%`,
            }}
          />
        </div>
      )}

      {/* Overlay Hover Effect */}
      {onClick && (
        <div className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-all duration-300 rounded-2xl pointer-events-none" />
      )}
    </div>
  );
};

export default ResponsiveDashboardCard;
