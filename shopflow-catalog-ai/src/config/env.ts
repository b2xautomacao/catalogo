import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Auto-map SUPABASE_SERVICE_ROLE_KEY to SUPABASE_SECRET_KEY if not explicitly provided
if (!process.env.SUPABASE_SECRET_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export const rawEnvSchema = z.object({
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SECRET_KEY: z.string().min(1, 'SUPABASE_SECRET_KEY cannot be empty'),
  MCP_AUTH_MODE: z.enum(['single_tenant', 'authenticated', 'streamable_http', 'remote']).default('single_tenant'),
  MCP_STORE_ID: z.string().uuid('MCP_STORE_ID must be a valid UUID').optional(),
  B2X_API_KEY: z.string().min(1, 'B2X_API_KEY cannot be empty').optional(),
  MCP_LOG_LEVEL: z.string().default('info'),
});

export const refinedEnvSchema = rawEnvSchema.superRefine((data, ctx) => {
  if (data.MCP_AUTH_MODE === 'single_tenant') {
    if (!data.MCP_STORE_ID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'MCP_STORE_ID is required when MCP_AUTH_MODE is single_tenant',
        path: ['MCP_STORE_ID'],
      });
    }
  } else if (data.MCP_AUTH_MODE === 'authenticated') {
    if (!data.B2X_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'B2X_API_KEY is required when MCP_AUTH_MODE is authenticated',
        path: ['B2X_API_KEY'],
      });
    }
  }
  // 'streamable_http' and 'remote' modes validate tokens per HTTP request (Bearer token)
});

export function validateEnv(input: Record<string, any>) {
  const normalized = {
    ...input,
    SUPABASE_SECRET_KEY: input.SUPABASE_SECRET_KEY || input.SUPABASE_SERVICE_ROLE_KEY,
  };
  return refinedEnvSchema.safeParse(normalized);
}

// In test environment, if process.env is incomplete, default to safe dummy values
const isTestEnv =
  process.env.NODE_ENV === 'test' ||
  process.argv.some((arg) => arg.includes('test')) ||
  process.env.npm_lifecycle_event === 'test';

const isHttpServer =
  process.env.RUN_HTTP_SERVER === 'true' ||
  process.env.MCP_PORT !== undefined ||
  process.argv.some((arg) => arg.includes('server-http'));

const defaultAuthMode = isHttpServer && !process.env.MCP_STORE_ID && !process.env.B2X_API_KEY
  ? 'streamable_http'
  : 'single_tenant';

const testDefaults = isTestEnv
  ? {
      SUPABASE_URL: 'https://test-placeholder.supabase.co',
      SUPABASE_SECRET_KEY: 'test-service-key',
      MCP_AUTH_MODE: 'single_tenant',
      MCP_STORE_ID: '00000000-0000-0000-0000-000000000000',
      MCP_LOG_LEVEL: 'info',
    }
  : {};

const parsedEnv = refinedEnvSchema.safeParse({
  MCP_AUTH_MODE: defaultAuthMode,
  ...testDefaults,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  ...process.env,
});

if (!parsedEnv.success && !isTestEnv) {
  console.error('Fatal Error: Invalid environment variables');
  console.error(parsedEnv.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n'));
  process.exit(1);
}

export const env = parsedEnv.success ? parsedEnv.data : (testDefaults as any);
