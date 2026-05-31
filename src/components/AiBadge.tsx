import { Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiBadge({ className, label = "AI Agent" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-[11px] font-semibold text-white",
        className,
      )}
    >
      <Sparkles className="h-3 w-3" />
      {label}
    </span>
  );
}

export function ApprovalBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-[#fff3d5] px-2.5 py-1 text-[11px] font-semibold text-[#a35c00]",
        className,
      )}
    >
      <ShieldCheck className="h-3 w-3" />
      Human approval required
    </span>
  );
}
