-- Add listen_notes_id to podcasts (required for Discover / add to target list).
-- Allow authenticated users to INSERT new podcasts (from Discover add-to-target).
-- Run in Supabase: Dashboard → SQL Editor → New query → paste → Run
alter table public.podcasts add column if not exists listen_notes_id text unique;

create policy "podcasts_insert" on public.podcasts for insert to authenticated with check (true);
