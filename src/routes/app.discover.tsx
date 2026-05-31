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
import { Camera, Compass, MapPin, Search, ShieldCheck, Sparkles, Users, Zap } from "lucide-react";
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
    () => (user ? scoreMatches(user, { city, goal, query, limit: 4 }) : []),
    [user, city, goal, query],
  );
  const matches = remoteMatches ?? localMatches;

  useEffect(() => {
    if (!user || !auth?.token || !hasApi()) return;
    let cancelled = false;
    setLoading(true);
    apiDiscover(auth.token, { city, goal, query, limit: 4 })
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
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="relative overflow-hidden rounded-[1.35rem] bg-black p-4 text-white shadow-[0_16px_44px_rgb(15_23_42_/_0.18)] md:p-5">
        <img
          src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=85"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/35" />
        <div className="relative grid gap-4 lg:grid-cols-[1fr_270px]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <Compass className="h-4 w-4" /> Discover inside {DEMO_COMMUNITY.name}
            </span>
            <h1 className="mt-3 max-w-3xl text-2xl font-bold leading-tight tracking-tight md:text-3xl">
              Find people worth meeting this week.
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/70">
              Search by ask, role, city, and goal. Your agent ranks people by mutual value and
              drafts intros you can approve.
            </p>
          </div>
          <div className="rounded-[1.1rem] border border-white/25 bg-white/15 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7df3c8] text-black">
                <Zap className="h-5 w-5 fill-current" />
              </span>
              <div>
                <p className="text-xl font-bold">{loading ? "..." : matches.length}</p>
                <p className="text-sm font-medium text-white/65">ranked matches</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs font-semibold">
              <ShieldCheck className="h-4 w-4" /> Human approval required
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.35rem] border border-white/80 bg-white/90 p-4 shadow-[0_14px_36px_rgb(41_55_92_/_0.1)] backdrop-blur-xl">
        <div className="flex items-start gap-3 rounded-[1.1rem] bg-slate-100 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={2}
            className="min-h-16 flex-1 resize-none bg-transparent p-1 text-[15px] font-semibold leading-6 text-black outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end">
          <label className="flex flex-1 items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
            <MapPin className="h-4 w-4 text-slate-500" />
            <Input
              aria-label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-auto border-0 bg-transparent p-0 font-semibold shadow-none focus-visible:ring-0"
            />
          </label>
          <div className="min-w-52">
            <Select value={goal} onValueChange={(v) => setGoal(v as Goal | "any")}>
              <SelectTrigger className="rounded-full border-0 bg-slate-100 font-semibold">
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
          <div className="flex items-center gap-3 rounded-full bg-slate-100 px-4 py-2">
            <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
            <span className="text-sm font-semibold">Verified only</span>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white">
            <Search className="h-4 w-4" /> Refresh
          </button>
        </div>
      </section>

      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-semibold text-slate-500">
          {loading ? "Refreshing matches..." : `${matches.length} useful matches in your community`}
        </p>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
          <Camera className="h-3.5 w-3.5" /> Visual profiles
        </span>
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
