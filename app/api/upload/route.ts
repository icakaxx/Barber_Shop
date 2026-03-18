import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'

const BUCKET = 'barbershop_info';
const MAX_SIZES: Record<string, number> = {
  logo: 2 * 1024 * 1024,      // 2 MB
  hero: 5 * 1024 * 1024,     // 5 MB
  'barber-profile': 3 * 1024 * 1024  // 3 MB
};

export async function POST(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string | null
    const entityId = formData.get('entityId') as string | null

    if (!file || !type || !entityId) {
      return NextResponse.json(
        { error: 'Missing file, type, or entityId' },
        { status: 400 }
      )
    }

    const validTypes = ['logo', 'hero', 'barber-profile']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be logo, hero, or barber-profile' },
        { status: 400 }
      )
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image (JPEG, PNG, WebP)' },
        { status: 400 }
      )
    }

    const maxSize = MAX_SIZES[type] ?? 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max size: ${Math.round(maxSize / 1024 / 1024)} MB` },
        { status: 400 }
      )
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const path =
      type === 'barber-profile'
        ? `barbers/${entityId}/profile.${ext}`
        : `shops/${entityId}/${type}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { data, error } = await supabaseServer.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      )
    }

    const { data: urlData } = supabaseServer.storage
      .from(BUCKET)
      .getPublicUrl(data.path)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
