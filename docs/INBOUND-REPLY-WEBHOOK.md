# Inbound reply webhook

When a podcast host replies to a pitch, you can POST to this endpoint to mark the pitch as "interested" and stop follow-ups.

## Endpoint

`POST /api/webhooks/inbound-reply`

## Auth

Set in Railway (or env): `INBOUND_REPLY_SECRET` (any random string).

- **Header:** `Authorization: Bearer YOUR_SECRET` or `X-Inbound-Secret: YOUR_SECRET`

## Option A: Reply-To so replies hit the Worker

In **Railway** (or env), set **`INBOUND_REPLY_ADDRESS`** = `replies@pitchiq.live`. The app will send pitch emails with **Reply-To: replies+&lt;pitch_id&gt;@pitchiq.live**. When a host replies, the message goes to that address; the Worker receives it and POSTs to the webhook; the webhook parses the pitch id from the address and marks that pitch as interested.

## Payload

**JSON body:**
```json
{ "from": "host@podcast.com", "to": "you@yourcompany.com" }
```

- `from` = reply sender (podcast host email)
- `to` = reply recipient (your From/Reply-To in Settings)

Or use headers: `Email-From`, `Email-To` (e.g. from a Cloudflare Email Worker).

## Behavior

- If **to** is `replies+<pitch_id>@...` (Option A), the pitch with that id is set to `interested`.
- Otherwise: finds the user whose `profiles.from_email` matches `to`, the podcast whose `host_email` matches `from`, and the most recent sent pitch with status `no_response` for that user+podcast, then sets that pitch to `interested`.

Response: `{ "ok": true, "matched": true, "pitch_id": "...", "status": "interested" }` or `matched: false` if no pitch matched.

## Wiring from Cloudflare Email Workers

In your Email Worker, when you receive an inbound email, forward to the webhook. Use the **envelope** recipient for `Email-To` when possible so Option A works (replies go to `replies+<pitch_id>@...`):

```js
export default {
  async email(message, env, ctx) {
    const to = message.to ?? message.headers?.get?.("to") ?? "";
    await fetch("https://pitchiq.live/api/webhooks/inbound-reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.INBOUND_REPLY_SECRET}`,
        "Email-From": message.from,
        "Email-To": to,
      },
    });
  },
  async fetch(request, env, ctx) {
    return new Response("OK", { status: 200 });
  },
};
```

(Store `INBOUND_REPLY_SECRET` in the Worker’s env and use the same value in Railway.) The webhook accepts `To` in `"Name <replies+uuid@domain>"` form and will extract the address.

## Test

```bash
curl -X POST https://pitchiq.live/api/webhooks/inbound-reply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_INBOUND_REPLY_SECRET" \
  -d '{"from":"host@example.com","to":"you@yourcompany.com"}'
```

Expect `200` and `{"ok":true,"matched":false,...}` unless you have a matching pitch.

## Troubleshooting

- **Reply not marking “interested”:** Ensure the Worker sends the actual recipient address as `Email-To` (e.g. `replies+<pitch_id>@pitchiq.live`). If your provider only sends a display form like `"PitchIQ" <replies+...>`, the app now strips the angle-bracket part. Redeploy the app so the webhook has the fix.
- **Sent pitches not in Pitches tab:** Use the same app URL (e.g. pitchiq.live) and account you used to send. If you sent from the deployed app but view on localhost (or vice versa), different Supabase envs can show different data. Confirm the send request returned 200 (e.g. Network tab).
