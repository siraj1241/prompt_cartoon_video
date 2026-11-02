/**
 * File upload route — uploads to Supabase Storage.
 *
 * POST /api/upload
 *   Body: multipart/form-data with:
 *     - file: the file to upload (video/image/audio, max 100MB)
 *     - bucket: target bucket name (default: 'uploads')
 *
 * Returns: { file: { path, publicUrl, size, mimeType } }
 */

import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, generateObjectPath, validateUpload } from '@/lib/supabase/storage'

const BUCKET_PREFIXES: Record<string, string> = {
  videos: 'videos',
  images: 'images',
  audio: 'audio',
  uploads: 'uploads',
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const bucket = (formData.get('bucket') as string) || 'uploads'

    if (!file) {
      return NextResponse.json({ error: 'No file provided. Use form-data with a "file" field.' }, { status: 400 })
    }

    // Validate
    const validationError = validateUpload({
      name: file.name,
      type: file.type,
      size: file.size,
    })
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // Determine the path prefix based on file type
    let prefix = 'uploads'
    if (file.type.startsWith('video/')) prefix = 'videos'
    else if (file.type.startsWith('image/')) prefix = 'images'
    else if (file.type.startsWith('audio/')) prefix = 'audio'

    const targetBucket = BUCKET_PREFIXES[bucket] ? bucket : 'uploads'
    const objectPath = generateObjectPath(prefix, file.name)
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    const uploaded = await uploadFile(targetBucket, objectPath, fileBuffer, file.type)

    return NextResponse.json({ file: uploaded }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload failed'
    const isConfig = msg.includes('not configured')
    return NextResponse.json({ error: msg }, { status: isConfig ? 503 : 500 })
  }
}
