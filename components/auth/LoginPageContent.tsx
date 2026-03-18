'use client';

import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { Suspense } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import LoginForm from './LoginForm';

export default function LoginPageContent() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen login-page-bg flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-8 transition-colors"
        >
          {t('auth.backToHome')}
        </Link>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl shadow-black/30 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-black p-3 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('auth.loginPageTitle')}</h1>
              <p className="text-sm text-gray-500">{t('auth.loginPageSubtitle')}</p>
            </div>
          </div>

          <Suspense fallback={<div className="animate-pulse h-48 bg-gray-100 rounded-lg" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          {t('auth.onlyOwners')}
        </p>
      </div>
    </div>
  );
}
