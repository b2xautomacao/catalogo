
import { useIsMobile } from '@/hooks/use-mobile';

export const useMobileWhatsApp = () => {
  const isMobile = useIsMobile();

  const openWhatsApp = (phoneNumber: string, message: string) => {
    console.log('📱 WhatsApp: Iniciando abertura do WhatsApp', { phoneNumber: phoneNumber.slice(0, 5) + '***', isMobile });
    
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    const phoneForLink = formattedPhone.length >= 10
      ? formattedPhone.startsWith('55')
        ? formattedPhone
        : `55${formattedPhone}`
      : '';

    if (!phoneForLink) {
      console.error('❌ WhatsApp: Número não configurado corretamente', { original: phoneNumber, formatted: formattedPhone });
      return false;
    }

    const whatsappUrl = `https://wa.me/${phoneForLink}?text=${encodeURIComponent(message)}`;
    console.log('🔗 WhatsApp: URL gerada', { url: whatsappUrl.substring(0, 50) + '...' });
    
    try {
      // Usar window.location.href universalmente (funciona melhor em todos os ambientes)
      console.log('🚀 WhatsApp: Redirecionando via window.location.href');
      window.location.href = whatsappUrl;
      console.log('✅ WhatsApp: Redirecionamento executado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ WhatsApp: Erro no redirecionamento', error);
      return false;
    }
  };

  return {
    isMobile,
    openWhatsApp
  };
};
