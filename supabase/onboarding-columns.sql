-- Onboarding flow: fields for Match IQ and wizard completion.
-- Run in Supabase SQL Editor.

alter table public.profiles add column if not exists goals text;
alter table public.profiles add column if not exists vertical_interests text;
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;
