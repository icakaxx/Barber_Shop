/**
 * One-off: send sample reminder emails. Run from project root:
 * npx tsx --env-file=.env.local scripts/send-reminder-samples.ts aphtex@gmail.com
 */
import { sendAppointmentEmail } from '../lib/email/appointmentEmail'
import {
  formatDateYYYYMMDDInTimeZone,
  shopLocalDateTimeToUtc,
  SHOP_BUSINESS_TIMEZONE,
} from '../lib/utils/shopHours'

const email = process.argv[2] || 'aphtex@gmail.com'

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

async function main() {
  console.log(`Sending preview reminders to ${email}...`)
  const oneDay = await sendAppointmentEmail(payload, 'reminder_1day')
  console.log('1-day reminder:', oneDay.success ? 'sent' : oneDay.error)
  const twoHours = await sendAppointmentEmail(payload, 'reminder_2hours')
  console.log('2-hour reminder:', twoHours.success ? 'sent' : twoHours.error)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
