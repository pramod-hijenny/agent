import { useIntros, updateIntro, useUser } from "@/lib/store";
import { patchIntroStatus } from "@/lib/auth";
import { getSeedProfile } from "@/lib/mock-data";
import { GradientAvatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/navigation";
import {
  Check,
  CheckCircle2,
  Clock3,
  Inbox as InboxIcon,
  MessageCircle,
  SendHorizontal,
  ShieldCheck,
  X,
} from "lucide-react";

export function InboxPage() {
  const user = useUser();
  const intros = useIntros();
  if (!user) return null;

  const pending = intros.filter((intro) => intro.status === "pending");
  const accepted = intros.filter((intro) => intro.status === "accepted");
  const closed = intros.filter(
    (intro) => intro.status === "rejected" || intro.status === "withdrawn",
  );

  async function handleApprove(id: string) {
    try {
      await patchIntroStatus(id, "accepted");
    } catch {
      // best-effort; local state still updates
    }
    updateIntro(id, (i) => ({ ...i, status: "accepted" }));
  }

  async function handleReject(id: string) {
    try {
      await patchIntroStatus(id, "withdrawn");
    } catch {
      // best-effort; local state still updates
    }
    updateIntro(id, (i) => ({ ...i, status: "withdrawn" }));
  }

  return (
    <div className="w-full space-y-5">
      <section className="app-hero relative overflow-hidden rounded-[1.45rem] p-5 text-white shadow-[0_24px_70px_oklch(0.18_0.035_80_/_0.28)] md:p-6">
        <img
          src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=85"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35 grayscale"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="honeycomb-bg absolute inset-0 opacity-10 mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgb(0_0_0_/_0.92),rgb(0_0_0_/_0.72)_56%,rgb(247_184_1_/_0.32))]" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#f7b801]/35 bg-[#f7b801]/15 px-3 py-1.5 text-xs font-black text-[#ffd766] backdrop-blur">
            <InboxIcon className="h-4 w-4" /> Agent inbox
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Intro approvals</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/70">
            Agent-drafted intros, approval decisions, and accepted intro receipts.
          </p>
        </div>
      </section>

      {intros.length > 0 && (
        <section className="grid grid-cols-3 gap-2">
          <InboxMetric icon={Clock3} label="Needs review" value={pending.length} />
          <InboxMetric icon={CheckCircle2} label="Accepted" value={accepted.length} />
          <InboxMetric icon={ShieldCheck} label="Closed" value={closed.length} />
        </section>
      )}

      {intros.length === 0 && (
        <div className="app-card rounded-[1.35rem] border-dashed p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[1rem] bg-black text-[#f7b801]">
            <MessageCircle className="h-6 w-6" />
          </div>
          <p className="mt-3 text-lg font-black text-black">No intro drafts yet</p>
          <p className="mt-2 text-sm font-semibold text-[var(--app-muted)]">
            Discover matches first, then approved intro drafts appear here.
          </p>
        </div>
      )}

      {intros.length > 0 && (
        <div className="rounded-[1.35rem] border border-[var(--app-border)] bg-[oklch(0.995_0.012_88_/_0.78)] p-2 shadow-[var(--app-shadow)] backdrop-blur-xl">
          {intros.map((intro) => {
            const other = getSeedProfile(intro.to_user_id);
            if (!other) return null;
            return (
              <article
                key={intro.id}
                className="border-b border-[var(--app-line)] px-2 py-4 last:border-b-0 md:px-3"
              >
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                  <div className="flex min-w-0 gap-3">
                    <GradientAvatar name={other.full_name} colorClass={other.avatar_color} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-black text-black">
                          {other.full_name}
                        </p>
                        <span className={statusClass(intro.status)}>
                          {statusLabel(intro.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-[var(--app-muted)]">
                        {statusHint(intro.status)}
                      </p>

                      <div className="mt-3 rounded-[1.05rem] border border-[#d9c98c] bg-[#fffaf0] p-3">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-[11px] font-black text-[#f7b801]">
                            <SendHorizontal className="h-3.5 w-3.5" /> Intro draft
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#8a650f] ring-1 ring-[#f7b801]/25">
                            <ShieldCheck className="h-3.5 w-3.5" /> Approval gated
                          </span>
                        </div>
                        <p className="text-sm font-semibold leading-6 text-[#214c78]">
                          {intro.message}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {intro.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          className="rounded-full bg-black font-black text-[#f7b801] hover:bg-black/90"
                          onClick={() => handleApprove(intro.id)}
                        >
                          <Check className="h-4 w-4" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="rounded-full bg-[#fff4c8] font-black text-black hover:bg-[#ffe69b]"
                          onClick={() => handleReject(intro.id)}
                        >
                          <X className="h-4 w-4" /> Withdraw
                        </Button>
                      </>
                    ) : (
                      <Button
                        asChild
                        size="sm"
                        variant="secondary"
                        className="rounded-full bg-white font-black text-black ring-1 ring-[var(--app-line)] hover:bg-[#fff4c8]"
                      >
                        <Link to="/app/profile/$id" params={{ id: other.id }}>
                          View profile
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InboxMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="app-card rounded-[1.1rem] p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-[0.8rem] bg-black text-[#f7b801]">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-black leading-none text-black">{value}</p>
          <p className="mt-0.5 truncate text-[11px] font-bold text-[var(--app-muted)]">{label}</p>
        </div>
      </div>
    </div>
  );
}

function statusLabel(s: "pending" | "accepted" | "rejected" | "withdrawn") {
  if (s === "pending") return "Needs review";
  if (s === "accepted") return "Intro accepted";
  if (s === "withdrawn") return "Withdrawn";
  return "Rejected";
}

function statusHint(s: "pending" | "accepted" | "rejected" | "withdrawn") {
  if (s === "pending") return "Waiting on your decision";
  if (s === "accepted") return "Marked accepted";
  if (s === "withdrawn") return "Removed from active queue";
  return "Not moving forward";
}

function statusClass(s: "pending" | "accepted" | "rejected" | "withdrawn") {
  const base = "rounded-full px-3 py-1 text-xs font-black";
  if (s === "pending") return `${base} bg-[#fff4c8] text-black ring-1 ring-[#f7b801]/35`;
  if (s === "accepted") return `${base} bg-[#dff8df] text-[#146b2e] ring-1 ring-[#146b2e]/15`;
  return `${base} bg-white text-[var(--app-muted)] ring-1 ring-[var(--app-line)]`;
}
