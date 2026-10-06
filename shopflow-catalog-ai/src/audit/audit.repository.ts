import { supabase } from '../lib/supabase.js';

export interface CreateAuditLogEntry {
  session_id: string;
  principal_type: string;
  principal_id: string;
  store_id?: string | null;
  event_type: string;
  tool_name?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata?: Record<string, any>;
}

export class AuditRepository {
  async recordEvent(entry: CreateAuditLogEntry): Promise<void> {
    const { error } = await supabase
      .from('agent_audit_log')
      .insert({
        session_id: entry.session_id,
        principal_type: entry.principal_type,
        principal_id: entry.principal_id,
        store_id: entry.store_id || null,
        event_type: entry.event_type,
        tool_name: entry.tool_name || null,
        entity_type: entry.entity_type || null,
        entity_id: entry.entity_id || null,
        metadata: entry.metadata || {},
      });

    if (error) {
      console.error('[AuditRepository] Failed to persist audit event:', error.message);
    }
  }
}
