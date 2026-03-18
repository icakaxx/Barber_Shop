'use client';

import { Star } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useShopBranding } from '@/contexts/ShopBrandingContext';
import BarberCards from './BarberCards';

const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop';

export default function Hero() {
  const { t } = useI18n();
  const { shop, barbers, isLoading } = useShopBranding();
  // Only use default when loaded and no custom image - avoids flash of old image on first load
  const heroImageUrl = isLoading ? undefined : (shop?.heroImageUrl || DEFAULT_HERO_IMAGE);
  const shopName = shop?.name || t('hero.title');
  const heroDescription = shop?.heroDescription || t('hero.premiumCuts');

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center bg-black overflow-hidden">
      {heroImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${heroImageUrl}')`,
          }}
        />
      )}
      <div className="absolute inset-0 hero-gradient" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12">
          <div className={`order-1 ${barbers.length > 0 ? 'lg:order-1' : ''} flex-1 text-center lg:text-left max-w-3xl`}>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
            {shopName}
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-white/90">
            {heroDescription}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              onClick={() => {
                const modal = document.getElementById('bookingModal');
                if (modal) {
                  modal.classList.remove('hidden');
                  document.dispatchEvent(new CustomEvent('bookingModalOpen'));
                }
              }}
              className="inline-flex items-center justify-center rounded-md bg-white px-8 py-3 text-lg font-semibold text-black shadow-lg hover:bg-gray-100 transition-all"
            >
              {t('hero.scheduleNow')}
            </button>
            <a
              href="#services"
              className="inline-flex items-center justify-center rounded-md bg-transparent border-2 border-white px-8 py-3 text-lg font-semibold text-white hover:bg-white/10 transition-all"
            >
              {t('hero.viewServices')}
            </a>
          </div>

          <div className="mt-6 flex items-center justify-center lg:justify-start gap-2 text-white/80 text-sm md:text-base">
            <div className="flex text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
            </div>
            <span>{t('hero.rating')}</span>
          </div>
          </div>
          {barbers.length > 0 && (
            <div className="order-2 shrink-0">
              <BarberCards />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

