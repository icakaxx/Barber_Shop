'use client';

import Link from 'next/link';
import { Instagram, Facebook, Scissors, Crown } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useShopBranding } from '@/contexts/ShopBrandingContext';

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

export default function Footer() {
  const { t } = useI18n();
  const { shop } = useShopBranding();
  const shopName = shop?.name || t('hero.title');
  const tiktokUrl = shop?.tiktokUrl?.trim();

  return (
    <footer className="bg-black text-white py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center">
            <h3 className="text-3xl font-bold mb-4">{shopName}</h3>
            <p className="text-gray-400 max-w-xs mx-auto">
              {t('footer.description')}
            </p>
          </div>

          <div className="flex flex-col items-center">
            <h4 className="text-lg font-semibold mb-6 uppercase tracking-wider text-gray-400">{t('footer.quickLinks')}</h4>
            <ul className="space-y-4 flex flex-col items-center">
              <li><Link href="/" className="hover:text-gray-300 transition-colors">{t('footer.home')}</Link></li>
              <li><a href="#services" className="hover:text-gray-300 transition-colors">{t('footer.services')}</a></li>
              <li><a href="#location" className="hover:text-gray-300 transition-colors">{t('footer.location')}</a></li>
              <li><Link href="/privacy" className="hover:text-gray-300 transition-colors">{t('footer.privacyPolicy')}</Link></li>
            </ul>
          </div>

          <div className="flex flex-col items-center">
            <h4 className="text-lg font-semibold mb-6 uppercase tracking-wider text-gray-400">{t('footer.followUs')}</h4>
            <div className="flex items-center justify-center gap-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all"
              >
                <Facebook className="w-5 h-5" />
              </a>
              {tiktokUrl && (
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all"
                  aria-label="TikTok"
                >
                  <TikTokIcon className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 text-sm text-gray-500 flex flex-col items-center justify-center gap-4 px-1 text-center">
          <p className="max-w-prose mx-auto">&copy; {new Date().getFullYear()} {shopName}. {t('footer.allRightsReserved')}</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <Link
              href="/barbers"
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <Scissors className="w-4 h-4" /> {t('footer.barberView')}
            </Link>
            <Link
              href="/superadmin"
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <Crown className="w-4 h-4" /> {t('footer.barberManagement')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
