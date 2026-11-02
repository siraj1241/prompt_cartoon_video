/**
 * Supabase Storage helper — wraps the storage API of the Supabase client.
 *
 * Supabase Storage is S3-compatible but uses a simpler REST API exposed
 * via @supabase/supabase-js. We use that instead of raw AWS S3 SDK to
 * keep the bundle small and the auth unified.
 *
 * Buckets must be created in the Supabase Dashboard → Storage.
 * Recommended buckets for PromptReel:
 *   - 'videos'    (public — generated video output)
 *   - 'images'    (public — generated images, thumbnails)
 *   - 'audio'     (public — generated audio files)
 *   - 'uploads'   (private — user-uploaded source files)
 */

import { supabaseServer } from './client'

export interface UploadedFile {
  path: string
  publicUrl: string
  size: number
  mimeType: string
}

/**
 * Upload a file to a Supabase Storage bucket.
 *
 * @param bucket  Bucket name (must exist in Supabase Dashboard)
 * @param path    Object path within the bucket (e.g. 'videos/abc123.mp4')
 * @param file    File body (Buffer or Blob)
 * @param mimeType  MIME type for the file
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: Buffer | Blob | ArrayBuffer,
  mimeType: string,
): Promise<UploadedFile> {
  if (!supabaseServer) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY in .env (see SUPABASE_SETUP.md).',
    )
  }

  const { data, error } = await supabaseServer
    .storage
    .from(bucket)
    .upload(path, file, {
      contentType: mimeType,
      upsert: false,
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  // Get the public URL (works only if bucket is public; for private buckets
  // you'd use createSignedUrl() instead)
  const { data: urlData } = supabaseServer
    .storage
    .from(bucket)
    .getPublicUrl(data.path)

  return {
    path: data.path,
    publicUrl: urlData.publicUrl,
    size: file instanceof Blob ? file.size : (file as Buffer).length,
    mimeType,
  }
}

/**
 * Delete a file from a bucket.
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  if (!supabaseServer) {
    throw new Error('Supabase is not configured.')
  }
  const { error } = await supabaseServer.storage.from(bucket).remove([path])
  if (error) throw new Error(`Delete failed: ${error.message}`)
}

/**
 * List files in a bucket (optionally filtered by prefix).
 */
export async function listFiles(bucket: string, prefix = '') {
  if (!supabaseServer) {
    throw new Error('Supabase is not configured.')
  }
  const { data, error } = await supabaseServer.storage.from(bucket).list(prefix, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' },
  })
  if (error) throw new Error(`List failed: ${error.message}`)
  return data
}

/**
 * Generate a unique object path for an upload.
 * Format: <prefix>/<yyyy-mm-dd>/<uuid>.<ext>
 */
export function generateObjectPath(prefix: string, filename: string): string {
  const ext = filename.split('.').pop() || 'bin'
  const date = new Date().toISOString().slice(0, 10) // yyyy-mm-dd
  const uuid = crypto.randomUUID()
  return `${prefix}/${date}/${uuid}.${ext}`
}

/**
 * Validate file type + size for uploads.
 */
export function validateUpload(file: { name: string; type: string; size: number }): string | null {
  const MAX_SIZE = 100 * 1024 * 1024 // 100 MB
  const ALLOWED_TYPES = [
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska',
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
  ]

  if (file.size > MAX_SIZE) {
    return `File too large. Max ${MAX_SIZE / 1024 / 1024}MB.`
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `File type ${file.type} not allowed. Allowed: ${ALLOWED_TYPES.join(', ')}`
  }
  return null
}
