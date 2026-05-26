import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { requireAuthContext } from '@/lib/auth/getAuthContext'
import { assertShopOwnerOrSuperAdmin } from '@/lib/auth/scope'
import { notConfiguredJson, serverErrorJson } from '@/lib/api/jsonErrors'

function mapRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    shopId: row.shop_id as string,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    label: (row.label as string) || undefined,
    createdAt: row.created_at as string,
  }
}

// GET /api/shops/[id]/blocked-dates — public read
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getSupabaseAdmin()
  if (!admin) return notConfiguredJson()

  try {
    const { data: shop } = await admin
      .from('shops')
      .select('id')
      .eq('id', params.id)
      .eq('is_active', true)
      .single()

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    const { data, error } = await admin
      .from('shop_blocked_dates')
      .select('*')
      .eq('shop_id', params.id)
      .order('start_date', { ascending: true })

    if (error) {
      console.error('Error fetching blocked dates:', error.code)
      return serverErrorJson()
    }

    return NextResponse.json((data ?? []).map((r) => mapRow(r as Record<string, unknown>)))
  } catch (error) {
    console.error('Error in GET blocked-dates:', error)
    return serverErrorJson()
  }
}

// POST /api/shops/[id]/blocked-dates — owner adds a range
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthContext()
  if (auth instanceof NextResponse) return auth

  const admin = getSupabaseAdmin()
  if (!admin) return notConfiguredJson()

  const allowed = await assertShopOwnerOrSuperAdmin(admin, auth, params.id)
  if (allowed instanceof NextResponse) return allowed

  try {
    const body = await request.json()
    const { startDate, endDate, label } = body as {
      startDate?: string
      endDate?: string
      label?: string
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
    }

    if (endDate < startDate) {
      return NextResponse.json({ error: 'endDate must be on or after startDate' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('shop_blocked_dates')
      .insert({
        shop_id: params.id,
        start_date: startDate,
        end_date: endDate,
        label: label || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating blocked date:', error.code)
      return serverErrorJson()
    }

    return NextResponse.json(mapRow(data as Record<string, unknown>), { status: 201 })
  } catch (error) {
    console.error('Error in POST blocked-dates:', error)
    return serverErrorJson()
  }
}

// DELETE /api/shops/[id]/blocked-dates?blockedId=uuid
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthContext()
  if (auth instanceof NextResponse) return auth

  const admin = getSupabaseAdmin()
  if (!admin) return notConfiguredJson()

  const allowed = await assertShopOwnerOrSuperAdmin(admin, auth, params.id)
  if (allowed instanceof NextResponse) return allowed

  const blockedId = new URL(request.url).searchParams.get('blockedId')
  if (!blockedId) {
    return NextResponse.json({ error: 'blockedId query param required' }, { status: 400 })
  }

  try {
    const { error } = await admin
      .from('shop_blocked_dates')
      .delete()
      .eq('id', blockedId)
      .eq('shop_id', params.id)

    if (error) {
      console.error('Error deleting blocked date:', error.code)
      return serverErrorJson()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE blocked-dates:', error)
    return serverErrorJson()
  }
}
