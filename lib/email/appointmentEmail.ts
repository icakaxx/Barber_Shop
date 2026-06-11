import { Resend } from 'resend'
import { formatAppointmentWindowForEmail, parseAppointmentInstant } from '@/lib/utils/shopHours'

const resendApiKey = process.env.RESEND_API_KEY
const emailFrom =
  process.env.EMAIL_FROM || 'MENSWORLD BARBER STUDIO <bookings@elaproyosif.com>'
const emailSignature = 'MENSWORLD BARBER STUDIO / Клуб мъжки свят'
export const defaultShopPhone = process.env.SHOP_CONTACT_PHONE || '+359877378830'
const resendClient = resendApiKey ? new Resend(resendApiKey) : null

export type AppointmentEmailKind = 'confirmation' | 'reminder_1day' | 'reminder_2hours'

export type AppointmentEmailPayload = {
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

const KIND_META: Record<
  AppointmentEmailKind,
  { subject: (shopName: string) => string; bannerBg: string; bannerText: string; intro: (name: string, shop: string) => string }
> = {
  confirmation: {
    subject: (shop) => `Потвърждение на час в ${shop}`,
    bannerBg: '#16a34a',
    bannerText: '✓ &nbsp;РЕЗЕРВАЦИЯТА Е ПОТВЪРДЕНА',
    intro: (name, shop) =>
      `Потвърждаваме твоя час в <strong style="color:#111111;">${shop}</strong>.`,
  },
  reminder_1day: {
    subject: (shop) => `Напомняне: час утре в ${shop}`,
    bannerBg: '#2563eb',
    bannerText: '⏰ &nbsp;НАПОМНЯНЕ — ЧАСЪТ Е УТРЕ',
    intro: (_name, shop) =>
      `Напомняме ти, че утре имаш запазен час в <strong style="color:#111111;">${shop}</strong>.`,
  },
  reminder_2hours: {
    subject: (shop) => `Напомняне: час след 2 часа в ${shop}`,
    bannerBg: '#d97706',
    bannerText: '⏰ &nbsp;НАПОМНЯНЕ — ЧАСЪТ Е СЛЕД 2 ЧАСА',
    intro: (_name, shop) =>
      `Напомняме ти, че след около 2 часа имаш запазен час в <strong style="color:#111111;">${shop}</strong>.`,
  },
}

function buildGoogleCalendarUrl(payload: AppointmentEmailPayload, contactPhone: string): string {
  const { shopName, barberName, services, startTime, endTime } = payload
  const toGcalDate = (value: string) =>
    parseAppointmentInstant(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const gcalParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Час в ${shopName}`,
    dates: `${toGcalDate(startTime)}/${toGcalDate(endTime)}`,
    details: `Фризьор: ${barberName}${services?.length ? `\nУслуги: ${services.join(', ')}` : ''}\nТелефон: ${contactPhone}`,
    location: shopName,
  })
  return `https://calendar.google.com/calendar/render?${gcalParams.toString()}`
}

function buildAppointmentEmailHtml(
  payload: AppointmentEmailPayload,
  kind: AppointmentEmailKind
): string {
  const { customerName, barberName, shopName, shopPhone, shopLogoUrl, services, startTime, endTime } =
    payload
  const meta = KIND_META[kind]
  const contactPhone = shopPhone?.trim() || defaultShopPhone
  const timeWindow = formatAppointmentWindowForEmail(startTime, endTime)
  const gcalUrl = buildGoogleCalendarUrl(payload, contactPhone)

  const servicesRowsHtml =
    services?.length
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

  return `<!DOCTYPE html>
<html lang="bg">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
        style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td align="center" style="background:#111111;padding:32px 24px 24px;">
            ${logoHtml}
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
              ${shopName}
            </p>
          </td>
        </tr>
        <tr>
          <td align="center" style="background:${meta.bannerBg};padding:14px 24px;">
            <p style="margin:0;color:#ffffff;font-size:15px;font-weight:bold;letter-spacing:1px;">
              ${meta.bannerText}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 0;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:bold;color:#111111;">
              Здравей, ${customerName}!
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;">
              ${meta.intro(customerName, shopName)}
            </p>
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
                    <tr><td colspan="2" style="padding:0;border-top:1px solid #e5e7eb;"></td></tr>
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#6b7280;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;">Фризьор</td>
                      <td style="padding:6px 0;font-size:15px;color:#111111;">${barberName}</td>
                    </tr>
                    <tr><td colspan="2" style="padding:0;border-top:1px solid #e5e7eb;"></td></tr>
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
            <p style="margin:0 0 32px;font-size:14px;color:#6b7280;line-height:1.6;">
              Ако се наложи да промениш или отмениш часа, моля свържи се с нас
              възможно най-скоро на
              <a href="tel:${contactPhone}" style="color:#111111;font-weight:bold;text-decoration:none;">${contactPhone}</a>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 20px;border-top:1px solid #e5e7eb;">
            <p style="margin:0 0 4px;font-size:14px;color:#374151;">Поздрави,</p>
            <p style="margin:0;font-size:14px;font-weight:bold;color:#111111;letter-spacing:0.5px;">
              ${emailSignature}
            </p>
          </td>
        </tr>
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
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendAppointmentEmail(
  payload: AppointmentEmailPayload,
  kind: AppointmentEmailKind = 'confirmation'
): Promise<{ success: boolean; error?: unknown; data?: unknown }> {
  if (!resendClient) {
    return { success: false, error: 'Resend not configured' }
  }

  const meta = KIND_META[kind]
  const { data, error } = await resendClient.emails.send({
    from: emailFrom,
    to: [payload.customerEmail],
    subject: meta.subject(payload.shopName),
    html: buildAppointmentEmailHtml(payload, kind),
  })

  if (error) {
    console.error(`Failed to send ${kind} email`)
    return { success: false, error }
  }

  return { success: true, data }
}
