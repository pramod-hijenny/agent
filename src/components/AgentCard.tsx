import { Sparkles } from "lucide-react";
import { GradientAvatar } from "./Avatar";
import type { Profile } from "@/lib/types";
import { AiBadge } from "./AiBadge";

export function AgentCard({ profile, compact }: { profile: Profile; compact?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-[1.25rem] bg-white/90 p-4 shadow-[0_14px_36px_rgb(30_41_59_/_0.08)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_18%_0%,#ffb6d5,transparent_18rem),radial-gradient(circle_at_90%_10%,#b8e5ff,transparent_20rem)] opacity-70" />
      <div className="relative flex items-start gap-4">
        <div className="relative">
          <GradientAvatar
            name={profile.agent.agent_name}
            colorClass="from-primary via-agent to-sky-400"
            size="lg"
          />
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black shadow-sm ring-2 ring-white">
            <Sparkles className="h-3 w-3 text-white" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-black">
              {profile.agent.agent_name}
            </h3>
            <AiBadge />
          </div>
          <p className="text-xs font-medium text-slate-400">
            Represents {profile.full_name} · {profile.city}
          </p>
          {!compact && (
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {profile.agent.agent_intro}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
              {profile.agent.tone}
            </span>
            <span className="rounded-full bg-[#ddfff3] px-3 py-1 font-semibold text-[#047857]">
              {profile.agent.status === "active" ? "Active" : "Paused"}
            </span>
          </div>
        </div>
      </div>
      {!compact && (
        <div className="relative mt-3 rounded-[1rem] bg-slate-100 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Current mission
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
            {profile.agent.current_mission}
          </p>
        </div>
      )}
    </div>
  );
}
