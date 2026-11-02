/**
 * Generations API route — create + list AI generation jobs.
 *
 * Endpoints:
 *   GET  /api/generations       → list recent generations
 *   POST /api/generations       → create a new generation job
 *
 * When GOOGLE_AI_STUDIO_KEY is set, the POST route also calls Gemini
 * to generate a real storyboard / script / text description from the
 * prompt. The result is stored in the generation record's `parameters`
 * field and returned to the client.
 *
 * If the key is not set, the route still creates the DB record but
 * skips the AI call (returns the record with status='QUEUED').
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

    // Validate
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

    // Step 1: Create the generation record in Supabase (status=QUEUED)
    let generation
    try {
      generation = await createGeneration({
        type: body.type,
        prompt,
        provider: isGeminiConfigured() ? 'google-gemini' : 'demo',
        parameters: body.parameters,
        language: body.language,
      })
    } catch (dbErr) {
      // DB write failed (Supabase not configured) — continue with AI call anyway
      generation = {
        id: `sim-${Date.now()}`,
        type: body.type,
        prompt,
        provider: isGeminiConfigured() ? 'google-gemini' : 'demo',
        status: 'QUEUED',
        parameters: null,
        language: body.language || null,
        credits_used: 1,
        error_message: dbErr instanceof Error ? dbErr.message : null,
        started_at: null,
        completed_at: null,
        created_at: new Date().toISOString(),
      }
    }

    // Step 2: Call Gemini if the API key is configured
    let storyboard = null
    let aiError = null

    if (isGeminiConfigured()) {
      try {
        // Update status to PROCESSING (if DB is available)
        if (!generation.id.startsWith('sim-')) {
          await updateGenerationStatus(generation.id, 'PROCESSING').catch(() => {})
        }

        // Generate a storyboard from the prompt
        storyboard = await generateStoryboard(prompt)

        // Update the generation record with the result (if DB is available)
        if (!generation.id.startsWith('sim-')) {
          await updateGenerationStatus(generation.id, 'COMPLETED').catch(() => {})
        }
      } catch (aiErr) {
        aiError = aiErr instanceof Error ? aiErr.message : 'AI generation failed'
        if (!generation.id.startsWith('sim-')) {
          await updateGenerationStatus(generation.id, 'FAILED', aiError).catch(() => {})
        }
      }
    }

    // Step 3: Return the result
    return NextResponse.json({
      generation,
      storyboard,
      aiError,
      geminiEnabled: isGeminiConfigured(),
      dbEnabled: !generation.id.startsWith('sim-'),
    }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create generation'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
