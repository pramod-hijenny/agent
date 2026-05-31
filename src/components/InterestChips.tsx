import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function InterestChips({
  items,
  selected,
  onToggle,
  className,
}: {
  items: readonly string[] | string[];
  selected?: string[];
  onToggle?: (item: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((it) => {
        const isSel = selected?.includes(it);
        return onToggle ? (
          <button
            key={it}
            type="button"
            onClick={() => onToggle(it)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              isSel
                ? "bg-black text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-black",
            )}
          >
            {it}
          </button>
        ) : (
          <Badge
            key={it}
            variant="secondary"
            className="rounded-full bg-slate-100 font-medium text-slate-600"
          >
            {it}
          </Badge>
        );
      })}
    </div>
  );
}
