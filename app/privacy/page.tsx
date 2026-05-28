import type { Metadata } from 'next';
import PrivacyPolicyPage from '@/components/legal/PrivacyPolicyPage';

export const metadata: Metadata = {
  title: 'Политика за поверителност | Клуб Мъжки Свят',
  description:
    'Политика за поверителност на КЛУБ МЪЖКИ СВЯТ ЕООД — обработка на лични данни при онлайн резервации.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return <PrivacyPolicyPage />;
}
