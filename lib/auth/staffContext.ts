import { createClient } from '@/lib/supabase/server';
import { supabaseServer } from '@/lib/supabase/client';

export type ProfileRole = 'USER' | 'BARBER_WORKER' | 'BARBER_OWNER' | 'SUPER_ADMIN';

export interface SessionProfileContext {
  userId: string;
  email: string | undefined;
  role: ProfileRole;
  fullName: string | null;
}

/**
 * Current Supabase session + profile row (uses server cookies).
 */
export async function getSessionProfile(): Promise<SessionProfileContext | null> {
  if (!supabaseServer) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabaseServer
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !profile?.role) return null;

  return {
    userId: user.id,
    email: user.email,
    role: profile.role as ProfileRole,
    fullName: profile.full_name ?? null,
  };
}

/**
 * Barber row for this auth user (BARBER_WORKER), if any.
 */
export async function getBarberRowForProfile(profileId: string) {
  if (!supabaseServer) return null;
  const { data, error } = await supabaseServer
    .from('barbers')
    .select('id, shop_id, display_name, profile_id, is_active')
    .eq('profile_id', profileId)
    .maybeSingle();
  if (error) return null;
  return data as {
    id: string;
    shop_id: string;
    display_name: string;
    profile_id: string;
    is_active: boolean;
  } | null;
}
