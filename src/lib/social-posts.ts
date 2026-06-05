import { getCurrentUser } from "@/lib/auth";
import { insforge } from "@/lib/insforge";

export type PostVisibility = "public" | "friends";

export interface AgentPost {
  id: string;
  author_user_id: string;
  body: string;
  visibility: PostVisibility;
  tags: string[];
  media_urls: string[];
  created_at: string;
  updated_at?: string;
  stats: PostStats;
  viewer: PostViewerState;
}

export interface PostStats {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

export interface PostViewerState {
  liked: boolean;
  saved: boolean;
  viewed: boolean;
}

export interface AgentPostComment {
  id: string;
  post_id: string;
  author_user_id: string;
  body: string;
  created_at: string;
}

const EMPTY_STATS: PostStats = {
  views: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  saves: 0,
};

const EMPTY_VIEWER: PostViewerState = {
  liked: false,
  saved: false,
  viewed: false,
};

export async function fetchAgentPosts(limit = 20): Promise<AgentPost[]> {
  const { data, error } = await insforge.database
    .from("agent_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  const posts = ((data ?? []) as Record<string, unknown>[]).map(dbRowToAgentPost);
  const summaries = await fetchPostInteractionSummaries(posts.map((post) => post.id));
  return posts.map((post) => applyInteractionSummary(post, summaries[post.id]));
}

export async function createAgentPost(payload: {
  body: string;
  visibility: PostVisibility;
  mediaUrls?: string[];
  tags?: string[];
}): Promise<AgentPost> {
  const authorUserId = await getWritableUserId();
  const { data, error } = await insforge.database
    .from("agent_posts")
    .insert([
      {
        author_user_id: authorUserId,
        body: payload.body,
        visibility: payload.visibility,
        media_urls: payload.mediaUrls ?? [],
        tags: payload.tags ?? [],
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return dbRowToAgentPost(data as Record<string, unknown>);
}

export async function uploadPostMedia(file: File): Promise<string> {
  const authorUserId = await getWritableUserId();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const objectKey = `${authorUserId}/posts/${Date.now()}-${safeName}`;
  const { error } = await insforge.storage.from("uploads").upload(objectKey, file);

  if (error) throw new Error(error.message);

  const publicUrl = insforge.storage.from("uploads").getPublicUrl(objectKey);
  if (!publicUrl) throw new Error("Unable to create public media URL");
  return publicUrl;
}

async function getWritableUserId() {
  const user = await getCurrentUser();
  if (user?.id) return user.id;

  const anonSubject = getAnonSubject();
  if (anonSubject) return anonSubject;

  throw new Error("Sign in before posting to the feed.");
}

export async function recordPostView(postId: string): Promise<PostStats> {
  const userId = await getWritableUserId();
  const { error } = await insforge.database.from("agent_post_views").insert([
    {
      post_id: postId,
      user_id: userId,
    },
  ]);

  if (error && !isDuplicateError(error.message)) throw new Error(error.message);
  return fetchPostInteractionSummary(postId).then((summary) => summary.stats);
}

export async function togglePostReaction(
  postId: string,
  reaction: "like" | "save",
  active: boolean,
): Promise<PostInteractionSummary> {
  const userId = await getWritableUserId();

  if (active) {
    const { error } = await insforge.database
      .from("agent_post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId)
      .eq("reaction", reaction);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await insforge.database.from("agent_post_reactions").insert([
      {
        post_id: postId,
        user_id: userId,
        reaction,
      },
    ]);
    if (error && !isDuplicateError(error.message)) throw new Error(error.message);
  }

  return fetchPostInteractionSummary(postId);
}

export async function shareAgentPost(postId: string): Promise<PostStats> {
  const userId = await getWritableUserId();
  const { error } = await insforge.database.from("agent_post_shares").insert([
    {
      post_id: postId,
      user_id: userId,
    },
  ]);
  if (error) throw new Error(error.message);
  return fetchPostInteractionSummary(postId).then((summary) => summary.stats);
}

export async function fetchPostComments(postId: string): Promise<AgentPostComment[]> {
  const { data, error } = await insforge.database
    .from("agent_comments")
    .select("id,post_id,author_user_id,body,created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(dbRowToComment);
}

export async function createPostComment(postId: string, body: string): Promise<AgentPostComment> {
  const userId = await getWritableUserId();
  const { data, error } = await insforge.database
    .from("agent_comments")
    .insert([
      {
        post_id: postId,
        author_user_id: userId,
        body,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return dbRowToComment(data as Record<string, unknown>);
}

export interface PostInteractionSummary {
  stats: PostStats;
  viewer: PostViewerState;
}

async function fetchPostInteractionSummary(postId: string): Promise<PostInteractionSummary> {
  const summaries = await fetchPostInteractionSummaries([postId]);
  return (
    summaries[postId] ?? {
      stats: { ...EMPTY_STATS },
      viewer: { ...EMPTY_VIEWER },
    }
  );
}

async function fetchPostInteractionSummaries(
  postIds: string[],
): Promise<Record<string, PostInteractionSummary>> {
  if (postIds.length === 0) return {};

  const viewerId = await getWritableUserId().catch(() => null);
  const [reactions, views, shares, comments] = await Promise.all([
    selectByPostIds("agent_post_reactions", "post_id,user_id,reaction", postIds),
    selectByPostIds("agent_post_views", "post_id,user_id", postIds),
    selectByPostIds("agent_post_shares", "post_id", postIds),
    selectByPostIds("agent_comments", "post_id", postIds),
  ]);

  const summaries = Object.fromEntries(
    postIds.map((postId) => [
      postId,
      {
        stats: { ...EMPTY_STATS },
        viewer: { ...EMPTY_VIEWER },
      },
    ]),
  ) as Record<string, PostInteractionSummary>;

  for (const row of reactions) {
    const postId = row.post_id as string;
    const reaction = row.reaction as string;
    const summary = summaries[postId];
    if (!summary) continue;
    if (reaction === "like") summary.stats.likes += 1;
    if (reaction === "save") summary.stats.saves += 1;
    if (row.user_id === viewerId && reaction === "like") summary.viewer.liked = true;
    if (row.user_id === viewerId && reaction === "save") summary.viewer.saved = true;
  }

  for (const row of views) {
    const summary = summaries[row.post_id as string];
    if (!summary) continue;
    summary.stats.views += 1;
    if (row.user_id === viewerId) summary.viewer.viewed = true;
  }

  for (const row of shares) {
    const summary = summaries[row.post_id as string];
    if (summary) summary.stats.shares += 1;
  }

  for (const row of comments) {
    const summary = summaries[row.post_id as string];
    if (summary) summary.stats.comments += 1;
  }

  return summaries;
}

async function selectByPostIds(table: string, columns: string, postIds: string[]) {
  const { data, error } = await insforge.database
    .from(table)
    .select(columns)
    .in("post_id", postIds);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Record<string, unknown>[];
}

function applyInteractionSummary(post: AgentPost, summary?: PostInteractionSummary): AgentPost {
  return {
    ...post,
    stats: summary?.stats ?? { ...EMPTY_STATS },
    viewer: summary?.viewer ?? { ...EMPTY_VIEWER },
  };
}

function getAnonSubject() {
  const token = import.meta.env.VITE_INSFORGE_ANON_KEY as string | undefined;
  const payload = token?.split(".")[1];
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
    const parsed = JSON.parse(json) as { sub?: string };
    return parsed.sub ?? null;
  } catch {
    return null;
  }
}

function dbRowToAgentPost(row: Record<string, unknown>): AgentPost {
  return {
    id: row.id as string,
    author_user_id: row.author_user_id as string,
    body: (row.body as string) ?? "",
    visibility: ((row.visibility as string) || "public") as PostVisibility,
    tags: (row.tags as string[]) ?? [],
    media_urls: (row.media_urls as string[]) ?? [],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string | undefined,
    stats: { ...EMPTY_STATS },
    viewer: { ...EMPTY_VIEWER },
  };
}

function dbRowToComment(row: Record<string, unknown>): AgentPostComment {
  return {
    id: row.id as string,
    post_id: row.post_id as string,
    author_user_id: row.author_user_id as string,
    body: (row.body as string) ?? "",
    created_at: row.created_at as string,
  };
}

function isDuplicateError(message: string) {
  return message.toLowerCase().includes("duplicate") || message.includes("23505");
}

// True for media URLs that point at a short video (used by the feed + Shorts view).
export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v|ogg|ogv)(\?|#|$)/i.test(url);
}
