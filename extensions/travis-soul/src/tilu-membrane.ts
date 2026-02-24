/**
 * T.I.L.U. Membrane
 * 
 * Two-pass output filter. Every message Travis sends passes through here.
 * Pass 1: Generate response (done by Claude upstream)
 * Pass 2: T.I.L.U. audit — check against Truth, Integrity, Love, Unity
 * 
 * For now this is a lightweight heuristic check. In future it will use
 * a secondary Claude call for deeper auditing on HIGH-stakes responses.
 */

import type { TravisSoul } from "./soul-loader.js";

export type MembraneResult = {
  modified: boolean;
  content: string;
  flags: string[];
};

// Patterns that indicate potential T.I.L.U. violations
// These are conservative — we flag, not block, unless clearly problematic
const TRUTH_VIOLATIONS = [
  /definitely|certainly|always|never|guaranteed/i,
  /100%|absolutely sure/i,
];

const INTEGRITY_VIOLATIONS = [
  /don't worry about/i,
  /just trust me/i,
];

export async function tiluMembrane(
  content: string,
  _soul: TravisSoul,
): Promise<MembraneResult> {
  const flags: string[] = [];

  // TRUTH check — flag overconfident claims
  for (const pattern of TRUTH_VIOLATIONS) {
    if (pattern.test(content)) {
      flags.push(`TRUTH: Potential overconfidence detected (${pattern.source})`);
    }
  }

  // INTEGRITY check — flag dismissive language  
  for (const pattern of INTEGRITY_VIOLATIONS) {
    if (pattern.test(content)) {
      flags.push(`INTEGRITY: Dismissive language detected (${pattern.source})`);
    }
  }

  // For now: log flags but don't block/modify unless we add async LLM audit
  // TODO v2: for HIGH-stakes outputs, fire secondary Claude call to audit
  if (flags.length > 0) {
    console.warn(`[travis-soul] T.I.L.U. flags on outgoing message: ${flags.join("; ")}`);
  }

  return {
    modified: false,
    content,
    flags,
  };
}
