import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { validateSlotAgainstShop } from '@/lib/utils/shopHours'
import { requireAuthContext, requireRoles } from '@/lib/auth/getAuthContext'
import { STAFF_ROLES } from '@/lib/auth/types'
import {
  fetchBarberRow,
  getAppointmentReadScope,
} from '@/lib/auth/scope'
import { forbiddenJson, notConfiguredJson, serverErrorJson } from '@/lib/api/jsonErrors'

const resendApiKey = process.env.RESEND_API_KEY
const emailFrom =
  process.env.EMAIL_FROM || 'Barber Studio Kalchev Style <kalchevstylestudio@parfumcho.com>'
const resendClient = resendApiKey ? new Resend(resendApiKey) : null

type AppointmentEmailPayload = {
  customerEmail: string
  customerName: string
  barberName: string
  shopName: string
  services: string[]
  startTime: string
  endTime: string
}

const formatAppointmentWindow = (start: string, end: string) => {
  const startDate = new Date(start)
  const endDate = new Date(end)

  const datePart = startDate.toLocaleDateString('bg-BG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  const startTimePart = startDate.toLocaleTimeString('bg-BG', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const endTimePart = endDate.toLocaleTimeString('bg-BG', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return `${datePart}, ${startTimePart} - ${endTimePart}`
}

const sendAppointmentEmail = async (payload: AppointmentEmailPayload) => {
  if (!resendClient) {
    return { success: false, error: 'Resend not configured' }
  }

  const { customerEmail, customerName, barberName, shopName, services, startTime, endTime } =
    payload

  const timeWindow = formatAppointmentWindow(startTime, endTime)
  const servicesListHtml =
    services && services.length
      ? services.map(service => `<li>${service}</li>`).join('')
      : ''

  const { data, error } = await resendClient.emails.send({
    from: emailFrom,
    to: [customerEmail],
    subject: `Потвърждение на час в ${shopName}`,
    html: `
      <h2>Здравей, ${customerName}!</h2>
      <p>Потвърждаваме твоя час в <strong>${shopName}</strong>.</p>
      <p>Детайли за твоя час:</p>
      <ul>
        <li><strong>Салон:</strong> ${shopName}</li>
        <li><strong>Барбер:</strong> ${barberName}</li>
        <li><strong>Кога:</strong> ${timeWindow}</li>
      </ul>
      ${
        servicesListHtml
          ? `
      <p><strong>Услуги:</strong></p>
      <ul>
        ${servicesListHtml}
      </ul>`
          : ''
      }
      <p>Ако се наложи да промениш или отмениш часа, моля свържи се със салона възможно най-скоро.</p>
      <p>Поздрави,<br/>Barber Studio Kalchev Style</p>
    `
  })

  if (error) {
    console.error('Failed to send appointment email')
    return { success: false, error }
  }

  return { success: true, data }
}

// GET /api/appointments — staff only, shop-scoped
export async function GET(request: NextRequest) {
  const auth = await requireAuthContext()
  if (auth instanceof NextResponse) return auth

  const roleGate = requireRoles(auth, STAFF_ROLES)
  if (roleGate instanceof NextResponse) return roleGate

  const admin = getSupabaseAdmin()
  if (!admin) return notConfiguredJson()

  const scope = await getAppointmentReadScope(admin, auth)
  if (scope instanceof NextResponse) return scope

  try {
    const { searchParams } = new URL(request.url)
    const barberId = searchParams.get('barberId')
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const shopIdParam = searchParams.get('shopId')

    if (shopIdParam) {
      if (scope.shopIds !== null && !scope.shopIds.includes(shopIdParam)) {
        return forbiddenJson()
      }
    }

    if (barberId) {
      const b = await fetchBarberRow(admin, barberId)
      if (!b) return NextResponse.json([])
      if (scope.shopIds !== null && !scope.shopIds.includes(b.shop_id)) {
        return forbiddenJson()
      }
    }

    let query = admin
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

    if (scope.shopIds !== null) {
      if (shopIdParam) {
        query = query.eq('shop_id', shopIdParam)
      } else if (scope.shopIds.length === 1) {
        query = query.eq('shop_id', scope.shopIds[0])
      } else {
        query = query.in('shop_id', scope.shopIds)
      }
    }

    if (barberId) {
      query = query.eq('barber_id', barberId)
    }

    if (date) {
      const startOfDay = new Date(`${date}T00:00:00Z`)
      const endOfDay = new Date(`${date}T23:59:59Z`)
      query = query
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
    }

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
      console.error('Error fetching appointments:', error.code)
      return serverErrorJson()
    }

    const appointments = (data ?? []).map(apt => ({
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
    return serverErrorJson()
  }
}

// POST /api/appointments — public booking (anonymous). Uses admin only after validation chain.
export async function POST(request: NextRequest) {
  const admin = getSupabaseAdmin()
  if (!admin) return notConfiguredJson()

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
      notes,
      allServiceNames
    } = body

    if (!shopId || !serviceId || !barberId || !customerName || !customerPhone || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const start = new Date(startTime)
    const end = new Date(endTime)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid start or end time' }, { status: 400 })
    }

    const { data: barberRow, error: barberLookupError } = await admin
      .from('barbers')
      .select('id, shop_id')
      .eq('id', barberId)
      .single()

    if (barberLookupError || !barberRow) {
      return NextResponse.json({ error: 'Barber not found' }, { status: 404 })
    }

    if (barberRow.shop_id !== shopId) {
      return NextResponse.json(
        { error: 'Barber does not belong to this shop' },
        { status: 400 }
      )
    }

    const { data: shopRow, error: shopLookupError } = await admin
      .from('shops')
      .select('id, working_hours, lunch_start, lunch_end')
      .eq('id', shopId)
      .single()

    if (shopLookupError || !shopRow) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    const slotCheck = validateSlotAgainstShop(
      shopRow.working_hours,
      shopRow.lunch_start ?? undefined,
      shopRow.lunch_end ?? undefined,
      start,
      end
    )

    if (!slotCheck.ok) {
      const messages: Record<string, string> = {
        CLOSED: 'The shop is closed on this day',
        OUTSIDE_HOURS: 'Appointment is outside business hours',
        LUNCH: 'Appointment overlaps the lunch break',
        SPANS_MIDNIGHT: 'Invalid appointment time window',
      }
      return NextResponse.json(
        { error: messages[slotCheck.code] ?? 'Invalid appointment time', code: slotCheck.code },
        { status: 400 }
      )
    }

    const { data: existing } = await admin
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

    const { data, error } = await admin
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
      console.error('Error creating appointment:', error.code)
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
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    const servicesForEmail =
      Array.isArray(allServiceNames) && allServiceNames.length
        ? allServiceNames
        : [appointment.serviceName]

    if (appointment.customerEmail) {
      const emailResult = await sendAppointmentEmail({
        customerEmail: appointment.customerEmail,
        customerName: appointment.customerName,
        barberName: appointment.barberName,
        shopName: appointment.shopName,
        services: servicesForEmail,
        startTime: appointment.startTime,
        endTime: appointment.endTime
      })

      if (emailResult && !emailResult.success) {
        console.error('Email sending failed')
      }
    }

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/appointments:', error)
    return serverErrorJson()
  }
}
