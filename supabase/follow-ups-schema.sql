-- Follow-ups table for sequence tracking.
-- Run in Supabase SQL Editor.

create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  pitch_id uuid not null references public.pitches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sequence_step integer not null default 1,
  recipient_email text,
  subject text,
  body text,
  sent_at timestamptz,
  status text default 'pending' check (status in ('pending', 'sent', 'bounced', 'replied')),
  thread_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists follow_ups_pitch_id_idx on public.follow_ups (pitch_id);
create index if not exists follow_ups_user_id_idx on public.follow_ups (user_id);
create index if not exists follow_ups_send_at_idx on public.follow_ups (sent_at) where status = 'pending';

alter table public.follow_ups enable row level security;

create policy "follow_ups_select" on public.follow_ups for select to authenticated using (auth.uid() = user_id);
create policy "follow_ups_insert" on public.follow_ups for insert to authenticated with check (auth.uid() = user_id);

-- Service role can update (cron)
create policy "follow_ups_all_admin" on public.follow_ups for all to service_role using (true) with check (true);

-- User-level sequence config (simple defaults; extend later)
alter table public.profiles
  add column if not exists follow_up_days integer default 7,
  add column if not exists max_follow_ups integer default 1,
  add column if not exists follow_up_tone text default 'friendly';
