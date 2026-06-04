import { useState } from "react";
import { useUser, updateUser, updatePermissions } from "@/lib/store";
import { AgentCard } from "@/components/AgentCard";
import { PermissionToggle } from "@/components/PermissionToggle";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AiBadge } from "@/components/AiBadge";
import { Bot, Loader2, Pause, Play, Send, Plus, Trash2, Zap } from "lucide-react";
import { testAgent } from "@/lib/api";
import { getInsforgeAccessToken } from "@/lib/auth";

export function AgentPage() {
  const user = useUser();
  const [newMem, setNewMem] = useState("");
  const [chat, setChat] = useState<{ from: "user" | "agent"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  if (!user) return null;

  async function sendTest() {
    if (!input.trim() || !user) return;
    const q = input;
    setChat((c) => [...c, { from: "user", text: q }]);
    setInput("");
    setAgentLoading(true);
    try {
      const token = await getInsforgeAccessToken();
      if (!token) throw new Error("Sign in again so your agent can use your session.");
      const result = await testAgent(token, {
        message: q,
        state: {
          profile: user,
          permissions: user.permissions,
        },
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
          <div className="rounded-[1.15rem] border border-white/15 bg-white/12 p-4 backdrop-blur-xl">
            <p className="text-2xl font-black text-[#f7b801]">
              {user.agent.status === "active" ? "Live" : "Paused"}
            </p>
            <p className="text-sm font-semibold text-white/65">current status</p>
          </div>
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

        <Panel title="Test my bee">
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
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
                  className={`max-w-[80%] rounded-[1.1rem] px-3 py-2 text-sm font-semibold leading-6 shadow-sm ${
                    m.from === "user"
                      ? "bg-black text-white"
                      : "border border-[#f7b801]/25 bg-[#fff4c8] text-black"
                  }`}
                >
                  {m.from === "agent" && <AiBadge className="mb-1" label={user.agent.agent_name} />}
                  <p>{m.text}</p>
                </div>
              </div>
            ))}
            {agentLoading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-[1.1rem] border border-[#f7b801]/25 bg-[#fff4c8] px-3 py-2 text-sm font-bold text-black">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Bee is thinking...
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void sendTest()}
              placeholder="Ask your bee..."
              className="app-field rounded-[1rem] border-0 font-semibold shadow-none placeholder:text-[var(--app-placeholder)]"
            />
            <Button
              onClick={() => void sendTest()}
              disabled={agentLoading}
              className="rounded-[1rem] bg-black text-[#f7b801] hover:bg-black/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Panel>

        <Panel title="Recent activity">
          <ActivityTimeline
            items={[
              { icon: "search", title: "Agent searched San Francisco", time: "2 min ago" },
              { icon: "agent", title: "Agent talked to Maya Agent", time: "10 min ago" },
              { icon: "users", title: "Agent recommended 3 intros", time: "1 hr ago" },
              { icon: "check", title: "Agent needs approval on 2 intros", time: "Today" },
            ]}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-[1rem] border-[var(--app-border)] bg-white font-bold hover:bg-[#fff4c8]"
              onClick={() =>
                updateUser((u) => ({
                  ...u,
                  agent: { ...u.agent, status: u.agent.status === "active" ? "paused" : "active" },
                }))
              }
            >
              {user.agent.status === "active" ? (
                <>
                  <Pause className="h-4 w-4" /> Pause Agent
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Resume Agent
                </>
              )}
            </Button>
            <Button variant="secondary" className="rounded-[1rem] bg-[#fff4c8] font-bold">
              New Mission
            </Button>
          </div>
        </Panel>
      </div>
    </div>
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
