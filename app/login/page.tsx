import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';
import LoginPageContent from '@/components/auth/LoginPageContent';
import { META_LOGIN_OWNER_DESCRIPTION, META_LOGIN_OWNER_TITLE } from '@/lib/seo-defaults';

export const metadata = {
  title: META_LOGIN_OWNER_TITLE,
  description: META_LOGIN_OWNER_DESCRIPTION,
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user && params.error !== 'access_denied') {
    redirect('/owner');
  }
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-pulse h-48 w-64 bg-gray-200 rounded-lg" /></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
