'use client';

import { MapPin, Clock, Phone, Navigation } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useShopBranding } from '@/contexts/ShopBrandingContext';
import { type WorkingHoursMap } from '@/lib/utils/shopHours';

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;
const WEEKEND_KEYS = ['sat', 'sun'] as const;

function WorkingHoursDisplay({ workingHours, t }: { workingHours: WorkingHoursMap; t: (key: string) => string }) {
  const formatDay = (key: string) => {
    const dayName = t(`location.day${key.charAt(0).toUpperCase() + key.slice(1)}`);
    const h = workingHours[key as keyof WorkingHoursMap];
    if (h) return `${dayName}: ${h.open} – ${h.close}`;
    return `${dayName}: ${t('location.closed')}`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xl text-gray-600">
      <div>
        {WEEKDAY_KEYS.map((key) => (
          <p key={key}>{formatDay(key)}</p>
        ))}
      </div>
      <div>
        {WEEKEND_KEYS.map((key) => (
          <p key={key}>{formatDay(key)}</p>
        ))}
      </div>
    </div>
  );
}

export default function LocationSection() {
  const { t } = useI18n();
  const { shop } = useShopBranding();
  const address = shop?.address || t('location.address');
  const city = shop?.city;
  const addressDisplay = city ? `${address}${address && !address.includes(city) ? ', ' + city : ''}` : address;
  const phone = shop?.phone || '+359 888 123 456';
  const hasStructuredHours = shop?.workingHours && Object.keys(shop.workingHours).length > 0;
  const SHOP_COORDS = '43.141386804834625,24.717947891059705';
  const mapsQuery = shop?.address && shop?.city
    ? encodeURIComponent(`${shop.address}, ${shop.city}`)
    : SHOP_COORDS;
  const mapsEmbedSrc = `https://maps.google.com/maps?q=${mapsQuery}&z=15&output=embed`;

  return (
    <section id="location" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">{t('location.title')}</h2>
          <div className="mt-2 w-20 h-1 bg-black mx-auto" />
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 overflow-hidden rounded-2xl shadow-lg h-[450px]">
            <iframe
              src={mapsEmbedSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="flex flex-col space-y-8 order-1 md:order-2">
            <div>
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <MapPin className="w-6 h-6" /> {t('location.visitUs')}
              </h3>
              <p className="text-xl text-gray-600">{addressDisplay}</p>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Clock className="w-6 h-6" /> {t('location.workingHours')}
              </h3>
              {hasStructuredHours ? (
                <WorkingHoursDisplay workingHours={shop!.workingHours!} t={t} />
              ) : (
                <p className="text-xl text-gray-600">{shop?.workingHoursText || t('location.hours')}</p>
              )}
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Phone className="w-6 h-6" /> {t('location.contact')}
              </h3>
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="text-xl text-gray-600 hover:text-black transition-colors font-medium"
              >
                {phone}
              </a>
            </div>

            <div className="pt-4">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-white border border-gray-200 px-8 py-3 text-lg font-semibold text-black shadow-sm hover:bg-gray-50 transition-all gap-2"
              >
                <Navigation className="w-5 h-5" />
                {t('location.openInMaps')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



