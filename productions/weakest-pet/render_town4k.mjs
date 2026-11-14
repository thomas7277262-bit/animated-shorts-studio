// 4K look test: the bright suburb set + bright character style.
//   npx vite build && node productions/weakest-pet/render_town4k.mjs <outDir>
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildTimeline } from '../../src/story/timeline.js';
import { renderStills } from '../../render/frames.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const OUT = path.resolve(process.argv[2] || 'output/weakest-pet-4k');
fs.mkdirSync(OUT, { recursive: true });
const FONT = path.join(ROOT, 'assets/fonts/Fredoka-Bold.ttf');
const cam = (target, angle, dist, height, lookY = 0, fov = 50) => ({ type: 'medium', target, from: { angle, dist, height, lookY, fov }, to: { angle, dist, height, lookY, fov }, scale: false });

const SHOTS = [
  { name: '4K-1-town-aerial', word: 'town',
    cast: [['maxkid', [-1.2, -0.2], 90, 'walk'], ['nugget', [-0.3, 0.1], 90, 'walk'], ['reyes', [3.5, -9.0], -90, 'walk'], ['lion', [5.2, -8.9], -90, 'walk'],
      ['brax', [-6, -0.4], 90, 'walk'], ['tiger', [-4.6, -0.2], 90, 'walk'], ['owen', [8, -3.4], -90, 'idle'], ['petdragon', [9.5, -3.6], -90, 'idle']],
    labels: [], camera: cam([2, 0, -6], -28, 24, 15, 0, 55) },
  { name: '4K-2-max-close-up', word: 'finally',
    cast: [['maxkid', [0, 0.6], 0, 'cheer', 'laugh'], ['nugget', [0.9, 1.2], -20, 'wag', 'happy']],
    labels: [['nugget', '0', '#ff5a5a']], fx: [{ type: 'confetti', at: [0, 3.2, 0.8], when: 0 }], camera: cam([0.35, 1.6, 0.8], -8, 3.6, 0.0, 0.1, 48) },
  { name: '4K-3-hook-power-levels', word: 'power',
    cast: [['lion', [-1.35, -0.3], 25, 'idle', 'happy'], ['petdragon', [1.45, -0.5], -25, 'idle', 'happy'], ['maxkid', [-0.25, 0.9], 10, 'idle', 'happy'], ['nugget', [0.5, 1.6], -15, 'wag', 'happy']],
    labels: [['lion', '9,000'], ['petdragon', '50,000', '#7dff8a'], ['nugget', '0', '#ff5a5a']], camera: cam([0, 1.2, 0.2], 0, 7.4, 0.5, 0.75, 58) },
];
const scenes = SHOTS.map((p) => ({
  environment: 'suburb', envSeed: 6, lighting: 'day',
  cast: p.cast.map(([id, at, face]) => ({ id, at, face })),
  beats: [{ minDuration: 1.2, camera: [{ ...p.camera, at: 0, end: 1 }],
    actions: p.cast.map(([id, , face, action, expr]) => ({ char: id, action: action || 'idle', expr: expr || 'happy', face, at: 0, end: 1 })),
    labels: (p.labels || []).map(([char, text, color]) => ({ char, text, color, when: 0 })), fx: p.fx }],
}));
const W = 2160, H = 3840;
const sb = { title: '4k test', seed: 6, style: 'bright', scenes, characters: [...new Set(SHOTS.flatMap((p) => p.cast.map((c) => c[0])))] };
const tl = buildTimeline(sb, { width: W, height: H });
const t0 = Date.now();
const imgs = await renderStills({ timeline: tl, width: W, height: H, times: tl.scenes.map((s) => s.start + 0.7), distDir: path.join(ROOT, 'dist') });
console.log(`rendered ${imgs.length} 4K frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
imgs.forEach((buf, i) => {
  const raw = path.join(OUT, `_raw${i}.jpg`), out = path.join(OUT, `${SHOTS[i].name}.jpg`);
  fs.writeFileSync(raw, buf);
  spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-vf', `drawtext=fontfile=${FONT}:text='${SHOTS[i].word}':fontsize=${Math.round(H * 0.068)}:fontcolor=0xF2FF2E:borderw=${Math.round(H * 0.006)}:bordercolor=black:shadowx=8:shadowy=12:shadowcolor=black@0.5:x=(w-tw)/2:y=h*0.66`, '-q:v', '2', out]);
  fs.rmSync(raw);
});
console.log(fs.readdirSync(OUT));
