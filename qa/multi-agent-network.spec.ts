import {
  expect,
  test,
  chromium,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { createClient } from "@insforge/sdk";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

type EnvMap = Record<string, string>;

type SdkError = {
  message?: string;
};

type SdkResult<T> = {
  data: T;
  error?: SdkError | null;
};

type AccountSpec = {
  key: "alpha" | "beta" | "gamma";
  email: string;
  full_name: string;
  city: string;
  role: string;
  stage: string;
  bio: string;
  interests: string[];
  skills: string[];
  goals: string[];
  current_ask: string;
  offering: string;
  agent_name: string;
  tone: string;
};

type TestAccount = AccountSpec & {
  agentId: string;
  profileId: string;
  token: string;
  userId: string;
};

type AgentRunResponse = {
  run_id: string;
  status: string;
  result?: {
    matches?: Array<{ agent_id: string; score: number }>;
    conversations?: Array<{ id: string }>;
    actions?: Array<{ id?: string }>;
  };
};

const repoRoot = path.resolve(import.meta.dirname, "..");
const env = loadEnv(path.join(repoRoot, ".env"));
const frontendUrl = stripTrailingSlash(process.env.QA_FRONTEND_URL || "http://127.0.0.1:5173");
const apiUrl = stripTrailingSlash(
  process.env.QA_API_URL || env.VITE_API_URL || "http://127.0.0.1:8000",
);
const insforgeUrl = env.VITE_INSFORGE_URL;
const insforgeAnonKey = env.VITE_INSFORGE_ANON_KEY;
const runId = process.env.QA_RUN_ID || String(Date.now());
const headless = process.env.QA_HEADLESS === "1";
const pauseMs = Number(process.env.QA_PAUSE_MS || (headless ? 0 : 4000));
const artifactDir = path.join(repoRoot, "qa", "artifacts", runId);
const profileDir = path.join(repoRoot, "qa", ".profiles", runId);

test.describe.configure({ mode: "serial" });

test("multiple agents can discover, connect, and see private agent talks", async ({
  browserName,
}, testInfo) => {
  test.setTimeout(300_000);
  expect(browserName).toBe("chromium");
  mkdirSync(artifactDir, { recursive: true });
  mkdirSync(profileDir, { recursive: true });

  expect(insforgeUrl, "VITE_INSFORGE_URL must be set in .env").toBeTruthy();
  expect(insforgeAnonKey, "VITE_INSFORGE_ANON_KEY must be set in .env").toBeTruthy();

  const [alpha, beta, gamma] = await seedAccounts();
  const contexts: BrowserContext[] = [];

  try {
    const alphaContext = await launchAgentWindow("alpha", 0);
    const betaContext = await launchAgentWindow("beta", 1);
    contexts.push(alphaContext, betaContext);

    const alphaPage = alphaContext.pages()[0] || (await alphaContext.newPage());
    const betaPage = betaContext.pages()[0] || (await betaContext.newPage());

    await Promise.all([signIn(alphaPage, alpha.email), signIn(betaPage, beta.email)]);

    const run = await runTargetedAgentChat(alpha, beta);
    expect(["completed", "held"]).toContain(run.status);
    expect(run.result?.matches?.some((match) => match.agent_id === beta.agentId)).toBe(true);
    expect(run.result?.conversations?.length || 0).toBeGreaterThan(0);

    await Promise.all([
      openAgentTalks(alphaPage, beta.full_name),
      openAgentTalks(betaPage, alpha.full_name),
    ]);

    await assertAgentTalks(alphaPage, {
      expectedCounterpart: beta.full_name,
      expectedOwnLabel: "Your bee",
      screenshotName: "alpha-agent-talks.png",
      testInfo,
    });
    await assertAgentTalks(betaPage, {
      expectedCounterpart: alpha.full_name,
      expectedOwnLabel: "Your bee",
      screenshotName: "beta-agent-talks.png",
      testInfo,
    });

    await expect(alphaPage.getByText("Failed to fetch")).toHaveCount(0);
    await expect(betaPage.getByText("Failed to fetch")).toHaveCount(0);

    if (pauseMs > 0) await alphaPage.waitForTimeout(pauseMs);
    expect(gamma.agentId).toBeTruthy();
  } finally {
    await Promise.all(contexts.map((context) => context.close().catch(() => undefined)));
  }
});

function loadEnv(filePath: string): EnvMap {
  const values: EnvMap = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (match) values[match[1]] = match[2];
  }
  return values;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

function derivePassword(email: string): string {
  const seed = Buffer.from(email.trim().toLowerCase(), "utf8").toString("base64");
  return `Gmb!${seed}9a`;
}

async function must<T>(label: string, promise: Promise<SdkResult<T>>): Promise<T> {
  const result = await promise;
  if (result.error) throw new Error(`${label}: ${result.error.message || "SDK request failed"}`);
  return result.data;
}

async function seedAccounts(): Promise<[TestAccount, TestAccount, TestAccount]> {
  const specs = buildAccountSpecs();
  const accounts: TestAccount[] = [];
  for (const spec of specs) accounts.push(await seedAccount(spec));
  return [accounts[0], accounts[1], accounts[2]];
}

function buildAccountSpecs(): [AccountSpec, AccountSpec, AccountSpec] {
  return [
    {
      key: "alpha",
      email: `alpha.agent.${runId}@example.com`,
      full_name: "Alpha Founder",
      city: "San Francisco",
      role: "Founder",
      stage: "Pre-seed",
      bio: "Building B2B onboarding analytics for AI SaaS teams.",
      interests: ["AI", "Startups", "Product strategy", "B2B SaaS"],
      skills: ["Product", "Customer discovery", "Growth"],
      goals: ["feedback", "customers", "mentorship"],
      current_ask:
        "Find AI product mentors and design partners who can review my B2B onboarding flow.",
      offering: "Can share product experiments and onboarding analytics notes.",
      agent_name: "Alpha Bee",
      tone: "Curious",
    },
    {
      key: "beta",
      email: `beta.agent.${runId}@example.com`,
      full_name: "Beta Mentor",
      city: "San Francisco",
      role: "Mentor",
      stage: "Growth",
      bio: "Advises AI founders on onboarding, activation, and B2B product-led growth.",
      interests: ["AI", "Product strategy", "B2B SaaS", "Startups"],
      skills: ["Mentorship", "Product", "Growth"],
      goals: ["feedback", "mentorship", "partnerships"],
      current_ask: "Meet focused founders who need onboarding and activation feedback.",
      offering: "Can review onboarding funnels and recommend activation experiments.",
      agent_name: "Beta Bee",
      tone: "Warm",
    },
    {
      key: "gamma",
      email: `gamma.agent.${runId}@example.com`,
      full_name: "Gamma Builder",
      city: "San Francisco",
      role: "Builder",
      stage: "Seed",
      bio: "Builds developer tools for climate data and collaborative AI workflows.",
      interests: ["AI", "Climate", "Developer tools"],
      skills: ["Engineering", "Python", "Partnerships"],
      goals: ["partnerships", "feedback"],
      current_ask: "Find partners for AI workflow integrations.",
      offering: "Can help with engineering prototypes and climate data systems.",
      agent_name: "Gamma Bee",
      tone: "Professional",
    },
  ];
}

async function seedAccount(spec: AccountSpec): Promise<TestAccount> {
  await resetEmail(spec.email);
  const client = createClient({ baseUrl: insforgeUrl, anonKey: insforgeAnonKey });
  const password = derivePassword(spec.email);

  await must(`${spec.key} signup`, client.auth.signUp({ email: spec.email, password }));
  await must(`${spec.key} signin`, client.auth.signInWithPassword({ email: spec.email, password }));
  const currentUser = await must<{ user: { id: string } }>(
    `${spec.key} current user`,
    client.auth.getCurrentUser(),
  );
  const token = (
    client as unknown as { tokenManager?: { getAccessToken: () => string | null } }
  ).tokenManager?.getAccessToken();
  if (!token) throw new Error(`${spec.key}: missing access token`);

  const agent = {
    agent_name: spec.agent_name,
    tone: spec.tone,
    agent_intro: `Hi, I represent ${spec.full_name}. I compare fit inside GetMyBee and keep private details approval-gated.`,
    current_mission: spec.current_ask,
    status: "active",
    memory: [`Interested in ${spec.interests.slice(0, 3).join(", ")}.`, `Offers: ${spec.offering}`],
  };
  const permissions = {
    can_talk_to_agents: true,
    can_recommend_people: true,
    can_draft_messages: true,
    can_send_without_approval: false,
    can_share_email: false,
    can_share_phone: false,
    can_schedule_meetings: false,
    can_discuss_professional: true,
    can_discuss_finances: false,
  };

  const profile = await must<Record<string, unknown>>(
    `${spec.key} profile`,
    client.database
      .from("profiles")
      .upsert(
        [
          {
            user_id: currentUser.user.id,
            display_name: spec.full_name,
            full_name: spec.full_name,
            community_id: "demo",
            city: spec.city,
            profession: spec.role,
            company: "GetMyBee QA Network",
            role: spec.role,
            stage: spec.stage,
            bio: spec.bio,
            avatar_color: "from-primary to-agent",
            interests: spec.interests,
            skills: spec.skills,
            goals: spec.goals,
            current_ask: spec.current_ask,
            offering: spec.offering,
            availability: "Two short in-platform chats per week",
            likes: "Specific, useful introductions.",
            dislikes: "Cold spam and off-platform pressure.",
            topics_enjoy: spec.interests.join(", "),
            topics_avoid: "Credentials, payment links, private contact details",
            agent,
            permissions,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "user_id" },
      )
      .select()
      .single(),
  );

  const agentResponse = await apiPost<{ agent?: { id?: string } }>("/agents", token, {
    name: spec.agent_name,
    persona_tone: spec.tone,
    agent_intro: agent.agent_intro,
    mission: spec.current_ask,
    goals: spec.goals,
    interests: spec.interests,
    skills: spec.skills,
    intent: spec.current_ask,
    memory: agent.memory,
    agent_mode_enabled: true,
  });
  if (!agentResponse.agent?.id) throw new Error(`${spec.key}: agent upsert returned no id`);

  return {
    ...spec,
    userId: currentUser.user.id,
    token,
    profileId: String(profile.id),
    agentId: agentResponse.agent.id,
  };
}

async function resetEmail(email: string): Promise<void> {
  await fetch(`${apiUrl}/auth/reset-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  }).catch(() => undefined);
}

async function apiPost<T>(pathName: string, token: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiUrl}${pathName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const json = (await response.json().catch(() => ({}))) as T | { detail?: unknown };
  if (!response.ok) {
    throw new Error(`${pathName} failed (${response.status}): ${JSON.stringify(json)}`);
  }
  return json as T;
}

async function runTargetedAgentChat(
  alpha: TestAccount,
  beta: TestAccount,
): Promise<AgentRunResponse> {
  return apiPost<AgentRunResponse>("/agent-network/runs", alpha.token, {
    kind: "chat",
    query: "Find AI product mentors and design partners who can review B2B onboarding.",
    target_agent_id: beta.agentId,
    limit: 1,
  });
}

async function launchAgentWindow(name: string, index: number): Promise<BrowserContext> {
  const width = Number(process.env.QA_WINDOW_WIDTH || 680);
  const height = Number(process.env.QA_WINDOW_HEIGHT || 880);
  return chromium.launchPersistentContext(path.join(profileDir, name), {
    headless,
    viewport: { width, height },
    args: headless
      ? []
      : [`--window-size=${width},${height}`, `--window-position=${index * (width + 30)},40`],
  });
}

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto(`${frontendUrl}/auth`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').fill(email);
  await page.getByRole("button", { name: "Continue with email" }).click();
  await page.waitForURL(/\/app\/(home|discover|messages|agent)/, { timeout: 45_000 });
}

async function openAgentTalks(page: Page, expectedCounterpart: string): Promise<void> {
  await page.goto(`${frontendUrl}/app/messages`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Agent talks" }).click();
  await expect(page.getByText(expectedCounterpart).first()).toBeVisible({ timeout: 45_000 });
}

async function assertAgentTalks(
  page: Page,
  options: {
    expectedCounterpart: string;
    expectedOwnLabel: string;
    screenshotName: string;
    testInfo: TestInfo;
  },
): Promise<void> {
  await expect(page.getByText("Private agent talk").first()).toBeVisible();
  await expect(page.getByText(options.expectedCounterpart).first()).toBeVisible();
  await expect(page.getByText(options.expectedOwnLabel).first()).toBeVisible();
  await expect(page.getByText("In-platform only").first()).toBeVisible();
  const screenshotPath = path.join(artifactDir, options.screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await options.testInfo.attach(options.screenshotName, {
    path: screenshotPath,
    contentType: "image/png",
  });
}
