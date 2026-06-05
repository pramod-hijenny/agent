import { useEffect, useRef, useState } from "react";
import { Link } from "@/lib/navigation";
import { GradientAvatar } from "@/components/Avatar";
import {
  fetchAgentPosts,
  isVideoUrl,
  shareAgentPost,
  togglePostReaction,
  type AgentPost,
} from "@/lib/social-posts";
import { fetchAllProfiles } from "@/lib/auth";
import type { Profile } from "@/lib/types";
import { Heart, Play, Plus, Share2, X } from "lucide-react";

interface Clip {
  post: AgentPost;
  url: string;
  who: string;
}

// Stories / shorts row that sits on top of the feed (Facebook-style): a "Create"
// card, real short-video posts (tap → full-screen vertical player), and real
// community members as story cards.
export function ShortsStrip({
  meUserId,
  onCreateClip,
}: {
  meUserId?: string;
  onCreateClip?: () => void;
}) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [posts, profiles] = await Promise.all([
          fetchAgentPosts(50),
          fetchAllProfiles().catch(() => [] as Profile[]),
        ]);
        if (cancelled) return;
        const names: Record<string, string> = {};
        for (const pr of profiles) if (pr.user_id) names[pr.user_id] = pr.full_name || "Member";
        const c: Clip[] = [];
        for (const post of posts)
          for (const url of post.media_urls)
            if (isVideoUrl(url)) c.push({ post, url, who: names[post.author_user_id] || "Member" });
        setClips(c);
        setMembers(profiles.filter((p) => p.user_id && p.user_id !== meUserId && p.full_name));
      } catch {
        /* the feed surfaces its own errors */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [meUserId]);

  return (
    <div className="app-card rounded-[1.35rem] p-3">
      <div className="flex gap-3 overflow-x-auto pb-1">
        {/* Create a clip */}
        <button
          onClick={onCreateClip}
          className="group relative h-28 w-24 shrink-0 overflow-hidden rounded-[1.25rem] bg-black text-white shadow-[0_12px_26px_rgb(15_23_42_/_0.14)]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_20%,rgb(247_184_1_/_0.72),transparent_35%),linear-gradient(145deg,#111111,#3a2b00)]" />
          <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-[0.8rem] bg-white text-black transition group-hover:rotate-90">
            <Plus className="h-4 w-4" />
          </span>
          <span className="absolute bottom-3 left-3 right-3 text-left text-xs font-black">
            Create clip
          </span>
        </button>

        {/* Short videos */}
        {clips.map((clip, i) => (
          <button
            key={`${clip.post.id}-${i}`}
            onClick={() => setOpenIndex(i)}
            className="group relative h-28 w-24 shrink-0 overflow-hidden rounded-[1.25rem] bg-black shadow-[0_12px_26px_rgb(15_23_42_/_0.14)]"
          >
            <video
              src={clip.url}
              muted
              preload="metadata"
              playsInline
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/85 text-black">
              <Play className="h-3.5 w-3.5 fill-current" />
            </span>
            <span className="absolute bottom-3 left-3 right-3 truncate text-left text-xs font-black text-white">
              {clip.who}
            </span>
          </button>
        ))}

        {/* Community members as story cards */}
        {members.map((m) => (
          <Link
            key={m.id}
            to="/app/profile/$id"
            params={{ id: m.id }}
            className="group relative h-28 w-24 shrink-0 overflow-hidden rounded-[1.25rem] shadow-[0_12px_26px_rgb(15_23_42_/_0.14)] ring-1 ring-white/70"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${m.avatar_color || "from-sky-400 to-indigo-400"}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <GradientAvatar
              name={m.full_name}
              colorClass={m.avatar_color}
              size="sm"
              className="absolute left-3 top-3 ring-2 ring-white"
            />
            <span className="absolute bottom-3 left-3 right-3 truncate text-xs font-black text-white">
              {m.full_name.split(" ")[0]}
            </span>
          </Link>
        ))}
      </div>

      {openIndex !== null && (
        <ShortsPlayer clips={clips} startIndex={openIndex} onClose={() => setOpenIndex(null)} />
      )}
    </div>
  );
}

function ShortsPlayer({
  clips,
  startIndex,
  onClose,
}: {
  clips: Clip[];
  startIndex: number;
  onClose: () => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollerRef.current?.children[startIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "start" });
  }, [startIndex]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95" role="dialog" aria-modal="true">
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur"
        aria-label="Close shorts"
      >
        <X className="h-5 w-5" />
      </button>
      <div ref={scrollerRef} className="h-full snap-y snap-mandatory overflow-y-scroll">
        {clips.map((clip, i) => (
          <ShortSlide key={`${clip.post.id}-${i}`} clip={clip} />
        ))}
      </div>
    </div>
  );
}

function ShortSlide({ clip }: { clip: Clip }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [post, setPost] = useState(clip.post);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) void v.play().catch(() => {});
        else v.pause();
      },
      { threshold: [0, 0.6, 1] },
    );
    obs.observe(v);
    return () => obs.disconnect();
  }, []);

  async function like() {
    try {
      const s = await togglePostReaction(post.id, "like", post.viewer.liked);
      setPost((p) => ({ ...p, stats: s.stats, viewer: s.viewer }));
    } catch {
      /* ignore */
    }
  }

  async function share() {
    try {
      const stats = await shareAgentPost(post.id);
      setPost((p) => ({ ...p, stats }));
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative mx-auto flex h-full max-w-md snap-start items-center justify-center">
      <video
        ref={ref}
        src={clip.url}
        loop
        muted
        playsInline
        preload="metadata"
        className="h-full w-full object-contain"
        onClick={(e) => {
          const v = e.currentTarget;
          if (v.paused) void v.play().catch(() => {});
          else v.pause();
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
        <p className="text-sm font-black">{clip.who}</p>
        {post.body && (
          <p className="mt-1 line-clamp-3 text-sm font-medium text-white/85">{post.body}</p>
        )}
      </div>
      <div className="absolute bottom-6 right-3 flex flex-col gap-4 text-white">
        <button onClick={like} className="flex flex-col items-center">
          <Heart className={`h-7 w-7 ${post.viewer.liked ? "fill-rose-500 text-rose-500" : ""}`} />
          <span className="text-xs font-bold">{post.stats.likes}</span>
        </button>
        <button onClick={share} className="flex flex-col items-center">
          <Share2 className="h-7 w-7" />
          <span className="text-xs font-bold">{post.stats.shares}</span>
        </button>
      </div>
    </div>
  );
}
