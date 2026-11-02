/**
 * Generations API route — create + list AI generation jobs.
 *
 * Endpoints:
 *   GET  /api/generations       → list recent generations
 *   POST /api/generations       → create a new generation job (status=QUEUED)
 *
 * The actual AI execution (calling Runway / Pika / SVD) is handled by
 * a background worker (Redis + BullMQ). For now, this route just
 * records the job in the database — the user can poll GET /api/generations/:id
 * for status updates.
 */

import { NextRequest, NextResponse } from 'next/server'
import { listGenerations, createGeneration } from '@/features/generations/repository'
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

    const generation = await createGeneration({
      type: body.type,
      prompt: body.prompt.trim(),
      provider: body.provider,
      negative_prompt: body.negative_prompt,
      parameters: body.parameters,
      language: body.language,
    })

    return NextResponse.json({ generation }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create generation'
    const isConfig = msg.includes('not configured')
    return NextResponse.json({ error: msg }, { status: isConfig ? 503 : 500 })
  }
}
