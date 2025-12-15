import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'

// GET /api/services - Get all active services
export async function GET(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const shopId = searchParams.get('shopId')

    let query = supabaseServer
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    // Filter by shop if provided
    if (shopId) {
      query = query.eq('shop_id', shopId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching services:', error)
      return NextResponse.json(
        { error: `Failed to fetch services: ${error.message}` },
        { status: 500 }
      )
    }

    const services = data.map(svc => ({
      id: svc.id,
      shopId: svc.shop_id,
      name: svc.name,
      duration: `${svc.duration_min} min`,
      durationMin: svc.duration_min,
      price: `${svc.price_bgn} лв`,
      priceBgn: svc.price_bgn,
      isActive: svc.is_active,
      sortOrder: svc.sort_order
    }))

    return NextResponse.json(services)
  } catch (error) {
    console.error('Error in GET /api/services:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/services - Create a new service
export async function POST(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { shopId, name, durationMin, priceBgn, sortOrder, isActive } = body

    // Validate required fields
    if (!shopId || !name || !durationMin || priceBgn === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: shopId, name, durationMin, priceBgn' },
        { status: 400 }
      )
    }

    // Validate duration (must be positive and reasonable)
    if (durationMin <= 0 || durationMin > 480) {
      return NextResponse.json(
        { error: 'Duration must be between 1 and 480 minutes' },
        { status: 400 }
      )
    }

    // Validate price
    if (priceBgn < 0) {
      return NextResponse.json(
        { error: 'Price cannot be negative' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('services')
      .insert({
        shop_id: shopId,
        name: name.trim(),
        duration_min: durationMin,
        price_bgn: priceBgn,
        sort_order: sortOrder || 0,
        is_active: isActive !== undefined ? isActive : true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating service:', error)
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A service with this name already exists for this shop' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: `Failed to create service: ${error.message}` },
        { status: 500 }
      )
    }

    const service = {
      id: data.id,
      shopId: data.shop_id,
      name: data.name,
      duration: `${data.duration_min} min`,
      durationMin: data.duration_min,
      price: `${data.price_bgn} лв`,
      priceBgn: data.price_bgn,
      isActive: data.is_active,
      sortOrder: data.sort_order
    }

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/services:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

