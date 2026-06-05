import { useEffect, useState } from "react";
import { useUser } from "@/lib/store";
import { insforge } from "@/lib/insforge";
import { getInsforgeAccessToken } from "@/lib/auth";
import { messageDeliver, type MessageRow } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { GradientAvatar } from "@/components/Avatar";
import { Check, Inbox, Loader2, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const STATE_LABEL: Record<MessageRow["state"], { label: string; cls: string }> = {
  requested: { label: "Requested", cls: "bg-slate-100 text-slate-600" },
  screened: { label: "Screening", cls: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", cls: "bg-emerald-100 text-emerald-700" },
  delivered: { label: "Delivered", cls: "bg-emerald-600 text-white" },
  declined: { label: "Declined", cls: "bg-rose-100 text-rose-700" },
};

export function InboxPage() {
  const user = useUser();
  const [myAgentId, setMyAgentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    setLoading(true);
    try {
      const { data: mine } = await insforge.database
        .from("agents")
        .select("id")
        .eq("user_id", user.user_id || user.id)
        .single();
      setMyAgentId((mine as { id?: string } | null)?.id ?? null);

      // RLS returns only messages where the user owns the from/to agent.
      const { data: msgs } = await insforge.database
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });
      setMessages((msgs as MessageRow[]) || []);

      const { data: agents } = await insforge.database.from("agents").select("id,name");
      const map: Record<string, string> = {};
      for (const a of (agents as { id: string; name: string }[]) || [])
        map[a.id] = a.name || "Agent";
      setNames(map);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;

  async function deliver(id: string) {
    setActing(id);
    try {
      const token = await getInsforgeAccessToken();
      if (!token) throw new Error("Sign in again.");
      await messageDeliver(token, id);
      toast.success("Intro accepted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not accept");
    } finally {
      setActing(null);
    }
  }

  const incoming = messages.filter((m) => m.to_agent_id === myAgentId);
  const outgoing = messages.filter((m) => m.from_agent_id === myAgentId);

  return (
    <div className="w-full space-y-5">
      <section className="app-hero relative overflow-hidden rounded-[1.45rem] p-5 text-white shadow-[0_24px_70px_oklch(0.18_0.035_80_/_0.28)] md:p-6">
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgb(0_0_0_/_0.92),rgb(0_0_0_/_0.72)_56%,rgb(247_184_1_/_0.32))]" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#f7b801]/35 bg-[#f7b801]/15 px-3 py-1.5 text-xs font-black text-[#ffd766]">
            <Inbox className="h-4 w-4" /> Messages
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Your intros</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/72">
            Your bee screens inbound intros. Accept the ones that fit; declined ones never reach
            you.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="app-card flex items-center gap-2 rounded-[1.35rem] p-6 text-sm font-semibold text-[var(--app-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your messages...
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Section
            title="Inbox"
            icon={<Inbox className="h-5 w-5" />}
            empty="No inbound intros yet."
          >
            {incoming.map((m) => (
              <MessageCard
                key={m.id}
                m={m}
                who={names[m.from_agent_id] || "An agent"}
                direction="in"
                acting={acting === m.id}
                onDeliver={() => deliver(m.id)}
              />
            ))}
          </Section>
          <Section
            title="Sent"
            icon={<Send className="h-5 w-5" />}
            empty="You haven't sent intros yet."
          >
            {outgoing.map((m) => (
              <MessageCard
                key={m.id}
                m={m}
                who={names[m.to_agent_id] || "An agent"}
                direction="out"
              />
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  empty: string;
  children: React.ReactNode;
}) {
  const count = Array.isArray(children) ? children.flat().filter(Boolean).length : children ? 1 : 0;
  return (
    <div className="app-card rounded-[1.35rem] p-4">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-black">
        {icon}
        {title}
      </h2>
      <div className="space-y-3">
        {count === 0 ? (
          <p className="app-soft-panel rounded-[1rem] p-3 text-sm font-semibold text-[var(--app-muted)]">
            {empty}
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function MessageCard({
  m,
  who,
  direction,
  acting,
  onDeliver,
}: {
  m: MessageRow;
  who: string;
  direction: "in" | "out";
  acting?: boolean;
  onDeliver?: () => void;
}) {
  const badge = STATE_LABEL[m.state];
  return (
    <div className="app-soft-panel rounded-[1.1rem] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GradientAvatar name={who} colorClass="from-primary via-agent to-sky-400" size="sm" />
          <p className="text-sm font-bold text-black">{who}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${badge.cls}`}>
          {badge.label}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium leading-6 text-[var(--app-ink-soft)]">{m.body}</p>
      {m.state === "declined" && m.decline_reason && (
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {m.decline_reason}
        </p>
      )}
      {direction === "in" && m.state === "approved" && onDeliver && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" /> Passed your bee's screen
          </span>
          <Button
            onClick={onDeliver}
            disabled={acting}
            className="rounded-full bg-black font-bold text-[#f7b801] hover:bg-black/90"
          >
            {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{" "}
            Accept
          </Button>
        </div>
      )}
    </div>
  );
}
