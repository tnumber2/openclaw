/**
 * Memory Writer
 *
 * Writes outcomes and decisions to TRAVIS_ACTIVE.md after significant
 * interactions. This is how Travis accumulates experience.
 *
 * Strategy: lightweight, async, non-blocking.
 * We don't write after every message — only when something meaningful
 * happened (decisions made, tasks completed, errors caught).
 */

import type { TravisSoul } from "./soul-loader.js";
import { writeToMemory } from "./soul-loader.js";

type OutcomeParams = {
  output: string;
  sessionId: string;
  agentId?: string;
  soul: TravisSoul;
  tokens?: {
    input?: number;
    output?: number;
    total?: number;
  };
};

// Heuristics to determine if an interaction is "significant" enough to log
function isSignificantOutput(output: string): boolean {
  const length = output.length;
  if (length < 200) return false; // too short to be meaningful

  const significantKeywords = [
    /decision/i,
    /completed/i,
    /deployed/i,
    /fixed/i,
    /blocked/i,
    /critical/i,
    /error/i,
    /BRAd/i,
    /DeskMate/i,
    /PHIMC/i,
    /Brunswick/i,
    /Coalition/i,
  ];

  return significantKeywords.some((kw) => kw.test(output));
}

// Supabase logging (non-blocking)
async function logToSupabase(params: OutcomeParams): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  try {
    const body = JSON.stringify({
      action_type: "llm_output",
      description: params.output.slice(0, 500),
      outcome: "completed",
      risk_tier: "LOW",
      session_id: params.sessionId,
      initiated_by: "travis-soul",
      details: {
        agent_id: params.agentId,
        soul_version: params.soul.version,
        tokens: params.tokens,
      },
    });

    await fetch(`${supabaseUrl}/rest/v1/travis_ops.ops_log`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body,
    });
  } catch {
    // Supabase logging failure is never fatal
  }
}

export async function writeOutcomeToMemory(params: OutcomeParams): Promise<void> {
  // Always log to Supabase (lightweight)
  void logToSupabase(params);

  // Only write to GitHub memory for significant interactions
  if (!isSignificantOutput(params.output)) return;
  if (!params.soul.githubToken) return;

  try {
    const timestamp = new Date().toISOString();
    const entry = `\n---\n### Session ${params.sessionId.slice(0, 8)} — ${timestamp}\n${params.output.slice(0, 800)}\n`;

    // Append to current active context
    const updatedActive = params.soul.active + entry;

    await writeToMemory(
      params.soul,
      "TRAVIS_ACTIVE.md",
      updatedActive,
      `[travis-soul] session outcome ${params.sessionId.slice(0, 8)}`,
    );
  } catch (err) {
    console.warn(`[travis-soul] GitHub memory write failed: ${String(err)}`);
  }
}
