import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { requireAuthContext, requireRoles } from '@/lib/auth/getAuthContext'
import { STAFF_ROLES } from '@/lib/auth/types'
import { assertAppointmentStaffAccess } from '@/lib/auth/scope'
import { notConfiguredJson, serverErrorJson } from '@/lib/api/jsonErrors'
import type { ProfileRole } from '@/lib/auth/types'

// PUT /api/appointments/[id] — staff only; actor fields from session only
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthContext()
  if (auth instanceof NextResponse) return auth

  const rg = requireRoles(auth, STAFF_ROLES)
  if (rg instanceof NextResponse) return rg

  const admin = getSupabaseAdmin()
  if (!admin) return notConfiguredJson()

  try {
    const { data: row, error: loadErr } = await admin
      .from('appointments')
      .select('id, barber_id, shop_id')
      .eq('id', params.id)
      .single()

    if (loadErr || !row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const ok = await assertAppointmentStaffAccess(admin, auth, row)
    if (ok instanceof NextResponse) return ok

    const body = await request.json()
    const { status, startTime, endTime, notes, customerName, customerPhone, customerEmail } = body

    const updateData: Record<string, unknown> = {}

    if (status !== undefined) updateData.status = status
    if (startTime !== undefined) updateData.start_time = startTime
    if (endTime !== undefined) updateData.end_time = endTime
    if (notes !== undefined) updateData.notes = notes
    if (customerName !== undefined) updateData.customer_name = customerName
    if (customerPhone !== undefined) updateData.customer_phone = customerPhone
    if (customerEmail !== undefined) updateData.customer_email = customerEmail

    if (status === 'CANCELLED') {
      updateData.cancelled_at = new Date().toISOString()
      updateData.cancelled_by_user_id = auth.userId
      updateData.cancelled_by_role = auth.role as ProfileRole
      if (typeof body.cancelReason === 'string' && body.cancelReason.length > 0) {
        updateData.cancel_reason = body.cancelReason.slice(0, 2000)
      }
    }

    const { data, error } = await admin
      .from('appointments')
      .update(updateData)
      .eq('id', params.id)
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
      console.error('Error updating appointment:', error.code)
      return serverErrorJson()
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
      cancelledByUserId: data.cancelled_by_user_id,
      cancelledByRole: data.cancelled_by_role,
      cancelReason: data.cancel_reason,
      cancelledAt: data.cancelled_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error in PUT /api/appointments/[id]:', error)
    return serverErrorJson()
  }
}

// DELETE /api/appointments/[id] — cancel; staff only; actor from session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthContext()
  if (auth instanceof NextResponse) return auth

  const rg = requireRoles(auth, STAFF_ROLES)
  if (rg instanceof NextResponse) return rg

  const admin = getSupabaseAdmin()
  if (!admin) return notConfiguredJson()

  try {
    const { searchParams } = new URL(request.url)
    const cancelReason = searchParams.get('cancelReason')

    const { data: row, error: loadErr } = await admin
      .from('appointments')
      .select('id, barber_id, shop_id')
      .eq('id', params.id)
      .single()

    if (loadErr || !row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const ok = await assertAppointmentStaffAccess(admin, auth, row)
    if (ok instanceof NextResponse) return ok

    const { error } = await admin
      .from('appointments')
      .update({
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString(),
        cancelled_by_user_id: auth.userId,
        cancelled_by_role: auth.role,
        cancel_reason: cancelReason?.slice(0, 2000) || null
      })
      .eq('id', params.id)

    if (error) {
      console.error('Error cancelling appointment:', error.code)
      return serverErrorJson()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/appointments/[id]:', error)
    return serverErrorJson()
  }
}
