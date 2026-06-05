import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@/lib/store";
import { useParams, Link, useNavigate } from "@/lib/navigation";
import { getSeedProfile } from "@/lib/mock-data";
import { GradientAvatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import {
  appendCannedReply,
  getConversations,
  getThread,
  sendDirectMessage,
  type DirectMessage,
} from "@/lib/direct-messages";
import { getMyRules } from "@/lib/agent-rules";
import { ArrowLeft, Inbox, Send, ShieldAlert, ShieldCheck, Sparkles, Wand2 } from "lucide-react";

export function MessagesPage() {
  const user = useUser();
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const meId = user ? user.user_id || user.id : "me";
  const active = id ? getSeedProfile(id) : null;
  const myAgentOn = user?.agent.status === "active";

  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  // `tick` intentionally forces a re-read of localStorage after sends/replies.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const conversations = useMemo(() => getConversations(meId), [meId, tick]);
  const thread = useMemo(
    () => (active ? getThread(meId, active.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meId, id, tick],
  );

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length, id]);

  if (!user) return null;

  function send() {
    if (!active) return;
    const text = input.trim();
    if (!text) return;
    const msg = sendDirectMessage(meId, active, text, !!myAgentOn);
    setInput("");
    refresh();
    // A delivered message gets a canned reply so the thread feels alive. The
    // reply is screened by YOUR bee (your inbox rules) before it reaches you.
    if (msg.status === "delivered") {
      const recipient = active;
      window.setTimeout(() => {
        appendCannedReply(meId, recipient, { rules: getMyRules(meId), agentOn: !!myAgentOn });
        refresh();
      }, 1200);
    }
  }

  const flow = active
    ? myAgentOn && active.agent.status === "active"
      ? { label: "Both bees on · You → your bee → their bee → them", icon: "both" as const }
      : myAgentOn
        ? { label: "Your bee on · adds context, no filter on their side", icon: "sender" as const }
        : active.agent.status === "active"
          ? {
              label: `${active.full_name.split(" ")[0]}'s bee on · screening what you send`,
              icon: "recipient" as const,
            }
          : { label: "No bees on · direct message", icon: "off" as const }
    : null;

  return (
    <div className="w-full space-y-5">
      <section className="app-hero relative overflow-hidden rounded-[1.45rem] p-5 text-white shadow-[0_24px_70px_oklch(0.18_0.035_80_/_0.28)] md:p-6">
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgb(0_0_0_/_0.92),rgb(0_0_0_/_0.72)_56%,rgb(247_184_1_/_0.32))]" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#f7b801]/35 bg-[#f7b801]/15 px-3 py-1.5 text-xs font-black text-[#ffd766]">
            <Send className="h-4 w-4" /> Messages
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Direct messages</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/72">
            Message anyone in the community. When their bee is on, it screens what you send and
            holds anything off-policy with a suggested rewrite.
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Conversation list */}
        <div className={active ? "hidden lg:block" : "block"}>
          <div className="app-card rounded-[1.35rem] p-3">
            <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-black text-black">
              <Inbox className="h-4 w-4" /> Conversations
            </h2>
            <div className="space-y-1">
              {conversations.map(({ other, last, unreadFromThem }) => (
                <Link
                  key={other.id}
                  to="/app/messages/$id"
                  params={{ id: other.id }}
                  className={`flex items-center gap-3 rounded-[1rem] p-2.5 transition ${
                    active?.id === other.id ? "bg-[#fff4c8]" : "hover:bg-[#fff8e1]"
                  }`}
                >
                  <GradientAvatar
                    name={other.full_name}
                    colorClass={other.avatar_color}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-black">{other.full_name}</p>
                      {unreadFromThem > 0 && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#f7b801]" />
                      )}
                    </div>
                    <p className="truncate text-xs font-semibold text-[var(--app-muted)]">
                      {last
                        ? `${last.from === "me" ? "You: " : ""}${last.status === "declined" ? "Held by their bee" : last.text}`
                        : "Start a conversation"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Thread */}
        <div className={active ? "block" : "hidden lg:block"}>
          {!active ? (
            <div className="app-card flex h-full min-h-[420px] items-center justify-center rounded-[1.35rem] p-6 text-center text-sm font-semibold text-[var(--app-muted)]">
              Pick a conversation to start messaging.
            </div>
          ) : (
            <div className="app-card flex min-h-[60vh] flex-col rounded-[1.35rem] p-0">
              {/* Thread header */}
              <div className="flex items-center gap-3 border-b border-[var(--app-border)] p-3">
                <button
                  onClick={() => navigate({ to: "/app/messages" })}
                  className="app-icon-button flex h-9 w-9 items-center justify-center rounded-[0.8rem] lg:hidden"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <Link
                  to="/app/profile/$id"
                  params={{ id: active.id }}
                  className="flex items-center gap-3"
                >
                  <GradientAvatar
                    name={active.full_name}
                    colorClass={active.avatar_color}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-black text-black">{active.full_name}</p>
                    <p
                      className={`inline-flex items-center gap-1 text-xs font-bold ${
                        active.agent.status === "active"
                          ? "text-emerald-600"
                          : "text-[var(--app-muted)]"
                      }`}
                    >
                      {active.agent.status === "active" ? (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5" /> {active.agent.agent_name} is
                          screening
                        </>
                      ) : (
                        <>Agent off · direct delivery</>
                      )}
                    </p>
                  </div>
                </Link>
              </div>

              {/* Agent Message Mode flow indicator */}
              {flow && (
                <div
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-bold ${
                    flow.icon === "off"
                      ? "bg-slate-50 text-slate-500"
                      : "bg-[#fff8e1] text-[#9a6b00]"
                  }`}
                >
                  {flow.icon === "off" ? (
                    <Send className="h-3.5 w-3.5" />
                  ) : flow.icon === "both" ? (
                    <Sparkles className="h-3.5 w-3.5" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  )}
                  {flow.label}
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {thread.length === 0 && (
                  <p className="app-soft-panel rounded-[1rem] p-3 text-center text-sm font-semibold text-[var(--app-muted)]">
                    Say hi to {active.full_name.split(" ")[0]}.
                  </p>
                )}
                {thread.map((m) => (
                  <MessageBubble
                    key={m.id}
                    m={m}
                    otherName={active.full_name}
                    onUseRewrite={(text) => setInput(text)}
                  />
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Composer */}
              <div className="border-t border-[var(--app-border)] p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    placeholder={`Message ${active.full_name.split(" ")[0]}…`}
                    className="app-field max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-[1rem] border-0 px-4 py-3 text-sm font-semibold shadow-none outline-none placeholder:text-[var(--app-placeholder)]"
                  />
                  <Button
                    onClick={send}
                    disabled={!input.trim()}
                    className="h-11 rounded-[1rem] bg-black px-4 font-black text-[#f7b801] hover:bg-black/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  m,
  otherName,
  onUseRewrite,
}: {
  m: DirectMessage;
  otherName: string;
  onUseRewrite: (text: string) => void;
}) {
  const mine = m.from === "me";
  const otherFirst = otherName.split(" ")[0];

  if (m.status === "declined") {
    // Auto-declined outbound: only the sender sees it; it was NOT delivered.
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] space-y-2">
          <div className="rounded-[1.1rem] rounded-br-sm bg-slate-100 px-3 py-2 text-sm font-medium leading-6 text-slate-500 line-through decoration-slate-400">
            {m.text}
          </div>
          <div className="rounded-[1.1rem] border border-amber-200 bg-amber-50 p-3 text-left">
            <p className="flex items-center gap-1.5 text-xs font-black text-amber-700">
              <ShieldAlert className="h-3.5 w-3.5" /> Auto-declined by {otherFirst}'s bee
              {m.matched_rule && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px]">
                  {m.matched_rule}
                </span>
              )}
            </p>
            <p className="mt-1 text-xs font-semibold italic leading-5 text-amber-800">
              {m.decline_reason}
            </p>
            {m.rewrite && (
              <div className="mt-2 rounded-[0.8rem] bg-white p-2.5">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                  Suggested rewrite
                </p>
                <p className="mt-1 text-sm font-medium leading-6 text-black">{m.rewrite}</p>
                <Button
                  onClick={() => onUseRewrite(m.rewrite as string)}
                  className="mt-2 h-8 rounded-full bg-black px-3 text-xs font-black text-[#f7b801] hover:bg-black/90"
                >
                  <Wand2 className="h-3.5 w-3.5" /> Use this
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={mine ? "flex flex-col items-end" : "flex flex-col items-start"}>
      <div
        className={`max-w-[80%] rounded-[1.1rem] px-3 py-2 text-sm font-medium leading-6 ${
          mine
            ? "rounded-br-sm bg-black text-white"
            : "app-soft-panel rounded-bl-sm text-[var(--app-ink-soft)]"
        }`}
      >
        {m.text}
      </div>
      {mine && m.context_note && (
        <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#9a6b00]">
          <Sparkles className="h-3 w-3" /> {m.context_note}
        </p>
      )}
    </div>
  );
}
