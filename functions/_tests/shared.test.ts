// Unit tests for the pure edge-function logic. Run with `bun test`.
// The LLM is mocked (injected chat fn) so these need no network, no Deno, no key.
import { test, expect } from "bun:test";
import { callStructured, extractJson } from "../_shared/structured.ts";
import { validateIntroDraft, validateScreeningDecision } from "../_shared/schemas.ts";
import { deterministicScore, blendScore } from "../_shared/scoring.ts";

test("deterministicScore: spec §6 formula", () => {
  const r = deterministicScore(
    { interests: ["AI", "B2B"], goals: ["fundraising"], city: "SF" },
    { interests: ["AI", "B2B"], goals: ["fundraising"], city: "SF" },
  );
  expect(r.score).toBe(77); // 40 + 2*8 + 1*6 + 15
  expect(r.reasons.length).toBeGreaterThan(0);
});

test("deterministicScore: no overlap → base 40, with default reason", () => {
  const r = deterministicScore({ interests: ["AI"] }, { interests: ["cooking"] });
  expect(r.score).toBe(40);
  expect(r.reasons).toContain("Open to compatible introductions");
});

test("deterministicScore: caps at 99", () => {
  const many = Array.from({ length: 20 }, (_, i) => `i${i}`);
  const r = deterministicScore({ interests: many, city: "x" }, { interests: many, city: "x" });
  expect(r.score).toBe(99);
});

test("blendScore: deterministic-only when similarity is null", () => {
  expect(blendScore(77, null)).toBe(77);
});

test("blendScore: blends deterministic + similarity", () => {
  expect(blendScore(80, 0.5)).toBe(68); // 0.6*80 + 0.4*0.5*100
});

test("extractJson: strips code fences", () => {
  expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
});

test("extractJson: pulls JSON out of surrounding prose", () => {
  expect(extractJson('Sure! {"decision":"pass","reason":"ok"} hope that helps')).toEqual({
    decision: "pass",
    reason: "ok",
  });
});

test("callStructured: retries past bad JSON then succeeds", async () => {
  let n = 0;
  const chat = async () => {
    n++;
    return n === 1
      ? { content: "not json at all", error: "" }
      : { content: '{"decision":"pass","reason":"looks fine"}', error: "" };
  };
  const res = await callStructured({
    chat,
    system: "s",
    user: "u",
    validate: validateScreeningDecision,
    fallback: () => ({ decision: "decline" as const, reason: "fallback" }),
  });
  expect(res.source).toBe("llm");
  expect(res.value.decision).toBe("pass");
  expect(res.attempts).toBe(2);
});

test("callStructured: falls back when always invalid (never throws)", async () => {
  const chat = async () => ({ content: "garbage", error: "" });
  const res = await callStructured({
    chat,
    system: "s",
    user: "u",
    validate: validateIntroDraft,
    retries: 1,
    fallback: () => ({ body: "FALLBACK" }),
  });
  expect(res.source).toBe("fallback");
  expect(res.value.body).toBe("FALLBACK");
  expect(res.error).toBeDefined();
});

test("callStructured: schema rejects wrong enum, then accepts corrected", async () => {
  let n = 0;
  const chat = async () => {
    n++;
    return n === 1
      ? { content: '{"decision":"maybe","reason":"x"}', error: "" }
      : { content: '{"decision":"decline","reason":"off-policy ask"}', error: "" };
  };
  const res = await callStructured({
    chat,
    system: "s",
    user: "u",
    validate: validateScreeningDecision,
    fallback: () => ({ decision: "decline" as const, reason: "fb" }),
  });
  expect(res.source).toBe("llm");
  expect(res.value.decision).toBe("decline");
  expect(n).toBe(2);
});
