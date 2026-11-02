/**
 * Session API route — returns the current user session.
 * GET /api/auth/session
 */

import { NextResponse } from 'next/server'
import { supabaseBrowser } from '@/lib/supabase/client'

export async function GET() {
  try {
    if (!supabaseBrowser) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
    }

    const { data: { session }, error } = await supabaseBrowser.auth.getSession()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!session) {
      return NextResponse.json({ user: null, session: null })
    }

    return NextResponse.json({
      user: session.user,
      session,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Session check failed' }, { status: 500 })
  }
}
