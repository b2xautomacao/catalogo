/**
 * platformHosts.ts
 *
 * Single Source of Truth for Platform Domains, Reserved Subdomains,
 * and Hostname Classification in B2XCATALOGO.
 *
 * Enforces strict separation between platform infrastructure hosts
 * (such as mcp.gargalozero.com.br) and merchant tenant subdomains.
 */

export const PLATFORM_BASE_DOMAINS = [
  'gargalozero.com.br',
  'aoseudispor.com.br',
] as const;

export type PlatformBaseDomain = typeof PLATFORM_BASE_DOMAINS[number];

/**
 * Strict set of reserved platform subdomains.
 * Merchants CANNOT use these as store slugs or subdomains.
 */
export const RESERVED_PLATFORM_SUBDOMAINS = new Set([
  'mcp',
  'www',
  'app',
  'admin',
  'api',
  'mail',
  'ftp',
  'status',
  'portal',
  'dashboard',
  'auth',
  'root',
  'system',
  'static',
  'cdn',
  'media',
  'assets',
  'files',
  'uploads',
  'downloads',
  'backup',
  'test',
  'staging',
  'dev',
  'demo',
  'support',
  'help',
  'docs',
  'shop',
  'store',
  'billing',
  'pay',
]);

export type PlatformService = 'mcp' | 'app' | 'admin' | 'api' | 'web';

export type HostResolution =
  | {
      type: 'platform';
      service: PlatformService;
      subdomain: string;
      baseDomain: PlatformBaseDomain;
      hostname: string;
    }
  | {
      type: 'tenant';
      slug: string;
      baseDomain: PlatformBaseDomain;
      hostname: string;
    }
  | {
      type: 'root';
      baseDomain: PlatformBaseDomain;
      hostname: string;
    }
  | {
      type: 'custom_domain';
      hostname: string;
    }
  | {
      type: 'development';
      hostname: string;
    };

/**
 * Normalizes and checks if a given subdomain or slug is reserved by the platform.
 * Case-insensitive and trimmed.
 */
export function isReservedPlatformSubdomain(subdomain: string | null | undefined): boolean {
  if (!subdomain) return false;
  const normalized = subdomain.trim().toLowerCase();
  return RESERVED_PLATFORM_SUBDOMAINS.has(normalized);
}

/**
 * Resolves a hostname into a strongly typed HostResolution.
 * Evaluates reserved platform hosts BEFORE any tenant resolution.
 */
export function resolveHostname(rawHostname: string | null | undefined): HostResolution {
  const hostname = (rawHostname || '').trim().toLowerCase().split(':')[0]; // Strip port if present

  if (!hostname || hostname === 'localhost' || hostname.startsWith('127.0.0.1') || hostname.startsWith('192.168.')) {
    return {
      type: 'development',
      hostname: hostname || 'localhost',
    };
  }

  for (const baseDomain of PLATFORM_BASE_DOMAINS) {
    // 1. Exact match with root domain (e.g. gargalozero.com.br)
    if (hostname === baseDomain) {
      return {
        type: 'root',
        baseDomain,
        hostname,
      };
    }

    // 2. Subdomain of platform base domain (e.g. *.gargalozero.com.br)
    const suffix = `.${baseDomain}`;
    if (hostname.endsWith(suffix)) {
      const prefix = hostname.slice(0, -suffix.length);
      // Handle first-level subdomain segment (e.g. 'mcp' in 'mcp.gargalozero.com.br')
      const subdomain = prefix.split('.')[0];

      if (isReservedPlatformSubdomain(subdomain)) {
        let service: PlatformService = 'app';
        if (subdomain === 'mcp') service = 'mcp';
        else if (subdomain === 'admin') service = 'admin';
        else if (subdomain === 'api') service = 'api';
        else if (subdomain === 'www') service = 'web';

        return {
          type: 'platform',
          service,
          subdomain,
          baseDomain,
          hostname,
        };
      }

      // Valid tenant subdomain
      return {
        type: 'tenant',
        slug: subdomain,
        baseDomain,
        hostname,
      };
    }
  }

  // 3. Third-party Custom Domain (e.g. www.lojadopedro.com.br)
  return {
    type: 'custom_domain',
    hostname,
  };
}

/**
 * Validates a candidate store subdomain or slug against platform rules and reserved blocklist.
 */
export function validateTenantSlug(slugCandidate: string | null | undefined): {
  valid: boolean;
  error?: string;
} {
  if (!slugCandidate || slugCandidate.trim() === '') {
    return { valid: false, error: 'Subdomínio não pode ser vazio' };
  }

  const slug = slugCandidate.trim().toLowerCase();

  if (slug.length < 3) {
    return { valid: false, error: 'Subdomínio deve ter pelo menos 3 caracteres' };
  }

  if (slug.length > 63) {
    return { valid: false, error: 'Subdomínio deve ter no máximo 63 caracteres' };
  }

  const formatRegex = /^[a-z0-9-]+$/;
  if (!formatRegex.test(slug)) {
    return { valid: false, error: 'Apenas letras minúsculas, números e hífen são permitidos' };
  }

  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { valid: false, error: 'Subdomínio não pode começar ou terminar com hífen' };
  }

  if (isReservedPlatformSubdomain(slug)) {
    return {
      valid: false,
      error: 'Este endereço é reservado pela plataforma. Escolha outro subdomínio.',
    };
  }

  return { valid: true };
}
