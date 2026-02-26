import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { fillTemplate, type TemplateVars } from "@/lib/pitch-templates";

export const dynamic = "force-dynamic";

const DAILY_CAP = 10;

type PitchResult = { podcast_id: string; subject: string; body: string; template_id?: string };

function buildFallbackPitch(
  p: { id: string; title: string; host_name?: string | null },
  name: string,
  bio: string,
  expertise: string,
  audience: string,
  credentials: string,
  pastAppearances: string
) {
  const parts: string[] = [];
  if (bio) parts.push(bio);
  if (expertise) parts.push(`My expertise: ${expertise}.`);
  if (audience) parts.push(`I typically speak to ${audience}.`);
  if (credentials) parts.push(credentials);
  if (pastAppearances) parts.push(`I've appeared on ${pastAppearances}.`);
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, bio, expertise_topics, target_audience, credentials, linkedin_url, speaking_topics, past_appearances, book_product_links, goals, vertical_interests")
    .eq("id", user.id)
    .single();

  const { data: podcasts } = await supabase.from("podcasts").select("id, title, description, category, host_name, topics").in("id", requestedIds);

  const name = profile?.full_name?.trim() || (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || user.email?.split("@")[0] || "Guest";
  const bio = profile?.bio?.trim() || "";
  const expertise = profile?.expertise_topics?.trim() || "";
  const audience = profile?.target_audience?.trim() || "";
  const credentials = profile?.credentials?.trim() || "";
  const linkedin = profile?.linkedin_url?.trim() || "";
  const speakingTopics = profile?.speaking_topics?.trim() || "";
  const pastAppearances = profile?.past_appearances?.trim() || "";
  const bookProductLinks = profile?.book_product_links?.trim() || "";
  const goals = profile?.goals?.trim() || "";
  const verticalInterests = profile?.vertical_interests?.trim() || "";

  const apiKey = process.env.OPENAI_API_KEY;
  const pitches: PitchResult[] = [];

  const { data: templates } = await supabase
    .from("pitch_templates")
    .select("id, template_subject, template_body, vertical, success_count, usage_count")
    .order("usage_count", { ascending: false });

  const templateVars: TemplateVars = {
    name,
    host_name: "",
    podcast_title: "",
    bio,
    expertise,
    audience,
    credentials,
    past_appearances: pastAppearances,
  };

  function findBestTemplate(podcast: { category?: string | null; host_name?: string | null; title?: string | null }): { id: string; subject: string; body: string } | null {
    const podcastCategory = (podcast.category ?? "").toLowerCase();
    const candidates = (templates ?? [])
      .filter((t) => {
        const v = (t.vertical ?? "").toLowerCase();
        if (!v) return true;
        return (
          verticalInterests.toLowerCase().includes(v) ||
          podcastCategory.includes(v) ||
          v.split(/[,;]/).some((part: string) => podcastCategory.includes(part.trim()))
        );
      })
      .sort((a, b) => {
        const rateA = (a.usage_count ?? 0) > 0 ? (a.success_count ?? 0) / (a.usage_count ?? 1) : 0;
        const rateB = (b.usage_count ?? 0) > 0 ? (b.success_count ?? 0) / (b.usage_count ?? 1) : 0;
        if (Math.abs(rateA - rateB) > 0.1) return rateB - rateA;
        return (b.usage_count ?? 0) - (a.usage_count ?? 0);
      });
    const t = candidates[0];
    if (!t?.template_subject || !t?.template_body) return null;
    const vars: TemplateVars = {
      ...templateVars,
      host_name: podcast.host_name ?? "Host",
      podcast_title: podcast.title ?? "your show",
    };
    return {
      id: t.id,
      subject: fillTemplate(t.template_subject, vars),
      body: fillTemplate(t.template_body, vars),
    };
  }

  if (apiKey && podcasts?.length) {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey });
    for (const p of podcasts) {
      const templ = findBestTemplate(p);
      if (templ) {
        pitches.push({ podcast_id: p.id, subject: templ.subject, body: templ.body, template_id: templ.id });
        continue;
      }
      const guestSection = [
        `Name: ${name}`,
        bio ? `Bio: ${bio}` : null,
        expertise ? `Expertise/topics: ${expertise}` : null,
        audience ? `Target audience: ${audience}` : null,
        credentials ? `Credentials: ${credentials}` : null,
        linkedin ? `LinkedIn: ${linkedin}` : null,
        speakingTopics ? `Speaking topics: ${speakingTopics}` : null,
        pastAppearances ? `Past appearances: ${pastAppearances}` : null,
        bookProductLinks ? `Book/product: ${bookProductLinks}` : null,
        goals ? `Goals: ${goals}` : null,
        verticalInterests ? `Vertical interests: ${verticalInterests}` : null,
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
        pitches.push({ podcast_id: p.id, subject, body } as PitchResult);
      } catch {
        pitches.push(buildFallbackPitch(p, name, bio, expertise, audience, credentials, pastAppearances) as PitchResult);
      }
    }
  } else {
    for (const p of podcasts ?? []) {
      const templ = findBestTemplate(p);
      if (templ) {
        pitches.push({ podcast_id: p.id, subject: templ.subject, body: templ.body, template_id: templ.id });
      } else {
        pitches.push(buildFallbackPitch(p, name, bio, expertise, audience, credentials, pastAppearances) as PitchResult);
      }
    }
  }

  return NextResponse.json({ pitches });
}
