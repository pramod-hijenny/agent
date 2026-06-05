import { insforge } from "@/lib/insforge";
import { DEFAULT_PERMISSIONS } from "@/lib/types";
import type { Profile, IntroRequest } from "@/lib/types";

// ─── Auth actions ────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  const { data, error } = await insforge.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await insforge.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function verifyEmailCode(email: string, otp: string) {
  const { data, error } = await insforge.auth.verifyEmail({ email, otp });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  await insforge.auth.signOut();
}

// Passwordless convenience sign-in: the user enters only an email; we derive a
// deterministic password under the hood so InsForge auth (JWT + RLS) still works.
// NOTE: this is a no-password shortcut for now, not real security.
function derivePassword(email: string): string {
  const seed = btoa(unescape(encodeURIComponent(email.trim().toLowerCase())));
  return `Gmb!${seed}9a`;
}

export async function signInWithEmailOnly(email: string) {
  const password = derivePassword(email);
  const existing = await insforge.auth.signInWithPassword({ email, password });
  if (!existing.error) return existing.data;

  // No account with the derived password → create it (verification is disabled).
  let created = await insforge.auth.signUp({ email, password });
  if (created.error) {
    // Email already exists with a different password. Ask the backend (admin) to
    // delete that account, then recreate it passwordless. (Wipes the old account.)
    const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "";
    if (apiUrl) {
      await fetch(`${apiUrl}/auth/reset-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).catch(() => {});
    }
    created = await insforge.auth.signUp({ email, password });
    if (created.error) throw new Error(created.error.message);
  }
  const after = await insforge.auth.signInWithPassword({ email, password });
  if (after.error) throw new Error(after.error.message);
  return after.data;
}

export async function getCurrentUser() {
  const { data, error } = await insforge.auth.getCurrentUser();
  if (error || !data?.user) return null;
  return data.user as { id: string; email: string };
}

export async function getInsforgeAccessToken() {
  await insforge.auth.getCurrentUser();
  const client = insforge as unknown as {
    tokenManager?: { getAccessToken: () => string | null };
  };
  return client.tokenManager?.getAccessToken() ?? null;
}

// ─── Profile DB helpers ──────────────────────────────────────────

export async function fetchMyProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data, error } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (error || !data) return null;
  return dbRowToProfile(data as Record<string, unknown>);
}

export async function fetchProfileById(profileId: string): Promise<Profile | null> {
  const { data, error } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();
  if (error || !data) return null;
  return dbRowToProfile(data as Record<string, unknown>);
}

export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await insforge.database
    .from("profiles")
    .select("*")
    .not("user_id", "is", null)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(dbRowToProfile);
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  const row = profileToDbRow(profile, user.id);
  const { data, error } = await insforge.database
    .from("profiles")
    .upsert([row], { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return dbRowToProfile(data as Record<string, unknown>);
}

// ─── Intro DB helpers ────────────────────────────────────────────

export async function fetchMyIntros(): Promise<IntroRequest[]> {
  const { data, error } = await insforge.database
    .from("intro_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(dbRowToIntro);
}

export async function createIntroRequest(intro: {
  to_profile_id: string;
  message: string;
  transcript?: IntroRequest["transcript"];
  summary?: IntroRequest["summary"];
}): Promise<IntroRequest> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  const { data, error } = await insforge.database
    .from("intro_requests")
    .insert([
      {
        from_user_id: user.id,
        to_profile_id: intro.to_profile_id,
        message: intro.message,
        transcript: intro.transcript ?? null,
        summary: intro.summary ?? null,
      },
    ])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return dbRowToIntro(data as Record<string, unknown>);
}

export async function patchIntroStatus(id: string, status: IntroRequest["status"]): Promise<void> {
  const { error } = await insforge.database.from("intro_requests").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Mapping helpers ─────────────────────────────────────────────

function dbRowToProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    user_id: (row.user_id as string | undefined) ?? undefined,
    community_id: (row.community_id as string) || "demo",
    full_name: (row.full_name as string) || (row.name as string) || "",
    city: (row.city as string) || "",
    profession: (row.profession as string) || "",
    company: (row.company as string) || "",
    role: ((row.role as string) || "Founder") as Profile["role"],
    stage: (row.stage as string) || "",
    bio: (row.bio as string) || "",
    avatar_color: (row.avatar_color as string) || "from-sky-400 to-indigo-400",
    interests: (row.interests as string[]) || [],
    skills: (row.skills as string[]) || [],
    goals: ((row.goals as string[]) || []) as Profile["goals"],
    current_ask: (row.current_ask as string) || "",
    offering: (row.offering as string) || "",
    availability: (row.availability as string) || "",
    likes: (row.likes as string) || "",
    dislikes: (row.dislikes as string) || "",
    topics_enjoy: (row.topics_enjoy as string) || "",
    topics_avoid: (row.topics_avoid as string) || "",
    agent: (row.agent as Profile["agent"]) || {
      agent_name: "",
      tone: "Friendly" as const,
      agent_intro: "",
      current_mission: "",
      status: "active" as const,
      memory: [],
    },
    permissions: (row.permissions as Profile["permissions"]) || { ...DEFAULT_PERMISSIONS },
  };
}

function profileToDbRow(profile: Profile, userId: string) {
  return {
    user_id: userId,
    display_name: profile.full_name || "Member", // profiles.display_name is NOT NULL
    full_name: profile.full_name,
    community_id: profile.community_id || "demo",
    city: profile.city,
    profession: profile.profession,
    company: profile.company,
    role: profile.role,
    stage: profile.stage,
    bio: profile.bio,
    avatar_color: profile.avatar_color,
    interests: profile.interests,
    skills: profile.skills,
    goals: profile.goals,
    current_ask: profile.current_ask,
    offering: profile.offering,
    availability: profile.availability,
    likes: profile.likes || "",
    dislikes: profile.dislikes || "",
    topics_enjoy: profile.topics_enjoy || "",
    topics_avoid: profile.topics_avoid || "",
    agent: profile.agent,
    permissions: profile.permissions,
    updated_at: new Date().toISOString(),
  };
}

function dbRowToIntro(row: Record<string, unknown>): IntroRequest {
  return {
    id: row.id as string,
    from_user_id: row.from_user_id as string,
    to_user_id: row.to_profile_id as string,
    message: (row.message as string) || "",
    status: ((row.status as string) || "pending") as IntroRequest["status"],
    created_at: new Date(row.created_at as string).getTime(),
    transcript: (row.transcript as IntroRequest["transcript"]) ?? undefined,
    summary: (row.summary as IntroRequest["summary"]) ?? undefined,
  };
}
