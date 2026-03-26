-- Run this in Supabase SQL Editor for the PitchIQ project (qcfodbtnohouxwkbetsd).
-- One-time: adds tables/policies that were intended but not yet applied to PitchIQ.
-- Safe to run multiple times (if not exists / drop if exists).

-- 1. search_usage: daily search count per user (tier limits)
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

-- 2. follow_ups: sequence tracking for pitch follow-ups
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
drop policy if exists "follow_ups_select" on public.follow_ups;
create policy "follow_ups_select" on public.follow_ups for select to authenticated using (auth.uid() = user_id);
drop policy if exists "follow_ups_insert" on public.follow_ups;
create policy "follow_ups_insert" on public.follow_ups for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "follow_ups_all_admin" on public.follow_ups;
create policy "follow_ups_all_admin" on public.follow_ups for all to service_role using (true) with check (true);

-- 3. pitch_templates + pitches.template_id
create table if not exists public.pitch_templates (
  id uuid primary key default gen_random_uuid(),
  template_subject text not null,
  template_body text not null,
  vertical text,
  success_count integer default 0,
  usage_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.pitch_templates enable row level security;
drop policy if exists "pitch_templates_select" on public.pitch_templates;
create policy "pitch_templates_select" on public.pitch_templates for select to authenticated using (true);
drop policy if exists "pitch_templates_insert" on public.pitch_templates;
create policy "pitch_templates_insert" on public.pitch_templates for insert to authenticated with check (true);
drop policy if exists "pitch_templates_update" on public.pitch_templates;
create policy "pitch_templates_update" on public.pitch_templates for update to authenticated using (true);
alter table public.pitches add column if not exists template_id uuid references public.pitch_templates(id) on delete set null;
insert into public.pitch_templates (template_subject, template_body, vertical)
select
  'Guest pitch for {{podcast_title}}',
  'Hi, {{host_name}},

I''d love to be a guest on {{podcast_title}}.

{{bio}}

{{expertise}}

{{credentials}}

Best,
{{name}}',
  null
where not exists (select 1 from public.pitch_templates limit 1);

-- 4. podcasts: allow authenticated update (e.g. add host email)
drop policy if exists "podcasts_update" on public.podcasts;
create policy "podcasts_update" on public.podcasts for update to authenticated using (true) with check (true);
