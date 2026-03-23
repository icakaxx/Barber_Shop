import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getOptionalAuthContext } from '@/lib/auth/getAuthContext'
import { STAFF_ROLES } from '@/lib/auth/types'
import { forbiddenJson, notConfiguredJson, serverErrorJson, unauthorizedJson } from '@/lib/api/jsonErrors'

function mapShop(shop: Record<string, unknown>, includeOwnerId: boolean) {
  const base = {
    id: shop.id,
    name: shop.name,
    address: shop.address || undefined,
    city: shop.city || undefined,
    phone: shop.phone || undefined,
    instagramUrl: shop.instagram_url || undefined,
    facebookUrl: shop.facebook_url || undefined,
    workingHoursText: shop.working_hours_text || undefined,
    workingHours: shop.working_hours || undefined,
    lunchStart: shop.lunch_start || undefined,
    lunchEnd: shop.lunch_end || undefined,
    logoUrl: shop.logo_url || undefined,
    heroImageUrl: shop.hero_image_url || undefined,
    heroDescription: shop.hero_description || undefined,
    isActive: shop.is_active,
    createdAt: shop.created_at,
    updatedAt: shop.updated_at,
  }
  if (includeOwnerId) {
    return { ...base, ownerId: shop.owner_id }
  }
  return base
}

// GET /api/shops — public listing of active shops (ownerId only for authenticated staff)
export async function GET(request: NextRequest) {
  const admin = getSupabaseAdmin()
  if (!admin) return notConfiguredJson()

  try {
    const { searchParams } = new URL(request.url)
    const ownerOnly = searchParams.get('owner') === 'true'

    const auth = await getOptionalAuthContext()
    const includeOwner =
      auth !== null && STAFF_ROLES.includes(auth.role)

    let query = admin.from('shops').select('*').eq('is_active', true)

    if (ownerOnly) {
      if (!auth) return unauthorizedJson()
      if (auth.role === 'BARBER_OWNER') {
        query = query.eq('owner_id', auth.userId)
      } else if (auth.role === 'SUPER_ADMIN') {
        // all active shops
      } else {
        return forbiddenJson()
      }
    }

    const { data, error } = await query.order('name')

    if (error) {
      console.error('Error fetching shops:', error.code)
      return serverErrorJson()
    }

    const shops = (data ?? []).map((shop) =>
      mapShop(shop as Record<string, unknown>, includeOwner)
    )

    return NextResponse.json(shops)
  } catch (error) {
    console.error('Error in GET /api/shops:', error)
    return serverErrorJson()
  }
}
