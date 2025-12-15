import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'

// PUT /api/barbers/[id] - Update a barber
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseServer) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { displayName, bio, photoUrl, isActive } = body

    const { data, error } = await supabaseServer
      .from('barbers')
      .update({
        display_name: displayName,
        bio: bio,
        photo_url: photoUrl,
        is_active: isActive,
      })
      .eq('id', params.id)
      .select(`
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
      `)
      .single()

    if (error) {
      console.error('Error updating barber:', error)
      return NextResponse.json(
        { error: `Failed to update barber: ${error.message}` },
        { status: 500 }
      )
    }

    const result = {
      id: data.id,
      profileId: data.profile_id,
      shopId: data.shop_id,
      displayName: data.display_name,
      bio: data.bio || undefined,
      photoUrl: data.photo_url || undefined,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      profile: data.profiles ? {
        fullName: data.profiles.full_name || undefined,
        phone: data.profiles.phone || undefined,
        role: data.profiles.role
      } : undefined,
      shop: data.shops ? {
        name: data.shops.name,
        city: data.shops.city,
        address: data.shops.address || undefined
      } : undefined
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in PUT /api/barbers/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/barbers/[id] - Soft delete a barber
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseServer) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    )
  }

  try {
    const { error } = await supabaseServer
      .from('barbers')
      .update({ is_active: false })
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting barber:', error)
      return NextResponse.json(
        { error: `Failed to delete barber: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/barbers/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

