/**
 * Help center articles. Add or edit content here — Cursor can format/implement.
 */

export type HelpArticle = {
  slug: string;
  title: string;
  description: string;
  content: string;
};

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "onboarding",
    title: "Onboarding",
    description: "Complete your profile to get better pitch matches",
    content: `## Onboarding

When you first sign up, you'll go through a short onboarding flow to set up your profile. This info powers Match IQ and your pitch generation.

**What we collect:**
- **Basics:** Name, bio, expertise, target audience
- **Goals & topics:** What you want to achieve, speaking topics
- **Past media:** Podcasts, talks, or interviews you've done
- **Vertical interests:** podcast, media, social, VC — helps us rank which shows fit you best

You can always update these in **Profile** under Settings.`,
  },
  {
    slug: "first-pitch",
    title: "Your first pitch",
    description: "Discover shows, add to target list, generate and send",
    content: `## Your first pitch

**1. Discover podcasts** — Search by topic (e.g. "business", "marketing"). Results are ranked by Match IQ based on your profile.

**2. Add to target list** — Click "Add to list" on shows that fit. You can edit host email later if needed.

**3. Generate pitches** — Go to Pitches → New, select podcasts, click Generate. AI creates personalized cold emails (or we use a template if we have a good match).

**4. Review and send** — Edit if needed, then click Send. Pitches go through your own SMTP (configure in Settings → Email).`,
  },
  {
    slug: "follow-up-setup",
    title: "Follow-up setup",
    description: "Automated AI follow-ups for no-response pitches",
    content: `## Follow-up setup

PitchIQ can send automated follow-up emails to hosts who haven't replied after 7 days.

**How it works:**
- Pitches marked as "no response" after 7 days get an AI-generated follow-up
- Sent through your SMTP (same as main pitches)
- A cron job runs this — you need to configure it

**To enable:**
1. Set \`CRON_SECRET\` in your environment (e.g. Railway)
2. Add a cron job or scheduler that hits \`/api/cron/follow-ups\` with \`Authorization: Bearer YOUR_CRON_SECRET\` (or \`?secret=YOUR_CRON_SECRET\`)
3. Run it daily (e.g. 9am)

See \`docs/CRON-FOLLOW-UPS.md\` for details.`,
  },
  {
    slug: "email-setup",
    title: "Email (SMTP) setup",
    description: "Configure your own SMTP to send pitches",
    content: `## Email (SMTP) setup

PitchIQ sends pitches through **your** email — we don't send on your behalf. You need SMTP credentials.

**Steps:**
1. Pick a provider: Resend, SendGrid, Brevo, Gmail App Password, etc.
2. Get host, port, username, password from their dashboard
3. Use an address from your own domain (e.g. pitches@yourdomain.com) for better deliverability
4. Add SPF/DKIM/DMARC to your domain — use the Domain health check in Settings
5. Save and click "Test it"

**Gmail:** Use an App Password, not your regular password. smtp.gmail.com, port 587.`,
  },
];

export function getArticle(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}
