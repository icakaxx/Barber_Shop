'use client';

import Link from 'next/link';
import { Crown } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useShopBranding } from '@/contexts/ShopBrandingContext';
import LanguageCurrencySwitcher from './LanguageCurrencySwitcher';

function openBookingModal() {
  const modal = document.getElementById('bookingModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.dispatchEvent(new CustomEvent('bookingModalOpen'));
  }
}

function HeaderBrand() {
  const { t } = useI18n();
  const { shop } = useShopBranding();
  const shopName = shop?.name || t('hero.title');
  const logoUrl = shop?.logoUrl;

  return (
    <Link
      href="/"
      className="flex min-w-0 items-center gap-2 sm:gap-3 text-lg sm:text-xl font-bold tracking-tight text-gray-900"
    >
      {logoUrl ? (
        <>
          <img src={logoUrl} alt={shopName} className="h-10 sm:h-14 w-auto max-w-[140px] sm:max-w-[180px] object-contain shrink-0" />
          <span className="hidden sm:inline truncate">{shopName}</span>
        </>
      ) : (
        <span className="truncate">{shopName}</span>
      )}
    </Link>
  );
}

export default function Header() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg pt-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile: logo | book (center) | lang + crown */}
        <div className="md:hidden grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 w-full min-h-[4rem] py-2">
          <div className="min-w-0 justify-self-start">
            <HeaderBrand />
          </div>
          <button
            type="button"
            onClick={openBookingModal}
            className="inline-flex items-center justify-center rounded-md bg-black px-3 py-2 text-sm font-medium text-white shadow hover:bg-black/90 transition-colors touch-manipulation min-h-[44px] shrink-0 justify-self-center"
          >
            {t('nav.bookNow')}
          </button>
          <div className="flex justify-self-end items-center gap-1 shrink-0">
            <LanguageCurrencySwitcher />
            <Link
              href="/login?redirect=/owner"
              className="p-2.5 text-gray-600 hover:text-gray-900 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              title={t('nav.ownerDashboard')}
            >
              <Crown className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex min-h-20 items-center justify-between gap-2 py-0">
          <HeaderBrand />
          <nav className="flex items-center gap-8">
            <a href="#services" className="text-sm font-medium hover:text-gray-600 transition-colors">
              {t('nav.services')}
            </a>
            <a href="#location" className="text-sm font-medium hover:text-gray-600 transition-colors">
              {t('nav.contact')}
            </a>
            <LanguageCurrencySwitcher />
            <button
              type="button"
              onClick={openBookingModal}
              className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow hover:bg-black/90 transition-colors"
            >
              {t('nav.bookNow')}
            </button>
            <Link
              href="/login?redirect=/owner"
              className="p-2.5 text-gray-600 hover:text-gray-900 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              title={t('nav.ownerDashboard')}
            >
              <Crown className="w-5 h-5" />
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
