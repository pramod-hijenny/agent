export function MatchScoreBadge({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary/10 to-agent/10 px-2.5 py-1 text-xs font-semibold text-primary">
      <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-agent" />
      {score}% match
    </div>
  );
}
