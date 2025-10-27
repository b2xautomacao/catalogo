/**
 * Middleware de Validação de Domínio
 * Verifica status de domínios customizados antes de renderizar catálogo
 */

export interface DomainStatus {
  canRender: boolean;
  warnings: string[];
  errors: string[];
  sslStatus?: 'pending' | 'active' | 'failed';
}

export const validateDomainAccess = (storeSettings: any): DomainStatus => {
  const warnings: string[] = [];
  const errors: string[] = [];
  let canRender = true;

  const domainMode = storeSettings?.domain_mode || 'slug';

  // Modo: Domínio Próprio
  if (domainMode === 'custom_domain') {
    // Verificar se domínio está configurado
    if (!storeSettings?.custom_domain) {
      errors.push('Domínio próprio não configurado');
      canRender = false;
    }

    // Verificar se domínio está verificado
    if (!storeSettings?.custom_domain_verified) {
      warnings.push('Domínio próprio ainda não foi verificado via DNS');
      errors.push('Domínio não verificado. Configure o DNS conforme instruções no painel admin.');
      canRender = false;
    }

    // Verificar SSL
    if (storeSettings?.ssl_cert_status === 'failed') {
      warnings.push('Certificado SSL falhou. Configure com Let\'s Encrypt.');
    }

    if (storeSettings?.ssl_cert_status === 'pending') {
      warnings.push('Certificado SSL pendente. Execute certbot conforme instruções.');
    }
  }

  // Modo: Subdomínio
  if (domainMode === 'subdomain') {
    // Verificar se subdomínio está configurado
    if (!storeSettings?.subdomain) {
      errors.push('Subdomínio não configurado');
      canRender = false;
    }

    // Verificar se subdomínio está ativado
    if (!storeSettings?.subdomain_enabled) {
      errors.push('Subdomínio não está ativado. Ative nas configurações.');
      canRender = false;
    }
  }

  return {
    canRender,
    warnings,
    errors,
    sslStatus: storeSettings?.ssl_cert_status,
  };
};

/**
 * Componente de aviso para domínios não verificados
 */
export const DomainWarningMessage: React.FC<{
  status: DomainStatus;
  domainMode: string;
  domain?: string;
}> = ({ status, domainMode, domain }) => {
  if (status.canRender && status.warnings.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {status.errors.length > 0 ? 'Configuração Pendente' : 'Avisos de Configuração'}
          </h1>
          <p className="text-gray-600">
            {domainMode === 'custom_domain' 
              ? `Domínio: ${domain}`
              : `Subdomínio: ${domain}`
            }
          </p>
        </div>

        {status.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-red-900">Erros:</h3>
            <ul className="list-disc list-inside space-y-1">
              {status.errors.map((error, index) => (
                <li key={index} className="text-red-800 text-sm">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {status.warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-amber-900">Avisos:</h3>
            <ul className="list-disc list-inside space-y-1">
              {status.warnings.map((warning, index) => (
                <li key={index} className="text-amber-800 text-sm">{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-center space-y-3">
          <p className="text-sm text-gray-600">
            Para resolver esses problemas, acesse o painel administrativo:
          </p>
          <a
            href="https://app.aoseudispor.com.br/settings"
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Ir para Configurações
          </a>
        </div>
      </div>
    </div>
  );
};

