// Tiny GitHub REST client used by the dashboard to start cloud renders
// (GitHub Actions) and list finished videos (GitHub Releases).
const API = 'https://api.github.com';

export function guessRepo() {
  // https://<owner>.github.io/<repo>/  ->  owner/repo
  const m = location.hostname.match(/^([^.]+)\.github\.io$/);
  if (m) {
    const repo = location.pathname.split('/').filter(Boolean)[0];
    if (repo) return `${m[1]}/${repo}`;
  }
  return 'thomas7277262-bit/animated-shorts-studio';
}

async function gh(path, { token, method = 'GET', body } = {}) {
  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const r = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 204) return null;
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${data.message || r.statusText}`);
  return data;
}

export function toBase64(str) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(str)));
}

export async function startRender({ repo, token, storyboard, resolution, fps, renderId, ref = 'main' }) {
  await gh(`/repos/${repo}/actions/workflows/render.yml/dispatches`, {
    token, method: 'POST',
    body: { ref, inputs: { storyboard_b64: toBase64(JSON.stringify(storyboard)), resolution, fps: String(fps), render_id: renderId } },
  });
}

export async function findRun({ repo, token, renderId }) {
  const d = await gh(`/repos/${repo}/actions/workflows/render.yml/runs?per_page=20&event=workflow_dispatch`, { token });
  return (d.workflow_runs || []).find((r) => (r.display_title || r.name || '').includes(renderId)) || null;
}

export async function getRelease({ repo, token, renderId }) {
  try { return await gh(`/repos/${repo}/releases/tags/render-${renderId}`, { token }); } catch { return null; }
}

export async function listRenders({ repo, token }) {
  const d = await gh(`/repos/${repo}/releases?per_page=30`, { token });
  return d.filter((r) => r.tag_name.startsWith('render-')).map((r) => ({
    id: r.tag_name.replace('render-', ''), title: r.name, date: r.published_at, url: r.html_url,
    mp4: r.assets.find((a) => a.name.endsWith('.mp4')),
    poster: r.assets.find((a) => a.name.endsWith('.jpg')),
  }));
}
