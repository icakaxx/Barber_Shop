/**
 * Create Auth user + profile (role, details) + optional barber row.
 * Only callers with profiles.role = SUPER_ADMIN (validated via JWT + DB).
 *
 * Deploy: supabase functions deploy create-user
 *   (supabase/config.toml sets verify_jwt = false; this handler validates JWT + SUPER_ADMIN.)
 *
 * Secrets (auto-set on hosted Supabase): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type UserRole = 'USER' | 'BARBER_OWNER' | 'BARBER_WORKER' | 'SUPER_ADMIN';

interface CreateUserPayload {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  role: UserRole;
  /** Required when role is BARBER_WORKER */
  shop_id?: string;
  display_name?: string;
  bio?: string;
  photo_url?: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Server misconfigured' }, 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Missing or invalid Authorization header' }, 401);
  }
  const jwt = authHeader.slice('Bearer '.length).trim();

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: jwtError } = await admin.auth.getUser(jwt);
  if (jwtError || !userData.user) {
    return json({ error: 'Invalid or expired session' }, 401);
  }

  const { data: callerProfile, error: callerErr } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (callerErr || callerProfile?.role !== 'SUPER_ADMIN') {
    return json({ error: 'Forbidden: SUPER_ADMIN only' }, 403);
  }

  let body: CreateUserPayload;
  try {
    body = (await req.json()) as CreateUserPayload;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const role = body.role as UserRole;
  const full_name = typeof body.full_name === 'string' ? body.full_name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';

  const allowedRoles: UserRole[] = ['USER', 'BARBER_OWNER', 'BARBER_WORKER', 'SUPER_ADMIN'];
  if (!email || !isValidEmail(email)) {
    return json({ error: 'Valid email is required' }, 400);
  }
  if (password.length < 6) {
    return json({ error: 'Password must be at least 6 characters' }, 400);
  }
  if (!allowedRoles.includes(role)) {
    return json({ error: `role must be one of: ${allowedRoles.join(', ')}` }, 400);
  }

  if (role === 'BARBER_WORKER') {
    const shopId = typeof body.shop_id === 'string' ? body.shop_id.trim() : '';
    const displayName = typeof body.display_name === 'string' ? body.display_name.trim() : '';
    if (!shopId || !isUuid(shopId)) {
      return json({ error: 'BARBER_WORKER requires a valid shop_id' }, 400);
    }
    if (!displayName) {
      return json({ error: 'BARBER_WORKER requires display_name' }, 400);
    }
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: full_name ? { full_name } : undefined,
  });

  if (createError || !created.user) {
    return json(
      { error: createError?.message ?? 'Failed to create auth user' },
      400,
    );
  }

  const userId = created.user.id;

  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: userId,
      full_name: full_name || email.split('@')[0] || 'User',
      phone: phone || null,
      role,
    },
    { onConflict: 'id' },
  );

  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return json({ error: profileError.message, detail: 'Profile upsert failed; user rolled back' }, 500);
  }

  if (role === 'BARBER_WORKER') {
    const shopId = body.shop_id!.trim();
    const displayName = body.display_name!.trim();
    const bio = typeof body.bio === 'string' ? body.bio.trim() || null : null;
    const photoUrl = typeof body.photo_url === 'string' ? body.photo_url.trim() || null : null;

    const { error: barberError } = await admin.from('barbers').insert({
      profile_id: userId,
      shop_id: shopId,
      display_name: displayName,
      bio,
      photo_url: photoUrl,
      is_active: true,
    });

    if (barberError) {
      await admin.auth.admin.deleteUser(userId);
      return json(
        { error: barberError.message, detail: 'Barber insert failed; user rolled back' },
        500,
      );
    }
  }

  return json({
    ok: true,
    user: {
      id: userId,
      email: created.user.email,
      role,
    },
  });
});
