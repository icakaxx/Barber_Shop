'use client';

import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';

export default function BackToHomeLink({ className }: { className?: string }) {
  const { t } = useI18n();

  return (
    <Link href="/" className={className}>
      {t('auth.backToHome')}
    </Link>
  );
}
