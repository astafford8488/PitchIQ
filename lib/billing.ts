/** Pitch limits per billing tier (per month). */
export const TIER_LIMITS: Record<string, number> = {
  free: 10,
  starter: 50,
  growth: 300,
};

export function getPitchLimit(tier: string | null | undefined): number {
  return TIER_LIMITS[tier ?? "free"] ?? TIER_LIMITS.free;
}

/** Returns { used, limit, remaining, nearLimit } for the current month. */
export function getUsageStats(used: number, tier: string | null | undefined) {
  const limit = getPitchLimit(tier);
  const remaining = Math.max(0, limit - used);
  const nearLimit = limit > 0 && used >= Math.floor(limit * 0.8);
  return { used, limit, remaining, nearLimit };
}
