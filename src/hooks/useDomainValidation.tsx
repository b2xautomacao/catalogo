
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DomainValidationResult {
  isValid: boolean;
  isAvailable: boolean;
  errors: string[];
  suggestions?: string[];
  verificationToken?: string;
  status?: 'pending' | 'verified' | 'failed';
}

export const useDomainValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const { profile } = useAuth();

  const validateDomain = useCallback(async (domain: string): Promise<DomainValidationResult> => {
    setIsValidating(true);
    
    try {
      // Remove protocol if present
      const cleanDomain = domain.replace(/^https?:\/\//, '').toLowerCase().trim();
      
      if (!cleanDomain) {
        return {
          isValid: true,
          isAvailable: true,
          errors: []
        };
      }
      
      const errors: string[] = [];
      const suggestions: string[] = [];

      // Basic format validation
      const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
      
      if (!domainRegex.test(cleanDomain)) {
        errors.push('Formato de domínio inválido');
        suggestions.push('Use o formato: www.seusite.com.br');
        suggestions.push('Exemplo: loja.meudominio.com');
      }

      // Check domain length
      if (cleanDomain.length > 253) {
        errors.push('Domínio muito longo (máximo 253 caracteres)');
      }

      // Check for forbidden domains
      const forbiddenDomains = [
        'localhost',
        '127.0.0.1',
        'example.com',
        'test.com',
        'google.com',
        'facebook.com',
        'instagram.com',
        'youtube.com',
        'twitter.com',
        'github.com',
        'lovable.dev',
        'vercel.app',
        'netlify.app',
        'herokuapp.com'
      ];

      const isForbidden = forbiddenDomains.some(forbidden => 
        cleanDomain === forbidden || 
        cleanDomain.endsWith('.' + forbidden) ||
        cleanDomain.includes(forbidden)
      );

      if (isForbidden) {
        errors.push('Este domínio não pode ser usado');
        suggestions.push('Use seu próprio domínio registrado');
      }

      // Check for suspicious patterns
      const suspiciousPatterns = [
        /paypal/i,
        /banco/i,
        /itau/i,
        /bradesco/i,
        /caixa/i,
        /nubank/i,
        /mercadopago/i,
        /pix/i
      ];

      if (suspiciousPatterns.some(pattern => pattern.test(cleanDomain))) {
        errors.push('Domínio pode ser considerado suspeito ou enganoso');
      }

      // Check if domain is already in use by another store
      if (errors.length === 0 && profile?.store_id) {
        const { data: existingStores, error } = await supabase
          .from('store_settings')
          .select('store_id')
          .eq('custom_domain', cleanDomain)
          .neq('store_id', profile.store_id);

        if (error) {
          console.error('Erro ao verificar domínio:', error);
          errors.push('Erro ao verificar disponibilidade do domínio');
        } else if (existingStores && existingStores.length > 0) {
          errors.push('Este domínio já está sendo usado por outra loja');
          suggestions.push('Tente uma variação: ' + cleanDomain.replace('www.', 'loja.'));
        }
      }

      return {
        isValid: errors.length === 0,
        isAvailable: errors.length === 0,
        errors,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        verificationToken: errors.length === 0 ? `verify-${Math.random().toString(36).substr(2, 9)}` : undefined
      };

    } catch (error) {
      console.error('Erro na validação de domínio:', error);
      return {
        isValid: false,
        isAvailable: false,
        errors: ['Erro interno na validação']
      };
    } finally {
      setIsValidating(false);
    }
  }, [profile?.store_id]);

  const validateSlug = useCallback((slug: string): DomainValidationResult => {
    const errors: string[] = [];
    const suggestions: string[] = [];

    if (!slug.trim()) {
      return {
        isValid: true,
        isAvailable: true,
        errors: []
      };
    }

    const cleanSlug = slug.trim().toLowerCase();

    // Basic validation
    if (cleanSlug.length < 3) {
      errors.push('URL deve ter pelo menos 3 caracteres');
    }

    if (cleanSlug.length > 50) {
      errors.push('URL deve ter no máximo 50 caracteres');
    }

    // Only allow letters, numbers, and hyphens
    const slugRegex = /^[a-zA-Z0-9-]+$/;
    if (!slugRegex.test(cleanSlug)) {
      errors.push('URL deve conter apenas letras, números e hífens');
      suggestions.push('Exemplo: minha-loja-online');
    }

    // Cannot start or end with hyphen
    if (cleanSlug.startsWith('-') || cleanSlug.endsWith('-')) {
      errors.push('URL não pode começar ou terminar com hífen');
    }

    // Cannot have consecutive hyphens
    if (cleanSlug.includes('--')) {
      errors.push('URL não pode ter hífens consecutivos');
    }

    // Reserved words
    const reservedWords = [
      'admin', 'api', 'www', 'mail', 'ftp', 'localhost', 'root',
      'support', 'help', 'about', 'contact', 'terms', 'privacy',
      'login', 'register', 'dashboard', 'app', 'assets', 'static',
      'public', 'private', 'secure', 'ssl', 'cdn', 'cache',
      'webhook', 'callback', 'oauth', 'auth', 'user', 'users'
    ];

    if (reservedWords.includes(cleanSlug)) {
      errors.push('Esta URL é reservada pelo sistema');
      suggestions.push(`Use: ${cleanSlug}-loja ou minha-${cleanSlug}`);
    }

    return {
      isValid: errors.length === 0,
      isAvailable: errors.length === 0,
      errors,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }, []);

  return {
    validateDomain,
    validateSlug,
    isValidating
  };
};
