/**
 * Logout API route — signs the user out.
 * POST /api/auth/logout
 */

import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'

export async function POST() {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
    }

    const { error } = await supabaseServer.auth.signOut()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Logout failed' }, { status: 500 })
  }
}
