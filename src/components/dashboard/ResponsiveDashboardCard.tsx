
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
  const getCardVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'dashboard-card-primary';
      case 'secondary':
        return 'dashboard-card-secondary';
      case 'success':
        return 'dashboard-card-success';
      case 'warning':
        return 'dashboard-card-warning';
      default:
        return 'dashboard-card-primary';
    }
  };

  return (
    <div 
      className={`dashboard-card ${getCardVariantClass()} ${onClick ? 'cursor-pointer' : ''} 
                  transition-all duration-300 ease-out transform-gpu group`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4 md:mb-5">
        <div className="flex-1 min-w-0">
          <p className="text-white/90 text-sm md:text-base font-semibold truncate mb-1">
            {title}
          </p>
        </div>
        <div className="dashboard-card-icon">
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
        <div className="dashboard-progress-bar">
          <div 
            className={`dashboard-progress-fill ${
              trend.isPositive ? 'dashboard-progress-positive' : 'dashboard-progress-negative'
            }`}
            style={{ 
              width: `${Math.min(Math.abs(trend.value), 100)}%`,
            }}
          />
        </div>
      )}

      {/* Overlay Hover Effect */}
      {onClick && (
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300 rounded-2xl pointer-events-none" />
      )}
    </div>
  );
};

export default ResponsiveDashboardCard;
