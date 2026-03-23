import 'server-only';

import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { forbiddenJson } from '@/lib/api/jsonErrors';
import type { AuthContext } from '@/lib/auth/types';

type Admin = SupabaseClient;

/** Load barber row (shop + profile link). Caller must have already authenticated. */
export async function fetchBarberRow(admin: Admin, barberId: string) {
  const { data, error } = await admin
    .from('barbers')
    .select('id, shop_id, profile_id, is_active')
    .eq('id', barberId)
    .maybeSingle();
  if (error || !data) return null;
  return data as {
    id: string;
    shop_id: string;
    profile_id: string;
    is_active: boolean;
  };
}

export async function fetchShopOwner(admin: Admin, shopId: string) {
  const { data } = await admin.from('shops').select('id, owner_id').eq('id', shopId).maybeSingle();
  return data as { id: string; owner_id: string } | null;
}

export async function fetchServiceShopId(admin: Admin, serviceId: string): Promise<string | null> {
  const { data } = await admin.from('services').select('shop_id').eq('id', serviceId).maybeSingle();
  return data?.shop_id ?? null;
}

export async function fetchWorkerShopId(admin: Admin, userId: string): Promise<string | null> {
  const { data } = await admin
    .from('barbers')
    .select('shop_id')
    .eq('profile_id', userId)
    .eq('is_active', true)
    .maybeSingle();
  return data?.shop_id ?? null;
}

/** Owner: shop.owner_id === user. Worker: same shop as barber. Super: always. */
export async function assertBarberTeamAccess(
  admin: Admin,
  auth: AuthContext,
  barberId: string
): Promise<NextResponse | { barber: NonNullable<Awaited<ReturnType<typeof fetchBarberRow>>> }> {
  const barber = await fetchBarberRow(admin, barberId);
  if (!barber) return forbiddenJson();

  if (auth.role === 'SUPER_ADMIN') {
    return { barber };
  }

  if (auth.role === 'BARBER_OWNER') {
    const shop = await fetchShopOwner(admin, barber.shop_id);
    if (shop?.owner_id === auth.userId) return { barber };
    return forbiddenJson();
  }

  if (auth.role === 'BARBER_WORKER') {
    const myShop = await fetchWorkerShopId(admin, auth.userId);
    if (myShop && myShop === barber.shop_id) return { barber };
    return forbiddenJson();
  }

  return forbiddenJson();
}

/** Shop settings / services scoped to owner or superadmin. */
export async function assertShopOwnerOrSuperAdmin(
  admin: Admin,
  auth: AuthContext,
  shopId: string
): Promise<NextResponse | true> {
  if (auth.role === 'SUPER_ADMIN') return true;

  if (auth.role === 'BARBER_OWNER') {
    const shop = await fetchShopOwner(admin, shopId);
    if (shop?.owner_id === auth.userId) return true;
    return forbiddenJson();
  }

  return forbiddenJson();
}

/** PUT barber: owner of shop, superadmin, or worker updating own barber row only. */
export async function assertCanMutateBarber(
  admin: Admin,
  auth: AuthContext,
  barberId: string
): Promise<NextResponse | { barber: NonNullable<Awaited<ReturnType<typeof fetchBarberRow>>> }> {
  const barber = await fetchBarberRow(admin, barberId);
  if (!barber) return forbiddenJson();

  if (auth.role === 'SUPER_ADMIN') return { barber };

  if (auth.role === 'BARBER_OWNER') {
    const shop = await fetchShopOwner(admin, barber.shop_id);
    if (shop?.owner_id === auth.userId) return { barber };
    return forbiddenJson();
  }

  if (auth.role === 'BARBER_WORKER' && barber.profile_id === auth.userId) {
    return { barber };
  }

  return forbiddenJson();
}

/** Appointment row must belong to shop/barber the user can manage. */
export async function assertAppointmentStaffAccess(
  admin: Admin,
  auth: AuthContext,
  appointment: { barber_id: string; shop_id: string }
): Promise<NextResponse | true> {
  const r = await assertBarberTeamAccess(admin, auth, appointment.barber_id);
  if (r instanceof NextResponse) return r;
  if (r.barber.shop_id !== appointment.shop_id) return forbiddenJson();
  return true;
}

/** Scope for listing appointments: superadmin => all shops; owner => owned shops; worker => one shop. */
export async function getAppointmentReadScope(
  admin: Admin,
  auth: AuthContext
): Promise<NextResponse | { shopIds: string[] | null }> {
  if (auth.role === 'SUPER_ADMIN') {
    return { shopIds: null };
  }

  if (auth.role === 'BARBER_OWNER') {
    const { data } = await admin
      .from('shops')
      .select('id')
      .eq('owner_id', auth.userId)
      .eq('is_active', true);
    const ids = (data ?? []).map((s: { id: string }) => s.id);
    if (ids.length === 0) return forbiddenJson();
    return { shopIds: ids };
  }

  if (auth.role === 'BARBER_WORKER') {
    const sid = await fetchWorkerShopId(admin, auth.userId);
    if (!sid) return forbiddenJson();
    return { shopIds: [sid] };
  }

  return forbiddenJson();
}
