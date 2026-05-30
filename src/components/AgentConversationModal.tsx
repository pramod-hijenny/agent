import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GradientAvatar } from "./Avatar";
import { AiBadge } from "./AiBadge";
import { SafetyNotice } from "./SafetyNotice";
import { Check, X, Sparkles } from "lucide-react";
import type { Profile } from "@/lib/types";
import { generateTranscript, summarize, type ScoredMatch } from "@/lib/matching";
import { useEffect, useState } from "react";

export function AgentConversationModal({
  open,
  onOpenChange,
  me,
  match,
  query,
  onApprove,
  onReject,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  me: Profile;
  match: ScoredMatch | null;
  query: string;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [revealed, setRevealed] = useState(0);
  const transcript = match ? generateTranscript(me, match.profile, query) : [];
  const summary = match ? summarize(me, match.profile, match) : null;

  useEffect(() => {
    if (!open || !match) return;
    setRevealed(0);
    const id = setInterval(() => {
      setRevealed((r) => {
        if (r >= transcript.length) {
          clearInterval(id);
          return r;
        }
        return r + 1;
      });
    }, 700);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, match?.profile.id]);

  if (!match) return null;
  const other = match.profile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-agent" />
            Agents talking
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-xl bg-secondary/60 p-3 text-xs">
          <div className="flex items-center gap-2">
            <GradientAvatar
              name={me.agent.agent_name}
              colorClass="from-primary via-agent to-sky-400"
              size="sm"
            />
            <div>
              <p className="font-medium text-foreground">{me.agent.agent_name}</p>
              <p className="text-muted-foreground">Represents you</p>
            </div>
          </div>
          <AiBadge label="Agent <-> Agent" />
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="font-medium text-foreground">{other.agent.agent_name}</p>
              <p className="text-muted-foreground">Represents {other.full_name.split(" ")[0]}</p>
            </div>
            <GradientAvatar
              name={other.agent.agent_name}
              colorClass={other.avatar_color}
              size="sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          {transcript.slice(0, revealed).map((turn, i) => (
            <div
              key={i}
              className={`flex ${turn.speaker === "user" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  turn.speaker === "user"
                    ? "bg-primary/10 text-foreground"
                    : "bg-agent-soft text-foreground"
                }`}
              >
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {turn.speaker === "user" ? me.agent.agent_name : other.agent.agent_name}
                </p>
                {turn.text}
              </div>
            </div>
          ))}
          {revealed < transcript.length && (
            <p className="text-center text-xs text-muted-foreground">Agents are talking…</p>
          )}
        </div>

        {summary && revealed >= transcript.length && (
          <div className="space-y-3 rounded-2xl border border-border bg-secondary/40 p-4">
            <h4 className="text-sm font-semibold text-foreground">Match summary</h4>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <SummaryRow label="Match strength" value={summary.match_strength} />
              <SummaryRow label="Best connection" value={summary.best_connection_type} />
              <SummaryRow label="Mutual value" value={summary.mutual_value} />
              <SummaryRow label="Conversation starter" value={summary.conversation_starter} />
              <SummaryRow label="Suggested activity" value={summary.suggested_activity} />
            </dl>
          </div>
        )}

        <SafetyNotice>
          Human approval required before any intro is sent. Your agent cannot share your contact
          info without your consent.
        </SafetyNotice>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onReject} className="rounded-xl">
            <X className="h-4 w-4" /> Reject Match
          </Button>
          <Button onClick={onApprove} className="rounded-xl">
            <Check className="h-4 w-4" /> Approve Intro
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
