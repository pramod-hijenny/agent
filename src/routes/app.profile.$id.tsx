import { Link, useParams } from "@/lib/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@/lib/store";
import { DEMO_COMMUNITY } from "@/lib/mock-data";
import { GradientAvatar } from "@/components/Avatar";
import { AgentCard } from "@/components/AgentCard";
import { InterestChips } from "@/components/InterestChips";
import { Button } from "@/components/ui/button";
import { AiBadge } from "@/components/AiBadge";
import { DEFAULT_PERMISSIONS, GOAL_LABELS } from "@/lib/types";
import { insforge } from "@/lib/insforge";
import {
  BadgeCheck,
  Briefcase,
  Clock,
  Code2,
  type LucideIcon,
  MapPin,
  MessageCircle,
  Send,
  Music2,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const TABS = ["Overview", "Agent", "Connections"] as const;
type Tab = (typeof TABS)[number];

type BackendAgentRow = {
  id: string;
  user_id?: string;
  name?: string;
  persona_tone?: string;
  agent_intro?: string;
  mission?: string;
  interests?: string[];
  goals?: string[];
  skills?: string[];
  intent?: string;
  memory?: string[];
  agent_mode_enabled?: boolean;
  profiles?: {
    city?: string;
    full_name?: string;
    avatar_color?: string;
    role?: string;
    company?: string;
    bio?: string;
    stage?: string;
    profession?: string;
    offering?: string;
    availability?: string;
    likes?: string;
    dislikes?: string;
    topics_enjoy?: string;
    topics_avoid?: string;
    community_id?: string;
  } | null;
};

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const user = useUser();
  const isMe = id === "me";
  const [backendProfile, setBackendProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [tab, setTab] = useState<Tab>("Overview");
  const profile = isMe ? user : backendProfile;

  useEffect(() => {
    let cancelled = false;
    async function loadBackendProfile() {
      if (isMe || !id) {
        setBackendProfile(null);
        setLoadingProfile(false);
        return;
      }
      setLoadingProfile(true);
      try {
        const { data } = await insforge.database
          .from("agents")
          .select(
            "id,user_id,name,persona_tone,agent_intro,mission,interests,goals,skills,intent,memory,agent_mode_enabled,profiles(city,full_name,avatar_color,role,company,bio,stage,profession,offering,availability,likes,dislikes,topics_enjoy,topics_avoid,community_id)",
          )
          .eq("id", id)
          .single();
        if (!cancelled) setBackendProfile(agentRowToProfile(data as BackendAgentRow | null));
      } catch {
        if (!cancelled) setBackendProfile(null);
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }
    void loadBackendProfile();
    return () => {
      cancelled = true;
    };
  }, [id, isMe]);

  if (loadingProfile) return <p className="text-sm text-muted-foreground">Loading profile...</p>;
  if (!profile) return <p className="text-sm text-muted-foreground">Profile not found.</p>;

  const theme = getProfileTheme(profile.id);
  const mutuals: Profile[] = [];

  return (
    <div
      className={cn(
        "relative min-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-[1.4rem] border p-3 shadow-[0_24px_80px_rgb(15_23_42_/_0.16)] md:p-5",
        theme.page,
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0", theme.pageOverlay)} />
      <div className="relative space-y-4">
        <section
          className={cn(
            "overflow-hidden rounded-[1.35rem] border shadow-[0_16px_44px_rgb(30_41_59_/_0.1)]",
            theme.heroCard,
            theme.shell,
          )}
        >
          <div className="relative h-48 overflow-hidden bg-black px-4 pt-5 md:h-56 md:px-5">
            <img
              src={theme.cover}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-75"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <div
              className={`absolute inset-0 bg-gradient-to-br ${profile.avatar_color} opacity-35`}
            />
            <div className={cn("absolute inset-0", theme.overlay)} />
            <div className="relative z-10 flex flex-wrap gap-2">
              {theme.badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-white/25 bg-black/45 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
          <div className="p-4 md:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div
                  className={cn(
                    "-mt-16 rounded-[1.3rem] bg-white p-1 shadow-xl",
                    theme.avatarFrame,
                  )}
                >
                  <GradientAvatar
                    name={profile.full_name}
                    colorClass={profile.avatar_color}
                    size="xl"
                  />
                </div>
                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className={cn("text-3xl font-bold tracking-tight text-black", theme.name)}>
                      {profile.full_name}
                    </h1>
                    <BadgeCheck className="h-5 w-5 text-[#4aa3ff]" />
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-semibold uppercase",
                        theme.live,
                      )}
                    >
                      {theme.status}
                    </span>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
                    {profile.bio}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {profile.role} · {profile.profession}
                      {profile.company ? ` at ${profile.company}` : ""}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {profile.city}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {DEMO_COMMUNITY.name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {isMe ? (
                  <>
                    <Button
                      asChild
                      className={cn("rounded-full font-semibold", theme.primaryButton)}
                    >
                      <Link to="/onboarding">Edit profile</Link>
                    </Button>
                    <Button
                      asChild
                      variant="secondary"
                      className={cn("rounded-full font-semibold", theme.secondaryButton)}
                    >
                      <Link to="/app/agent">
                        <Sparkles className="h-4 w-4" /> Edit agent
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className={cn("rounded-full font-semibold", theme.primaryButton)}>
                      <UserPlus className="h-4 w-4" /> Request intro
                    </Button>
                    <Button
                      variant="secondary"
                      className={cn("rounded-full font-semibold", theme.secondaryButton)}
                      asChild
                    >
                      <Link to="/app/discover">
                        <MessageCircle className="h-4 w-4" /> Ask my agent
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="secondary"
                      className={cn("rounded-full font-semibold", theme.secondaryButton)}
                    >
                      <Link to="/app/messages/$id" params={{ id: profile.id }}>
                        <Send className="h-4 w-4" /> Message
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-4">
              <Stat value={profile.stage} label="Stage" theme={theme} />
              <Stat value={profile.skills.slice(0, 2).join(", ")} label="Skills" theme={theme} />
              <Stat value={profile.availability} label="Availability" theme={theme} />
              <Stat
                value={profile.agent.status === "active" ? "Active" : "Paused"}
                label="Agent"
                theme={theme}
              />
            </div>

            <div className={cn("mt-4 flex gap-1 overflow-x-auto rounded-full p-1", theme.tabRail)}>
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    tab === t ? theme.tabActive : theme.tabInactive,
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </section>

        <ProfileShowcase profile={profile} theme={theme} />
        <ProfileVibeBoard profile={profile} mutuals={mutuals} theme={theme} />

        {tab === "Overview" && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-4 md:col-span-2">
              <Card title="Current ask" theme={theme}>
                <p className="text-sm leading-6">{profile.current_ask}</p>
              </Card>
              <Card title="Can help with" theme={theme}>
                <p className="text-sm leading-6">{profile.offering}</p>
              </Card>
              <Card title="Goals" theme={theme}>
                <div className="flex flex-wrap gap-2">
                  {profile.goals.map((g) => (
                    <span
                      key={g}
                      className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                    >
                      {GOAL_LABELS[g]}
                    </span>
                  ))}
                </div>
              </Card>
            </div>
            <div className="space-y-4">
              <Card title="Skills" theme={theme}>
                <InterestChips items={profile.skills} />
              </Card>
              <Card title="Interests" theme={theme}>
                <InterestChips items={profile.interests} />
              </Card>
              <Card title="Availability" theme={theme}>
                <div className="flex gap-2 text-sm">
                  <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span>{profile.availability}</span>
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === "Agent" && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <AgentCard profile={profile} />
            </div>
            {!isMe && user && (
              <Card title="Agent compatibility" theme={theme}>
                <p className="text-sm">
                  <AiBadge /> Shared context with you:
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {profile.interests
                    .filter((i) =>
                      user.interests.map((x) => x.toLowerCase()).includes(i.toLowerCase()),
                    )
                    .join(", ") ||
                    "No direct overlap, but the community context may still be useful."}
                </p>
              </Card>
            )}
          </div>
        )}

        {tab === "Connections" && (
          <Card title={`Community members · ${mutuals.length}`} theme={theme}>
            <div className="grid gap-2 sm:grid-cols-2">
              {mutuals.map((m) => (
                <Link
                  to="/app/profile/$id"
                  params={{ id: m.id }}
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3 hover:bg-secondary"
                >
                  <GradientAvatar name={m.full_name} colorClass={m.avatar_color} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.role} · {m.company}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Stat({ value, label, theme }: { value: string; label: string; theme: ProfileTheme }) {
  return (
    <div className={cn("rounded-[1.2rem] p-3 shadow-sm", theme.stat)}>
      <p className="truncate text-sm font-semibold leading-tight text-black">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

interface ProfileTheme {
  page: string;
  pageOverlay: string;
  heroCard: string;
  panel: string;
  panelTitle: string;
  stat: string;
  tabRail: string;
  tabActive: string;
  tabInactive: string;
  primaryButton: string;
  secondaryButton: string;
  profileWindow: string;
  cover: string;
  shell: string;
  overlay: string;
  avatarFrame: string;
  name: string;
  live: string;
  status: string;
  badges: string[];
  marquee: string;
  playlist: string[];
  mood: string;
  stamp: string;
  studio: string;
}

const DEFAULT_PROFILE_THEME: ProfileTheme = {
  page: "border-[var(--app-border)] bg-[#fff8dc] text-slate-950",
  pageOverlay: "honeycomb-bg opacity-45",
  heroCard: "border-[var(--app-border)] bg-[var(--app-card)]",
  panel:
    "border border-[var(--app-border)] bg-[var(--app-card)] text-slate-900 shadow-[var(--app-shadow)]",
  panelTitle: "text-[var(--app-muted)]",
  stat: "border border-[var(--app-line)] bg-[#fff4c8]/80 text-black",
  tabRail: "border border-[var(--app-line)] bg-[#fff4c8]/55",
  tabActive: "bg-black text-[#f7b801] shadow-sm",
  tabInactive: "text-[var(--app-muted)] hover:text-black",
  primaryButton: "bg-black text-white hover:bg-black/90",
  secondaryButton: "bg-[#fff4c8] text-slate-900 hover:bg-[#ffe69b]",
  profileWindow: "border border-black/10 bg-[#071827]",
  cover:
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=85",
  shell: "bg-white",
  overlay: "bg-gradient-to-t from-black/80 via-black/25 to-transparent",
  avatarFrame: "",
  name: "font-black",
  live: "bg-black text-[#f7b801]",
  status: "agent live",
  badges: ["community", "builder", "open to intros"],
  marquee: "A profile page built from goals, context, and clear networking intent",
  playlist: ["Community Signal", "Warm Intro Hour", "Profile Notes"],
  mood: "Community signal board",
  stamp: "open to useful intros",
  studio: "bg-[linear-gradient(135deg,#fffaf0,#fff4c8_52%,#ffffff)]",
};

function getProfileTheme(profileId: string): ProfileTheme {
  const themes: Record<string, ProfileTheme> = {
    maya: {
      ...DEFAULT_PROFILE_THEME,
      page: "border-[#ff9cdf]/50 bg-[#2b1536] text-slate-950",
      pageOverlay:
        "opacity-100 [background-image:radial-gradient(circle_at_12%_12%,rgb(255_119_214_/_0.38),transparent_18rem),radial-gradient(circle_at_85%_24%,rgb(34_211_238_/_0.35),transparent_24rem),linear-gradient(135deg,rgb(255_235_115_/_0.18),transparent_42%)]",
      heroCard: "border-[#ff9cdf]/50 bg-[#fff1fb]/85",
      panel:
        "border border-[#ffb7e6]/60 bg-[#fff6fd]/90 text-slate-950 shadow-[0_18px_50px_rgb(87_24_69_/_0.22)]",
      panelTitle: "text-[#875173]",
      stat: "bg-[#fff8d6]/85 text-black",
      tabRail: "bg-[#281135]/20",
      tabActive: "bg-[#ffeb73] text-black shadow-sm",
      tabInactive: "text-[#724f80] hover:text-black",
      primaryButton: "bg-[#101827] text-white hover:bg-black",
      secondaryButton: "bg-[#ffe1f3] text-[#251128] hover:bg-white",
      cover:
        "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1400&q=85",
      shell: "bg-[#fff7ec]",
      overlay:
        "bg-[linear-gradient(135deg,rgb(236_72_153_/_0.55),rgb(20_184_166_/_0.35)),linear-gradient(to_top,rgb(0_0_0_/_0.82),transparent)]",
      avatarFrame: "rotate-[-2deg]",
      live: "bg-[#ffeb73] text-black",
      status: "AI online",
      badges: ["top 8 energy", "b2b ai", "design partners"],
      marquee:
        "Maya is building onboarding magic for B2B SaaS teams // feedback, product loops, useful intros",
      playlist: ["Activation Loop FM", "Prototype at Midnight", "Customer Call Static"],
      mood: "Neon founder desk",
      stamp: "shipping in public",
      studio: "bg-[linear-gradient(135deg,#fff5d7,#dff7ff_48%,#ffe4f1)]",
    },
    sofia: {
      ...DEFAULT_PROFILE_THEME,
      page: "border-[#ded5c3]/80 bg-[#f7f4ef] text-slate-950",
      pageOverlay:
        "opacity-100 [background-image:linear-gradient(90deg,rgb(15_23_42_/_0.04)_1px,transparent_1px),linear-gradient(rgb(15_23_42_/_0.04)_1px,transparent_1px)] [background-size:32px_32px]",
      heroCard: "border-[#e2dccf] bg-[#fffdf7]/90",
      panel:
        "border border-[#e5dece] bg-[#fffdf8]/92 text-slate-950 shadow-[0_18px_44px_rgb(87_83_72_/_0.12)]",
      panelTitle: "text-[#8b7c65]",
      stat: "bg-white/78 text-black",
      tabRail: "bg-[#eee8db]",
      tabActive: "bg-[#1f2937] text-white shadow-sm",
      tabInactive: "text-[#827666] hover:text-black",
      primaryButton: "bg-[#1f2937] text-white hover:bg-black",
      secondaryButton: "bg-[#ece6d8] text-[#1f2937] hover:bg-white",
      cover:
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=85",
      shell: "bg-[#f7f4ef]",
      overlay:
        "bg-[linear-gradient(135deg,rgb(15_23_42_/_0.55),rgb(168_85_247_/_0.25)),linear-gradient(to_top,rgb(0_0_0_/_0.78),transparent)]",
      avatarFrame: "rotate-[2deg]",
      live: "bg-white text-black",
      status: "mentor live",
      badges: ["ux critique", "figma", "office hours"],
      marquee: "Sofia reviews onboarding flows, design systems, and AI UX with precise notes",
      playlist: ["First Run Blues", "Wireframe Weather", "Feedback in Stereo"],
      mood: "Studio wall editorial",
      stamp: "sharp critique, warm delivery",
      studio: "bg-[linear-gradient(135deg,#f8f0df,#e8edff_55%,#ffffff)]",
    },
  };

  return themes[profileId] ?? DEFAULT_PROFILE_THEME;
}

function ProfileShowcase({ profile, theme }: { profile: Profile; theme: ProfileTheme }) {
  return (
    <section className={cn("relative overflow-hidden rounded-[1.35rem] p-4 md:p-5", theme.studio)}>
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(#000_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className={cn("min-w-0 rounded-[1rem] p-4 backdrop-blur-xl", theme.panel)}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Visitor profile
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-black">{theme.mood}</h2>
            </div>
            <span className="rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white">
              Read-only view
            </span>
          </div>
          <div className={cn("overflow-hidden rounded-[0.9rem] text-white", theme.profileWindow)}>
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffd166]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#6ee7b7]" />
              <span className="ml-2 truncate text-white/70">
                {profile.full_name.toLowerCase()}.profile
              </span>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-[150px_1fr]">
              <div className="space-y-3">
                <GradientAvatar
                  name={profile.full_name}
                  colorClass={profile.avatar_color}
                  size="xl"
                />
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                    signal
                  </p>
                  <p className="mt-1 text-sm font-semibold">{theme.stamp}</p>
                </div>
              </div>
              <div className="min-w-0">
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="animate-[profile-marquee_16s_linear_infinite] whitespace-nowrap text-sm font-semibold">
                    {theme.marquee}
                  </p>
                </div>
                <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-white/80">
                  {profile.agent.agent_intro || profile.bio}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.interests.slice(0, 5).map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <MiniPanel icon={Music2} title="Profile soundtrack" theme={theme}>
            <ol className="space-y-2 text-sm font-medium">
              {theme.playlist.map((track, index) => (
                <li key={track} className="flex items-center justify-between gap-3">
                  <span className="truncate">{track}</span>
                  <span className="text-xs text-slate-400">0{index + 1}</span>
                </li>
              ))}
            </ol>
          </MiniPanel>
          <MiniPanel icon={Code2} title="Representation rules" theme={theme}>
            <p className="text-sm leading-6 text-slate-600">
              This page separates public profile context from private settings, contact details, and
              agent permissions.
            </p>
          </MiniPanel>
        </div>
      </div>
    </section>
  );
}

function ProfileVibeBoard({
  profile,
  mutuals,
  theme,
}: {
  profile: Profile;
  mutuals: Profile[];
  theme: ProfileTheme;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <div className={cn("rounded-[1.2rem] p-4", theme.panel)}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className={cn("text-sm font-semibold uppercase tracking-[0.18em]", theme.panelTitle)}>
            Top connections
          </h2>
          <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold", theme.live)}>
            Top 8
          </span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {mutuals.slice(0, 8).map((member) => (
            <Link
              key={member.id}
              to="/app/profile/$id"
              params={{ id: member.id }}
              className="group min-w-0 text-center"
            >
              <div className="mx-auto w-fit rounded-[1rem] bg-white/50 p-1 shadow-sm transition-transform group-hover:-translate-y-1">
                <GradientAvatar
                  name={member.full_name}
                  colorClass={member.avatar_color}
                  size="lg"
                />
              </div>
              <p className="mt-2 truncate text-xs font-semibold">
                {member.full_name.split(" ")[0]}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className={cn("relative overflow-hidden rounded-[1.2rem] p-4", theme.panel)}>
        <div className="absolute right-4 top-4 rounded-full border border-current/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">
          Visitor page
        </div>
        <h2 className={cn("text-sm font-semibold uppercase tracking-[0.18em]", theme.panelTitle)}>
          Profile bulletin
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1rem] bg-white/35 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-60">
              Current ask
            </p>
            <p className="mt-2 text-sm font-medium leading-6">{profile.current_ask}</p>
          </div>
          <div className="rounded-[1rem] bg-white/35 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-60">
              Can help with
            </p>
            <p className="mt-2 text-sm font-medium leading-6">{profile.offering}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniPanel({
  icon: Icon,
  title,
  children,
  theme,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  theme: ProfileTheme;
}) {
  return (
    <div className={cn("rounded-[1rem] p-4 backdrop-blur-xl", theme.panel)}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-[0.9rem] bg-black text-[#f7b801]">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className={cn("text-sm font-semibold uppercase tracking-[0.12em]", theme.panelTitle)}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function agentRowToProfile(row: BackendAgentRow | null): Profile | null {
  if (!row) return null;
  const profile = row.profiles;
  const fullName = profile?.full_name || row.name || "Platform member";
  const interests = row.interests || [];
  const skills = row.skills || [];
  const goals = (row.goals || []).filter((goal): goal is Profile["goals"][number] =>
    Object.prototype.hasOwnProperty.call(GOAL_LABELS, goal),
  );

  return {
    id: row.id,
    user_id: row.user_id,
    community_id: profile?.community_id || DEMO_COMMUNITY.id,
    full_name: fullName,
    city: profile?.city || "",
    profession: profile?.profession || "",
    company: profile?.company || "",
    role: (profile?.role as Profile["role"]) || "Builder",
    stage: profile?.stage || "",
    bio: profile?.bio || row.mission || row.intent || "",
    avatar_color: profile?.avatar_color || "from-primary via-agent to-sky-400",
    interests,
    skills,
    goals,
    current_ask: row.intent || row.mission || "",
    offering: profile?.offering || "",
    availability: profile?.availability || "",
    likes: profile?.likes || "",
    dislikes: profile?.dislikes || "",
    topics_enjoy: profile?.topics_enjoy || interests.join(", "),
    topics_avoid: profile?.topics_avoid || "",
    agent: {
      agent_name: row.name || `${fullName.split(" ")[0]} Bee`,
      tone: (row.persona_tone as Profile["agent"]["tone"]) || "Friendly",
      agent_intro: row.agent_intro || row.mission || "",
      current_mission: row.mission || row.intent || "",
      status: row.agent_mode_enabled === false ? "paused" : "active",
      memory: row.memory || [],
    },
    permissions: { ...DEFAULT_PERMISSIONS },
  };
}

function Card({
  title,
  children,
  theme,
}: {
  title?: string;
  children: React.ReactNode;
  theme?: ProfileTheme;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.25rem] p-4 shadow-[var(--app-shadow)] backdrop-blur-xl",
        theme?.panel ?? "app-card",
      )}
    >
      {title && (
        <h2
          className={cn(
            "mb-3 text-sm font-semibold uppercase tracking-[0.12em]",
            theme?.panelTitle ?? "text-[var(--app-muted)]",
          )}
        >
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
