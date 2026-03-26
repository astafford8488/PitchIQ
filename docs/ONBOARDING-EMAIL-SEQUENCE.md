# Onboarding email sequence

Automated onboarding sequence for verified users, with Resend delivery and optional webhook tracking.

> If you're using Loops for visual editing/workflows, see `docs/LOOPS-ONBOARDING-SETUP.md`.

## What is implemented

- Auto-enroll verified users on first successful auth callback.
- Queue four onboarding steps:
  - `welcome_0h`
  - `setup_smtp_1d`
  - `first_pitch_3d`
  - `follow_up_7d`
- Send pending emails from cron via Resend.
- Backfill endpoint to enroll existing verified users.
- Preview endpoint to review template HTML before sending.
- Profile-level preferences (`onboarding_emails_enabled`, `marketing_emails_enabled`, `unsubscribed_at`).
- Resend webhook ingest endpoint and event storage.

## Where to edit email content

Use this file (not route handlers):

- `lib/onboarding-email-templates.ts`

To add images:

1. Upload image to a public URL (Cloudflare R2, S3, Webflow asset, etc.).
2. Set one of:
   - `ONBOARDING_EMAIL_IMAGE_URL` (global image for all emails)
   - `ONBOARDING_EMAIL_IMAGE_WELCOME`
   - `ONBOARDING_EMAIL_IMAGE_SETUP_SMTP`
   - `ONBOARDING_EMAIL_IMAGE_FIRST_PITCH`
   - `ONBOARDING_EMAIL_IMAGE_FOLLOW_UP`

## Required SQL

Run both in Supabase SQL Editor:

1. `supabase/onboarding-email-sequence.sql`
2. `supabase/onboarding-email-tracking.sql`

## Review before sending (recommended)

Preview each template in browser:

- `/api/cron/onboarding-preview?secret=YOUR_CRON_SECRET&template=welcome`
- `/api/cron/onboarding-preview?secret=YOUR_CRON_SECRET&template=setup_smtp`
- `/api/cron/onboarding-preview?secret=YOUR_CRON_SECRET&template=first_pitch`
- `/api/cron/onboarding-preview?secret=YOUR_CRON_SECRET&template=follow_up`

Optional query params:

- `name=Andrew` to preview merge values

The response header `X-Template-Subject` contains the subject line.

## Backfill existing users (verified)

Dry run first:

- `POST /api/cron/onboarding-backfill?secret=YOUR_CRON_SECRET`

Execute:

- `POST /api/cron/onboarding-backfill?secret=YOUR_CRON_SECRET&dry_run=false`

If you want immediate sends for all steps (for testing only):

- `POST /api/cron/onboarding-backfill?secret=YOUR_CRON_SECRET&dry_run=false&send_now=true`

## Scheduler

Create a cron job calling:

- `/api/cron/onboarding-emails?secret=YOUR_CRON_SECRET`

Method: `GET` or `POST`  
Frequency: every 10-15 minutes

## Resend webhook tracking

Endpoint:

- `POST /api/webhooks/resend?secret=YOUR_RESEND_WEBHOOK_SECRET`

Env:

- `RESEND_WEBHOOK_SECRET=...`

In Resend dashboard, configure webhook events:

- `email.sent`
- `email.delivered`
- `email.bounced`
- `email.opened`
- `email.clicked`

Raw webhook data is stored in:

- `public.resend_webhook_events`

Per-email lifecycle fields are updated on:

- `public.onboarding_email_events`
