import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { requireAuthContext, requireRoles } from '@/lib/auth/getAuthContext'
import { OWNER_OR_ADMIN } from '@/lib/auth/types'
import { assertShopOwnerOrSuperAdmin, fetchServiceShopId } from '@/lib/auth/scope'
import { notConfiguredJson, serverErrorJson } from '@/lib/api/jsonErrors'

function mapService(data: Record<string, unknown>) {
  return {
    id: data.id,
    shopId: data.shop_id,
    name: data.name,
    duration: `${data.duration_min} min`,
    durationMin: data.duration_min,
    price: `${data.price_bgn} лв`,
    priceBgn: data.price_bgn,
    isActive: data.is_active,
    sortOrder: data.sort_order,
  }
}

// PUT /api/services/[id] — shop owner or SUPER_ADMIN
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthContext()
  if (auth instanceof NextResponse) return auth

  const roleGate = requireRoles(auth, OWNER_OR_ADMIN)
  if (roleGate instanceof NextResponse) return roleGate

  const admin = getSupabaseAdmin()
  if (!admin) return notConfiguredJson()

  const shopId = await fetchServiceShopId(admin, params.id)
  if (!shopId) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  const allowed = await assertShopOwnerOrSuperAdmin(admin, auth, shopId)
  if (allowed instanceof NextResponse) return allowed

  try {
    const body = await request.json()
    const { name, durationMin, priceBgn, sortOrder, isActive } = body

    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = String(name).trim()
    if (durationMin !== undefined) {
      if (durationMin <= 0 || durationMin > 480) {
        return NextResponse.json({ error: 'Duration must be between 1 and 480 minutes' }, { status: 400 })
      }
      updateData.duration_min = durationMin
    }
    if (priceBgn !== undefined) {
      if (priceBgn < 0) {
        return NextResponse.json({ error: 'Price cannot be negative' }, { status: 400 })
      }
      updateData.price_bgn = priceBgn
    }
    if (sortOrder !== undefined) updateData.sort_order = sortOrder
    if (isActive !== undefined) updateData.is_active = isActive

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('services')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating service:', error.code)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A service with this name already exists for this shop' },
          { status: 409 }
        )
      }
      return serverErrorJson()
    }

    return NextResponse.json(mapService(data as Record<string, unknown>))
  } catch (error) {
    console.error('Error in PUT /api/services/[id]:', error)
    return serverErrorJson()
  }
}

// DELETE /api/services/[id] — soft delete; shop owner or SUPER_ADMIN
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthContext()
  if (auth instanceof NextResponse) return auth

  const roleGate = requireRoles(auth, OWNER_OR_ADMIN)
  if (roleGate instanceof NextResponse) return roleGate

  const admin = getSupabaseAdmin()
  if (!admin) return notConfiguredJson()

  const shopId = await fetchServiceShopId(admin, params.id)
  if (!shopId) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  const allowed = await assertShopOwnerOrSuperAdmin(admin, auth, shopId)
  if (allowed instanceof NextResponse) return allowed

  try {
    const { error } = await admin.from('services').update({ is_active: false }).eq('id', params.id)

    if (error) {
      console.error('Error deleting service:', error.code)
      return serverErrorJson()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/services/[id]:', error)
    return serverErrorJson()
  }
}
