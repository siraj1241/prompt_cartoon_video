'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Check, Loader2, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Todo {
  id: string
  title: string
  completed: boolean
  created_at: string
}

/**
 * Live Todo widget — proves the Supabase connection is wired up.
 * Users can create, complete, and delete todos; data persists in Supabase.
 *
 * This same pattern (route → repository → Supabase) will be used for
 * all future entities: projects, generations, assets, etc.
 */
export default function TodoWidget() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed'>('checking')

  const loadTodos = useCallback(async () => {
    try {
      const res = await fetch('/api/todos')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setTodos(data.todos ?? [])
      setConnectionStatus('connected')
      setError('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load'
      setError(msg)
      setConnectionStatus('failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTodos()
  }, [loadTodos])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setTodos((prev) => [data.todo, ...prev])
      setNewTitle('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (todo: Todo) => {
    // Optimistic update
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t)),
    )
    try {
      const res = await fetch(`/api/todos?id=${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch {
      // Revert on failure
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, completed: todo.completed } : t)),
      )
      setError('Failed to update — reverted')
    }
  }

  const handleDelete = async (id: string) => {
    const prev = todos
    setTodos((prev) => prev.filter((t) => t.id !== id))
    try {
      const res = await fetch(`/api/todos?id=${id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`)
    } catch {
      setTodos(prev)
      setError('Failed to delete — reverted')
    }
  }

  return (
    <section className="py-24 bg-card/30 backdrop-blur border-y border-border/40">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-300 border-green-500/20">
            <Database className="w-3 h-3 mr-1" />
            {connectionStatus === 'checking' && 'Checking Supabase…'}
            {connectionStatus === 'connected' && 'Supabase connected'}
            {connectionStatus === 'failed' && 'Supabase not connected'}
          </Badge>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
            Live Supabase demo
          </h2>
          <p className="mt-3 text-muted-foreground">
            Add a todo below — it persists in your Supabase database. Same pattern will be used for projects, generations, and assets.
          </p>
        </div>

        <Card className="p-6 border-border/60 shadow-xl">
          {/* Create form */}
          <form onSubmit={handleCreate} className="flex gap-2 mb-6">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What needs to be done?"
              disabled={submitting}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!newTitle.trim() || submitting}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </Button>
          </form>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Todo list */}
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading from Supabase…
            </div>
          ) : todos.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-sm">No todos yet. Add your first one above ☝️</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <AnimatePresence initial={false}>
                {todos.map((todo) => (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    layout
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-background hover:border-purple-500/30 transition-colors"
                  >
                    <button
                      onClick={() => handleToggle(todo)}
                      className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                        todo.completed
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-transparent'
                          : 'border-border hover:border-purple-500'
                      }`}
                      aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {todo.completed && <Check className="w-4 h-4 text-white" />}
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        todo.completed ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {todo.title}
                    </span>
                    <button
                      onClick={() => handleDelete(todo.id)}
                      className="flex-shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      aria-label="Delete todo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {todos.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/40 flex justify-between text-xs text-muted-foreground">
              <span>{todos.filter((t) => !t.completed).length} remaining</span>
              <span>{todos.length} total</span>
            </div>
          )}
        </Card>

        {connectionStatus === 'failed' && (
          <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-300">
            <strong>Setup needed:</strong> The Supabase env vars are missing or the{' '}
            <code className="px-1 py-0.5 rounded bg-amber-500/10 font-mono text-xs">todos</code>{' '}
            table hasn't been created yet. Run{' '}
            <code className="px-1 py-0.5 rounded bg-amber-500/10 font-mono text-xs">
              supabase/schema.sql
            </code>{' '}
            in the Supabase SQL Editor and set:
            <pre className="mt-2 p-2 rounded bg-background/50 font-mono text-xs overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
            </pre>
          </div>
        )}
      </div>
    </section>
  )
}
