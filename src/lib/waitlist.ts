import { insforge } from "@/lib/insforge";

export type WaitlistPayload = {
  email: string;
  name?: string;
  role?: string;
  company?: string;
  primaryGoal?: string;
  referralSource?: string;
  notes?: string;
};

export type WaitlistResult = {
  status: "joined" | "already_joined";
};

type InsforgeError = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function joinWaitlist(payload: WaitlistPayload): Promise<WaitlistResult> {
  const baseUrl = import.meta.env.VITE_INSFORGE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY as string | undefined;

  if (!baseUrl || !anonKey) {
    throw new Error("Waitlist backend is not configured yet.");
  }

  const email = payload.email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Add a valid email so we can send your invite.");
  }

  const { error } = await insforge.database.from("launch_waitlist").insert([
    {
      email,
      name: clean(payload.name),
      role: clean(payload.role),
      company: clean(payload.company),
      primary_goal: clean(payload.primaryGoal),
      referral_source: clean(payload.referralSource) || "landing",
      notes: clean(payload.notes),
      source: "landing",
      metadata: {
        path: typeof window === "undefined" ? "/" : window.location.pathname,
      },
    },
  ]);

  if (error) {
    if (isDuplicateError(error)) {
      return { status: "already_joined" };
    }
    throw new Error(toWaitlistMessage(error));
  }

  return { status: "joined" };
}

function clean(value?: string) {
  return value?.trim().slice(0, 500) ?? "";
}

function isDuplicateError(error: InsforgeError) {
  const text = [error.message, error.code, error.details, error.hint].filter(Boolean).join(" ");
  return /duplicate|unique|23505|already exists/i.test(text);
}

function toWaitlistMessage(error: InsforgeError) {
  const text = [error.message, error.code, error.details, error.hint].filter(Boolean).join(" ");

  if (/launch_waitlist|schema cache|relation|does not exist/i.test(text)) {
    return "The waitlist is not connected yet. Please try again soon.";
  }

  if (/row-level|policy|permission|unauthorized|forbidden/i.test(text)) {
    return "The waitlist access policy is not ready yet.";
  }

  return error.message || "Could not join the waitlist yet.";
}
