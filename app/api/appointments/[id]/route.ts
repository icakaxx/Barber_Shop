import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'

// PUT /api/appointments/[id] - Update an appointment
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
    const { status, startTime, endTime, notes, customerName, customerPhone, customerEmail } = body

    const updateData: any = {}
    
    if (status !== undefined) updateData.status = status
    if (startTime !== undefined) updateData.start_time = startTime
    if (endTime !== undefined) updateData.end_time = endTime
    if (notes !== undefined) updateData.notes = notes
    if (customerName !== undefined) updateData.customer_name = customerName
    if (customerPhone !== undefined) updateData.customer_phone = customerPhone
    if (customerEmail !== undefined) updateData.customer_email = customerEmail

    // If cancelling, add cancellation info
    if (status === 'CANCELLED') {
      updateData.cancelled_at = new Date().toISOString()
      // cancelled_by_user_id and cancelled_by_role should be set by the client
      if (body.cancelledByUserId) updateData.cancelled_by_user_id = body.cancelledByUserId
      if (body.cancelledByRole) updateData.cancelled_by_role = body.cancelledByRole
      if (body.cancelReason) updateData.cancel_reason = body.cancelReason
    }

    const { data, error } = await supabaseServer
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
      console.error('Error updating appointment:', error)
      return NextResponse.json(
        { error: `Failed to update appointment: ${error.message}` },
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/appointments/[id] - Cancel an appointment (soft delete)
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
    const { searchParams } = new URL(request.url)
    const cancelledByUserId = searchParams.get('cancelledByUserId')
    const cancelledByRole = searchParams.get('cancelledByRole')
    const cancelReason = searchParams.get('cancelReason')

    const { error } = await supabaseServer
      .from('appointments')
      .update({
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString(),
        cancelled_by_user_id: cancelledByUserId || null,
        cancelled_by_role: cancelledByRole || null,
        cancel_reason: cancelReason || null
      })
      .eq('id', params.id)

    if (error) {
      console.error('Error cancelling appointment:', error)
      return NextResponse.json(
        { error: `Failed to cancel appointment: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/appointments/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

