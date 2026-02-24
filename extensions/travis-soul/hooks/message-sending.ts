/**
 * message_sending hook — T.I.L.U. membrane
 * Only loaded when TILU_MEMBRANE_ENABLED=true
 */

import type {
  PluginHookMessageSendingEvent,
  PluginHookMessageContext,
  PluginHookMessageSendingResult,
} from "../../../src/plugins/types.js";
import { runTILUMembrane } from "../soul/membrane.js";

export async function onMessageSending(
  event: PluginHookMessageSendingEvent,
  ctx: PluginHookMessageContext,
): Promise<PluginHookMessageSendingResult | undefined> {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  if (!apiKey) return undefined;

  const result = await runTILUMembrane(
    event.content,
    { channelId: ctx.channelId ?? "unknown", sessionKey: "" },
    apiKey,
  );

  if (!result.passed) {
    console.warn(`[travis-soul] T.I.L.U. regenerated. Flags: ${result.flags.join(", ")}`);
    return { content: result.content };
  }

  return undefined;
}
