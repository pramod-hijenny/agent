// Structured-output wrapper — the TS analog of Instructor/Pydantic (zero deps).
// Calls a chat function, extracts JSON from the reply, validates it, and retries
// with a corrective turn on failure. Never throws: exhausting retries returns a
// deterministic fallback. The chat fn is injected so this is unit-testable
// without a network or the Deno runtime.

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatFn {
  (messages: ChatMessage[]): Promise<{ content: string; error: string }>;
}

export type Validation<T> = { ok: true; value: T } | { ok: false; error: string };
export interface Validator<T> {
  (parsed: unknown): Validation<T>;
}

export interface StructuredResult<T> {
  value: T;
  source: "llm" | "fallback";
  attempts: number;
  error?: string;
}

// Tolerant JSON extraction: strips ```json fences, then parses; if that fails,
// finds the first {...}/[...] span and shrinks the tail until it parses.
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    /* fall through to span search */
  }
  const start = cleaned.search(/[{[]/);
  if (start >= 0) {
    for (let end = cleaned.length; end > start; end--) {
      try {
        return JSON.parse(cleaned.slice(start, end));
      } catch {
        /* keep shrinking */
      }
    }
  }
  throw new Error("no parseable JSON in model output");
}

export async function callStructured<T>(opts: {
  chat: ChatFn;
  system: string;
  user: string;
  validate: Validator<T>;
  fallback: () => T;
  retries?: number;
}): Promise<StructuredResult<T>> {
  const retries = opts.retries ?? 2;
  const messages: ChatMessage[] = [
    { role: "system", content: opts.system },
    { role: "user", content: opts.user },
  ];
  let lastError = "no attempts made";

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    const { content, error } = await opts.chat(messages);
    if (error) {
      lastError = error;
      continue; // transient chat error — retry without a corrective turn
    }
    let parsed: unknown;
    let parsedOk = false;
    try {
      parsed = extractJson(content);
      parsedOk = true;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
    if (parsedOk) {
      const res = opts.validate(parsed);
      if (res.ok) return { value: res.value, source: "llm", attempts: attempt };
      lastError = res.error;
    }
    // Corrective turn so the model can repair its output on the next attempt.
    messages.push({ role: "assistant", content });
    messages.push({
      role: "user",
      content: `Your previous output was invalid: ${lastError}. Return ONLY valid JSON matching the requested schema — no prose, no code fences.`,
    });
  }

  return { value: opts.fallback(), source: "fallback", attempts: retries + 1, error: lastError };
}
