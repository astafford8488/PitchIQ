# PitchIQ — Sending Domain Infrastructure

Guide for setting up dedicated sending (PitchIQ-managed). Steps 2–5.

---

## 2. DNS — SPF, DKIM, DMARC

### SPF (Sender Policy Framework)

**What it does:** Tells receiving mail servers which hosts are allowed to send email for your domain. Without it, your mail is more likely to land in spam.

**What you're looking for in your provider's docs:** The exact SPF `include` string. Search for:

- "SPF record" or "SPF setup"
- "DNS records" or "domain verification"
- The `include:` mechanism — e.g. `include:amazonses.com` or `include:sendgrid.net`

Each provider publishes their own SPF include. Examples:

| Provider   | SPF include                 |
|------------|-----------------------------|
| Resend     | `include:amazonses.com`     |
| SendGrid   | `include:sendgrid.net`      |
| Mailgun    | `include:mailgun.org`       |
| Amazon SES | `include:amazonses.com`     |
| Brevo     | `include:spf.brevo.com`     |

**How to add it in Cloudflare:**

1. Go to Cloudflare Dashboard → your domain (`pitchiq.live`) → DNS → Records.
2. Add record:
   - **Type:** TXT
   - **Name:** `@` (root) or `send` (if using `send.pitchiq.live`)
   - **Content:** `v=spf1 include:amazonses.com ~all`
   - Replace `include:amazonses.com` with whatever your provider's docs say.
3. Save. If you already have an SPF record, merge into one — you can only have one SPF TXT per host. Example merge: `v=spf1 include:amazonses.com include:_spf.mx.cloudflare.net ~all`.

---

### DKIM (DomainKeys Identified Mail)

**What it does:** Cryptographically signs outgoing mail so recipients can verify it wasn't tampered with.

**What you're looking for in the docs:** CNAME records. The provider will show something like:

- **Host:** `provider._domainkey.yourdomain.com` or `selector._domainkey.send.yourdomain.com`
- **Value/Points to:** `provider._domainkey.provider.com`

Add these CNAME records exactly as shown. Each provider uses different selectors.

**Resend:** Add your domain in the Resend dashboard; they show the CNAME records. Typically `resend._domainkey.yourdomain.com` → `resend._domainkey.resend.com`.

---

### DMARC (Domain-based Message Authentication)

**What it does:** Tells recipients what to do with mail that fails SPF/DKIM and sends you aggregate reports.

**How to add:**

- **Type:** TXT
- **Name:** `_dmarc`
- **Content:** `v=DMARC1; p=none; rua=mailto:dmarc-reports@pitchiq.live; pct=100; adkim=r; aspf=r`

Start with `p=none` (monitor only). After a few weeks, you can move to `p=quarantine` or `p=reject`.

---

## 3. Per-user subdomains

**Goal:** Give each managed user their own subdomain (e.g. `user-abc123.pitchiq.live`) for isolation and deliverability.

**Option A — Resend**

- Resend supports custom subdomains per domain.
- When a user opts in:
  1. Create subdomain in your system (e.g. `user-abc123.pitchiq.live`).
  2. Add the domain in Resend (or via API).
  3. Add the CNAME records Resend shows for that subdomain in Cloudflare.
- Store `sending_subdomain` in profiles.

**Option B — Wildcard**

- Some providers support `*.pitchiq.live`. SPF on the root often covers subdomains; DKIM may need per-subdomain setup.
- Check provider docs for wildcard support.

**Automation:** Use Cloudflare API to create CNAME records when a user enables PitchIQ-managed. Store the subdomain in `profiles.sending_subdomain`.

---

## 4. Sending path

**Recommended: Resend**

1. Sign up at [resend.com](https://resend.com).
2. Add domain `pitchiq.live` (or `send.pitchiq.live`) in Resend dashboard.
3. Add the DNS records Resend shows (SPF, DKIM).
4. Get your API key; store as `RESEND_API_KEY` in env.
5. In your send route: when user has PitchIQ-managed, call Resend API instead of user SMTP.

**Flow:** User selects "PitchIQ-managed" → backend provisions subdomain (if doing per-user) or flags as managed → send uses Resend with `from: user@send.pitchiq.live` (or their subdomain).

---

## 5. Inbound / replies

**Goal:** Detect when a host replies so we can mark the sequence complete.

**Cloudflare Email Routing**

1. Cloudflare Dashboard → Email → Email Routing.
2. Create custom addresses, e.g. `reply-*@pitchiq.live` (or `*@reply.pitchiq.live`).
3. Action: Forward to Email Worker or webhook URL.
4. Worker/webhook: parse incoming email, extract pitch ID from address, call your API to update pitch status.

**Resend Inbound**

- Resend Inbound can POST webhooks for incoming mail. Configure webhook URL; parse payload; update pitch/sequence.

**Implementation:** When sending a pitch, set `Reply-To: reply-{pitch_id}@pitchiq.live`. Inbound handler parses `pitch_id`, updates status to "replied", marks sequence complete.

---

## Suggested order

1. Add root domain DNS (step 2); verify in provider dashboard.
2. Test send from `send.pitchiq.live` to confirm delivery.
3. Integrate Resend (step 4) for managed sends.
4. Add per-user subdomains (step 3) if desired; otherwise use shared `send.pitchiq.live` first.
5. Wire inbound (step 5) for reply detection.

---

## Implementation status

PitchIQ-managed is wired into the app:

- **Settings** → Email setup: choose "PitchIQ-managed", add reply-to email.
- **Send route** and **follow-up cron** use Resend when `sending_tier === "managed"`.
- From address: `{Name} <pitches@pitchiq.live>` with Reply-To set to user's email.
- Run `supabase/sending-tier.sql` to add the `sending_tier` column.
