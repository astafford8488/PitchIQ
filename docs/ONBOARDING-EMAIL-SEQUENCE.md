# Onboarding email sequence

This project now supports an automated onboarding sequence for newly verified users.

## What it does

- Enrolls verified users once (on first successful auth callback).
- Schedules 4 emails:
  - `welcome_0h`
  - `setup_smtp_1d`
  - `first_pitch_3d`
  - `follow_up_7d`
- Sends due emails from cron via Resend.
- Respects profile email preferences (`onboarding_emails_enabled`, `unsubscribed_at`).

## Code paths

- Enrollment: `app/auth/callback/route.ts`
- Cron sender: `app/api/cron/onboarding-emails/route.ts`
- Preferences API: `app/api/email/preferences/route.ts`
- SQL migration: `supabase/onboarding-email-sequence.sql`

## Scheduler

Call `GET` or `POST`:

- `/api/cron/onboarding-emails?secret=YOUR_CRON_SECRET`
  - or `Authorization: Bearer YOUR_CRON_SECRET`

Recommended schedule: every 10-15 minutes.
