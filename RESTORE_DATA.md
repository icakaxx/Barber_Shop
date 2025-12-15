# 🔄 How to Restore Your Data

If your services, barbers, or other data disappeared after restarting the server, here's how to restore them:

## 📋 Quick Fix

### Option 1: Run the Restoration Script (Recommended)

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to **SQL Editor**

2. **Run the restoration script**
   - Open the file: `supabase/migrations/004_restore_default_data.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click **Run**

This will:
- ✅ Create a default shop if none exists
- ✅ Insert all 5 default services
- ✅ Show you what data exists

### Option 2: Re-run All Migrations

If you want to ensure everything is set up correctly:

1. **Run migration 001** (schema):
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Run in Supabase SQL Editor
   - This creates all tables (safe to run multiple times)

2. **Run migration 002** (services):
   - Copy contents of `supabase/migrations/002_insert_default_services.sql`
   - Run in Supabase SQL Editor
   - This creates shop and services

3. **Run migration 004** (restore data):
   - Copy contents of `supabase/migrations/004_restore_default_data.sql`
   - Run in Supabase SQL Editor

## 🔍 Check Your Data

After running the scripts, verify your data:

```sql
-- Check shops
SELECT * FROM public.shops WHERE is_active = true;

-- Check services
SELECT * FROM public.services WHERE is_active = true;

-- Check barbers
SELECT b.*, sh.name as shop_name 
FROM public.barbers b
JOIN public.shops sh ON sh.id = b.shop_id
WHERE b.is_active = true;
```

## ⚠️ Important Notes

### Why Did My Data Disappear?

1. **Cloud Supabase**: Data should persist unless:
   - You manually deleted it
   - You're on a free tier and hit storage limits
   - There was a database reset (rare)

2. **Local Supabase**: If you're using `supabase start` locally:
   - Data resets when you run `supabase stop` and `supabase start`
   - Use `supabase db reset` to re-run migrations

3. **Connection Issues**: Sometimes the app can't connect:
   - Check your `.env.local` file has correct Supabase credentials
   - Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Check `SUPABASE_SERVICE_ROLE_KEY` for server-side operations

## 🛠️ Create Barbers

After restoring services, create barbers through:

1. **Super Admin Panel**: Go to `/admin` → Barber Management tab
2. **API**: Use the `/api/barbers` POST endpoint
3. **Supabase Dashboard**: Manually create auth users and profiles

## 📝 Default Services

The restoration script will create these services:

1. **Haircut** - 30 min - 25 лв
2. **Beard shaping / Beard trim** - 20 min - 15 лв
3. **Eyebrow grooming / Eyebrow shaping** - 5 min - 10 лв
4. **Ear cleaning** - 5 min - 8 лв
5. **Nose hair removal / Nose grooming** - 5 min - 8 лв

## 🆘 Still Having Issues?

1. **Check Supabase Dashboard**:
   - Go to Table Editor
   - Verify tables exist: `shops`, `services`, `barbers`, `appointments`
   - Check if data is actually there

2. **Check Environment Variables**:
   ```bash
   # Make sure .env.local exists with:
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Restart Your Dev Server**:
   ```bash
   npm run dev
   ```

4. **Check Browser Console**: Look for Supabase connection errors

If data is still missing after running the restoration script, let me know and we can investigate further!

