-- Profile IQ enhancement: add fields for audit and pitch personalization.
-- Run in Supabase SQL Editor.

alter table public.profiles add column if not exists linkedin_url text;
alter table public.profiles add column if not exists speaking_topics text;
alter table public.profiles add column if not exists past_appearances text;
alter table public.profiles add column if not exists book_product_links text;
