# Архив – полезен код за бъдеща употреба

## API за нулиране на парола (dev only)

Ако отново е нужен endpoint за нулиране на парола чрез Supabase Admin API:

**Файл:** `app/api/auth/reset-password/route.ts`

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
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Използване:** `POST /api/auth/reset-password` с body `{ "email": "...", "newPassword": "..." }`
