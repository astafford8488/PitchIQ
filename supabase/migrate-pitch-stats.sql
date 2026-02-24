-- Open tracking and follow-up count for dashboard stats.
-- Run in Supabase SQL Editor if you already have the pitches table.

alter table public.pitches
  add column if not exists opened_at timestamptz,
  add column if not exists follow_ups_sent integer not null default 0;
