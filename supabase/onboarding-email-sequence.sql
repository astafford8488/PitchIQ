-- Onboarding email sequence tables + profile email preferences.
-- Run once in Supabase SQL editor for project qcfodbtnohouxwkbetsd.

alter table public.profiles
  add column if not exists onboarding_emails_enabled boolean not null default true,
  add column if not exists marketing_emails_enabled boolean not null default true,
  add column if not exists unsubscribed_at timestamptz;

create table if not exists public.onboarding_email_sequences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  source text not null default 'auth_callback',
  enrolled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.onboarding_email_events (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references public.onboarding_email_sequences(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_email text not null,
  step_key text not null,
  template_key text not null,
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'cancelled')),
  attempts integer not null default 0,
  last_error text,
  resend_message_id text,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists onboarding_email_events_status_scheduled_idx
  on public.onboarding_email_events(status, scheduled_at);
create index if not exists onboarding_email_events_user_idx
  on public.onboarding_email_events(user_id);
create index if not exists onboarding_email_sequences_user_idx
  on public.onboarding_email_sequences(user_id);

alter table public.onboarding_email_sequences enable row level security;
alter table public.onboarding_email_events enable row level security;

drop policy if exists onboarding_seq_select_own on public.onboarding_email_sequences;
create policy onboarding_seq_select_own
  on public.onboarding_email_sequences
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists onboarding_events_select_own on public.onboarding_email_events;
create policy onboarding_events_select_own
  on public.onboarding_email_events
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists onboarding_events_update_own on public.onboarding_email_events;
create policy onboarding_events_update_own
  on public.onboarding_email_events
  for update to authenticated
  using (auth.uid() = user_id);
