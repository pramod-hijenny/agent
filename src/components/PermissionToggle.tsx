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
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          {label}
          {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
          {sensitive && !locked && (
            <span className="rounded-full bg-safety-soft px-1.5 py-0.5 text-[10px] font-medium text-safety-foreground">
              Sensitive
            </span>
          )}
        </div>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={locked} />
    </div>
  );
}
