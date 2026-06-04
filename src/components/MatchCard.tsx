import { Button } from "@/components/ui/button";
import { BadgeCheck, MessageCircle, Sparkles, UserPlus } from "lucide-react";
import { GradientAvatar } from "./Avatar";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { InterestChips } from "./InterestChips";
import type { ScoredMatch } from "@/lib/matching";
import { Link } from "@/lib/navigation";

export function MatchCard({
  match,
  onAskAgents,
  onRequestIntro,
}: {
  match: ScoredMatch;
  onAskAgents?: () => void;
  onRequestIntro?: () => void;
}) {
  const p = match.profile;
  return (
    <article className="app-card app-card-hover group relative overflow-hidden rounded-[1.3rem]">
      <Link to="/app/profile/$id" params={{ id: p.id }} className="relative z-0 block">
        <div className="relative h-28 overflow-hidden">
          <img
            src={`https://images.unsplash.com/photo-${
              p.id.length % 2 === 0 ? "1517245386807-bb43f82c33c4" : "1556761175-b413da4baf72"
            }?auto=format&fit=crop&w=800&q=85`}
            alt=""
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className={`absolute inset-0 bg-gradient-to-br ${p.avatar_color} opacity-30`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/42 via-transparent to-[#f7b801]/16" />
        </div>
      </Link>
      <div className="relative z-10 -mt-9 flex flex-col gap-3 p-4 pt-0">
        <div className="relative flex items-end gap-3 rounded-[1.05rem] bg-white/95 px-3 pb-2 pt-3 shadow-[0_10px_24px_rgb(15_23_42_/_0.08)] ring-1 ring-white/80 backdrop-blur-md">
          <Link
            to="/app/profile/$id"
            params={{ id: p.id }}
            className="relative z-20 -ml-1 -mt-8 rounded-[1.2rem] bg-white p-1 shadow-[0_8px_22px_rgb(15_23_42_/_0.12)] ring-4 ring-white"
          >
            <GradientAvatar name={p.full_name} colorClass={p.avatar_color} size="lg" />
          </Link>
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex items-center gap-1.5">
              <Link to="/app/profile/$id" params={{ id: p.id }} className="hover:underline">
                <h3 className="truncate text-lg font-black text-black">{p.full_name}</h3>
              </Link>
              <BadgeCheck className="h-4 w-4 text-[#f7b801]" />
            </div>
            <p className="text-xs font-semibold text-[var(--app-muted)]">
              {p.role} · {p.company || p.city}
            </p>
          </div>
          <MatchScoreBadge score={match.score} />
        </div>

        <p className="line-clamp-2 text-sm font-semibold leading-6 text-[var(--app-ink-soft)]">
          {p.current_ask}
        </p>

        <InterestChips items={p.skills.slice(0, 4)} />

        <div className="app-soft-panel rounded-[1rem] p-3 text-sm font-semibold text-[var(--app-ink-soft)]">
          <span className="inline-flex items-center gap-1 font-black text-black">
            <Sparkles className="h-3.5 w-3.5" /> Why it clicks:
          </span>{" "}
          {match.why}
        </div>

        <div className="rounded-[1rem] border border-[#f7b801]/20 bg-[#fff8dc] p-3 text-sm">
          <p className="app-kicker">First conversation</p>
          <p className="mt-1 line-clamp-2 font-semibold text-[var(--app-ink-soft)]">
            {match.conversationTopics[0]}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            onClick={onAskAgents}
            className="rounded-full bg-black font-black text-[#f7b801] hover:bg-black/90"
          >
            <MessageCircle className="h-4 w-4" /> Agent chat
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onRequestIntro}
            className="rounded-full bg-[#fff4c8] font-black text-black hover:bg-[#ffe69b]"
          >
            <UserPlus className="h-4 w-4" /> Intro
          </Button>
        </div>
      </div>
    </article>
  );
}
