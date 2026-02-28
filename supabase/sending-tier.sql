-- Sending tier: own SMTP vs PitchIQ-managed (Resend).
-- Run in Supabase SQL Editor.

alter table public.profiles add column if not exists sending_tier text default 'own';
