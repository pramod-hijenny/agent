import { useEffect, useRef, useState } from "react";
import { useUser } from "@/lib/store";
import { GradientAvatar } from "@/components/Avatar";
import { AiBadge } from "@/components/AiBadge";
import { ShortsStrip } from "@/components/ShortsStrip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createAgentPost,
  createPostComment,
  fetchAgentPosts,
  fetchPostComments,
  isVideoUrl,
  recordPostView,
  shareAgentPost,
  togglePostReaction,
  uploadPostMedia,
  type AgentPost,
  type AgentPostComment,
} from "@/lib/social-posts";
import { fetchAllProfiles } from "@/lib/auth";
import {
  Eye,
  Heart,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Send,
  Share2,
  Video,
} from "lucide-react";
import { toast } from "sonner";

export function Home() {
  const user = useUser();
  const [posts, setPosts] = useState<AgentPost[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [comments, setComments] = useState<Record<string, AgentPostComment[]>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const viewed = useRef(new Set<string>());

  async function load() {
    setLoading(true);
    try {
      const [p, profiles] = await Promise.all([
        fetchAgentPosts(),
        fetchAllProfiles().catch(() => []),
      ]);
      setPosts(p);
      const map: Record<string, string> = {};
      for (const pr of profiles) if (pr.user_id) map[pr.user_id] = pr.full_name || "Member";
      setNames(map);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load the feed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [user?.id]);

  useEffect(() => {
    for (const post of posts) {
      if (viewed.current.has(post.id) || post.viewer.viewed) continue;
      viewed.current.add(post.id);
      void recordPostView(post.id)
        .then((stats) => patch(post.id, { stats }))
        .catch(() => viewed.current.delete(post.id));
    }
  }, [posts]);

  if (!user) return null;

  function patch(id: string, p: Partial<AgentPost>) {
    setPosts((ps) => ps.map((x) => (x.id === id ? { ...x, ...p } : x)));
  }

  function authorName(id: string) {
    return names[id] || (id === (user?.user_id || user?.id) ? user?.full_name : "") || "Member";
  }

  async function submitPost() {
    if (!body.trim() && !file) return;
    setPosting(true);
    try {
      const mediaUrls = file ? [await uploadPostMedia(file)] : [];
      const post = await createAgentPost({ body: body.trim(), visibility: "public", mediaUrls });
      setPosts((ps) => [post, ...ps]);
      setBody("");
      setFile(null);
      toast.success("Posted to the feed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not post");
    } finally {
      setPosting(false);
    }
  }

  function pickFile(accept: string) {
    if (fileRef.current) {
      fileRef.current.accept = accept;
      fileRef.current.click();
    }
  }

  async function like(post: AgentPost) {
    try {
      const s = await togglePostReaction(post.id, "like", post.viewer.liked);
      patch(post.id, { stats: s.stats, viewer: s.viewer });
    } catch {
      toast.error("Could not react");
    }
  }

  async function share(post: AgentPost) {
    try {
      const stats = await shareAgentPost(post.id);
      patch(post.id, { stats });
      toast.success("Shared");
    } catch {
      toast.error("Could not share");
    }
  }

  async function toggleComments(post: AgentPost) {
    const open = !openComments[post.id];
    setOpenComments((o) => ({ ...o, [post.id]: open }));
    if (open && !comments[post.id]) {
      try {
        const c = await fetchPostComments(post.id);
        setComments((m) => ({ ...m, [post.id]: c }));
      } catch {
        /* ignore */
      }
    }
  }

  async function submitComment(post: AgentPost) {
    const text = (commentDraft[post.id] || "").trim();
    if (!text) return;
    try {
      const c = await createPostComment(post.id, text);
      setComments((m) => ({ ...m, [post.id]: [...(m[post.id] || []), c] }));
      setCommentDraft((d) => ({ ...d, [post.id]: "" }));
      patch(post.id, { stats: { ...post.stats, comments: post.stats.comments + 1 } });
    } catch {
      toast.error("Could not comment");
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <section className="app-hero relative overflow-hidden rounded-[1.45rem] p-5 text-white shadow-[0_24px_70px_oklch(0.18_0.035_80_/_0.28)]">
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgb(0_0_0_/_0.92),rgb(0_0_0_/_0.72)_56%,rgb(247_184_1_/_0.32))]" />
        <div className="relative">
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">Community feed</h1>
          <p className="mt-1 text-sm font-semibold text-white/70">
            Posts from agents in your network.
          </p>
        </div>
      </section>

      {/* Facebook-style stories / shorts row on top of the feed */}
      <ShortsStrip meUserId={user.user_id || user.id} onCreateClip={() => pickFile("video/*")} />

      {/* Composer */}
      <div className="app-card rounded-[1.35rem] p-4">
        <div className="flex items-start gap-3">
          <GradientAvatar name={user.full_name} colorClass={user.avatar_color} size="sm" />
          <div className="flex-1">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={2}
              placeholder="Share an update, a win, or a short clip..."
              className="app-field w-full resize-none rounded-[1rem] p-3 text-sm font-semibold leading-6 text-black outline-none placeholder:text-[var(--app-placeholder)]"
            />
            {file && (
              <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#fff4c8] px-3 py-1 text-xs font-bold text-black">
                {file.type.startsWith("video/") ? (
                  <Video className="h-3.5 w-3.5" />
                ) : (
                  <ImageIcon className="h-3.5 w-3.5" />
                )}
                {file.name}
                <button onClick={() => setFile(null)} className="text-rose-600">
                  remove
                </button>
              </p>
            )}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => pickFile("image/*")}
                  className="app-icon-button inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold"
                >
                  <ImageIcon className="h-4 w-4" /> Photo
                </button>
                <button
                  onClick={() => pickFile("video/*")}
                  className="app-icon-button inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold"
                >
                  <Video className="h-4 w-4" /> Clip
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <Button
                onClick={() => void submitPost()}
                disabled={posting || (!body.trim() && !file)}
                className="rounded-full bg-black font-black text-[#f7b801] hover:bg-black/90"
              >
                {posting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}{" "}
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="app-card flex items-center gap-2 rounded-[1.35rem] p-6 text-sm font-semibold text-[var(--app-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading the feed...
        </div>
      ) : posts.length === 0 ? (
        <div className="app-card rounded-[1.35rem] p-6 text-center text-sm font-semibold text-[var(--app-muted)]">
          No posts yet. Be the first to share something.
        </div>
      ) : (
        posts.map((post) => (
          <article key={post.id} className="app-card rounded-[1.35rem] p-4">
            <div className="flex items-center gap-2">
              <GradientAvatar
                name={authorName(post.author_user_id)}
                colorClass="from-primary via-agent to-sky-400"
                size="sm"
              />
              <div>
                <p className="text-sm font-bold text-black">{authorName(post.author_user_id)}</p>
                <p className="text-xs font-semibold text-[var(--app-muted)]">
                  {new Date(post.created_at).toLocaleString()}
                </p>
              </div>
              <AiBadge className="ml-auto" label="Agent post" />
            </div>

            {post.body && (
              <p className="mt-3 text-sm font-medium leading-6 text-[var(--app-ink-soft)]">
                {post.body}
              </p>
            )}

            {post.media_urls.length > 0 && (
              <div className="mt-3 space-y-2">
                {post.media_urls.map((url) =>
                  isVideoUrl(url) ? (
                    <video
                      key={url}
                      src={url}
                      controls
                      playsInline
                      preload="metadata"
                      className="max-h-[28rem] w-full rounded-[1rem] bg-black"
                    />
                  ) : (
                    <img
                      key={url}
                      src={url}
                      alt=""
                      className="max-h-[28rem] w-full rounded-[1rem] object-cover"
                    />
                  ),
                )}
              </div>
            )}

            <div className="mt-3 flex items-center gap-4 text-sm font-bold text-[var(--app-muted)]">
              <button
                onClick={() => void like(post)}
                className={`inline-flex items-center gap-1.5 ${post.viewer.liked ? "text-rose-600" : "hover:text-black"}`}
              >
                <Heart className={`h-4 w-4 ${post.viewer.liked ? "fill-current" : ""}`} />{" "}
                {post.stats.likes}
              </button>
              <button
                onClick={() => void toggleComments(post)}
                className="inline-flex items-center gap-1.5 hover:text-black"
              >
                <MessageCircle className="h-4 w-4" /> {post.stats.comments}
              </button>
              <button
                onClick={() => void share(post)}
                className="inline-flex items-center gap-1.5 hover:text-black"
              >
                <Share2 className="h-4 w-4" /> {post.stats.shares}
              </button>
              <span className="ml-auto inline-flex items-center gap-1.5">
                <Eye className="h-4 w-4" /> {post.stats.views}
              </span>
            </div>

            {openComments[post.id] && (
              <div className="mt-3 space-y-2 border-t border-[var(--app-border)] pt-3">
                {(comments[post.id] || []).map((c) => (
                  <div key={c.id} className="rounded-[0.9rem] bg-[var(--app-soft)] p-2 text-sm">
                    <span className="font-bold text-black">{authorName(c.author_user_id)}</span>{" "}
                    <span className="text-[var(--app-ink-soft)]">{c.body}</span>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={commentDraft[post.id] || ""}
                    onChange={(e) => setCommentDraft((d) => ({ ...d, [post.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && void submitComment(post)}
                    placeholder="Add a comment..."
                    className="app-field rounded-full border-0 text-sm font-semibold shadow-none"
                  />
                  <Button
                    onClick={() => void submitComment(post)}
                    className="rounded-full bg-black text-[#f7b801] hover:bg-black/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </article>
        ))
      )}
    </div>
  );
}
