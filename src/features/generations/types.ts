/**
 * Generation domain types — AI generation jobs stored in Supabase.
 */

export interface Generation {
  id: string
  user_id: string | null
  project_id: string | null
  type: GenerationType
  status: GenerationStatus
  provider: string
  prompt: string | null
  negative_prompt: string | null
  parameters: Record<string, unknown> | null
  language: string | null
  credits_used: number
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export type GenerationType =
  | 'TEXT_TO_VIDEO'
  | 'IMAGE_TO_VIDEO'
  | 'VIDEO_TO_VIDEO'
  | 'SCRIPT_TO_VIDEO'
  | 'IMAGE_GENERATION'
  | 'VOICE_SYNTHESIS'
  | 'DUBBING'
  | 'TRANSLATION'
  | 'SUBTITLES'
  | 'UPSCALING'
  | 'SUMMARIZATION'

export type GenerationStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED'

export interface CreateGenerationInput {
  type: GenerationType
  prompt: string
  provider?: string
  negative_prompt?: string
  parameters?: Record<string, unknown>
  language?: string
}
