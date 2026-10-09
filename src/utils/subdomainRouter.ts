/**
 * Utility functions for SaaS subdomain routing
 * Handles dynamic subdomain detection and routing logic
 */

import { resolveHostname, validateTenantSlug } from '@/lib/platformHosts';

export interface SubdomainInfo {
  isSubdomain: boolean;
  subdomain: string | null;
  isMainApp: boolean;
  isMcpPlatform: boolean;
  hostname: string;
}

/**
 * Extract subdomain information from current hostname.
 * Evaluates reserved platform hosts (e.g. mcp.gargalozero.com.br) BEFORE tenant resolution.
 */
export const getSubdomainInfo = (): SubdomainInfo => {
  const hostname = window.location.hostname;
  const resolution = resolveHostname(hostname);

  // 1. Host de Infraestrutura MCP da Plataforma (mcp.gargalozero.com.br, etc.)
  if (resolution.type === 'platform' && resolution.service === 'mcp') {
    return {
      isSubdomain: false,
      subdomain: null,
      isMainApp: false,
      isMcpPlatform: true,
      hostname,
    };
  }

  // 2. Tenant Subdomain (loja1.gargalozero.com.br, etc.)
  if (resolution.type === 'tenant') {
    return {
      isSubdomain: true,
      subdomain: resolution.slug,
      isMainApp: false,
      isMcpPlatform: false,
      hostname,
    };
  }

  // 3. Outros hosts de plataforma, root, custom_domain, development
  return {
    isSubdomain: false,
    subdomain: null,
    isMainApp: true,
    isMcpPlatform: false,
    hostname,
  };
};

/**
 * Check if current context should show catalog
 */
export const shouldShowCatalog = (): boolean => {
  const { isSubdomain } = getSubdomainInfo();
  return isSubdomain;
};

/**
 * Check if current context should show admin interface
 */
export const shouldShowAdmin = (): boolean => {
  const { isMainApp } = getSubdomainInfo();
  return isMainApp;
};

/**
 * Get the appropriate redirect URL for tenant catalog
 */
export const getTenantCatalogUrl = (tenantSlug: string): string => {
  const baseUrl = window.location.protocol + '//' + window.location.host;
  
  // If tenantSlug is provided, construct the tenant URL
  if (tenantSlug) {
    return `https://${tenantSlug}.aoseudispor.com.br`;
  }
  
  // Fallback to slug-based URL
  return `${baseUrl}/catalog/${tenantSlug}`;
};

/**
 * Get canonical URL for sharing/SEO
 */
export const getCanonicalUrl = (tenantSlug: string, path: string = ''): string => {
  const { isSubdomain, subdomain } = getSubdomainInfo();
  
  if (isSubdomain && subdomain) {
    return `https://${subdomain}.aoseudispor.com.br${path}`;
  }
  
  return `https://app.aoseudispor.com.br/catalog/${tenantSlug}${path}`;
};

/**
 * Validate subdomain format for tenant registration using centralized policy
 */
export const validateSubdomainFormat = (subdomain: string): { valid: boolean; error?: string } => {
  return validateTenantSlug(subdomain);
};

/**
 * Debug information for development
 */
export const getSubdomainDebugInfo = () => {
  const info = getSubdomainInfo();
  const resolution = resolveHostname(window.location.hostname);
  
  return {
    ...info,
    resolution,
    pathname: window.location.pathname,
    port: window.location.port,
    protocol: window.location.protocol,
    timestamp: new Date().toISOString()
  };
};

/**
 * Log subdomain info for debugging (development only)
 */
export const logSubdomainInfo = () => {
  if (process.env.NODE_ENV === 'development') {
    console.group('🌐 Subdomain Router Debug');
    console.table(getSubdomainDebugInfo());
    console.groupEnd();
  }
};
