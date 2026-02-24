-- Add SMTP settings to profiles. Run in Supabase SQL Editor if you already ran schema.sql.
alter table public.profiles
  add column if not exists smtp_server text,
  add column if not exists smtp_port integer default 587,
  add column if not exists smtp_security text default 'Auto',
  add column if not exists smtp_username text,
  add column if not exists smtp_password text,
  add column if not exists from_email text;

-- Add Listen Notes id to podcasts (for syncing from Listen Notes API).
alter table public.podcasts add column if not exists listen_notes_id text unique;
