/**
 * Pitch template engine: match templates by vertical, substitute placeholders.
 */

export type TemplateVars = {
  name: string;
  host_name: string;
  podcast_title: string;
  bio: string;
  expertise: string;
  audience: string;
  credentials: string;
  past_appearances: string;
};

const PLACEHOLDERS: (keyof TemplateVars)[] = [
  "name",
  "host_name",
  "podcast_title",
  "bio",
  "expertise",
  "audience",
  "credentials",
  "past_appearances",
];

export function fillTemplate(template: string, vars: TemplateVars): string {
  let out = template;
  for (const key of PLACEHOLDERS) {
    const val = vars[key] ?? "";
    out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, "gi"), val);
  }
  return out;
}

export function matchTemplatesByVertical(
  verticalInterests: string,
  templateVerticals: (string | null)[]
): number {
  if (!verticalInterests?.trim()) return 0;
  const userVerticals = verticalInterests
    .toLowerCase()
    .split(/[,;]/)
    .map((v) => v.trim())
    .filter(Boolean);
  for (const tv of templateVerticals) {
    const v = (tv ?? "").toLowerCase().trim();
    if (userVerticals.some((u) => v.includes(u) || u.includes(v))) return 1;
  }
  return 0;
}
