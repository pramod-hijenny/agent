// Agent-mediated direct messages (user → user) backed by localStorage.
//
// Agent Message Mode routes a message through 0, 1, or 2 agents depending on
// who has it switched on (see the matrix below). The recipient's agent screens
// against its rules (see agent-rules.ts) and either passes the message through
// or auto-declines it politely in the recipient's persona tone.
//
//   Both on        A → Agent A → Agent B → B   (B filters; A's bee adds context)
//   Only sender    A → Agent A → B             (delivered with context; no filter)
//   Only recipient A → Agent B → B             (B filters scams/spam/rule hits)
//   Neither        A → B                        (plain direct message)
//
// Client-side prototype (not wired to InsForge). Storage is keyed
// `getmybee:direct-messages:<meId>` and seeded from mock-data on first use.

import type { Profile } from "@/lib/types";
import { SEED_PROFILES } from "@/lib/mock-data";
import {
  DEFAULT_RECIPIENT_RULES,
  appendScreenLog,
  evaluateMessage,
  politeDecline,
  type AgentRules,
} from "@/lib/agent-rules";

export type MessageStatus = "delivered" | "declined";
export type FlowKind = "direct" | "sender" | "recipient" | "both";

export interface DirectMessage {
  id: string;
  /** "me" for outbound, otherwise the other person's profile id. */
  from: string;
  to: string;
  text: string;
  status: MessageStatus;
  /** Which agent-mode path the message took. */
  flow: FlowKind;
  /** Set when the sender's bee added context before delivery. */
  context_note?: string;
  /** Polite auto-decline written in the recipient's tone (when declined). */
  decline_reason?: string;
  /** Human label of the rule that tripped (when declined). */
  matched_rule?: string;
  /** A safe rewrite the sender can send instead (when declined). */
  rewrite?: string;
  created_at: number;
}

export interface ConversationSummary {
  other: Profile;
  last?: DirectMessage;
  unreadFromThem: number;
}

type ThreadStore = Record<string, DirectMessage[]>; // keyed by other person's id

const KEY_PREFIX = "getmybee:direct-messages:";

const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const REWRITE_STRIP = [
  "buy now",
  "limited offer",
  "discount",
  "promo code",
  "sign up",
  "subscribe",
  "invest",
  "investment",
  "venmo",
  "paypal",
  "crypto",
  "guaranteed return",
  "salary",
  "phone number",
  "whatsapp",
  "call me at",
  "text me at",
];

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function uid(): string {
  return `dm_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

// ── Storage ──────────────────────────────────────────────────────────────────

function read(meId: string): ThreadStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + meId);
    if (raw) return JSON.parse(raw) as ThreadStore;
  } catch {
    /* fall through to seed */
  }
  const seeded = seed();
  write(meId, seeded);
  return seeded;
}

function write(meId: string, store: ThreadStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY_PREFIX + meId, JSON.stringify(store));
  } catch {
    /* ignore quota errors */
  }
}

// One pre-populated thread so Messages isn't empty on first open.
function seed(): ThreadStore {
  const first = SEED_PROFILES[0];
  if (!first) return {};
  const now = Date.now();
  return {
    [first.id]: [
      {
        id: uid(),
        from: first.id,
        to: "me",
        text: `Hey! Saw you in the community. Happy to compare notes on ${(first.interests[0] || "what you're building").toLowerCase()} whenever.`,
        status: "delivered",
        flow: "direct",
        created_at: now - 1000 * 60 * 60 * 5,
      },
    ],
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function suggestRewrite(text: string, recipient: Profile): string {
  let cleaned = text
    .replace(PHONE_RE, "[shared after we connect]")
    .replace(EMAIL_RE, "[shared after we connect]");
  for (const term of REWRITE_STRIP) {
    cleaned = cleaned.replace(new RegExp(escapeRe(term), "gi"), "");
  }
  cleaned = cleaned
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .trim();
  if (cleaned.replace(/[^a-z0-9]/gi, "").length < 12) {
    const first = recipient.full_name.split(" ")[0];
    const interest = (recipient.interests[0] || "what you're working on").toLowerCase();
    cleaned = `Hi ${first}, I'd love to connect about ${interest}. Would you be open to a quick intro chat?`;
  }
  return cleaned;
}

function flowFor(senderOn: boolean, recipientOn: boolean): FlowKind {
  if (senderOn && recipientOn) return "both";
  if (senderOn) return "sender";
  if (recipientOn) return "recipient";
  return "direct";
}

// ── Read API ─────────────────────────────────────────────────────────────────

export function getThread(meId: string, otherId: string): DirectMessage[] {
  return read(meId)[otherId] ?? [];
}

/** All seed people, surfaced as conversations (with last message + unread). */
export function getConversations(meId: string): ConversationSummary[] {
  const store = read(meId);
  return SEED_PROFILES.filter((p) => p.id !== meId && p.id !== "me")
    .map((other) => {
      const msgs = store[other.id] ?? [];
      const last = msgs[msgs.length - 1];
      const unreadFromThem = msgs.filter((m) => m.from !== "me" && m.status === "delivered").length;
      return { other, last, unreadFromThem };
    })
    .sort((a, b) => (b.last?.created_at ?? 0) - (a.last?.created_at ?? 0));
}

// ── Write API ────────────────────────────────────────────────────────────────

/**
 * Send a message from "me" to `recipient`, applying Agent Message Mode.
 * `senderAgentOn` is the sender's (your) agent toggle; the recipient's toggle is
 * read from their profile. Returns the stored message — `status: "declined"`
 * (with a polite reason + rewrite) if the recipient's bee held it, else
 * `status: "delivered"`.
 */
export function sendDirectMessage(
  meId: string,
  recipient: Profile,
  text: string,
  senderAgentOn: boolean,
): DirectMessage {
  const trimmed = text.trim();
  const recipientOn = recipient.agent.status === "active";
  const flow = flowFor(senderAgentOn, recipientOn);
  const recipientFirst = recipient.full_name.split(" ")[0];

  const base: DirectMessage = {
    id: uid(),
    from: "me",
    to: recipient.id,
    text: trimmed,
    status: "delivered",
    flow,
    created_at: Date.now(),
  };

  if (senderAgentOn) {
    base.context_note = `Your bee vouched for you and noted shared interest in ${(
      recipient.interests[0] || "the community"
    ).toLowerCase()}.`;
  }

  if (recipientOn) {
    const store = read(meId);
    const senderKnown = (store[recipient.id] ?? []).some((m) => m.status === "delivered");
    const verdict = evaluateMessage(trimmed, DEFAULT_RECIPIENT_RULES, {
      topicsAvoid: recipient.topics_avoid,
      senderKnown,
      senderName: "you",
    });
    if (verdict.decision === "decline") {
      base.status = "declined";
      base.matched_rule = verdict.label;
      base.decline_reason = politeDecline(recipient.agent.tone, {
        ownerFirst: recipientFirst,
        ruleLabel: verdict.label || "off-policy",
      });
      base.rewrite = suggestRewrite(trimmed, recipient);
      base.context_note = undefined; // a held message never carries through
      appendScreenLog(meId, {
        direction: "outbound",
        other_name: recipient.full_name,
        text: trimmed,
        rule_label: verdict.label || "Off-policy",
      });
    }
  }

  const store = read(meId);
  store[recipient.id] = [...(store[recipient.id] ?? []), base];
  write(meId, store);
  return base;
}

/**
 * A canned reply from the recipient after a delivered message. Screened against
 * the user's OWN rules (their inbox): if their bee is on and the reply trips a
 * rule it's held (logged, not delivered). Returns the delivered message or null.
 */
export function appendCannedReply(
  meId: string,
  recipient: Profile,
  inbox: { rules?: AgentRules; agentOn?: boolean } = {},
): DirectMessage | null {
  const first = recipient.full_name.split(" ")[0];
  const interest = (recipient.interests[0] || "this").toLowerCase();
  const text = `Thanks for reaching out! ${first} here — happy to chat about ${interest}. What works for a quick call?`;

  if (inbox.agentOn && inbox.rules) {
    const verdict = evaluateMessage(text, inbox.rules, {
      senderName: recipient.full_name,
      senderKnown: true,
    });
    if (verdict.decision === "decline") {
      appendScreenLog(meId, {
        direction: "inbound",
        other_name: recipient.full_name,
        text,
        rule_label: verdict.label || "Off-policy",
      });
      return null;
    }
  }

  const reply: DirectMessage = {
    id: uid(),
    from: recipient.id,
    to: "me",
    text,
    status: "delivered",
    flow: "direct",
    created_at: Date.now(),
  };
  const store = read(meId);
  store[recipient.id] = [...(store[recipient.id] ?? []), reply];
  write(meId, store);
  return reply;
}
