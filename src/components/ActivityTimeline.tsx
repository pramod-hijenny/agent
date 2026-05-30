import { cn } from "@/lib/utils";
import { Sparkles, Users, CheckCircle2, Search } from "lucide-react";

export interface ActivityItem {
  icon: "search" | "agent" | "users" | "check";
  title: string;
  time: string;
}

const ICONS = { search: Search, agent: Sparkles, users: Users, check: CheckCircle2 };

export function ActivityTimeline({
  items,
  className,
}: {
  items: ActivityItem[];
  className?: string;
}) {
  return (
    <ol className={cn("space-y-3", className)}>
      {items.map((it, i) => {
        const Icon = ICONS[it.icon];
        return (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-agent-soft text-agent">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">{it.title}</p>
              <p className="text-xs text-muted-foreground">{it.time}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
