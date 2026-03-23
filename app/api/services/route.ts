import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { requireAuthContext, requireRoles } from '@/lib/auth/getAuthContext'
import { OWNER_OR_ADMIN } from '@/lib/auth/types'
import { assertShopOwnerOrSuperAdmin } from '@/lib/auth/scope'
import { notConfiguredJson, serverErrorJson } from '@/lib/api/jsonErrors'

function mapService(svc: Record<string, unknown>) {
  return {
    id: svc.id,
    shopId: svc.shop_id,
    name: svc.name,
    duration: `${svc.duration_min} min`,
    durationMin: svc.duration_min,
    price: `${svc.price_bgn} лв`,
    priceBgn: svc.price_bgn,
    isActive: svc.is_active,
    sortOrder: svc.sort_order,
  }
}

// GET /api/services — public catalog (active services only)
export async function GET(request: NextRequest) {
  const admin = getSupabaseAdmin()
  if (!admin) return notConfiguredJson()

  try {
    const { searchParams } = new URL(request.url)
    const shopId = searchParams.get('shopId')

    let query = admin.from('services').select('*').eq('is_active', true).order('sort_order', { ascending: true })

    if (shopId) {
      query = query.eq('shop_id', shopId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching services:', error.code)
      return serverErrorJson()
    }

    const services = (data ?? []).map((svc) => mapService(svc as Record<string, unknown>))
    return NextResponse.json(services)
  } catch (error) {
    console.error('Error in GET /api/services:', error)
    return serverErrorJson()
  }
}

// POST /api/services — shop owner or SUPER_ADMIN for that shop
export async function POST(request: NextRequest) {
  const auth = await requireAuthContext()
  if (auth instanceof NextResponse) return auth

  const roleGate = requireRoles(auth, OWNER_OR_ADMIN)
  if (roleGate instanceof NextResponse) return roleGate

  const admin = getSupabaseAdmin()
  if (!admin) return notConfiguredJson()

  try {
    const body = await request.json()
    const { shopId, name, durationMin, priceBgn, sortOrder, isActive } = body

    if (!shopId || !name || !durationMin || priceBgn === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: shopId, name, durationMin, priceBgn' },
        { status: 400 }
      )
    }

    if (durationMin <= 0 || durationMin > 480) {
      return NextResponse.json({ error: 'Duration must be between 1 and 480 minutes' }, { status: 400 })
    }

    if (priceBgn < 0) {
      return NextResponse.json({ error: 'Price cannot be negative' }, { status: 400 })
    }

    const allowed = await assertShopOwnerOrSuperAdmin(admin, auth, shopId)
    if (allowed instanceof NextResponse) return allowed

    const { data, error } = await admin
      .from('services')
      .insert({
        shop_id: shopId,
        name: String(name).trim(),
        duration_min: durationMin,
        price_bgn: priceBgn,
        sort_order: sortOrder ?? 0,
        is_active: isActive !== undefined ? isActive : true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating service:', error.code)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A service with this name already exists for this shop' },
          { status: 409 }
        )
      }
      return serverErrorJson()
    }

    return NextResponse.json(mapService(data as Record<string, unknown>), { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/services:', error)
    return serverErrorJson()
  }
}
