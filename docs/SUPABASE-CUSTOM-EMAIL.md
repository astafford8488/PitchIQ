# Supabase custom email (Auth SMTP)

Use this to send **Supabase Auth emails** (signup confirmation, password reset, magic links) through your own SMTP instead of Supabase’s default server.

**Default Supabase email limits:** 2 emails/hour, only to project team member addresses. For real users you need custom SMTP.

---

## 1. Get SMTP credentials

Pick a provider and get:

- **Host** (e.g. `smtp.sendgrid.net`)
- **Port** (often 587 or 465)
- **Username**
- **Password** (or app password)
- **From address** (e.g. `no-reply@yourdomain.com`)

**Providers that work well:**

- [Resend](https://resend.com/docs/send-with-supabase-smtp) (has Supabase guide)
- [Brevo](https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP)
- [SendGrid](https://www.twilio.com/docs/sendgrid/for-developers/sending-email/getting-started-smtp)
- [Postmark](https://postmarkapp.com/developer/user-guide/send-email-with-smtp)
- [AWS SES](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html)
- [ZeptoMail](https://www.zoho.com/zeptomail/help/smtp-home.html)

---

## 2. Configure in Supabase Dashboard

1. Open your project: **Supabase Dashboard** → your project.
2. Go to **Authentication** → **SMTP Settings**  
   Direct link: `https://supabase.com/dashboard/project/<YOUR_PROJECT_REF>/auth/smtp`
3. Turn **Enable Custom SMTP** on.
4. Fill in:
   - **Sender email:** e.g. `no-reply@yourdomain.com`
   - **Sender name:** e.g. `PitchIQ` or `Your App Name`
   - **Host:** your SMTP host
   - **Port:** 587 (TLS) or 465 (SSL), or as your provider says
   - **Username:** SMTP username
   - **Password:** SMTP password or app password
5. Save.

After saving, Auth will send confirmation and password-reset emails through your SMTP. Rate limit starts at 30 emails/hour; you can change it under **Authentication** → **Rate Limits**.

---

## 3. (Optional) Customize email templates

1. In the Dashboard go to **Authentication** → **Email Templates**.
2. Edit:
   - **Confirm signup**
   - **Magic Link**
   - **Change Email Address**
   - **Reset Password**
3. You can change subject and body; use the variables Supabase shows (e.g. `{{ .ConfirmationURL }}`, `{{ .Token }}`) so links still work.

---

## 4. (Optional) Configure via Management API

If you prefer config as code or automation:

1. Get an access token: [Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens).
2. Get your project ref from the project URL: `https://supabase.com/dashboard/project/<PROJECT_REF>`.
3. Call the config API:

```bash
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_email_enabled": true,
    "smtp_admin_email": "no-reply@yourdomain.com",
    "smtp_sender_name": "PitchIQ",
    "smtp_host": "smtp.example.com",
    "smtp_port": 587,
    "smtp_user": "your-smtp-user",
    "smtp_pass": "your-smtp-password"
  }'
```

---

## 5. Troubleshooting: “Error sending the email” on signup

When new signups see “error sending the email”, Supabase Auth is failing to send the confirmation email through your custom SMTP. Check the following.

**Sender email must be allowed by your provider**
- **Gmail / Google Workspace:** The “Sender email” in Supabase must be the same Gmail address (or an alias) you use for the SMTP username. You must use an [App Password](https://support.google.com/accounts/answer/185833), not your normal password. Host: `smtp.gmail.com`, Port: 587.
- **SendGrid, Resend, Brevo, etc.:** The sender must be a verified domain or single sender in that provider’s dashboard. If you use `no-reply@yourdomain.com`, that domain (or address) must be verified first.

**Host, port, and security**
- Use the **exact** host and port from your provider (e.g. Resend: `smtp.resend.com` port 465 or 587; SendGrid: `smtp.sendgrid.net` port 587).
- If 587 fails, try 465 (SSL). Some providers require “Use TLS” or “Use SSL” to match the port.

**Username and password**
- **Username** is often your full email or an API-key style user (e.g. `apikey` for SendGrid with an API key as password). Check the provider’s SMTP docs.
- **Password:** no extra spaces; for Gmail use an App Password, for others use the SMTP password or API key they give you.

**See the real error (optional)**
- In Supabase Dashboard go to **Authentication** → **Logs** (or **Logs** in the sidebar). After a failed signup, look for a log entry that shows the SMTP or email error message. That will say whether it’s auth failure, “sender not verified”, or something else.

**Temporarily turn off “Confirm email” (only for testing)**
- **Authentication** → **Providers** → **Email** → turn off “Confirm email”. Then signups won’t send an email and won’t hit SMTP. Turn it back on once SMTP is working.

---

## 6. Test

1. Sign up with an email that is **not** in your Supabase project team.
2. Check that the confirmation email arrives from your “From” address and that the link works.
3. Use **Reset password** and confirm that email also goes through your SMTP.

---

## 7. Good practices (from Supabase docs)

- Use a **dedicated From address** for auth (e.g. `no-reply@auth.yourdomain.com`), not your main or marketing address.
- Set up **SPF, DKIM, DMARC** for the sending domain with your provider to improve deliverability.
- Consider a **custom auth domain** (Supabase docs: Custom Domains) so auth links use your domain.
- Keep auth emails **plain and short** (no marketing, few links) to avoid spam filters.
- For production, consider **CAPTCHA** on signup to reduce abuse and protect your SMTP reputation.

---

## Reference

- [Supabase: Send emails with custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase: Email templates](https://supabase.com/dashboard/project/_/auth/templates)
- [Supabase: Auth rate limits](https://supabase.com/dashboard/project/_/auth/rate-limits)
