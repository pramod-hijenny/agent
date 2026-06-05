// InsForge edge function: discover
// Server-ranked candidate matching. Ported from the FastAPI service's
// backend/app/services/matching.py:score_profile + /discover route.
// Replaces POST /discover on the old Render backend.
import { createClient } from "npm:@insforge/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// Port of score_profile(me, candidate, query, city, goal) from matching.py.
function scoreProfile(
  me: Record<string, any>,
  candidate: Record<string, any>,
  query: string,
  city: string,
  goal: string,
) {
  let score = 25;
  const reasons: string[] = [];

  if (me.community_id && candidate.community_id === me.community_id) {
    score += 15;
    reasons.push("Same trusted community");
  }

  const meInterests: string[] = me.interests ?? [];
  const candInterests: string[] = candidate.interests ?? [];
  const candSkills: string[] = candidate.skills ?? [];
  const candGoals: string[] = candidate.goals ?? [];

  const shared = [...new Set(meInterests.filter((i) => candInterests.includes(i)))].sort();
  if (shared.length) {
    score += Math.min(24, shared.length * 6);
    reasons.push(`Shared context: ${shared.slice(0, 3).join(", ")}`);
  }

  const askQuery = `${me.current_ask ?? ""} ${query}`.toLowerCase();
  const complementary = [
    ...new Set(candSkills.filter((s) => askQuery.includes(String(s).toLowerCase()))),
  ].sort();
  if (complementary.length) {
    score += Math.min(24, complementary.length * 8);
    reasons.push(`Can help with: ${complementary.slice(0, 3).join(", ")}`);
  }

  if (city && String(candidate.city ?? "").toLowerCase() === city.toLowerCase()) {
    score += 10;
    reasons.push(`Also in ${candidate.city}`);
  }

  if (goal && goal !== "any" && candGoals.includes(goal)) {
    score += 18;
    reasons.push(`Aligned goal: ${goal}`);
  }

  const q = query.toLowerCase();
  const haystack = [
    candidate.bio ?? "",
    candidate.role ?? "",
    candidate.stage ?? "",
    candidate.current_ask ?? "",
    candidate.offering ?? "",
    candInterests.join(" "),
    candSkills.join(" "),
  ]
    .join(" ")
    .toLowerCase();
  const matchingWords = q.split(/\s+/).filter((w) => w.length > 3 && haystack.includes(w));
  if (matchingWords.length) {
    score += Math.min(15, matchingWords.length * 3);
    reasons.push("Bio matches your request");
  }

  if (!reasons.length) reasons.push("Clear startup networking ask");

  const activity = candidate.availability || "Start with a short intro chat";
  return { profile: candidate, score: Math.min(score, 100), reasons, suggested_activity: activity };
}

export default async function (req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ detail: "Method not allowed" }, 405);

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const client = createClient({
    baseUrl: Deno.env.get("INSFORGE_BASE_URL"),
    edgeFunctionToken: token ?? undefined,
  });

  const { data: userData } = await client.auth.getCurrentUser();
  const userId = userData?.user?.id;
  if (!userId) return json({ detail: "Unauthorized" }, 401);

  let payload: { query?: string; city?: string; goal?: string; limit?: number };
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }
  const query = payload.query ?? "";
  const city = payload.city ?? "";
  const goal = payload.goal ?? "any";
  const limit = Math.min(Math.max(payload.limit ?? 10, 1), 20);

  // Load the caller's profile.
  const { data: meRows, error: meError } = await client.database
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .limit(1);
  if (meError) return json({ detail: meError.message ?? "Failed to load profile" }, 500);
  const me = meRows?.[0];
  if (!me) return json({ detail: "Profile not found" }, 404);

  const permissions = me.permissions ?? {};
  if (permissions.can_recommend_people === false) {
    return json({ detail: "Your agent cannot recommend people" }, 403);
  }

  // Candidate profiles: same community, not me.
  const { data: candidates, error: candError } = await client.database
    .from("profiles")
    .select("*")
    .eq("community_id", me.community_id ?? "demo")
    .neq("user_id", userId);
  if (candError) return json({ detail: candError.message ?? "Failed to load candidates" }, 500);

  const scored = (candidates ?? [])
    .map((candidate: Record<string, any>) => scoreProfile(me, candidate, query, city, goal))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return json(scored);
}
