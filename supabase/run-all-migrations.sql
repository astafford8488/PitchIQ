-- Run once in Supabase SQL Editor if you see "column does not exist" errors.
-- Adds all profile and pitch columns the app expects. Safe to run multiple times (if not exists).

-- Profiles: SMTP
alter table public.profiles add column if not exists smtp_server text;
alter table public.profiles add column if not exists smtp_port integer default 587;
alter table public.profiles add column if not exists smtp_security text default 'Auto';
alter table public.profiles add column if not exists smtp_username text;
alter table public.profiles add column if not exists smtp_password text;
alter table public.profiles add column if not exists from_email text;

-- Profiles: follow-up config
alter table public.profiles
  add column if not exists follow_up_days integer default 7,
  add column if not exists max_follow_ups integer default 1,
  add column if not exists follow_up_tone text default 'friendly';

-- Profiles: billing + Stripe
alter table public.profiles add column if not exists billing_tier text;
alter table public.profiles add column if not exists pitch_limit_monthly integer;
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists stripe_subscription_id text;
alter table public.profiles add column if not exists stripe_subscription_status text;
update public.profiles set billing_tier = 'free' where billing_tier is null;
update public.profiles set pitch_limit_monthly = 10 where pitch_limit_monthly is null;

-- Profiles: sending tier (optional, for future PitchIQ-managed)
alter table public.profiles add column if not exists sending_tier text default 'own';

-- Profiles: onboarding (layout redirects to /onboarding if missing)
alter table public.profiles add column if not exists goals text;
alter table public.profiles add column if not exists vertical_interests text;
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;

-- Pitches: tracking and follow-ups
alter table public.pitches
  add column if not exists opened_at timestamptz,
  add column if not exists first_clicked_at timestamptz,
  add column if not exists follow_ups_sent integer not null default 0,
  add column if not exists follow_up_last_sent_at timestamptz;

-- Daily search usage (tier limits)
create table if not exists public.search_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default (current_date at time zone 'utc'),
  count int not null default 0,
  primary key (user_id, usage_date)
);
alter table public.search_usage enable row level security;
drop policy if exists "Users can read own search_usage" on public.search_usage;
create policy "Users can read own search_usage" on public.search_usage for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own search_usage" on public.search_usage;
create policy "Users can insert own search_usage" on public.search_usage for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own search_usage" on public.search_usage;
create policy "Users can update own search_usage" on public.search_usage for update using (auth.uid() = user_id);

-- Affiliate program (admin-only access via service role)
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
