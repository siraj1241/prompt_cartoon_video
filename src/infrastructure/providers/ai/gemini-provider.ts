/**
 * Google AI Studio (Gemini) provider — implements the AI provider interface.
 *
 * Uses the Gemini API for:
 *   - Text generation (gemini-2.0-flash or gemini-1.5-pro)
 *   - Image understanding (vision — analyze uploaded images)
 *   - Script-to-storyboard (structured JSON output)
 *
 * Get your API key from: https://aistudio.google.com/apikey
 * Set env var: GOOGLE_AI_STUDIO_KEY
 *
 * Note: True text-to-VIDEO generation via Gemini is not yet publicly
 * available (Google's Veo is separate). For now, this provider handles
 * the text/script/storyboard parts of the pipeline. Video generation
 * requires Runway/Pika/Stable-Video-Diffusion (see AI_PROVIDERS.md).
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = process.env.GOOGLE_AI_STUDIO_KEY

let client: GoogleGenerativeAI | null = null

function getClient() {
  if (!API_KEY) {
    throw new Error(
      'GOOGLE_AI_STUDIO_KEY is not set. Get a key from https://aistudio.google.com/apikey ' +
      'and set it in your .env or Vercel environment variables.',
    )
  }
  if (!client) {
    client = new GoogleGenerativeAI(API_KEY)
  }
  return client
}

export interface GeminiResult {
  text: string
  model: string
  promptTokens?: number
  completionTokens?: number
}

/**
 * Generate text from a prompt using Gemini.
 *
 * @param prompt     The user's prompt
 * @param model      Gemini model to use (default: gemini-2.0-flash)
 * @param system     Optional system instruction
 * @param maxTokens  Max output tokens (default: 2048)
 */
export async function generateText(
  prompt: string,
  options?: {
    model?: string
    system?: string
    maxTokens?: number
    temperature?: number
  },
): Promise<GeminiResult> {
  const c = getClient()
  const modelName = options?.model || 'gemini-2.0-flash'

  const model = c.getGenerativeModel({
    model: modelName,
    systemInstruction: options?.system,
    generationConfig: {
      maxOutputTokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.7,
    },
  })

  const result = await model.generateContent(prompt)
  const response = result.response
  const text = response.text()

  return {
    text,
    model: modelName,
    promptTokens: response.usageMetadata?.promptTokenCount,
    completionTokens: response.usageMetadata?.candidatesTokenCount,
  }
}

/**
 * Generate a structured storyboard from a script prompt.
 * Returns JSON with scene descriptions, durations, and visual cues.
 */
export async function generateStoryboard(prompt: string): Promise<{
  scenes: Array<{
    order: number
    title: string
    description: string
    duration: number
    visualCues: string[]
    narration: string
  }>
  totalDuration: number
  estimatedCredits: number
}> {
  const systemInstruction = `You are a professional video storyboard artist.
Given a prompt, create a detailed storyboard with 3-5 scenes.
Return ONLY valid JSON (no markdown, no explanation) with this shape:
{
  "scenes": [
    {
      "order": 1,
      "title": "Scene title",
      "description": "Visual description of what happens",
      "duration": 5,
      "visualCues": ["cinematic", "wide shot", "golden hour"],
      "narration": "Voiceover text for this scene"
    }
  ],
  "totalDuration": 20,
  "estimatedCredits": 5
}`

  const result = await generateText(prompt, {
    model: 'gemini-2.0-flash',
    system: systemInstruction,
    maxTokens: 4096,
    temperature: 0.8,
  })

  // Parse the JSON response (Gemini sometimes wraps in ```json blocks)
  let jsonText = result.text.trim()
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.slice(7)
  }
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.slice(3)
  }
  if (jsonText.endsWith('```')) {
    jsonText = jsonText.slice(0, -3)
  }

  try {
    return JSON.parse(jsonText.trim())
  } catch {
    // If JSON parsing fails, return a single-scene fallback
    return {
      scenes: [{
        order: 1,
        title: 'Main scene',
        description: result.text.slice(0, 500),
        duration: 15,
        visualCues: ['cinematic'],
        narration: prompt,
      }],
      totalDuration: 15,
      estimatedCredits: 3,
    }
  }
}

/**
 * Analyze an image (for image-to-video pipeline — describes what's in the image
 * so the video provider can animate it).
 */
export async function analyzeImage(
  imageBase64: string,
  mimeType: string,
  question = 'Describe this image in detail for a video generation pipeline. What are the key visual elements, mood, colors, and composition?',
): Promise<GeminiResult> {
  const c = getClient()
  const model = c.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const result = await model.generateContent([
    { text: question },
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ])

  return {
    text: result.response.text(),
    model: 'gemini-2.0-flash',
  }
}

/**
 * Check if the Gemini API key is configured.
 */
export function isGeminiConfigured(): boolean {
  return !!API_KEY
}

export const PROVIDER_INFO = {
  name: 'google-gemini',
  capabilities: ['text-generation', 'image-understanding', 'storyboard', 'script-to-video'],
  requiresApiKey: true,
  selfHostable: false,
  maxResolution: 'n/a (text model)',
  costPerSecond: 0, // Gemini has a free tier
  models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
} as const
