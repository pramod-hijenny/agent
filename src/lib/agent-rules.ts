// Agent Message Mode — rule engine + transparency log.
//
// An agent (yours or someone else's) screens inbound messages against a set of
// per-category rules. A flagged message is auto-declined with a polite response
// in the agent's persona tone; whitelisted senders bypass screening entirely.
// Every decision the *recipient* would surface is recorded in a transparency
// log so the owner can see what was held.
//
// Client-side prototype: "my" rules + log persist in localStorage keyed to the
// signed-in user. Other people's (mock) agents use DEFAULT_RECIPIENT_RULES.

import type { AgentTone } from "@/lib/types";

export interface AgentRules {
  marketing: boolean;
  explicit: boolean;
  unknownSenders: boolean;
  contactSharing: boolean;
  moneySales: boolean;
  offTopics: boolean;
  /** Names (case-insensitive) that bypass screening entirely. */
  whitelist: string[];
}

export type RuleKey = Exclude<keyof AgentRules, "whitelist">;

export const RULE_META: { key: RuleKey; label: string; description: string }[] = [
  {
    key: "marketing",
    label: "Block marketing & spam",
    description: "Promos, cold sales pitches, “sign up” / “buy now” blasts.",
  },
  { key: "explicit", label: "Block explicit content", description: "Profanity and NSFW language." },
  {
    key: "moneySales",
    label: "Block money & investment asks",
    description: "Investment pitches, payment requests, salary probing.",
  },
  {
    key: "contactSharing",
    label: "Block contact-info requests",
    description: "Phone numbers, emails, “DM me your number”.",
  },
  {
    key: "unknownSenders",
    label: "Block unknown senders",
    description: "Hold anyone you’ve never talked to (unless whitelisted).",
  },
  {
    key: "offTopics",
    label: "Block my off-limit topics",
    description: "Uses the “topics to avoid” on your profile.",
  },
];

// Defaults for the signed-in user's own inbox.
export const DEFAULT_AGENT_RULES: AgentRules = {
  marketing: true,
  explicit: true,
  unknownSenders: false,
  contactSharing: true,
  moneySales: true,
  offTopics: true,
  whitelist: [],
};

// Defaults applied to other people's (mock) agents when they screen what you
// send them. Unknown-sender blocking is off so first contact isn't dead-ended.
export const DEFAULT_RECIPIENT_RULES: AgentRules = {
  marketing: true,
  explicit: true,
  unknownSenders: false,
  contactSharing: true,
  moneySales: true,
  offTopics: true,
  whitelist: [],
};

const MARKETING = [
  "buy now",
  "limited offer",
  "limited-time",
  "discount",
  "promo code",
  "sign up",
  "subscribe",
  "act now",
  "click here",
  "special deal",
  "% off",
  "free trial",
];
const EXPLICIT = ["nsfw", "explicit", "xxx", "fuck", "shit", "asshole"];
const MONEY = [
  "invest",
  "investment",
  "venmo",
  "paypal",
  "wire me",
  "send money",
  "crypto",
  "guaranteed return",
  "salary",
  "how much do you make",
  "funding round",
];
const CONTACT = [
  "phone number",
  "call me at",
  "text me at",
  "whatsapp",
  "my number is",
  "dm me your number",
];
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

export interface EvalContext {
  /** Recipient's "topics to avoid" string (for the offTopics rule). */
  topicsAvoid?: string;
  /** True if the sender has prior delivered history (for unknownSenders). */
  senderKnown?: boolean;
  /** Sender display name, checked against the whitelist. */
  senderName?: string;
}

export interface RuleVerdict {
  decision: "pass" | "decline";
  rule?: RuleKey;
  label?: string;
  /** The offending snippet that tripped the rule, when applicable. */
  matched?: string;
}

function firstHit(text: string, terms: string[]): string | null {
  const lower = text.toLowerCase();
  for (const t of terms) if (lower.includes(t)) return t;
  return null;
}

function matchRule(rule: RuleKey, text: string, ctx: EvalContext): string | null {
  switch (rule) {
    case "marketing":
      return firstHit(text, MARKETING);
    case "explicit":
      return firstHit(text, EXPLICIT);
    case "moneySales":
      return firstHit(text, MONEY);
    case "contactSharing": {
      if (PHONE_RE.test(text)) return "a phone number";
      if (EMAIL_RE.test(text)) return "an email address";
      return firstHit(text, CONTACT);
    }
    case "unknownSenders":
      return ctx.senderKnown ? null : "an unknown sender";
    case "offTopics": {
      const topics = (ctx.topicsAvoid || "")
        .split(/[,;]/)
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 3);
      return firstHit(text, topics);
    }
    default:
      return null;
  }
}

/** Evaluate a message against an agent's rules. Whitelisted senders bypass. */
export function evaluateMessage(
  text: string,
  rules: AgentRules,
  ctx: EvalContext = {},
): RuleVerdict {
  const sender = (ctx.senderName || "").trim().toLowerCase();
  if (sender && rules.whitelist.some((w) => w.trim().toLowerCase() === sender)) {
    return { decision: "pass" };
  }
  for (const { key, label } of RULE_META) {
    if (!rules[key]) continue;
    const matched = matchRule(key, text, ctx);
    if (matched) return { decision: "decline", rule: key, label, matched };
  }
  return { decision: "pass" };
}

/** A polite auto-decline written in the agent owner's persona tone. */
export function politeDecline(
  tone: AgentTone,
  opts: { ownerFirst: string; senderFirst?: string; ruleLabel: string },
): string {
  const { ownerFirst, ruleLabel } = opts;
  const rule = ruleLabel.replace(/^Block (my )?/i, "").toLowerCase();
  const hi = opts.senderFirst ? `Hi ${opts.senderFirst}, ` : "Hi, ";
  switch (tone) {
    case "Direct":
      return `${hi}I'm ${ownerFirst}'s bee. Held — this reads as ${rule}. Send a relevant intro and I'll pass it on.`;
    case "Professional":
      return `${hi}this is ${ownerFirst}'s assistant. I've held your message as it appears to be ${rule}. Please share a brief, relevant introduction and I'll forward it.`;
    case "Curious":
      return `${hi}${ownerFirst}'s bee here — what prompted this? It reads as ${rule}, which ${ownerFirst} skips. What's the shared context?`;
    case "Warm":
      return `${hi}${ownerFirst}'s bee here 🐝 I'm holding this for now — it looks like ${rule}, and ${ownerFirst} likes to start with a warm hello. Tell me what you two share and I'll happily pass it along.`;
    case "Friendly":
    default:
      return `${hi}${ownerFirst}'s bee here! I held this since it looks like ${rule} — ${ownerFirst} keeps those behind a quick intro. Share what you have in common and I'll pass it through. 🐝`;
  }
}

// ── Persistence: my rules ────────────────────────────────────────────────────

const RULES_KEY = "getmybee:agent-rules:";

export function getMyRules(meId: string): AgentRules {
  if (typeof window === "undefined") return { ...DEFAULT_AGENT_RULES };
  try {
    const raw = window.localStorage.getItem(RULES_KEY + meId);
    if (raw) return { ...DEFAULT_AGENT_RULES, ...(JSON.parse(raw) as Partial<AgentRules>) };
  } catch {
    /* fall through */
  }
  return { ...DEFAULT_AGENT_RULES };
}

export function saveMyRules(meId: string, rules: AgentRules) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RULES_KEY + meId, JSON.stringify(rules));
  } catch {
    /* ignore quota */
  }
}

// ── Persistence: transparency log ────────────────────────────────────────────

export interface ScreenLogEntry {
  id: string;
  /** "outbound" = a recipient's bee held something you sent; "inbound" = your bee held something sent to you. */
  direction: "outbound" | "inbound";
  other_name: string;
  text: string;
  rule_label: string;
  created_at: number;
}

const LOG_KEY = "getmybee:screen-log:";

export function getScreenLog(meId: string): ScreenLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOG_KEY + meId);
    if (raw) return JSON.parse(raw) as ScreenLogEntry[];
  } catch {
    /* fall through */
  }
  return [];
}

export function appendScreenLog(meId: string, entry: Omit<ScreenLogEntry, "id" | "created_at">) {
  if (typeof window === "undefined") return;
  const log = getScreenLog(meId);
  log.unshift({
    ...entry,
    id: `log_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`,
    created_at: Date.now(),
  });
  try {
    window.localStorage.setItem(LOG_KEY + meId, JSON.stringify(log.slice(0, 50)));
  } catch {
    /* ignore quota */
  }
}

export function clearScreenLog(meId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LOG_KEY + meId);
  } catch {
    /* ignore */
  }
}
