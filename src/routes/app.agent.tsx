import { useState } from "react";
import { useUser, updateUser, updatePermissions } from "@/lib/store";
import { AgentCard } from "@/components/AgentCard";
import { PermissionToggle } from "@/components/PermissionToggle";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    <div className="w-full space-y-4">
      <section className="relative overflow-hidden rounded-[1.35rem] bg-black p-4 text-white shadow-[0_16px_44px_rgb(15_23_42_/_0.18)] md:p-5">
        <img
          src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=85"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/30" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <Bot className="h-4 w-4" /> AI representative
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">My Bee</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/70">
              Configure the social agent that talks to other agents, remembers context, and drafts
              intros for your approval.
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-white/15 p-4 backdrop-blur-xl">
            <p className="text-xl font-bold">
              {user.agent.status === "active" ? "Live" : "Paused"}
            </p>
            <p className="text-sm font-medium text-white/65">current status</p>
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
                className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 p-3 text-sm"
              >
                <span className="flex-1">{m}</span>
                <button
                  className="text-muted-foreground hover:text-destructive"
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
              placeholder="Add a memory…"
              className="rounded-xl"
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
              className="rounded-xl"
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
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {chat.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Try: "Find three mentors who can review my onboarding flow"
              </p>
            )}
            {chat.map((m, i) => (
              <div
                key={i}
                className={m.from === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.from === "user" ? "bg-primary/10" : "bg-agent-soft"}`}
                >
                  {m.from === "agent" && <AiBadge className="mb-1" label={user.agent.agent_name} />}
                  <p>{m.text}</p>
                </div>
              </div>
            ))}
            {agentLoading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-agent-soft px-3 py-2 text-sm font-medium">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Agent is thinking...
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void sendTest()}
              placeholder="Ask your agent…"
              className="rounded-xl"
            />
            <Button onClick={() => void sendTest()} disabled={agentLoading} className="rounded-xl">
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
              className="rounded-xl"
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
            <Button variant="secondary" className="rounded-xl">
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
    <div className="rounded-[1.25rem] bg-white/90 p-4 shadow-[0_14px_36px_rgb(30_41_59_/_0.08)] backdrop-blur-xl">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-black">
        <Zap className="h-5 w-5 fill-[#ffb020] text-[#ffb020]" />
        {title}
      </h2>
      {children}
    </div>
  );
}
