import { useCallback, useEffect, useState } from "react";
import {
  Heart,
  Loader2,
  MessageCircle,
  RefreshCw,
  Repeat2,
  Share2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { extractLinkedInFeed, extractFacebookFeed } from "@/lib/rtrvr";
import {
  finishSyncRun,
  listRecentSyncRuns,
  listTopPosts,
  startSyncRun,
  upsertExtractedPosts,
  type Platform,
  type SocialPost,
  type SocialSyncRun,
} from "@/lib/social-posts";

const PLATFORMS: { key: Platform; label: string; color: string }[] = [
  { key: "linkedin", label: "LinkedIn", color: "#0a66c2" },
  { key: "facebook", label: "Facebook", color: "#1877f2" },
];

export function FeedPage() {
  const [platform, setPlatform] = useState<Platform>("linkedin");
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [lastRun, setLastRun] = useState<SocialSyncRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (p: Platform = platform) => {
      setError(null);
      setLoading(true);
      try {
        const [topPosts, runs] = await Promise.all([
          listTopPosts({ platform: p, limit: 24 }),
          listRecentSyncRuns(p, 1),
        ]);
        setPosts(topPosts);
        setLastRun(runs[0] ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load posts");
      } finally {
        setLoading(false);
      }
    },
    [platform],
  );

  useEffect(() => {
    refresh(platform);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  const sync = async () => {
    setSyncing(true);
    setError(null);
    let runId: string | null = null;
    try {
      const run = await startSyncRun(platform);
      runId = run.id;
      const extracted =
        platform === "facebook"
          ? await extractFacebookFeed({ maxPosts: 3 })
          : await extractLinkedInFeed({ maxPosts: 3 });
      const count = await upsertExtractedPosts(platform, extracted);
      await finishSyncRun(run.id, { status: "success", post_count: count });
      await refresh(platform);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      setError(message);
      if (runId) {
        await finishSyncRun(runId, { status: "error", error_message: message }).catch(() => {});
      }
    } finally {
      setSyncing(false);
    }
  };

  const currentPlatform = PLATFORMS.find((p) => p.key === platform)!;

  return (
    <div className="w-full">
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7e8fa8]">
            Top from your network
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-black md:text-4xl">
            Social feed
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {lastRun ? (
              <LastRunLabel run={lastRun} />
            ) : (
              "Not synced yet — pull your feed to get started."
            )}
          </p>
        </div>
        <Button onClick={sync} disabled={syncing} className="gap-2">
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {syncing ? "Syncing…" : `Sync ${currentPlatform.label}`}
        </Button>
      </header>

      {/* Platform tabs */}
      <div className="mb-5 flex gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPlatform(p.key)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              platform === p.key
                ? "text-white shadow-md"
                : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"
            }`}
            style={platform === p.key ? { backgroundColor: p.color } : {}}
          >
            <PlatformIcon platform={p.key} size={16} />
            {p.label}
          </button>
        ))}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sync failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!import.meta.env.VITE_RTRVR_API_KEY && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>One-time setup</AlertTitle>
          <AlertDescription>
            Install the{" "}
            <a className="underline" href="https://www.rtrvr.ai/" target="_blank" rel="noreferrer">
              rtrvr.ai Chrome extension
            </a>
            , then set <code>VITE_RTRVR_API_KEY</code> in <code>.env</code> and restart the dev
            server.
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState platform={currentPlatform} />
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} platform={platform} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PlatformIcon({ platform, size = 20 }: { platform: Platform; size?: number }) {
  if (platform === "linkedin") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  }
  if (platform === "facebook") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }
  return null;
}

function LastRunLabel({ run }: { run: SocialSyncRun }) {
  const when = run.finished_at ?? run.started_at;
  const minutes = Math.max(0, Math.round((Date.now() - new Date(when).getTime()) / 60_000));
  const label =
    minutes < 1
      ? "just now"
      : minutes < 60
        ? `${minutes}m ago`
        : `${Math.round(minutes / 60)}h ago`;
  if (run.status === "error") {
    return (
      <span className="text-rose-600">
        Last sync failed {label}
        {run.error_message ? ` — ${run.error_message}` : ""}
      </span>
    );
  }
  return (
    <span>
      Last synced {label} · {run.post_count} posts
    </span>
  );
}

function EmptyState({ platform }: { platform: { key: Platform; label: string } }) {
  const url = platform.key === "facebook" ? "facebook.com" : "linkedin.com/feed";
  return (
    <div className="rounded-[1.35rem] border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <PlatformIcon platform={platform.key} size={24} />
      </div>
      <h2 className="text-lg font-semibold text-black">No {platform.label} posts yet</h2>
      <p className="mt-2 text-sm text-slate-500">
        Open <span className="font-mono">{url}</span> in the Chrome window where the rtrvr extension
        is installed, then click <strong>Sync {platform.label}</strong>.
      </p>
    </div>
  );
}

function PostCard({ post, platform }: { post: SocialPost; platform: Platform }) {
  return (
    <article className="rounded-[1.35rem] bg-white p-5 shadow-[0_16px_42px_rgb(30_41_59_/_0.09)] transition hover:-translate-y-0.5">
      <header className="flex items-start gap-3">
        {post.author_avatar_url ? (
          <img
            src={post.author_avatar_url}
            alt=""
            className="h-11 w-11 rounded-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-semibold text-white">
            {(post.author_name || "?").slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-black">
            {post.author_name || "Unknown"}
          </p>
          <p className="truncate text-xs font-medium text-slate-400">
            {post.author_handle ? `@${post.author_handle}` : platform}
            {post.posted_at ? ` · ${post.posted_at}` : ""}
          </p>
        </div>
        {post.post_url && (
          <a
            href={post.post_url}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-black hover:text-white"
            aria-label={`Open on ${platform}`}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </header>

      {post.content && (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {truncate(post.content, 600)}
        </p>
      )}

      {post.media_urls.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 overflow-hidden rounded-2xl md:grid-cols-3">
          {post.media_urls.slice(0, 3).map((src) => (
            <img
              key={src}
              src={src}
              alt=""
              className="h-32 w-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ))}
        </div>
      )}

      <footer className="mt-4 flex items-center gap-5 text-xs font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Heart className="h-4 w-4" /> {formatCount(post.likes)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle className="h-4 w-4" /> {formatCount(post.comments)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Repeat2 className="h-4 w-4" /> {formatCount(post.reposts)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Share2 className="h-4 w-4" /> {formatCount(post.shares)}
        </span>
      </footer>
    </article>
  );
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return n.toString();
}
