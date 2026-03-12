#!/usr/bin/env node
/**
 * Apply PitchIQ-branded email templates to your Supabase project via the Management API.
 *
 * Prerequisites:
 * 1. Create an access token: https://supabase.com/dashboard/account/tokens
 * 2. Set SUPABASE_ACCESS_TOKEN (and optionally SUPABASE_PROJECT_REF or NEXT_PUBLIC_SUPABASE_URL in .env.local)
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=xxx SUPABASE_PROJECT_REF=your-project-ref node scripts/update-supabase-email-templates.mjs
 *   # or run from repo root: reads .env.local for NEXT_PUBLIC_SUPABASE_URL / SUPABASE_ACCESS_TOKEN
 *   node scripts/update-supabase-email-templates.mjs
 */

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) {
      const val = m[2].replace(/^["']|["']$/g, "").trim();
      process.env[m[1]] = val;
    }
  }
}

const token = process.env.SUPABASE_ACCESS_TOKEN;
let projectRef = process.env.SUPABASE_PROJECT_REF;
if (!projectRef && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const u = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    projectRef = u.hostname.replace(".supabase.co", "");
  } catch (_) {}
}

if (!token) {
  console.error("Missing SUPABASE_ACCESS_TOKEN. Create one at https://supabase.com/dashboard/account/tokens");
  process.exit(1);
}
if (!projectRef) {
  console.error("Missing SUPABASE_PROJECT_REF or NEXT_PUBLIC_SUPABASE_URL (to derive project ref).");
  process.exit(1);
}

const payloadPath = join(__dirname, "supabase-email-templates.json");
const payload = JSON.parse(readFileSync(payloadPath, "utf8"));

const url = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
const res = await fetch(url, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

if (!res.ok) {
  const text = await res.text();
  console.error("Management API error:", res.status, text);
  process.exit(1);
}

console.log("PitchIQ email templates updated successfully for project:", projectRef);
