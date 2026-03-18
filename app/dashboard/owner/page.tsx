import { redirect } from 'next/navigation';
import OwnerDashboard from '@/components/dashboard/owner/OwnerDashboard';
import { createClient } from '@/lib/supabase/server';
import { supabaseServer } from '@/lib/supabase/client';

const ALLOWED_ROLES = ['BARBER_OWNER', 'SUPER_ADMIN'];

export default async function OwnerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/dashboard/owner');
  }

  // Check profile role
  if (!supabaseServer) {
    redirect('/');
  }

  const { data: profile } = await supabaseServer
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role as string | undefined;
  if (!role || !ALLOWED_ROLES.includes(role)) {
    redirect('/login?error=access_denied&redirect=/dashboard/owner');
  }

  return <OwnerDashboard userEmail={user.email} />;
}

