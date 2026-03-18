import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'

// GET /api/shops - Get shops (optionally filtered by owner)
export async function GET(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const ownerOnly = searchParams.get('owner') === 'true'
    const ownerId = searchParams.get('ownerId')

    let query = supabaseServer
      .from('shops')
      .select('*')
      .order('name')

    // Filter by owner if requested
    if (ownerOnly || ownerId) {
      // In production, you'd get the ownerId from the authenticated user
      // For now, we'll return all active shops
      // TODO: Implement proper owner filtering when auth is set up
      query = query.eq('is_active', true)
    } else {
      // Return all active shops
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching shops:', error)
      return NextResponse.json(
        { error: `Failed to fetch shops: ${error.message}` },
        { status: 500 }
      )
    }

    const shops = data.map(shop => ({
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
    }))

    return NextResponse.json(shops)
  } catch (error) {
    console.error('Error in GET /api/shops:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

