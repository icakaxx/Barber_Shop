'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { useI18n } from '@/contexts/I18nContext';

export type LoginFormVariant = 'owner' | 'admin' | 'barber';

interface LoginFormProps {
  defaultRedirect?: string;
  variant?: LoginFormVariant;
}

export default function LoginForm({
  defaultRedirect = '/owner',
  variant = 'owner',
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || defaultRedirect;
  const accessDenied = searchParams.get('error') === 'access_denied';
  const loginBasePath = variant === 'admin' ? '/login/admin' : '/login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (signInError) {
        setError(t('auth.loginError'));
        setLoading(false);
        return;
      }

      if (data?.user) {
        window.location.href = redirectTo;
        return;
      }
    } catch {
      setError(t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {accessDenied && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm space-y-2">
          <p>{t('auth.accessDenied')}</p>
          <p className="text-xs">
            {variant === 'admin'
              ? t('auth.accessDeniedHelpAdmin')
              : variant === 'barber'
                ? t('auth.accessDeniedHelpBarber')
                : t('auth.accessDeniedHelp')}
          </p>
          <button
            type="button"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = loginBasePath;
            }}
            className="text-xs font-bold underline"
          >
            {t('auth.signOut')}
          </button>
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          {t('auth.email')}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="owner@example.com"
          required
          autoComplete="email"
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          {t('auth.password')}
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t('common.loading') : t('auth.loginButton')}
      </button>
    </form>
  );
}
