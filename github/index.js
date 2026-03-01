/**
 * GitHub extension for Nixium.
 *
 * Commands:
 *   GitHub: Open File on GitHub       – open current file on github.com (blob view)
 *   GitHub: Copy File URL             – copy the github.com URL to clipboard
 *   GitHub: Open Blame on GitHub      – open git blame view for current file
 *   GitHub: Open Repository           – open the repository root on github.com
 *   GitHub: Copy Repository URL       – copy the repository URL to clipboard
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read a file through the Nixium filesystem API. Returns null on any error. */
async function readFile(path) {
  try {
    const res = await fetch(`/api/fs/read?path=${encodeURIComponent(path)}`);
    return res.ok ? res.text() : null;
  } catch {
    return null;
  }
}

/** List a directory through the Nixium filesystem API. Returns [] on error. */
async function listDir(path) {
  try {
    const res = await fetch(`/api/fs/list?path=${encodeURIComponent(path)}`);
    return res.ok ? res.json() : [];
  } catch {
    return [];
  }
}

/**
 * Walk upward from `startPath` looking for a directory that contains a `.git`
 * sub-directory. Returns the git root path or null if not found.
 */
async function findGitRoot(startPath) {
  let dir = startPath;
  for (let i = 0; i < 20; i++) {
    const entries = await listDir(dir);
    if (entries.some(e => e.name === '.git' && e.is_dir)) return dir;
    const parent = dir.replace(/\/[^/]+$/, '') || '/';
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

/**
 * Return the current branch name from `.git/HEAD`.
 * Falls back to "main" if the file cannot be parsed.
 */
async function getCurrentBranch(gitRoot) {
  const head = await readFile(`${gitRoot}/.git/HEAD`);
  if (!head) return 'main';
  const m = head.trim().match(/^ref: refs\/heads\/(.+)$/);
  return m ? m[1] : (head.trim().slice(0, 7) || 'main');
}

/**
 * Parse a remote section out of `.git/config` and return the first GitHub URL
 * found (prefers `origin`). Returns null if no GitHub remote exists.
 */
async function getGitHubRemote(gitRoot) {
  const config = await readFile(`${gitRoot}/.git/config`);
  if (!config) return null;

  // Split into [remote "…"] blocks and find github.com ones.
  const blocks = config.split(/(?=\[remote\s)/);
  // Prefer "origin", fall back to first GitHub remote found.
  let fallback = null;
  for (const block of blocks) {
    if (!/^\[remote\b/.test(block)) continue;
    const urlMatch = block.match(/url\s*=\s*([^\r\n]+)/);
    if (!urlMatch) continue;
    const url = urlMatch[1].trim();
    if (!url.includes('github.com')) continue;
    if (block.includes('"origin"')) return url;
    if (!fallback) fallback = url;
  }
  return fallback;
}

/**
 * Convert a git remote URL (SSH or HTTPS) to a `https://github.com/owner/repo`
 * base URL. Returns null if the URL is not a GitHub URL.
 */
function remoteToGitHubBase(remoteUrl) {
  // SSH:   git@github.com:owner/repo.git
  const sshMatch = remoteUrl.match(/git@github\.com[:/](.+?)(?:\.git)?$/);
  if (sshMatch) return `https://github.com/${sshMatch[1]}`;
  // HTTPS: https://github.com/owner/repo.git  (or without .git)
  const httpsMatch = remoteUrl.match(/https?:\/\/(?:[^@]+@)?github\.com\/(.+?)(?:\.git)?$/);
  if (httpsMatch) return `https://github.com/${httpsMatch[1]}`;
  return null;
}

/** Join raw path segments into a clean URL path (no double slashes). */
function joinPath(...parts) {
  return parts.map(p => p.replace(/^\/|\/$/g, '')).filter(Boolean).join('/');
}

// ---------------------------------------------------------------------------
// Core: resolve all GitHub context for the current workspace / file
// ---------------------------------------------------------------------------

async function resolveContext(api) {
  const rootPath = localStorage.getItem('nixium-root') ?? '/';
  const filePath = api.getActiveFilePath();

  if (!filePath) {
    api.showNotification('No file is open.', 'error');
    return null;
  }

  const gitRoot = await findGitRoot(rootPath);
  if (!gitRoot) {
    api.showNotification('No git repository found in the current workspace.', 'error');
    return null;
  }

  const remoteUrl = await getGitHubRemote(gitRoot);
  if (!remoteUrl) {
    api.showNotification('No GitHub remote found in this repository.', 'error');
    return null;
  }

  const repoBase = remoteToGitHubBase(remoteUrl);
  if (!repoBase) {
    api.showNotification(`Remote is not a GitHub URL: ${remoteUrl}`, 'error');
    return null;
  }

  const branch = await getCurrentBranch(gitRoot);

  // Make the file path relative to the git root.
  const rel = filePath.startsWith(gitRoot)
    ? filePath.slice(gitRoot.length).replace(/^\//, '')
    : filePath.replace(/^\//, '');

  return { repoBase, branch, rel, filePath };
}

/** Build a blob URL for the current file. */
function blobUrl(ctx) {
  return `${ctx.repoBase}/blob/${ctx.branch}/${joinPath(ctx.rel)}`;
}

/** Copy text to clipboard and show a notification. */
async function copyToClipboard(api, text, label) {
  try {
    await navigator.clipboard.writeText(text);
    api.showNotification(`Copied: ${label}`);
  } catch {
    api.showNotification(`Could not access clipboard. URL: ${text}`, 'error');
  }
}

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

export function activate(api) {
  // ── Open file on GitHub ──────────────────────────────────────────────────
  api.registerCommand('github.openFile', 'GitHub: Open File on GitHub', async () => {
    const ctx = await resolveContext(api);
    if (!ctx) return;
    const url = blobUrl(ctx);
    window.open(url, '_blank', 'noopener,noreferrer');
  });

  // ── Copy file URL ────────────────────────────────────────────────────────
  api.registerCommand('github.copyFileUrl', 'GitHub: Copy File URL', async () => {
    const ctx = await resolveContext(api);
    if (!ctx) return;
    const url = blobUrl(ctx);
    await copyToClipboard(api, url, ctx.rel);
  });

  // ── Open blame ───────────────────────────────────────────────────────────
  api.registerCommand('github.openBlame', 'GitHub: Open Blame on GitHub', async () => {
    const ctx = await resolveContext(api);
    if (!ctx) return;
    const url = `${ctx.repoBase}/blame/${ctx.branch}/${joinPath(ctx.rel)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  });

  // ── Open repository root ─────────────────────────────────────────────────
  api.registerCommand('github.openRepo', 'GitHub: Open Repository', async () => {
    const rootPath = localStorage.getItem('nixium-root') ?? '/';
    const gitRoot = await findGitRoot(rootPath);
    if (!gitRoot) { api.showNotification('No git repository found.', 'error'); return; }
    const remoteUrl = await getGitHubRemote(gitRoot);
    if (!remoteUrl) { api.showNotification('No GitHub remote found.', 'error'); return; }
    const repoBase = remoteToGitHubBase(remoteUrl);
    if (!repoBase) { api.showNotification('Remote is not a GitHub URL.', 'error'); return; }
    window.open(repoBase, '_blank', 'noopener,noreferrer');
  });

  // ── Copy repository URL ──────────────────────────────────────────────────
  api.registerCommand('github.copyRepoUrl', 'GitHub: Copy Repository URL', async () => {
    const rootPath = localStorage.getItem('nixium-root') ?? '/';
    const gitRoot = await findGitRoot(rootPath);
    if (!gitRoot) { api.showNotification('No git repository found.', 'error'); return; }
    const remoteUrl = await getGitHubRemote(gitRoot);
    if (!remoteUrl) { api.showNotification('No GitHub remote found.', 'error'); return; }
    const repoBase = remoteToGitHubBase(remoteUrl);
    if (!repoBase) { api.showNotification('Remote is not a GitHub URL.', 'error'); return; }
    await copyToClipboard(api, repoBase, repoBase);
  });
}

export function deactivate() {}
