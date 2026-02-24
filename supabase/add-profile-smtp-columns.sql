-- Run this in Supabase: SQL Editor → New query → paste → Run
-- Fixes 500 when saving Settings (Email/SMTP) if those columns were never added.

alter table public.profiles add column if not exists smtp_server text;
alter table public.profiles add column if not exists smtp_port integer default 587;
alter table public.profiles add column if not exists smtp_security text default 'Auto';
alter table public.profiles add column if not exists smtp_username text;
alter table public.profiles add column if not exists smtp_password text;
alter table public.profiles add column if not exists from_email text;
