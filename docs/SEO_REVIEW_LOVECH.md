# Conservative SEO review — Barber shop (Lovech), Next.js App Router

**Project:** Barber Shop booking platform (Next.js 14 App Router)  
**Business goal:** Improve local SEO for Lovech, Bulgaria (haircut, beard trim, barbershop queries).  
**Scope of this document:** Analysis and **safe** recommendations only. No booking, auth, API, or routing logic changes are implied unless listed under “possible risk.”

---

## A) SAFE SEO CHANGES

These are unlikely to break functionality if implemented carefully (static metadata, new static files, or copy-only translation updates).

1. **Align root `metadata` with Lovech** — `app/layout.tsx` currently titles/describes **Sofia**. Updating `title` and `description` to Lovech + real services fixes a direct **local SEO contradiction** without touching runtime logic.

2. **Add homepage-specific metadata** — `app/page.tsx` has no `metadata` export; the site uses only the root layout metadata. Adding `export const metadata` (or `generateMetadata`) on `app/page.tsx` lets the homepage have a dedicated title/description while other routes can keep inheriting or overriding later.

3. **Add Open Graph and Twitter fields** — Extend `Metadata` in `layout.tsx` and/or homepage with `openGraph` and `twitter` (title, description, `type: 'website'`, optional `locale`). Pure head output; no behavior change.

4. **Add `robots.ts`** — `app/robots.ts` returning `allow: '/'`, `host`, and `sitemap` URL is standard Next.js and low risk.

5. **Add `sitemap.ts`** — `app/sitemap.ts` listing public URLs (`/`, optionally `/login` if you want them discoverable — usually staff URLs are **noindex** instead). Low risk; only affects crawlers.

6. **Set `metadataBase`** — In `app/layout.tsx`, set `metadataBase: new URL('https://your-production-domain.com')` so OG URLs and canonicals resolve correctly. **Safe** once the production URL is correct.

7. **Optional: `alternates.canonical`** — Single canonical for `/` on the homepage reduces duplicate-signal noise if you later add query variants. Low risk.

8. **Staff / app routes: `robots: 'noindex, nofollow'`** — For `/login`, `/login/barber`, `/login/admin`, `/owner`, `/barbers`, `/superadmin`, `/auth/reset-password`, adding page-level `robots` metadata **improves** focus on the marketing homepage and is **safe** (only meta tags). Does not block logged-in users.

9. **JSON-LD on homepage only** — A single `<script type="application/ld+json">` (via `layout` or a small server component wrapper for `/`) with `Barbershop` / `HairSalor` + `LocalBusiness` fields does not change UI or forms.

10. **Copy and i18n strings** — Updating `lib/i18n/translations.ts` defaults for `hero.location`, `location.address`, `footer.description`, and `hero.premiumCuts` to mention **Lovech** is **content-only** (safe if text matches the real business).

11. **Image `alt` fixes where `alt=""`** — e.g. decorative-only images can stay empty; **meaningful** photos (logo already uses `shopName`) — improving barber avatars’ alts on marketing components is low risk if text is stable.

12. **Homepage H1 content strategy** — Today H1 is dynamic (`shop?.name` or “Barber King”). Ensuring the **visible** H1 includes recognizable brand + optional “Lovech” is a **copy/layout** choice; safest approach: drive from CMS/shop branding (`shop.name` / `heroDescription`) so one source of truth remains.

---

## B) POSSIBLE SEO IMPROVEMENTS WITH SOME RISK

| Idea | Why it might be risky |
|------|------------------------|
| **Dedicated `/services` or `/[slug]` service pages** | New routes, linking strategy, possible duplicate content vs homepage section; needs design + content ownership. |
| **`generateMetadata` fetching shop from DB** | Extra DB call per request; errors need handling; coupling SEO to DB uptime. |
| **Changing `<html lang>` dynamically** | Must stay in sync with `I18nContext` locale; wrong lang hurts accessibility + SEO. |
| **hreflang for `bg` / `en`** | Easy to misconfigure (wrong URLs, missing reciprocity); test thoroughly. |
| **Aggressive noindex on `/owner` etc.** | Low functional risk, but if you *want* some staff pages indexed (rare), would conflict. |
| **Replacing default Lovech coordinates in `LocationSection`** | Already uses `shop` when present; hardcoded fallback coords are Troyan-area — wrong city hurts **trust** if shop data missing. |
| **Large hero/heading rewrites** | Could affect conversion or brand; not technical risk but business risk. |
| **Middleware injecting canonicals** | Touches middleware (out of scope for “safest” path). |

---

## C) NEXT.JS FILES TO CHECK

**Already reviewed / high priority**

| File | Why |
|------|-----|
| `app/layout.tsx` | Root `metadata`, `viewport`, `<html lang>`, future `metadataBase`, OG/Twitter. |
| `app/page.tsx` | Homepage: currently **no** metadata export — prime candidate for homepage SEO. |
| `app/login/page.tsx` | Has `metadata` — consider `robots: noindex`. |
| `app/login/barber/page.tsx` | Same. |
| `app/login/admin/page.tsx` | Same. |
| `app/auth/reset-password/page.tsx` | Has `metadata` — consider `noindex`. |
| `app/owner/page.tsx` | No metadata — inherits Sofia title; add `noindex` + title. |
| `app/barbers/page.tsx` | Dynamic; add `noindex` + title in metadata export. |
| `app/superadmin/page.tsx` | Add `noindex` + title. |
| `app/admin/page.tsx` | If used — same pattern. |

**Add (missing in repo)**

| File | Purpose |
|------|---------|
| `app/robots.ts` | Crawl rules + sitemap URL. |
| `app/sitemap.ts` | URL list for public pages. |

**Content / structure (SEO-relevant, not Next config)**

| File / area | Why |
|-------------|-----|
| `components/landing/Hero.tsx` | Single **H1** per page; content source for local intent. |
| `components/landing/ServicesSection.tsx` | **H2** section; service names from API — no per-service URLs today. |
| `components/landing/LocationSection.tsx` | Address, maps, local signals. |
| `components/landing/TrustSection.tsx` | **H2** + supporting copy. |
| `components/shared/Footer.tsx` | Internal links, brand mention. |
| `components/shared/Header.tsx` | Logo `alt`, nav anchors `#services`, `#location`. |
| `lib/i18n/translations.ts` | Default city strings (currently **Sofia** in multiple keys). |

**Optional**

| File | Why |
|------|-----|
| `next.config.js` | Headers, redirects, `images.domains` — not required for basic SEO. |
| `public/favicon.ico`, `public/manifest.json` | Branding / PWA; no `public` manifest found in tree scan — optional addition. |

---

## D) EXACT TEXT IMPROVEMENTS

Use these as **drafts**; replace the brand name if yours differs from “Barber King.” Align with real address and phone from `shops` in Supabase.

### Homepage `<title>` (Bulgarian-first site, Lovech focus)

**Suggested (BG):**  
`Barber King – Бръснарски салон в Ловеч | Подстригване и брада`

**Suggested (EN alternate if you expose English meta later):**  
`Barber King – Barber Shop in Lovech | Men’s Haircuts & Beard Trims`

### Homepage meta description (~150–160 characters)

**BG:**  
`Бръснарски салон в Ловеч – мъжко подстригване, оформяне на брада и онлайн резервация. Barber King: професионален екип и удобни часове.`

**EN:**  
`Barber shop in Lovech, Bulgaria — men’s haircuts, beard trims, and easy online booking. Professional barbers at Barber King.`

### Homepage H1 (visible)

**Option A (brand-only, current pattern):**  
`Barber King`  
*(Add Lovech in subline / hero description — safer for design consistency.)*

**Option B (stronger local H1 — only if acceptable for brand):**  
`Barber King – бръснарски салон в Ловеч`

**Supporting line (hero), BG:**  
`Мъжко подстригване, брада и стил в Ловеч. Резервирайте час онлайн.`

### “Service pages” (no dedicated routes in codebase)

Today services live in **`#services`** on `/`. Until `/services/...` exists:

- **Per-service `<title>` / meta:** N/A as separate pages.  
- **Section H2** already: `Нашите услуги` / `Our services` — good.  
- **Optional future slugs** (recommendations only):  
  - `/services/haircut-lovech` — title: `Мъжко подстригване Ловеч | Barber King`  
  - `/services/beard-trim-lovech` — title: `Подстригване и оформяне на брада Ловеч | Barber King`

### Short local SEO body copy (Lovech)

**BG (80–120 words for footer or trust strip):**  
`Barber King е бръснарски салон в Ловеч, специализиран в мъжко подстригване, оформяне на брада и класически стил. Работим с професионални инструменти и продукти, а онлайн резервацията ви спестява чакане. Намерете ни в Ловеч, вижте работното време и запазете час за прическа или брада за минути.`

**EN:**  
`Barber King is a barber shop in Lovech, Bulgaria, offering men’s haircuts, beard trims, and classic grooming. Book online to choose a time that suits you. Visit our Lovech location for professional cuts and a relaxed, modern atmosphere.`

### Open Graph description (can match meta description)

**BG:**  
`Бръснарски салон в Ловеч – подстригване, брада и онлайн резервация в Barber King.`

**EN:**  
`Men’s haircuts and beard trims in Lovech — book online at Barber King.`

### Open Graph title

Match the homepage `<title>` or slightly shorter:  
`Barber King | Бръснарски салон Ловеч`

---

## E) STRUCTURED DATA / SCHEMA

**Recommendation:** Use **`Barbershop`** (schema.org type) as `@type`. It is a subtype of **`LocalBusiness`** and is appropriate for a barber shop. Google also understands **`HairSalon`**; pick one primary type to avoid ambiguity — **`Barbershop`** fits your positioning.

**Minimum recommended properties**

- `@context`: `https://schema.org`  
- `@type`: `Barbershop`  
- `name`: Business name (e.g. Barber King)  
- `image`: Logo or storefront URL (absolute HTTPS)  
- `address`: `PostalAddress` with `streetAddress`, `addressLocality` (**Lovech**), `addressRegion`, `postalCode`, `addressCountry` (**BG**)  
- `telephone`: E.164 or consistent format  
- `url`: Canonical homepage URL  
- `priceRange`: e.g. `$$` or text in BGN context  
- `openingHoursSpecification` or `openingHours` — align with `shop.workingHours` if injected from DB (dynamic JSON-LD is slightly more complex but accurate)

**Optional but valuable**

- `geo`: `latitude`, `longitude` (exact shop coordinates)  
- `sameAs`: Instagram / Facebook URLs (real profiles only)  
- `hasMap`: Google Maps URL  
- `description`: 1–2 sentences with Lovech + services  

**Where to add (safe Next.js pattern)**

1. **Static JSON-LD** in a **Server Component** used only on `app/page.tsx` (e.g. `components/seo/HomeJsonLd.tsx` with fixed copy) — lowest coupling.  
2. **Or** embed in `layout.tsx` only if data is static; avoid putting wrong city in global layout if multi-shop later.  
3. **Dynamic JSON-LD** from `shops` table: more accurate, slightly higher implementation risk (fetch + error boundary).

**Validation:** Use Google’s Rich Results Test after deployment.

---

## F) LOW-RISK IMPLEMENTATION PLAN

Order: safest first, easy rollback (git revert single files).

1. **Update `app/layout.tsx` metadata** — Lovech-aligned default `title` + `description`; add `metadataBase` when production URL is known.  
2. **Add `export const metadata` to `app/page.tsx`** — Homepage title/description + `openGraph` + `twitter` + optional `alternates.canonical`.  
3. **Add `app/robots.ts`** — Allow public paths; reference sitemap.  
4. **Add `app/sitemap.ts`** — At minimum `{ url: baseUrl, changeFrequency, priority }` for `/`.  
5. **Add `robots: { index: false, follow: false }`** (or `noindex, nofollow`) to login, owner, barbers, superadmin, reset-password metadata — clarifies crawl budget for local landing page.  
6. **Add static JSON-LD component** on homepage only — `Barbershop` with manual Lovech address/phone **or** wire to env/static config first; DB later.  
7. **Revise `lib/i18n/translations.ts`** — Replace Sofia defaults with Lovech where they are marketing copy (`hero.location`, default `location.address`, footer blurb).  
8. **Audit `alt` text** on landing components — logo (already good with `shopName`); barber cards use `displayName` (OK); avoid empty `alt` on meaningful marketing images.  
9. **Optional later:** `generateMetadata` on homepage from Supabase `shops` — after static version is stable.

---

## What is already good

- **Semantic headings** on the landing page: one **H1** in `Hero.tsx`; sections use **H2** in Trust, Services, Location.  
- **Internal anchors:** `#services`, `#location` from header/footer.  
- **`<html lang="bg">`** matches primary Bulgarian UI.  
- **Login routes** already define basic `title` / `description` in Bulgarian.  
- **Barber photos** in booking modal use meaningful `alt` where names exist.  
- **Shop-driven branding:** `shop.name`, `heroDescription`, address from API reduce hardcoding when data is filled in admin.

---

## What is missing or misaligned

- **No `sitemap.ts` / `robots.ts`** in the repository.  
- **Root metadata references Sofia**, while the SEO goal is **Lovech** — high-priority mismatch.  
- **No Open Graph / Twitter** metadata in code.  
- **No `metadataBase` or canonical** configuration visible.  
- **No JSON-LD** structured data.  
- **`app/page.tsx` does not define its own metadata** — homepage fully inherits root.  
- **Staff/dashboard routes** inherit marketing title (“Sofia”) — poor for tabs/snippets; should use `noindex` + neutral titles.  
- **Default i18n location strings** say Sofia — weak local signal when shop data is absent.  
- **No dedicated service URLs** — limits ranking depth for long-tail service + city queries (acceptable short-term; noted as future enhancement).

---

## Important constraints (preserved)

- No changes to booking flows, forms submission, Supabase auth, API handlers, middleware, or admin business logic are **required** for the safe items above.  
- All recommended edits are **metadata**, **static route files**, **homepage-only JSON-LD**, or **translation strings**.

---

*Document generated for internal use. Update production URL, exact address, and phone before publishing schema or OG tags.*
