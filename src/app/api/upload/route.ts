import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, generateObjectPath, validateUpload } from '@/lib/supabase/storage'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const bucket = (formData.get('bucket') as string) || 'uploads'
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    const validationError = validateUpload({ name: file.name, type: file.type, size: file.size })
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })
    let prefix = 'uploads'
    if (file.type.startsWith('video/')) prefix = 'videos'
    else if (file.type.startsWith('image/')) prefix = 'images'
    else if (file.type.startsWith('audio/')) prefix = 'audio'
    const targetBucket = ['videos','images','audio','uploads'].includes(bucket) ? bucket : 'uploads'
    const objectPath = generateObjectPath(prefix, file.name)
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const uploaded = await uploadFile(targetBucket, objectPath, fileBuffer, file.type)
    return NextResponse.json({ file: uploaded }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: msg }, { status: 503 })
  }
}
