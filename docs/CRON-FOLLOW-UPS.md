# Automated follow-ups — step-by-step setup

The app sends **one AI follow-up email** per pitch when there’s been **no response for 7 days**. To turn that on later:

1. Ensure `CRON_SECRET` is set in Netlify (you already have the secret).
2. Use a free external service to call your app once per day.

---

## Step 1: CRON_SECRET in Netlify

Make sure your existing `CRON_SECRET` is in Netlify so the app can validate the cron requests:

1. Go to [app.netlify.com](https://app.netlify.com) → your site → **Site configuration** → **Environment variables**.
2. If `CRON_SECRET` isn’t there, add it: **Key** = `CRON_SECRET`, **Value** = your secret. Scope **All** (or at least Production).
3. Redeploy once so the variable is available.

---

## Step 2: Set up a daily cron job (e.g. cron-job.org)

Netlify doesn’t run scheduled tasks. Use an external cron service to call your app once per day.

### Using cron-job.org (free)

1. Go to [cron-job.org](https://cron-job.org) and sign in (or create an account).
2. **Create cronjob**.
3. Fill in:
   - **Title:** e.g. `PitchIQ follow-ups`
   - **Address (URL):**  
     `https://YOUR-SITE-NAME.netlify.app/api/cron/follow-ups`  
     (Replace `YOUR-SITE-NAME` with your Netlify site subdomain.)
   - **Schedule:** Daily at a time you want (e.g. 9:00 AM).
   - **Request method:** GET or POST.

4. **Pass the secret** (one of these):
   - **Query:** Add query param `secret` = your `CRON_SECRET`.  
     URL becomes: `https://YOUR-SITE-NAME.netlify.app/api/cron/follow-ups?secret=YOUR_CRON_SECRET`
   - **Header:** Add header `Authorization` = `Bearer YOUR_CRON_SECRET`

5. Save and enable the job.
6. **Test:** Use “Run now”. You should get 200 and a body like `{"ok":true,"sent":0}`. If you get 401, the secret doesn’t match Netlify’s `CRON_SECRET`.

---

## What happens when it runs

- The cron service calls your app daily.
- The app finds pitches: **sent** ≥ 7 days ago, **status** = no response, **follow_ups_sent** = 0.
- For each: generates a short AI follow-up, sends it via the user’s SMTP, sets `follow_ups_sent = 1`.
- **Dashboard** → “Follow-ups sent” shows the total sent.

---

## Checklist

- [ ] `CRON_SECRET` is in Netlify env and site was redeployed.
- [ ] Daily cron job calls `https://YOUR-SITE.netlify.app/api/cron/follow-ups` with the secret (query or header).
- [ ] Test run returns 200 and JSON body.
