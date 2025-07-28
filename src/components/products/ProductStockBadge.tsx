import React from 'react';
import { Package } from 'lucide-react';

interface ProductStockBadgeProps {
  stock: number;
  stockAlertThreshold?: number;
  className?: string;
}

const ProductStockBadge: React.FC<ProductStockBadgeProps> = ({
  stock,
  stockAlertThreshold = 5,
  className = "",
}) => {
  const getBadgeColor = () => {
    if (stock === 0) return 'bg-red-500/90 text-white';
    if (stock <= stockAlertThreshold) return 'bg-amber-500/90 text-white';
    return 'bg-green-500/90 text-white';
  };

  return (
    <div className={`absolute bottom-2 left-2 ${getBadgeColor()} backdrop-blur-sm px-2.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/20 ${className}`}>
      <Package className="h-3 w-3" />
      <span className="text-xs font-semibold">{stock}</span>
    </div>
  );
};

export default ProductStockBadge;