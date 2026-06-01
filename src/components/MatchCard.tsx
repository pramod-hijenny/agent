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
    <article className="group relative overflow-hidden rounded-[1.25rem] bg-white shadow-[0_14px_36px_rgb(30_41_59_/_0.08)] transition duration-300 hover:-translate-y-0.5">
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
          <div className={`absolute inset-0 bg-gradient-to-br ${p.avatar_color} opacity-45`} />
        </div>
      </Link>
      <div className="relative z-10 -mt-9 flex flex-col gap-3 p-4 pt-0">
        <div className="relative flex items-end gap-3 rounded-[1rem] bg-white/95 px-3 pb-2 pt-3 shadow-[0_10px_24px_rgb(15_23_42_/_0.08)] ring-1 ring-white/80 backdrop-blur-md">
          <Link
            to="/app/profile/$id"
            params={{ id: p.id }}
            className="relative z-20 -ml-1 -mt-8 rounded-full bg-white p-1 shadow-[0_8px_22px_rgb(15_23_42_/_0.12)] ring-4 ring-white"
          >
            <GradientAvatar name={p.full_name} colorClass={p.avatar_color} size="lg" />
          </Link>
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex items-center gap-1.5">
              <Link to="/app/profile/$id" params={{ id: p.id }} className="hover:underline">
                <h3 className="truncate text-lg font-bold text-black">{p.full_name}</h3>
              </Link>
              <BadgeCheck className="h-4 w-4 text-[#4aa3ff]" />
            </div>
            <p className="text-xs font-medium text-slate-400">
              {p.role} · {p.company || p.city}
            </p>
          </div>
          <MatchScoreBadge score={match.score} />
        </div>

        <p className="line-clamp-2 text-sm font-medium leading-6 text-slate-600">{p.current_ask}</p>

        <InterestChips items={p.skills.slice(0, 4)} />

        <div className="rounded-[1rem] bg-slate-100 p-3 text-sm font-medium text-slate-600">
          <span className="inline-flex items-center gap-1 font-semibold text-black">
            <Sparkles className="h-3.5 w-3.5" /> Why it clicks:
          </span>{" "}
          {match.why}
        </div>

        <div className="rounded-[1rem] bg-[#eef4ff] p-3 text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            First conversation
          </p>
          <p className="mt-1 line-clamp-2 font-medium text-slate-700">
            {match.conversationTopics[0]}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" onClick={onAskAgents} className="rounded-full bg-black font-semibold">
            <MessageCircle className="h-4 w-4" /> Agent chat
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onRequestIntro}
            className="rounded-full bg-slate-100 font-semibold"
          >
            <UserPlus className="h-4 w-4" /> Intro
          </Button>
        </div>
      </div>
    </article>
  );
}
