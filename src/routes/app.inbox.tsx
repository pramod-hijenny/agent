import { useIntros, updateIntro, useUser } from "@/lib/store";
import { patchIntroStatus } from "@/lib/auth";
import { getSeedProfile } from "@/lib/mock-data";
import { GradientAvatar } from "@/components/Avatar";
import { AiBadge, ApprovalBadge } from "@/components/AiBadge";
import { Button } from "@/components/ui/button";
import { Inbox as InboxIcon, Check, MessageCircle, ShieldCheck, X } from "lucide-react";

export function InboxPage() {
  const user = useUser();
  const intros = useIntros();
  if (!user) return null;

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
    <div className="w-full space-y-4">
      <section className="relative overflow-hidden rounded-[1.35rem] bg-black p-4 text-white shadow-[0_16px_44px_rgb(15_23_42_/_0.18)] md:p-5">
        <img
          src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=85"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/30" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
            <InboxIcon className="h-4 w-4" /> Agent inbox
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">Messages</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/70">
            Review intros your agent drafted, keep approvals explicit, and move warm conversations
            forward.
          </p>
        </div>
      </section>

      {intros.length === 0 && (
        <div className="rounded-[1.35rem] border border-dashed border-slate-300 bg-white/80 p-8 text-center shadow-[0_14px_36px_rgb(41_55_92_/_0.1)] backdrop-blur-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
            <MessageCircle className="h-6 w-6" />
          </div>
          <p className="mt-3 text-lg font-bold">No conversations yet</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Head to Discover and ask your agent to start one.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {intros.map((intro) => {
          const other = getSeedProfile(intro.to_user_id);
          if (!other) return null;
          return (
            <div
              key={intro.id}
              className="overflow-hidden rounded-[1.25rem] bg-white shadow-[0_14px_36px_rgb(30_41_59_/_0.09)]"
            >
              <div className={`h-2 bg-gradient-to-r ${other.avatar_color}`} />
              <div className="p-4">
                <div className="flex items-start gap-4">
                  <GradientAvatar name={other.full_name} colorClass={other.avatar_color} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-black">{other.full_name}</p>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                        {statusLabel(intro.status)}
                      </span>
                    </div>
                    <div className="mt-3 rounded-[1rem] bg-slate-100 p-3">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <AiBadge label="Drafted by your agent" />
                        <ApprovalBadge />
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-500">
                          <ShieldCheck className="h-3.5 w-3.5" /> Consent-first
                        </span>
                      </div>
                      <p className="text-sm font-semibold leading-6 text-slate-700">
                        {intro.message}
                      </p>
                    </div>
                    {intro.status === "pending" && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="rounded-full bg-black font-semibold"
                          onClick={() => handleApprove(intro.id)}
                        >
                          <Check className="h-4 w-4" /> Mark accepted
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="rounded-full bg-slate-100 font-semibold"
                          onClick={() => handleReject(intro.id)}
                        >
                          <X className="h-4 w-4" /> Withdraw
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function statusLabel(s: "pending" | "accepted" | "rejected" | "withdrawn") {
  if (s === "pending") return "Waiting for approval";
  if (s === "accepted") return "Intro accepted";
  if (s === "withdrawn") return "Withdrawn";
  return "Rejected";
}
