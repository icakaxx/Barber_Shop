import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';
import LoginPageContent from '@/components/auth/LoginPageContent';

export const metadata = {
  title: 'Вход за супер админ | Barber King',
  description: 'Влезте за достъп до админ таблото',
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user && params.error !== 'access_denied') {
    redirect('/superadmin');
  }
  return (
    <Suspense
      fallback={
        <div className="min-h-screen login-page-bg flex items-center justify-center">
          <div className="animate-pulse h-48 w-64 bg-white/10 rounded-lg" />
        </div>
      }
    >
      <LoginPageContent variant="admin" />
    </Suspense>
  );
}
