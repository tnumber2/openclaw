/**
 * Travis Soul — Supabase logging
 * Writes to travis_ops.ops_log table
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://mymrthdwediocgcrmdyo.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";

type OpsLogEntry = {
  action: string;
  ventureContext?: string;
  outcome?: string;
  details?: Record<string, unknown>;
  riskTier?: "LOW" | "MEDIUM" | "HIGH";
};

export async function logToSupabase(entry: OpsLogEntry): Promise<void> {
  if (!SUPABASE_ANON_KEY) return; // Silent skip if not configured

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/ops_log`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        action: entry.action,
        action_type: entry.action,
        venture_context: entry.ventureContext ?? "trvs_core",
        outcome: entry.outcome ?? "success",
        risk_tier: entry.riskTier ?? "LOW",
        description: entry.action,
        details: entry.details ?? {},
        initiated_by: "travis",
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Non-fatal — log to console only
    console.warn("[travis-soul] Supabase log failed (non-fatal)");
  }
}
