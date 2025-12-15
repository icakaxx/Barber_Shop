import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'

// GET /api/barbers/[id]/appointments - Get appointments for a specific barber
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
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const status = searchParams.get('status')

    let query = supabaseServer
      .from('appointments')
      .select(`
        *,
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
      .eq('barber_id', params.id)
      .order('start_time', { ascending: true })

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
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching barber appointments:', error)
      return NextResponse.json(
        { error: `Failed to fetch appointments: ${error.message}` },
        { status: 500 }
      )
    }

    const appointments = data.map(apt => ({
      id: apt.id,
      barberId: apt.barber_id,
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
    console.error('Error in GET /api/barbers/[id]/appointments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

