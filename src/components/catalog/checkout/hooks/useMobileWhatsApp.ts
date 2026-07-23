
import { useIsMobile } from '@/hooks/use-mobile';

export const useMobileWhatsApp = () => {
  const isMobile = useIsMobile();

  const openWhatsApp = (phoneNumber: string, message: string) => {
    console.log(' WhatsApp: Iniciando abertura do WhatsApp', {
      phoneNumber: phoneNumber.slice(0, 5) + '***', 
      isMobile,
      userAgent: navigator.userAgent
    });
    
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    const phoneForLink = formattedPhone.length >= 10
      ? formattedPhone.startsWith('55')
        ? formattedPhone
        : `55${formattedPhone}`
      : '';

    if (!phoneForLink) {
      console.error(' WhatsApp: Número não configurado corretamente', { original: phoneNumber, formatted: formattedPhone });
      return false;
    }

    const whatsappUrl = `https://wa.me/${phoneForLink}?text=${encodeURIComponent(message)}`;
    console.log(' WhatsApp: URL gerada', { url: whatsappUrl.substring(0, 50) + '...' });
    
    try {
      if (isMobile) {
        // Mobile: Redirecionar diretamente para abrir o app WhatsApp
        console.log(' WhatsApp: Redirecionamento mobile via window.location.href');
        window.location.href = whatsappUrl;
        console.log(' WhatsApp: Redirecionamento mobile executado');
        return true;
      } else {
        // Desktop: Abrir em nova aba para não sair da página
        console.log(' WhatsApp: Abertura desktop em nova aba');
        const newWindow = window.open(whatsappUrl, '_blank');
        
        if (newWindow) {
          console.log(' WhatsApp: Nova aba aberta com sucesso');
          return true;
        } else {
          // Fallback se popup bloqueado
          console.warn(' WhatsApp: Popup bloqueado, usando fallback');
          window.location.href = whatsappUrl;
          return true;
        }
      }
    } catch (error) {
      console.error(' WhatsApp: Erro no redirecionamento', error);
      
      // Fallback universal
      try {
        console.log(' WhatsApp: Tentando fallback universal');
        window.location.href = whatsappUrl;
        return true;
      } catch (fallbackError) {
        console.error(' WhatsApp: Falha total no redirecionamento', fallbackError);
        return false;
      }
    }
  };

  return {
    isMobile,
    openWhatsApp
  };
};
