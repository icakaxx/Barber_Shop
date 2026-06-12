'use client';

import { useI18n } from '@/contexts/I18nContext';

export default function DashboardLoadingFallback({ messageKey }: { messageKey: string }) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">{t(messageKey)}</p>
    </div>
  );
}
