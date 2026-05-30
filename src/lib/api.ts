import type { AgentPersona, Community, IntroRequest, Permissions, Profile } from "@/lib/types";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

export function hasApi() {
  return Boolean(API_URL);
}

interface TokenResponse {
  access_token: string;
}

type ApiIntro = Omit<IntroRequest, "created_at"> & { created_at: string };

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  if (!API_URL) throw new Error("API URL is not configured");
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function devLogin(email: string) {
  const token = await request<TokenResponse>("/auth/dev-login", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return token.access_token;
}

export function getMe(token: string) {
  return request<Profile>("/me", { token });
}

export function listCommunities(token: string) {
  return request<Community[]>("/communities", { token });
}

export function submitOnboarding(token: string, profile: Profile): Promise<Profile> {
  const { agent, permissions, ...profilePayload } = profile;
  return request<Profile>("/me/onboarding", {
    token,
    method: "POST",
    body: JSON.stringify({
      profile: profilePayload,
      agent,
      permissions,
    }),
  });
}

export function updateAgent(token: string, agent: Partial<AgentPersona>) {
  return request<Profile>("/me/agent", {
    token,
    method: "PATCH",
    body: JSON.stringify(agent),
  });
}

export function updatePermissions(token: string, permissions: Partial<Permissions>) {
  return request<Profile>("/me/permissions", {
    token,
    method: "PATCH",
    body: JSON.stringify(permissions),
  });
}

export function discover(
  token: string,
  payload: { query: string; city?: string; goal?: string; limit?: number },
) {
  return request<
    Array<{
      profile: Profile;
      score: number;
      reasons: string[];
      suggested_activity: string;
    }>
  >("/discover", {
    token,
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listIntros(token: string) {
  return request<ApiIntro[]>("/intros", { token }).then((items) => items.map(fromApiIntro));
}

export function createIntro(
  token: string,
  payload: Pick<IntroRequest, "to_user_id" | "message" | "transcript" | "summary">,
) {
  return request<ApiIntro>("/intros", {
    token,
    method: "POST",
    body: JSON.stringify(payload),
  }).then(fromApiIntro);
}

export function patchIntro(token: string, id: string, status: IntroRequest["status"]) {
  return request<ApiIntro>(`/intros/${id}`, {
    token,
    method: "PATCH",
    body: JSON.stringify({ status }),
  }).then(fromApiIntro);
}

function fromApiIntro(intro: ApiIntro): IntroRequest {
  return {
    ...intro,
    created_at: new Date(intro.created_at).getTime(),
  };
}
