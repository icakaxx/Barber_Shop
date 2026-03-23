# Security review extract — Barber Shop (Next.js)

**Purpose:** Organize security-relevant areas for systematic review.  
**Not a penetration test.** No live secrets below — placeholders only.

---

## SECTION 1 — PROJECT STRUCTURE

### `package.json` (excerpt)

```json
{
  "name": "barber-shop",
  "dependencies": {
    "@supabase/ssr": "^0.9.0",
    "@supabase/storage-js": "^2.87.3",
    "@supabase/supabase-js": "^2.38.0",
    "browser-image-compression": "^2.0.2",
    "lucide-react": "^0.424.0",
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "resend": "^6.6.0",
    "zod": "^3.23.8"
  }
}
```

**Why it matters:** Declares auth (Supabase), email (Resend), image compression; `zod` is listed but **not imported in app source** at time of extract (validation mostly manual).

### `next.config.js`

**Runtime:** build / server config  

```js
const nextConfig = {
  reactStrictMode: true,
  images: { domains: ['images.unsplash.com'] },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false }
    }
    return config
  },
}
module.exports = nextConfig
```

**Why it matters:** No custom security headers here; remote image domain allowlist only.

### `middleware.ts` + `lib/supabase/middleware.ts`

**Runtime:** **edge / server** (runs on matched routes)

`middleware.ts` delegates to `updateSession`.  
`updateSession` creates Supabase SSR client with `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`, reads/writes cookies, calls `getUser()`. **Does not enforce redirects or role checks** — comment says pages handle auth.

**Why it matters:** Session refresh only; **not** an authorization gate for API routes.

### App structure

- **Router:** **App Router** (`app/`)
- **No `pages/api`** in this repo
- **No `src/`** — code under project root (`app/`, `components/`, `lib/`, `contexts/`)

**Representative `app/` tree (API + key pages):**

| Path | Role |
|------|------|
| `app/page.tsx` | Landing (server) |
| `app/layout.tsx` | Root layout |
| `app/barbers/page.tsx` | Barber dashboard entry (server + auth) |
| `app/owner/page.tsx`, `app/admin/page.tsx`, `app/superadmin/page.tsx` | Role-specific UIs |
| `app/login/**`, `app/auth/**` | Auth UI |
| `app/api/**/route.ts` | All HTTP APIs (see list below) |

### All API route files (`app/api/**/route.ts`)

| File |
|------|
| `app/api/appointments/route.ts` |
| `app/api/appointments/[id]/route.ts` |
| `app/api/barbers/route.ts` |
| `app/api/barbers/[id]/route.ts` |
| `app/api/barbers/[id]/appointments/route.ts` |
| `app/api/barbers/[id]/availability/route.ts` |
| `app/api/barbers/me/route.ts` *(re-exports session)* |
| `app/api/session/barber/route.ts` |
| `app/api/services/route.ts` |
| `app/api/services/[id]/route.ts` |
| `app/api/shops/route.ts` |
| `app/api/shops/[id]/route.ts` |
| `app/api/upload/route.ts` |

**Server actions:** None identified in codebase search.

**Server utilities used by API routes**

| File | Runtime | Why security-relevant |
|------|---------|----------------------|
| `lib/supabase/client.ts` | **server** when `supabaseServer` used; **client** may import `supabase` (anon) | Service role vs anon split |
| `lib/supabase/server.ts` | **server** | Cookie-bound Supabase user |
| `lib/auth/staffContext.ts` | **server** | Session + profile for `/api/session/barber` |
| `lib/utils/shopHours.ts` | **shared** | `validateSlotAgainstShop` on POST appointments |

### Auth-related files

| File | Runtime |
|------|---------|
| `middleware.ts`, `lib/supabase/middleware.ts` | server/edge |
| `lib/supabase/browser.ts` | **client** |
| `lib/supabase/server.ts` | **server** |
| `lib/auth/staffContext.ts` | **server** |
| `components/auth/LoginForm.tsx`, `LoginPageContent.tsx`, `ResetPasswordClient.tsx`, `RecoveryHashRedirect.tsx` | **client** |
| `app/login/**`, `app/auth/**` | mixed |

### Booking / appointment-related files

| Area | Files |
|------|--------|
| Public booking UI | `components/booking/BookingModal.tsx`, `CancellationModal.tsx` |
| Staff calendar / create | `components/dashboard/barber/ScheduleCalendar.tsx`, `CreateAppointmentModal.tsx`, `EditAppointmentModal.tsx`, `TodayAppointments.tsx`, `TeamView.tsx`, `AppointmentDetailsModal.tsx` |
| Owner | `components/dashboard/owner/OwnerDashboard.tsx` (appointments CRUD via fetch) |
| API | `app/api/appointments/**`, `app/api/barbers/[id]/appointments/route.ts` |
| Validation | `lib/utils/shopHours.ts` (`validateSlotAgainstShop`, etc.) |

### DB / Supabase / external

| File / dir | Notes |
|------------|--------|
| `supabase/migrations/*.sql` | Schema, RLS (`001_initial_schema.sql`, `012_barber_team_rls.sql`, branding/storage migrations) |
| `supabase/functions/create-user/index.ts` | Edge function (separate deploy); invoked with user JWT + anon key from client |
| `lib/supabase/types.ts` | Types if present |
| `lib/supabase/barbers.ts` | Client-side helpers for **admin** barber CRUD (uses env?) — check callers |

### Summary facts

| Topic | Value |
|--------|--------|
| Next.js version | **14.2.5** (from `package.json`) |
| Router | **App Router** |
| TypeScript | **Yes** |
| Env consumption | `process.env.*` in `lib/supabase/*`, API routes, `CreateUserTab`, `appointments/route` (Resend) |
| Deployment target | **Not specified** in repo (assume Node host e.g. Vercel / self-hosted) |

---

## SECTION 2 — ENVIRONMENT VARIABLES AUDIT

**Names only** — no values.

| ENV NAME | FILES USED IN | PUBLIC OR SERVER | SECURITY NOTE |
|----------|---------------|------------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase/client.ts`, `browser.ts`, `server.ts`, `middleware.ts`, `components/admin/CreateUserTab.tsx` | **Public** (by Next convention) | Supabase project URL; expected in browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same + `CreateUserTab` (Edge fetch `apikey` header) | **Public** | Anon key is designed for client; RLS must protect data |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/client.ts` → `supabaseServer` | **Server-only** (intended) | **Bypasses RLS** — must never reach client bundle |
| `RESEND_API_KEY` | `app/api/appointments/route.ts` | **Server-only** | Email sending |
| `EMAIL_FROM` | `app/api/appointments/route.ts` | **Server-only** | Default from-address if env unset |
| `NODE_ENV` | `lib/supabase/client.ts` | n/a | Gates dev logging |

**Edge function invoke (Create user):** Uses `NEXT_PUBLIC_SUPABASE_URL` to build `<SUPABASE_URL>/functions/v1/create-user` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as `apikey` + user `Authorization: Bearer <access_token>`. Documented in `docs/EDGE_FUNCTION_CREATE_USER.md`.

### Explicit answers

1. **Exposed to browser by naming convention:** `NEXT_PUBLIC_*` (Supabase URL + anon key).
2. **Secrets in client components?** **No service role** in client source; **anon key** used in `CreateUserTab` (by design for Edge call). Passwords typed in UI stay in memory until POST — not env.
3. **Server secrets in shared/client code?** `lib/supabase/client.ts` references `SUPABASE_SERVICE_ROLE_KEY`; `supabaseServer` is `null` when `window` defined. **Verify** production client bundles never inline service key (Next should strip non-`NEXT_PUBLIC_` from client).
4. **Hardcoded values:** Default `EMAIL_FROM` string and HTML branding in `appointments/route.ts` (email template); default image domain in `next.config.js`; bucket name `barbershop_info` in `upload/route.ts`.

---

## SECTION 3 — CLIENT COMPONENTS & BROWSER-EXPOSED CODE

### Files with `'use client'` (booking-relevant subset)

Full list includes ~35 components; **booking-critical:**

- `components/booking/BookingModal.tsx` — `fetch('/api/services')`, `fetch('/api/barbers')`, `fetch('/api/shops')`, `fetch('/api/appointments')`, `fetch(/api/barbers/:id/appointments)`, `fetch(/api/barbers/:id/appointments)` for availability checks
- `contexts/ShopBrandingContext.tsx` — loads shops/barbers/services
- `components/dashboard/barber/*` — appointments GET/POST/PUT/DELETE via `fetch`
- `components/dashboard/owner/OwnerDashboard.tsx` — same patterns
- `components/admin/CreateUserTab.tsx` — `NEXT_PUBLIC_*` + Edge function URL

### `BookingModal.tsx` — sensitive flow (excerpt pattern)

**Runtime:** **client**

- Builds JSON body: `shopId`, `serviceId`, `barberId`, `customerName`, `phone`, `email`, `startTime`, `endTime`, `notes`, `allServiceNames`
- **No auth cookie** required for public POST (see Section 4)

**Review answers:**

| Question | Answer |
|----------|--------|
| Sensitive data in DevTools? | Network tab shows all request/response JSON (PII, appointment times). |
| User tamper body? | **Yes** — full control in DevTools. |
| Hidden client fields for trust? | **No** hidden trust tokens; relies on server checks (partial). |
| Business rules only on client? | Slot filtering uses `shop.workingHours` + lunch on client; **server also validates** slot vs shop hours on POST. |

---

## SECTION 4 — API ROUTES (DETAIL)

**Default pattern:** Most routes use **`supabaseServer`** (service role) → **RLS bypassed** at API layer. Authorization must be implemented **in route handlers** where needed; many routes have **no session check**.

---

### `app/api/appointments/route.ts`

**RUNTIME:** server  
**METHODS:** GET, POST  

**PURPOSE:** List appointments (filters); create booking + optional Resend email.

**INPUT (GET):** `barberId`, `date`, `status`, `shopId` (query params).

**INPUT (POST):** JSON: `shopId`, `serviceId`, `barberId`, `customerUserId?`, `customerName`, `customerPhone`, `customerEmail?`, `startTime`, `endTime`, `notes?`, `allServiceNames?`.

**AUTH REQUIRED:** **No** (neither GET nor POST checks session in code).

**VALIDATION:** Required fields; parse dates; load barber + shop; `validateSlotAgainstShop`; duplicate check **same** `start_time` + barber + active status. **No Zod.**

**RATE LIMITING:** **None**

**BOT PROTECTION:** **None**

**DB WRITE?:** POST inserts `appointments`.

**THIRD-PARTY:** Resend (if `RESEND_API_KEY` set).

**RETURNS:** JSON appointments or created row; errors may include `error.message` from Supabase.

**SECURITY RISKS NOTICED:**

- **GET** returns **PII** (customer name, phone, email) for any caller who can hit the route — **no auth**.
- **POST** allows arbitrary `shopId`/`barberId` if consistent; **`serviceId` not verified** against shop; **`endTime` not cross-checked** against service duration; **`customerUserId`** client-supplied.
- Double-booking: app check + DB `UNIQUE (barber_id, start_time)` — **overlapping** slots with different `start_time` may still insert.
- `console.log` of customer email before send.

**Code excerpt (POST guard + insert):**

```ts
// ... validate body, barber.shop_id === shopId, validateSlotAgainstShop ...
const { data: existing } = await supabaseServer
  .from('appointments')
  .select('id')
  .eq('barber_id', barberId)
  .eq('start_time', startTime)
  .in('status', ['PENDING', 'CONFIRMED'])
  .single()
// insert { shop_id, service_id, barber_id, customer_user_id, customer_name, ... }
```

---

### `app/api/appointments/[id]/route.ts`

**RUNTIME:** server  
**METHODS:** PUT, DELETE  

**PURPOSE:** Update appointment fields; soft-cancel.

**INPUT:** JSON body (PUT): `status`, `startTime`, `endTime`, `notes`, `customer*`, `cancelledByUserId`, `cancelledByRole`, `cancelReason`. DELETE: query params `cancelledByUserId`, `cancelledByRole`, `cancelReason`.

**AUTH REQUIRED:** **No**

**VALIDATION:** Minimal — passes client fields into update.

**RATE LIMITING / BOT:** **None**

**DB WRITE?:** Yes.

**RISKS:** **Anyone with appointment UUID** can PUT/DELETE (if predictable/enumerated). **Trusts client** for `cancelledByUserId` / `cancelledByRole`. Returns Supabase error messages to client on failure.

---

### `app/api/barbers/route.ts`

**RUNTIME:** server  
**METHODS:** GET, POST  

**GET:** Public list of active barbers + nested profile (**phone, role**) + shop.

**POST:** Creates auth user + profile + barber (admin-style flow) — **no route auth check** in excerpt; uses service role + `auth.admin.createUser`.

**RISKS:** **POST is highly sensitive** if exposed publicly.

---

### `app/api/barbers/[id]/route.ts`

**RUNTIME:** server  
**METHODS:** PUT, DELETE (excerpt)  

**AUTH:** **Not shown** — updates barber by id via service role.

**RISKS:** IDOR if no auth layer elsewhere.

---

### `app/api/barbers/[id]/appointments/route.ts`

**RUNTIME:** server  
**METHODS:** GET  

**PURPOSE:** Appointments for one barber (optional date/status).

**AUTH:** **No**

**RISKS:** **Enumeration** of customer PII per `barberId`.

---

### `app/api/barbers/[id]/availability/route.ts`

**RUNTIME:** server  
**METHODS:** GET  

**PURPOSE:** `time_slots` + booked appointment starts for barber.

**AUTH:** **No**

**RISKS:** **Scraping** availability; no rate limit.

---

### `app/api/session/barber/route.ts` (+ `app/api/barbers/me/route.ts` alias)

**RUNTIME:** server  
**METHODS:** GET  

**AUTH:** **Yes** — `getSessionProfile()`; 401 if no user; 403 if role not in allowlist.

**PURPOSE:** Team + `shopId` for logged-in staff.

**RISKS:** Low for this route; depends on `getSessionProfile` + DB accuracy.

---

### `app/api/shops/route.ts` & `app/api/shops/[id]/route.ts`

**GET:** Public shop data (including `workingHours`, branding).

**PATCH `[id]`:** Updates shop fields — **no auth check** in handler.

**RISKS:** **Unauthorized shop settings change** if URL known.

---

### `app/api/services/route.ts` & `app/api/services/[id]/route.ts`

**GET:** Public active services.

**POST / PUT / DELETE:** Mutations via service role — **verify** auth in full file (excerpt shows required-field check only on POST).

**RISKS:** Price/duration manipulation if unauthenticated.

---

### `app/api/upload/route.ts`

**RUNTIME:** server  
**METHODS:** POST  

**INPUT:** `multipart/formData`: `file`, `type` (`logo` | `hero` | `barber-profile`), `entityId`.

**AUTH:** **No**

**VALIDATION:** Image type, size limits, path `shops/{entityId}/` or `barbers/{entityId}/`.

**RISKS:** **Anyone can upload/overwrite** files for guessed UUIDs; **no ownership check**.

---

## SECTION 5 — BOOKING FLOW TRACE

1. **Start:** `BookingModal` (landing) or public site trigger.
2. **Browser request:** `POST /api/appointments` with JSON (see Section 4).
3. **API:** `app/api/appointments/route.ts` POST.
4. **Validation:** Required fields; barber∈shop; `validateSlotAgainstShop`; exact `start_time` conflict check.
5. **DB:** `insert` into `appointments`.
6. **Email:** Resend to `customerEmail` if present.
7. **Response:** 201 + appointment JSON or error JSON.

### Attacker / abuse questions

| Question | Answer |
|----------|--------|
| Fields modifiable in DevTools? | **All** POST fields including `shopId`, `barberId`, `serviceId`, times, PII, `customerUserId`, `notes`, `allServiceNames`. |
| Should be server-recomputed? | **service duration → endTime**, **price**, **status** (force `PENDING`), **shopId** from barber only (partially enforced). |
| Blocked times bypass? | **Partially** — server checks shop hours + lunch; **not** full overlap with existing appointments (only identical `start_time`). |
| Double-booking DB? | `UNIQUE (barber_id, start_time)` — **exact start only**. |
| Spam fake appointments? | **Yes** — no CAPTCHA, no rate limit, no auth. |
| Enumerate slots / users? | **GET** `/api/appointments`, `/api/barbers/[id]/appointments`, `/api/barbers/[id]/availability` without auth. |
| Bypass frontend? | **Yes** — direct API calls. |

---

## SECTION 6 — AUTHENTICATION / AUTHORIZATION

- **Mechanism:** **Supabase Auth** (email/password, etc.) + `profiles.role`.
- **Session:** Cookies via `@supabase/ssr` (middleware refresh); server routes use `createClient()` from `lib/supabase/server.ts` where implemented.
- **`/api/session/barber`:** Server verifies user + profile role.
- **Gap:** **Most data APIs do not call `getSessionProfile()`** — they use **service role** and trust callers.

**Admin routes:** UI gated by **server pages** (e.g. `app/barbers/page.tsx` checks profile); **API endpoints are not uniformly protected**.

**Normal user → admin API?** If they can guess URLs and body shape, **many handlers accept requests** without bearer checks.

**Ownership:** **PATCH `/api/shops/[id]`** and **PUT `/api/barbers/[id]`** need explicit review — no obvious owner check in extracted code.

---

## SECTION 7 — DATABASE / STORAGE / BACKEND ACCESS

- **Supabase** with **RLS** on `appointments` (see `001_initial_schema.sql`, `012_barber_team_rls.sql`) for **anon/authenticated direct DB** access.
- **API routes using `supabaseServer` bypass RLS** — security must be in **application logic**.

**Unique constraint:** `uq_appointments_barber_start` on `(barber_id, start_time)`.

**Storage:** `upload/route.ts` uses service role to `barbershop_info` bucket; **policies** depend on Supabase dashboard / migrations (see `007_storage_public_read.sql` etc.).

**Service role client-side:** Should be **null** in browser; **audit** `lib/supabase/client.ts` bundling.

---

## SECTION 8 — REQUEST VALIDATION & SANITIZATION

- **Zod:** Listed in `package.json` — **no `zod` imports found** in application `*.ts/*.tsx` (at extract time).
- **Validation:** Mostly **manual** `if (!field)` checks; shop hours via `validateSlotAgainstShop`.
- **Email/phone/name:** No shared sanitizer / max length / HTML escape for email HTML (template interpolation — **XSS if names contained HTML** and email client renders unsafely).
- **Extra JSON fields:** Not stripped — may be ignored by destructuring but not always safe pattern.
- **Admin-only fields:** PUT appointment accepts **`status`** from client.

---

## SECTION 9 — RATE LIMITING / ANTI-AUTOMATION

**Found:** **Nothing** (no middleware throttle, no CAPTCHA, no Turnstile, no idempotency keys for booking).

**Answers:** Unlimited bookings per IP; availability endpoints can be hammered; no cooldown; duplicate submissions possible; **high scripted abuse risk** on POST `/api/appointments`.

---

## SECTION 10 — CORS / HEADERS / COOKIES / TRANSPORT

- **No custom CORS** or security headers in `next.config.js` extract.
- **Supabase SSR** sets session cookies via library defaults — **verify** `httpOnly`, `secure`, `sameSite` in Supabase project / SSR docs.
- **Cross-origin:** Next API routes are same-origin by default for browser app; **curl/Postman** can call APIs from anywhere unless platform restricts.

---

## SECTION 11 — LOGGING / ERROR HANDLING

| Location | What leaks |
|----------|------------|
| `lib/supabase/client.ts` | **Dev:** logs partial URL + **prefixes of keys** (`substring`) — still sensitive in logs |
| `app/api/appointments/route.ts` | `console.log` **customer email**; Resend success log |
| Multiple API routes | `error.message` returned to client on 500 |
| Client | Standard `console.error` in components |

**Production:** Not all errors sanitized; stack traces depend on Next production mode.

---

## SECTION 12 — THIRD-PARTY SERVICES

| Service | Key | Where | Browser direct? |
|---------|-----|-------|-----------------|
| Supabase | anon + service | `lib/supabase/*`, routes | Anon via `browser.ts`; service **server only** |
| Resend | `RESEND_API_KEY` | `appointments/route.ts` | **No** |
| Supabase Edge `create-user` | JWT + anon header | `CreateUserTab` | **Yes** (HTTPS to Supabase) |
| Google Maps embed | URL in `LocationSection` | client | iframe embed (no API key in extract) |

---

## SECTION 13 — DEPENDENCIES

**dependencies:** `@supabase/ssr`, `@supabase/storage-js`, `@supabase/supabase-js`, `browser-image-compression`, `lucide-react`, `next`, `react`, `react-dom`, `resend`, `zod`

**devDependencies:** types, eslint, tailwind, postcss, typescript, etc.

**Flags:** `zod` unused in app source; `browser-image-compression` — client-side only, watch for huge memory use; **no** dedicated HTML sanitizer package.

---

## SECTION 14 — FINAL SECURITY SUMMARY

### 1. Confirmed secret exposure risks

- **`NEXT_PUBLIC_*`** intentionally public; **RLS + API design** must compensate.
- **Dev logging** in `lib/supabase/client.ts` prints **substring of keys** — treat logs as sensitive.

### 2. Likely secret exposure risks

- **Misconfigured** client bundle could theoretically reference server env — **verify** build output.
- **Edge function** pattern exposes **anon key** to browser (expected); **function must validate** JWT + role server-side.

### 3. Booking abuse risks

- **Unauthenticated POST** `/api/appointments` + **no rate limit** + **no CAPTCHA**.
- **PII enumeration** via GET appointments endpoints.
- **Overlapping** appointments possible (not only exact `start_time`).

### 4. Auth/authz weaknesses

- **Service role** on APIs without consistent **session + role** checks.
- **PUT/DELETE appointments** and **PATCH shops** / **upload** especially risky.

### 5. Validation weaknesses

- **No Zod** in use; **serviceId** / duration / end time not fully enforced.
- **Email HTML** built from user names — review injection.

### 6. Rate limiting / bot gaps

- **None** identified.

### 7. Logging / error leakage

- **Supabase/Resend** errors to client; **email** logged server-side.

### 8. Most critical files to review first

1. `app/api/appointments/route.ts`  
2. `app/api/appointments/[id]/route.ts`  
3. `app/api/upload/route.ts`  
4. `app/api/shops/[id]/route.ts`  
5. `app/api/barbers/route.ts` (POST)  
6. `lib/supabase/client.ts`  
7. `supabase/migrations/*` RLS vs service-role usage  

### 9. Top 10 fixes (prioritized)

1. Add **authentication** or **signed token** / CAPTCHA for **public booking POST**; rate limit by IP.  
2. **Never return raw** `error.message` to clients in production.  
3. Add **server-side** verification: `serviceId` belongs to `shopId`; recompute **`endTime`** from service duration + `startTime`.  
4. **Overlap check** for appointments (interval intersection), not only identical start.  
5. Protect **GET** appointments with **session + shop/barber scope**.  
6. **Auth + ownership** on **PATCH shops**, **PUT barbers**, **upload**.  
7. Remove or gate **dev key logging** in `lib/supabase/client.ts`.  
8. Introduce **Zod** (or similar) schemas for all write APIs.  
9. **Sanitize** PII fields used in HTML email.  
10. Add **security headers** (CSP, etc.) via `next.config` or middleware.

---

*Document generated as a static extract of the codebase structure and patterns; re-run review after major refactors.*
