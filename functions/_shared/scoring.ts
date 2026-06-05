// Deterministic match scoring (spec §6) + the semantic blend used by Discovery.
// Pure functions — no Deno/SDK imports, so they're unit-testable under `bun test`
// and bundled into the `discovery` edge function by the esbuild build step.

export interface ScorableAgent {
  interests?: string[];
  goals?: string[];
  city?: string;
}

export interface DeterministicResult {
  score: number;
  reasons: string[];
}

// Spec §6: base 40 + 8 per shared interest + 6 per shared goal + 15 same city,
// capped at 99.
export function deterministicScore(
  me: ScorableAgent,
  candidate: ScorableAgent,
): DeterministicResult {
  const meInterests = new Set((me.interests ?? []).map((s) => s.toLowerCase()));
  const meGoals = new Set((me.goals ?? []).map((s) => s.toLowerCase()));
  const sharedInterests = (candidate.interests ?? []).filter((s) =>
    meInterests.has(s.toLowerCase()),
  );
  const sharedGoals = (candidate.goals ?? []).filter((s) => meGoals.has(s.toLowerCase()));

  let score = 40 + sharedInterests.length * 8 + sharedGoals.length * 6;
  const reasons: string[] = [];
  if (sharedInterests.length)
    reasons.push(`Shared interests: ${sharedInterests.slice(0, 3).join(", ")}`);
  if (sharedGoals.length) reasons.push(`Shared goals: ${sharedGoals.slice(0, 3).join(", ")}`);

  const sameCity =
    !!me.city && !!candidate.city && me.city.toLowerCase() === candidate.city.toLowerCase();
  if (sameCity) {
    score += 15;
    reasons.push(`Same city: ${candidate.city}`);
  }
  if (!reasons.length) reasons.push("Open to compatible introductions");

  return { score: Math.min(score, 99), reasons };
}

// Blend weights for deterministic vs. semantic similarity. Tunable.
export const BLEND_W_DETERMINISTIC = 0.6;
export const BLEND_W_SEMANTIC = 0.4;

// Combine the deterministic score (0–99) with cosine similarity (0–1). When no
// free-text need was given (similarity === null), rank on the deterministic
// score alone. Result is clamped to 0–100 and rounded.
export function blendScore(deterministic: number, similarity: number | null): number {
  const clamp = (n: number) => Math.round(Math.min(100, Math.max(0, n)));
  if (similarity === null) return clamp(deterministic);
  return clamp(BLEND_W_DETERMINISTIC * deterministic + BLEND_W_SEMANTIC * similarity * 100);
}
