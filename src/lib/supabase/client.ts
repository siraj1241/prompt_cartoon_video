/**
 * Supabase client wrappers.
 *
 * Two clients are needed because Next.js renders on both server and client:
 *   - server.ts  → for Route Handlers, Server Components, Server Actions
 *   - browser.ts → for Client Components (no service role key)
 *
 * Env vars (set in .env / Vercel project settings):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY  (server only — bypasses RLS)
 *
 * NOTE: We deliberately DON'T throw at module load time if env vars are missing,
 * because that would crash the entire app. Instead, the clients resolve to null
 * and callers receive a clean error message.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

const isMissingConfig = !supabaseUrl || !supabaseAnonKey

if (isMissingConfig && process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY in .env. ' +
    'See SUPABASE_SETUP.md for help.',
  )
}

/**
 * Browser-side Supabase client — uses the anon key, respects RLS.
 * Safe to import in Client Components.
 * Returns null if env vars are not set (callers should handle gracefully).
 */
export const supabaseBrowser: SupabaseClient | null = isMissingConfig
  ? null
  : createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })

/**
 * Server-side Supabase client — uses the service role key, bypasses RLS.
 * Only import in Server Components, Route Handlers, or Server Actions.
 * NEVER expose the service role key to the client.
 *
 * Falls back to the anon client (RLS applies) if the service role key is missing.
 */
export const supabaseServer: SupabaseClient | null = isMissingConfig
  ? null
  : (supabaseServiceRole
      ? createClient(supabaseUrl!, supabaseServiceRole, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : supabaseBrowser)

export type { SupabaseClient }
