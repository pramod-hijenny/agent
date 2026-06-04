export function MatchScoreBadge({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-[#f7b801]/25 bg-[#fff4c8] px-2.5 py-1 text-xs font-black text-black">
      <span className="h-1.5 w-1.5 rounded-full bg-[#f7b801]" />
      {score}% match
    </div>
  );
}
