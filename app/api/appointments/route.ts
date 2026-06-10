import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { validateSlotAgainstShop, formatAppointmentWindowForEmail, parseAppointmentInstant } from '@/lib/utils/shopHours'
import { requireAuthContext, requireRoles } from '@/lib/auth/getAuthContext'
import { STAFF_ROLES } from '@/lib/auth/types'
import {
  fetchBarberRow,
  getAppointmentReadScope,
} from '@/lib/auth/scope'
import { forbiddenJson, notConfiguredJson, serverErrorJson } from '@/lib/api/jsonErrors'

const resendApiKey = process.env.RESEND_API_KEY
const emailFrom =
  process.env.EMAIL_FROM || 'MENSWORLD BARBER STUDIO <bookings@elaproyosif.com>'
const emailSignature = 'MENSWORLD BARBER STUDIO / Клуб мъжки свят'
const defaultShopPhone = process.env.SHOP_CONTACT_PHONE || '+359877378830'
const resendClient = resendApiKey ? new Resend(resendApiKey) : null

type AppointmentEmailPayload = {
  customerEmail: string
  customerName: string
  barberName: string
  shopName: string
  shopPhone?: string
  shopLogoUrl?: string
  services: string[]
  startTime: string
  endTime: string
}

const sendAppointmentEmail = async (payload: AppointmentEmailPayload) => {
  if (!resendClient) {
    return { success: false, error: 'Resend not configured' }
  }

  const { customerEmail, customerName, barberName, shopName, shopPhone, shopLogoUrl, services, startTime, endTime } =
    payload

  const contactPhone = shopPhone?.trim() || defaultShopPhone
  console.log('[email] shopLogoUrl:', shopLogoUrl ?? '(none)')
  const timeWindow = formatAppointmentWindowForEmail(startTime, endTime)

  // Google Calendar deep link (dates must be UTC in YYYYMMDDTHHMMSSZ format)
  const toGcalDate = (value: string) =>
    parseAppointmentInstant(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const gcalParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Час в ${shopName}`,
    dates: `${toGcalDate(startTime)}/${toGcalDate(endTime)}`,
    details: `Фризьор: ${barberName}${services?.length ? `\nУслуги: ${services.join(', ')}` : ''}\nТелефон: ${contactPhone}`,
    location: shopName,
  })
  const gcalUrl = `https://calendar.google.com/calendar/render?${gcalParams.toString()}`
  const servicesRowsHtml =
    services && services.length
      ? services
          .map(
            (service) =>
              `<tr><td style="padding:6px 0;color:#374151;font-size:15px;">✂ ${service}</td></tr>`
          )
          .join('')
      : ''

  const logoHtml = shopLogoUrl
    ? `<img src="${shopLogoUrl}" alt="${shopName}" width="80" height="80"
         style="border-radius:50%;object-fit:cover;border:3px solid #ffffff;display:block;margin:0 auto 12px;" />`
    : `<table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
         <tr>
           <td width="64" height="64" align="center" valign="middle"
             style="width:64px;height:64px;border-radius:50%;background:#333333;font-size:28px;color:#ffffff;text-align:center;line-height:64px;">
             &#9986;
           </td>
         </tr>
       </table>`

  const { data, error } = await resendClient.emails.send({
    from: emailFrom,
    to: [customerEmail],
    subject: `Потвърждение на час в ${shopName}`,
    html: `<!DOCTYPE html>
<html lang="bg">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">

      <!-- Card -->
      <table width="600" cellpadding="0" cellspacing="0"
        style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td align="center" style="background:#111111;padding:32px 24px 24px;">
            ${logoHtml}
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
              ${shopName}
            </p>
          </td>
        </tr>

        <!-- Green confirmation bar -->
        <tr>
          <td align="center" style="background:#16a34a;padding:14px 24px;">
            <p style="margin:0;color:#ffffff;font-size:15px;font-weight:bold;letter-spacing:1px;">
              ✓ &nbsp;РЕЗЕРВАЦИЯТА Е ПОТВЪРДЕНА
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 32px 0;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:bold;color:#111111;">
              Здравей, ${customerName}!
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;">
              Потвърждаваме твоя час в <strong style="color:#111111;">${shopName}</strong>.
            </p>

            <!-- Details box -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 16px;font-size:11px;font-weight:bold;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;">
                    Детайли за твоя час
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;width:90px;font-size:13px;color:#6b7280;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;">Салон</td>
                      <td style="padding:6px 0;font-size:15px;color:#111111;font-weight:bold;">${shopName}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding:0;border-top:1px solid #e5e7eb;"></td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#6b7280;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;">Фризьор</td>
                      <td style="padding:6px 0;font-size:15px;color:#111111;">${barberName}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding:0;border-top:1px solid #e5e7eb;"></td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#6b7280;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;">Кога</td>
                      <td style="padding:6px 0;font-size:15px;color:#111111;font-weight:bold;">${timeWindow}</td>
                    </tr>
                    ${servicesRowsHtml
                      ? `<tr><td colspan="2" style="padding:0;border-top:1px solid #e5e7eb;"></td></tr>
                         <tr>
                           <td style="padding:6px 0;font-size:13px;color:#6b7280;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;">Услуги</td>
                           <td style="padding:6px 0;">
                             <table cellpadding="0" cellspacing="0">${servicesRowsHtml}</table>
                           </td>
                         </tr>`
                      : ''}
                  </table>
                </td>
              </tr>
            </table>

            <!-- Add to Google Calendar -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${gcalUrl}" target="_blank"
                     style="display:inline-block;background:#111111;color:#ffffff;font-size:14px;font-weight:bold;
                            padding:13px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">
                    📅 &nbsp;Добави в Google Календар
                  </a>
                </td>
              </tr>
            </table>

            <!-- Notice -->
            <p style="margin:0 0 32px;font-size:14px;color:#6b7280;line-height:1.6;">
              Ако се наложи да промениш или отмениш часа, моля свържи се с нас
              възможно най-скоро на
              <a href="tel:${contactPhone}" style="color:#111111;font-weight:bold;text-decoration:none;">${contactPhone}</a>.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px 20px;border-top:1px solid #e5e7eb;">
            <p style="margin:0 0 4px;font-size:14px;color:#374151;">Поздрави,</p>
            <p style="margin:0;font-size:14px;font-weight:bold;color:#111111;letter-spacing:0.5px;">
              ${emailSignature}
            </p>
          </td>
        </tr>

        <!-- Credit -->
        <tr>
          <td align="center" style="padding:12px 32px 24px;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">
              Създадено от
              <a href="https://www.hmwspro.com/bg" target="_blank"
                 style="color:#9ca3af;text-decoration:underline;">H&amp;M WsPro</a>
            </p>
          </td>
        </tr>

      </table>
      <!-- /Card -->

    </td></tr>
  </table>
  <!-- /Wrapper -->

</body>
</html>`
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
    const createdAfter = searchParams.get('createdAfter')
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

    if (createdAfter) {
      const parsed = new Date(createdAfter)
      if (!Number.isNaN(parsed.getTime())) {
        query = query.gte('created_at', parsed.toISOString())
      }
    }

    if (status) {
      const statuses = status.split(',')
      if (statuses.length === 1) {
        query = query.eq('status', statuses[0])
      } else {
        query = query.in('status', statuses)
      }
    } else {
      // Active appointments only — cancelled rows stay in DB but are hidden & slots freed
      query = query.neq('status', 'CANCELLED')
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

    const { data: blockedRows } = await admin
      .from('shop_blocked_dates')
      .select('start_date, end_date')
      .eq('shop_id', shopId)

    const blockedRanges = (blockedRows ?? []).map((r) => ({
      startDate: r.start_date as string,
      endDate: r.end_date as string,
    }))

    const slotCheck = validateSlotAgainstShop(
      shopRow.working_hours,
      shopRow.lunch_start ?? undefined,
      shopRow.lunch_end ?? undefined,
      start,
      end,
      undefined,
      blockedRanges
    )

    if (!slotCheck.ok) {
      const messages: Record<string, string> = {
        CLOSED: 'The shop is closed on this day',
        OUTSIDE_HOURS: 'Appointment is outside business hours',
        LUNCH: 'Appointment overlaps the lunch break',
        SPANS_MIDNIGHT: 'Invalid appointment time window',
        BLOCKED: 'The shop is closed on this date (vacation)',
        INVALID_SLOT_INTERVAL: 'Appointments must start on 30-minute intervals',
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
          name,
          phone,
          logo_url
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
      shopPhone: data.shops?.phone || undefined,
      shopLogoUrl: (data.shops as any)?.logo_url || undefined,
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
        shopPhone: appointment.shopPhone,
        shopLogoUrl: appointment.shopLogoUrl,
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
