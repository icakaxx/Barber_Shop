import 'server-only';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { unauthorizedJson, forbiddenJson } from '@/lib/api/jsonErrors';
import type { AuthContext, ProfileRole } from '@/lib/auth/types';

/**
 * Session-bound user + profile (uses cookie client + RLS on profiles).
 * Does not use service role.
 */
export async function getOptionalAuthContext(): Promise<AuthContext | null> {
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

export async function requireAuthContext(): Promise<AuthContext | NextResponse> {
  const ctx = await getOptionalAuthContext();
  if (!ctx) return unauthorizedJson();
  return ctx;
}

export function requireRoles(
  ctx: AuthContext,
  allowed: readonly ProfileRole[]
): AuthContext | NextResponse {
  if (!allowed.includes(ctx.role)) return forbiddenJson();
  return ctx;
}
