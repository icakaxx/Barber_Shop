import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { notConfiguredJson, serverErrorJson } from '@/lib/api/jsonErrors'
import { getShopLocalDayQueryBounds, getShopTodayYMD } from '@/lib/utils/shopHours'

/**
 * PUBLIC: time slots + booked flags for a barber (no customer PII in appointment rows).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getSupabaseAdmin()
  if (!admin) return notConfiguredJson()

  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = admin
      .from('time_slots')
      .select('*')
      .eq('barber_id', params.id)
      .order('start_time', { ascending: true })

    if (date) {
      const { startIso, endExclusiveIso } = getShopLocalDayQueryBounds(date)
      query = query.gte('start_time', startIso).lt('start_time', endExclusiveIso)
    }

    if (startDate && endDate) {
      const { startIso } = getShopLocalDayQueryBounds(startDate)
      const { endExclusiveIso } = getShopLocalDayQueryBounds(endDate)
      query = query.gte('start_time', startIso).lt('start_time', endExclusiveIso)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching barber availability:', error.code)
      return serverErrorJson()
    }

    const today = date || getShopTodayYMD()
    const { startIso, endExclusiveIso } = getShopLocalDayQueryBounds(today)

    const { data: appointments } = await admin
      .from('appointments')
      .select('start_time, end_time, status')
      .eq('barber_id', params.id)
      .gte('start_time', startIso)
      .lt('start_time', endExclusiveIso)
      .in('status', ['PENDING', 'CONFIRMED'])

    const bookedSlots = new Set((appointments ?? []).map((apt) => apt.start_time))

    const slots = (data ?? []).map((slot) => ({
      id: slot.id,
      barberId: slot.barber_id,
      startTime: slot.start_time,
      endTime: slot.end_time,
      type: slot.type,
      isAvailable: slot.is_available && !bookedSlots.has(slot.start_time),
      isBooked: bookedSlots.has(slot.start_time),
      createdAt: slot.created_at,
      updatedAt: slot.updated_at,
    }))

    return NextResponse.json({
      barberId: params.id,
      date: date || today,
      slots,
      bookedCount: appointments?.length ?? 0,
    })
  } catch (error) {
    console.error('Error in GET /api/barbers/[id]/availability:', error)
    return serverErrorJson()
  }
}
