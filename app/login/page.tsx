import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';
import LoginPageContent from '@/components/auth/LoginPageContent';

export const metadata = {
  title: 'Вход за собственик | Клуб мъжки свят',
  description: 'Влезте за достъп до таблото на собственика',
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
