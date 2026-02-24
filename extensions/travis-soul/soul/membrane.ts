/**
 * Travis Soul — T.I.L.U. Membrane
 * Two-pass output filter: every outgoing message checked against T.I.L.U. principles
 * Fast audit via claude-haiku. Max 1 regeneration attempt.
 */

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const AUDIT_MODEL = "claude-haiku-4-5-20251001";

type TILUVerdict = {
  truth: boolean;
  integrity: boolean;
  love: boolean;
  unity: boolean;
  flags: string[];
};

type MembraneResult = {
  passed: boolean;
  content: string;
  flags: string[];
};

const AUDIT_PROMPT = `You are a T.I.L.U. compliance auditor for an AI operational intelligence system called Travis.
Evaluate the following response against four principles:
- Truth: Is the response factually accurate and not misleading?
- Integrity: Is the response consistent with stated values and not optimizing for approval?
- Love: Does the response genuinely serve the recipient's wellbeing, not just their stated wants?
- Unity: Does the response advance the mission and reduce fragmentation?

Respond ONLY with valid JSON, no other text:
{"truth": true/false, "integrity": true/false, "love": true/false, "unity": true/false, "flags": ["reason if false"]}`;

async function callClaude(
  systemPrompt: string,
  userContent: string,
  apiKey: string,
  maxTokens = 150,
): Promise<string> {
  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: AUDIT_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status}`);
  }

  const data = (await res.json()) as { content: Array<{ text: string }> };
  return data.content[0]?.text ?? "";
}

async function auditContent(content: string, apiKey: string): Promise<TILUVerdict> {
  try {
    const raw = await callClaude(AUDIT_PROMPT, `Response to audit:\n\n${content}`, apiKey, 150);

    // Strip any markdown fences if model added them
    const clean = raw.replace(/```json\n?|```/g, "").trim();
    const verdict = JSON.parse(clean) as TILUVerdict;
    return verdict;
  } catch {
    // If audit fails, pass through — don't block on membrane failure
    return { truth: true, integrity: true, love: true, unity: true, flags: [] };
  }
}

async function regenerate(
  originalContent: string,
  flags: string[],
  apiKey: string,
): Promise<string> {
  const correctionPrompt = `You are Travis, an AI operational intelligence. Your previous response failed T.I.L.U. review for: ${flags.join(", ")}.
Rewrite the response to pass. Keep the same intent but fix the flagged issues. Be direct and concise.`;

  try {
    return await callClaude(
      correctionPrompt,
      `Original response that failed review:\n\n${originalContent}\n\nRewrite it:`,
      apiKey,
      512,
    );
  } catch {
    return originalContent; // Fallback to original if regeneration fails
  }
}

export async function runTILUMembrane(
  content: string,
  _context: { channelId: string; sessionKey: string },
  anthropicApiKey: string,
): Promise<MembraneResult> {
  if (!anthropicApiKey) {
    // No API key — pass through silently
    return { passed: true, content, flags: [] };
  }

  const verdict = await auditContent(content, anthropicApiKey);
  const failedPrinciples = Object.entries(verdict)
    .filter(([key, val]) => key !== "flags" && val === false)
    .map(([key]) => key);

  if (failedPrinciples.length === 0) {
    return { passed: true, content, flags: [] };
  }

  // At least one principle failed — regenerate once
  const allFlags = [...failedPrinciples, ...(verdict.flags ?? [])];
  console.warn(`[travis-soul] T.I.L.U. membrane flagged: ${allFlags.join(", ")}`);

  const regenerated = await regenerate(content, allFlags, anthropicApiKey);
  return { passed: false, content: regenerated, flags: allFlags };
}
