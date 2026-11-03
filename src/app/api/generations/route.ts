/**
 * Generations API route — create AI generation jobs + generate images.
 *
 * When GOOGLE_AI_STUDIO_KEY is set:
 *   1. Creates a DB record
 *   2. Calls Gemini for storyboard (3-5 scenes)
 *   3. For each scene, fetches an AI-generated image from Pollinations.ai (FREE, no API key)
 *   4. Returns scenes with image URLs
 *
 * If Gemini key is not set:
 *   - Creates a basic storyboard from the prompt
 *   - Still fetches images from Pollinations.ai
 */

import { NextRequest, NextResponse } from 'next/server'
import { listGenerations, createGeneration, updateGenerationStatus } from '@/features/generations/repository'
import { generateStoryboard, isGeminiConfigured } from '@/infrastructure/providers/ai/gemini-provider'
import type { GenerationType } from '@/features/generations/types'

const VALID_TYPES: GenerationType[] = [
  'TEXT_TO_VIDEO', 'IMAGE_TO_VIDEO', 'VIDEO_TO_VIDEO', 'SCRIPT_TO_VIDEO',
  'IMAGE_GENERATION', 'VOICE_SYNTHESIS', 'DUBBING', 'TRANSLATION',
  'SUBTITLES', 'UPSCALING', 'SUMMARIZATION',
]

/**
 * Generate an image URL from Pollinations.ai (free, no API key needed).
 * Returns a URL that can be used directly in <img src="...">.
 */
function generateImageUrl(prompt: string, width = 1280, height = 720, seed?: number): string {
  const encodedPrompt = encodeURIComponent(prompt)
  const s = seed ?? Math.floor(Math.random() * 1000000)
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${s}&nologo=true&model=flux`
}

/**
 * Fetch an image from Pollinations.ai and return as base64.
 * This ensures the image is loaded before returning to the client.
 */
async function fetchImageAsBase64(prompt: string, seed: number): Promise<string | null> {
  const url = generateImageUrl(prompt, 1280, 720, seed)
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    return `data:image/jpeg;base64,${Buffer.from(buf).toString('base64')}`
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const generations = await listGenerations()
    return NextResponse.json({ generations })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch generations'
    const isConfig = msg.includes('not configured')
    return NextResponse.json({ error: msg }, { status: isConfig ? 503 : 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body?.prompt || typeof body.prompt !== 'string' || !body.prompt.trim()) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }
    if (!body.type || !VALID_TYPES.includes(body.type)) {
      return NextResponse.json(
        { error: `type must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 },
      )
    }

    const prompt = body.prompt.trim()

    // Step 1: Create the generation record in Supabase
    let generation
    try {
      generation = await createGeneration({
        type: body.type,
        prompt,
        provider: isGeminiConfigured() ? 'google-gemini' : 'demo',
        parameters: body.parameters,
        language: body.language,
      })
    } catch {
      generation = {
        id: `sim-${Date.now()}`,
        type: body.type,
        prompt,
        provider: 'demo',
        status: 'QUEUED',
        parameters: null,
        language: null,
        credits_used: 1,
        error_message: null,
        started_at: null,
        completed_at: null,
        created_at: new Date().toISOString(),
      }
    }

    // Step 2: Generate storyboard (Gemini or fallback)
    let storyboard = null
    let aiError = null

    try {
      if (!generation.id.startsWith('sim-')) {
        await updateGenerationStatus(generation.id, 'PROCESSING').catch(() => {})
      }

      if (isGeminiConfigured()) {
        storyboard = await generateStoryboard(prompt)
      } else {
        // Fallback: create a simple 3-scene storyboard from the prompt
        storyboard = {
          scenes: [
            {
              order: 1,
              title: 'Opening Scene',
              description: `${prompt} — establishing shot, wide angle, cinematic lighting`,
              duration: 5,
              visualCues: ['cinematic', 'wide shot', 'establishing'],
              narration: '',
            },
            {
              order: 2,
              title: 'Main Action',
              description: `${prompt} — close-up action, dynamic camera movement, dramatic lighting`,
              duration: 5,
              visualCues: ['close-up', 'dynamic', 'action'],
              narration: '',
            },
            {
              order: 3,
              title: 'Closing Scene',
              description: `${prompt} — final shot, pulling back, fade to black`,
              duration: 5,
              visualCues: ['pull back', 'fade', 'cinematic'],
              narration: '',
            },
          ],
          totalDuration: 15,
          estimatedCredits: 3,
        }
      }

      if (!generation.id.startsWith('sim-')) {
        await updateGenerationStatus(generation.id, 'COMPLETED').catch(() => {})
      }
    } catch (err) {
      aiError = err instanceof Error ? err.message : 'AI generation failed'
      if (!generation.id.startsWith('sim-')) {
        await updateGenerationStatus(generation.id, 'FAILED', aiError).catch(() => {})
      }
    }

    // Step 3: Generate images for each scene using Pollinations.ai (FREE)
    if (storyboard?.scenes?.length > 0) {
      const imagePromises = storyboard.scenes.map((scene, i) =>
        fetchImageAsBase64(scene.description || prompt, i * 1000 + 42)
          .then((base64) => ({ ...scene, imageUrl: base64 || generateImageUrl(scene.description || prompt, 1280, 720, i * 1000 + 42) }))
      )
      storyboard.scenes = await Promise.all(imagePromises)
    }

    return NextResponse.json({
      generation,
      storyboard,
      aiError,
      geminiEnabled: isGeminiConfigured(),
      dbEnabled: !generation.id.startsWith('sim-'),
    }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create generation' }, { status: 500 })
  }
}
