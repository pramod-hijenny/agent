import { cn } from "@/lib/utils";

type BrandMarkProps = {
  compact?: boolean;
  className?: string;
  glyphClassName?: string;
  textClassName?: string;
  light?: boolean;
};

export function BeeGlyph({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-block h-10 w-12 shrink-0 drop-shadow-[0_10px_18px_rgb(0_0_0_/_0.18)]",
        className,
      )}
    >
      <span className="absolute left-[1.05rem] top-0 h-4 w-7 -skew-x-[30deg] rounded-[0.2rem] bg-[#f7b801]" />
      <span className="absolute left-1 top-[1.05rem] h-7 w-9 -skew-x-[28deg] overflow-hidden rounded-[0.22rem] bg-[#f7b801]">
        <span className="absolute left-[0.95rem] top-[-0.35rem] h-10 w-3.5 -rotate-[16deg] bg-[#111111]" />
        <span className="absolute left-[2.15rem] top-[-0.35rem] h-10 w-3.5 -rotate-[16deg] bg-[#111111]" />
      </span>
      <span className="absolute left-0 top-[2.35rem] h-0 w-0 border-y-[0.65rem] border-r-[1.35rem] border-y-transparent border-r-[#111111]" />
      <span className="absolute right-0 top-[1.12rem] h-7 w-6 -skew-x-[22deg] rounded-[0.22rem] bg-[#111111]" />
    </span>
  );
}

export function BrandMark({ compact, className, glyphClassName, light }: BrandMarkProps) {
  if (compact) {
    return (
      <span className={cn("inline-flex items-center", className)}>
        <img
          src="/getmybee-mark.svg"
          alt="Get My Bee"
          className={cn("h-12 w-auto select-none", light && "brightness-0 invert", glyphClassName)}
          draggable={false}
        />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center", className)}>
      <img
        src="/getmybee-logo-horizontal.svg"
        alt="Get My Bee"
        className={cn("h-12 w-auto select-none", light && "brightness-0 invert", glyphClassName)}
        draggable={false}
      />
    </span>
  );
}
