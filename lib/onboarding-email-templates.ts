export type OnboardingTemplateKey = "welcome" | "setup_smtp" | "first_pitch" | "follow_up";

export const ONBOARDING_TEMPLATE_KEYS: OnboardingTemplateKey[] = [
  "welcome",
  "setup_smtp",
  "first_pitch",
  "follow_up",
];

export function getAppUrlFromEnv() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.RAILWAY_PUBLIC_DOMAIN?.trim()?.replace(/^/, "https://") ||
    "http://localhost:3001"
  );
}

function heroImageHtml(templateKey: OnboardingTemplateKey) {
  const commonStyle =
    'style="max-width:100%;height:auto;border-radius:12px;display:block;margin:0 0 16px"';
  const generic = process.env.ONBOARDING_EMAIL_IMAGE_URL?.trim();
  const perTemplate =
    (templateKey === "welcome" && process.env.ONBOARDING_EMAIL_IMAGE_WELCOME?.trim()) ||
    (templateKey === "setup_smtp" && process.env.ONBOARDING_EMAIL_IMAGE_SETUP_SMTP?.trim()) ||
    (templateKey === "first_pitch" && process.env.ONBOARDING_EMAIL_IMAGE_FIRST_PITCH?.trim()) ||
    (templateKey === "follow_up" && process.env.ONBOARDING_EMAIL_IMAGE_FOLLOW_UP?.trim());
  const src = perTemplate || generic;
  if (!src) return "";
  return `<img src="${src}" alt="PitchIQ onboarding" ${commonStyle} />`;
}

export function renderOnboardingTemplate(
  templateKey: OnboardingTemplateKey,
  fullName: string | null,
  appUrl: string
) {
  const firstName = fullName?.trim()?.split(/\s+/)[0] ?? "there";
  const settingsUrl = `${appUrl}/settings`;
  const onboardingUrl = `${appUrl}/onboarding`;
  const pitchesUrl = `${appUrl}/pitches`;
  const hero = heroImageHtml(templateKey);

  const footer = `
    <p style="margin:24px 0 0;color:#666;font-size:13px;line-height:1.5">
      You're receiving this onboarding sequence because you created a PitchIQ account.
      You can manage email preferences in <a href="${settingsUrl}" style="color:#e8b86d">Settings</a>.
    </p>
  `;

  if (templateKey === "welcome") {
    return {
      subject: "Welcome to PitchIQ - your first wins this week",
      html: `
        ${hero}
        <p>Hey ${firstName},</p>
        <p>Welcome to PitchIQ. You can land your first podcast outreach this week with a simple flow:</p>
        <ol>
          <li>Complete your profile</li>
          <li>Find podcasts in your niche</li>
          <li>Generate and send your first pitch</li>
        </ol>
        <p><a href="${onboardingUrl}" style="color:#e8b86d">Start onboarding</a></p>
        ${footer}
      `,
    };
  }
  if (templateKey === "setup_smtp") {
    return {
      subject: "Set up sending in 2 minutes",
      html: `
        ${hero}
        <p>Hey ${firstName},</p>
        <p>Your next unlock is email sending. Add SMTP in settings so pitches can go out from your own address.</p>
        <p><a href="${settingsUrl}" style="color:#e8b86d">Open Email Settings</a></p>
        ${footer}
      `,
    };
  }
  if (templateKey === "first_pitch") {
    return {
      subject: "Ready for your first pitch?",
      html: `
        ${hero}
        <p>Hey ${firstName},</p>
        <p>Pick 3 relevant shows, generate drafts, and send one today. Momentum beats perfection.</p>
        <p><a href="${pitchesUrl}" style="color:#e8b86d">Open Pitches</a></p>
        ${footer}
      `,
    };
  }
  return {
    subject: "Quick check-in from PitchIQ",
    html: `
      ${hero}
      <p>Hey ${firstName},</p>
      <p>If you want, reply and share your niche - we can suggest a better first outreach angle.</p>
      <p><a href="${onboardingUrl}" style="color:#e8b86d">Continue onboarding</a></p>
      ${footer}
    `,
  };
}
