import { SEED_PROFILES } from "./mock-data";
import type { Goal, MatchSummary, Profile, TranscriptTurn } from "./types";
import { GOAL_LABELS } from "./types";

export interface ScoredMatch {
  profile: Profile;
  score: number;
  sharedInterests: string[];
  complementarySkills: string[];
  sharedGoals: Goal[];
  why: string;
  conversationTopics: string[];
}

export function scoreMatches(
  me: Profile,
  opts: { city?: string; goal?: Goal | "any"; query?: string; limit?: number } = {},
): ScoredMatch[] {
  const targetCity = (opts.city || "").trim().toLowerCase();
  const q = (opts.query || "").toLowerCase();

  return SEED_PROFILES.filter((p) => p.id !== me.id)
    .filter((p) => p.community_id === me.community_id)
    .filter((p) => {
      if (opts.goal && opts.goal !== "any") {
        return p.goals.includes(opts.goal);
      }
      return true;
    })
    .map((p) => {
      const sharedInterests = p.interests.filter((i) =>
        me.interests.map((x) => x.toLowerCase()).includes(i.toLowerCase()),
      );
      const sharedGoals = p.goals.filter((g) => me.goals.includes(g));
      const complementarySkills = p.skills.filter((skill) => {
        const lowerSkill = skill.toLowerCase();
        return (
          me.current_ask.toLowerCase().includes(lowerSkill) ||
          me.topics_enjoy.toLowerCase().includes(lowerSkill) ||
          q.includes(lowerSkill)
        );
      });
      const cityBonus = targetCity
        ? p.city.toLowerCase().includes(targetCity)
          ? 15
          : 0
        : p.city.toLowerCase() === me.city.toLowerCase()
          ? 8
          : 0;
      const queryBonus = q ? scoreQueryFit(q, p) : 0;
      const roleBonus = scoreRoleFit(me, p, q);
      const score = Math.min(
        99,
        38 +
          sharedInterests.length * 6 +
          sharedGoals.length * 7 +
          complementarySkills.length * 8 +
          cityBonus +
          queryBonus +
          roleBonus,
      );
      const why = buildWhy(sharedInterests, complementarySkills, sharedGoals, p, me, targetCity);
      const conversationTopics = buildConversationTopics(
        me,
        p,
        sharedInterests,
        complementarySkills,
      );
      return {
        profile: p,
        score,
        sharedInterests,
        complementarySkills,
        sharedGoals,
        why,
        conversationTopics,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.limit ?? 3);
}

function buildWhy(
  shared: string[],
  skills: string[],
  goals: Goal[],
  p: Profile,
  me: Profile,
  targetCity: string,
): string {
  const bits: string[] = [];
  if (p.community_id === me.community_id) bits.push("same trusted community");
  if (skills.length)
    bits.push(
      `${p.full_name.split(" ")[0]} can help with ${skills.slice(0, 2).join(", ").toLowerCase()}`,
    );
  if (goals.length)
    bits.push(`aligned goals: ${goals.map((g) => GOAL_LABELS[g].toLowerCase()).join(", ")}`);
  if (shared.length) bits.push(`shared context: ${shared.slice(0, 3).join(", ").toLowerCase()}`);
  if (targetCity && p.city.toLowerCase().includes(targetCity)) bits.push(`based in ${p.city}`);
  if (!bits.length) bits.push(`${p.full_name} has a clear startup networking ask`);
  return bits.join(" · ");
}

function scoreQueryFit(q: string, p: Profile): number {
  const haystack = [
    p.bio,
    p.role,
    p.stage,
    p.current_ask,
    p.offering,
    p.interests.join(" "),
    p.skills.join(" "),
    p.goals.map((g) => GOAL_LABELS[g]).join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return q.split(/\W+/).filter((word) => word.length > 3 && haystack.includes(word)).length * 3;
}

function scoreRoleFit(me: Profile, p: Profile, q: string): number {
  const ask = `${me.current_ask} ${q}`.toLowerCase();
  if (ask.includes("cofounder") && (p.role === "Founder" || p.role === "Builder")) return 14;
  if (
    (ask.includes("mentor") || ask.includes("advisor")) &&
    (p.role === "Mentor" || p.role === "Advisor")
  )
    return 14;
  if ((ask.includes("investor") || ask.includes("fundraising")) && p.role === "Investor") return 14;
  if ((ask.includes("customer") || ask.includes("design partner")) && p.goals.includes("customers"))
    return 10;
  if ((ask.includes("growth") || ask.includes("sales")) && p.skills.includes("Sales")) return 10;
  return 0;
}

function buildConversationTopics(
  me: Profile,
  other: Profile,
  shared: string[],
  skills: string[],
): string[] {
  return [
    me.current_ask,
    other.offering,
    ...(skills.length
      ? [`How ${other.full_name.split(" ")[0]} approaches ${skills[0].toLowerCase()}`]
      : []),
    ...(shared.length ? [`Shared context around ${shared[0].toLowerCase()}`] : []),
  ].slice(0, 4);
}

export function generateTranscript(me: Profile, other: Profile, query: string): TranscriptTurn[] {
  const shared = other.interests.filter((i) =>
    me.interests.map((x) => x.toLowerCase()).includes(i.toLowerCase()),
  );
  const sharedGoals = other.goals.filter((g) => me.goals.includes(g));
  const topInterest = shared[0] || other.interests[0];

  const turns: TranscriptTurn[] = [
    {
      speaker: "user",
      text: `Hi ${other.agent.agent_name}. My user ${me.full_name.split(" ")[0]} is ${
        query ? `interested in: "${query}"` : `looking to meet people in ${other.city}`
      }. They love ${me.interests.slice(0, 3).join(", ").toLowerCase()}. Open to a chat?`,
    },
    {
      speaker: "other",
      text: `Hi. ${other.full_name.split(" ")[0]} enjoys ${other.interests.slice(0, 3).join(", ").toLowerCase()}. ${
        shared.length
          ? `We share ${shared.slice(0, 2).join(" and ").toLowerCase()}.`
          : "Could be a fresh connection."
      } What's the goal?`,
    },
    {
      speaker: "user",
      text: `Mostly ${sharedGoals.length ? GOAL_LABELS[sharedGoals[0]].toLowerCase() : "a friendly intro"}. ${"This is a professional networking ask inside the community."}`,
    },
    {
      speaker: "other",
      text: `${other.full_name.split(" ")[0]} is open to ${other.goals
        .map((g) => GOAL_LABELS[g].toLowerCase())
        .slice(0, 2)
        .join(" and ")}. Best fit would be ${topInterest.toLowerCase()}-related.`,
    },
    {
      speaker: "user",
      text: `Great. A short coffee or walk in ${other.city}? Both users will approve before any contact info is shared.`,
    },
    {
      speaker: "other",
      text: `Sounds good. ${other.agent.memory[0] || "Daytime works best."} I'll surface this to ${other.full_name.split(" ")[0]} for approval.`,
    },
  ];
  return turns;
}

export function summarize(me: Profile, other: Profile, match: ScoredMatch): MatchSummary {
  const strength: MatchSummary["match_strength"] =
    match.score >= 80 ? "Strong" : match.score >= 65 ? "Good" : "Light";
  const goalLabel = match.sharedGoals[0] ? GOAL_LABELS[match.sharedGoals[0]] : "Useful intro";
  const activity = other.availability || "Short intro call";
  return {
    match_strength: strength,
    best_connection_type: goalLabel,
    mutual_value: `${other.full_name.split(" ")[0]} offers: ${other.offering}`,
    conversation_starter: match.conversationTopics[0] || me.current_ask,
    suggested_activity: activity,
  };
}

export function suggestIntroMessage(me: Profile, other: Profile, match: ScoredMatch): string {
  const topic = match.conversationTopics[0] || me.current_ask;
  return `Hi ${other.full_name.split(" ")[0]}, Get My Bee suggested an intro because ${match.why}. I am currently looking for: ${me.current_ask} I thought a short conversation about "${topic}" could be useful for both of us. Open to a brief intro call?`;
}
