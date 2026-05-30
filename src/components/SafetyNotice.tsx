import { ShieldCheck } from "lucide-react";

export function SafetyNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-safety/30 bg-safety-soft p-3 text-sm text-safety-foreground">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
