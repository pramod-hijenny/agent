// Lightweight validators for the structured-output wrapper (no external deps —
// keeps the functions deployable on Deno and unit-testable under `bun test`
// without adding a runtime dependency). Each is a `Validator<T>` from structured.ts.
import type { Validator } from "./structured.ts";

export interface IntroDraft {
  body: string;
}
export const validateIntroDraft: Validator<IntroDraft> = (p) => {
  if (typeof p !== "object" || p === null) return { ok: false, error: "expected a JSON object" };
  const body = (p as Record<string, unknown>).body;
  if (typeof body !== "string" || !body.trim()) {
    return { ok: false, error: "`body` must be a non-empty string" };
  }
  if (body.length > 1000) return { ok: false, error: "`body` exceeds 1000 chars" };
  return { ok: true, value: { body: body.trim() } };
};

export type ScreenDecision = "pass" | "decline";
export interface ScreeningDecision {
  decision: ScreenDecision;
  reason: string;
}
export const validateScreeningDecision: Validator<ScreeningDecision> = (p) => {
  if (typeof p !== "object" || p === null) return { ok: false, error: "expected a JSON object" };
  const decision = (p as Record<string, unknown>).decision;
  const reason = (p as Record<string, unknown>).reason;
  if (decision !== "pass" && decision !== "decline") {
    return { ok: false, error: "`decision` must be 'pass' or 'decline'" };
  }
  if (typeof reason !== "string") return { ok: false, error: "`reason` must be a string" };
  return { ok: true, value: { decision, reason: reason.trim() } };
};

export interface InterviewScores {
  overall: number;
  dimensions: Record<string, number>;
  recommendation: "strong" | "maybe" | "pass";
  rationale: string;
}
export const validateInterviewScores: Validator<InterviewScores> = (p) => {
  if (typeof p !== "object" || p === null) return { ok: false, error: "expected a JSON object" };
  const o = p as Record<string, unknown>;
  const overall = typeof o.overall === "number" ? o.overall : NaN;
  if (Number.isNaN(overall) || overall < 0 || overall > 100) {
    return { ok: false, error: "`overall` must be a number 0–100" };
  }
  if (
    o.recommendation !== "strong" &&
    o.recommendation !== "maybe" &&
    o.recommendation !== "pass"
  ) {
    return { ok: false, error: "`recommendation` must be 'strong' | 'maybe' | 'pass'" };
  }
  const dimensions =
    typeof o.dimensions === "object" && o.dimensions !== null
      ? (o.dimensions as Record<string, number>)
      : {};
  return {
    ok: true,
    value: {
      overall,
      dimensions,
      recommendation: o.recommendation as InterviewScores["recommendation"],
      rationale: typeof o.rationale === "string" ? o.rationale : "",
    },
  };
};
