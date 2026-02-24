/**
 * Travis Soul Plugin — Entry Point
 *
 * Registers Travis's identity, memory, T.I.L.U. governance, and venture intelligence
 * into OpenClaw's hook system. This makes every Claude interaction feel like Travis,
 * not a generic AI.
 *
 * Hooks registered:
 * - gateway_start      → load soul from GitHub, announce online
 * - before_prompt_build → inject Travis identity into EVERY Claude call
 * - message_received   → authorize, classify, route, log
 * - message_sending    → T.I.L.U. membrane (optional, TILU_MEMBRANE_ENABLED=true)
 */

import { emptyPluginConfigSchema } from "../../src/plugins/config-schema.js";
import type { OpenClawPluginApi } from "../../src/plugins/types.js";
import { onBeforePromptBuild } from "./hooks/before-prompt-build.js";
import { onGatewayStart } from "./hooks/gateway-start.js";
import { onMessageReceived } from "./hooks/message-received.js";

const ENABLE_TILU_MEMBRANE = process.env.TILU_MEMBRANE_ENABLED?.toLowerCase() === "true";

const travisSoulPlugin = {
  id: "travis-soul",
  name: "Travis Soul",
  description: "Travis identity, memory, T.I.L.U. governance, and venture intelligence",
  kind: "agent" as const,
  configSchema: emptyPluginConfigSchema(),

  register(api: OpenClawPluginApi) {
    // 1. Boot: load soul from GitHub memory
    api.on("gateway_start", onGatewayStart, { priority: 100 });

    // 2. Inject Travis soul into every Claude call — the critical hook
    api.on("before_prompt_build", onBeforePromptBuild, { priority: 100 });

    // 3. Authorize, classify, and log all incoming messages
    api.on("message_received", onMessageReceived, { priority: 90 });

    // 4. T.I.L.U. membrane — optional (extra API calls per message)
    if (ENABLE_TILU_MEMBRANE) {
      void import("./hooks/message-sending.js").then(({ onMessageSending }) => {
        api.on("message_sending", onMessageSending, { priority: 100 });
        console.log("[travis-soul] T.I.L.U. membrane: ENABLED");
      });
    } else {
      console.log(
        "[travis-soul] T.I.L.U. membrane: disabled (set TILU_MEMBRANE_ENABLED=true to enable)",
      );
    }

    console.log("[travis-soul] Registered. Travis is loading...");
  },
};

export default travisSoulPlugin;
