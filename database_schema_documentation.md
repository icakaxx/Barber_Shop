# 🗄️ Barber Shop Database Schema Documentation

## 📋 Overview

This document describes the comprehensive database schema for the barber shop management system. The schema supports multi-shop operations, user authentication, appointment booking, and complete barber management with proper security policies.

## 🏗️ Database Architecture

The database is built with **Supabase/PostgreSQL** and uses **Row Level Security (RLS)** to ensure proper data access control. The schema follows these principles:

- **Authentication-first**: All users go through Supabase Auth
- **Role-based access**: Different permissions for customers, barbers, and admins
- **Multi-shop support**: One system can manage multiple barber shops
- **Audit trail**: All important actions are logged

---

## 👥 USER MANAGEMENT SYSTEM

### 1. `profiles` Table
**Purpose**: Extended user information linked to Supabase Auth users

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key, references `auth.users(id)` | PRIMARY KEY, FK |
| `full_name` | TEXT | User's full display name | - |
| `phone` | TEXT | Contact phone number | - |
| `role` | user_role ENUM | User permission level | NOT NULL, DEFAULT 'USER' |
| `created_at` | TIMESTAMPTZ | Account creation timestamp | NOT NULL, DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Last profile update | NOT NULL, DEFAULT now() |

**Relationships:**
- 🔗 **One-to-One** with `auth.users` (via `id`)
- 🔗 **One-to-Many** to `barbers` (via `profile_id`)
- 🔗 **One-to-Many** to `appointments` (via `customer_user_id`)

**User Roles:**
- `USER` - Regular customers
- `BARBER_WORKER` - Barbers who work in shops
- `BARBER_OWNER` - Shop owners/managers
- `SUPER_ADMIN` - System administrators

---

## 🏪 SHOP MANAGEMENT

### 2. `shops` Table
**Purpose**: Physical barber shop locations and their basic information

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `owner_id` | UUID | Shop owner (references profiles) | FK (nullable) |
| `name` | TEXT | Shop display name | NOT NULL |
| `address` | TEXT | Street address | - |
| `city` | TEXT | City location | - |
| `phone` | TEXT | Shop contact number | - |
| `instagram_url` | TEXT | Social media links | - |
| `facebook_url` | TEXT | Social media links | - |
| `working_hours_text` | TEXT | Human-readable hours | - |
| `is_active` | BOOLEAN | Shop operational status | NOT NULL, DEFAULT true |
| `created_at` | TIMESTAMPTZ | Shop creation date | NOT NULL, DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Last update | NOT NULL, DEFAULT now() |

**Relationships:**
- 🔗 **Many-to-One** to `profiles` (via `owner_id`)
- 🔗 **One-to-Many** to `barbers` (via `shop_id`)
- 🔗 **One-to-Many** to `services` (via `shop_id`)
- 🔗 **One-to-Many** to `appointments` (via `shop_id`)

---

## 💇‍♂️ BARBER MANAGEMENT

### 3. `barbers` Table
**Purpose**: Workers assigned to specific shops with their display information

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `profile_id` | UUID | Linked user account | NOT NULL, FK to profiles, UNIQUE with shop_id |
| `shop_id` | UUID | Shop assignment | NOT NULL, FK to shops |
| `display_name` | TEXT | Customer-facing name | NOT NULL |
| `bio` | TEXT | Short biography | - |
| `photo_url` | TEXT | Profile picture URL | - |
| `is_active` | BOOLEAN | Available for booking | NOT NULL, DEFAULT true |
| `created_at` | TIMESTAMPTZ | Barber record creation | NOT NULL, DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Last update | NOT NULL, DEFAULT now() |

**Relationships:**
- 🔗 **Many-to-One** to `profiles` (via `profile_id`)
- 🔗 **Many-to-One** to `shops` (via `shop_id`)
- 🔗 **One-to-Many** to `time_slots` (via `barber_id`)
- 🔗 **One-to-Many** to `appointments` (via `barber_id`)

**Business Rules:**
- One profile can work at multiple shops (different barber records)
- Each barber record is unique per profile+shop combination
- Only active barbers can be booked

---

## 📋 SERVICES & PRICING

### 4. `services` Table
**Purpose**: Available services offered by each shop with pricing

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `shop_id` | UUID | Shop offering service | NOT NULL, FK to shops |
| `name` | TEXT | Service name | NOT NULL |
| `duration_min` | INTEGER | Service duration in minutes | NOT NULL, > 0, ≤ 480 |
| `price_bgn` | INTEGER | Price in Bulgarian Lev | NOT NULL, ≥ 0 |
| `is_active` | BOOLEAN | Available for booking | NOT NULL, DEFAULT true |
| `sort_order` | INTEGER | Display order | NOT NULL, DEFAULT 0 |
| `created_at` | TIMESTAMPTZ | Service creation | NOT NULL, DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Last update | NOT NULL, DEFAULT now() |

**Relationships:**
- 🔗 **Many-to-One** to `shops` (via `shop_id`)
- 🔗 **One-to-Many** to `appointments` (via `service_id`)

**Business Rules:**
- Services are shop-specific (different shops can have different prices)
- Duration helps with scheduling availability
- Sort order controls display in booking interface

---

## 🕒 AVAILABILITY MANAGEMENT

### 5. `time_slots` Table
**Purpose**: Barber availability slots for scheduling appointments

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `barber_id` | UUID | Available barber | NOT NULL, FK to barbers |
| `start_time` | TIMESTAMPTZ | Slot start datetime | NOT NULL |
| `end_time` | TIMESTAMPTZ | Slot end datetime | NOT NULL |
| `type` | slot_type ENUM | AVAILABLE or BREAK | NOT NULL, DEFAULT 'AVAILABLE' |
| `is_available` | BOOLEAN | Can be booked | NOT NULL, DEFAULT true |
| `created_at` | TIMESTAMPTZ | Slot creation | NOT NULL, DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Last update | NOT NULL, DEFAULT now() |

**Slot Types:**
- `AVAILABLE` - Barber is free for appointments
- `BREAK` - Barber is on break/unavailable

**Relationships:**
- 🔗 **Many-to-One** to `barbers` (via `barber_id`)

**Business Rules:**
- `end_time` must be after `start_time`
- Slots don't overlap for the same barber
- `is_available` provides soft blocking (can mark unavailable without deleting)

---

## 📅 APPOINTMENT BOOKING

### 6. `appointments` Table
**Purpose**: Customer bookings with full appointment details

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `shop_id` | UUID | Appointment location | NOT NULL, FK to shops |
| `service_id` | UUID | Service being booked | NOT NULL, FK to services |
| `barber_id` | UUID | Assigned barber | NOT NULL, FK to barbers |
| `customer_user_id` | UUID | Booked customer | FK to profiles (nullable) |
| `customer_name` | TEXT | Customer full name | NOT NULL |
| `customer_phone` | TEXT | Contact number | NOT NULL |
| `customer_email` | TEXT | Contact email | - |
| `start_time` | TIMESTAMPTZ | Appointment start | NOT NULL |
| `end_time` | TIMESTAMPTZ | Appointment end | NOT NULL |
| `status` | appointment_status ENUM | Booking status | NOT NULL, DEFAULT 'PENDING' |
| `cancelled_by_user_id` | UUID | Who cancelled | FK to profiles (nullable) |
| `cancelled_by_role` | user_role ENUM | Canceller's role | - |
| `cancel_reason` | TEXT | Cancellation reason | - |
| `cancelled_at` | TIMESTAMPTZ | Cancellation time | - |
| `notes` | TEXT | Special instructions | - |
| `created_at` | TIMESTAMPTZ | Booking creation | NOT NULL, DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Last update | NOT NULL, DEFAULT now() |

**Appointment Statuses:**
- `PENDING` - Awaiting confirmation
- `CONFIRMED` - Confirmed booking
- `CANCELLED` - Cancelled appointment
- `DONE` - Completed service

**Relationships:**
- 🔗 **Many-to-One** to `shops` (via `shop_id`)
- 🔗 **Many-to-One** to `services` (via `service_id`)
- 🔗 **Many-to-One** to `barbers` (via `barber_id`)
- 🔗 **Many-to-One** to `profiles` (via `customer_user_id`)

**Business Rules:**
- No double-booking: Unique barber + start_time for confirmed/pending appointments
- End time calculated from service duration
- Guest bookings allowed (no customer_user_id required)

---

## 📊 AUDIT & LOGGING

### 7. `audit_logs` Table
**Purpose**: Track all administrative actions for compliance and debugging

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `actor_user_id` | UUID | Who performed action | NOT NULL, FK to profiles |
| `actor_role` | user_role ENUM | Actor's role at time | - |
| `action` | TEXT | Action description | NOT NULL |
| `entity_type` | TEXT | Affected table | NOT NULL |
| `entity_id` | UUID | Affected record ID | - |
| `metadata` | JSONB | Additional data | NOT NULL, DEFAULT '{}' |
| `created_at` | TIMESTAMPTZ | Action timestamp | NOT NULL, DEFAULT now() |

**Relationships:**
- 🔗 **Many-to-One** to `profiles` (via `actor_user_id`)

**Common Actions Logged:**
- Barber creation/updates/deletions
- Appointment bookings/cancellations
- Shop management changes
- Service modifications

---

## 🔐 SECURITY & ACCESS CONTROL

### Row Level Security (RLS) Policies

The database implements comprehensive RLS policies:

#### **Public Access (Anonymous Users):**
- ✅ Read active shops and their services
- ✅ Read active barbers
- ✅ Create appointments (guest booking allowed)
- ✅ Read their own appointments (if authenticated)

#### **Customer Access (USER role):**
- ✅ All public permissions
- ✅ Full CRUD on their own appointments
- ✅ Update their profile

#### **Barber Worker Access (BARBER_WORKER role):**
- ✅ Read their shop's data
- ✅ Manage their own time slots
- ✅ View their appointments
- ✅ Update appointment status
- ✅ View team members at same shop

#### **Shop Owner Access (BARBER_OWNER role):**
- ✅ Full control over their shops
- ✅ Manage services for their shops
- ✅ Manage barbers at their shops
- ✅ View all appointments at their shops

#### **Super Admin Access (SUPER_ADMIN role):**
- ✅ Full system access
- ✅ View all audit logs
- ✅ System-wide management

---

## 📈 PERFORMANCE OPTIMIZATIONS

### Database Indexes

The schema includes strategic indexes for optimal query performance:

```sql
-- User and profile lookups
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- Shop operations
CREATE INDEX idx_shops_owner_id ON shops(owner_id);
CREATE INDEX idx_shops_is_active ON shops(is_active);

-- Barber management
CREATE INDEX idx_barbers_shop_id ON barbers(shop_id);
CREATE INDEX idx_barbers_profile_id ON barbers(profile_id);
CREATE INDEX idx_barbers_active ON barbers(shop_id, is_active);

-- Service queries
CREATE INDEX idx_services_shop_id ON services(shop_id);
CREATE INDEX idx_services_active ON services(shop_id, is_active);

-- Availability checks
CREATE INDEX idx_time_slots_barber_time ON time_slots(barber_id, start_time);
CREATE INDEX idx_time_slots_time ON time_slots(start_time);

-- Appointment management
CREATE INDEX idx_appointments_shop_time ON appointments(shop_id, start_time);
CREATE INDEX idx_appointments_barber_time ON appointments(barber_id, start_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_customer_user ON appointments(customer_user_id);

-- Audit queries
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at desc);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
```

---

## 🔄 DATA FLOW & BUSINESS LOGIC

### Appointment Booking Process

1. **Customer selects service** → Check service availability
2. **Chooses barber** → Filter time slots by barber availability
3. **Picks time slot** → Verify no conflicts
4. **Creates appointment** → Status: PENDING
5. **Shop confirms** → Status: CONFIRMED
6. **Service completed** → Status: DONE

### Availability Calculation

- **Available slots** = barber's AVAILABLE time_slots minus booked appointments
- **Conflicts prevented** by unique constraints on barber + start_time
- **Buffer time** can be added via time slot management

### Multi-Shop Operations

- Shops are independent but can share the same system
- Barbers can work at multiple shops (separate records)
- Services can vary by shop location
- Owners manage their specific shops only

---

## 🚀 EXTENSIBILITY

### Future Enhancements Ready

- **Payment integration** - Add payment tracking tables
- **Customer loyalty** - Points/rewards system
- **Inventory management** - Product stock tracking
- **Marketing campaigns** - Promotional offers
- **Staff scheduling** - Advanced shift management
- **Customer reviews** - Rating and feedback system

### API Integration Points

- **Booking widgets** - External website integration
- **Calendar sync** - Google Calendar/Outlook integration
- **SMS notifications** - Appointment reminders
- **Payment processors** - Stripe/PayPal integration
- **POS systems** - Point of sale integration

---

## 📊 MONITORING & MAINTENANCE

### Key Metrics to Track

- **Appointment volume** by shop/barber/time
- **Cancellation rates** and reasons
- **Revenue tracking** by service/shop
- **Customer retention** and repeat bookings
- **Staff utilization** and availability

### Maintenance Tasks

- **Archive old appointments** (6+ months)
- **Clean audit logs** (regular purging)
- **Update time slots** (recurring schedules)
- **Monitor performance** (query optimization)
- **Backup verification** (regular testing)

This database schema provides a solid foundation for a scalable, secure, and feature-rich barber shop management system! 🎯</contents>
</xai:function_call">Created file database_schema_documentation.md
