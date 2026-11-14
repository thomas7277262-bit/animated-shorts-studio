// Render still frames of the demo for quick visual checks:
//   npx vite build && node scripts/snap.mjs out-dir 1 5 10
// quick visual check: render a few frames of the demo to PNGs
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { buildTimeline } from '../src/story/timeline.js';
import { DEMO_STORYBOARD } from '../src/story/demo.js';
const dist = new URL('../dist', import.meta.url).pathname;
const out = process.argv[2];
const times = process.argv.slice(3).map(Number);
fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const srv = http.createServer((q, r) => { const f = path.join(dist, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
const port = srv.address().port;
const W = 540, H = 960;
const tl = buildTimeline(DEMO_STORYBOARD, { width: W, height: H });
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: W, height: H } });
p.on('console', (m) => console.log('[page]', m.text()));
p.on('pageerror', (e) => console.log('[pageerror]', e.message));
await p.goto(`http://localhost:${port}/render.html`);
await p.waitForFunction(() => window.__studio);
console.log(await p.evaluate(([tl, W, H]) => window.__studio.load(tl, W, H), [tl, W, H]));
for (const t of times) {
  const t0 = Date.now();
  const url = await p.evaluate((t) => window.__studio.frame(t, 0.9), t);
  fs.writeFileSync(path.join(out, `t${t.toFixed(2)}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  console.log('frame', t, Date.now() - t0, 'ms');
}
await b.close(); srv.close();
