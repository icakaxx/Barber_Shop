import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'

function mapShop(shop: any) {
  return {
    id: shop.id,
    ownerId: shop.owner_id,
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
    updatedAt: shop.updated_at
  }
}

// GET /api/shops/[id] - Get single shop
export async function GET(
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
    const { data, error } = await supabaseServer
      .from('shops')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(mapShop(data))
  } catch (error) {
    console.error('Error in GET /api/shops/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/shops/[id] - Update shop (owner settings)
export async function PATCH(
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
    const { name, logoUrl, heroImageUrl, heroDescription, address, city, phone, workingHours, workingHoursText, lunchStart, lunchEnd } = body

    const updates: Record<string, any> = {}
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
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('shops')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating shop:', error)
      return NextResponse.json(
        { error: `Failed to update shop: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(mapShop(data))
  } catch (error) {
    console.error('Error in PATCH /api/shops/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
