import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { ProfileRole } from '@/lib/auth/types';

export type { ProfileRole };

export interface SessionProfileContext {
  userId: string;
  email: string | undefined;
  role: ProfileRole;
  fullName: string | null;
}

/**
 * Current Supabase session + profile (cookie client + RLS on profiles only).
 */
export async function getSessionProfile(): Promise<SessionProfileContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
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
 * Barber row for this auth user. Uses service role only after session is established by caller.
 */
export async function getBarberRowForProfile(profileId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data, error } = await admin
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
