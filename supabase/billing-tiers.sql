-- Billing tiers and usage metering.
-- Run in Supabase SQL Editor.
-- Stripe tier mapping: free=no sub, starter/growth=from webhook metadata or price id.

alter table public.profiles add column if not exists billing_tier text;
alter table public.profiles add column if not exists pitch_limit_monthly integer;

update public.profiles set billing_tier = 'free' where billing_tier is null;
update public.profiles set pitch_limit_monthly = 10 where pitch_limit_monthly is null;

-- Limits enforced in app: free=10, starter=50, growth=300 per month
