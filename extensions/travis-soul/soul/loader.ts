/**
 * Travis Soul — GitHub memory loader
 * Fetches TRAVIS_CONTEXT.md + TRAVIS_ACTIVE.md from tnumber2/travis-core
 * Caches in memory, refreshes every 30 minutes
 */

const GITHUB_REPO = "tnumber2/travis-core";
const GITHUB_API = "https://api.github.com";
const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export type SoulData = {
  context: string;
  active: string;
  loadedAt: Date;
};

let cachedSoul: SoulData | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

async function fetchFile(filepath: string, token: string): Promise<string> {
  const url = `${GITHUB_API}/repos/${GITHUB_REPO}/contents/${filepath}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3.raw",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub fetch failed [${res.status}]: ${filepath}`);
  }
  return res.text();
}

export async function loadSoul(githubToken: string): Promise<SoulData> {
  const [context, active] = await Promise.all([
    fetchFile("memory/TRAVIS_CONTEXT.md", githubToken),
    fetchFile("memory/TRAVIS_ACTIVE.md", githubToken),
  ]);
  cachedSoul = { context, active, loadedAt: new Date() };
  scheduleRefresh(githubToken);
  return cachedSoul;
}

export function getSoul(): SoulData | null {
  return cachedSoul;
}

export async function refreshSoul(githubToken: string): Promise<void> {
  await loadSoul(githubToken);
}

function scheduleRefresh(githubToken: string): void {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(async () => {
    try {
      await refreshSoul(githubToken);
      console.log("[travis-soul] Soul refreshed from GitHub");
    } catch (err) {
      console.error("[travis-soul] Soul refresh failed:", err);
    }
  }, REFRESH_INTERVAL_MS);
}

export async function writeSoulMemory(
  filepath: string,
  content: string,
  commitMessage: string,
  githubToken: string,
): Promise<boolean> {
  try {
    // Get current SHA
    const metaRes = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents/${filepath}`, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    const meta = metaRes.ok ? ((await metaRes.json()) as { sha?: string }) : {};

    const payload: Record<string, string> = {
      message: commitMessage,
      content: Buffer.from(content, "utf-8").toString("base64"),
    };
    if (meta.sha) payload.sha = meta.sha;

    const writeRes = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents/${filepath}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (writeRes.ok) {
      // Update cache if writing active memory
      if (filepath.includes("TRAVIS_ACTIVE") && cachedSoul) {
        cachedSoul = { ...cachedSoul, active: content };
      }
      return true;
    }
    console.error("[travis-soul] Write failed:", writeRes.status);
    return false;
  } catch (err) {
    console.error("[travis-soul] Write error:", err);
    return false;
  }
}
