
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
  const getCardClass = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'secondary':
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
    }
  };

  return (
    <div 
      className={`${getCardClass()} rounded-xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-xs md:text-sm font-medium mb-1 md:mb-2 truncate">
            {title}
          </p>
          <div className="flex items-end gap-2 mb-1">
            <h3 className="text-xl md:text-3xl font-bold text-white truncate">
              {value}
            </h3>
            {trend && (
              <span className={`text-xs md:text-sm font-medium ${
                trend.isPositive ? 'text-green-200' : 'text-red-200'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-white/70 text-xs md:text-sm truncate">
              {subtitle}
            </p>
          )}
        </div>
        <div className="ml-2 md:ml-4 flex-shrink-0">
          <div className="bg-white/20 p-2 md:p-3 rounded-lg">
            <Icon size={20} className="text-white md:w-6 md:h-6" />
          </div>
        </div>
      </div>
      
      {trend && (
        <div className="mt-3 md:mt-4">
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                trend.isPositive ? 'bg-green-300' : 'bg-red-300'
              }`}
              style={{ width: `${Math.min(Math.abs(trend.value), 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponsiveDashboardCard;
