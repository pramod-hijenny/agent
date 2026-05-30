import { useEffect, useMemo, useState } from "react";
import { useAuthState, useUser, addIntro } from "@/lib/store";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Compass, MapPin, Search, Sparkles } from "lucide-react";
import { scoreMatches, type ScoredMatch } from "@/lib/matching";
import { MatchCard } from "@/components/MatchCard";
import { AgentConversationModal } from "@/components/AgentConversationModal";
import { IntroApprovalModal } from "@/components/IntroApprovalModal";
import type { Goal } from "@/lib/types";
import { toast } from "sonner";
import { DEMO_COMMUNITY } from "@/lib/mock-data";
import { createIntro, discover as apiDiscover, hasApi } from "@/lib/api";

export function Discover() {
  const user = useUser();
  const auth = useAuthState();
  const [query, setQuery] = useState(
    "Find me three AI founders or mentors in SF who can give feedback on my B2B onboarding flow.",
  );
  const [city, setCity] = useState("San Francisco");
  const [goal, setGoal] = useState<Goal | "any">("any");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [convoMatch, setConvoMatch] = useState<ScoredMatch | null>(null);
  const [introMatch, setIntroMatch] = useState<ScoredMatch | null>(null);
  const [remoteMatches, setRemoteMatches] = useState<ScoredMatch[] | null>(null);
  const [loading, setLoading] = useState(false);

  const localMatches = useMemo(
    () => (user ? scoreMatches(user, { city, goal, query, limit: 3 }) : []),
    [user, city, goal, query],
  );
  const matches = remoteMatches ?? localMatches;

  useEffect(() => {
    if (!user || !auth?.token || !hasApi()) return;
    let cancelled = false;
    setLoading(true);
    apiDiscover(auth.token, { city, goal, query, limit: 3 })
      .then((items) => {
        if (cancelled) return;
        setRemoteMatches(
          items.map((item) => ({
            profile: item.profile,
            score: item.score,
            sharedInterests: item.profile.interests.filter((interest) =>
              user.interests.map((value) => value.toLowerCase()).includes(interest.toLowerCase()),
            ),
            complementarySkills: item.profile.skills,
            sharedGoals: item.profile.goals.filter((matchGoal) => user.goals.includes(matchGoal)),
            why: item.reasons.join(" · "),
            conversationTopics: [user.current_ask, item.profile.offering, item.suggested_activity],
          })),
        );
      })
      .catch(() => setRemoteMatches(null))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auth?.token, city, goal, query, user]);

  if (!user) return null;

  async function sendIntro(message: string) {
    if (!introMatch) return;
    const intro = {
      id: crypto.randomUUID(),
      from_user_id: user!.id,
      to_user_id: introMatch.profile.user_id || introMatch.profile.id,
      message,
      status: "pending",
      created_at: Date.now(),
    } as const;
    if (hasApi() && auth?.token) {
      try {
        const saved = await createIntro(auth.token, {
          to_user_id: intro.to_user_id,
          message,
          transcript: [],
          summary: {},
        });
        addIntro(saved);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Intro could not be sent");
        return;
      }
    } else {
      addIntro(intro);
    }
    setIntroMatch(null);
    toast.success(`Intro request sent to ${introMatch.profile.full_name.split(" ")[0]}`);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="rounded-[2rem] border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight">
          <Compass className="h-7 w-7 text-primary" /> Find 3 useful people
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Search inside {DEMO_COMMUNITY.name}. Your agent ranks members by role fit, skills, goals,
          and likely mutual value.
        </p>

        <div className="mt-5 flex items-start gap-3 rounded-[1.5rem] bg-secondary/75 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-agent-soft text-agent">
            <Sparkles className="h-4 w-4" />
          </span>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={2}
            className="min-h-16 flex-1 resize-none bg-transparent p-1 text-[15px] leading-6 text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
          <label className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            />
          </label>
          <div className="min-w-48">
            <Select value={goal} onValueChange={(v) => setGoal(v as Goal | "any")}>
              <SelectTrigger className="rounded-full bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="cofounders">Cofounders</SelectItem>
                <SelectItem value="mentorship">Mentorship</SelectItem>
                <SelectItem value="fundraising">Investor/advisor intros</SelectItem>
                <SelectItem value="customers">Customers/design partners</SelectItem>
                <SelectItem value="feedback">Product feedback</SelectItem>
                <SelectItem value="partnerships">Partnerships</SelectItem>
                <SelectItem value="peer_support">Founder peers</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5">
            <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
            <span className="text-sm font-medium">Verified only</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-black">
          {loading ? "Refreshing matches..." : `${matches.length} useful matches in your community`}
        </p>
        <button className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs font-bold text-primary shadow-sm">
          <Search className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {matches.map((m) => (
          <MatchCard
            key={m.profile.id}
            match={m}
            onAskAgents={() => setConvoMatch(m)}
            onRequestIntro={() => setIntroMatch(m)}
          />
        ))}
      </div>

      <AgentConversationModal
        open={!!convoMatch}
        onOpenChange={(v) => !v && setConvoMatch(null)}
        me={user}
        match={convoMatch}
        query={query}
        onApprove={() => {
          if (convoMatch) {
            setIntroMatch(convoMatch);
            setConvoMatch(null);
          }
        }}
        onReject={() => setConvoMatch(null)}
      />
      <IntroApprovalModal
        open={!!introMatch}
        onOpenChange={(v) => !v && setIntroMatch(null)}
        me={user}
        match={introMatch}
        onSend={sendIntro}
      />
    </div>
  );
}
