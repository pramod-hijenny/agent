import { Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiBadge({ className, label = "AI Agent" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-agent-soft px-2 py-0.5 text-[11px] font-medium text-agent",
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
        "inline-flex items-center gap-1 rounded-full bg-safety-soft px-2 py-0.5 text-[11px] font-medium text-safety-foreground",
        className,
      )}
    >
      <ShieldCheck className="h-3 w-3" />
      Human approval required
    </span>
  );
}
