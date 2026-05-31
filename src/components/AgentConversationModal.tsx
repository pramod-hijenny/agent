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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-[2rem] border-0 bg-white p-0 shadow-[0_32px_90px_rgb(15_23_42_/_0.24)]">
        <div className="relative overflow-hidden bg-black p-6 text-white">
          <img
            src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1000&q=85"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/35" />
          <DialogHeader className="relative">
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Sparkles className="h-5 w-5" />
              Agents talking
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex items-center justify-between rounded-[1.4rem] bg-slate-100 p-3 text-xs">
            <div className="flex items-center gap-2">
              <GradientAvatar
                name={me.agent.agent_name}
                colorClass="from-primary via-agent to-sky-400"
                size="sm"
              />
              <div>
                <p className="font-semibold text-black">{me.agent.agent_name}</p>
                <p className="font-semibold text-slate-500">Represents you</p>
              </div>
            </div>
            <AiBadge label="Agent <-> Agent" />
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="font-semibold text-black">{other.agent.agent_name}</p>
                <p className="font-semibold text-slate-500">
                  Represents {other.full_name.split(" ")[0]}
                </p>
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
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm font-semibold leading-6 ${
                    turn.speaker === "user" ? "bg-slate-100 text-slate-700" : "bg-black text-white"
                  }`}
                >
                  <p
                    className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${
                      turn.speaker === "user" ? "text-slate-400" : "text-white/55"
                    }`}
                  >
                    {turn.speaker === "user" ? me.agent.agent_name : other.agent.agent_name}
                  </p>
                  {turn.text}
                </div>
              </div>
            ))}
            {revealed < transcript.length && (
              <p className="text-center text-xs font-semibold text-slate-400">
                Agents are talking...
              </p>
            )}
          </div>

          {summary && revealed >= transcript.length && (
            <div className="space-y-3 rounded-[1.5rem] bg-[#eef4ff] p-4">
              <h4 className="text-sm font-semibold text-black">Match summary</h4>
              <dl className="grid grid-cols-2 gap-3 text-sm">
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
            <Button variant="ghost" onClick={onReject} className="rounded-full font-semibold">
              <X className="h-4 w-4" /> Reject Match
            </Button>
            <Button onClick={onApprove} className="rounded-full bg-black font-semibold">
              <Check className="h-4 w-4" /> Approve Intro
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="font-semibold text-black">{value}</dd>
    </div>
  );
}
