// InsForge edge function: agents-upsert  (Pillar 1 — Registry)
// Create/update the caller's agent registry row and (re)generate its pgvector
// embedding for semantic discovery. Embedding is best-effort: if the embedding
// provider isn't configured (no NEBIUS/OPENAI key or no OPENAI_EMBED_MODEL) or
// returns the wrong dimension, the row is still written with embedding left as-is
// (null on insert), and `embed_error` explains why. Embeddings light up once
// NEBIUS_API_KEY + OPENAI_EMBED_MODEL are set as function secrets.
import { createClient } from "npm:@insforge/sdk";

const EMBED_DIM = 4096; // must match agents.embedding vector(4096) + match_agents()

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

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x)).filter((x) => x.trim());
}

// Deterministic text used to embed an agent. Keep stable so re-embeds compare.
function embeddingSource(row: Record<string, any>): string {
  return (
    `${row.name}. ${row.intent}. Mission: ${row.mission}. ` +
    `Interests: ${(row.interests ?? []).join(", ")}. ` +
    `Skills: ${(row.skills ?? []).join(", ")}. ` +
    `Goals: ${(row.goals ?? []).join(", ")}.`
  );
}

// Best-effort embedding via the OpenAI-compatible /embeddings endpoint (Nebius).
async function embed(
  text: string,
): Promise<{ vector: number[] | null; error: string; model: string }> {
  const apiKey = Deno.env.get("NEBIUS_API_KEY") ?? Deno.env.get("OPENAI_API_KEY");
  // Embeddings live on a different Nebius host than chat, so use a dedicated
  // base URL (falls back to the chat base for other setups).
  const baseUrl = Deno.env.get("OPENAI_EMBED_BASE_URL") ?? Deno.env.get("OPENAI_BASE_URL");
  const model = Deno.env.get("OPENAI_EMBED_MODEL");
  if (!apiKey || !baseUrl || !model) {
    return {
      vector: null,
      model: "",
      error:
        "embedding provider not configured (need NEBIUS_API_KEY + OPENAI_EMBED_BASE_URL + OPENAI_EMBED_MODEL)",
    };
  }
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, input: text }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { vector: null, model: "", error: `embeddings ${res.status}: ${t.slice(0, 180)}` };
    }
    const data = await res.json();
    const vec = data?.data?.[0]?.embedding;
    if (!Array.isArray(vec)) return { vector: null, model: "", error: "no embedding in response" };
    if (vec.length !== EMBED_DIM) {
      return {
        vector: null,
        model: "",
        error: `embedding dim ${vec.length} != EMBED_DIM ${EMBED_DIM}`,
      };
    }
    return { vector: vec as number[], model, error: "" };
  } catch (err) {
    return { vector: null, model: "", error: err instanceof Error ? err.message : String(err) };
  }
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

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return json({ detail: "Invalid JSON body" }, 400);
  }

  const row: Record<string, any> = {
    user_id: userId,
    name: String(body.name ?? ""),
    persona_tone: ["Friendly", "Professional", "Direct", "Warm", "Curious"].includes(
      body.persona_tone,
    )
      ? body.persona_tone
      : "Friendly",
    agent_intro: String(body.agent_intro ?? ""),
    mission: String(body.mission ?? ""),
    goals: asStringArray(body.goals),
    interests: asStringArray(body.interests),
    skills: asStringArray(body.skills),
    intent: String(body.intent ?? ""),
    memory: asStringArray(body.memory),
    agent_mode_enabled: Boolean(body.agent_mode_enabled),
    updated_at: new Date().toISOString(),
  };

  // Best-effort embedding (omitted from the upsert when unavailable so an
  // existing embedding is never clobbered with null on update).
  const { vector, model, error: embedError } = await embed(embeddingSource(row));
  if (vector) {
    row.embedding = `[${vector.join(",")}]`; // pgvector text input form
    row.embedding_model = model;
  }

  const { data: saved, error: saveError } = await client.database
    .from("agents")
    .upsert([row], { onConflict: "user_id" })
    .select(
      "id, user_id, name, persona_tone, agent_intro, mission, goals, interests, skills, intent, memory, agent_mode_enabled, embedding_model, created_at, updated_at",
    );
  if (saveError) return json({ detail: saveError.message ?? "Failed to save agent" }, 500);

  return json({
    agent: saved?.[0] ?? null,
    reembedded: Boolean(vector),
    embed_error: embedError || undefined,
  });
}
