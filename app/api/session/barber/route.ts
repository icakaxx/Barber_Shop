import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/client';
import {
  getSessionProfile,
  getBarberRowForProfile,
} from '@/lib/auth/staffContext';

/**
 * Barber team context for the logged-in user (same shop).
 * Lives under /api/session/* so it is never mistaken for /api/barbers/[id] (id = "me").
 */
export async function GET() {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const session = await getSessionProfile();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allowed =
    session.role === 'BARBER_WORKER' ||
    session.role === 'BARBER_OWNER' ||
    session.role === 'SUPER_ADMIN';

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const myBarber = await getBarberRowForProfile(session.userId);

  let shopId: string | null = myBarber?.shop_id ?? null;

  if (!shopId && session.role === 'BARBER_OWNER') {
    const { data: shop } = await supabaseServer
      .from('shops')
      .select('id')
      .eq('owner_id', session.userId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    shopId = shop?.id ?? null;
  }

  if (!shopId && session.role === 'SUPER_ADMIN') {
    const { data: shop } = await supabaseServer
      .from('shops')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    shopId = shop?.id ?? null;
  }

  if (!shopId) {
    return NextResponse.json({
      me: myBarber
        ? {
            id: myBarber.id,
            profileId: myBarber.profile_id,
            shopId: myBarber.shop_id,
            displayName: myBarber.display_name,
            isActive: myBarber.is_active,
          }
        : null,
      team: [],
      shopId: null,
      role: session.role,
      email: session.email,
      fullName: session.fullName,
    });
  }

  const { data: teamRows, error } = await supabaseServer
    .from('barbers')
    .select(
      `
      id,
      profile_id,
      shop_id,
      display_name,
      bio,
      photo_url,
      is_active,
      created_at,
      updated_at,
      shops:shop_id ( name, city, address )
    `
    )
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('display_name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const team = (teamRows || []).map((row: any) => ({
    id: row.id,
    profileId: row.profile_id,
    shopId: row.shop_id,
    displayName: row.display_name,
    bio: row.bio || undefined,
    photoUrl: row.photo_url || undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    shop: row.shops
      ? {
          name: row.shops.name,
          city: row.shops.city,
          address: row.shops.address || undefined,
        }
      : undefined,
  }));

  return NextResponse.json({
    me: myBarber
      ? {
          id: myBarber.id,
          profileId: myBarber.profile_id,
          shopId: myBarber.shop_id,
          displayName: myBarber.display_name,
          isActive: myBarber.is_active,
        }
      : null,
    team,
    shopId,
    role: session.role,
    email: session.email,
    fullName: session.fullName,
  });
}
