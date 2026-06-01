// rtrvr.ai MCP client — drives the user's logged-in Chrome to extract
// social posts from open tabs. The Chrome extension must be installed and
// online for device-backed tools to work.
//
// Auth: VITE_RTRVR_API_KEY (treat as a secret — this is fine for a single-user
// prototype, but for multi-user this call must move behind an InsForge edge
// function so the key never ships to the browser).

const MCP_URL = "https://mcp.rtrvr.ai";

export type RtrvrEnvelope<T> = {
  success: boolean;
  data: T;
  error: string | null;
  metadata?: {
    requestId?: string;
    executionTime?: number;
    creditsUsed?: number;
    creditsRemaining?: number;
  };
  timestamp?: string;
};

export type SocialPostExtraction = {
  external_post_id: string;
  author_name?: string;
  author_handle?: string;
  author_avatar_url?: string;
  content?: string;
  post_url?: string;
  posted_at?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  reposts?: number;
  media_urls?: string[];
};

// JSON Schema rtrvr uses to constrain extraction output. Keep loose — LinkedIn
// markup mutates often; we'd rather get partial rows than fail the whole sync.
const LINKEDIN_POST_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    required: ["external_post_id"],
    properties: {
      external_post_id: {
        type: "string",
        description: "Stable LinkedIn URN or post permalink slug",
      },
      author_name: { type: "string" },
      author_handle: { type: "string", description: "LinkedIn vanity URL slug if available" },
      author_avatar_url: { type: "string" },
      content: { type: "string", description: "Full post body text" },
      post_url: { type: "string", description: "Absolute permalink to the post" },
      posted_at: {
        type: "string",
        description: "ISO 8601 timestamp if visible, else relative time string",
      },
      likes: { type: "number" },
      comments: { type: "number" },
      shares: { type: "number" },
      reposts: { type: "number" },
      media_urls: { type: "array", items: { type: "string" } },
    },
  },
};

function getCredentials() {
  const apiKey = import.meta.env.VITE_RTRVR_API_KEY as string | undefined;
  const deviceId = import.meta.env.VITE_RTRVR_DEVICE_ID as string | undefined;
  if (!apiKey) {
    throw new Error(
      "VITE_RTRVR_API_KEY is not set. Install the rtrvr.ai Chrome extension and copy the API key.",
    );
  }
  return { apiKey, deviceId };
}

async function callTool<T>(
  tool: string,
  params: Record<string, unknown>,
  timeoutMs = 300_000,
): Promise<T> {
  const { apiKey, deviceId } = getCredentials();
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      tool,
      params,
      ...(deviceId ? { deviceId } : {}),
      timeout: timeoutMs,
    }),
  });

  const json = (await res.json()) as RtrvrEnvelope<T>;
  if (!res.ok || !json.success) {
    throw new Error(json.error || `rtrvr ${tool} failed with HTTP ${res.status}`);
  }
  return json.data;
}

export type RtrvrTab = { tabId: number; url: string; title?: string };

export async function listLinkedInTabs(): Promise<RtrvrTab[]> {
  // get_browser_tabs is a free tool — useful sanity check before spending credits.
  const tabs = await callTool<RtrvrTab[]>("get_browser_tabs", { urlIncludes: "linkedin.com" });
  return tabs;
}

type PlannerOutput = {
  output?: unknown[] | string;
  taskCompleted?: boolean;
};

function normalizePlannerPosts(data: PlannerOutput): SocialPostExtraction[] {
  const raw = Array.isArray(data.output) ? data.output : [];
  return raw
    .map((item): SocialPostExtraction | null => {
      const obj =
        typeof item === "string"
          ? (() => {
              try {
                return JSON.parse(item);
              } catch {
                return null;
              }
            })()
          : item;
      if (!obj || typeof obj !== "object") return null;
      const r = obj as Record<string, unknown>;
      return {
        external_post_id:
          (r.post_url as string) || (r.author_name as string) || String(Math.random()),
        author_name: r.author_name as string | undefined,
        content: r.content as string | undefined,
        post_url: r.post_url as string | undefined,
        likes: Number(r.likes) || 0,
        comments: Number(r.comments) || 0,
        shares: Number(r.shares) || 0,
      };
    })
    .filter((x): x is SocialPostExtraction => x !== null);
}

export async function extractLinkedInFeed(
  opts: { maxPosts?: number } = {},
): Promise<SocialPostExtraction[]> {
  // planner navigates to LinkedIn itself and handles SPA rendering reliably.
  // extract_from_tab with a tabUrl opened new tabs and got stuck scrolling.
  const max = opts.maxPosts ?? 10;
  const data = await callTool<PlannerOutput>(
    "planner",
    {
      userInput: `Go to https://www.linkedin.com/feed/ and extract the first ${max} posts visible without scrolling. Skip promoted/sponsored posts. For each post return: author_name, content (full text), post_url (permalink), likes (number), comments (number), shares (number). Return as a JSON array.`,
      maxSteps: 5,
    },
    120_000,
  );

  return normalizePlannerPosts(data);
}

export async function extractFacebookFeed(
  opts: { maxPosts?: number } = {},
): Promise<SocialPostExtraction[]> {
  const max = opts.maxPosts ?? 3;
  const data = await callTool<PlannerOutput>(
    "planner",
    {
      userInput: `Go to https://www.facebook.com/ and extract the first ${max} posts visible in the feed without scrolling. Skip ads and sponsored posts. For each post return: author_name, content (full text), post_url (permalink if available), likes (number), comments (number), shares (number). Return as a JSON array.`,
      maxSteps: 5,
    },
    120_000,
  );
  return normalizePlannerPosts(data);
}
