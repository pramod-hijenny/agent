import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GradientAvatar } from "./Avatar";
import { AiBadge, ApprovalBadge } from "./AiBadge";
import { Send, ShieldCheck } from "lucide-react";
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
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-[2rem] border-0 bg-white p-0 shadow-[0_32px_90px_rgb(15_23_42_/_0.24)]">
        <div className="relative overflow-hidden bg-black p-6 text-white">
          <img
            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=85"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/35" />
          <DialogHeader className="relative">
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <ShieldCheck className="h-5 w-5" />
              Approve intro request
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex items-center gap-3 rounded-[1.4rem] bg-slate-100 p-3">
            <GradientAvatar name={other.full_name} colorClass={other.avatar_color} size="lg" />
            <div>
              <p className="font-semibold text-black">{other.full_name}</p>
              <p className="text-xs font-medium text-slate-400">
                {other.profession} · {other.city}
              </p>
            </div>
          </div>

          <div className="rounded-[1.4rem] bg-[#eef4ff] p-4 text-xs">
            <p className="font-semibold text-black">Why your agent recommends them</p>
            <p className="mt-1 font-semibold leading-5 text-slate-600">{match.why}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-black">Suggested first message</label>
              <AiBadge label="Drafted by your agent" />
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="rounded-[1.3rem] border-0 bg-slate-100 font-semibold leading-6 focus-visible:ring-black/20"
            />
            <ApprovalBadge />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-full font-semibold"
            >
              Skip
            </Button>
            <Button onClick={() => onSend(message)} className="rounded-full bg-black font-semibold">
              <Send className="h-4 w-4" /> Send Intro Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
