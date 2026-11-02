/**
 * Todo repository — data access layer using Supabase.
 *
 * This is the pattern to follow for ALL entities (User, Project, Generation, etc.):
 *   - Repository handles DB operations only (no business logic)
 *   - Service layer depends on the repository interface
 *   - API route validates input + calls service
 */

import { supabaseServer } from '@/lib/supabase/client'
import type { Todo, CreateTodoInput, UpdateTodoInput } from './types'

const TABLE = 'todos'

function getClientOrThrow() {
  if (!supabaseServer) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY in .env ' +
      '(see SUPABASE_SETUP.md).',
    )
  }
  return supabaseServer
}

export async function listTodos(): Promise<Todo[]> {
  const client = getClientOrThrow()
  const { data, error } = await client
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Todo[]
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const client = getClientOrThrow()
  const { data, error } = await client
    .from(TABLE)
    .insert({ title: input.title })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Todo
}

export async function updateTodo(id: string, input: UpdateTodoInput): Promise<Todo> {
  const client = getClientOrThrow()
  const { data, error } = await client
    .from(TABLE)
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Todo
}

export async function deleteTodo(id: string): Promise<void> {
  const client = getClientOrThrow()
  const { error } = await client
    .from(TABLE)
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}
