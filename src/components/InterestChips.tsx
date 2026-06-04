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
              "rounded-full px-3 py-1 text-xs font-bold transition-colors",
              isSel
                ? "bg-black text-[#f7b801]"
                : "app-chip hover:border-[#f7b801]/50 hover:bg-[#fff4c8] hover:text-black",
            )}
          >
            {it}
          </button>
        ) : (
          <Badge key={it} variant="secondary" className="app-chip rounded-full font-bold">
            {it}
          </Badge>
        );
      })}
    </div>
  );
}
