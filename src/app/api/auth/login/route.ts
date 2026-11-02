/**
 * Login API route — authenticates a user with Supabase Auth.
 * POST /api/auth/login
 * Body: { email, password }
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY in .env' }, { status: 503 })
    }

    const { data, error } = await supabaseServer.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Login failed' }, { status: 500 })
  }
}
