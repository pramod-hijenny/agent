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
    <div className="flex items-start justify-between gap-4 rounded-[1.25rem] bg-slate-100 p-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-black">
          {label}
          {locked && <Lock className="h-3 w-3 text-slate-400" />}
          {sensitive && !locked && (
            <span className="rounded-full bg-[#fff3d5] px-2 py-0.5 text-[10px] font-semibold text-[#a35c00]">
              Sensitive
            </span>
          )}
        </div>
        {description && <p className="mt-1 text-xs font-semibold text-slate-500">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={locked} />
    </div>
  );
}
