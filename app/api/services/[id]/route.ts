import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'

// PUT /api/services/[id] - Update a service
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
    const { name, durationMin, priceBgn, sortOrder, isActive } = body

    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name.trim()
    if (durationMin !== undefined) {
      if (durationMin <= 0 || durationMin > 480) {
        return NextResponse.json(
          { error: 'Duration must be between 1 and 480 minutes' },
          { status: 400 }
        )
      }
      updateData.duration_min = durationMin
    }
    if (priceBgn !== undefined) {
      if (priceBgn < 0) {
        return NextResponse.json(
          { error: 'Price cannot be negative' },
          { status: 400 }
        )
      }
      updateData.price_bgn = priceBgn
    }
    if (sortOrder !== undefined) updateData.sort_order = sortOrder
    if (isActive !== undefined) updateData.is_active = isActive

    const { data, error } = await supabaseServer
      .from('services')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating service:', error)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A service with this name already exists for this shop' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: `Failed to update service: ${error.message}` },
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

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error in PUT /api/services/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/services/[id] - Soft delete a service (set is_active = false)
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
      .from('services')
      .update({ is_active: false })
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting service:', error)
      return NextResponse.json(
        { error: `Failed to delete service: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/services/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

