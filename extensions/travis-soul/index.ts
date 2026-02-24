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
 *
 * Commands registered:
 * - /brief   → show current TRAVIS_ACTIVE.md state
 * - /tilu    → explain T.I.L.U. principles
 * - /reload  → force-refresh soul from GitHub
 */

import { emptyPluginConfigSchema } from "../../src/plugins/config-schema.js";
import type { OpenClawPluginApi } from "../../src/plugins/types.js";
import { onBeforePromptBuild } from "./hooks/before-prompt-build.js";
import { onGatewayStart } from "./hooks/gateway-start.js";
import { onMessageReceived } from "./hooks/message-received.js";
import { getSoul, loadSoul } from "./soul/loader.js";

const ENABLE_TILU_MEMBRANE = process.env.TILU_MEMBRANE_ENABLED?.toLowerCase() === "true";

const TILU_TEXT = `T.I.L.U. — Truth → Integrity → Love → Unity

The governance stack Travis resolves every decision through, in order:

1. TRUTH — Is this accurate? Am I confident or inferring? Never claim certainty I don't have.
2. INTEGRITY — Am I acting consistently with stated values? Not optimizing for approval?
3. LOVE — Does this genuinely serve the person's wellbeing, not just their stated wants?
4. UNITY — Does this advance the mission and reduce fragmentation?

When principles conflict, Truth wins. When a response violates any principle, it gets regenerated.
Every substantive response signs off: i.L.a. / v4.0.1x`;

const travisSoulPlugin = {
  id: "travis-soul",
  name: "Travis Soul",
  description: "Travis identity, memory, T.I.L.U. governance, and venture intelligence",
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

    // 5. Commands
    api.registerCommand({
      name: "brief",
      description: "Show current Travis active state (TRAVIS_ACTIVE.md)",
      requireAuth: true,
      handler: async () => {
        const soul = getSoul();
        if (!soul) {
          return { text: "Soul not loaded yet. Use /reload to fetch from GitHub." };
        }
        const ts = soul.loadedAt.toLocaleString("en-US", {
          timeZone: "America/Chicago",
          dateStyle: "short",
          timeStyle: "short",
        });
        return { text: `**TRAVIS ACTIVE** — loaded ${ts} CT\n\n${soul.active}` };
      },
    });

    api.registerCommand({
      name: "tilu",
      description: "Explain T.I.L.U. principles",
      requireAuth: false,
      handler: async () => ({ text: TILU_TEXT }),
    });

    api.registerCommand({
      name: "reload",
      description: "Force-reload Travis soul from GitHub memory",
      requireAuth: true,
      handler: async () => {
        const token = process.env.GITHUB_TOKEN ?? "";
        if (!token) {
          return { text: "GITHUB_TOKEN not set — cannot reload soul." };
        }
        try {
          const soul = await loadSoul(token);
          const ts = soul.loadedAt.toLocaleString("en-US", {
            timeZone: "America/Chicago",
            dateStyle: "short",
            timeStyle: "short",
          });
          return { text: `Soul reloaded from GitHub. Loaded at ${ts} CT.` };
        } catch (err) {
          return { text: `Reload failed: ${String(err)}` };
        }
      },
    });

    console.log("[travis-soul] Registered. Travis is loading...");
  },
};

export default travisSoulPlugin;
