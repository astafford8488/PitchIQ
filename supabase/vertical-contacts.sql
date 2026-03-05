-- Vertical DB: contacts (media, VC, creators) and contact target list.
-- Run in Supabase SQL Editor after main schema. Safe to run multiple times.

-- contacts: from Muck Rack, Crunchbase, Harmonic, or manual
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'manual' check (source in ('manual', 'muck_rack', 'crunchbase', 'harmonic')),
  external_id text,
  name text,
  email text,
  title text,
  outlet_name text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists contacts_source_idx on public.contacts(source);
create index if not exists contacts_external_id_idx on public.contacts(source, external_id) where external_id is not null;

alter table public.contacts enable row level security;
drop policy if exists "contacts_select" on public.contacts;
drop policy if exists "contacts_insert" on public.contacts;
drop policy if exists "contacts_update" on public.contacts;
create policy "contacts_select" on public.contacts for select to authenticated using (true);
create policy "contacts_insert" on public.contacts for insert to authenticated with check (true);
create policy "contacts_update" on public.contacts for update to authenticated using (true);

-- contact_target_list: user's list of contacts to pitch
create table if not exists public.contact_target_list (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, contact_id)
);

alter table public.contact_target_list enable row level security;
drop policy if exists "contact_target_list_select" on public.contact_target_list;
drop policy if exists "contact_target_list_insert" on public.contact_target_list;
drop policy if exists "contact_target_list_delete" on public.contact_target_list;
create policy "contact_target_list_select" on public.contact_target_list for select to authenticated using (auth.uid() = user_id);
create policy "contact_target_list_insert" on public.contact_target_list for insert to authenticated with check (auth.uid() = user_id);
create policy "contact_target_list_delete" on public.contact_target_list for delete to authenticated using (auth.uid() = user_id);

-- pitches: support either podcast_id OR contact_id (one required)
alter table public.pitches add column if not exists contact_id uuid references public.contacts(id) on delete cascade;
alter table public.pitches alter column podcast_id drop not null;
alter table public.pitches drop constraint if exists pitches_podcast_or_contact;
alter table public.pitches add constraint pitches_podcast_or_contact check (
  (podcast_id is not null and contact_id is null) or (podcast_id is null and contact_id is not null)
);
