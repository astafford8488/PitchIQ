/**
 * Hardcoded admin accounts. Set ADMIN_EMAILS and/or ADMIN_USER_IDS in env (comma-separated).
 * Admins get access to /admin dashboard and all Beta features (e.g. VC, Media, Social Collabs before rollout).
 */

function parseEmails(envKey: string): string[] {
  const raw = process.env[envKey];
  if (!raw?.trim()) return [];
  return raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

function parseIds(envKey: string): string[] {
  const raw = process.env[envKey];
  if (!raw?.trim()) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function getAdminEmails(): string[] {
  return parseEmails("ADMIN_EMAILS");
}

export function getAdminUserIds(): string[] {
  return parseIds("ADMIN_USER_IDS");
}

export function isAdmin(user: { id: string; email?: string | null }): boolean {
  const ids = getAdminUserIds();
  const emails = getAdminEmails();
  if (ids.includes(user.id)) return true;
  const email = (user.email ?? "").trim().toLowerCase();
  if (email && emails.includes(email)) return true;
  return false;
}
