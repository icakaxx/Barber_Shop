import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getOptionalAuthContext, requireAuthContext } from '@/lib/auth/getAuthContext'
import { STAFF_ROLES } from '@/lib/auth/types'
import { assertShopOwnerOrSuperAdmin } from '@/lib/auth/scope'
import { notConfiguredJson, serverErrorJson } from '@/lib/api/jsonErrors'

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

// GET /api/shops/[id] — public read for active shop
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getSupabaseAdmin()
  if (!admin) return notConfiguredJson()

  try {
    const auth = await getOptionalAuthContext()
    const includeOwner = auth !== null && STAFF_ROLES.includes(auth.role)

    const { data, error } = await admin.from('shops').select('*').eq('id', params.id).single()

    if (error || !data || !data.is_active) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    return NextResponse.json(mapShop(data as Record<string, unknown>, includeOwner))
  } catch (error) {
    console.error('Error in GET /api/shops/[id]:', error)
    return serverErrorJson()
  }
}

// PATCH /api/shops/[id] — shop owner or SUPER_ADMIN
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthContext()
  if (auth instanceof NextResponse) return auth

  const admin = getSupabaseAdmin()
  if (!admin) return notConfiguredJson()

  const allowed = await assertShopOwnerOrSuperAdmin(admin, auth, params.id)
  if (allowed instanceof NextResponse) return allowed

  try {
    const body = await request.json()
    const {
      name,
      logoUrl,
      heroImageUrl,
      heroDescription,
      address,
      city,
      phone,
      workingHours,
      workingHoursText,
      lunchStart,
      lunchEnd,
    } = body

    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (logoUrl !== undefined) updates.logo_url = logoUrl || null
    if (heroImageUrl !== undefined) updates.hero_image_url = heroImageUrl || null
    if (heroDescription !== undefined) updates.hero_description = heroDescription || null
    if (address !== undefined) updates.address = address || null
    if (city !== undefined) updates.city = city || null
    if (phone !== undefined) updates.phone = phone || null
    if (workingHours !== undefined) updates.working_hours = workingHours || null
    if (workingHoursText !== undefined) updates.working_hours_text = workingHoursText || null
    if (lunchStart !== undefined) updates.lunch_start = lunchStart || null
    if (lunchEnd !== undefined) updates.lunch_end = lunchEnd || null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('shops')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating shop:', error.code)
      return serverErrorJson()
    }

    return NextResponse.json(mapShop(data as Record<string, unknown>, true))
  } catch (error) {
    console.error('Error in PATCH /api/shops/[id]:', error)
    return serverErrorJson()
  }
}
