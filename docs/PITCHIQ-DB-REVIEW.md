# PitchIQ DB review (project qcfodbtnohouxwkbetsd)

Review of intended DB changes vs what’s applied on **Podcast Pitch App** (`https://qcfodbtnohouxwkbetsd.supabase.co`).

## Already applied on PitchIQ

- **Core schema:** `podcasts`, `profiles`, `target_list`, `pitches`, RLS and base policies.
- **Profiles:** SMTP columns, billing/Stripe (`billing_tier`, `pitch_limit_monthly`, `stripe_*`), onboarding (`goals`, `vertical_interests`, `onboarding_completed_at`), follow-up config (`follow_up_days`, `max_follow_ups`, `follow_up_tone`), `sending_tier`, profile IQ (`linkedin_url`, `speaking_topics`, `past_appearances`, `book_product_links`).
- **Pitches:** `opened_at`, `first_clicked_at`, `follow_ups_sent`, `follow_up_last_sent_at`, `contact_id`.
- **Podcasts:** `listen_notes_id`; policies `podcasts_select`, `podcasts_insert`.
- **Contacts / vertical:** `contacts`, `contact_target_list`, and their RLS policies.
- **Affiliate:** `affiliate_applications`, `affiliates` (RLS enabled, no policies; service role only).

## Missing on PitchIQ (run once)

Apply **`supabase/pitchiq-missing-migrations.sql`** in Supabase → SQL Editor for project **qcfodbtnohouxwkbetsd**:

| Change | Purpose |
|--------|--------|
| **search_usage** table + RLS | Daily search count per user for tier limits (starter/growth/platinum). |
| **follow_ups** table + RLS | Follow-up sequence tracking for pitches. |
| **pitch_templates** table + **pitches.template_id** + seed | Template library and link from pitch to template. |
| **podcasts_update** policy | Let authenticated users update podcasts (e.g. host email). |

After running that file, all intended DB changes for PitchIQ will be in place on this project.
