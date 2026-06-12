'use client';

import Link from 'next/link';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { ShopBrandingProvider } from '@/contexts/ShopBrandingContext';
import { useI18n } from '@/contexts/I18nContext';
import { privacyPolicyBg, privacyPolicyEn } from '@/lib/legal/privacyPolicyContent';

export default function PrivacyPolicyPage() {
  const { locale, t } = useI18n();
  const content = locale === 'en' ? privacyPolicyEn : privacyPolicyBg;

  return (
    <ShopBrandingProvider>
      <Header />
      <main className="min-h-screen bg-white pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-black transition-colors mb-8 inline-block"
          >
            ← {t('footer.home')}
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            {content.pageTitle}
          </h1>
          <p className="text-sm text-gray-500 mb-8">{content.lastUpdatedLabel}</p>

          <p className="text-gray-700 leading-relaxed mb-10">{content.intro}</p>

          <div className="space-y-8">
            {content.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-bold text-gray-900 mb-3">{section.title}</h2>
                <div className="space-y-3">
                  {section.paragraphs.map((paragraph, index) => (
                    <p key={index} className="text-gray-700 leading-relaxed text-sm sm:text-base">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </ShopBrandingProvider>
  );
}
