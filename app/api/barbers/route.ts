import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getOptionalAuthContext, requireAuthContext, requireRoles } from '@/lib/auth/getAuthContext'
import { STAFF_ROLES } from '@/lib/auth/types'
import { notConfiguredJson, serverErrorJson } from '@/lib/api/jsonErrors'

/** Response varies by session; never statically cache as one shape. */
export const dynamic = 'force-dynamic'

/** Explicit columns only — no `*` for anonymous/public callers. */
const PUBLIC_BARBER_SELECT = `
  id,
  display_name,
  bio,
  photo_url,
  shop_id,
  shops:shop_id (
    name,
    city,
    address
  )
`

const STAFF_BARBER_SELECT = `
  id,
  profile_id,
  shop_id,
  display_name,
  bio,
  photo_url,
  is_active,
  created_at,
  updated_at,
  profiles:profile_id (
    full_name,
    phone,
    role
  ),
  shops:shop_id (
    name,
    city,
    address
  )
`

function mapShop(shops: { name?: string; city?: string; address?: string } | null | undefined) {
  if (!shops) return undefined
  return {
    name: shops.name,
    city: shops.city,
    address: shops.address || undefined,
  }
}

/** Anonymous / no staff session: minimal fields; shopId kept for booking POST (shop + barber validation). */
function mapPublicBarber(row: Record<string, unknown>) {
  const shops = row.shops as { name?: string; city?: string; address?: string } | null
  return {
    id: row.id,
    displayName: row.display_name,
    bio: row.bio ? String(row.bio) : undefined,
    photoUrl: row.photo_url ? String(row.photo_url) : undefined,
    shopId: row.shop_id,
    shop: mapShop(shops),
  }
}

/** Staff session: full operational fields (still no raw `*` in query). */
function mapStaffBarber(row: Record<string, unknown>) {
  const shops = row.shops as { name?: string; city?: string; address?: string } | null
  const profiles = row.profiles as
    | { full_name?: string; phone?: string; role?: string }
    | null
    | undefined
  return {
    id: row.id,
    profileId: row.profile_id,
    shopId: row.shop_id,
    displayName: row.display_name,
    bio: row.bio ? String(row.bio) : undefined,
    photoUrl: row.photo_url ? String(row.photo_url) : undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    shop: mapShop(shops),
    profile: profiles
      ? {
          fullName: profiles.full_name || undefined,
          phone: profiles.phone || undefined,
          role: profiles.role,
        }
      : undefined,
  }
}

// GET /api/barbers — public-safe list; staff session gets extended payload
export async function GET() {
  const admin = getSupabaseAdmin()
  if (!admin) return notConfiguredJson()

  try {
    const auth = await getOptionalAuthContext()
    const extended = auth !== null && STAFF_ROLES.includes(auth.role)

    const { data, error } = await admin
      .from('barbers')
      .select(extended ? STAFF_BARBER_SELECT : PUBLIC_BARBER_SELECT)
      .eq('is_active', true)
      .order('display_name')

    if (error) {
      console.error('Error fetching barbers:', error.code)
      return serverErrorJson()
    }

    const rows = (data ?? []) as unknown[]
    const barbers = rows.map((row) =>
      extended
        ? mapStaffBarber(row as Record<string, unknown>)
        : mapPublicBarber(row as Record<string, unknown>)
    )

    return NextResponse.json(barbers)
  } catch (error) {
    console.error('Error in GET /api/barbers:', error)
    return serverErrorJson()
  }
}

// POST /api/barbers — SUPER_ADMIN only (creates auth user + profile + barber)
export async function POST(request: NextRequest) {
  const auth = await requireAuthContext()
  if (auth instanceof NextResponse) return auth

  const rg = requireRoles(auth, ['SUPER_ADMIN'])
  if (rg instanceof NextResponse) return rg

  const admin = getSupabaseAdmin()
  if (!admin) return notConfiguredJson()

  try {
    const body = await request.json()
    const { displayName, bio, photoUrl, isActive, shopId: bodyShopId } = body

    if (!displayName || typeof displayName !== 'string') {
      return NextResponse.json({ error: 'displayName is required' }, { status: 400 })
    }

    let shopId: string = bodyShopId
    if (!shopId) {
      const { data: shops, error: shopError } = await admin
        .from('shops')
        .select('id')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)

      if (shopError || !shops?.length) {
        return NextResponse.json(
          { error: 'No active shops found. Pass shopId or create a shop first.' },
          { status: 400 }
        )
      }
      shopId = shops[0].id
    }

    const safeName = displayName.toLowerCase().replace(/[^a-z0-9]/g, '.')
    const barberEmail = `barber.${safeName}.${Date.now()}@example.com`
    const tempPassword = `TempPass${Math.random().toString(36).slice(2)}!`

    let userId: string
    try {
      const { data: authUser, error: authError } = await admin.auth.admin.createUser({
        email: barberEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: displayName,
          role: 'BARBER_WORKER',
        },
      })

      if (authError) {
        const { data: signupData, error: signupError } = await admin.auth.signUp({
          email: barberEmail,
          password: tempPassword,
          options: {
            data: {
              full_name: displayName,
              role: 'BARBER_WORKER',
            },
          },
        })

        if (signupError || !signupData?.user?.id) {
          console.error('Auth user creation failed')
          return serverErrorJson()
        }
        userId = signupData.user.id
      } else if (!authUser?.user?.id) {
        return serverErrorJson()
      } else {
        userId = authUser.user.id
      }
    } catch {
      return serverErrorJson()
    }

    if (!userId || userId.length < 30) {
      return NextResponse.json({ error: 'Invalid user ID from auth' }, { status: 500 })
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .upsert(
        {
          id: userId,
          full_name: displayName,
          role: 'BARBER_WORKER',
        },
        { onConflict: 'id' }
      )
      .select()
      .single()

    if (profileError) {
      try {
        await admin.auth.admin.deleteUser(userId)
      } catch {
        /* ignore */
      }
      console.error('Profile create failed:', profileError.code)
      return serverErrorJson()
    }

    const { data: barber, error: barberError } = await admin
      .from('barbers')
      .insert({
        profile_id: profile.id,
        shop_id: shopId,
        display_name: displayName,
        bio: bio || null,
        photo_url: photoUrl || null,
        is_active: isActive ?? true,
      })
      .select(STAFF_BARBER_SELECT)
      .single()

    if (barberError) {
      console.error('Error creating barber:', barberError.code)
      return serverErrorJson()
    }

    return NextResponse.json(mapStaffBarber(barber as Record<string, unknown>), { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/barbers:', error)
    return serverErrorJson()
  }
}
