import { supabase } from '@/integrations/supabase/client';

const VERIFICATION_PREFIX = '_vendmais-verification';
const DNS_API_URL = 'https://dns.google.com/resolve';

/**
 * Gera token único de verificação para domínio
 */
export const generateVerificationToken = (): string => {
  return `vendmais-${crypto.randomUUID()}`;
};

/**
 * Gera token e salva no banco
 */
export const generateDomainVerificationToken = async (
  storeId: string,
  domain: string
): Promise<{ token: string; error: string | null }> => {
  try {
    const token = generateVerificationToken();

    const { error } = await supabase
      .from('store_settings')
      .update({
        custom_domain: domain.toLowerCase(),
        custom_domain_verification_token: token,
        custom_domain_verified: false,
        custom_domain_verified_at: null,
      } as any)
      .eq('store_id', storeId);

    if (error) {
      console.error('Erro ao salvar token de verificação:', error);
      return { token: '', error: error.message };
    }

    console.log('✅ Token de verificação gerado:', token);

    return { token, error: null };
  } catch (err) {
    console.error('Erro ao gerar token:', err);
    return { 
      token: '', 
      error: err instanceof Error ? err.message : 'Erro desconhecido' 
    };
  }
};

/**
 * Verifica registro TXT no DNS usando Google Public DNS API
 */
export const checkDNSVerification = async (
  domain: string,
  expectedToken: string
): Promise<{ verified: boolean; error: string | null; records?: string[] }> => {
  try {
    console.log('🔍 Verificando DNS para:', domain);
    console.log('🔑 Token esperado:', expectedToken);

    // Montar nome completo do registro TXT
    const recordName = `${VERIFICATION_PREFIX}.${domain}`;

    // Consultar DNS via Google Public DNS API
    const url = `${DNS_API_URL}?name=${encodeURIComponent(recordName)}&type=TXT`;
    
    console.log('📡 Consultando DNS:', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    console.log('📋 Resposta DNS:', data);

    // Verificar se há registros TXT
    if (!data.Answer || data.Answer.length === 0) {
      console.warn('⚠️ Nenhum registro TXT encontrado');
      return {
        verified: false,
        error: `Registro TXT não encontrado para ${recordName}`,
        records: [],
      };
    }

    // Extrair valores dos registros TXT
    const txtRecords = data.Answer
      .filter((record: any) => record.type === 16) // type 16 = TXT
      .map((record: any) => {
        // Remover aspas do valor
        const value = record.data.replace(/^"(.*)"$/, '$1');
        return value;
      });

    console.log('📝 Registros TXT encontrados:', txtRecords);

    // Verificar se token está presente
    const verified = txtRecords.some((record: string) => 
      record.includes(expectedToken)
    );

    if (verified) {
      console.log('✅ Token de verificação encontrado no DNS!');
    } else {
      console.warn('❌ Token de verificação NÃO encontrado nos registros');
    }

    return {
      verified,
      error: verified ? null : 'Token de verificação não encontrado nos registros DNS',
      records: txtRecords,
    };

  } catch (err) {
    console.error('💥 Erro ao verificar DNS:', err);
    return {
      verified: false,
      error: err instanceof Error ? err.message : 'Erro ao consultar DNS',
      records: [],
    };
  }
};

/**
 * Verifica DNS e atualiza status no banco
 */
export const verifyAndUpdateDomain = async (
  storeId: string,
  domain: string,
  token: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // Verificar DNS
    const dnsResult = await checkDNSVerification(domain, token);

    if (!dnsResult.verified) {
      return {
        success: false,
        error: dnsResult.error || 'Verificação falhou',
      };
    }

    // Atualizar banco
    const { error } = await supabase
      .from('store_settings')
      .update({
        custom_domain_verified: true,
        custom_domain_verified_at: new Date().toISOString(),
      } as any)
      .eq('store_id', storeId);

    if (error) {
      console.error('Erro ao atualizar verificação:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ Domínio verificado e atualizado no banco!');

    return {
      success: true,
      error: null,
    };

  } catch (err) {
    console.error('Erro na verificação completa:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido',
    };
  }
};

/**
 * Valida formato de subdomínio
 */
export const validateSubdomain = (subdomain: string): { valid: boolean; error?: string } => {
  // Regex: apenas letras minúsculas, números e hífen
  const regex = /^[a-z0-9-]+$/;

  if (!subdomain || subdomain.trim() === '') {
    return { valid: false, error: 'Subdomínio não pode ser vazio' };
  }

  if (subdomain.length < 3) {
    return { valid: false, error: 'Subdomínio deve ter pelo menos 3 caracteres' };
  }

  if (subdomain.length > 63) {
    return { valid: false, error: 'Subdomínio deve ter no máximo 63 caracteres' };
  }

  if (!regex.test(subdomain)) {
    return { valid: false, error: 'Apenas letras, números e hífen são permitidos' };
  }

  if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
    return { valid: false, error: 'Subdomínio não pode começar ou terminar com hífen' };
  }

  // Subdomínios reservados
  const reserved = ['www', 'app', 'admin', 'api', 'mail', 'ftp', 'blog', 'shop', 'store'];
  if (reserved.includes(subdomain.toLowerCase())) {
    return { valid: false, error: 'Este subdomínio está reservado pelo sistema' };
  }

  return { valid: true };
};

/**
 * Verifica disponibilidade de subdomínio
 */
export const checkSubdomainAvailability = async (subdomain: string): Promise<{ available: boolean; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('subdomain')
      .ilike('subdomain', subdomain)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return { available: false, error: error.message };
    }

    return {
      available: !data,
      error: data ? 'Subdomínio já está em uso' : null,
    };
  } catch (err) {
    return {
      available: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido',
    };
  }
};

