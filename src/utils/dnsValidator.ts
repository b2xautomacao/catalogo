import { supabase } from '@/integrations/supabase/client';
import { validateTenantSlug } from '@/lib/platformHosts';

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
 * Valida formato de subdomínio utilizando a política central de hosts da plataforma
 */
export const validateSubdomain = (subdomain: string): { valid: boolean; error?: string } => {
  return validateTenantSlug(subdomain);
};

/**
 * Verifica disponibilidade de subdomínio
 */
export const checkSubdomainAvailability = async (
  subdomain: string, 
  excludeStoreId?: string
): Promise<{ available: boolean; error: string | null }> => {
  try {
    console.log('🔍 Verificando disponibilidade do subdomínio:', subdomain);

    const validation = validateTenantSlug(subdomain);
    if (!validation.valid) {
      return {
        available: false,
        error: validation.error || 'Este endereço é reservado pela plataforma. Escolha outro subdomínio.',
      };
    }
    
    let query = supabase
      .from('store_settings')
      .select('subdomain, store_id')
      .ilike('subdomain', subdomain);

    // Excluir a própria loja da verificação  
    if (excludeStoreId) {
      query = query.neq('store_id', excludeStoreId);
    }

    const { data, error } = await (query as any).maybeSingle();

    if (error) {
      console.error('❌ Erro ao verificar disponibilidade:', error);
      return { available: false, error: error.message };
    }

    const available = !data;
    
    if (available) {
      console.log('✅ Subdomínio disponível:', subdomain);
    } else {
      console.log('❌ Subdomínio em uso:', subdomain, 'por loja:', (data as any)?.store_id);
    }

    return {
      available,
      error: data ? 'Subdomínio já está sendo usado por outra loja' : null,
    };
  } catch (err) {
    console.error('💥 Erro ao verificar disponibilidade:', err);
    return {
      available: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido',
    };
  }
};

