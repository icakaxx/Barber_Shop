import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';
import LoginPageContent from '@/components/auth/LoginPageContent';

export const metadata = {
  title: 'Вход за бръснари | Клуб мъжки свят',
  description: 'Влезте за достъп до екипното табло',
};

export default async function BarberLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && params.error !== 'access_denied') {
    redirect('/barbers');
  }
  return (
    <Suspense
      fallback={
        <div className="min-h-screen login-page-bg flex items-center justify-center">
          <div className="animate-pulse h-48 w-64 bg-white/10 rounded-lg" />
        </div>
      }
    >
      <LoginPageContent variant="barber" />
    </Suspense>
  );
}
