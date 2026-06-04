import { Sparkles } from "lucide-react";
import { GradientAvatar } from "./Avatar";
import type { Profile } from "@/lib/types";
import { AiBadge } from "./AiBadge";

export function AgentCard({ profile, compact }: { profile: Profile; compact?: boolean }) {
  return (
    <div className="app-card app-card-hover relative overflow-hidden rounded-[1.3rem] p-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_18%_0%,rgb(247_184_1_/_0.28),transparent_18rem),radial-gradient(circle_at_90%_10%,rgb(17_17_17_/_0.1),transparent_20rem)]" />
      <div className="relative flex items-start gap-4">
        <div className="relative">
          <GradientAvatar
            name={profile.agent.agent_name}
            colorClass="from-[#151515] via-[#6d5100] to-[#f7b801]"
            size="lg"
          />
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-[0.65rem] bg-black shadow-sm ring-2 ring-white">
            <Sparkles className="h-3 w-3 text-[#f7b801]" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-black text-black">{profile.agent.agent_name}</h3>
            <AiBadge />
          </div>
          <p className="text-xs font-semibold text-[var(--app-muted)]">
            Represents {profile.full_name} · {profile.city}
          </p>
          {!compact && (
            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--app-ink-soft)]">
              {profile.agent.agent_intro}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="app-chip rounded-full px-3 py-1 font-bold">{profile.agent.tone}</span>
            <span className="rounded-full border border-[#f7b801]/30 bg-[#fff4c8] px-3 py-1 font-bold text-black">
              {profile.agent.status === "active" ? "Active" : "Paused"}
            </span>
          </div>
        </div>
      </div>
      {!compact && (
        <div className="app-soft-panel relative mt-3 rounded-[1rem] p-3">
          <p className="app-kicker">Current mission</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-[var(--app-ink-soft)]">
            {profile.agent.current_mission}
          </p>
        </div>
      )}
    </div>
  );
}
