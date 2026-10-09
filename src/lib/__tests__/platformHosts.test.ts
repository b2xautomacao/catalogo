import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveHostname,
  isReservedPlatformSubdomain,
  validateTenantSlug,
  RESERVED_PLATFORM_SUBDOMAINS,
  PLATFORM_BASE_DOMAINS,
} from '../platformHosts.ts';

describe('Platform Hosts & Tenant Resolution Hardening', () => {
  describe('FASE B & C: Domain Policy & Reserved Subdomains', () => {
    it('deve conter os domínios base corretos', () => {
      assert.ok(PLATFORM_BASE_DOMAINS.includes('gargalozero.com.br'));
      assert.ok(PLATFORM_BASE_DOMAINS.includes('aoseudispor.com.br'));
    });

    it('deve identificar subdomínios reservados de forma case-insensitive e com whitespace', () => {
      assert.equal(isReservedPlatformSubdomain('mcp'), true);
      assert.equal(isReservedPlatformSubdomain('MCP'), true);
      assert.equal(isReservedPlatformSubdomain('  Mcp  '), true);
      assert.equal(isReservedPlatformSubdomain('www'), true);
      assert.equal(isReservedPlatformSubdomain('admin'), true);
      assert.equal(isReservedPlatformSubdomain('ADMIN'), true);
      assert.equal(isReservedPlatformSubdomain('api'), true);
      assert.equal(isReservedPlatformSubdomain('app'), true);

      // Lojas válidas não devem ser reservadas
      assert.equal(isReservedPlatformSubdomain('loja1'), false);
      assert.equal(isReservedPlatformSubdomain('calcados-silva'), false);
    });
  });

  describe('FASE K: Test Matrix de Resolução de Hostnames', () => {
    it('deve resolver loja1.gargalozero.com.br como tenant loja1', () => {
      const result = resolveHostname('loja1.gargalozero.com.br');
      assert.equal(result.type, 'tenant');
      if (result.type === 'tenant') {
        assert.equal(result.slug, 'loja1');
        assert.equal(result.baseDomain, 'gargalozero.com.br');
      }
    });

    it('deve resolver loja1.aoseudispor.com.br como tenant loja1', () => {
      const result = resolveHostname('loja1.aoseudispor.com.br');
      assert.equal(result.type, 'tenant');
      if (result.type === 'tenant') {
        assert.equal(result.slug, 'loja1');
        assert.equal(result.baseDomain, 'aoseudispor.com.br');
      }
    });

    it('deve resolver mcp.gargalozero.com.br como platform/mcp (NUNCA tenant)', () => {
      const result = resolveHostname('mcp.gargalozero.com.br');
      assert.equal(result.type, 'platform');
      if (result.type === 'platform') {
        assert.equal(result.service, 'mcp');
      }
      assert.notEqual(result.type, 'tenant');
    });

    it('deve resolver mcp.aoseudispor.com.br como platform/mcp reservado', () => {
      const result = resolveHostname('mcp.aoseudispor.com.br');
      assert.equal(result.type, 'platform');
      if (result.type === 'platform') {
        assert.equal(result.service, 'mcp');
      }
      assert.notEqual(result.type, 'tenant');
    });

    it('deve resolver admin.gargalozero.com.br como platform/admin', () => {
      const result = resolveHostname('admin.gargalozero.com.br');
      assert.equal(result.type, 'platform');
      if (result.type === 'platform') {
        assert.equal(result.service, 'admin');
      }
    });

    it('deve resolver api.gargalozero.com.br como platform/api', () => {
      const result = resolveHostname('api.gargalozero.com.br');
      assert.equal(result.type, 'platform');
      if (result.type === 'platform') {
        assert.equal(result.service, 'api');
      }
    });

    it('deve resolver app.gargalozero.com.br como platform/app', () => {
      const result = resolveHostname('app.gargalozero.com.br');
      assert.equal(result.type, 'platform');
      if (result.type === 'platform') {
        assert.equal(result.service, 'app');
      }
    });

    it('deve resolver www.gargalozero.com.br como platform/web', () => {
      const result = resolveHostname('www.gargalozero.com.br');
      assert.equal(result.type, 'platform');
      if (result.type === 'platform') {
        assert.equal(result.service, 'web');
      }
    });

    it('deve resolver gargalozero.com.br como root', () => {
      const result = resolveHostname('gargalozero.com.br');
      assert.equal(result.type, 'root');
    });

    it('deve resolver aoseudispor.com.br como root', () => {
      const result = resolveHostname('aoseudispor.com.br');
      assert.equal(result.type, 'root');
    });

    it('deve resolver domínio customizado desconhecido de forma segura', () => {
      const result = resolveHostname('minhaloja.com.br');
      assert.equal(result.type, 'custom_domain');
      if (result.type === 'custom_domain') {
        assert.equal(result.hostname, 'minhaloja.com.br');
      }
    });

    it('deve lidar corretamente com portas no hostname', () => {
      const result = resolveHostname('mcp.gargalozero.com.br:8080');
      assert.equal(result.type, 'platform');
      if (result.type === 'platform') {
        assert.equal(result.service, 'mcp');
      }
    });
  });

  describe('FASE L: Slug Validation Tests', () => {
    it('deve rejeitar subdomínios reservados (mcp, MCP, admin, api, app, www)', () => {
      const testCases = ['mcp', 'MCP', 'Mcp', '  mcp  ', 'admin', 'ADMIN', 'api', 'app', 'www'];

      for (const slug of testCases) {
        const validation = validateTenantSlug(slug);
        assert.equal(validation.valid, false, `Slug "${slug}" deveria ser rejeitado`);
        assert.equal(
          validation.error,
          'Este endereço é reservado pela plataforma. Escolha outro subdomínio.',
        );
      }
    });

    it('deve aceitar slugs de lojas legítimos', () => {
      const validCases = ['loja-nova', 'boutique-chic', 'calcados123', 'modas'];

      for (const slug of validCases) {
        const validation = validateTenantSlug(slug);
        assert.equal(validation.valid, true, `Slug "${slug}" deveria ser aceito`);
        assert.equal(validation.error, undefined);
      }
    });

    it('deve rejeitar slugs com caracteres inválidos ou comprimento impróprio', () => {
      assert.equal(validateTenantSlug('ab').valid, false); // < 3 chars
      assert.equal(validateTenantSlug('loja_com_underline').valid, false);
      assert.equal(validateTenantSlug('-loja-inicio-hifen').valid, false);
      assert.equal(validateTenantSlug('loja-fim-hifen-').valid, false);
    });
  });

  describe('FASE K1: Database Query Guard Verification', () => {
    it('garante que host reservado MCP jamais dispara consulta de tenant', async () => {
      let storeLookupCalled = false;
      const fakeStoreLookup = async (_slug: string) => {
        storeLookupCalled = true;
        return { id: 'store-123' };
      };

      // Simulação do pipeline do resolver com a regra de proteção
      const hostname = 'mcp.gargalozero.com.br';
      const resolution = resolveHostname(hostname);

      if (resolution.type === 'tenant') {
        await fakeStoreLookup(resolution.slug);
      }

      assert.equal(resolution.type, 'platform');
      assert.equal(storeLookupCalled, false, 'storeLookup NUNCA deve ser chamado para mcp host');
    });

    it('garante que tenant legítimo dispara consulta de tenant', async () => {
      let storeLookupCalled = false;
      let searchedSlug = '';
      const fakeStoreLookup = async (slug: string) => {
        storeLookupCalled = true;
        searchedSlug = slug;
        return { id: 'store-loja1' };
      };

      const hostname = 'loja1.gargalozero.com.br';
      const resolution = resolveHostname(hostname);

      if (resolution.type === 'tenant') {
        await fakeStoreLookup(resolution.slug);
      }

      assert.equal(resolution.type, 'tenant');
      assert.equal(storeLookupCalled, true);
      assert.equal(searchedSlug, 'loja1');
    });
  });
});
