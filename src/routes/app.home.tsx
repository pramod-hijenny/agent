import { Link } from "@/lib/navigation";
import { useIntros, useUser } from "@/lib/store";
import { GradientAvatar } from "@/components/Avatar";
import { AiBadge } from "@/components/AiBadge";
import { DEMO_COMMUNITY, SEED_PROFILES } from "@/lib/mock-data";
import { scoreMatches } from "@/lib/matching";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export function Home() {
  const user = useUser();
  const intros = useIntros();
  if (!user) return null;

  const pending = intros.filter((i) => i.status === "pending");
  const matches = scoreMatches(user, {
    query: user.current_ask,
    city: user.city,
    limit: 3,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="grid gap-6 p-6 md:grid-cols-[1fr_320px] md:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Users className="h-3.5 w-3.5" />
              {DEMO_COMMUNITY.name}
            </div>
            <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight tracking-tight md:text-4xl">
              Find three useful people before another cold outreach attempt.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              Your agent uses your current ask, skills, goals, and community context to recommend
              high-intent intros you can approve.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/app/discover"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Find 3 people <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/app/agent"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary"
              >
                Tune agent <Sparkles className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/50 p-4">
            <div className="flex items-center gap-3">
              <GradientAvatar name={user.full_name} colorClass={user.avatar_color} size="lg" />
              <div>
                <p className="font-black">{user.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {user.role} · {user.stage}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-card p-3">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                Current ask
              </p>
              <p className="mt-1 text-sm leading-6">{user.current_ask}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="space-y-4">
          {pending.length > 0 && (
            <Link
              to="/app/inbox"
              className="flex items-center gap-3 rounded-[1.5rem] border border-agent/25 bg-agent-soft/80 p-4 shadow-[var(--shadow-card)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-agent text-agent-foreground">
                <Send className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-black">{pending.length} intro waiting</p>
                <p className="truncate text-sm text-muted-foreground">
                  Review the message your agent drafted.
                </p>
              </div>
            </Link>
          )}

          <section className="rounded-[1.7rem] border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-black">Recommended this week</h2>
                <p className="text-sm text-muted-foreground">
                  Three members ranked for your current ask.
                </p>
              </div>
              <Link to="/app/discover" className="text-xs font-bold text-primary hover:underline">
                Refine
              </Link>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {matches.map((match) => (
                <Link
                  key={match.profile.id}
                  to="/app/profile/$id"
                  params={{ id: match.profile.id }}
                  className="rounded-2xl border border-border bg-secondary/40 p-3 hover:bg-secondary"
                >
                  <GradientAvatar
                    name={match.profile.full_name}
                    colorClass={match.profile.avatar_color}
                  />
                  <p className="mt-2 truncate text-sm font-black">{match.profile.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {match.profile.role} · {match.profile.company}
                  </p>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-foreground/75">
                    {match.why}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[1.7rem] border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <h2 className="font-black">Recent agent activity</h2>
            <div className="mt-3 space-y-3 text-sm">
              <Activity icon={Compass} text="Ranked members for your current ask" time="Now" />
              <Activity icon={Sparkles} text="Prepared structured match reasons" time="Today" ai />
              <Activity
                icon={ShieldCheck}
                text="Kept contact sharing blocked by default"
                time="Today"
              />
              <Activity
                icon={CheckCircle2}
                text="Agent is active and approval-gated"
                time="Today"
              />
            </div>
          </section>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[1.7rem] border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <h2 className="font-black">Community snapshot</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Metric label="Members" value={SEED_PROFILES.length.toString()} />
              <Metric label="Your role" value={user.role} />
              <Metric label="Agent" value={user.agent.status === "active" ? "Active" : "Paused"} />
              <Metric label="Approval" value="Required" />
            </div>
          </section>

          <section className="rounded-[1.7rem] border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <h2 className="font-black">What your agent knows</h2>
            <div className="mt-3 space-y-2">
              {user.agent.memory.slice(0, 4).map((memory) => (
                <div key={memory} className="rounded-xl bg-secondary/60 p-3 text-sm leading-5">
                  <AiBadge className="mb-1" label="Memory" />
                  <p>{memory}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/60 p-3">
      <p className="text-[11px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function Activity({
  icon: Icon,
  text,
  time,
  ai,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  time: string;
  ai?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 p-3">
      <Icon className="h-4 w-4 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="leading-5">{text}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
      {ai && <AiBadge label="AI" />}
    </div>
  );
}
