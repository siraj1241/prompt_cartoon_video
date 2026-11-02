/**
 * AI Provider Interfaces — contracts for all AI capabilities.
 *
 * Each interface defines the shape a provider must implement.
 * New providers can be added without modifying existing code.
 * See AI_PROVIDERS.md for the catalog of known providers.
 */

// ─── Common Types ──────────────────────────────────────────────

export interface ProviderCapabilities {
  /** Unique provider name (e.g. 'runway', 'pika', 'stable-video-diffusion') */
  name: string
  /** What this provider can do */
  capabilities: string[]
  /** Whether it requires a paid API key */
  requiresApiKey: boolean
  /** Whether it can run locally (no external API) */
  selfHostable: boolean
  /** Max output resolution */
  maxResolution: string
  /** Estimated cost per second of video (in USD, 0 = free) */
  costPerSecond: number
}

export interface GenerationRequest {
  prompt: string
  negativePrompt?: string
  /** Duration in seconds */
  duration?: number
  /** Frames per second */
  fps?: number
  resolution?: string
  /** Style preset (cinematic, anime, realistic, etc.) */
  style?: string
  /** Source language for translation/dubbing */
  sourceLanguage?: string
  /** Target language for translation/dubbing */
  targetLanguage?: string
  /** Additional provider-specific parameters */
  parameters?: Record<string, unknown>
}

export interface GenerationResult {
  /** Asset URL (S3 or local path) */
  url: string
  /** Thumbnail URL */
  thumbnail?: string
  /** Duration in seconds */
  duration?: number
  /** Resolution */
  resolution?: string
  /** MIME type */
  mimeType: string
  /** File size in bytes */
  size: number
  /** Provider-specific metadata */
  metadata?: Record<string, unknown>
}

export interface ProviderConfig {
  apiKey?: string
  baseUrl?: string
  timeout?: number
  retries?: number
}

// ─── Video Generation ───────────────────────────────────────────

export interface VideoProvider extends ProviderCapabilities {
  generateVideo(req: GenerationRequest, config?: ProviderConfig): Promise<GenerationResult>
}

// ─── Image Generation ──────────────────────────────────────────

export interface ImageProvider extends ProviderCapabilities {
  generateImage(req: GenerationRequest, config?: ProviderConfig): Promise<GenerationResult>
}

// ─── Voice / TTS ────────────────────────────────────────────────

export interface VoiceProvider extends ProviderCapabilities {
  /** Synthesize speech from text */
  textToSpeech(text: string, options: VoiceOptions): Promise<GenerationResult>
  /** Clone a voice from audio samples */
  cloneVoice(samples: string[], name: string): Promise<{ voiceId: string }>
}

export interface VoiceOptions {
  language: string
  voiceId?: string
  speed?: number
  pitch?: number
  emotion?: 'neutral' | 'happy' | 'sad' | 'excited' | 'calm'
}

// ─── Translation ────────────────────────────────────────────────

export interface TranslationProvider extends ProviderCapabilities {
  translateText(text: string, from: string, to: string): Promise<string>
  translateAudio(audioUrl: string, from: string, to: string): Promise<GenerationResult>
}

// ─── Dubbing (lip-sync) ─────────────────────────────────────────

export interface DubbingProvider extends ProviderCapabilities {
  dubVideo(videoUrl: string, targetLanguage: string, options?: DubbingOptions): Promise<GenerationResult>
}

export interface DubbingOptions {
  preserveOriginalVoice?: boolean
  voiceId?: string
  lipSync?: boolean
}

// ─── Subtitles / Captions ───────────────────────────────────────

export interface SubtitleProvider extends ProviderCapabilities {
  generateSubtitles(videoUrl: string, language: string): Promise<SubtitleCue[]>
}

export interface SubtitleCue {
  startTime: number  // seconds
  endTime: number
  text: string
}

// ─── Upscaling ──────────────────────────────────────────────────

export interface UpscalerProvider extends ProviderCapabilities {
  upscale(videoUrl: string, targetResolution: string): Promise<GenerationResult>
}

// ─── Provider Registry ──────────────────────────────────────────

export type ProviderType =
  | 'video'
  | 'image'
  | 'voice'
  | 'translation'
  | 'dubbing'
  | 'subtitle'
  | 'upscaler'

export interface ProviderRegistry {
  register(type: ProviderType, provider: unknown): void
  get<T>(type: ProviderType, name?: string): T | null
  list(type: ProviderType): unknown[]
}
