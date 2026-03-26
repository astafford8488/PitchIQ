-- Add tracking fields + webhook event store for onboarding emails.
-- Run once in Supabase SQL editor for project qcfodbtnohouxwkbetsd.

alter table public.onboarding_email_events
  add column if not exists delivered_at timestamptz,
  add column if not exists bounced_at timestamptz,
  add column if not exists opened_at timestamptz,
  add column if not exists clicked_at timestamptz,
  add column if not exists last_event_type text;

create table if not exists public.resend_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'resend',
  event_type text not null,
  message_id text,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create index if not exists resend_webhook_events_message_idx
  on public.resend_webhook_events(message_id);
create index if not exists resend_webhook_events_type_idx
  on public.resend_webhook_events(event_type);

alter table public.resend_webhook_events enable row level security;

drop policy if exists resend_webhook_events_service_role on public.resend_webhook_events;
create policy resend_webhook_events_service_role
  on public.resend_webhook_events
  for all to service_role
  using (true)
  with check (true);
