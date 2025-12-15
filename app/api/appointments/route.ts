import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'

// GET /api/appointments - Get all appointments (admin view)
export async function GET(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const barberId = searchParams.get('barberId')
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const shopId = searchParams.get('shopId') // For team view

    let query = supabaseServer
      .from('appointments')
      .select(`
        *,
        barbers:barber_id (
          id,
          display_name,
          profiles:profile_id (
            full_name
          )
        ),
        services:service_id (
          id,
          name,
          duration_min,
          price_bgn
        ),
        shops:shop_id (
          id,
          name,
          city
        )
      `)
      .order('start_time', { ascending: true })

    // Filter by barber if provided
    if (barberId) {
      query = query.eq('barber_id', barberId)
    }

    // Filter by shop if provided (for team view)
    if (shopId) {
      query = query.eq('shop_id', shopId)
    }

    // Filter by date if provided
    if (date) {
      const startOfDay = new Date(`${date}T00:00:00Z`)
      const endOfDay = new Date(`${date}T23:59:59Z`)
      query = query
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
    }

    // Filter by status if provided
    if (status) {
      const statuses = status.split(',')
      if (statuses.length === 1) {
        query = query.eq('status', statuses[0])
      } else {
        query = query.in('status', statuses)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json(
        { error: `Failed to fetch appointments: ${error.message}` },
        { status: 500 }
      )
    }

    const appointments = data.map(apt => ({
      id: apt.id,
      barberId: apt.barber_id,
      barberName: apt.barbers?.display_name || apt.barbers?.profiles?.full_name || 'Unknown',
      serviceId: apt.service_id,
      serviceName: apt.services?.name || 'Unknown Service',
      serviceDuration: apt.services?.duration_min || 0,
      servicePrice: apt.services?.price_bgn || 0,
      shopId: apt.shop_id,
      shopName: apt.shops?.name || 'Unknown Shop',
      customerUserId: apt.customer_user_id,
      customerName: apt.customer_name,
      customerPhone: apt.customer_phone,
      customerEmail: apt.customer_email,
      startTime: apt.start_time,
      endTime: apt.end_time,
      status: apt.status,
      cancelledByUserId: apt.cancelled_by_user_id,
      cancelledByRole: apt.cancelled_by_role,
      cancelReason: apt.cancel_reason,
      cancelledAt: apt.cancelled_at,
      notes: apt.notes,
      createdAt: apt.created_at,
      updatedAt: apt.updated_at
    }))

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Error in GET /api/appointments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/appointments - Create a new appointment
export async function POST(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const {
      shopId,
      serviceId,
      barberId,
      customerUserId,
      customerName,
      customerPhone,
      customerEmail,
      startTime,
      endTime,
      notes
    } = body

    // Validate required fields
    if (!shopId || !serviceId || !barberId || !customerName || !customerPhone || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check for double-booking
    const { data: existing } = await supabaseServer
      .from('appointments')
      .select('id')
      .eq('barber_id', barberId)
      .eq('start_time', startTime)
      .in('status', ['PENDING', 'CONFIRMED'])
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 409 }
      )
    }

    const { data, error } = await supabaseServer
      .from('appointments')
      .insert({
        shop_id: shopId,
        service_id: serviceId,
        barber_id: barberId,
        customer_user_id: customerUserId || null,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        start_time: startTime,
        end_time: endTime,
        status: 'PENDING',
        notes: notes || null
      })
      .select(`
        *,
        services:service_id (
          id,
          name,
          duration_min,
          price_bgn
        ),
        barbers:barber_id (
          id,
          display_name
        ),
        shops:shop_id (
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error('Error creating appointment:', error)
      return NextResponse.json(
        { error: `Failed to create appointment: ${error.message}` },
        { status: 500 }
      )
    }

    const appointment = {
      id: data.id,
      barberId: data.barber_id,
      barberName: data.barbers?.display_name || 'Unknown',
      serviceId: data.service_id,
      serviceName: data.services?.name || 'Unknown Service',
      shopId: data.shop_id,
      shopName: data.shops?.name || 'Unknown Shop',
      customerUserId: data.customer_user_id,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      customerEmail: data.customer_email,
      startTime: data.start_time,
      endTime: data.end_time,
      status: data.status,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/appointments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
