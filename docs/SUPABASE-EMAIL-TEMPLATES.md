# Supabase email templates (PitchIQ branding)

Auth emails (confirm signup, magic link, reset password, invite, reauth, change email) and security notification emails are customized for PitchIQ: product name, tagline (“AI-powered podcast guest outreach”), and accent color `#e8b86d` in a simple, readable layout.

**Note:** The Supabase MCP/connector does not expose email template management. These templates are applied via the [Supabase Management API](https://supabase.com/docs/guides/auth/auth-email-templates#editing-email-templates).

## Apply the templates

1. **Create an access token** (if you don’t have one):  
   [Supabase Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens)

2. **Run the script** from the repo root:

   ```bash
   # Option A: env vars inline (project ref = your project’s ref from the dashboard URL)
   SUPABASE_ACCESS_TOKEN=your_token SUPABASE_PROJECT_REF=your_project_ref node scripts/update-supabase-email-templates.mjs

   # Option B: use .env.local (script reads NEXT_PUBLIC_SUPABASE_URL for project ref and optionally SUPABASE_ACCESS_TOKEN)
   # Add SUPABASE_ACCESS_TOKEN=... to .env.local, then:
   node scripts/update-supabase-email-templates.mjs
   ```

Templates are stored in `scripts/supabase-email-templates.json`. Edit that file to change copy or styling, then run the script again.

## Templates updated

- **Confirm sign up** – subject and HTML
- **Magic link** – subject and HTML
- **Reset password (recovery)** – subject and HTML
- **Invite user** – subject and HTML
- **Reauthentication** – subject and HTML (OTP code)
- **Change email address** – subject and HTML
- **Security notifications** – password changed, email changed, phone changed, MFA added/removed, identity linked/unlinked (subjects and HTML; notifications remain enabled)
