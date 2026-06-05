// InsForge edge function: agent-run-resume
// Finalizes an agent run after human approval/rejection. Ported from
// resume_agent_workflow in backend/app/agents/workflows.py. Replaces
// POST /agents/runs/{threadId}/resume.
// Loads prior state from the agent_runs table (replaces in-memory _RUN_MEMORY).
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

  let body: { thread_id?: string; decision?: { approved?: boolean; edited_message?: string } };
  try {
    body = await req.json();
  } catch {
    return json({ detail: "Invalid JSON body" }, 400);
  }
  const threadId = body.thread_id;
  const decision = body.decision ?? {};
  if (!threadId) return json({ detail: "thread_id is required" }, 400);

  // Load prior run (RLS restricts to the owner).
  const { data: rows, error: loadError } = await client.database
    .from("agent_runs")
    .select("*")
    .eq("thread_id", threadId)
    .limit(1);
  if (loadError) return json({ detail: loadError.message ?? "Failed to load run" }, 500);
  const run = rows?.[0];
  if (!run) return json({ detail: "Run not found" }, 404);

  const output: Record<string, any> = { ...(run.output ?? {}) };
  const approved = Boolean(decision.approved);
  const editedMessage = decision.edited_message || output.draft_message || "";

  output.draft_message = editedMessage;
  output.approved = approved;
  output.logs = [
    ...(output.logs ?? []),
    approved ? "human approved intro" : "human rejected intro",
    `finalized workflow ${threadId}`,
  ];
  delete output.__interrupt__;

  const { data: saved, error: saveError } = await client.database
    .from("agent_runs")
    .update({ status: "completed", output, updated_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .select();
  if (saveError) return json({ detail: saveError.message ?? "Failed to update run" }, 500);

  return json(saved?.[0] ?? { ...run, status: "completed", output });
}
