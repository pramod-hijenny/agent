import { useIntros, updateIntro, useUser } from "@/lib/store";
import { getSeedProfile } from "@/lib/mock-data";
import { GradientAvatar } from "@/components/Avatar";
import { AiBadge, ApprovalBadge } from "@/components/AiBadge";
import { Button } from "@/components/ui/button";
import { Inbox as InboxIcon, Check, X } from "lucide-react";

export function InboxPage() {
  const user = useUser();
  const intros = useIntros();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <InboxIcon className="h-6 w-6 text-primary" /> Inbox
      </h1>

      {intros.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No conversations yet. Head to Discover and ask your agent to start one.
        </div>
      )}

      <div className="space-y-3">
        {intros.map((intro) => {
          const other = getSeedProfile(intro.to_user_id);
          if (!other) return null;
          return (
            <div
              key={intro.id}
              className="rounded-2xl border border-border bg-card p-4"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-start gap-3">
                <GradientAvatar name={other.full_name} colorClass={other.avatar_color} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{other.full_name}</p>
                    <span className="text-xs text-muted-foreground">
                      {statusLabel(intro.status)}
                    </span>
                  </div>
                  <div className="mt-2 rounded-xl bg-secondary/40 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <AiBadge label="Drafted by your agent" />
                      <ApprovalBadge />
                    </div>
                    <p className="text-sm">{intro.message}</p>
                  </div>
                  {intro.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        className="rounded-xl"
                        onClick={() => updateIntro(intro.id, (i) => ({ ...i, status: "accepted" }))}
                      >
                        <Check className="h-4 w-4" /> Mark accepted
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl"
                        onClick={() =>
                          updateIntro(intro.id, (i) => ({ ...i, status: "withdrawn" }))
                        }
                      >
                        <X className="h-4 w-4" /> Withdraw
                      </Button>
                    </div>
                  )}
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
