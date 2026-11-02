/**
 * Generation repository — CRUD on the `generations` table in Supabase.
 *
 * Same pattern as the todos repository. When a real AI provider is wired
 * up (Runway, Pika, etc.), the service layer will:
 *   1. createGeneration()  → insert row with status='QUEUED'
 *   2. dispatch to the AI provider (async)
 *   3. updateGeneration() → status='PROCESSING' when started
 *   4. updateGeneration() → status='COMPLETED' with output asset URL when done
 */

import { supabaseServer } from '@/lib/supabase/client'
import type { Generation, CreateGenerationInput } from './types'

const TABLE = 'generations'

function getClientOrThrow() {
  if (!supabaseServer) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY in .env (see SUPABASE_SETUP.md).',
    )
  }
  return supabaseServer
}

export async function listGenerations(limit = 50): Promise<Generation[]> {
  const client = getClientOrThrow()
  const { data, error } = await client
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []) as Generation[]
}

export async function getGeneration(id: string): Promise<Generation | null> {
  const client = getClientOrThrow()
  const { data, error } = await client.from(TABLE).select('*').eq('id', id).single()
  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(error.message)
  }
  return data as Generation
}

export async function createGeneration(input: CreateGenerationInput): Promise<Generation> {
  const client = getClientOrThrow()
  const { data, error } = await client
    .from(TABLE)
    .insert({
      type: input.type,
      prompt: input.prompt,
      provider: input.provider || 'demo',
      negative_prompt: input.negative_prompt || null,
      parameters: input.parameters || null,
      language: input.language || null,
      status: 'QUEUED',
      credits_used: 1,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Generation
}

export async function updateGenerationStatus(
  id: string,
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED',
  errorMessage?: string,
): Promise<Generation> {
  const client = getClientOrThrow()
  const updates: Record<string, unknown> = {
    status,
    started_at: status === 'PROCESSING' ? new Date().toISOString() : undefined,
    completed_at: status === 'COMPLETED' || status === 'FAILED' ? new Date().toISOString() : undefined,
    error_message: errorMessage || null,
  }
  // Remove undefined values
  Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k])

  const { data, error } = await client.from(TABLE).update(updates).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data as Generation
}
