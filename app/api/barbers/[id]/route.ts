import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { requireAuthContext } from '@/lib/auth/getAuthContext'
import { assertCanMutateBarber, fetchBarberRow, fetchShopOwner } from '@/lib/auth/scope'
import { notConfiguredJson, serverErrorJson, forbiddenJson } from '@/lib/api/jsonErrors'

function mapResult(data: Record<string, unknown>) {
  return {
    id: data.id,
    profileId: data.profile_id,
    shopId: data.shop_id,
    displayName: data.display_name,
    bio: data.bio || undefined,
    photoUrl: data.photo_url || undefined,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    profile: data.profiles
      ? {
          fullName: (data.profiles as { full_name?: string }).full_name || undefined,
          phone: (data.profiles as { phone?: string }).phone || undefined,
          role: (data.profiles as { role?: string }).role,
        }
      : undefined,
    shop: data.shops
      ? {
          name: (data.shops as { name?: string }).name,
          city: (data.shops as { city?: string }).city,
          address: (data.shops as { address?: string }).address || undefined,
        }
      : undefined,
  }
}

// PUT /api/barbers/[id] — owner (shop), superadmin, or worker (self row only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthContext()
  if (auth instanceof NextResponse) return auth

  const admin = getSupabaseAdmin()
  if (!admin) return notConfiguredJson()

  const gate = await assertCanMutateBarber(admin, auth, params.id)
  if (gate instanceof NextResponse) return gate

  try {
    const body = await request.json()
    const { displayName, bio, photoUrl, isActive } = body

    if (auth.role === 'BARBER_WORKER') {
      if (isActive !== undefined) {
        return forbiddenJson('Workers cannot change active status')
      }
    }

    const updatePayload: Record<string, unknown> = {}
    if (displayName !== undefined) updatePayload.display_name = displayName
    if (bio !== undefined) updatePayload.bio = bio
    if (photoUrl !== undefined) updatePayload.photo_url = photoUrl
    if (isActive !== undefined) updatePayload.is_active = isActive

    const { data, error } = await admin
      .from('barbers')
      .update(updatePayload)
      .eq('id', params.id)
      .select(
        `
        *,
        profiles:profile_id (
          full_name,
          phone,
          role
        ),
        shops:shop_id (
          name,
          city,
          address
        )
      `
      )
      .single()

    if (error) {
      console.error('Error updating barber:', error.code)
      return serverErrorJson()
    }

    return NextResponse.json(mapResult(data as Record<string, unknown>))
  } catch (error) {
    console.error('Error in PUT /api/barbers/[id]:', error)
    return serverErrorJson()
  }
}

// DELETE /api/barbers/[id] — soft delete; shop owner or SUPER_ADMIN only (not worker self-service)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthContext()
  if (auth instanceof NextResponse) return auth

  const admin = getSupabaseAdmin()
  if (!admin) return notConfiguredJson()

  const barber = await fetchBarberRow(admin, params.id)
  if (!barber) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (auth.role === 'SUPER_ADMIN') {
    /* ok */
  } else if (auth.role === 'BARBER_OWNER') {
    const shop = await fetchShopOwner(admin, barber.shop_id)
    if (shop?.owner_id !== auth.userId) return forbiddenJson()
  } else {
    return forbiddenJson()
  }

  try {
    const { error } = await admin.from('barbers').update({ is_active: false }).eq('id', params.id)

    if (error) {
      console.error('Error deleting barber:', error.code)
      return serverErrorJson()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/barbers/[id]:', error)
    return serverErrorJson()
  }
}
