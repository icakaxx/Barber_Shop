'use client';

import Link from 'next/link';
import { Crown } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useShopBranding } from '@/contexts/ShopBrandingContext';
import LanguageCurrencySwitcher from './LanguageCurrencySwitcher';

export default function Header() {
  const { t } = useI18n();
  const { shop } = useShopBranding();
  const shopName = shop?.name || t('hero.title');
  const logoUrl = shop?.logoUrl;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-xl font-bold tracking-tight text-gray-900">
            {logoUrl ? (
              <>
                <img src={logoUrl} alt={shopName} className="h-14 w-auto max-w-[180px] object-contain" />
                <span className="hidden sm:inline">{shopName}</span>
              </>
            ) : (
              shopName
            )}
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-sm font-medium hover:text-gray-600 transition-colors">
              {t('nav.services')}
            </a>
            <a href="#location" className="text-sm font-medium hover:text-gray-600 transition-colors">
              {t('nav.contact')}
            </a>
            <LanguageCurrencySwitcher />
            <button
              onClick={() => {
                const modal = document.getElementById('bookingModal');
                if (modal) {
                  modal.classList.remove('hidden');
                  document.dispatchEvent(new CustomEvent('bookingModalOpen'));
                }
              }}
              className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow hover:bg-black/90 transition-colors"
            >
              {t('nav.bookNow')}
            </button>
            <Link
              href="/login?redirect=/owner"
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              title={t('nav.ownerDashboard')}
            >
              <Crown className="w-5 h-5" />
            </Link>
          </nav>

          <div className="md:hidden flex items-center gap-2">
            <LanguageCurrencySwitcher />
            <button
              onClick={() => {
                const modal = document.getElementById('bookingModal');
                if (modal) modal.classList.remove('hidden');
              }}
              className="inline-flex items-center justify-center rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-black/90 transition-colors"
            >
              {t('nav.bookNow')}
            </button>
            <Link
              href="/login?redirect=/owner"
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              title={t('nav.ownerDashboard')}
            >
              <Crown className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

