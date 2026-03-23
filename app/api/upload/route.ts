import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { requireAuthContext } from '@/lib/auth/getAuthContext'
import { assertCanMutateBarber, assertShopOwnerOrSuperAdmin } from '@/lib/auth/scope'
import { notConfiguredJson, serverErrorJson } from '@/lib/api/jsonErrors'

const BUCKET = 'barbershop_info'
const MAX_SIZES: Record<string, number> = {
  logo: 2 * 1024 * 1024,
  hero: 5 * 1024 * 1024,
  'barber-profile': 3 * 1024 * 1024,
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthContext()
  if (auth instanceof NextResponse) return auth

  const admin = getSupabaseAdmin()
  if (!admin) return notConfiguredJson()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string | null
    const entityId = formData.get('entityId') as string | null

    if (!file || !type || !entityId) {
      return NextResponse.json({ error: 'Missing file, type, or entityId' }, { status: 400 })
    }

    const validTypes = ['logo', 'hero', 'barber-profile']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be logo, hero, or barber-profile' },
        { status: 400 }
      )
    }

    if (type === 'logo' || type === 'hero') {
      const allowed = await assertShopOwnerOrSuperAdmin(admin, auth, entityId)
      if (allowed instanceof NextResponse) return allowed
    } else {
      const barberOk = await assertCanMutateBarber(admin, auth, entityId)
      if (barberOk instanceof NextResponse) return barberOk
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image (JPEG, PNG, WebP)' }, { status: 400 })
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

    const { data, error } = await admin.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

    if (error) {
      console.error('Storage upload error:', error.message)
      return serverErrorJson()
    }

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(data.path)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return serverErrorJson()
  }
}
