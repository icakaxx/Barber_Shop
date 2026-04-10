'use client';

import { Scissors, Sparkles, Calendar, Package } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

export default function TrustSection() {
  const { t } = useI18n();
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t('trust.title')}</h2>
          <div className="mt-2 w-20 h-1 bg-black mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto justify-items-stretch">
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="w-12 h-12 mx-auto bg-black text-white flex items-center justify-center rounded-lg mb-6">
              <Scissors className="w-6 h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">{t('trust.professionalBarbers.title')}</h3>
            <p className="text-gray-500 leading-relaxed text-sm sm:text-base">{t('trust.professionalBarbers.description')}</p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="w-12 h-12 mx-auto bg-black text-white flex items-center justify-center rounded-lg mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">{t('trust.cleanModern.title')}</h3>
            <p className="text-gray-500 leading-relaxed text-sm sm:text-base">{t('trust.cleanModern.description')}</p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="w-12 h-12 mx-auto bg-black text-white flex items-center justify-center rounded-lg mb-6">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">{t('trust.onlineBooking.title')}</h3>
            <p className="text-gray-500 leading-relaxed text-sm sm:text-base">{t('trust.onlineBooking.description')}</p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="w-12 h-12 mx-auto bg-black text-white flex items-center justify-center rounded-lg mb-6">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">{t('trust.premiumProducts.title')}</h3>
            <p className="text-gray-500 leading-relaxed text-sm sm:text-base">{t('trust.premiumProducts.description')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}



