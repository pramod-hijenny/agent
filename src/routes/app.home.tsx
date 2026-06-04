import { Link } from "@/lib/navigation";
import { useIntros, useUser } from "@/lib/store";
import { GradientAvatar } from "@/components/Avatar";
import { DEMO_COMMUNITY, SEED_PROFILES } from "@/lib/mock-data";
import { scoreMatches } from "@/lib/matching";
import {
  createAgentPost,
  createPostComment,
  fetchAgentPosts,
  fetchPostComments,
  recordPostView,
  shareAgentPost,
  type AgentPost,
  type AgentPostComment,
  type PostStats,
  type PostVisibility,
  type PostViewerState,
  togglePostReaction,
  uploadPostMedia,
} from "@/lib/social-posts";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Camera,
  ChevronDown,
  Eye,
  Heart,
  Image,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Music2,
  PanelTop,
  Plus,
  Send,
  Share2,
  Smile,
  Sparkles,
  Utensils,
  Video,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Profile } from "@/lib/types";

const STORY_IMAGES = [
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=420&q=85",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=420&q=85",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=420&q=85",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=420&q=85",
];

const RECOMMENDATIONS = [
  { label: "UI/UX", icon: BriefcaseBusiness, className: "bg-[#fff4c8]" },
  { label: "Music", icon: Music2, className: "bg-[#f5df9b]" },
  {
    label: "Cooking",
    icon: Utensils,
    image:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=360&q=85",
  },
  { label: "Hiking", icon: PanelTop, className: "bg-[#191919] text-[#f7b801]" },
];

export function Home() {
  const user = useUser();
  const intros = useIntros();
  const [activeTab, setActiveTab] = useState("Friends");
  const [backendPosts, setBackendPosts] = useState<AgentPost[]>([]);
  const [feedError, setFeedError] = useState("");
  const [commentsByPost, setCommentsByPost] = useState<Record<string, AgentPostComment[]>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState("");
  const viewedPosts = useRef(new Set<string>());
  const authorProfiles = useMemo(() => (user ? [user, ...SEED_PROFILES] : SEED_PROFILES), [user]);

  useEffect(() => {
    let cancelled = false;
    void fetchAgentPosts()
      .then((posts) => {
        if (!cancelled) setBackendPosts(posts);
      })
      .catch((error) => {
        if (!cancelled) {
          setFeedError(error instanceof Error ? error.message : "Unable to load feed posts");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    for (const post of backendPosts) {
      if (viewedPosts.current.has(post.id) || post.viewer.viewed) continue;
      viewedPosts.current.add(post.id);
      void recordPostView(post.id)
        .then((stats) => updateBackendPost(post.id, { stats }))
        .catch(() => {
          viewedPosts.current.delete(post.id);
        });
    }
  }, [backendPosts]);

  if (!user) return null;

  const pending = intros.filter((i) => i.status === "pending");
  const matches = scoreMatches(user, {
    query: user.current_ask,
    city: user.city,
    limit: 4,
  });
  const matchedPeople = matches.map((m) => m.profile);
  const backupPeople = SEED_PROFILES.filter((p) => p.id !== user.id).slice(0, 4);
  const suggestions = matchedPeople.length ? matchedPeople : backupPeople;

  function updateBackendPost(id: string, patch: Partial<AgentPost>) {
    setBackendPosts((posts) =>
      posts.map((post) => (post.id === id ? { ...post, ...patch } : post)),
    );
  }

  async function runPostAction(action: () => Promise<void>) {
    setActionError("");
    try {
      await action();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to update post");
    }
  }

  async function handleReaction(post: AgentPost) {
    await runPostAction(async () => {
      const summary = await togglePostReaction(post.id, "like", post.viewer.liked);
      updateBackendPost(post.id, {
        stats: summary.stats,
        viewer: summary.viewer,
      });
    });
  }

  async function handleShare(post: AgentPost) {
    await runPostAction(async () => {
      const stats = await shareAgentPost(post.id);
      updateBackendPost(post.id, { stats });
    });
  }

  async function handleComments(post: AgentPost) {
    const nextOpen = !openComments[post.id];
    setOpenComments((items) => ({ ...items, [post.id]: nextOpen }));
    if (!nextOpen || commentsByPost[post.id]) return;

    await runPostAction(async () => {
      const comments = await fetchPostComments(post.id);
      setCommentsByPost((items) => ({ ...items, [post.id]: comments }));
    });
  }

  async function handleCommentSubmit(post: AgentPost, comment: string) {
    await runPostAction(async () => {
      const savedComment = await createPostComment(post.id, comment);
      setCommentsByPost((items) => ({
        ...items,
        [post.id]: [...(items[post.id] ?? []), savedComment],
      }));
      updateBackendPost(post.id, {
        stats: {
          ...post.stats,
          comments: post.stats.comments + 1,
        },
      });
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_330px]">
      <section className="min-w-0">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="app-kicker">{DEMO_COMMUNITY.name}</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-black md:text-4xl">
              News feed
            </h1>
          </div>
          <div className="app-soft-panel flex w-fit rounded-full p-1 text-xs font-bold text-[var(--app-muted)]">
            {["Recents", "Friends", "Popular"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={
                  activeTab === tab
                    ? "rounded-full bg-black px-4 py-1.5 text-[#f7b801] shadow-sm"
                    : "rounded-full px-4 py-1.5 transition hover:text-black"
                }
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button className="group relative h-28 w-24 shrink-0 overflow-hidden rounded-[1.25rem] bg-black text-white shadow-[0_12px_26px_rgb(15_23_42_/_0.14)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_20%,rgb(247_184_1_/_0.72),transparent_35%),linear-gradient(145deg,#111111,#3a2b00)]" />
            <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-[0.8rem] bg-white text-black transition group-hover:rotate-90">
              <Plus className="h-4 w-4" />
            </span>
            <span className="absolute bottom-3 left-3 right-3 text-left text-xs font-black">
              Create story
            </span>
          </button>
          {STORY_IMAGES.map((src, index) => (
            <StoryCard key={src} src={src} profile={suggestions[index]} />
          ))}
        </div>

        {pending.length > 0 && (
          <Link
            to="/app/inbox"
            className="app-card-hover mb-4 flex items-center gap-3 rounded-[1.15rem] border border-[#f6d57c] bg-[#fff4cf] p-3 shadow-[0_12px_30px_rgb(180_130_20_/_0.09)]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white">
              <Send className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-black text-black">{pending.length} intro waiting for approval</p>
              <p className="truncate text-xs font-semibold text-[var(--app-muted)]">
                Review the message your agent drafted before it goes out.
              </p>
            </div>
          </Link>
        )}

        <Composer
          user={user}
          onPostCreated={(post) => setBackendPosts((posts) => [post, ...posts])}
        />

        {feedError && (
          <div className="mb-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {feedError}
          </div>
        )}

        {actionError && (
          <div className="mb-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {actionError}
          </div>
        )}

        {backendPosts.length > 0 ? (
          backendPosts.map((post) => {
            const author = resolvePostAuthor(post, authorProfiles, user);
            return (
              <FeedPost
                key={post.id}
                id={post.id}
                author={author}
                fallbackAuthor="Community member"
                time={formatPostTime(post.created_at)}
                title={post.body}
                images={post.media_urls.length > 1 ? post.media_urls : undefined}
                heroImage={post.media_urls.length === 1 ? post.media_urls[0] : undefined}
                stats={post.stats}
                viewer={post.viewer}
                comments={commentsByPost[post.id] ?? []}
                commentsOpen={Boolean(openComments[post.id])}
                onLike={() => void handleReaction(post)}
                onShare={() => void handleShare(post)}
                onCommentToggle={() => void handleComments(post)}
                onCommentSubmit={(comment) => void handleCommentSubmit(post, comment)}
              />
            );
          })
        ) : (
          <section className="app-card rounded-[1.35rem] p-6 text-center">
            <h2 className="text-xl font-black text-black">No posts yet</h2>
            <p className="mt-2 text-sm font-semibold text-[var(--app-muted)]">
              Share the first update to create a real backend-backed feed post.
            </p>
          </section>
        )}
      </section>

      <aside className="sticky top-6 h-fit space-y-5 hidden xl:block">
        <section className="app-hero relative overflow-hidden rounded-[1.35rem] p-4 text-white shadow-[0_16px_38px_rgb(15_23_42_/_0.18)]">
          <div className="honeycomb-bg absolute inset-0 opacity-10 mix-blend-screen" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight">Live now</h2>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                <Video className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 overflow-hidden rounded-[1rem]">
              <img
                src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=700&q=85"
                alt=""
                className="h-28 w-full object-cover transition duration-700 hover:scale-105"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="mt-3 text-base font-black">Founder demo room</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/65">
              18 members discussing AI onboarding, first customers, and warm intros.
            </p>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight text-black">Suggestions</h2>
            <Link
              to="/app/discover"
              className="text-xs font-bold text-[var(--app-muted)] hover:text-black"
            >
              See all
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {suggestions.slice(0, 4).map((person, index) => (
              <SuggestionRow key={person.id} person={person} hot={index === 0} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black tracking-tight text-black">Recommendations</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {RECOMMENDATIONS.map((item) => (
              <RecommendationTile key={item.label} item={item} />
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function Composer({
  user,
  onPostCreated,
}: {
  user: Profile;
  onPostCreated: (post: AgentPost) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [location, setLocation] = useState("");
  const [showLocation, setShowLocation] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaAccept, setMediaAccept] = useState("image/*");
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanBody = body.trim();
    if (!cleanBody && !selectedFile) {
      setError("Write an update or attach a photo or clip first.");
      return;
    }

    setIsPosting(true);
    setError("");
    try {
      const mediaUrls = selectedFile ? [await uploadPostMedia(selectedFile)] : [];
      const tags = location.trim() ? [`location:${location.trim()}`] : [];
      const post = await createAgentPost({
        body: cleanBody || "Shared a media update.",
        visibility,
        mediaUrls,
        tags,
      });
      onPostCreated(post);
      setBody("");
      setLocation("");
      setShowLocation(false);
      setSelectedFile(null);
    } catch (postError) {
      setError(postError instanceof Error ? postError.message : "Unable to publish post");
    } finally {
      setIsPosting(false);
    }
  }

  function openMediaPicker(accept: string) {
    setMediaAccept(accept);
    requestAnimationFrame(() => fileInputRef.current?.click());
  }

  return (
    <form
      onSubmit={(event) => void submitPost(event)}
      className="app-card mb-4 rounded-[1.35rem] p-3 md:p-4"
    >
      <div className="app-field flex items-center gap-3 rounded-[1.2rem] px-4 py-2.5">
        <GradientAvatar name={user.full_name} colorClass={user.avatar_color} size="sm" />
        <input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-black outline-none placeholder:text-[var(--app-placeholder)]"
          placeholder="Share an update, ask, or win"
        />
        <Smile className="h-5 w-5 text-[var(--app-placeholder)]" />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={mediaAccept}
        className="hidden"
        onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
      />

      {(selectedFile || showLocation || error) && (
        <div className="app-soft-panel mt-3 grid gap-2 rounded-[1rem] p-3">
          {selectedFile && (
            <div className="flex items-center justify-between gap-3 text-sm font-semibold text-[var(--app-ink-soft)]">
              <span className="truncate">{selectedFile.name}</span>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--app-muted)] hover:text-black"
              >
                Remove
              </button>
            </div>
          )}
          {showLocation && (
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="app-field rounded-full px-4 py-2 text-sm font-semibold outline-none placeholder:text-[var(--app-placeholder)]"
              placeholder="Add a location"
            />
          )}
          {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PostAction icon={Image} label="Photo" onClick={() => openMediaPicker("image/*")} />
        <PostAction icon={Video} label="Clip" onClick={() => openMediaPicker("video/*")} />
        <PostAction
          icon={MapPin}
          label="Location"
          onClick={() => setShowLocation((current) => !current)}
        />
        <button
          type="button"
          onClick={() => setVisibility((current) => (current === "public" ? "friends" : "public"))}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-[var(--app-ink-soft)] transition hover:bg-[#fff4c8] hover:text-black"
        >
          <Sparkles className="h-5 w-5 text-black" />
          {visibility === "public" ? "Public" : "Friends"}
          <ChevronDown className="h-4 w-4" />
        </button>
        <button
          type="submit"
          disabled={isPosting}
          className="ml-auto rounded-full bg-black px-6 py-2.5 text-xs font-black text-[#f7b801] shadow-[0_10px_20px_rgb(0_0_0_/_0.16)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPosting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}

function FeedPost({
  author,
  fallbackAuthor,
  time,
  title,
  body,
  images,
  heroImage,
  stats,
  viewer,
  comments,
  commentsOpen,
  onLike,
  onShare,
  onCommentToggle,
  onCommentSubmit,
}: {
  id: string;
  author?: Profile;
  fallbackAuthor: string;
  time: string;
  title: string;
  body?: React.ReactNode;
  images?: string[];
  heroImage?: string;
  stats?: PostStats;
  viewer?: PostViewerState;
  comments?: AgentPostComment[];
  commentsOpen?: boolean;
  onLike: () => void;
  onShare?: () => void;
  onCommentToggle?: () => void;
  onCommentSubmit?: (comment: string) => void;
}) {
  const displayName = author?.full_name || fallbackAuthor;
  const [commentDraft, setCommentDraft] = useState("");
  const currentStats = stats ?? { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 };
  const currentViewer = viewer ?? { liked: false, saved: false, viewed: false };

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanComment = commentDraft.trim();
    if (!cleanComment || !onCommentSubmit) return;
    onCommentSubmit(cleanComment);
    setCommentDraft("");
  }

  return (
    <article className="app-card app-card-hover mb-4 rounded-[1.35rem] p-4 md:p-5">
      <div className="flex items-start gap-4">
        <GradientAvatar
          name={displayName}
          colorClass={author?.avatar_color || "from-rose-400 to-cyan-400"}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Link
                  to="/app/profile/$id"
                  params={{ id: author?.id || "me" }}
                  className="text-base font-black text-black hover:underline"
                >
                  {displayName}
                </Link>
                <BadgeCheck className="h-4 w-4 text-[#f7b801]" />
              </div>
              <p className="text-sm font-semibold text-[var(--app-muted)]">
                {author?.role || "Founder"} · {time}
              </p>
            </div>
            <button
              type="button"
              className="app-icon-button flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem]"
              aria-label="Post actions"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          <h2 className="mt-4 text-xl font-black leading-tight text-black">{title}</h2>
          {body && (
            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--app-ink-soft)]">
              {body}
            </p>
          )}

          {images && (
            <div className="mt-4 grid h-[210px] grid-cols-[0.9fr_0.9fr_1.45fr] gap-2 overflow-hidden rounded-[1.1rem] md:h-[260px]">
              {images.map((src) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="h-full w-full object-cover transition duration-700 hover:scale-105"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          )}

          {heroImage && (
            <div className="mt-4 overflow-hidden rounded-[1.1rem]">
              <img
                src={heroImage}
                alt=""
                className="h-[220px] w-full object-cover transition duration-700 hover:scale-105 md:h-[260px]"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-bold text-[var(--app-muted)]">
            <span className="inline-flex items-center gap-2">
              <Eye className="h-5 w-5" /> {formatCount(currentStats.views)}
            </span>
            <button
              type="button"
              onClick={onLike}
              className={`inline-flex items-center gap-2 rounded-full px-2 py-1 transition ${
                currentViewer.liked
                  ? "bg-[#ffe4ee] text-[#ee4f82]"
                  : "hover:bg-[#fff4c8] hover:text-black"
              }`}
            >
              <Heart className={currentViewer.liked ? "h-5 w-5 fill-current" : "h-5 w-5"} />
              {currentStats.likes > 0 ? `${formatCount(currentStats.likes)} Like` : "Like"}
            </button>
            <button
              type="button"
              onClick={onCommentToggle}
              className="inline-flex items-center gap-2 rounded-full px-2 py-1 transition hover:bg-[#fff4c8] hover:text-black"
            >
              <MessageCircle className="h-5 w-5" />
              {currentStats.comments > 0
                ? `${formatCount(currentStats.comments)} Comment`
                : "Comment"}
            </button>
            <button
              type="button"
              onClick={onShare}
              className="inline-flex items-center gap-2 rounded-full px-2 py-1 transition hover:bg-[#fff4c8] hover:text-black"
            >
              <Share2 className="h-5 w-5" />
              {currentStats.shares > 0 ? `${formatCount(currentStats.shares)} Share` : "Share"}
            </button>
          </div>

          {commentsOpen && (
            <div className="app-soft-panel mt-4 rounded-[1rem] p-3">
              <div className="space-y-2">
                {(comments ?? []).map((comment) => (
                  <div key={comment.id} className="rounded-[0.9rem] bg-white px-3 py-2 text-sm">
                    <p className="font-black text-black">Community member</p>
                    <p className="mt-1 font-semibold text-[var(--app-ink-soft)]">{comment.body}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={submitComment} className="mt-3 flex gap-2">
                <input
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  className="app-field min-w-0 flex-1 rounded-full px-4 py-2 text-sm font-semibold outline-none placeholder:text-[var(--app-placeholder)]"
                  placeholder="Write a comment"
                />
                <button
                  type="submit"
                  className="rounded-full bg-black px-4 py-2 text-xs font-black text-[#f7b801]"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function StoryCard({ src, profile }: { src: string; profile?: Profile }) {
  return (
    <Link
      to="/app/profile/$id"
      params={{ id: profile?.id || "me" }}
      className="group relative h-28 w-24 shrink-0 overflow-hidden rounded-[1.25rem] shadow-[0_12px_26px_rgb(15_23_42_/_0.14)] ring-1 ring-white/70"
    >
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <GradientAvatar
        name={profile?.full_name || "Member"}
        colorClass={profile?.avatar_color}
        size="sm"
        className="absolute left-3 top-3 ring-2 ring-white"
      />
      <span className="absolute bottom-3 left-3 right-3 truncate text-xs font-black text-white">
        {profile?.full_name.split(" ")[0] || "Member"}
      </span>
    </Link>
  );
}

function SuggestionRow({ person, hot }: { person: Profile; hot?: boolean }) {
  return (
    <div className="app-card app-card-hover flex items-center gap-3 rounded-[1.05rem] p-2.5">
      <GradientAvatar name={person.full_name} colorClass={person.avatar_color} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate font-black text-black">{person.full_name}</p>
          {hot && <Zap className="h-4 w-4 fill-[#ffb020] text-[#ffb020]" />}
        </div>
        <p className="truncate text-xs font-semibold text-[var(--app-muted)]">
          {person.role} at {person.company}
        </p>
      </div>
      <Link
        to="/app/profile/$id"
        params={{ id: person.id }}
        className="rounded-full bg-black px-3 py-1.5 text-xs font-black text-[#f7b801]"
      >
        Follow
      </Link>
    </div>
  );
}

function RecommendationTile({
  item,
}: {
  item: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className?: string;
    image?: string;
  };
}) {
  return (
    <button
      className={`app-card-hover relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-[1.15rem] border border-[var(--app-border)] p-3 text-center shadow-[0_12px_28px_rgb(30_41_59_/_0.1)] ${
        item.className || "bg-white"
      }`}
    >
      {item.image && (
        <>
          <img
            src={item.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-110"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-white/25" />
        </>
      )}
      <item.icon className="relative h-5 w-5 text-current" />
      <p className="relative mt-2 text-sm font-black text-current">{item.label}</p>
    </button>
  );
}

function PostAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-[var(--app-ink-soft)] transition hover:bg-[#fff4c8] hover:text-black"
    >
      <Icon className="h-5 w-5 text-black" />
      {label}
    </button>
  );
}

function resolvePostAuthor(post: AgentPost, profiles: Profile[], fallback: Profile) {
  return (
    profiles.find((profile) => profile.user_id === post.author_user_id) ??
    profiles.find((profile) => profile.id === post.author_user_id) ??
    fallback
  );
}

function formatPostTime(createdAt: string) {
  const timestamp = new Date(createdAt).getTime();
  if (!Number.isFinite(timestamp)) return "just now";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatCount(count: number) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}m`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return String(count);
}
