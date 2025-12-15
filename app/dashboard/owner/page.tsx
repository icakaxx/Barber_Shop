import { redirect } from 'next/navigation';
import OwnerDashboard from '@/components/dashboard/owner/OwnerDashboard';
import { supabaseServer } from '@/lib/supabase/client';

export default async function OwnerDashboardPage() {
  // Check authentication and role
  if (!supabaseServer) {
    redirect('/');
  }

  // Get current user (this would need to be implemented with proper auth)
  // For now, we'll let the component handle the auth check
  // In production, you'd get the user from cookies/headers

  return <OwnerDashboard />;
}

