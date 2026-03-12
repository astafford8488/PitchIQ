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

-- Approved affiliates (created when application is approved)
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
-- No policies: only server with service_role key accesses these (admin only).
-- To allow read in dashboard, admin uses createAdminClient() which bypasses RLS.
