import { redirect } from 'next/navigation';
import BarberDashboard from '@/components/dashboard/barber/BarberDashboard';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_ROLES = ['BARBER_WORKER', 'BARBER_OWNER', 'SUPER_ADMIN'];

/** Always resolve auth on the server (no stale static page). */
export const dynamic = 'force-dynamic';

export default async function BarbersTeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login/barber?redirect=/barbers');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile?.role) {
    redirect('/login/barber?error=access_denied&redirect=/barbers');
  }

  const role = profile.role as string;
  if (!ALLOWED_ROLES.includes(role)) {
    redirect('/login/barber?error=access_denied&redirect=/barbers');
  }

  return <BarberDashboard sessionBacked />;
}
