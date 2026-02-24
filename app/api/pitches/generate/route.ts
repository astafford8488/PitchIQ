import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const DAILY_CAP = 10;

function buildFallbackPitch(
  p: { id: string; title: string; host_name?: string | null },
  name: string,
  bio: string,
  expertise: string,
  audience: string,
  credentials: string
) {
  const parts: string[] = [];
  if (bio) parts.push(bio);
  if (expertise) parts.push(`My expertise: ${expertise}.`);
  if (audience) parts.push(`I typically speak to ${audience}.`);
  if (credentials) parts.push(credentials);
  const bodyText = parts.length > 0 ? parts.join(" ") : "I have relevant experience and think I could add value for your audience.";
  const greeting = p.host_name ? `Hi, ${p.host_name},` : "Hi,";
  const body = `${greeting}\n\nI'd love to be a guest on ${p.title}. ${bodyText}\n\nBest,\n${name}`;
  return { podcast_id: p.id, subject: `Guest pitch for ${p.title}`, body };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { podcast_ids } = await request.json();
  if (!Array.isArray(podcast_ids) || podcast_ids.length === 0) {
    return NextResponse.json({ error: "podcast_ids array required" }, { status: 400 });
  }
  if (podcast_ids.length > DAILY_CAP) {
    return NextResponse.json({ error: `Max ${DAILY_CAP} pitches per request (hackathon cap)` }, { status: 400 });
  }

  // Only allow generating for podcasts in the user's target list (prevents abuse / quota burn)
  const { data: targetRows } = await supabase.from("target_list").select("podcast_id").eq("user_id", user.id);
  const allowedPodcastIds = new Set((targetRows ?? []).map((r) => r.podcast_id));
  const requestedIds = podcast_ids.filter((id: string) => allowedPodcastIds.has(id));
  if (requestedIds.length === 0) {
    return NextResponse.json({ error: "None of the selected podcasts are in your target list" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase.from("pitches").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", `${today}T00:00:00Z`);
  if ((count ?? 0) >= DAILY_CAP) {
    return NextResponse.json({ error: `Daily limit of ${DAILY_CAP} pitches reached` }, { status: 429 });
  }

  const { data: profile } = await supabase.from("profiles").select("full_name, bio, expertise_topics, target_audience, credentials").eq("id", user.id).single();

  const { data: podcasts } = await supabase.from("podcasts").select("id, title, description, category, host_name, topics").in("id", requestedIds);

  const name = profile?.full_name?.trim() || (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || user.email?.split("@")[0] || "Guest";
  const bio = profile?.bio?.trim() || "";
  const expertise = profile?.expertise_topics?.trim() || "";
  const audience = profile?.target_audience?.trim() || "";
  const credentials = profile?.credentials?.trim() || "";

  const apiKey = process.env.OPENAI_API_KEY;
  const pitches: { podcast_id: string; subject: string; body: string }[] = [];

  if (apiKey && podcasts?.length) {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey });
    for (const p of podcasts) {
      const guestSection = [
        `Name: ${name}`,
        bio ? `Bio: ${bio}` : null,
        expertise ? `Expertise/topics: ${expertise}` : null,
        audience ? `Target audience: ${audience}` : null,
        credentials ? `Credentials (books, awards, past appearances): ${credentials}` : null,
      ].filter(Boolean).join("\n");
      const prompt = `You are writing a short email pitch that a podcast guest will send to a podcast host. CRITICAL RULES:
1. The entire body must be in first person only: use "I", "me", "my", "I've", "I'd" etc. Never use the guest's name or third person (he/she/they) in the body—so no "Peter would be great" or "He has written"; write "I would love to be on the show" and "I've written" instead.
2. End the email with exactly: "Best," followed by a newline, then "${name}". Do not use "[Your Name]" or any placeholder—use the real name from the profile above: "${name}".
3. Start the email body with "Hi, [host name]," on the first line—use the host's name from PODCAST below (e.g. "Hi, Guy,"). If no host name is given, use "Hi,".
Keep it under 150 words. Use details from the guest profile so the pitch feels specific.

GUEST PROFILE:
${guestSection || "No additional profile details provided."}

PODCAST: ${p.title}
Description: ${p.description ?? "N/A"}
Category: ${p.category ?? "N/A"}
Host: ${p.host_name ?? "Host"}
Topics: ${(p.topics ?? []).join(", ") || "N/A"}

Write the pitch in first person only. Output ONLY: first line "SUBJECT: ..." then a blank line then the email body. The body must start with "Hi, [host name]," (or "Hi," if no host) and end with "Best,\\n${name}". No other text.`;
      try {
        const comp = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 400,
        });
        const text = comp.choices[0]?.message?.content?.trim() ?? "";
        const subjectMatch = text.match(/SUBJECT:\s*(.+?)(?:\n|$)/i);
        const subject = subjectMatch ? subjectMatch[1].trim() : "Podcast guest pitch";
        let body = text.replace(/SUBJECT:.*?\n+/i, "").trim();
        // Ensure sign-off uses actual guest name, not "[Your Name]" or similar
        body = body.replace(/\n\s*Best,\s*\n\s*\[?Your Name\]?\s*$/i, `\n\nBest,\n${name}`);
        if (/\[?\s*Your\s+Name\s*\]?/i.test(body)) body = body.replace(/\[?\s*Your\s+Name\s*\]?/gi, name);
        pitches.push({ podcast_id: p.id, subject, body });
      } catch {
        // Never expose OpenAI errors or key; fall back to template
        pitches.push(buildFallbackPitch(p, name, bio, expertise, audience, credentials));
      }
    }
  } else {
    for (const p of podcasts ?? []) {
      pitches.push(buildFallbackPitch(p, name, bio, expertise, audience, credentials));
    }
  }

  return NextResponse.json({ pitches });
}
