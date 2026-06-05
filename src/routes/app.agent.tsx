import { useState } from "react";
import { useUser, updateUser, updatePermissions } from "@/lib/store";
import { AgentCard } from "@/components/AgentCard";
import { PermissionToggle } from "@/components/PermissionToggle";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AiBadge } from "@/components/AiBadge";
import {
  Bot,
  Check,
  Loader2,
  Pause,
  Play,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { agentsUpsert, testAgent } from "@/lib/api";
import { getInsforgeAccessToken } from "@/lib/auth";
import {
  RULE_META,
  clearScreenLog,
  evaluateMessage,
  getMyRules,
  getScreenLog,
  politeDecline,
  saveMyRules,
  type AgentRules,
  type RuleKey,
  type ScreenLogEntry,
} from "@/lib/agent-rules";
import type { Profile } from "@/lib/types";
import { toast } from "sonner";

export function AgentPage() {
  const user = useUser();
  const [newMem, setNewMem] = useState("");
  const [saving, setSaving] = useState(false);
  const [chat, setChat] = useState<{ from: "user" | "agent"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  if (!user) return null;

  // Send a sample message to the user's bee and show how it would respond.
  async function sendTest() {
    if (!input.trim() || !user) return;
    const q = input;
    setChat((c) => [...c, { from: "user", text: q }]);
    setInput("");
    setAgentLoading(true);
    try {
      const token = await getInsforgeAccessToken();
      if (!token) throw new Error("Sign in again so your bee can use your session.");
      const result = await testAgent(token, {
        message: q,
        state: { profile: user, permissions: user.permissions },
      });
      const suffix =
        result.source === "llm" ? "" : result.error ? `\n\nBackend note: ${result.error}` : "";
      setChat((c) => [...c, { from: "agent", text: `${result.reply}${suffix}` }]);
    } catch (err) {
      setChat((c) => [
        ...c,
        {
          from: "agent",
          text: err instanceof Error ? err.message : "Agent backend did not respond.",
        },
      ]);
    } finally {
      setAgentLoading(false);
    }
  }

  // Persist the agent config to the backend registry (agents table + embedding).
  async function saveAgent() {
    if (!user) return;
    setSaving(true);
    try {
      const token = await getInsforgeAccessToken();
      if (!token) throw new Error("Sign in again to save your bee.");
      await agentsUpsert(token, {
        name: user.agent.agent_name,
        persona_tone: user.agent.tone,
        agent_intro: user.agent.agent_intro,
        mission: user.agent.current_mission,
        goals: user.goals,
        interests: user.interests,
        skills: user.skills,
        intent: user.current_ask,
        memory: user.agent.memory,
        agent_mode_enabled: user.agent.status === "active",
      });
      toast.success("Your bee is saved to the registry");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your bee");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full space-y-5">
      <section className="app-hero relative overflow-hidden rounded-[1.45rem] p-5 text-white shadow-[0_24px_70px_oklch(0.18_0.035_80_/_0.28)] md:p-6">
        <img
          src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=85"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35 grayscale"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="honeycomb-bg absolute inset-0 opacity-10 mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgb(0_0_0_/_0.92),rgb(0_0_0_/_0.72)_56%,rgb(247_184_1_/_0.32))]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#f7b801]/35 bg-[#f7b801]/15 px-3 py-1.5 text-xs font-black text-[#ffd766] backdrop-blur">
              <Bot className="h-4 w-4" /> AI representative
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">My Bee</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/72">
              Configure the social agent that talks to other agents, remembers context, and drafts
              intros for your approval.
            </p>
          </div>
          <Button
            onClick={() => void saveAgent()}
            disabled={saving}
            className="rounded-[1rem] bg-[#f7b801] font-black text-black hover:bg-[#ffd14a]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{" "}
            Save my Bee
          </Button>
        </div>
      </section>
      <AgentCard profile={user} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Agent memory">
          <div className="space-y-2">
            {user.agent.memory.map((m, i) => (
              <div
                key={i}
                className="app-soft-panel flex items-center gap-2 rounded-[1rem] p-3 text-sm font-semibold text-[var(--app-ink-soft)]"
              >
                <span className="flex-1">{m}</span>
                <button
                  className="app-icon-button flex h-8 w-8 items-center justify-center rounded-[0.8rem] hover:text-white"
                  onClick={() =>
                    updateUser((u) => ({
                      ...u,
                      agent: { ...u.agent, memory: u.agent.memory.filter((_, j) => j !== i) },
                    }))
                  }
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={newMem}
              onChange={(e) => setNewMem(e.target.value)}
              placeholder="Add a memory..."
              className="app-field rounded-[1rem] border-0 font-semibold shadow-none placeholder:text-[var(--app-placeholder)]"
            />
            <Button
              onClick={() => {
                if (!newMem.trim()) return;
                updateUser((u) => ({
                  ...u,
                  agent: { ...u.agent, memory: [...u.agent.memory, newMem.trim()] },
                }));
                setNewMem("");
              }}
              className="rounded-[1rem] bg-black font-black text-[#f7b801] hover:bg-black/90"
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </Panel>

        <Panel title="Permissions">
          <div className="space-y-2">
            <PermissionToggle
              label="Talk to other agents"
              checked={user.permissions.can_talk_to_agents}
              onCheckedChange={(v) => updatePermissions((p) => ({ ...p, can_talk_to_agents: v }))}
            />
            <PermissionToggle
              label="Recommend people"
              checked={user.permissions.can_recommend_people}
              onCheckedChange={(v) => updatePermissions((p) => ({ ...p, can_recommend_people: v }))}
            />
            <PermissionToggle
              label="Draft intro messages"
              checked={user.permissions.can_draft_messages}
              onCheckedChange={(v) => updatePermissions((p) => ({ ...p, can_draft_messages: v }))}
            />
            <PermissionToggle
              sensitive
              label="Send messages without approval"
              checked={user.permissions.can_send_without_approval}
              onCheckedChange={(v) =>
                updatePermissions((p) => ({ ...p, can_send_without_approval: v }))
              }
            />
            <PermissionToggle
              sensitive
              label="Share contact info"
              checked={user.permissions.can_share_email}
              onCheckedChange={(v) =>
                updatePermissions((p) => ({ ...p, can_share_email: v, can_share_phone: v }))
              }
            />
            <PermissionToggle
              sensitive
              label="Schedule meetings"
              checked={user.permissions.can_schedule_meetings}
              onCheckedChange={(v) =>
                updatePermissions((p) => ({ ...p, can_schedule_meetings: v }))
              }
            />
            <PermissionToggle
              label="Discuss professional background"
              checked={user.permissions.can_discuss_professional}
              onCheckedChange={(v) =>
                updatePermissions((p) => ({ ...p, can_discuss_professional: v }))
              }
            />
          </div>
        </Panel>

        <Panel title="Test my Bee">
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {chat.length === 0 && (
              <p className="app-soft-panel rounded-[1rem] p-3 text-sm font-semibold text-[var(--app-muted)]">
                Try: "Find three mentors who can review my onboarding flow"
              </p>
            )}
            {chat.map((m, i) => (
              <div
                key={i}
                className={m.from === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-[1rem] px-3 py-2 text-sm font-semibold ${
                    m.from === "user"
                      ? "bg-black text-[#f7b801]"
                      : "app-soft-panel text-[var(--app-ink-soft)]"
                  }`}
                >
                  {m.from === "agent" && <AiBadge className="mb-1" label={user.agent.agent_name} />}
                  <p>{m.text}</p>
                </div>
              </div>
            ))}
            {agentLoading && (
              <div className="flex justify-start">
                <div className="app-soft-panel inline-flex items-center gap-2 rounded-[1rem] px-3 py-2 text-sm font-semibold text-[var(--app-ink-soft)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Your bee is thinking…
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void sendTest()}
              placeholder="Ask your bee…"
              className="app-field rounded-[1rem] border-0 font-semibold shadow-none placeholder:text-[var(--app-placeholder)]"
            />
            <Button
              onClick={() => void sendTest()}
              disabled={agentLoading}
              className="rounded-[1rem] bg-black font-black text-[#f7b801] hover:bg-black/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Panel>

        <Panel title="Recent activity">
          <ActivityTimeline
            items={[
              { icon: "search", title: "Agent searched your community", time: "2 min ago" },
              { icon: "agent", title: "Agent screened an inbound intro", time: "10 min ago" },
              { icon: "users", title: "Agent recommended 3 intros", time: "1 hr ago" },
              { icon: "check", title: "Agent needs approval on 2 intros", time: "Today" },
            ]}
          />
        </Panel>
      </div>

      <AgentMessageMode user={user} />
    </div>
  );
}

interface InboxTestResult {
  ok: boolean;
  rule?: string;
  reply: string;
}

function AgentMessageMode({ user }: { user: Profile }) {
  const meId = user.user_id || user.id;
  const on = user.agent.status === "active";
  const [rules, setRules] = useState<AgentRules>(() => getMyRules(meId));
  const [wl, setWl] = useState("");
  const [test, setTest] = useState("");
  const [result, setResult] = useState<InboxTestResult | null>(null);
  const [log, setLog] = useState<ScreenLogEntry[]>(() => getScreenLog(meId));

  function setRule(key: RuleKey, value: boolean) {
    const next = { ...rules, [key]: value };
    setRules(next);
    saveMyRules(meId, next);
  }

  function addWhitelist() {
    const name = wl.trim();
    if (!name || rules.whitelist.some((w) => w.toLowerCase() === name.toLowerCase())) {
      setWl("");
      return;
    }
    const next = { ...rules, whitelist: [...rules.whitelist, name] };
    setRules(next);
    saveMyRules(meId, next);
    setWl("");
  }

  function removeWhitelist(name: string) {
    const next = { ...rules, whitelist: rules.whitelist.filter((w) => w !== name) };
    setRules(next);
    saveMyRules(meId, next);
  }

  function toggleMode() {
    updateUser((u) => ({
      ...u,
      agent: { ...u.agent, status: u.agent.status === "active" ? "paused" : "active" },
    }));
  }

  function runTest() {
    const text = test.trim();
    if (!text) return;
    if (!on) {
      setResult({
        ok: true,
        reply: "Agent Message Mode is off — this would be delivered directly.",
      });
      return;
    }
    const verdict = evaluateMessage(text, rules, { senderKnown: true });
    if (verdict.decision === "pass") {
      setResult({ ok: true, reply: "Passes your rules — this would land in your inbox." });
    } else {
      setResult({
        ok: false,
        rule: verdict.label,
        reply: politeDecline(user.agent.tone, {
          ownerFirst: user.full_name.split(" ")[0] || "your",
          ruleLabel: verdict.label || "off-policy",
        }),
      });
    }
  }

  function refreshLog() {
    setLog(getScreenLog(meId));
  }

  return (
    <section className="app-card rounded-[1.35rem] p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-black">
            <ShieldCheck className="h-5 w-5 text-[#ffb020]" /> Agent Message Mode
          </h2>
          <p className="mt-1 max-w-2xl text-sm font-semibold text-[var(--app-muted)]">
            When on, your bee screens inbound DMs against the rules below and auto-declines
            off-policy ones in your tone. Whitelisted people always get through.
          </p>
        </div>
        <Button
          onClick={toggleMode}
          className={
            on
              ? "rounded-[1rem] bg-black font-black text-[#f7b801] hover:bg-black/90"
              : "rounded-[1rem] border border-[var(--app-border)] bg-white font-black text-black hover:bg-[#fff4c8]"
          }
        >
          {on ? (
            <>
              <Pause className="h-4 w-4" /> On — screening
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> Off — turn on
            </>
          )}
        </Button>
      </div>

      <div className={`mt-4 grid gap-4 lg:grid-cols-2 ${on ? "" : "opacity-50"}`}>
        {/* Rules */}
        <div className="space-y-2">
          <p className="text-sm font-black text-black">Rules</p>
          {RULE_META.map((r) => (
            <PermissionToggle
              key={r.key}
              label={r.label}
              description={r.description}
              checked={rules[r.key]}
              onCheckedChange={(v) => setRule(r.key, v)}
            />
          ))}

          <p className="pt-2 text-sm font-black text-black">Whitelist (always allowed)</p>
          <div className="flex gap-2">
            <Input
              value={wl}
              onChange={(e) => setWl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addWhitelist()}
              placeholder="Add a name…"
              className="app-field rounded-[1rem] border-0 font-semibold shadow-none placeholder:text-[var(--app-placeholder)]"
            />
            <Button
              onClick={addWhitelist}
              className="rounded-[1rem] bg-black font-black text-[#f7b801] hover:bg-black/90"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {rules.whitelist.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 rounded-full bg-[#fff4c8] px-3 py-1 text-xs font-bold text-black"
              >
                {name}
                <button onClick={() => removeWhitelist(name)} aria-label={`Remove ${name}`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {rules.whitelist.length === 0 && (
              <span className="text-xs font-semibold text-[var(--app-muted)]">No one yet.</span>
            )}
          </div>
        </div>

        {/* Test inbound */}
        <div className="space-y-2">
          <p className="text-sm font-black text-black">Test an inbound message</p>
          <p className="text-xs font-semibold text-[var(--app-muted)]">
            Paste something someone might send you and see how your bee handles it.
          </p>
          <textarea
            value={test}
            onChange={(e) => setTest(e.target.value)}
            rows={3}
            placeholder="e.g. Hey, buy now — limited offer! Text me at 555-123-4567"
            className="app-field w-full resize-none rounded-[1rem] border-0 p-3 text-sm font-semibold shadow-none outline-none placeholder:text-[var(--app-placeholder)]"
          />
          <Button
            onClick={runTest}
            disabled={!test.trim()}
            className="rounded-[1rem] bg-black font-black text-[#f7b801] hover:bg-black/90"
          >
            Run through my bee
          </Button>
          {result && (
            <div
              className={`rounded-[1rem] border p-3 text-sm font-semibold ${
                result.ok
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide">
                {result.ok ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" /> Delivered
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-3.5 w-3.5" /> Auto-declined · {result.rule}
                  </>
                )}
              </p>
              <p className="mt-1 leading-6">{result.reply}</p>
            </div>
          )}
        </div>
      </div>

      {/* Transparency log */}
      <div className="mt-5 border-t border-[var(--app-border)] pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-black">Transparency log</p>
          {log.length > 0 && (
            <button
              onClick={() => {
                clearScreenLog(meId);
                refreshLog();
              }}
              className="text-xs font-bold text-[var(--app-muted)] hover:text-black"
            >
              Clear
            </button>
          )}
        </div>
        {log.length === 0 ? (
          <p className="mt-2 text-xs font-semibold text-[var(--app-muted)]">
            Nothing held yet. Messages your bee (or someone else's) holds will show here.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {log.slice(0, 8).map((e) => (
              <div key={e.id} className="app-soft-panel rounded-[1rem] p-3">
                <p className="text-xs font-black text-black">
                  {e.direction === "inbound"
                    ? `Your bee held a message from ${e.other_name}`
                    : `${e.other_name}'s bee held your message`}
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    {e.rule_label}
                  </span>
                </p>
                <p className="mt-1 truncate text-xs font-semibold text-[var(--app-muted)]">
                  “{e.text}”
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="app-card rounded-[1.35rem] p-4">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-black">
        <Zap className="h-5 w-5 fill-[#ffb020] text-[#ffb020]" />
        {title}
      </h2>
      {children}
    </div>
  );
}
