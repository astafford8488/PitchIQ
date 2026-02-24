export type Podcast = {
  id: string;
  title: string;
  description: string | null;
  website_url: string | null;
  rss_feed_url: string | null;
  cover_image_url: string | null;
  category: string | null;
  topics: string[] | null;
  host_name: string | null;
  host_email: string | null;
  contact_url: string | null;
  listener_tier: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  bio: string | null;
  expertise_topics: string | null;
  target_audience: string | null;
  credentials: string | null;
  created_at: string;
  updated_at: string;
};

export type TargetListItem = {
  id: string;
  user_id: string;
  podcast_id: string;
  created_at: string;
  podcasts?: Podcast | null;
};

export type PitchStatus = "pending" | "interested" | "declined" | "booked" | "no_response";

export type Pitch = {
  id: string;
  user_id: string;
  podcast_id: string;
  subject: string | null;
  body: string | null;
  sent_at: string | null;
  status: PitchStatus;
  created_at: string;
  updated_at: string;
  podcasts?: Podcast | null;
};
