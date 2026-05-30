import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GradientAvatar } from "./Avatar";
import { AiBadge, ApprovalBadge } from "./AiBadge";
import { Send } from "lucide-react";
import type { Profile } from "@/lib/types";
import { suggestIntroMessage, type ScoredMatch } from "@/lib/matching";
import { useEffect, useState } from "react";

export function IntroApprovalModal({
  open,
  onOpenChange,
  me,
  match,
  onSend,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  me: Profile;
  match: ScoredMatch | null;
  onSend: (message: string) => void;
}) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open && match) setMessage(suggestIntroMessage(me, match.profile, match));
  }, [open, match, me]);

  if (!match) return null;
  const other = match.profile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Approve intro request</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-3">
          <GradientAvatar name={other.full_name} colorClass={other.avatar_color} size="lg" />
          <div>
            <p className="font-semibold text-foreground">{other.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {other.profession} · {other.city}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-secondary/40 p-3 text-xs">
          <p className="font-medium text-foreground">Why your agent recommends them</p>
          <p className="mt-1 text-muted-foreground">{match.why}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">Suggested first message</label>
            <AiBadge label="Drafted by your agent" />
          </div>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="rounded-xl"
          />
          <ApprovalBadge />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
            Skip
          </Button>
          <Button onClick={() => onSend(message)} className="rounded-xl">
            <Send className="h-4 w-4" /> Send Intro Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
