import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendAppointmentEmail, type AppointmentEmailKind } from '@/lib/email/appointmentEmail'
import { parseServicesFromNotes } from '@/lib/email/parseAppointmentServices'

type ReminderKind = '1day' | '2hours'

const REMINDER_CONFIG: Record<
  ReminderKind,
  {
    emailKind: AppointmentEmailKind
    sentColumn: 'reminder_1day_sent_at' | 'reminder_2hours_sent_at'
    minHoursBefore: number
    maxHoursBefore: number
  }
> = {
  '1day': {
    emailKind: 'reminder_1day',
    sentColumn: 'reminder_1day_sent_at',
    minHoursBefore: 23,
    maxHoursBefore: 25,
  },
  '2hours': {
    emailKind: 'reminder_2hours',
    sentColumn: 'reminder_2hours_sent_at',
    minHoursBefore: 1.75,
    maxHoursBefore: 2.25,
  },
}

type AppointmentRow = {
  id: string
  customer_name: string
  customer_email: string
  start_time: string
  end_time: string
  notes: string | null
  barbers: { display_name: string } | null
  shops: { name: string; phone: string | null; logo_url: string | null } | null
  services: { name: string } | null
}

/** Supabase may return a joined row as an object or a one-element array. */
function joinRow<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function normalizeAppointmentRow(raw: Record<string, unknown>): AppointmentRow {
  return {
    id: raw.id as string,
    customer_name: raw.customer_name as string,
    customer_email: raw.customer_email as string,
    start_time: raw.start_time as string,
    end_time: raw.end_time as string,
    notes: (raw.notes as string | null) ?? null,
    barbers: joinRow(raw.barbers as { display_name: string } | { display_name: string }[] | null),
    shops: joinRow(
      raw.shops as
        | { name: string; phone: string | null; logo_url: string | null }
        | { name: string; phone: string | null; logo_url: string | null }[]
        | null
    ),
    services: joinRow(raw.services as { name: string } | { name: string }[] | null),
  }
}

function authorizeCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

async function processReminders(kind: ReminderKind) {
  const admin = getSupabaseAdmin()
  if (!admin) {
    throw new Error('Supabase admin not configured')
  }

  const config = REMINDER_CONFIG[kind]
  const now = Date.now()
  const minStart = new Date(now + config.minHoursBefore * 60 * 60 * 1000).toISOString()
  const maxStart = new Date(now + config.maxHoursBefore * 60 * 60 * 1000).toISOString()

  const { data, error } = await admin
    .from('appointments')
    .select(`
      id,
      customer_name,
      customer_email,
      start_time,
      end_time,
      notes,
      barbers:barber_id ( display_name ),
      shops:shop_id ( name, phone, logo_url ),
      services:service_id ( name )
    `)
    .in('status', ['PENDING', 'CONFIRMED'])
    .not('customer_email', 'is', null)
    .is(config.sentColumn, null)
    .gte('start_time', minStart)
    .lte('start_time', maxStart)

  if (error) {
    throw error
  }

  const rows = (data ?? []).map((row) => normalizeAppointmentRow(row as Record<string, unknown>))
  let sent = 0
  let failed = 0

  for (const row of rows) {
    const email = row.customer_email?.trim()
    if (!email) continue

    const primaryService = row.services?.name ?? 'Услуга'
    const services = parseServicesFromNotes(row.notes, primaryService)

    const result = await sendAppointmentEmail(
      {
        customerEmail: email,
        customerName: row.customer_name,
        barberName: row.barbers?.display_name ?? 'Фризьор',
        shopName: row.shops?.name ?? 'Салон',
        shopPhone: row.shops?.phone ?? undefined,
        shopLogoUrl: row.shops?.logo_url ?? undefined,
        services,
        startTime: row.start_time,
        endTime: row.end_time,
      },
      config.emailKind
    )

    if (!result.success) {
      failed++
      continue
    }

    const { error: updateError } = await admin
      .from('appointments')
      .update({ [config.sentColumn]: new Date().toISOString() })
      .eq('id', row.id)

    if (updateError) {
      failed++
      console.error(`Reminder sent but failed to mark ${row.id}:`, updateError.message)
      continue
    }

    sent++
  }

  return { kind, candidates: rows.length, sent, failed }
}

/** Vercel Cron: send 1-day and 2-hour appointment reminders. */
export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = await Promise.all([
      processReminders('1day'),
      processReminders('2hours'),
    ])

    return NextResponse.json({ ok: true, results })
  } catch (error) {
    console.error('appointment-reminders cron failed:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
