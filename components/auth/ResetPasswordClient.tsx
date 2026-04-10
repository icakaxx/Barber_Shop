'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/browser';
import { useI18n } from '@/contexts/I18nContext';

export default function ResetPasswordClient() {
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const recoveredRef = useRef(false);
  /** One shared promise so React Strict Mode does not call setSession twice with the same tokens. */
  const recoverySessionPromiseRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let subscription: { unsubscribe: () => void } | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    void (async () => {
      // Implicit recovery links put tokens in the hash. @supabase/ssr often does not
      // emit PASSWORD_RECOVERY for that flow — establish the session explicitly.
      const hash =
        typeof window !== 'undefined' && window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : '';
      const params = new URLSearchParams(hash);
      const type = params.get('type');
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (type === 'recovery' && access_token && refresh_token) {
        if (!recoverySessionPromiseRef.current) {
          const at = access_token;
          const rt = refresh_token;
          recoverySessionPromiseRef.current = supabase.auth
            .setSession({ access_token: at, refresh_token: rt })
            .then(({ error }) => {
              if (!error) {
                window.history.replaceState(
                  null,
                  '',
                  `${window.location.pathname}${window.location.search}`
                );
              }
              return !error;
            });
        }
        const ok = await recoverySessionPromiseRef.current;
        if (cancelled) return;
        if (!ok) {
          setInvalid(true);
          return;
        }
        recoveredRef.current = true;
        setReady(true);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        recoveredRef.current = true;
        setReady(true);
        return;
      }

      const { data: subData } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          recoveredRef.current = true;
          setReady(true);
          setInvalid(false);
        }
      });
      subscription = subData.subscription;

      timeoutId = setTimeout(() => {
        if (!recoveredRef.current) setInvalid(true);
      }, 8000);
    })();

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(t('auth.resetPasswordTooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.resetPasswordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message || t('auth.resetPasswordError'));
        setLoading(false);
        return;
      }
      await supabase.auth.signOut();
      setDone(true);
    } catch {
      setError(t('auth.resetPasswordError'));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('auth.resetPasswordSuccessTitle')}</h1>
        <p className="text-gray-600 text-sm">{t('auth.resetPasswordSuccessBody')}</p>
        <Link
          href="/login"
          className="inline-block w-full py-3 px-4 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-all"
        >
          {t('auth.resetPasswordGoLogin')}
        </Link>
      </div>
    );
  }

  if (!ready && !invalid) {
    return (
      <div className="max-w-md w-full text-center py-12">
        <p className="text-gray-600">{t('common.loading')}</p>
      </div>
    );
  }

  if (invalid && !ready) {
    return (
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('auth.resetInvalidTitle')}</h1>
        <p className="text-gray-600 text-sm">{t('auth.resetInvalidLink')}</p>
        <Link href="/login" className="text-sm font-bold underline text-gray-900">
          {t('auth.resetPasswordGoLogin')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('auth.resetPasswordTitle')}</h1>
        <p className="text-gray-600 text-sm mt-2">{t('auth.resetPasswordSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
            {t('auth.newPassword')}
          </label>
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full px-4 py-3 min-h-[48px] text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
            {t('auth.confirmPassword')}
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full px-4 py-3 min-h-[48px] text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 min-h-[48px] px-4 text-base bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        >
          {loading ? t('common.loading') : t('auth.resetPasswordSubmit')}
        </button>
      </form>

      <p className="text-center text-sm">
        <Link href="/login" className="font-bold underline text-gray-700">
          {t('auth.resetPasswordGoLogin')}
        </Link>
      </p>
    </div>
  );
}
