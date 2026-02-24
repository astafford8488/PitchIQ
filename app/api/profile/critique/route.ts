import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, bio, expertise_topics, target_audience, credentials")
    .eq("id", user.id)
    .single();

  const name = profile?.full_name?.trim() || "Not set";
  const bio = profile?.bio?.trim() || "";
  const expertise = profile?.expertise_topics?.trim() || "";
  const audience = profile?.target_audience?.trim() || "";
  const credentials = profile?.credentials?.trim() || "";

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI feedback is not configured. Add OPENAI_API_KEY to enable." },
      { status: 503 }
    );
  }

  const profileBlock = [
    `Name: ${name}`,
    bio ? `Bio: ${bio}` : null,
    expertise ? `Expertise/topics: ${expertise}` : null,
    audience ? `Target audience: ${audience}` : null,
    credentials ? `Credentials (books, awards, past appearances): ${credentials}` : null,
  ].filter(Boolean).join("\n");

  const prompt = `You are an expert at helping people get booked on podcasts. Review this podcast guest profile (used to generate cold pitch emails to hosts) and give a short, actionable critique and advice.

PROFILE:
${profileBlock || "(Profile is mostly empty.)"}

Respond with:
1. What’s working well (1–2 sentences).
2. Concrete improvements (bullet points): what to add, clarify, or tighten to make pitches more compelling. For each improvement, include a brief example showing how to do it (e.g. "Instead of X, try: Y" or "Example: [sample sentence they could use]").
3. One specific tip to stand out in the first line of a pitch, with an example first line they could use.

Keep the total response under 300 words. Be direct and practical. Every piece of advice should include a concrete example.`;

  try {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey });
    const comp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
    });
    const critique = comp.choices[0]?.message?.content?.trim() ?? "No feedback generated.";
    return NextResponse.json({ critique });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to get feedback";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
