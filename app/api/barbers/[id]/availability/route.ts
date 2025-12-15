import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'

// GET /api/barbers/[id]/availability - Get availability/time slots for a specific barber
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabaseServer
      .from('time_slots')
      .select('*')
      .eq('barber_id', params.id)
      .order('start_time', { ascending: true })

    // Filter by single date
    if (date) {
      const startOfDay = new Date(`${date}T00:00:00Z`)
      const endOfDay = new Date(`${date}T23:59:59Z`)
      query = query
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
    }

    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00Z`)
      const end = new Date(`${endDate}T23:59:59Z`)
      query = query
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching barber availability:', error)
      return NextResponse.json(
        { error: `Failed to fetch availability: ${error.message}` },
        { status: 500 }
      )
    }

    // Also fetch appointments to show which slots are booked
    const today = date || new Date().toISOString().split('T')[0]
    const startOfDay = new Date(`${today}T00:00:00Z`)
    const endOfDay = new Date(`${today}T23:59:59Z`)

    const { data: appointments } = await supabaseServer
      .from('appointments')
      .select('start_time, end_time, status')
      .eq('barber_id', params.id)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .in('status', ['PENDING', 'CONFIRMED'])

    const bookedSlots = new Set(
      appointments?.map(apt => apt.start_time) || []
    )

    const slots = data.map(slot => ({
      id: slot.id,
      barberId: slot.barber_id,
      startTime: slot.start_time,
      endTime: slot.end_time,
      type: slot.type,
      isAvailable: slot.is_available && !bookedSlots.has(slot.start_time),
      isBooked: bookedSlots.has(slot.start_time),
      createdAt: slot.created_at,
      updatedAt: slot.updated_at
    }))

    return NextResponse.json({
      barberId: params.id,
      date: date || today,
      slots,
      appointments: appointments?.length || 0
    })
  } catch (error) {
    console.error('Error in GET /api/barbers/[id]/availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

