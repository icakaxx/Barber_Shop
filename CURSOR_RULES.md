Perfect 👍
Below is a **clean, compact, Cursor-optimized version** of the rules you should paste **directly into `CURSOR_RULES.md`**.
This version is intentionally **shorter, stricter, and practical** so Cursor actually *follows* it instead of ignoring it.

---

# CURSOR RULES — Barber Booking Platform

## 1. Stack & defaults

* Framework: **Next.js App Router + TypeScript**
* Styling: **TailwindCSS only**
* UI: **shadcn/ui**
* Icons: **lucide-react**
* DB/Auth: **Supabase (Postgres + Auth + RLS)**
* Prefer **Server Components** for data fetching.

---

## 2. Roles (source of truth)

Roles are stored **only** in `profiles.role` (Postgres ENUM):

```
USER
BARBER_WORKER
BARBER_OWNER
SUPER_ADMIN
```

❌ Never store roles in JSON
❌ Never trust client-side role checks

---

## 3. Authorization rules (MANDATORY)

All permissions must be enforced **server-side**.

### Scope rules

* **BARBER_WORKER**

  * Can edit only their own schedule
  * Can see team schedule (read-only)
  * Can manage their own appointments (view, edit, mark done, cancel)
  * Can view colleagues' appointments in the same shop
  * Can edit and create appointments for colleagues in the same shop
  * Each barber has their own dashboard at `/dashboard/barber/[id]` or `/dashboard/barber?name=barber-name`
* **BARBER_OWNER**

  * Can manage everything inside their shop(s)
* **SUPER_ADMIN**

  * Can manage everything globally

### Guards

* `/dashboard/barber` → BARBER_WORKER
* `/dashboard/owner` → BARBER_OWNER
* `/admin` → SUPER_ADMIN

Unauthorized users must be redirected.

---

## 4. Supabase usage rules

* Use **server Supabase client** for:

  * Server Components
  * Route Handlers
  * Server Actions
* Use **client Supabase** only when strictly needed.
* Guest bookings must go through **server routes using service role key**.

---

## 5. Data rules

* All timestamps are stored as `timestamptz`
* Always prevent double-booking (server-side validation)
* Soft-delete via `is_active = false` (no hard deletes unless admin)

---

## 6. Booking flow rules

Booking flow must follow:

```
Service → Barber → Date/Time → Details → Confirm → Success
```

* Booking must be transactional
* Slot availability must be revalidated on confirm
* Cancellation requires a reason (min 5 chars)
* Multiple services can be selected in a single booking
* Total duration and price are calculated automatically from selected services

---

## 7. UI / UX rules

* Mobile-first, no horizontal overflow
* Consistent layout:

```
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
```

* Destructive actions require confirmation dialogs
* Always show loading + disabled states on actions

---

## 8. Code organization

```
app/
  dashboard/
    barber/
      [id]/          # Dynamic route for individual barber dashboards
  admin/
  api/
    barbers/
      [id]/
        appointments/    # GET barber appointments
        availability/    # GET barber availability/time slots
    appointments/
      [id]/              # PUT/DELETE appointment operations
components/
  booking/
  dashboard/
    barber/
      TodayAppointments.tsx      # View and manage own appointments
      ManageAvailability.tsx      # Manage time slots
      TeamView.tsx                # View and manage team appointments
      EditAppointmentModal.tsx     # Edit appointment details
      CreateAppointmentModal.tsx   # Create new appointments
  admin/
  shared/
lib/
  supabase/
  auth/
  validators/
```

* Shared logic/components must be reused
* No duplicated schedule or appointment logic
* Barber dashboards are dynamic routes supporting both ID and name-based access

---

## 9. Validation & types

* Use **zod** for all input validation
* Define shared enums/types (Role, SlotType, AppointmentStatus)
* No `any`

---

## 10. Database & migrations

* All DB changes go into `supabase/migrations/*.sql`
* Use ENUMs for roles/statuses
* Always create indexes for time-based queries

---

## 11. Output expectations for Cursor

When generating code:

* List files created/edited
* Provide full file contents
* Ensure code compiles
* Do not omit critical logic with comments like “TODO”

---

## 12. Barber Dashboard Features

### Individual Barber Pages
* Each barber has a dedicated dashboard accessible via:
  * `/dashboard/barber/[id]` - By barber ID
  * `/dashboard/barber?name=barber-name` - By barber display name
* Dashboard tabs:
  * **Today's Schedule** - View and manage own appointments
  * **Manage Availability** - View and manage time slots
  * **Team View** - View and manage all shop appointments

### Appointment Management
* Barbers can:
  * View all their appointments from the database
  * Edit appointment details (customer info, time, status, notes)
  * Mark appointments as Done
  * Cancel appointments with reason
  * View colleagues' appointments in the same shop
  * Edit colleagues' appointments
  * Create new appointments for any barber in the shop

### API Endpoints
* `GET /api/barbers/[id]/appointments` - Get appointments for a barber (supports date/status filters)
* `GET /api/barbers/[id]/availability` - Get availability/time slots for a barber
* `GET /api/appointments?shopId=X` - Get all appointments for a shop (team view)
* `PUT /api/appointments/[id]` - Update appointment
* `POST /api/appointments` - Create new appointment (with double-booking prevention)
* `DELETE /api/appointments/[id]` - Cancel appointment

### Data Flow
* All appointment data is fetched from Supabase
* Real-time updates after create/edit/delete operations
* Visual indicators show appointment status and barber ownership
* Availability slots show booked vs available status

---

## 13. Non-negotiables

❌ No role logic in frontend only
❌ No JSON roles
❌ No direct DB writes from client
❌ No schedule/appointment mutations without ownership checks
❌ No appointment creation without double-booking validation

---

### End of rules

---

### How to use it in practice

When prompting Cursor, start with:

> **“Follow the rules in `CURSOR_RULES.md`.”**

Cursor will then treat this file as the **source of truth** for all generated code.

If you want, next I can:

* compress this further for `.cursorrules`
* add a **“Definition of Done” checklist**
* add a **Security rules appendix** for RLS & admin routes
