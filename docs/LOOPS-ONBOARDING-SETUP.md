# Loops onboarding setup (PitchIQ)

Use Loops as the source of truth for onboarding email design and sequence logic.

## Why this mode

- Visual template editor in Loops (better non-dev editing workflow)
- Image management in Loops UI (no Railway image env vars required)
- Workflow sequencing in Loops (delays/branching in UI)

## 1) Railway env vars

Set these in Railway for your production service:

- `LOOPS_API_KEY` = your Loops API key
- `LOOPS_ONBOARDING_ENABLED` = `true`
- `ONBOARDING_PROVIDER` = `loops` (or `both` during migration)
- `LOOPS_ONBOARDING_LIST_ID` = list ID to add verified users to (optional but recommended)
- `LOOPS_ONBOARDING_EVENT_NAME` = `pitchiq_onboarding_started` (default works)

Then redeploy.

## 2) Configure Loops workflow

In Loops UI:

1. Build your onboarding templates in the visual editor.
2. Create an onboarding workflow triggered by either:
   - Contact added to `LOOPS_ONBOARDING_LIST_ID`, or
   - Event name `pitchiq_onboarding_started`.
3. Add your delay steps and email sends in Loops.

## 3) Backfill existing users to Loops

Dry run:

- `POST https://pitchiq.live/api/cron/loops-backfill?secret=YOUR_CRON_SECRET`

Execute:

- `POST https://pitchiq.live/api/cron/loops-backfill?secret=YOUR_CRON_SECRET&dry_run=false`

This syncs all verified users to Loops and (if list ID exists) adds them to that list.

## 4) Verify

- Sign up a new test user and verify email.
- Confirm contact appears in Loops with:
  - `userId`
  - `pitchiqUserId`
  - `pitchiqVerifiedAt`
- Confirm the Loops workflow enrolls and sends first email.

## 5) Optional cleanup

If fully migrated to Loops:

- Keep `ONBOARDING_PROVIDER=loops`
- Disable old internal cron for `/api/cron/onboarding-emails` if no longer needed.
