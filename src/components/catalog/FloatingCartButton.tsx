
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
        className="relative h-16 w-16 rounded-full shadow-2xl border-2 border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-3xl animate-fade-in"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 80%)',
        }}
      >
        <ShoppingCart className="h-8 w-8 text-white" />
        
        {/* Counter Badge */}
        <Badge
          className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-red-500 text-white text-sm font-bold flex items-center justify-center p-0 border-2 border-white shadow-lg animate-scale-in"
        >
          {totalItems > 99 ? "99+" : totalItems}
        </Badge>
      </Button>
      
      {/* Pulse Effect */}
      <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
    </div>
  );
};

export default FloatingCartButton;
