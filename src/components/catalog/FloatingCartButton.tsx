
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

interface FloatingCartButtonProps {
  onClick?: () => void;
  className?: string;
}

const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({
  onClick,
  className = ""
}) => {
  const { totalItems } = useCart();

  if (totalItems === 0) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Button
        size="lg"
        onClick={onClick}
        className="relative h-14 w-14 rounded-full shadow-lg hover:shadow-xl bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-110 border-2 border-white/10"
      >
        <ShoppingCart className="h-6 w-6 text-white" />
        
        {/* Counter Badge */}
        <Badge
          className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-white text-xs font-bold flex items-center justify-center p-0 border-2 border-white shadow-md min-w-6"
        >
          {totalItems > 99 ? "99+" : totalItems}
        </Badge>
      </Button>
    </div>
  );
};

export default FloatingCartButton;
