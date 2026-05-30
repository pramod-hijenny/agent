import { Sparkles } from "lucide-react";
import { GradientAvatar } from "./Avatar";
import type { Profile } from "@/lib/types";
import { AiBadge } from "./AiBadge";

export function AgentCard({ profile, compact }: { profile: Profile; compact?: boolean }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-agent/20 bg-card p-5"
      style={{ boxShadow: "var(--shadow-agent)" }}
    >
      <div
        className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-agent)" }}
      />
      <div className="relative flex items-start gap-4">
        <div className="relative">
          <GradientAvatar
            name={profile.agent.agent_name}
            colorClass="from-primary via-agent to-sky-400"
            size="lg"
          />
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-agent/30">
            <Sparkles className="h-3 w-3 text-agent" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-foreground">
              {profile.agent.agent_name}
            </h3>
            <AiBadge />
          </div>
          <p className="text-xs text-muted-foreground">
            Represents {profile.full_name} · {profile.city}
          </p>
          {!compact && (
            <p className="mt-2 text-sm text-foreground/80">{profile.agent.agent_intro}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
              {profile.agent.tone}
            </span>
            <span className="rounded-full bg-success-soft px-2 py-0.5 font-medium text-success">
              {profile.agent.status === "active" ? "Active" : "Paused"}
            </span>
          </div>
        </div>
      </div>
      {!compact && (
        <div className="relative mt-4 rounded-xl bg-secondary/60 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Current mission
          </p>
          <p className="mt-1 text-sm text-foreground">{profile.agent.current_mission}</p>
        </div>
      )}
    </div>
  );
}
