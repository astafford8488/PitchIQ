/** Run: node scripts/test-resend.js your@email.com
 * Requires RESEND_API_KEY. Add to .env.local or run:
 *   $env:RESEND_API_KEY="re_xxx"; node scripts/test-resend.js your@email.com
 */
const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split("\n").forEach((line) => {
    const m = line.match(/^RESEND_API_KEY=(.+)/);
    if (m) process.env.RESEND_API_KEY = m[1].trim().replace(/^["']|["']$/g, "");
  });
}
const key = process.env.RESEND_API_KEY;
if (!key) {
  console.error("Set RESEND_API_KEY in .env.local");
  process.exit(1);
}
const to = process.argv[2] || process.env.TEST_EMAIL;
if (!to) {
  console.error("Usage: node scripts/test-resend.js your@email.com");
  process.exit(1);
}

fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: "test@pitchiq.live",
    to,
    subject: "Test from pitchiq.live",
    html: "<p>Test from pitchiq.live</p>",
  }),
})
  .then((r) => r.json())
  .then((d) => console.log(d))
  .catch((e) => console.error(e));
