const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O, 1/I

export function generateAffiliateCode(length = 8): string {
  let s = "";
  for (let i = 0; i < length; i++) {
    s += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return s;
}
