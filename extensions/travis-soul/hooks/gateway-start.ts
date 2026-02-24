/**
 * gateway_start hook — fires when OpenClaw gateway boots
 * Loads soul from GitHub, announces Travis is online
 */

import type {
  PluginHookGatewayStartEvent,
  PluginHookGatewayContext,
} from "../../../src/plugins/types.js";
import { loadSoul } from "../soul/loader.js";
import { logToSupabase } from "../supabase.js";

function nowCT(): string {
  return new Date().toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export async function onGatewayStart(
  _event: PluginHookGatewayStartEvent,
  _ctx: PluginHookGatewayContext,
): Promise<void> {
  const githubToken = process.env.GITHUB_TOKEN ?? "";

  try {
    await loadSoul(githubToken);
    console.log("[travis-soul] Soul loaded from GitHub");
  } catch (err) {
    console.error("[travis-soul] Soul load failed — running on identity only:", err);
  }

  await logToSupabase({
    action: "gateway_start",
    ventureContext: "trvs_core",
    outcome: "success",
    details: { version: "1.0.0", timestamp: new Date().toISOString() },
  });

  console.log(`[travis-soul] Travis online. ${nowCT()} CT`);
}
