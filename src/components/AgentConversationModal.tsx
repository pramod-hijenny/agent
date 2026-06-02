import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GradientAvatar } from "./Avatar";
import { AiBadge } from "./AiBadge";
import { SafetyNotice } from "./SafetyNotice";
import { AlertCircle, Check, Loader2, Sparkles, X } from "lucide-react";
import type { Profile } from "@/lib/types";
import { summarize, type ScoredMatch } from "@/lib/matching";
import { useEffect, useState } from "react";
import { resumeAgentRun, startAgentRun, type AgentRun } from "@/lib/api";
import { getInsforgeAccessToken } from "@/lib/auth";

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
  const [run, setRun] = useState<AgentRun | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const summary = match ? summarize(me, match.profile, match) : null;

  useEffect(() => {
    if (!open || !match) return;
    let cancelled = false;
    async function runAgent() {
      setLoading(true);
      setError("");
      setRun(null);
      setDraftMessage("");
      try {
        const token = await getInsforgeAccessToken();
        if (!token) throw new Error("Sign in again so your agent can use your session.");
        const threadId = `intro-${me.id}-${match.profile.id}-${Date.now()}`;
        const nextRun = await startAgentRun(token, {
          thread_id: threadId,
          workflow: "intro_review",
          state: {
            query,
            profile: me,
            permissions: me.permissions,
            candidates: [match.profile],
          },
        });
        if (cancelled) return;
        const interruptDraft = nextRun.output.__interrupt__?.[0]?.draft_message;
        setRun(nextRun);
        setDraftMessage(interruptDraft || nextRun.output.draft_message || "");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Agent run failed.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void runAgent();
    return () => {
      cancelled = true;
    };
  }, [open, match, me, query]);

  if (!match) return null;
  const other = match.profile;
  const logs = run?.output.logs ?? [];
  const llmError = run?.output.llm_error || run?.error;
  const draftSource = run?.output.draft_source || "pending";

  async function finishAgentRun(approved: boolean) {
    if (!run) return;
    setLoading(true);
    try {
      const token = await getInsforgeAccessToken();
      if (token) {
        await resumeAgentRun(token, run.thread_id, {
          approved,
          edited_message: draftMessage,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not finalize agent run.");
      return;
    } finally {
      setLoading(false);
    }
    if (approved) onApprove(draftMessage);
    else onReject();
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

          <div className="space-y-3">
            {loading && !run && (
              <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calling the backend agent...
              </div>
            )}
            {logs.map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600"
              >
                {item}
              </div>
            ))}
            {draftMessage && (
              <div className="rounded-[1.4rem] bg-black p-4 text-white">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/55">
                    Intro draft
                  </p>
                  <AiBadge label={draftSource === "llm" ? "Generated by LLM" : "Fallback draft"} />
                </div>
                <p className="text-sm font-medium leading-6">{draftMessage}</p>
              </div>
            )}
            {(error || llmError) && (
              <div className="flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error || llmError}</span>
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
            Human approval required before any intro is sent. Your agent cannot share your contact
            info without your consent.
          </SafetyNotice>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => void finishAgentRun(false)}
              disabled={loading || !run}
              className="rounded-full font-semibold"
            >
              <X className="h-4 w-4" /> Reject Match
            </Button>
            <Button
              onClick={() => void finishAgentRun(true)}
              disabled={loading || !draftMessage || !run}
              className="rounded-full bg-black font-semibold"
            >
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
