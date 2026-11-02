/**
 * Todo domain types.
 */

export interface Todo {
  id: string
  user_id: string | null
  title: string
  completed: boolean
  created_at: string
  updated_at: string
}

export interface CreateTodoInput {
  title: string
}

export interface UpdateTodoInput {
  title?: string
  completed?: boolean
}
