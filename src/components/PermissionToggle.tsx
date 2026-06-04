import { Switch } from "@/components/ui/switch";
import { Lock } from "lucide-react";

export function PermissionToggle({
  label,
  description,
  checked,
  onCheckedChange,
  locked,
  sensitive,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange?: (v: boolean) => void;
  locked?: boolean;
  sensitive?: boolean;
}) {
  return (
    <div className="app-soft-panel flex items-start justify-between gap-4 rounded-[1.1rem] p-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-black text-black">
          {label}
          {locked && <Lock className="h-3 w-3 text-[var(--app-muted)]" />}
          {sensitive && !locked && (
            <span className="rounded-full border border-[#f7b801]/25 bg-[#fff3d5] px-2 py-0.5 text-[10px] font-bold text-[#7a4d00]">
              Sensitive
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs font-semibold text-[var(--app-muted)]">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={locked} />
    </div>
  );
}
