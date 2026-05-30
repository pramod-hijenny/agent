import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles, UserPlus } from "lucide-react";
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
    <article className="overflow-hidden rounded-[1.7rem] border border-border bg-card shadow-[var(--shadow-card)]">
      <Link to="/app/profile/$id" params={{ id: p.id }} className="block">
        <div className={`h-20 bg-gradient-to-br ${p.avatar_color}`} />
      </Link>
      <div className="-mt-10 flex flex-col gap-4 p-4 pt-0">
        <div className="flex items-end gap-3">
          <Link to="/app/profile/$id" params={{ id: p.id }} className="rounded-full bg-card p-1">
            <GradientAvatar name={p.full_name} colorClass={p.avatar_color} size="lg" />
          </Link>
          <div className="min-w-0 flex-1 pb-1">
            <Link to="/app/profile/$id" params={{ id: p.id }} className="hover:underline">
              <h3 className="truncate text-lg font-black text-foreground">{p.full_name}</h3>
            </Link>
            <p className="text-xs font-medium text-muted-foreground">
              {p.role} · {p.company || p.city}
            </p>
          </div>
          <MatchScoreBadge score={match.score} />
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-foreground/80">{p.current_ask}</p>

        <InterestChips items={p.skills.slice(0, 4)} />

        <div className="rounded-2xl bg-secondary/70 p-3 text-sm text-foreground/75">
          <span className="inline-flex items-center gap-1 font-black text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-agent" /> Why it clicks:
          </span>{" "}
          {match.why}
        </div>

        <div className="rounded-2xl border border-border bg-card p-3 text-sm">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground">
            First conversation
          </p>
          <p className="mt-1 line-clamp-2 text-foreground/80">{match.conversationTopics[0]}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" onClick={onAskAgents} className="rounded-full">
            <MessageCircle className="h-4 w-4" /> Agent chat
          </Button>
          <Button size="sm" variant="secondary" onClick={onRequestIntro} className="rounded-full">
            <UserPlus className="h-4 w-4" /> Intro
          </Button>
        </div>
      </div>
    </article>
  );
}
