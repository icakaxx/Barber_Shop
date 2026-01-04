'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/contexts/I18nContext';
import LanguageCurrencySwitcher from './LanguageCurrencySwitcher';

export default function Header() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
            Barber King
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
          </div>
        </div>
      </div>
    </header>
  );
}

