import { Link } from "@/lib/navigation";
import { useIntros, useUser } from "@/lib/store";
import { GradientAvatar } from "@/components/Avatar";
import { DEMO_COMMUNITY, SEED_PROFILES } from "@/lib/mock-data";
import { scoreMatches } from "@/lib/matching";
import {
  BadgeCheck,
  Bookmark,
  BriefcaseBusiness,
  Camera,
  ChevronDown,
  Eye,
  Flame,
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
import { useState } from "react";
import type { Profile } from "@/lib/types";

const STORY_IMAGES = [
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=420&q=85",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=420&q=85",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=420&q=85",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=420&q=85",
];

const FEED_IMAGES = [
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=700&q=85",
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=700&q=85",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=920&q=85",
];

const SECONDARY_IMAGE =
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=940&q=85";

const RECOMMENDATIONS = [
  { label: "UI/UX", icon: BriefcaseBusiness, className: "bg-[#e6f0ff]" },
  { label: "Music", icon: Music2, className: "bg-[#ff78a8]" },
  {
    label: "Cooking",
    icon: Utensils,
    image:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=360&q=85",
  },
  { label: "Hiking", icon: PanelTop, className: "bg-[#b983ff]" },
];

export function Home() {
  const user = useUser();
  const intros = useIntros();
  const [activeTab, setActiveTab] = useState("Friends");
  const [likedPost, setLikedPost] = useState("intro");
  const [saved, setSaved] = useState(false);

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

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_330px]">
      <section className="min-w-0">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7e8fa8]">
              {DEMO_COMMUNITY.name}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-black md:text-4xl">
              News feed
            </h1>
          </div>
          <div className="flex w-fit rounded-full bg-slate-100 p-1 text-xs font-semibold text-slate-400">
            {["Recents", "Friends", "Popular"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={
                  activeTab === tab
                    ? "rounded-full bg-white px-4 py-1.5 text-black shadow-sm"
                    : "rounded-full px-4 py-1.5 transition hover:text-slate-700"
                }
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button className="group relative h-28 w-24 shrink-0 overflow-hidden rounded-[1.1rem] bg-black text-white shadow-[0_12px_26px_rgb(15_23_42_/_0.14)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_20%,#7df3c8,transparent_35%),linear-gradient(145deg,#111827,#334155)]" />
            <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition group-hover:rotate-90">
              <Plus className="h-4 w-4" />
            </span>
            <span className="absolute bottom-3 left-3 right-3 text-left text-xs font-semibold">
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
            className="mb-4 flex items-center gap-3 rounded-[1.1rem] border border-[#f6d57c] bg-[#fff4cf] p-3 shadow-[0_12px_30px_rgb(180_130_20_/_0.09)] transition hover:-translate-y-0.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white">
              <Send className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{pending.length} intro waiting for approval</p>
              <p className="truncate text-xs font-semibold text-slate-500">
                Review the message your agent drafted before it goes out.
              </p>
            </div>
          </Link>
        )}

        <Composer user={user} />

        <FeedPost
          id="intro"
          author={suggestions[0]}
          fallbackAuthor="Maya Chen"
          time="12 min ago"
          title="Your agent found a warm path into three high-fit people."
          body={
            <>
              Meet <ProfileMention profile={suggestions[0]} fallback="Maya" />,{" "}
              <ProfileMention profile={suggestions[1]} fallback="Sofia" /> and{" "}
              <ProfileMention profile={suggestions[2]} fallback="Jordan" />. They each match your
              current ask and have a concrete reason to talk this week.
            </>
          }
          images={FEED_IMAGES}
          liked={likedPost === "intro"}
          saved={saved}
          onLike={() => setLikedPost((current) => (current === "intro" ? "" : "intro"))}
          onSave={() => setSaved((current) => !current)}
        />

        <FeedPost
          id="office-hours"
          author={suggestions[1]}
          fallbackAuthor="Omar Williams"
          time="38 min ago"
          title="Office hours are filling with builders who have specific asks."
          body={
            <>
              Bring screenshots, metrics, and one decision you need help with. The best intros in
              the network start with context, not generic networking.
            </>
          }
          heroImage={SECONDARY_IMAGE}
          liked={likedPost === "office-hours"}
          onLike={() =>
            setLikedPost((current) => (current === "office-hours" ? "" : "office-hours"))
          }
        />
      </section>

      <aside className="sticky top-6 h-fit space-y-5 hidden xl:block">
        <section className="rounded-[1.35rem] bg-black p-4 text-white shadow-[0_16px_38px_rgb(15_23_42_/_0.18)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Live now</h2>
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
          <p className="mt-3 text-base font-semibold">Founder demo room</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-white/65">
            18 members discussing AI onboarding, first customers, and warm intros.
          </p>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-black">Suggestions</h2>
            <Link
              to="/app/discover"
              className="text-xs font-semibold text-slate-400 hover:text-black"
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
          <h2 className="text-2xl font-bold tracking-tight text-black">Recommendations</h2>
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

function Composer({ user }: { user: Profile }) {
  return (
    <section className="mb-4 rounded-[1.25rem] bg-white p-3 shadow-[0_14px_36px_rgb(30_41_59_/_0.09)] md:p-4">
      <div className="flex items-center gap-3 rounded-full bg-slate-100 px-4 py-2.5">
        <GradientAvatar name={user.full_name} colorClass={user.avatar_color} size="sm" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
          placeholder="Share an update, ask, or win"
        />
        <Smile className="h-5 w-5 text-slate-400" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PostAction icon={Image} label="Photo" />
        <PostAction icon={Video} label="Clip" />
        <PostAction icon={MapPin} label="Location" />
        <button className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
          <Sparkles className="h-5 w-5 text-black" />
          Public
          <ChevronDown className="h-4 w-4" />
        </button>
        <button className="ml-auto rounded-full bg-black px-6 py-2.5 text-xs font-semibold text-white shadow-[0_10px_20px_rgb(0_0_0_/_0.16)] transition hover:-translate-y-0.5">
          Post
        </button>
      </div>
    </section>
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
  liked,
  saved,
  onLike,
  onSave,
}: {
  id: string;
  author?: Profile;
  fallbackAuthor: string;
  time: string;
  title: string;
  body: React.ReactNode;
  images?: string[];
  heroImage?: string;
  liked: boolean;
  saved?: boolean;
  onLike: () => void;
  onSave?: () => void;
}) {
  const displayName = author?.full_name || fallbackAuthor;
  return (
    <article className="mb-4 rounded-[1.35rem] bg-white p-4 shadow-[0_16px_42px_rgb(30_41_59_/_0.09)] transition duration-300 hover:-translate-y-0.5 md:p-5">
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
                  className="text-base font-semibold hover:underline"
                >
                  {displayName}
                </Link>
                <BadgeCheck className="h-4 w-4 text-[#4aa3ff]" />
              </div>
              <p className="text-sm font-medium text-slate-400">
                {author?.role || "Founder"} · {time}
              </p>
            </div>
            <button
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-black transition hover:bg-black hover:text-white"
              aria-label="Post actions"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          <h2 className="mt-4 text-xl font-bold leading-tight text-black">{title}</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{body}</p>

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

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-400">
            <span className="inline-flex items-center gap-2">
              <Eye className="h-5 w-5" /> 6.3k
            </span>
            <button
              onClick={onLike}
              className={`inline-flex items-center gap-2 rounded-full px-2 py-1 transition ${
                liked ? "bg-[#ffe4ee] text-[#ee4f82]" : "hover:bg-slate-100 hover:text-black"
              }`}
            >
              <Heart className={liked ? "h-5 w-5 fill-current" : "h-5 w-5"} /> Like
            </button>
            <button className="inline-flex items-center gap-2 rounded-full px-2 py-1 transition hover:bg-slate-100 hover:text-black">
              <MessageCircle className="h-5 w-5" /> Comment
            </button>
            <button className="inline-flex items-center gap-2 rounded-full px-2 py-1 transition hover:bg-slate-100 hover:text-black">
              <Share2 className="h-5 w-5" /> Share
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={onSave}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                  saved ? "bg-black text-white" : "bg-slate-100 text-slate-500 hover:text-black"
                }`}
                aria-label="Save post"
              >
                <Bookmark className={saved ? "h-5 w-5 fill-current" : "h-5 w-5"} />
              </button>
              <span className="hidden items-center gap-1 rounded-full bg-[#fff3d5] px-3 py-2 text-[#ff8a00] sm:inline-flex">
                <Flame className="h-4 w-4 fill-current" /> Warm intro
              </span>
            </div>
          </div>
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
      className="group relative h-28 w-24 shrink-0 overflow-hidden rounded-[1.1rem] shadow-[0_12px_26px_rgb(15_23_42_/_0.14)]"
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
      <span className="absolute bottom-3 left-3 right-3 truncate text-xs font-semibold text-white">
        {profile?.full_name.split(" ")[0] || "Member"}
      </span>
    </Link>
  );
}

function ProfileMention({ profile, fallback }: { profile?: Profile; fallback: string }) {
  const name = profile?.full_name.split(" ")[0] || fallback;
  return (
    <Link
      to="/app/profile/$id"
      params={{ id: profile?.id || "me" }}
      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-black"
    >
      <GradientAvatar
        name={profile?.full_name || fallback}
        colorClass={profile?.avatar_color}
        size="sm"
        className="inline-flex h-6 w-6 text-[9px]"
      />
      {name}
    </Link>
  );
}

function SuggestionRow({ person, hot }: { person: Profile; hot?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-[1.05rem] bg-white p-2.5 shadow-[0_12px_28px_rgb(30_41_59_/_0.08)] transition hover:-translate-y-0.5">
      <GradientAvatar name={person.full_name} colorClass={person.avatar_color} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate font-semibold text-black">{person.full_name}</p>
          {hot && <Zap className="h-4 w-4 fill-[#ffb020] text-[#ffb020]" />}
        </div>
        <p className="truncate text-xs font-semibold text-slate-400">
          {person.role} at {person.company}
        </p>
      </div>
      <Link
        to="/app/profile/$id"
        params={{ id: person.id }}
        className="rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white"
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
      className={`relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-[1.1rem] p-3 text-center shadow-[0_12px_28px_rgb(30_41_59_/_0.1)] transition hover:-translate-y-0.5 ${
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
      <item.icon className="relative h-5 w-5 text-black" />
      <p className="relative mt-2 text-sm font-semibold text-black">{item.label}</p>
    </button>
  );
}

function PostAction({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
      <Icon className="h-5 w-5 text-black" />
      {label}
    </button>
  );
}
