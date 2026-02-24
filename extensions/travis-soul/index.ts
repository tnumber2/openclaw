/**
 * Travis Soul Plugin — OpenClaw Extension
 * 
 * Injects Travis identity (T.I.L.U.) into every Claude interaction.
 * Loads memory from tnumber2/travis-core GitHub repo at gateway startup.
 * Runs T.I.L.U. membrane on all outgoing messages.
 * Writes outcomes back to memory after significant interactions.
 * 
 * Architecture: this is the SOUL of Travis running inside OpenClaw's BODY.
 */

import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { loadTravisSoul } from "./src/soul-loader.js";
import { buildSoulPrompt } from "./src/soul-prompt.js";
import { tiluMembrane } from "./src/tilu-membrane.js";
import { writeOutcomeToMemory } from "./src/memory-writer.js";
import { travisCommands } from "./src/commands.js";

// Singleton soul state — loaded once at gateway startup, refreshed periodically
let soulState: Awaited<ReturnType<typeof loadTravisSoul>> | null = null;
let lastSoulLoad = 0;
const SOUL_REFRESH_MS = 30 * 60 * 1000; // 30 minutes

async function ensureSoul() {
  const now = Date.now();
  if (!soulState || now - lastSoulLoad > SOUL_REFRESH_MS) {
    soulState = await loadTravisSoul();
    lastSoulLoad = now;
  }
  return soulState;
}

const travisSoulPlugin = {
  id: "travis-soul",
  name: "Travis Soul",
  description: "T.I.L.U. identity overlay — Truth, Integrity, Love, Unity",

  async register(api: OpenClawPluginApi) {
    // =========================================================
    // HOOK: gateway_start — load soul on boot, send wake signal
    // =========================================================
    api.on("gateway_start", async (_event, _ctx) => {
      try {
        api.logger.info("[travis-soul] Loading soul from travis-core...");
        soulState = await loadTravisSoul();
        lastSoulLoad = Date.now();
        api.logger.info(`[travis-soul] Soul loaded. Version: ${soulState.version}`);
      } catch (err) {
        api.logger.error(`[travis-soul] Failed to load soul: ${String(err)}`);
      }
    });

    // =========================================================
    // HOOK: before_prompt_build — inject Travis soul into EVERY
    // Claude call. This is where the magic happens.
    // =========================================================
    api.on("before_prompt_build", async (_event, _ctx) => {
      try {
        const soul = await ensureSoul();
        const systemPrompt = buildSoulPrompt(soul);
        return { systemPrompt };
      } catch (err) {
        api.logger.error(`[travis-soul] Soul injection failed: ${String(err)}`);
        return undefined;
      }
    }, { priority: 100 }); // High priority — Travis soul runs first

    // =========================================================
    // HOOK: message_sending — T.I.L.U. membrane check
    // Every outgoing message passes through Truth/Integrity/Love/Unity
    // =========================================================
    api.on("message_sending", async (event, _ctx) => {
      try {
        const soul = await ensureSoul();
        const result = await tiluMembrane(event.content, soul);
        if (result.modified) {
          api.logger.info(`[travis-soul] T.I.L.U. membrane modified response`);
          return { content: result.content };
        }
      } catch (err) {
        api.logger.error(`[travis-soul] T.I.L.U. membrane error: ${String(err)}`);
      }
      return undefined;
    });

    // =========================================================
    // HOOK: llm_output — log to Supabase + write outcomes to memory
    // =========================================================
    api.on("llm_output", async (event, ctx) => {
      try {
        const soul = await ensureSoul();
        const output = event.assistantTexts.join(" ");
        await writeOutcomeToMemory({
          output,
          sessionId: event.sessionId,
          agentId: ctx.agentId,
          soul,
          tokens: event.usage,
        });
      } catch (err) {
        // Non-blocking — never let memory writes crash the main flow
        api.logger.warn(`[travis-soul] Memory write-back failed: ${String(err)}`);
      }
    });

    // =========================================================
    // COMMANDS — Travis-specific slash commands
    // /brief, /ventures, /brad, /deskmate, /phimc, /tilu, /reload
    // =========================================================
    for (const cmd of travisCommands) {
      api.registerCommand({
        ...cmd,
        handler: async (ctx) => {
          const soul = await ensureSoul();
          return cmd.handler(ctx, soul);
        },
      } as Parameters<typeof api.registerCommand>[0]);
    }

    api.logger.info("[travis-soul] Plugin registered. Travis is alive.");
  },
};

export default travisSoulPlugin;
