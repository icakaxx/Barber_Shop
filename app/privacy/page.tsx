import type { Metadata } from 'next';
import PrivacyPolicyPage from '@/components/legal/PrivacyPolicyPage';
import { META_PRIVACY_DESCRIPTION, META_PRIVACY_TITLE } from '@/lib/seo-defaults';

export const metadata: Metadata = {
  title: META_PRIVACY_TITLE,
  description: META_PRIVACY_DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return <PrivacyPolicyPage />;
}
