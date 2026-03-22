'use client';

import Link from 'next/link';
import { Building2, Crown, Scissors } from 'lucide-react';
import { Suspense } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import LoginForm, { type LoginFormVariant } from './LoginForm';

interface LoginPageContentProps {
  variant?: LoginFormVariant;
}

export default function LoginPageContent({ variant = 'owner' }: LoginPageContentProps) {
  const { t } = useI18n();
  const isAdmin = variant === 'admin';
  const isBarber = variant === 'barber';
  const defaultRedirect = isAdmin ? '/superadmin' : isBarber ? '/barbers' : '/owner';
  const Icon = isAdmin ? Crown : isBarber ? Scissors : Building2;

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
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isAdmin ? t('auth.adminLoginPageTitle') : t('auth.loginPageTitle')}
              </h1>
              <p className="text-sm text-gray-500">
                {isAdmin ? t('auth.adminLoginPageSubtitle') : t('auth.loginPageSubtitle')}
              </p>
            </div>
          </div>

          <Suspense fallback={<div className="animate-pulse h-48 bg-gray-100 rounded-lg" />}>
            <LoginForm defaultRedirect={defaultRedirect} variant={variant} />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          {isAdmin ? t('auth.onlySuperAdmins') : isBarber ? t('auth.onlyBarbers') : t('auth.onlyOwners')}
        </p>
      </div>
    </div>
  );
}
