/**
 * Soul Loader
 *
 * Fetches TRAVIS_CONTEXT.md and TRAVIS_ACTIVE.md from tnumber2/travis-core
 * via GitHub API. This is Travis's persistent memory.
 *
 * Falls back gracefully if GitHub is unavailable — Travis degrades to
 * core identity only, not a blank slate.
 */

const GITHUB_REPO = "tnumber2/travis-core";
const MEMORY_FILES = ["memory/TRAVIS_CONTEXT.md", "memory/TRAVIS_ACTIVE.md"];

export type TravisSoul = {
  version: string;
  loadedAt: Date;
  context: string; // TRAVIS_CONTEXT.md content
  active: string; // TRAVIS_ACTIVE.md content
  githubToken: string | undefined;
};

async function fetchGitHubFile(path: string, token?: string): Promise<string> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3.raw",
    "User-Agent": "travis-soul-plugin/1.0",
  };
  if (token) {
    headers.Authorization = `token ${token}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub fetch failed for ${path}: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

export async function loadTravisSoul(): Promise<TravisSoul> {
  const token = process.env.GITHUB_TOKEN;

  let context = "[TRAVIS_CONTEXT.md unavailable — operating on core identity only]";
  let active = "[TRAVIS_ACTIVE.md unavailable]";

  try {
    context = await fetchGitHubFile(MEMORY_FILES[0], token);
  } catch (err) {
    console.error(`[travis-soul] Could not load TRAVIS_CONTEXT.md: ${String(err)}`);
  }

  try {
    active = await fetchGitHubFile(MEMORY_FILES[1], token);
  } catch (err) {
    console.error(`[travis-soul] Could not load TRAVIS_ACTIVE.md: ${String(err)}`);
  }

  // Extract version from context
  const versionMatch = context.match(/\*\*Version:\*\*\s*([\w.]+)/);
  const version = versionMatch?.[1] ?? "unknown";

  return {
    version,
    loadedAt: new Date(),
    context,
    active,
    githubToken: token,
  };
}

export async function writeToMemory(
  soul: TravisSoul,
  filename: "TRAVIS_CONTEXT.md" | "TRAVIS_ACTIVE.md",
  content: string,
  commitMessage: string,
): Promise<void> {
  if (!soul.githubToken) {
    throw new Error("GITHUB_TOKEN not set — cannot write to memory");
  }

  const path = `memory/${filename}`;

  // First get the current SHA
  const shaRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    headers: {
      Authorization: `token ${soul.githubToken}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "travis-soul-plugin/1.0",
    },
  });

  if (!shaRes.ok) {
    throw new Error(`Failed to get SHA for ${path}: ${shaRes.status}`);
  }

  const shaData = (await shaRes.json()) as { sha: string };

  // Write the updated content
  const body = JSON.stringify({
    message: commitMessage,
    content: Buffer.from(content, "utf-8").toString("base64"),
    sha: shaData.sha,
  });

  const writeRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `token ${soul.githubToken}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "travis-soul-plugin/1.0",
    },
    body,
  });

  if (!writeRes.ok) {
    const errText = await writeRes.text();
    throw new Error(`Memory write failed for ${path}: ${writeRes.status} — ${errText}`);
  }
}
