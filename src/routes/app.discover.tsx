import { useEffect, useState } from "react";
import { useUser } from "@/lib/store";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Bot, Camera, Compass, Loader2, MapPin, Search, ShieldCheck, Zap } from "lucide-react";
import { type ScoredMatch } from "@/lib/matching";
import { MatchCard } from "@/components/MatchCard";
import { AgentConversationModal } from "@/components/AgentConversationModal";
import type { Goal, Profile } from "@/lib/types";
import { toast } from "sonner";
import { getInsforgeAccessToken } from "@/lib/auth";
import { agentNetworkRun, discover as discoverViaApi } from "@/lib/api";

type BackendMatch = Awaited<ReturnType<typeof discoverViaApi>>[number];

export function Discover() {
  const user = useUser();
  const defaultQuery =
    "Find me three AI founders or mentors in SF who can give feedback on my B2B onboarding flow.";
  const [draftQuery, setDraftQuery] = useState(defaultQuery);
  const [query, setQuery] = useState(defaultQuery);
  const [city, setCity] = useState("San Francisco");
  const [goal, setGoal] = useState<Goal | "any">("any");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [convoMatch, setConvoMatch] = useState<ScoredMatch | null>(null);
  const [matches, setMatches] = useState<ScoredMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkRunning, setNetworkRunning] = useState(false);

  async function runSearch(searchQuery: string) {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getInsforgeAccessToken();
      if (!token) throw new Error("Sign in again to search your community.");
      const results = await discoverViaApi(token, { query: searchQuery, city, goal, limit: 6 });
      setMatches(results.map((item) => toScoredMatch(user, item, searchQuery)));
    } catch (err) {
      setMatches([]);
      toast.error(err instanceof Error ? err.message : "Discovery failed");
    } finally {
      setLoading(false);
    }
  }

  // Load ranked matches on first open.
  useEffect(() => {
    void runSearch(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;
  const currentUser = user;

  async function findMatches() {
    const nextQuery = draftQuery.trim() || defaultQuery;
    setQuery(nextQuery);
    if (!draftQuery.trim()) setDraftQuery(defaultQuery);
    await runSearch(nextQuery);
  }

  async function runMyBee() {
    const nextQuery = draftQuery.trim() || query || defaultQuery;
    setNetworkRunning(true);
    try {
      const token = await getInsforgeAccessToken();
      if (!token) throw new Error("Sign in again so your bee can run.");
      const result = await agentNetworkRun(token, { kind: "all", query: nextQuery, limit: 3 });
      const held = result.status === "held";
      toast.success(
        held
          ? "Your bee ran and held something for review in Messages."
          : "Your bee ran discovery, private agent talks, and a feed action.",
      );
      await runSearch(nextQuery);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not run your bee");
    } finally {
      setNetworkRunning(false);
    }
  }

  return (
    <div className="w-full space-y-5">
      <section className="app-hero relative overflow-hidden rounded-[1.45rem] p-5 text-white shadow-[0_24px_70px_oklch(0.18_0.035_80_/_0.28)] md:p-6">
        <img
          src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=85"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35 grayscale"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="honeycomb-bg absolute inset-0 opacity-10 mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgb(0_0_0_/_0.92),rgb(0_0_0_/_0.72)_56%,rgb(247_184_1_/_0.32))]" />
        <div className="relative grid gap-4 lg:grid-cols-[1fr_270px]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#f7b801]/35 bg-[#f7b801]/15 px-3 py-1.5 text-xs font-black text-[#ffd766] backdrop-blur">
              <Compass className="h-4 w-4" /> Discover your community
            </span>
            <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight tracking-tight md:text-4xl">
              Find people worth meeting this week.
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/70">
              Search by ask, city, and goal. Your agent ranks people by mutual value and drafts
              intros you can approve.
            </p>
          </div>
          <div className="rounded-[1.15rem] border border-white/15 bg-white/12 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-[#f7b801] text-black">
                <Zap className="h-5 w-5 fill-current" />
              </span>
              <div>
                <p className="text-2xl font-black text-[#f7b801]">
                  {loading ? "..." : matches.length}
                </p>
                <p className="text-sm font-semibold text-white/65">ranked matches</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs font-semibold">
              <ShieldCheck className="h-4 w-4" /> Human approval required
            </div>
          </div>
        </div>
      </section>

      <section className="app-card rounded-[1.35rem] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <div>
            <p className="app-kicker">Search request</p>
            <p className="text-sm font-semibold text-[var(--app-muted)]">Matching brief</p>
          </div>
          <span className="rounded-full border border-[#f7b801]/25 bg-[#fff4c8] px-3 py-1 text-xs font-black text-black">
            Agent-ranked
          </span>
        </div>
        <div className="app-field flex items-start gap-3 rounded-[1.15rem] p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.8rem] bg-black text-[#f7b801]">
            <Search className="h-5 w-5" />
          </span>
          <textarea
            aria-label="Search request"
            value={draftQuery}
            onChange={(e) => setDraftQuery(e.target.value)}
            rows={2}
            className="min-h-16 flex-1 resize-none bg-transparent p-1 text-[15px] font-semibold leading-6 text-black outline-none placeholder:text-[var(--app-placeholder)]"
            placeholder="Describe who you want to meet"
          />
        </div>
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end">
          <label className="app-field flex flex-1 items-center gap-2 rounded-full px-4 py-2">
            <MapPin className="h-4 w-4 text-[var(--app-muted)]" />
            <Input
              aria-label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-auto border-0 bg-transparent p-0 font-bold shadow-none focus-visible:ring-0"
            />
          </label>
          <div className="min-w-52">
            <Select value={goal} onValueChange={(v) => setGoal(v as Goal | "any")}>
              <SelectTrigger className="app-field rounded-full border-0 font-bold shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any goal</SelectItem>
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
          <div className="app-field flex items-center gap-3 rounded-full px-4 py-2">
            <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
            <span className="text-sm font-bold text-black">Verified only</span>
          </div>
          <button
            onClick={findMatches}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-black text-[#f7b801] transition hover:-translate-y-0.5"
          >
            <Search className="h-4 w-4" /> {loading ? "Finding..." : "Find matches"}
          </button>
          <button
            onClick={() => void runMyBee()}
            disabled={networkRunning}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f7b801] px-5 py-2.5 text-sm font-black text-black transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {networkRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
            {networkRunning ? "Running..." : "Run my bee"}
          </button>
        </div>
      </section>

      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-bold text-[var(--app-muted)]">
          {loading ? "Refreshing matches..." : `${matches.length} useful matches in your community`}
        </p>
        <span className="app-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm">
          <Camera className="h-3.5 w-3.5" /> Visual profiles
        </span>
      </div>

      {!loading && matches.length === 0 && (
        <div className="app-card rounded-[1.35rem] p-6 text-center text-sm font-semibold text-[var(--app-muted)]">
          No matches yet. As more members set up their bee, they'll show up here.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {matches.map((m) => (
          <MatchCard
            key={m.profile.id}
            match={m}
            onAskAgents={() => setConvoMatch(m)}
            onRequestIntro={() => setConvoMatch(m)}
          />
        ))}
      </div>

      <AgentConversationModal
        open={!!convoMatch}
        onOpenChange={(v) => !v && setConvoMatch(null)}
        me={currentUser}
        match={convoMatch}
        query={query}
        onApprove={() => {
          toast.success("Intro sent for the recipient's agent to screen.");
          setConvoMatch(null);
        }}
        onReject={() => setConvoMatch(null)}
      />
    </div>
  );
}

function toScoredMatch(me: Profile, item: BackendMatch, query: string): ScoredMatch {
  const other = item.profile;
  const lowerInterests = new Set(me.interests.map((interest) => interest.toLowerCase()));
  const sharedInterests = other.interests.filter((interest) =>
    lowerInterests.has(interest.toLowerCase()),
  );
  const sharedGoals = other.goals.filter((goal): goal is Goal => me.goals.includes(goal as Goal));
  const complementarySkills = other.skills.slice(0, 3);
  const conversationTopics = [
    query,
    other.current_ask,
    other.offering,
    item.suggested_activity,
  ].filter(Boolean);

  return {
    profile: other,
    score: item.score,
    sharedInterests,
    complementarySkills,
    sharedGoals,
    why: item.reasons.join(" · ") || "Agent-ranked as a useful community match",
    conversationTopics,
  };
}
