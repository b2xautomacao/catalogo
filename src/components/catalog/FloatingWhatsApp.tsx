
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingWhatsAppProps {
  phoneNumber: string;
  message?: string;
}

const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({ 
  phoneNumber, 
  message = "Olá! Gostaria de mais informações sobre os produtos." 
}) => {
  const handleWhatsAppClick = () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Button
        onClick={handleWhatsAppClick}
        size="lg"
        className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 shadow-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center p-0"
      >
        <MessageCircle className="h-8 w-8 text-white" />
      </Button>
    </div>
  );
};

export default FloatingWhatsApp;
