// Audit logging helper for recording administrative actions and security events.

import type { SupabaseClient } from '@supabase/supabase-js'

/** Logs an administrative action to the admin_audit_log table. */
export async function logAdminAction(
  supabase: SupabaseClient,
  adminId: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  try {
    await supabase.from('admin_audit_log').insert({
      admin_id: adminId,
      action,
      entity,
      entity_id: entityId ?? null,
      details: details ?? null,
    })
  } catch (error) {
    // Non-blocking logging failure check
    console.error('Audit log failed:', error)
  }
}
