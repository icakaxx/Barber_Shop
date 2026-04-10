'use client';

import Link from 'next/link';
import { Instagram, Facebook, Twitter, Scissors, Crown } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useShopBranding } from '@/contexts/ShopBrandingContext';

export default function Footer() {
  const { t } = useI18n();
  const { shop } = useShopBranding();
  const shopName = shop?.name || t('hero.title');

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
              <li><Link href="#" className="hover:text-gray-300 transition-colors">{t('footer.privacyPolicy')}</Link></li>
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
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all"
              >
                <Twitter className="w-5 h-5" />
              </a>
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



