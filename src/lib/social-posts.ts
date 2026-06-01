import { insforge } from "@/lib/insforge";
import { getUser } from "@/lib/store";
import type { SocialPostExtraction } from "@/lib/rtrvr";

export type Platform =
  | "linkedin"
  | "facebook"
  | "twitter"
  | "x"
  | "instagram"
  | "tiktok"
  | "youtube";

export type SocialPost = {
  id: string;
  user_id: string;
  platform: Platform;
  external_post_id: string;
  author_name: string | null;
  author_handle: string | null;
  author_avatar_url: string | null;
  content: string | null;
  post_url: string | null;
  posted_at: string | null;
  likes: number;
  comments: number;
  shares: number;
  reposts: number;
  media_urls: string[];
  fetched_at: string;
};

export type SocialSyncRun = {
  id: string;
  user_id: string;
  platform: Platform;
  status: "running" | "success" | "error";
  post_count: number;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
};

function requireUserId(): string {
  const userId = getUser()?.id;
  if (!userId) throw new Error("Not signed in — go to /auth first");
  return userId;
}

// Top posts for the dashboard, ranked by engagement.
export async function listTopPosts(
  opts: { platform?: Platform; limit?: number } = {},
): Promise<SocialPost[]> {
  const userId = getUser()?.id;
  let q = insforge.database.from("social_posts").select("*");
  if (userId) q = q.eq("user_id", userId);
  if (opts.platform) q = q.eq("platform", opts.platform);
  const { data, error } = await q.order("likes", { ascending: false }).limit(opts.limit ?? 25);
  if (error) throw error;
  return (data ?? []) as SocialPost[];
}

export async function listRecentSyncRuns(platform: Platform, limit = 5): Promise<SocialSyncRun[]> {
  const userId = getUser()?.id;
  let q = insforge.database
    .from("social_sync_runs")
    .select("*")
    .eq("platform", platform)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (userId) q = q.eq("user_id", userId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as SocialSyncRun[];
}

export async function startSyncRun(platform: Platform): Promise<SocialSyncRun> {
  const user_id = requireUserId();
  const { data, error } = await insforge.database
    .from("social_sync_runs")
    .insert([{ user_id, platform, status: "running" }])
    .select()
    .single();
  if (error) throw error;
  return data as SocialSyncRun;
}

export async function finishSyncRun(
  runId: string,
  patch: { status: "success" | "error"; post_count?: number; error_message?: string },
) {
  const { error } = await insforge.database
    .from("social_sync_runs")
    .update({
      status: patch.status,
      post_count: patch.post_count ?? 0,
      error_message: patch.error_message ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId);
  if (error) throw error;
}

export async function upsertExtractedPosts(
  platform: Platform,
  posts: SocialPostExtraction[],
): Promise<number> {
  if (posts.length === 0) return 0;
  const user_id = requireUserId();
  const rows = posts
    .filter((p) => p.external_post_id)
    .map((p) => ({
      user_id,
      platform,
      external_post_id: p.external_post_id,
      author_name: p.author_name ?? null,
      author_handle: p.author_handle ?? null,
      author_avatar_url: p.author_avatar_url ?? null,
      content: p.content ?? null,
      post_url: p.post_url ?? null,
      posted_at: p.posted_at ?? null,
      likes: p.likes ?? 0,
      comments: p.comments ?? 0,
      shares: p.shares ?? 0,
      reposts: p.reposts ?? 0,
      media_urls: p.media_urls ?? [],
      raw: p,
      fetched_at: new Date().toISOString(),
    }));

  const { error } = await insforge.database
    .from("social_posts")
    .upsert(rows, { onConflict: "user_id,platform,external_post_id" });
  if (error) throw error;
  return rows.length;
}
