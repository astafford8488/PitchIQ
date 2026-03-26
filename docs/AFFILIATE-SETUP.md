# Affiliate program setup

**PitchIQ Supabase project:** `https://qcfodbtnohouxwkbetsd.supabase.co` (ref: `qcfodbtnohouxwkbetsd`, "Podcast Pitch App"). Use only this project for PitchIQ; point Railway env (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) at it.

## Create affiliate tables (one-time)

The Cursor Supabase connector doesn’t have access to this project, so run the migration in the Dashboard:

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → select project **qcfodbtnohouxwkbetsd** (Podcast Pitch App).
2. Go to **SQL Editor** → New query.
3. Paste and run the contents of **`supabase/affiliate-tables.sql`** (or the SQL below).
4. Redeploy or retry the affiliate form.

```sql
-- Affiliate applications (public form submits here via API using service role)
create table if not exists public.affiliate_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  audience_size text,
  audience_platforms text,
  website_or_handles text,
  how_heard text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.affiliate_applications(id),
  name text not null,
  email text not null,
  affiliate_code text not null unique,
  total_signups int not null default 0,
  total_earned_cents int not null default 0,
  total_paid_out_cents int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_affiliate_applications_status on public.affiliate_applications(status);
create index if not exists idx_affiliates_code on public.affiliates(affiliate_code);

alter table public.affiliate_applications enable row level security;
alter table public.affiliates enable row level security;
```

## If the application form fails to submit

1. **Production env**  
   In Railway (or your host), set:
   - `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Dashboard → Settings → API → **service_role** (secret, not the anon key).  
   - Ensure it has no trailing newline when pasted.  
   The affiliate form and admin approve/deny use the service-role client; without this key the insert will fail.

2. **Same project**  
   `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must be for the **same** Supabase project.  
   The URL host should look like `xxxxx.supabase.co`; the service role key is listed on that project’s API settings page.

3. **Database**  
   The `affiliate_applications` and `affiliates` tables must exist in that project.  
   Run the SQL in `supabase/affiliate-tables.sql` in the Supabase SQL editor for that project (or use the Cursor Supabase connector to apply the migration).

4. **Logs**  
   A failed insert is logged as `affiliate apply insert <code> <message>`. Check your server logs (e.g. Railway) for the exact Supabase error.  
   In **development**, the API response body includes the error code/message so you can see it in the network tab.
