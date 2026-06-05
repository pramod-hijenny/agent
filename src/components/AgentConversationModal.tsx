import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GradientAvatar } from "./Avatar";
import { AiBadge } from "./AiBadge";
import { SafetyNotice } from "./SafetyNotice";
import { AlertCircle, Check, Loader2, Sparkles, X } from "lucide-react";
import type { Profile } from "@/lib/types";
import { generateTranscript, summarize, type ScoredMatch } from "@/lib/matching";
import { useEffect, useState } from "react";
import { messageApprove, messageCreate } from "@/lib/api";
import { getInsforgeAccessToken } from "@/lib/auth";

// Drives the intro flow against the FastAPI backend: messageCreate (the sender's
// agent drafts an intro, state=requested) → the human edits/approves →
// messageApprove (the recipient's agent screens it: approved or declined).
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
  onApprove: (draftMessage?: string) => void;
  onReject: () => void;
}) {
  const [messageId, setMessageId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [draftSource, setDraftSource] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState<"approved" | "declined" | null>(null);
  const [outcomeReason, setOutcomeReason] = useState("");
  const [revealed, setRevealed] = useState(0);
  const summary = match ? summarize(me, match.profile, match) : null;
  const transcript = match ? generateTranscript(me, match.profile, query) : [];
  const chatDone = revealed >= transcript.length;

  useEffect(() => {
    if (!open || !match) return;
    const activeMatch = match;
    let cancelled = false;
    async function draft() {
      setLoading(true);
      setError("");
      setMessageId(null);
      setDraftMessage("");
      setOutcome(null);
      setOutcomeReason("");
      try {
        const token = await getInsforgeAccessToken();
        if (!token) throw new Error("Sign in again so your agent can use your session.");
        const res = await messageCreate(token, {
          to_agent_id: activeMatch.profile.id,
          kind: "intro",
          context: { need: query, from: me.full_name },
        });
        if (cancelled) return;
        setMessageId(res.message.id);
        setDraftMessage(res.message.body || "");
        setDraftSource(res.draft_source || "llm");
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not draft the intro.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void draft();
    return () => {
      cancelled = true;
    };
  }, [open, match, me, query]);

  // Reveal the agent-to-agent conversation one turn at a time, then unlock the
  // real intro draft below it.
  useEffect(() => {
    if (!open || !match) return;
    setRevealed(0);
    const total = transcript.length;
    const id = setInterval(() => {
      setRevealed((r) => {
        if (r >= total) {
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

  async function approveIntro() {
    if (!messageId) return;
    setLoading(true);
    setError("");
    try {
      const token = await getInsforgeAccessToken();
      if (!token) throw new Error("Sign in again so your agent can use your session.");
      const res = await messageApprove(token, messageId, draftMessage);
      setOutcome(res.outcome);
      setOutcomeReason(res.reason);
      if (res.outcome === "approved") onApprove(draftMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the intro.");
    } finally {
      setLoading(false);
    }
  }

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

          {/* Animated agent-to-agent conversation */}
          <div className="space-y-2">
            {transcript.slice(0, revealed).map((turn, i) => (
              <div
                key={i}
                className={`flex ${turn.speaker === "user" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] rounded-[1.1rem] px-3 py-2 text-sm font-medium leading-6 ${
                    turn.speaker === "user" ? "bg-slate-100 text-black" : "bg-[#fff4c8] text-black"
                  }`}
                >
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {turn.speaker === "user" ? me.agent.agent_name : other.agent.agent_name}
                  </p>
                  {turn.text}
                </div>
              </div>
            ))}
            {!chatDone && (
              <p className="flex items-center justify-center gap-2 py-1 text-center text-xs font-semibold text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Agents are talking…
              </p>
            )}
          </div>

          {/* Real intro flow — unlocked once the conversation has played */}
          {chatDone && (
            <>
              <div className="space-y-3">
                {loading && !draftMessage && (
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Your agent is drafting an intro...
                  </div>
                )}
                {draftMessage && (
                  <div className="rounded-[1.4rem] bg-black p-4 text-white">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/55">
                        Intro draft (editable)
                      </p>
                      <AiBadge
                        label={draftSource === "llm" ? "Generated by LLM" : "Fallback draft"}
                      />
                    </div>
                    <textarea
                      value={draftMessage}
                      onChange={(e) => setDraftMessage(e.target.value)}
                      disabled={outcome !== null}
                      rows={4}
                      className="w-full resize-none rounded-xl bg-white/10 p-3 text-sm font-medium leading-6 text-white outline-none ring-1 ring-white/15 focus:ring-white/40"
                    />
                  </div>
                )}
                {outcome === "approved" && (
                  <div className="flex items-start gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Approved by {other.full_name.split(" ")[0]}'s agent. {outcomeReason}
                    </span>
                  </div>
                )}
                {outcome === "declined" && (
                  <div className="flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      {other.full_name.split(" ")[0]}'s agent declined: {outcomeReason}
                    </span>
                  </div>
                )}
                {error && (
                  <div className="flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {summary && draftMessage && (
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
                Human approval required before any intro is sent. Your agent cannot share your
                contact info without your consent.
              </SafetyNotice>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    onReject();
                    onOpenChange(false);
                  }}
                  disabled={loading}
                  className="rounded-full font-semibold"
                >
                  <X className="h-4 w-4" /> {outcome ? "Close" : "Reject Match"}
                </Button>
                <Button
                  onClick={() => void approveIntro()}
                  disabled={loading || !draftMessage || !messageId || outcome !== null}
                  className="rounded-full bg-black font-semibold"
                >
                  <Check className="h-4 w-4" /> Send Intro
                </Button>
              </div>
            </>
          )}
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
