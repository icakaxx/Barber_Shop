import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'

// GET /api/barbers - Get all barbers
export async function GET() {
  if (!supabaseServer) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    )
  }

  try {
    const { data, error } = await supabaseServer
      .from('barbers')
      .select(`
        *,
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
      `)
      .eq('is_active', true)
      .order('display_name')

    if (error) {
      console.error('Error fetching barbers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const barbers = data.map(row => ({
      id: row.id,
      profileId: row.profile_id,
      shopId: row.shop_id,
      displayName: row.display_name,
      bio: row.bio || undefined,
      photoUrl: row.photo_url || undefined,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      profile: row.profiles ? {
        fullName: row.profiles.full_name || undefined,
        phone: row.profiles.phone || undefined,
        role: row.profiles.role
      } : undefined,
      shop: row.shops ? {
        name: row.shops.name,
        city: row.shops.city,
        address: row.shops.address || undefined
      } : undefined
    }))

    return NextResponse.json(barbers)
  } catch (error) {
    console.error('Error in GET /api/barbers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/barbers - Create a new barber
export async function POST(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { displayName, bio, photoUrl, isActive } = body

    // Get an existing shop (don't create one - shops should be created explicitly)
    // First try to find any active shop
    const { data: shops, error: shopError } = await supabaseServer
      .from('shops')
      .select('id')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)

    if (shopError || !shops || shops.length === 0) {
      // No shops exist - barber creation requires an existing shop
      return NextResponse.json(
        { error: 'No active shops found. Please create a shop first before adding barbers.' },
        { status: 400 }
      )
    }

    const shopId = shops[0].id

    // Create an auth user first (required for profiles table)
    // Generate a unique email - use example.com (RFC 2606 reserved) as Supabase rejects .local
    const safeName = displayName.toLowerCase().replace(/[^a-z0-9]/g, '.')
    const barberEmail = `barber.${safeName}.${Date.now()}@example.com`
    const tempPassword = `TempPass${Math.random().toString(36).slice(2)}!`
    
    console.log('Creating auth user with email:', barberEmail)
    
    // Try to create auth user using admin API
    let userId: string
    try {
      const { data: authUser, error: authError } = await supabaseServer.auth.admin.createUser({
        email: barberEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: displayName,
          role: 'BARBER_WORKER'
        }
      })

      if (authError) {
        console.error('Error creating auth user:', authError)
        // If admin API fails, try alternative: create user via signup and then update
        console.log('Trying alternative user creation method...')
        const { data: signupData, error: signupError } = await supabaseServer.auth.signUp({
          email: barberEmail,
          password: tempPassword,
          options: {
            data: {
              full_name: displayName,
              role: 'BARBER_WORKER'
            }
          }
        })

        if (signupError || !signupData?.user?.id) {
          console.error('Alternative signup also failed:', signupError)
          return NextResponse.json(
            { error: `Failed to create auth user: ${authError?.message || signupError?.message || 'Unknown error'}` },
            { status: 500 }
          )
        }
        userId = signupData.user.id
      } else if (!authUser?.user?.id) {
        console.error('Auth user created but no ID returned:', authUser)
        return NextResponse.json(
          { error: 'Failed to create auth user: No user ID returned' },
          { status: 500 }
        )
      } else {
        userId = authUser.user.id
      }
    } catch (error: any) {
      console.error('Exception creating auth user:', error)
      return NextResponse.json(
        { error: `Failed to create auth user: ${error?.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    console.log('Auth user created with ID:', userId)
    console.log('User ID type:', typeof userId, 'Value:', userId)

    // Validate userId is a valid UUID
    if (!userId || typeof userId !== 'string' || userId.length < 30) {
      console.error('Invalid user ID:', userId)
      return NextResponse.json(
        { error: 'Invalid user ID returned from auth creation' },
        { status: 500 }
      )
    }

    // Create or update the profile linked to the auth user
    // Use upsert in case Supabase's handle_new_user trigger already created a profile
    console.log('Creating/updating profile with ID:', userId)
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .upsert(
        {
          id: userId,
          full_name: displayName,
          role: 'BARBER_WORKER'
        },
        { onConflict: 'id' }
      )
      .select()
      .single()

    if (profileError) {
      console.error('Error creating profile:', profileError)
      console.error('Attempted to insert profile with ID:', userId)
      // Try to clean up the auth user if profile creation fails
      try {
        await supabaseServer.auth.admin.deleteUser(userId)
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError)
      }
      return NextResponse.json(
        { error: `Failed to create profile: ${profileError.message}` },
        { status: 500 }
      )
    }

    console.log('Profile created/updated successfully:', profile.id)

    // Now create the barber
    const { data: barber, error: barberError } = await supabaseServer
      .from('barbers')
      .insert({
        profile_id: profile.id,
        shop_id: shopId,
        display_name: displayName,
        bio: bio || null,
        photo_url: photoUrl || null,
        is_active: isActive ?? true
      })
      .select(`
        *,
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
      `)
      .single()

    if (barberError) {
      console.error('Error creating barber:', barberError)
      return NextResponse.json(
        { error: `Failed to create barber: ${barberError.message}` },
        { status: 500 }
      )
    }

    const result = {
      id: barber.id,
      profileId: barber.profile_id,
      shopId: barber.shop_id,
      displayName: barber.display_name,
      bio: barber.bio || undefined,
      photoUrl: barber.photo_url || undefined,
      isActive: barber.is_active,
      createdAt: barber.created_at,
      updatedAt: barber.updated_at,
      profile: barber.profiles ? {
        fullName: barber.profiles.full_name || undefined,
        phone: barber.profiles.phone || undefined,
        role: barber.profiles.role
      } : undefined,
      shop: barber.shops ? {
        name: barber.shops.name,
        city: barber.shops.city,
        address: barber.shops.address || undefined
      } : undefined
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/barbers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

