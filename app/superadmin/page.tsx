import { redirect } from 'next/navigation';
import SuperAdminDashboard from '@/components/admin/SuperAdminDashboard';
import { createClient } from '@/lib/supabase/server';

export default async function SuperAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login/admin?redirect=/superadmin');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role as string | undefined;
  if (role !== 'SUPER_ADMIN') {
    redirect('/login/admin?error=access_denied&redirect=/superadmin');
  }

  return <SuperAdminDashboard userEmail={user.email} />;
}
