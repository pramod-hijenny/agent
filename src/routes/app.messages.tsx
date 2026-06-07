import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useUser, updateUser } from "@/lib/store";
import { Link, useNavigate, useParams } from "@/lib/navigation";
import { GradientAvatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { insforge } from "@/lib/insforge";
import { getInsforgeAccessToken } from "@/lib/auth";
import {
  agentNetworkConversations,
  messageDeliver,
  type AgentNetworkConversation,
  type MessageRow,
} from "@/lib/api";
import {
  ArrowLeft,
  Check,
  Inbox,
  Loader2,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const COMM_TABS = ["Needs review", "Chats", "Agent talks", "Sent"] as const;
type CommTab = (typeof COMM_TABS)[number];

type BackendChat = {
  id: string;
  message: MessageRow;
  otherAgentId: string;
  otherName: string;
  direction: "in" | "out";
  unreadFromThem: number;
};

const STATE_LABEL: Record<MessageRow["state"], { label: string; cls: string }> = {
  requested: { label: "Requested", cls: "bg-slate-100 text-slate-600" },
  screened: { label: "Screening", cls: "bg-amber-100 text-amber-700" },
  approved: { label: "Ready", cls: "bg-emerald-100 text-emerald-700" },
  delivered: { label: "Delivered", cls: "bg-emerald-600 text-white" },
  declined: { label: "Declined", cls: "bg-rose-100 text-rose-700" },
};

export function MessagesPage() {
  const user = useUser();
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const myAgentOn = user?.agent.status === "active";
  const [activeTab, setActiveTab] = useState<CommTab>("Needs review");
  const [myAgentId, setMyAgentId] = useState<string | null>(null);
  const [introMessages, setIntroMessages] = useState<MessageRow[]>([]);
  const [agentNames, setAgentNames] = useState<Record<string, string>>({});
  const [introLoading, setIntroLoading] = useState(true);
  const [agentTalks, setAgentTalks] = useState<AgentNetworkConversation[]>([]);
  const [agentTalksLoading, setAgentTalksLoading] = useState(true);
  const [agentTalksError, setAgentTalksError] = useState<string | null>(null);
  const [actingIntro, setActingIntro] = useState<string | null>(null);

  async function loadIntroMessages() {
    if (!user) return;
    setIntroLoading(true);
    try {
      const { data: mine } = await insforge.database
        .from("agents")
        .select("id")
        .eq("user_id", user.user_id || user.id)
        .single();
      const ownedAgentId = (mine as { id?: string } | null)?.id ?? null;
      setMyAgentId(ownedAgentId);

      const { data: msgs } = await insforge.database
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });
      setIntroMessages((msgs as MessageRow[]) || []);

      const { data: agents } = await insforge.database.from("agents").select("id,name");
      const map: Record<string, string> = {};
      for (const agent of (agents as { id: string; name: string }[]) || []) {
        map[agent.id] = agent.name || "Agent";
      }
      setAgentNames(map);
    } finally {
      setIntroLoading(false);
    }
  }

  async function loadAgentTalks() {
    if (!user) return;
    setAgentTalksLoading(true);
    setAgentTalksError(null);
    try {
      const token = await getInsforgeAccessToken();
      if (!token) throw new Error("Sign in again to load agent talks.");
      const result = await agentNetworkConversations(token);
      setAgentTalks(result.conversations || []);
    } catch (err) {
      setAgentTalks([]);
      setAgentTalksError(err instanceof Error ? err.message : "Could not load agent talks");
    } finally {
      setAgentTalksLoading(false);
    }
  }

  useEffect(() => {
    void loadIntroMessages();
    void loadAgentTalks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  function toggleAgentMode(on: boolean) {
    updateUser((u) => ({ ...u, agent: { ...u.agent, status: on ? "active" : "paused" } }));
  }

  async function acceptIntro(messageId: string) {
    setActingIntro(messageId);
    try {
      const token = await getInsforgeAccessToken();
      if (!token) throw new Error("Sign in again.");
      await messageDeliver(token, messageId);
      toast.success("Intro accepted");
      await loadIntroMessages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not accept intro");
    } finally {
      setActingIntro(null);
    }
  }

  const incomingIntros = introMessages.filter((message) => message.to_agent_id === myAgentId);
  const outgoingIntros = introMessages.filter((message) => message.from_agent_id === myAgentId);
  const actionableIntros = incomingIntros.filter((message) =>
    ["requested", "screened", "approved"].includes(message.state),
  );
  const backendChats = useMemo(
    () =>
      introMessages
        .filter((message) => message.state === "delivered")
        .filter(
          (message) => message.from_agent_id === myAgentId || message.to_agent_id === myAgentId,
        )
        .map<BackendChat>((message) => {
          const direction = message.from_agent_id === myAgentId ? "out" : "in";
          const otherAgentId = direction === "out" ? message.to_agent_id : message.from_agent_id;
          return {
            id: `intro-${message.id}`,
            message,
            otherAgentId,
            otherName: agentNames[otherAgentId] || "Platform agent",
            direction,
            unreadFromThem: direction === "in" ? 1 : 0,
          };
        }),
    [agentNames, introMessages, myAgentId],
  );
  const unreadChats = backendChats.filter((conversation) => conversation.unreadFromThem > 0);
  const activeAgentTalk = id ? agentTalks.find((conversation) => conversation.id === id) : null;
  const activeBackendChat = id ? backendChats.find((conversation) => conversation.id === id) : null;
  const hasUnknownThread = Boolean(id && !activeAgentTalk && !activeBackendChat);

  if (!user) return null;

  return (
    <div className="w-full space-y-5">
      <section className="app-hero relative overflow-hidden rounded-[1.45rem] p-5 text-white shadow-[0_24px_70px_oklch(0.18_0.035_80_/_0.28)] md:p-6">
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgb(0_0_0_/_0.92),rgb(0_0_0_/_0.72)_56%,rgb(247_184_1_/_0.32))]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#f7b801]/35 bg-[#f7b801]/15 px-3 py-1.5 text-xs font-black text-[#ffd766]">
              <MessageCircle className="h-4 w-4" /> Messages
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Messages</h1>
            <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-white/72">
              {myAgentOn
                ? "Agent mode is on - your bee screens intro requests, adds context, and keeps chats focused."
                : "Agent mode is off - chats still work, but intro screening is paused."}
            </p>
          </div>
          <label className="flex shrink-0 cursor-pointer items-center gap-3 rounded-[1.2rem] border border-white/15 bg-white/10 p-4 backdrop-blur">
            <div className="text-right">
              <p className="text-sm font-black text-white">Agent mode</p>
              <p className="text-xs font-bold text-white/65">{myAgentOn ? "On" : "Off"}</p>
            </div>
            <Switch
              checked={myAgentOn}
              onCheckedChange={toggleAgentMode}
              aria-label="Toggle agent mode"
              className="data-[state=checked]:bg-[#f7b801] data-[state=unchecked]:bg-white/25"
            />
          </label>
        </div>
      </section>

      {activeAgentTalk ? (
        <ConversationDetailShell onBack={() => navigate({ to: "/app/messages" })}>
          <AgentTalkCard conversation={activeAgentTalk} myAgentId={myAgentId} expanded />
        </ConversationDetailShell>
      ) : activeBackendChat ? (
        <ConversationDetailShell onBack={() => navigate({ to: "/app/messages" })}>
          <BackendChatDetail conversation={activeBackendChat} />
        </ConversationDetailShell>
      ) : hasUnknownThread ? (
        <ConversationDetailShell onBack={() => navigate({ to: "/app/messages" })}>
          <EmptyPanel>
            Conversation not found. Run your bee or accept an intro to create one.
          </EmptyPanel>
        </ConversationDetailShell>
      ) : (
        <MessagesHub
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          conversations={backendChats}
          incomingIntros={actionableIntros}
          outgoingIntros={outgoingIntros}
          agentTalks={agentTalks}
          agentTalksLoading={agentTalksLoading}
          agentTalksError={agentTalksError}
          myAgentId={myAgentId}
          unreadChatCount={unreadChats.length}
          introLoading={introLoading}
          agentNames={agentNames}
          actingIntro={actingIntro}
          onAcceptIntro={acceptIntro}
        />
      )}
    </div>
  );
}

function MessagesHub({
  activeTab,
  setActiveTab,
  conversations,
  incomingIntros,
  outgoingIntros,
  agentTalks,
  agentTalksLoading,
  agentTalksError,
  myAgentId,
  unreadChatCount,
  introLoading,
  agentNames,
  actingIntro,
  onAcceptIntro,
}: {
  activeTab: CommTab;
  setActiveTab: (tab: CommTab) => void;
  conversations: BackendChat[];
  incomingIntros: MessageRow[];
  outgoingIntros: MessageRow[];
  agentTalks: AgentNetworkConversation[];
  agentTalksLoading: boolean;
  agentTalksError: string | null;
  myAgentId: string | null;
  unreadChatCount: number;
  introLoading: boolean;
  agentNames: Record<string, string>;
  actingIntro: string | null;
  onAcceptIntro: (id: string) => void;
}) {
  const tabCounts: Record<CommTab, number> = {
    "Needs review": incomingIntros.length,
    Chats: unreadChatCount,
    "Agent talks": agentTalks.length,
    Sent: outgoingIntros.length,
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="app-card rounded-[1.35rem] p-4">
        <div className="flex gap-1 overflow-x-auto rounded-full bg-[#fff8e1] p-1">
          {COMM_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition ${
                activeTab === tab
                  ? "bg-black text-[#f7b801]"
                  : "text-[var(--app-muted)] hover:bg-white"
              }`}
            >
              {tab}
              {tabCounts[tab] > 0 && (
                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] ${
                    activeTab === tab ? "bg-[#f7b801] text-black" : "bg-black text-white"
                  }`}
                >
                  {tabCounts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {activeTab === "Needs review" && (
            <IntroList
              loading={introLoading}
              messages={incomingIntros}
              names={agentNames}
              direction="in"
              empty="No intro requests need review."
              actingIntro={actingIntro}
              onAcceptIntro={onAcceptIntro}
            />
          )}

          {activeTab === "Chats" && (
            <BackendChatList loading={introLoading} conversations={conversations} />
          )}

          {activeTab === "Agent talks" && (
            <AgentTalksList
              conversations={agentTalks}
              loading={agentTalksLoading}
              error={agentTalksError}
              myAgentId={myAgentId}
            />
          )}

          {activeTab === "Sent" && (
            <IntroList
              loading={introLoading}
              messages={outgoingIntros}
              names={agentNames}
              direction="out"
              empty="No sent intro requests yet."
            />
          )}
        </div>
      </section>

      <aside className="space-y-4">
        <div className="app-card rounded-[1.25rem] p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-black text-[#f7b801]">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-black">Bee triage</p>
              <p className="text-xs font-semibold text-[var(--app-muted)]">
                Review first, chat after approval.
              </p>
            </div>
          </div>
        </div>
        <div className="app-soft-panel rounded-[1.25rem] p-4">
          <p className="text-xs font-black uppercase tracking-wide text-[#8a6a00]">Backend inbox</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--app-ink-soft)]">
            This page now shows only InsForge messages and agent-network transcripts.
          </p>
        </div>
      </aside>
    </div>
  );
}

function BackendChatList({
  loading,
  conversations,
}: {
  loading: boolean;
  conversations: BackendChat[];
}) {
  if (loading) {
    return (
      <EmptyPanel>
        <Loader2 className="h-4 w-4 animate-spin" /> Loading backend chats...
      </EmptyPanel>
    );
  }

  if (conversations.length === 0) {
    return (
      <EmptyPanel>
        No delivered backend chats yet. Accept an approved intro to open a chat thread.
      </EmptyPanel>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <BackendChatLink key={conversation.id} conversation={conversation} />
      ))}
    </div>
  );
}

function BackendChatLink({ conversation }: { conversation: BackendChat }) {
  return (
    <Link
      to="/app/messages/$id"
      params={{ id: conversation.id }}
      className="flex items-center gap-3 rounded-[1rem] p-2.5 transition hover:bg-[#fff8e1]"
    >
      <GradientAvatar
        name={conversation.otherName}
        colorClass="from-primary via-agent to-sky-400"
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-bold text-black">{conversation.otherName}</p>
          {conversation.unreadFromThem > 0 && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#f7b801]" />
          )}
        </div>
        <p className="truncate text-xs font-semibold text-[var(--app-muted)]">
          {conversation.direction === "out" ? "You: " : ""}
          {conversation.message.body}
        </p>
      </div>
    </Link>
  );
}

function AgentTalksList({
  conversations,
  loading,
  error,
  myAgentId,
}: {
  conversations: AgentNetworkConversation[];
  loading: boolean;
  error: string | null;
  myAgentId: string | null;
}) {
  if (loading) {
    return (
      <EmptyPanel>
        <Loader2 className="h-4 w-4 animate-spin" /> Loading agent talks...
      </EmptyPanel>
    );
  }

  if (error) return <EmptyPanel>{error}</EmptyPanel>;

  if (conversations.length === 0) {
    return (
      <EmptyPanel>
        No private agent-agent conversations yet. Run your bee from Discover or My Bee.
      </EmptyPanel>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((conversation) => (
        <Link
          key={conversation.id}
          to="/app/messages/$id"
          params={{ id: conversation.id }}
          className="block rounded-[1.1rem] outline-none focus-visible:ring-2 focus-visible:ring-[#f7b801]"
        >
          <AgentTalkCard conversation={conversation} myAgentId={myAgentId} />
        </Link>
      ))}
    </div>
  );
}

function AgentTalkCard({
  conversation,
  myAgentId,
  expanded = false,
}: {
  conversation: AgentNetworkConversation;
  myAgentId: string | null;
  expanded?: boolean;
}) {
  const sourceName = conversation.source?.full_name || conversation.source?.name || "Source agent";
  const candidateName =
    conversation.candidate?.full_name || conversation.candidate?.name || "Platform agent";
  const otherName = myAgentId === conversation.candidate_agent_id ? sourceName : candidateName;
  const score = Math.max(0, Math.min(100, conversation.compatibility_score || 0));
  const hasHold = conversation.turns.some((turn) => turn.safety?.status === "hold");

  function speakerLabel(turn: AgentNetworkConversation["turns"][number]) {
    if (turn.speaker_agent_id === myAgentId) return "Your bee";
    if (turn.speaker_agent_id === conversation.source_agent_id) return sourceName;
    if (turn.speaker_agent_id === conversation.candidate_agent_id) return candidateName;
    return turn.speaker_role;
  }

  return (
    <div className="app-soft-panel rounded-[1.1rem] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <GradientAvatar
              name={otherName}
              colorClass="from-primary via-agent to-sky-400"
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-black">{otherName}</p>
              <p className="text-xs font-bold text-[var(--app-muted)]">Private agent talk</p>
            </div>
          </div>
          <p className="mt-3 text-sm font-medium leading-6 text-[var(--app-ink-soft)]">
            {conversation.summary}
          </p>
        </div>
        <div className="shrink-0 rounded-[0.9rem] bg-black px-3 py-2 text-center text-[#f7b801]">
          <p className="text-lg font-black">{score}</p>
          <p className="text-[10px] font-black uppercase">fit</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="rounded-[0.9rem] bg-white/70 p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#8a6a00]">
            Next action
          </p>
          <p className="mt-1 text-sm font-semibold leading-5 text-black">
            {conversation.next_action || "Review fit inside GetMyBee."}
          </p>
        </div>
        <div className="rounded-[0.9rem] bg-white/70 p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#8a6a00]">Safety</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-black">
            {hasHold ? (
              <>
                <ShieldAlert className="h-4 w-4 text-amber-600" /> Needs human review
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> In-platform only
              </>
            )}
          </p>
        </div>
      </div>

      {conversation.risks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {conversation.risks.map((risk) => (
            <span
              key={risk}
              className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800"
            >
              {risk}
            </span>
          ))}
        </div>
      )}

      {(expanded || conversation.turns.length > 0) && (
        <div className="mt-3 space-y-2 border-t border-[var(--app-border)] pt-3">
          {(expanded ? conversation.turns : conversation.turns.slice(0, 2)).map((turn) => (
            <div
              key={`${conversation.id}-${turn.turn_index}`}
              className={`rounded-[0.9rem] p-2.5 text-sm leading-6 ${
                turn.speaker_agent_id === myAgentId
                  ? "bg-black text-white"
                  : "bg-white/75 text-[var(--app-ink-soft)]"
              }`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wide opacity-70">
                  {speakerLabel(turn)}
                </span>
                {turn.safety?.status === "hold" && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">
                    Hold
                  </span>
                )}
              </div>
              <p className="font-medium">{turn.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IntroList({
  loading,
  messages,
  names,
  direction,
  empty,
  actingIntro,
  onAcceptIntro,
}: {
  loading: boolean;
  messages: MessageRow[];
  names: Record<string, string>;
  direction: "in" | "out";
  empty: string;
  actingIntro?: string | null;
  onAcceptIntro?: (id: string) => void;
}) {
  if (loading) {
    return (
      <EmptyPanel>
        <Loader2 className="h-4 w-4 animate-spin" /> Loading intro requests...
      </EmptyPanel>
    );
  }

  if (messages.length === 0) return <EmptyPanel>{empty}</EmptyPanel>;

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <IntroCard
          key={message.id}
          message={message}
          who={
            direction === "in"
              ? names[message.from_agent_id] || "An agent"
              : names[message.to_agent_id] || "An agent"
          }
          direction={direction}
          acting={actingIntro === message.id}
          onAccept={onAcceptIntro ? () => onAcceptIntro(message.id) : undefined}
        />
      ))}
    </div>
  );
}

function IntroCard({
  message,
  who,
  direction,
  acting,
  onAccept,
}: {
  message: MessageRow;
  who: string;
  direction: "in" | "out";
  acting?: boolean;
  onAccept?: () => void;
}) {
  const badge = STATE_LABEL[message.state];

  return (
    <div className="app-soft-panel rounded-[1.1rem] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <GradientAvatar name={who} colorClass="from-primary via-agent to-sky-400" size="sm" />
          <p className="truncate text-sm font-bold text-black">{who}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${badge.cls}`}>
          {badge.label}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium leading-6 text-[var(--app-ink-soft)]">
        {message.body}
      </p>
      {message.state === "declined" && message.decline_reason && (
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {message.decline_reason}
        </p>
      )}
      {direction === "in" && message.state === "approved" && onAccept && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" /> Passed your bee's screen
          </span>
          <Button
            onClick={onAccept}
            disabled={acting}
            className="rounded-full bg-black font-bold text-[#f7b801] hover:bg-black/90"
          >
            {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Accept
          </Button>
        </div>
      )}
    </div>
  );
}

function ConversationDetailShell({
  children,
  onBack,
}: {
  children: ReactNode;
  onBack: () => void;
}) {
  return (
    <section className="app-card rounded-[1.35rem] p-4">
      <button
        onClick={onBack}
        className="mb-3 inline-flex items-center gap-2 rounded-full bg-black px-3 py-2 text-xs font-black text-[#f7b801]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Messages
      </button>
      {children}
    </section>
  );
}

function BackendChatDetail({ conversation }: { conversation: BackendChat }) {
  const badge = STATE_LABEL[conversation.message.state];

  return (
    <div className="app-soft-panel rounded-[1.1rem] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <GradientAvatar
            name={conversation.otherName}
            colorClass="from-primary via-agent to-sky-400"
            size="sm"
          />
          <div>
            <p className="text-sm font-black text-black">{conversation.otherName}</p>
            <p className="text-xs font-bold text-[var(--app-muted)]">
              Delivered intro from InsForge
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${badge.cls}`}>
          {badge.label}
        </span>
      </div>
      <div
        className={`mt-4 max-w-2xl rounded-[1.1rem] px-3 py-2 text-sm font-medium leading-6 ${
          conversation.direction === "out"
            ? "bg-black text-white"
            : "app-soft-panel text-[var(--app-ink-soft)]"
        }`}
      >
        {conversation.message.body}
      </div>
    </div>
  );
}

function EmptyPanel({ children }: { children: ReactNode }) {
  return (
    <div className="app-soft-panel flex min-h-12 items-center gap-2 rounded-[1rem] p-3 text-sm font-semibold text-[var(--app-muted)]">
      {children}
    </div>
  );
}
