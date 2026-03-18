'use client';

import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import type { BarberPreview } from '@/contexts/ShopBrandingContext';

interface BarberCardProps {
  barber: BarberPreview;
  compact?: boolean;
}

export default function BarberCard({ barber, compact = false }: BarberCardProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const openBookingWithBarber = () => {
    const modal = document.getElementById('bookingModal');
    if (modal) {
      modal.classList.remove('hidden');
      document.dispatchEvent(
        new CustomEvent('bookingModalOpen', { detail: { barberId: barber.id } })
      );
    }
  };

  return (
    <div
      className={`flex flex-col bg-white/95 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-white/20 shrink-0 ${
        compact ? 'min-w-[140px] max-w-[160px]' : 'min-w-[200px] max-w-[240px]'
      }`}
    >
      <div
        className={`relative bg-gray-200 overflow-hidden ${
          compact ? 'h-[140px] w-full' : 'h-[220px] w-full'
        }`}
      >
        {barber.photoUrl ? (
          <img
            src={barber.photoUrl}
            alt={barber.displayName}
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center bg-gray-300 text-gray-500 font-bold"
            style={{ fontSize: compact ? '1.5rem' : '2.25rem' }}
          >
            {barber.displayName.charAt(0)}
          </div>
        )}
      </div>
      <div className={`flex flex-col flex-1 ${compact ? 'p-3' : 'p-4'}`}>
        <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-lg'}`}>
          {barber.displayName}
        </h3>
        {barber.bio && (
          <div className="mt-1">
            <p
              className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'} ${
                expanded ? '' : 'line-clamp-2'
              }`}
            >
              {barber.bio}
            </p>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-black/70 hover:text-black text-xs font-medium underline underline-offset-2"
            >
              {expanded ? t('hero.showLess') : t('hero.seeFullDescription')}
            </button>
          </div>
        )}
        <button
          onClick={openBookingWithBarber}
          className={`mt-3 w-full rounded-md bg-black px-3 py-2 font-semibold text-white hover:bg-gray-800 transition-colors ${compact ? 'text-xs' : 'text-sm'}`}
        >
          {t('hero.quickAppointment')}
        </button>
      </div>
    </div>
  );
}
