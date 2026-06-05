import type { Profile } from "@/lib/types";
import { DEFAULT_PERMISSIONS } from "@/lib/types";

// Calls the Python FastAPI agent backend (the four pillars + interview).
// The InsForge user JWT is forwarded as a Bearer token; the backend verifies it
// via /api/auth/sessions/current. Set VITE_API_URL to the backend origin.
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "";

async function apiFetch<T>(
  path: string,
  token: string | null,
  body?: unknown,
  method = "POST",
): Promise<T> {
  if (!API_URL) throw new Error("VITE_API_URL is not configured");
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      if (j && (j.detail || j.message)) detail = j.detail || j.message;
    } catch {
      /* keep default */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return (await res.json()) as T;
}

// ─── Registry (Pillar 1) ─────────────────────────────────────────
export function agentsUpsert(
  token: string,
  payload: {
    name: string;
    persona_tone?: string;
    agent_intro?: string;
    mission?: string;
    goals?: string[];
    interests?: string[];
    skills?: string[];
    intent?: string;
    memory?: string[];
    agent_mode_enabled?: boolean;
  },
) {
  return apiFetch<{ agent: { id: string } | null; reembedded: boolean; embed_error?: string }>(
    "/agents",
    token,
    payload,
  );
}

// ─── Test my bee ─────────────────────────────────────────────────
// One-shot "test my agent" reply: send a sample message + the user's profile
// state, get back how their bee would respond (LLM, or a template fallback).
export interface AgentTestReply {
  reply: string;
  source: string;
  error: string;
}

export function testAgent(
  token: string,
  payload: { message: string; state: Record<string, unknown> },
) {
  return apiFetch<AgentTestReply>("/agents/test", token, payload);
}

// ─── Discovery (Pillar 2) ────────────────────────────────────────
// The backend returns agent registry rows (with embedded profile fields). Adapt
// each to the Profile shape the match cards already consume. NOTE: `profile.id`
// here is the AGENT id — used as `to_agent_id` when requesting an intro.
export interface DiscoveryAgent {
  id: string;
  user_id?: string;
  name?: string;
  persona_tone?: string;
  mission?: string;
  interests?: string[];
  goals?: string[];
  skills?: string[];
  intent?: string;
  city?: string;
  full_name?: string;
  avatar_color?: string;
  role?: string;
  company?: string;
}

function agentToProfile(a: DiscoveryAgent): Profile {
  return {
    id: a.id,
    user_id: a.user_id,
    community_id: "demo",
    full_name: a.full_name || a.name || "Member",
    city: a.city || "",
    profession: "",
    company: a.company || "",
    role: (a.role as Profile["role"]) || "Founder",
    stage: "",
    bio: a.mission || "",
    avatar_color: a.avatar_color || "from-sky-400 to-indigo-400",
    interests: a.interests || [],
    skills: a.skills || [],
    goals: (a.goals || []) as Profile["goals"],
    current_ask: a.intent || "",
    offering: "",
    availability: "",
    likes: "",
    dislikes: "",
    topics_enjoy: "",
    topics_avoid: "",
    agent: {
      agent_name: a.name || "",
      tone: (a.persona_tone as Profile["agent"]["tone"]) || "Friendly",
      agent_intro: "",
      current_mission: a.mission || "",
      status: "active",
      memory: [],
    },
    permissions: { ...DEFAULT_PERMISSIONS },
  };
}

export function discover(
  token: string,
  payload: { query: string; city?: string; goal?: string; limit?: number },
) {
  return apiFetch<
    Array<{ agent: DiscoveryAgent; score: number; reasons: string[]; similarity: number | null }>
  >("/discovery", token, {
    need: payload.query || undefined,
    filters: { city: payload.city || undefined, goal: payload.goal || undefined },
    limit: payload.limit ?? 6,
  }).then((rows) =>
    rows.map((r) => ({
      profile: agentToProfile(r.agent),
      score: r.score,
      reasons: r.reasons,
      suggested_activity: r.agent.intent || "Start with a short intro chat",
    })),
  );
}

// ─── Interaction + Trust (Pillars 3+4) ───────────────────────────
export interface MessageRow {
  id: string;
  kind: string;
  from_agent_id: string;
  to_agent_id: string;
  body: string;
  state: "requested" | "screened" | "approved" | "delivered" | "declined";
  decline_reason?: string;
  context?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function messageCreate(
  token: string,
  payload: {
    to_agent_id: string;
    kind?: "intro" | "dm";
    body?: string;
    context?: Record<string, unknown>;
  },
) {
  return apiFetch<{ message: MessageRow; draft_source: string; needs_approval: boolean }>(
    "/messages",
    token,
    {
      kind: "intro",
      ...payload,
    },
  );
}

export function messageApprove(token: string, messageId: string, edited_body?: string) {
  return apiFetch<{
    message_id: string;
    outcome: "approved" | "declined";
    reason: string;
    screening: unknown;
  }>(`/messages/${messageId}/approve`, token, { edited_body });
}

export function messageDeliver(token: string, messageId: string) {
  return apiFetch<{ message_id: string; state: string }>(
    `/messages/${messageId}/deliver`,
    token,
    {},
  );
}

// ─── Interview ───────────────────────────────────────────────────
export function interviewRun(
  token: string,
  payload: { candidate_agent_id: string; topic?: string; max_questions?: number },
) {
  return apiFetch<{
    interview: {
      id: string;
      state: string;
      transcript?: unknown;
      scores?: Record<string, unknown>;
    };
  }>("/interviews", token, payload);
}
