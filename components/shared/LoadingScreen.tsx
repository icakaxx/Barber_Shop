'use client';

import { useI18n } from '@/contexts/I18nContext';

const DEFAULT_LOADING_IMAGE = '/images/1773509226948-019ced62-b0c9-769a-b196-d3b4059ea87b-removebg-preview.png';

interface LoadingScreenProps {
  imageSrc?: string;
}

export default function LoadingScreen({ imageSrc = DEFAULT_LOADING_IMAGE }: LoadingScreenProps) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black">
      <p className="text-white text-xl font-semibold mb-6">
        {t('common.loading')}
      </p>
      <div className="w-24 h-24 flex items-center justify-center">
        <img
          src={imageSrc}
          alt=""
          className="w-full h-full object-contain animate-loading-spin"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
}
