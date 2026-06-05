// InsForge edge function: agent-run-start
// Scores client-supplied candidates, drafts an intro via the LLM, and pauses
// for human approval (sets __interrupt__). Ported from start_agent_workflow +
// build_persona_prompt + score_candidates + draft_intro in
// backend/app/agents/workflows.py. Replaces POST /agents/runs.
// Run state is persisted to the agent_runs table (edge functions are stateless,
// so this replaces the FastAPI in-memory _RUN_MEMORY).
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

function loadMemory(profile: Record<string, any>): string[] {
  const memory = profile?.agent?.memory ?? [];
  return (memory as unknown[]).map((m) => String(m)).filter((m) => m.trim());
}

// Port of build_persona_prompt().
function buildPersonaPrompt(
  profile: Record<string, any>,
  permissions: Record<string, any>,
  memory: string[],
): string {
  const agent = profile?.agent ?? {};
  const allowed = Object.entries(permissions ?? {})
    .filter(([, v]) => v === true)
    .map(([k]) => k.replace("can_", "").replace(/_/g, " "));
  const blocked = Object.entries(permissions ?? {})
    .filter(([, v]) => v === false)
    .map(([k]) => k.replace("can_", "").replace(/_/g, " "));
  const memoryBlock = memory.length
    ? memory.map((m) => `- ${m}`).join("\n")
    : "- No stored memories yet.";
  return (
    `You are ${agent.agent_name ?? "AgentCircle Agent"}, an AI social representative ` +
    `for ${profile?.full_name ?? "this member"}.\n` +
    `Tone: ${agent.tone ?? "Warm"}.\n` +
    `Mission: ${agent.current_mission ?? "Find compatible people to meet"}.\n` +
    `Intro boundary: ${agent.agent_intro ?? "Represent the user honestly and briefly"}.\n\n` +
    "Stored memory:\n" +
    `${memoryBlock}\n\n` +
    `Allowed capabilities: ${allowed.join(", ") || "none"}.\n` +
    `Blocked capabilities: ${blocked.join(", ") || "none"}.\n\n` +
    "Rules: never impersonate the human, never share contact details without explicit " +
    "permission, and draft introductions for human approval rather than sending them."
  );
}

// Port of score_candidates().
function scoreCandidates(state: Record<string, any>) {
  const profile = state.profile ?? {};
  const candidates: Record<string, any>[] = state.candidates ?? [];
  const query = String(state.query ?? "").toLowerCase();
  const profileInterests = new Set(
    (profile.interests ?? []).map((i: unknown) => String(i).toLowerCase()),
  );
  const profileGoals = new Set((profile.goals ?? []).map((g: unknown) => String(g).toLowerCase()));

  const matches = candidates.map((candidate) => {
    const candInterests = new Set(
      (candidate.interests ?? []).map((i: unknown) => String(i).toLowerCase()),
    );
    const candGoals = new Set((candidate.goals ?? []).map((g: unknown) => String(g).toLowerCase()));
    const sharedInterests = [...profileInterests].filter((i) => candInterests.has(i)).sort();
    const sharedGoals = [...profileGoals].filter((g) => candGoals.has(g)).sort();
    let score = 40 + sharedInterests.length * 8 + sharedGoals.length * 6;
    const reasons: string[] = [];
    if (sharedInterests.length)
      reasons.push(`Shared interests: ${sharedInterests.slice(0, 3).join(", ")}`);
    if (sharedGoals.length) reasons.push(`Shared goals: ${sharedGoals.slice(0, 3).join(", ")}`);
    const city = String(candidate.city ?? "").toLowerCase();
    if (city && query.includes(city)) {
      score += 15;
      reasons.push("City matches request");
    }
    if (!reasons.length) reasons.push("Open to compatible introductions");
    return { profile: candidate, score: Math.min(score, 99), reasons };
  });

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 10);
}

// Reproduces create_agent(tools=[]) — a single chat completion with a system prompt.
async function callLlm(systemPrompt: string, userPrompt: string) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const baseUrl = Deno.env.get("OPENAI_BASE_URL") ?? "https://api.openai.com/v1";
  const model = Deno.env.get("OPENAI_MODEL");
  if (!apiKey || !model) {
    return {
      message: "",
      draft_source: "fallback",
      llm_error: "OPENAI_API_KEY or OPENAI_MODEL is not configured",
    };
  }
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        message: "",
        draft_source: "fallback",
        llm_error: `LLM request failed (${res.status}): ${text.slice(0, 200)}`,
      };
    }
    const data = await res.json();
    const content = String(data?.choices?.[0]?.message?.content ?? "").trim();
    if (content) return { message: content, draft_source: "llm", llm_error: "" };
    return { message: "", draft_source: "fallback", llm_error: "LLM returned an empty message" };
  } catch (err) {
    return {
      message: "",
      draft_source: "fallback",
      llm_error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Port of draft_intro(): respects can_draft_messages, drafts for the top match.
async function draftIntro(state: Record<string, any>, personaPrompt: string) {
  const permissions = state.permissions ?? {};
  if (permissions.can_draft_messages === false) {
    return { message: "", draft_source: "disabled", llm_error: "" };
  }
  const matches = state.matches ?? [];
  if (!matches.length) return { message: "", draft_source: "none", llm_error: "" };

  const profile = state.profile ?? {};
  const target = matches[0].profile;
  const shared = (target.interests ?? []).slice(0, 2).join(", ") || "similar goals";
  const fallback =
    `Hi ${target.full_name ?? "there"}, my agent thought we might have a good ` +
    `conversation around ${shared}. Would you be open to an intro?`;

  const result = await callLlm(
    personaPrompt,
    "Draft one concise, warm introduction request under 55 words.\n\n" +
      `Sender profile: ${JSON.stringify(profile)}\n\n` +
      `Target profile: ${JSON.stringify(target)}\n\n` +
      "Do not imply either human has already approved the intro.",
  );
  if (result.draft_source === "llm") {
    return { message: result.message, draft_source: "llm", llm_error: "" };
  }
  return { message: fallback, draft_source: "fallback", llm_error: result.llm_error };
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

  let body: { thread_id?: string; workflow?: string; state?: Record<string, any> };
  try {
    body = await req.json();
  } catch {
    return json({ detail: "Invalid JSON body" }, 400);
  }
  const threadId = body.thread_id;
  const workflow = body.workflow ?? "intro_review";
  const state = body.state ?? {};
  if (!threadId) return json({ detail: "thread_id is required" }, 400);

  // start_agent_workflow()
  const memory = loadMemory(state.profile ?? {});
  const personaPrompt = buildPersonaPrompt(state.profile ?? {}, state.permissions ?? {}, memory);
  const matches = scoreCandidates(state);
  const logs = ["loaded persona and memory", "scored candidates"];

  const draft = await draftIntro({ ...state, matches }, personaPrompt);
  const draftMessage = draft.message;

  const output: Record<string, any> = {
    draft_message: draftMessage,
    draft_source: draft.draft_source,
    llm_error: draft.llm_error,
    matches,
  };

  let status = "completed";
  if (draftMessage) {
    logs.push("drafted intro for human approval");
    output.__interrupt__ = [{ action: "review_intro", draft_message: draftMessage, matches }];
    status = "waiting_for_approval";
  } else {
    logs.push("no draft created");
  }
  output.logs = logs;

  const row = {
    user_id: userId,
    thread_id: threadId,
    workflow,
    status,
    input: body,
    output,
    error: "",
    updated_at: new Date().toISOString(),
  };

  const { data: saved, error: saveError } = await client.database
    .from("agent_runs")
    .upsert([row], { onConflict: "thread_id" })
    .select();
  if (saveError) return json({ detail: saveError.message ?? "Failed to persist run" }, 500);

  return json(saved?.[0] ?? row);
}
