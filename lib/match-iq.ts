/**
 * Match IQ scoring: ranks podcasts by fit with guest profile.
 * Weights: topic relevance 40%, audience size 25%, recency 20%, guest interviews 15%.
 */

export type LNPodcast = {
  id: string;
  title_original?: string;
  description_original?: string;
  genre_ids?: number[];
  listen_score?: number | null;
  listen_score_global_rank?: number | null;
  latest_pub_date_ms?: number | null;
  total_episodes?: number | null;
  update_frequency_hours?: number | null;
  has_guest_interviews?: boolean | null;
  [k: string]: unknown;
};

export type ProfileForScoring = {
  expertise_topics?: string | null;
  speaking_topics?: string | null;
  target_audience?: string | null;
  goals?: string | null;
  vertical_interests?: string | null;
};

export type MatchResult = {
  score: number;
  reasoning: string[];
};

const TOPIC_WEIGHT = 0.4;
const AUDIENCE_WEIGHT = 0.25;
const RECENCY_WEIGHT = 0.2;
const GUEST_INTERVIEW_WEIGHT = 0.15;

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function topicScore(profile: ProfileForScoring, podcast: LNPodcast): { score: number; reasons: string[] } {
  const profileText = [
    profile.expertise_topics,
    profile.speaking_topics,
    profile.target_audience,
    profile.goals,
  ]
    .filter(Boolean)
    .join(" ");
  const podcastText = [podcast.title_original, podcast.description_original].filter(Boolean).join(" ");
  const reasons: string[] = [];

  if (!profileText.trim() || !podcastText.trim()) {
    return { score: 0.5, reasons: ["No topic data to compare"] };
  }

  const profileTokens = new Set(tokenize(profileText));
  const podcastTokens = tokenize(podcastText);
  let matches = 0;
  const matched: string[] = [];
  for (const t of podcastTokens) {
    if (profileTokens.has(t)) {
      matches++;
      if (matched.length < 3) matched.push(t);
    }
  }
  const overlap = profileTokens.size > 0 ? matches / Math.max(profileTokens.size, podcastTokens.length) : 0;
  const score = Math.min(1, overlap * 3); // scale up for reasonable scores
  if (matched.length > 0) {
    reasons.push(`Topic overlap: ${matched.join(", ")}`);
  }
  return { score: Math.max(0.1, score), reasons };
}

function audienceScore(_podcast: LNPodcast): { score: number; reasons: string[] } {
  return { score: 0.5, reasons: [] };
}

function recencyScore(podcast: LNPodcast): { score: number; reasons: string[] } {
  const ms = podcast.latest_pub_date_ms;
  const reasons: string[] = [];
  if (ms != null) {
    const daysAgo = (Date.now() - ms) / (24 * 60 * 60 * 1000);
    const decay = Math.exp(-daysAgo / 90);
    reasons.push(`Last episode: ${Math.round(daysAgo)}d ago`);
    return { score: decay, reasons };
  }
  return { score: 0.5, reasons: ["Recency unknown"] };
}

function guestInterviewScore(podcast: LNPodcast): { score: number; reasons: string[] } {
  const has = podcast.has_guest_interviews;
  const reasons: string[] = [];
  if (has === true) {
    reasons.push("Hosts guest interviews");
    return { score: 1, reasons };
  }
  if (has === false) {
    reasons.push("May not regularly book guests");
    return { score: 0.4, reasons };
  }
  return { score: 0.7, reasons: ["Guest format unknown"] };
}

export function computeMatchIQ(profile: ProfileForScoring, podcast: LNPodcast): MatchResult {
  const topic = topicScore(profile, podcast);
  const audience = audienceScore(podcast);
  const recency = recencyScore(podcast);
  const guest = guestInterviewScore(podcast);

  const score =
    topic.score * TOPIC_WEIGHT +
    audience.score * AUDIENCE_WEIGHT +
    recency.score * RECENCY_WEIGHT +
    guest.score * GUEST_INTERVIEW_WEIGHT;

  const reasoning = [...topic.reasons, ...audience.reasons, ...recency.reasons, ...guest.reasons];

  return {
    score: Math.round(score * 100),
    reasoning: reasoning.slice(0, 5),
  };
}
