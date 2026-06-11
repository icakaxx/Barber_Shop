import { NextRequest, NextResponse } from 'next/server'
import { sendAppointmentEmail } from '@/lib/email/appointmentEmail'
import {
  formatDateYYYYMMDDInTimeZone,
  shopLocalDateTimeToUtc,
  SHOP_BUSINESS_TIMEZONE,
} from '@/lib/utils/shopHours'

/** Dev-only: send sample 1-day and 2-hour reminder emails. */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')?.trim()
  if (!email) {
    return NextResponse.json({ error: 'Missing ?email=' }, { status: 400 })
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateStr = formatDateYYYYMMDDInTimeZone(tomorrow, SHOP_BUSINESS_TIMEZONE)
  const startTime = shopLocalDateTimeToUtc(dateStr, '13:00').toISOString()
  const endTime = shopLocalDateTimeToUtc(dateStr, '13:30').toISOString()

  const payload = {
    customerEmail: email,
    customerName: 'Христо Тест',
    barberName: 'Йосиф Младенов',
    shopName: 'Клуб Мъжки Свят',
    shopPhone: '+359877378830',
    services: ['Мъжко подстригване'],
    startTime,
    endTime,
  }

  const oneDay = await sendAppointmentEmail(payload, 'reminder_1day')
  const twoHours = await sendAppointmentEmail(payload, 'reminder_2hours')

  return NextResponse.json({
    ok: oneDay.success && twoHours.success,
    sentTo: email,
    results: {
      reminder_1day: oneDay.success ? 'sent' : oneDay.error,
      reminder_2hours: twoHours.success ? 'sent' : twoHours.error,
    },
  })
}
