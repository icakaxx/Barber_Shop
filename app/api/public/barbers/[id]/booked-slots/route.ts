import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { badRequestJson, notConfiguredJson, serverErrorJson } from '@/lib/api/jsonErrors';
import { getShopLocalDayQueryBounds } from '@/lib/utils/shopHours';

/**
 * PUBLIC: returns only busy time ranges for a barber on a date (no customer PII).
 * Used by anonymous booking flow to avoid exposing full appointment rows.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getSupabaseAdmin();
  if (!admin) return notConfiguredJson();

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return badRequestJson('Invalid or missing date (YYYY-MM-DD)');
  }

  try {
    const { startIso, endExclusiveIso } = getShopLocalDayQueryBounds(date);

    const { data, error } = await admin
      .from('appointments')
      .select('start_time, end_time, status')
      .eq('barber_id', params.id)
      .gte('start_time', startIso)
      .lt('start_time', endExclusiveIso)
      .in('status', ['PENDING', 'CONFIRMED']);

    if (error) {
      console.error('[booked-slots]', error);
      return serverErrorJson();
    }

    const slots = (data ?? []).map((row) => ({
      startTime: row.start_time,
      endTime: row.end_time,
    }));

    return NextResponse.json({ slots });
  } catch (e) {
    console.error('[booked-slots]', e);
    return serverErrorJson();
  }
}
