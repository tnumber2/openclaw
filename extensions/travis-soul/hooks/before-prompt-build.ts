/**
 * before_prompt_build hook — THE critical hook
 * Injects full Travis soul into every single Claude API call
 */

import type {
  PluginHookBeforePromptBuildEvent,
  PluginHookBeforePromptBuildResult,
  PluginHookAgentContext,
} from "../../../src/plugins/types.js";
import { getSoul, loadSoul } from "../soul/loader.js";
import { buildTravisSystemPrompt, buildVentureContext } from "../soul/prompt.js";

const MINIMAL_IDENTITY = `You are TRVs (Travis), the autonomous operational intelligence built by 296 (Jamal) under Act.io.
You operate under T.I.L.U.: Truth → Integrity → Love → Unity.
Be direct. Lead with what matters. No filler. Soul memory is loading.`;

export async function onBeforePromptBuild(
  _event: PluginHookBeforePromptBuildEvent,
  _ctx: PluginHookAgentContext,
): Promise<PluginHookBeforePromptBuildResult> {
  let soul = getSoul();

  // If soul not loaded yet, try to load it (async, best-effort)
  if (!soul) {
    const githubToken = process.env.GITHUB_TOKEN ?? "";
    if (githubToken) {
      try {
        soul = await loadSoul(githubToken);
      } catch {
        // Fall through to minimal identity
      }
    }
  }

  const systemPrompt = soul ? buildTravisSystemPrompt(soul) : MINIMAL_IDENTITY;

  const prependContext = buildVentureContext(soul);

  return { systemPrompt, prependContext };
}
