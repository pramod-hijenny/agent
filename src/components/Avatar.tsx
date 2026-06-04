import { cn } from "@/lib/utils";

export function GradientAvatar({
  name,
  colorClass,
  size = "md",
  className,
}: {
  name: string;
  colorClass?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const sizes = {
    sm: "h-8 w-8 rounded-[0.75rem] text-xs",
    md: "h-10 w-10 rounded-[0.9rem] text-sm",
    lg: "h-14 w-14 rounded-[1.1rem] text-base",
    xl: "h-20 w-20 rounded-[1.45rem] text-xl",
  };
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-gradient-to-br font-black text-white shadow-[0_10px_24px_oklch(0.22_0.04_80_/_0.16)] ring-1 ring-white/70",
        colorClass || "from-[#151515] to-[#f7b801]",
        sizes[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}
