// Look test stills for "Lights Out at 9".  node productions/lights-out/render_looks.mjs <outDir> [width]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildTimeline } from '../../src/story/timeline.js';
import { renderStills } from '../../render/frames.js';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const OUT = path.resolve(process.argv[2] || 'output/lights-looks'); fs.mkdirSync(OUT, { recursive: true });
const W = Number(process.argv[3] || 540), H = Math.round(W * 16 / 9);
const cam = (target, a) => ({ type: 'medium', target, scale: false, from: { angle: a[0], dist: a[1], height: a[2], lookY: a[3] ?? 0, fov: a[4] ?? 50 }, to: { angle: a[0], dist: a[1], height: a[2], lookY: a[3] ?? 0, fov: a[4] ?? 50 } });
const SHOTS = [
  ['town-power-on', { environment: 'harbortown', lighting: 'env', env: { power: true, beam: 'on', sea: 0.2 } }, [['leo', [0, 1], 0, 'idle', 'happy'], ['noah', [-1.4, 0.6], 10, 'idle', 'happy'], ['mia', [1.4, 0.5], -10, 'idle', 'happy']], cam([2, 3, -6], [-10, 22, 6, 0, 55])],
  ['town-power-off', { environment: 'harbortown', lighting: 'env', env: { power: false, beam: 'on', sea: 0.2 } }, [['leo', [0, 1], 0, 'walk', 'determined']], cam([2, 3, -6], [-10, 22, 6, 0, 55])],
  ['lineup', { environment: 'harbortown', lighting: 'env', env: { power: true, beam: 'on' } }, [['grandpa', [-1.3, 0.5], 15, 'idle', 'happy'], ['leo', [0, 0.9], 0, 'idle', 'happy'], ['dad', [1.4, 0.5], -15, 'idle', 'happy'], ['mum', [2.6, 0.2], -20, 'idle', 'happy']], cam([0.6, 1.2, 0.5], [0, 7, 0.4, 0.2, 50])],
  ['lighthouse-storm', { environment: 'harbortown', lighting: 'env', weather: 'rain', env: { power: false, beam: 'on', sea: 0.9 } }, [], cam([22, 8, -46], [-20, 40, -2, 2, 55])],
  ['boat-near-rocks', { environment: 'harbortown', lighting: 'env', weather: 'rain', env: { power: false, beam: 'off', sea: 1.0 }, props: [{ type: 'boat', at: [14, -66], y: -0.4, ry: 0.4 }] }, [], cam([14, 1, -66], [30, 14, 2, 0.5, 55])],
  ['stairs-dark', { environment: 'lighthouseStairs', lighting: 'env' }, [['leo', [1.6, 0.2], -90, 'walk', 'determined']], cam([0.5, 1.8, 0.5], [40, 2.4, 0.8, 0.5, 70])],
  ['lamp-room-lit', { environment: 'lampRoom', lighting: 'env', env: { lamp: 'on', sea: 0.9 } }, [['leo', [1.2, 1.4], -30, 'cheer', 'laugh']], cam([0.4, 1.5, 0], [10, 5.0, 0.3, 0.2, 55])],
  ['grandpa-close', { environment: 'house', lighting: 'night' }, [['grandpa', [0, 0], 0, 'idle', 'sad']], cam([0, 1.95, 0], [0, 2.2, 0.05, 0, 45])],
];
const scenes = SHOTS.map(([, sc, cast, camera]) => ({ ...sc, envSeed: 9, cast: cast.map(([id, at, face]) => ({ id, at, face })),
  beats: [{ duration: 1.2, camera: [{ ...camera, at: 0, end: 1 }], actions: cast.map(([id, , face, action, expr]) => ({ char: id, action, expr, face, at: 0, end: 1 })) }] }));
const sb = { title: 'looks', seed: 9, style: 'bright', scenes, characters: [...new Set(SHOTS.flatMap((s) => s[2].map((c) => c[0])))] };
const tl = buildTimeline(sb, { width: W, height: H }); tl.bloom = true;
const imgs = await renderStills({ timeline: tl, width: W, height: H, times: tl.scenes.map((s) => s.start + 0.6), distDir: path.join(ROOT, 'dist') });
const files = imgs.map((b, i) => { const f = path.join(OUT, `${i + 1}-${SHOTS[i][0]}.jpg`); fs.writeFileSync(f, b); return f; });
spawnSync('ffmpeg', ['-y', '-v', 'error', ...files.flatMap((f) => ['-i', f]), '-filter_complex', `${files.map((_, i) => `[${i}:v]scale=270:480[s${i}]`).join(';')};${files.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % 4) ? Array.from({ length: i % 4 }, () => 'w0').join('+') : 0}_${Math.floor(i / 4) ? 'h0' : 0}`).join('|')}`, path.join(OUT, 'sheet.jpg')]);
console.log('ok', files.length);
