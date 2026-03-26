type LoopsSyncInput = {
  userId: string;
  email: string;
  fullName?: string | null;
  verifiedAt?: string | null;
};

function getLoopsApiKey(): string | null {
  return process.env.LOOPS_API_KEY?.trim() || null;
}

function toFirstName(fullName?: string | null): string | undefined {
  const n = fullName?.trim();
  if (!n) return undefined;
  return n.split(/\s+/)[0];
}

export function isLoopsOnboardingEnabled(): boolean {
  return String(process.env.LOOPS_ONBOARDING_ENABLED ?? "").toLowerCase() === "true";
}

export function getOnboardingProvider(): "internal" | "loops" | "both" {
  const raw = (process.env.ONBOARDING_PROVIDER ?? "internal").trim().toLowerCase();
  if (raw === "loops" || raw === "both" || raw === "internal") return raw;
  return "internal";
}

export async function syncVerifiedUserToLoops(input: LoopsSyncInput): Promise<{ ok: boolean; message?: string }> {
  const apiKey = getLoopsApiKey();
  if (!apiKey) return { ok: false, message: "Missing LOOPS_API_KEY" };

  const listId = process.env.LOOPS_ONBOARDING_LIST_ID?.trim();
  const eventName = process.env.LOOPS_ONBOARDING_EVENT_NAME?.trim() || "pitchiq_onboarding_started";
  const firstName = toFirstName(input.fullName);

  const updateBody: Record<string, unknown> = {
    email: input.email,
    userId: input.userId,
    firstName,
    subscribed: true,
    source: "pitchiq",
    pitchiqUserId: input.userId,
    pitchiqVerifiedAt: input.verifiedAt ?? new Date().toISOString(),
  };
  if (listId) updateBody.mailingLists = { [listId]: true };

  const updateRes = await fetch("https://app.loops.so/api/v1/contacts/update", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateBody),
  });
  if (!updateRes.ok) {
    const text = await updateRes.text().catch(() => "");
    return { ok: false, message: `Loops contact update failed (${updateRes.status}): ${text}` };
  }

  // Best-effort event trigger; keep non-blocking in callers.
  try {
    await fetch("https://app.loops.so/api/v1/events/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventName,
        email: input.email,
        userId: input.userId,
        eventProperties: {
          firstName,
          verifiedAt: input.verifiedAt ?? new Date().toISOString(),
          app: "pitchiq",
        },
      }),
    });
  } catch {
    // ignore
  }

  return { ok: true };
}
