// One still per storyboard shot (taken at a chosen point inside the shot), plus contact sheets.
//   npx vite build && node productions/weakest-pet/render_storyboard_stills.mjs <outDir> [width] [shots e.g. 1-10]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildTimeline } from '../../src/story/timeline.js';
import { renderStills } from '../../render/frames.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const OUT = path.resolve(process.argv[2] || 'output/weakest-pet-board');
const W = Number(process.argv[3] || 540), H = Math.round(W * 16 / 9);
fs.mkdirSync(OUT, { recursive: true });
const sb = JSON.parse(fs.readFileSync(path.join(ROOT, process.env.SB || 'productions/weakest-pet/storyboard.json'), 'utf8'));
const al = JSON.parse(fs.readFileSync(path.join(ROOT, sb.narration.alignment), 'utf8'));
const tl = buildTimeline(sb, { narration: { lines: al.lines }, width: W, height: H });
let [a, b] = (process.argv[4] || `1-${tl.scenes.length}`).split('-').map(Number); b ||= a;
const idx = tl.scenes.map((_, i) => i).filter((i) => i + 1 >= a && i + 1 <= b);
const FONT = path.join(ROOT, 'assets/fonts/Fredoka-Bold.ttf');
const times = idx.map((i) => { const s = tl.scenes[i]; return s.start + (s.end - s.start) * 0.62; });
const t0 = Date.now();
const imgs = await renderStills({ timeline: tl, width: W, height: H, times, distDir: path.join(ROOT, 'dist') });
console.log(`rendered ${imgs.length} stills in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
const files = imgs.map((buf, k) => {
  const i = idx[k], t = times[k];
  const word = tl.lines.flatMap((l) => l.words).find((w) => t >= w.start && t < w.end + 0.2)?.w.toLowerCase().replace(/[^a-z0-9'-]/g, '') || '';
  const f = path.join(OUT, `shot${String(i + 1).padStart(2, '0')}.jpg`), raw = f + '.raw.jpg';
  fs.writeFileSync(raw, buf);
  const tag = `${i + 1}  ${t.toFixed(1)}s`;
  spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-vf',
    `drawtext=fontfile=${FONT}:text='${word}':fontsize=${Math.round(H * 0.068)}:fontcolor=0xF2FF2E:borderw=${Math.round(H * 0.006)}:bordercolor=black:x=(w-tw)/2:y=h*0.66,` +
    `drawtext=fontfile=${FONT}:text='${tag}':fontsize=${Math.round(H * 0.03)}:fontcolor=white:borderw=3:bordercolor=black:x=12:y=10`, '-q:v', '3', f]);
  fs.rmSync(raw);
  return f;
});
// contact sheets, 10 per sheet (5 x 2)
for (let s = 0; s * 10 < files.length; s++) {
  const part = files.slice(s * 10, s * 10 + 10);
  const cols = 5;
  const layout = part.map((_, i) => `${(i % cols) ? Array.from({ length: i % cols }, () => 'w0').join('+') : 0}_${Math.floor(i / cols) ? 'h0' : 0}`).join('|');
  spawnSync('ffmpeg', ['-y', '-v', 'error', ...part.flatMap((f) => ['-i', f]), '-filter_complex',
    `${part.map((_, i) => `[${i}:v]scale=270:480[s${i}]`).join(';')};${part.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${part.length}:layout=${layout}:fill=black`,
    path.join(OUT, `sheet${String(idx[s * 10] + 1).padStart(2, '0')}.jpg`)]);
}
console.log(fs.readdirSync(OUT).filter((f) => f.startsWith('sheet')));
