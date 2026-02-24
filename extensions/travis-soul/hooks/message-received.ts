/**
 * message_received hook — incoming message classifier and router
 */

import type {
  PluginHookMessageReceivedEvent,
  PluginHookMessageContext,
} from "../../../src/plugins/types.js";
import { refreshSoul } from "../soul/loader.js";
import { logToSupabase } from "../supabase.js";

const AUTHORIZED_CHAT_ID = process.env.TELEGRAM_HOST_CHAT_ID ?? "";

export async function onMessageReceived(
  event: PluginHookMessageReceivedEvent,
  ctx: PluginHookMessageContext,
): Promise<void> {
  const { from, content } = event;
  const { channelId } = ctx;

  // Authorization check — only 296 gets through on Telegram
  if (channelId === "telegram" && AUTHORIZED_CHAT_ID && from !== AUTHORIZED_CHAT_ID) {
    console.warn(`[travis-soul] Unauthorized message from ${from} on ${channelId}`);
    await logToSupabase({
      action: "unauthorized_message",
      ventureContext: "trvs_core",
      outcome: "blocked",
      details: { from, channelId, preview: content.slice(0, 40) },
    });
    return;
  }

  await logToSupabase({
    action: "message_received",
    ventureContext: detectVentureContext(content),
    outcome: "received",
    details: { channelId, preview: content.slice(0, 80) },
  });

  // Handle /memory command — force soul refresh
  const cmd = content.trim().toLowerCase();
  if (cmd === "/memory" || cmd === "memory refresh") {
    const token = process.env.GITHUB_TOKEN ?? "";
    if (token) {
      try {
        await refreshSoul(token);
        console.log("[travis-soul] Soul refreshed on demand");
      } catch (err) {
        console.error("[travis-soul] On-demand refresh failed:", err);
      }
    }
  }
}

function detectVentureContext(content: string): string {
  const lower = content.toLowerCase();
  if (lower.includes("deskmate") || lower.includes("coalition")) return "deskmate";
  if (lower.includes("brad") || lower.includes("brunswick") || lower.includes("bowling"))
    return "brad";
  if (lower.includes("phimc") || lower.includes("pakistan") || lower.includes("ali"))
    return "phimc";
  return "trvs_core";
}
