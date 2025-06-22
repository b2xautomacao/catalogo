
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
    return `dashboard-card dashboard-card-${variant}`;
  };

  return (
    <div 
      className={`${getCardVariantClass()} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ flex: '1', minWidth: '0' }}>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.9)', 
            fontSize: '0.875rem', 
            fontWeight: '600', 
            marginBottom: '0.25rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {title}
          </p>
        </div>
        <div className="dashboard-card-icon">
          <Icon size={28} style={{ color: 'white', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }} />
        </div>
      </div>

      {/* Valor principal e trend */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ flex: '1', minWidth: '0' }}>
          <h3 style={{ 
            color: 'white', 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            lineHeight: '1',
            letterSpacing: '-0.025em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
          }}>
            {value}
          </h3>
        </div>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: '0.75rem' }}>
            <span style={{
              fontSize: '0.875rem',
              fontWeight: '700',
              color: trend.isPositive ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
            }}>
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.8)', 
          fontSize: '0.875rem',
          fontWeight: '500',
          marginBottom: '1.25rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
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
        <div style={{
          position: 'absolute',
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
          background: 'rgba(255, 255, 255, 0)',
          borderRadius: '1.5rem',
          pointerEvents: 'none',
          transition: 'all 0.3s ease'
        }} />
      )}
    </div>
  );
};

export default ResponsiveDashboardCard;
