# Dev snippets & archived reference

One place for optional / removed dev utilities. Main docs: `EDGE_FUNCTION_CREATE_USER.md`, `ROUTES_AND_ROLES.md`.

---

## Password reset API (dev only) — archived

If you need an endpoint to reset a password via Supabase Admin API again, restore something like:

**Route:** `app/api/auth/reset-password/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  try {
    const { email, userId, newPassword } = await request.json();
    if (!newPassword || (!email && !userId)) {
      return NextResponse.json({ error: 'email/userId and newPassword required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let targetUserId = userId;
    if (!targetUserId && email) {
      const { data } = await supabase.auth.admin.listUsers();
      const user = data?.users?.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase());
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      targetUserId = user.id;
    }

    const { error } = await supabase.auth.admin.updateUserById(targetUserId, { password: newPassword });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Usage:** `POST /api/auth/reset-password` with body `{ "email": "...", "newPassword": "..." }` (or `userId` instead of `email`).
