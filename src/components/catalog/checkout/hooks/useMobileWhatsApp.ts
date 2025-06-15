
import { useIsMobile } from '@/hooks/use-mobile';

export const useMobileWhatsApp = () => {
  const isMobile = useIsMobile();

  const openWhatsApp = (phoneNumber: string, message: string) => {
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    const phoneForLink = formattedPhone.length >= 10
      ? formattedPhone.startsWith('55')
        ? formattedPhone
        : `55${formattedPhone}`
      : '';

    if (!phoneForLink) {
      console.error('❌ WhatsApp: Número não configurado corretamente');
      return false;
    }

    const whatsappUrl = `https://wa.me/${phoneForLink}?text=${encodeURIComponent(message)}`;
    
    if (isMobile) {
      // No mobile, usar location.href para abrir o app diretamente
      console.log('📱 Mobile: Abrindo WhatsApp app diretamente');
      window.location.href = whatsappUrl;
    } else {
      // No desktop, usar window.open para WhatsApp Web
      console.log('💻 Desktop: Abrindo WhatsApp Web');
      window.open(whatsappUrl, '_blank');
    }
    
    return true;
  };

  return {
    isMobile,
    openWhatsApp
  };
};
