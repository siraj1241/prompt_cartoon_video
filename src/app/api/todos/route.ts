/**
 * Todo API route handlers — CRUD operations on the todos table.
 *
 * Uses the repository pattern: route → service → repository → Supabase.
 * This same structure will be used for projects, generations, etc.
 *
 * Endpoints:
 *   GET    /api/todos         → list all todos
 *   POST   /api/todos         → create a todo
 *   PATCH  /api/todos?id=...  → update a todo
 *   DELETE /api/todos?id=...  → delete a todo
 */

import { NextRequest, NextResponse } from 'next/server'
import { listTodos, createTodo, updateTodo, deleteTodo } from '@/features/todos/repository'

// GET /api/todos
export async function GET() {
  try {
    const todos = await listTodos()
    return NextResponse.json({ todos })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch todos'
    const isConfig = msg.includes('not configured')
    return NextResponse.json({ error: msg }, { status: isConfig ? 503 : 500 })
  }
}

// POST /api/todos
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body?.title || typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }
    const todo = await createTodo({ title: body.title.trim() })
    return NextResponse.json({ todo }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create todo'
    const isConfig = msg.includes('not configured')
    return NextResponse.json({ error: msg }, { status: isConfig ? 503 : 500 })
  }
}

// PATCH /api/todos?id=...
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id query param required' }, { status: 400 })

    const body = await req.json()
    const updates: Record<string, unknown> = {}
    if (typeof body.title === 'string') updates.title = body.title
    if (typeof body.completed === 'boolean') updates.completed = body.completed

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const todo = await updateTodo(id, updates)
    return NextResponse.json({ todo })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update todo'
    const isConfig = msg.includes('not configured')
    return NextResponse.json({ error: msg }, { status: isConfig ? 503 : 500 })
  }
}

// DELETE /api/todos?id=...
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id query param required' }, { status: 400 })

    await deleteTodo(id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete todo'
    const isConfig = msg.includes('not configured')
    return NextResponse.json({ error: msg }, { status: isConfig ? 503 : 500 })
  }
}
