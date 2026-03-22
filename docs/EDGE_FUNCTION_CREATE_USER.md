# Edge Function: `create-user`

Creates a Supabase Auth user (email + password, email pre-confirmed), upserts `public.profiles` (role, name, phone), and optionally inserts `public.barbers` for `BARBER_WORKER`.

## Who can call it

Only users with `profiles.role = 'SUPER_ADMIN'`. Pass their **access token** (same session as the admin panel).

## Deploy (Supabase CLI)

```bash
cd /path/to/Barber_Shop
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy create-user
```

Hosted projects already have `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` available to Edge Functions.

## Local secrets (optional)

```bash
supabase secrets set --env-file ./supabase/.env.functions
```

Example `supabase/.env.functions` (do not commit real keys):

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## HTTP

`POST` `https://<PROJECT_REF>.supabase.co/functions/v1/create-user`

Headers:

- `Authorization: Bearer <super_admin_access_token>`
- `apikey: <NEXT_PUBLIC_SUPABASE_ANON_KEY>`
- `Content-Type: application/json`

### Body examples

**Owner / admin-style user (no barber row):**

```json
{
  "email": "owner@example.com",
  "password": "secure-password",
  "full_name": "Ivan Ivanov",
  "phone": "+359888000000",
  "role": "BARBER_OWNER"
}
```

**Barber worker (requires shop + display name):**

```json
{
  "email": "barber@example.com",
  "password": "secure-password",
  "full_name": "Petar Petrov",
  "phone": "+359888111222",
  "role": "BARBER_WORKER",
  "shop_id": "uuid-of-shop",
  "display_name": "Petar",
  "bio": "Optional",
  "photo_url": "https://..."
}
```

**Customer / default:**

```json
{
  "email": "client@example.com",
  "password": "secure-password",
  "full_name": "Client",
  "role": "USER"
}
```

## UI

Super Admin panel (**`/superadmin`**) includes a **Потребители / Users** tab that calls this function using your current session.

### App routes (short)

| Area | Path |
|------|------|
| Owner dashboard | `/owner` (legacy `/dashboard/owner` redirects) |
| Barber team dashboard | `/barbers` — login `/login/barber` |
| Super admin | `/superadmin` (legacy `/admin` redirects) |
sada