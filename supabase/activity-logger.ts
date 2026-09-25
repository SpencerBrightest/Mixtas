// Activity logger writing database operations, server actions, and webhook payloads to supabase/activity.log for debugging.

import fs from 'fs'
import path from 'path'

const LOG_FILE_PATH = path.join(process.cwd(), 'supabase', 'activity.log')

/** Logs a backend database activity or debugging message to supabase/activity.log */
export function logSupabaseActivity(
  category: 'QUERY' | 'ACTION' | 'WEBHOOK' | 'ERROR' | 'AUTH',
  message: string,
  details?: Record<string, unknown>
) {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] [${category}] ${message}${
    details ? `\nDetails: ${JSON.stringify(details, null, 2)}` : ''
  }\n--------------------------------------------------\n`

  try {
    // Ensure supabase directory exists
    const dir = path.dirname(LOG_FILE_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.appendFileSync(LOG_FILE_PATH, logEntry, 'utf-8')
  } catch (err) {
    console.error('Failed to append to activity.log:', err)
  }
}
