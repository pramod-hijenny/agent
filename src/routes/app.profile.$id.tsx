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
import { Briefcase, Clock, MapPin, MessageCircle, Sparkles, UserPlus, Users } from "lucide-react";
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
    <div className="mx-auto max-w-5xl space-y-4">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className={`h-32 bg-gradient-to-br ${profile.avatar_color}`} />
        <div className="p-5">
          <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="rounded-full bg-card p-1">
                <GradientAvatar
                  name={profile.full_name}
                  colorClass={profile.avatar_color}
                  size="xl"
                />
              </div>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight">{profile.full_name}</h1>
                  <span className="rounded-full bg-agent-soft px-2 py-0.5 text-[10px] font-semibold uppercase text-agent">
                    Agent live
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground/80">{profile.bio}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
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
                  <Button asChild className="rounded-xl">
                    <Link to="/onboarding">Edit profile</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link to="/app/agent">
                      <Sparkles className="h-4 w-4" /> Edit agent
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button className="rounded-xl">
                    <UserPlus className="h-4 w-4" /> Request intro
                  </Button>
                  <Button variant="outline" className="rounded-xl" asChild>
                    <Link to="/app/discover">
                      <MessageCircle className="h-4 w-4" /> Ask my agent
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-4">
            <Stat value={profile.stage} label="Stage" />
            <Stat value={profile.skills.slice(0, 2).join(", ")} label="Skills" />
            <Stat value={profile.availability} label="Availability" />
            <Stat value={profile.agent.status === "active" ? "Active" : "Paused"} label="Agent" />
          </div>

          <div className="mt-4 flex gap-1 overflow-x-auto border-b border-border">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                  tab === t
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
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
    <div className="rounded-xl border border-border bg-secondary/40 p-3">
      <p className="truncate text-sm font-semibold leading-tight">{value}</p>
      <p className="mt-1 text-[11px] uppercase text-muted-foreground">{label}</p>
    </div>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      {title && <h2 className="mb-3 text-sm font-semibold">{title}</h2>}
      {children}
    </div>
  );
}
