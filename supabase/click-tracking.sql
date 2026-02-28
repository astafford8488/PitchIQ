-- Click tracking for pitch emails.
-- Run in Supabase SQL Editor.

alter table public.pitches
  add column if not exists first_clicked_at timestamptz;
