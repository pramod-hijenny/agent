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
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl",
  };
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-sm",
        colorClass || "from-primary to-agent",
        sizes[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}
