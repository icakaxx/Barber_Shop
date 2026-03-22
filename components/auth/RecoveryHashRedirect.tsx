'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Supabase password recovery puts tokens in the URL hash (#access_token=...&type=recovery).
 * If the email "Redirect URL" is the site root, users land on `/` and nothing consumes the hash.
 * Forward to `/auth/reset-password` so the reset page can establish the session and show the form.
 */
export default function RecoveryHashRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (pathname === '/auth/reset-password') return;

    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    const params = new URLSearchParams(hash.slice(1));
    if (params.get('type') !== 'recovery') return;

    const next = `${window.location.origin}/auth/reset-password${hash}`;
    window.location.replace(next);
  }, [pathname]);

  return null;
}
