-- Podcast Pitch Platform — Supabase schema ($0 hackathon)
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query → paste & run

-- podcasts: show name, description, category, host, contact (see HACKATHON-OUTLINE.md)
create table if not exists public.podcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  website_url text,
  rss_feed_url text,
  cover_image_url text,
  category text,
  topics text[] default '{}',
  host_name text,
  host_email text,
  contact_url text,
  listener_tier text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- profiles: user profile keyed by auth.id (bio, expertise, target audience)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  bio text,
  expertise_topics text,
  target_audience text,
  credentials text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- target_list: user ↔ podcast many-to-many; prevents duplicate outreach
create table if not exists public.target_list (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  podcast_id uuid not null references public.podcasts(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, podcast_id)
);

-- pitches: sent pitches with status (interested / declined / booked / no_response)
create table if not exists public.pitches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  podcast_id uuid not null references public.podcasts(id) on delete cascade,
  subject text,
  body text,
  sent_at timestamptz,
  status text default 'no_response' check (status in ('pending', 'interested', 'declined', 'booked', 'no_response')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: users see only their own data
alter table public.podcasts enable row level security;
alter table public.profiles enable row level security;
alter table public.target_list enable row level security;
alter table public.pitches enable row level security;

-- podcasts: read-only for all authenticated users
create policy "podcasts_select" on public.podcasts for select to authenticated using (true);

-- profiles: user can read/update own
create policy "profiles_select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update to authenticated using (auth.uid() = id);

-- target_list: user CRUD own rows
create policy "target_list_select" on public.target_list for select to authenticated using (auth.uid() = user_id);
create policy "target_list_insert" on public.target_list for insert to authenticated with check (auth.uid() = user_id);
create policy "target_list_delete" on public.target_list for delete to authenticated using (auth.uid() = user_id);

-- pitches: user CRUD own rows
create policy "pitches_select" on public.pitches for select to authenticated using (auth.uid() = user_id);
create policy "pitches_insert" on public.pitches for insert to authenticated with check (auth.uid() = user_id);
create policy "pitches_update" on public.pitches for update to authenticated using (auth.uid() = user_id);
create policy "pitches_delete" on public.pitches for delete to authenticated using (auth.uid() = user_id);

-- trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();
