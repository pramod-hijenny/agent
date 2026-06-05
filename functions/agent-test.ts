// InsForge edge function: agent-test
// One-shot "test my bee" reply. Ported from generate_agent_reply in
// backend/app/agents/workflows.py. Replaces POST /agents/test.
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

async function callLlm(systemPrompt: string, userPrompt: string) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const baseUrl = Deno.env.get("OPENAI_BASE_URL") ?? "https://api.openai.com/v1";
  const model = Deno.env.get("OPENAI_MODEL");
  if (!apiKey || !model) {
    return {
      message: "",
      source: "fallback",
      error: "OPENAI_API_KEY or OPENAI_MODEL is not configured",
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
        source: "fallback",
        error: `LLM request failed (${res.status}): ${text.slice(0, 200)}`,
      };
    }
    const data = await res.json();
    const content = String(data?.choices?.[0]?.message?.content ?? "").trim();
    if (content) return { message: content, source: "llm", error: "" };
    return { message: "", source: "fallback", error: "LLM returned an empty message" };
  } catch (err) {
    return {
      message: "",
      source: "fallback",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

const FALLBACK =
  "I can help with matching, intro drafts, and privacy-safe recommendations once the " +
  "agent model is available.";

export default async function (req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ detail: "Method not allowed" }, 405);

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const client = createClient({
    baseUrl: Deno.env.get("INSFORGE_BASE_URL"),
    edgeFunctionToken: token ?? undefined,
  });

  const { data: userData } = await client.auth.getCurrentUser();
  if (!userData?.user?.id) return json({ detail: "Unauthorized" }, 401);

  let body: { message?: string; state?: Record<string, any> };
  try {
    body = await req.json();
  } catch {
    return json({ detail: "Invalid JSON body" }, 400);
  }
  const message = (body.message ?? "").toString();
  const state = body.state ?? {};
  const profile = state.profile ?? {};
  const permissions = state.permissions ?? {};

  const personaPrompt = buildPersonaPrompt(profile, permissions, loadMemory(profile));
  const result = await callLlm(
    personaPrompt,
    "Answer as the user's social representative in under 80 words. " +
      "Do not claim to send messages or share contact details.\n\n" +
      `User message: ${message}`,
  );

  if (result.source === "llm") {
    return json({ reply: result.message, source: "llm", error: "" });
  }
  return json({ reply: FALLBACK, source: "fallback", error: result.error });
}
