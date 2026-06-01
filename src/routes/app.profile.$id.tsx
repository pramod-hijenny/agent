import { Link, useParams } from "@/lib/navigation";
import { useState } from "react";
import { useUser } from "@/lib/store";
import { DEMO_COMMUNITY, getSeedProfile, SEED_PROFILES } from "@/lib/mock-data";
import { GradientAvatar } from "@/components/Avatar";
import { AgentCard } from "@/components/AgentCard";
import { InterestChips } from "@/components/InterestChips";
import { Button } from "@/components/ui/button";
import { AiBadge } from "@/components/AiBadge";
import { GOAL_LABELS } from "@/lib/types";
import {
  BadgeCheck,
  Briefcase,
  Clock,
  MapPin,
  MessageCircle,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = ["Overview", "Agent", "Connections"] as const;
type Tab = (typeof TABS)[number];

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const user = useUser();
  const profile = id === "me" ? user : getSeedProfile(id);
  const isMe = id === "me";
  const [tab, setTab] = useState<Tab>("Overview");

  if (!profile) return <p className="text-sm text-muted-foreground">Profile not found.</p>;

  const mutuals = SEED_PROFILES.filter((p) => p.id !== profile.id).slice(0, 6);

  return (
    <div className="w-full space-y-4">
      <section className="overflow-hidden rounded-[1.35rem] bg-white shadow-[0_16px_44px_rgb(30_41_59_/_0.1)]">
        <div className="relative h-40 overflow-hidden bg-black md:h-44">
          <img
            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=85"
            alt=""
            className="h-full w-full object-cover opacity-75"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div
            className={`absolute inset-0 bg-gradient-to-br ${profile.avatar_color} opacity-45`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </div>
        <div className="p-4 md:p-5">
          <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="rounded-full bg-white p-1 shadow-xl">
                <GradientAvatar
                  name={profile.full_name}
                  colorClass={profile.avatar_color}
                  size="xl"
                />
              </div>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-black">
                    {profile.full_name}
                  </h1>
                  <BadgeCheck className="h-5 w-5 text-[#4aa3ff]" />
                  <span className="rounded-full bg-black px-3 py-1 text-[10px] font-semibold uppercase text-white">
                    Agent live
                  </span>
                </div>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                  {profile.bio}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-400">
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
                  <Button asChild className="rounded-full bg-black font-semibold">
                    <Link to="/onboarding">Edit profile</Link>
                  </Button>
                  <Button
                    asChild
                    variant="secondary"
                    className="rounded-full bg-slate-100 font-semibold"
                  >
                    <Link to="/app/agent">
                      <Sparkles className="h-4 w-4" /> Edit agent
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button className="rounded-full bg-black font-semibold">
                    <UserPlus className="h-4 w-4" /> Request intro
                  </Button>
                  <Button
                    variant="secondary"
                    className="rounded-full bg-slate-100 font-semibold"
                    asChild
                  >
                    <Link to="/app/discover">
                      <MessageCircle className="h-4 w-4" /> Ask my agent
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <Stat value={profile.stage} label="Stage" />
            <Stat value={profile.skills.slice(0, 2).join(", ")} label="Skills" />
            <Stat value={profile.availability} label="Availability" />
            <Stat value={profile.agent.status === "active" ? "Active" : "Paused"} label="Agent" />
          </div>

          <div className="mt-4 flex gap-1 overflow-x-auto rounded-full bg-slate-100 p-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  tab === t ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-black",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {tab === "Overview" && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            <Card title="Current ask">
              <p className="text-sm leading-6">{profile.current_ask}</p>
            </Card>
            <Card title="Can help with">
              <p className="text-sm leading-6">{profile.offering}</p>
            </Card>
            <Card title="Goals">
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
            <Card title="Skills">
              <InterestChips items={profile.skills} />
            </Card>
            <Card title="Interests">
              <InterestChips items={profile.interests} />
            </Card>
            <Card title="Availability">
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
            <Card title="Agent compatibility">
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
        <Card title={`Community members · ${mutuals.length}`}>
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
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.2rem] bg-slate-100 p-3">
      <p className="truncate text-sm font-semibold leading-tight text-black">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.25rem] bg-white/90 p-4 shadow-[0_14px_36px_rgb(30_41_59_/_0.08)] backdrop-blur-xl">
      {title && (
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
