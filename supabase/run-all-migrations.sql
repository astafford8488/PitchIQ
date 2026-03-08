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

-- Profiles: billing
alter table public.profiles add column if not exists billing_tier text;
alter table public.profiles add column if not exists pitch_limit_monthly integer;
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
