import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import OwnerDashboard from '@/components/dashboard/owner/OwnerDashboard';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_ROLES = ['BARBER_OWNER', 'SUPER_ADMIN'];

export default async function OwnerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/owner');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role as string | undefined;
  if (!role || !ALLOWED_ROLES.includes(role)) {
    redirect('/login?error=access_denied&redirect=/owner');
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <OwnerDashboard userEmail={user.email} />
    </Suspense>
  );
}
