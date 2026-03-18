'use client';

import { useShopBranding } from '@/contexts/ShopBrandingContext';
import BarberCard from './BarberCard';

export default function BarberCards() {
  const { barbers } = useShopBranding();

  if (barbers.length === 0) return null;

  // 1–2 barbers: normal size. 3+: compact cards in scrollable row
  const isCompact = barbers.length >= 3;

  return (
    <div className="w-full max-w-full lg:max-w-2xl">
      <div
        className={`flex gap-4 justify-center lg:justify-end overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin ${
          isCompact ? 'flex-nowrap lg:flex-wrap' : 'flex-wrap'
        }`}
        style={{ scrollbarWidth: 'thin' }}
      >
        {barbers.map((barber) => (
          <BarberCard key={barber.id} barber={barber} compact={isCompact} />
        ))}
      </div>
    </div>
  );
}
