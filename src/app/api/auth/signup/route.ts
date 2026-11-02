/**
 * Signup API route — creates a new user in Supabase Auth.
 * POST /api/auth/signup
 * Body: { email, password, name? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY in .env' }, { status: 503 })
    }

    const { data, error } = await supabaseServer.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || email.split('@')[0] },
      email_confirm: true, // auto-confirm for demo (disable in production)
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Also sign in the user immediately
    const { data: signInData, error: signInError } = await supabaseServer.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      return NextResponse.json({ error: signInError.message }, { status: 400 })
    }

    return NextResponse.json({
      user: signInData.user,
      session: signInData.session,
    }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Signup failed' }, { status: 500 })
  }
}
