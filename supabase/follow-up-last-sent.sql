-- Track when last follow-up was sent for multi-follow-up logic.
-- Run in Supabase SQL Editor.

alter table public.pitches
  add column if not exists follow_up_last_sent_at timestamptz;
