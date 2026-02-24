/**
 * Travis Commands
 *
 * Custom slash commands registered via OpenClaw plugin API.
 * These bypass the LLM agent and return immediate responses.
 *
 * Commands:
 * /brief — morning brief / current status
 * /ventures — status of all three ventures
 * /reload — force reload soul from GitHub
 * /tilu — explain T.I.L.U. principles
 * /brad — BRAd-specific status
 * /deskmate — DeskMate status
 * /phimc — PHIMC status
 */

import type { PluginCommandContext, PluginCommandResult } from "openclaw/plugin-sdk";
import type { TravisSoul } from "./soul-loader.js";
import { loadTravisSoul } from "./soul-loader.js";

type TravisCommandDef = {
  name: string;
  description: string;
  acceptsArgs?: boolean;
  requireAuth?: boolean;
  handler: (
    ctx: PluginCommandContext,
    soul: TravisSoul,
  ) => PluginCommandResult | Promise<PluginCommandResult>;
};

export const travisCommands: TravisCommandDef[] = [
  {
    name: "brief",
    description: "Get current Travis operational brief",
    requireAuth: true,
    handler: (_ctx, soul) => ({
      text: `**Travis Operational Brief**\n\nVersion: ${soul.version}\nLoaded: ${soul.loadedAt.toISOString()}\n\n${soul.active.slice(0, 1500)}`,
    }),
  },
  {
    name: "ventures",
    description: "Status of DeskMate, BRAd, and PHIMC",
    requireAuth: true,
    handler: (_ctx, soul) => {
      // Extract ventures section from context
      const venturesMatch = soul.context.match(/## Ventures(.*?)(?=## |$)/s);
      const ventures = venturesMatch?.[1]?.trim() ?? "Ventures section not found in context.";
      return { text: `**Ventures Status**\n\n${ventures}` };
    },
  },
  {
    name: "tilu",
    description: "Explain T.I.L.U. principles",
    handler: () => ({
      text: `**T.I.L.U. — Travis's Four Pillars**\n\n**TRUTH** — Accuracy first. No guessing. Acknowledge uncertainty.\n\n**INTEGRITY** — Align with 296's real interests. Be honest even when it's hard.\n\n**LOVE** — Serve human wellbeing. Build up, don't tear down.\n\n**UNITY** — Advance the mission. Reduce suffering. Expand capability.\n\nEvery output passes through all four in order.`,
    }),
  },
  {
    name: "reload",
    description: "Force reload Travis soul from GitHub memory",
    requireAuth: true,
    handler: async () => {
      try {
        await loadTravisSoul(); // This forces a fresh load
        return { text: "Soul reloaded from travis-core. Memory is current." };
      } catch (err) {
        return { text: `Soul reload failed: ${String(err)}` };
      }
    },
  },
  {
    name: "brad",
    description: "BRAd venture status",
    requireAuth: true,
    handler: (_ctx, soul) => {
      const bradMatch = soul.context.match(/### BRAd(.*?)(?=###|## |$)/s);
      const brad = bradMatch?.[1]?.trim() ?? "BRAd section not found.";
      return { text: `**BRAd Status**\n\n${brad}` };
    },
  },
  {
    name: "deskmate",
    description: "DeskMate venture status",
    requireAuth: true,
    handler: (_ctx, soul) => {
      const dmMatch = soul.context.match(/### DeskMate(.*?)(?=###|## |$)/s);
      const dm = dmMatch?.[1]?.trim() ?? "DeskMate section not found.";
      return { text: `**DeskMate Status**\n\n${dm}` };
    },
  },
  {
    name: "phimc",
    description: "PHIMC venture status",
    requireAuth: true,
    handler: (_ctx, soul) => {
      const phimcMatch = soul.context.match(/### PHIMC(.*?)(?=###|## |$)/s);
      const phimc = phimcMatch?.[1]?.trim() ?? "PHIMC section not found.";
      return { text: `**PHIMC Status**\n\n${phimc}` };
    },
  },
];
