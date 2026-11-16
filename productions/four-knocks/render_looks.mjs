// Look test stills for "Four Knocks".  node productions/lights-out/render_looks.mjs <outDir> [width]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildTimeline } from '../../src/story/timeline.js';
import { renderStills } from '../../render/frames.js';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const OUT = path.resolve(process.argv[2] || 'output/knock-looks'); fs.mkdirSync(OUT, { recursive: true });
const W = Number(process.argv[3] || 540), H = Math.round(W * 16 / 9);
const cam = (target, a) => ({ type: 'medium', target, scale: false, from: { angle: a[0], dist: a[1], height: a[2], lookY: a[3] ?? 0, fov: a[4] ?? 50 }, to: { angle: a[0], dist: a[1], height: a[2], lookY: a[3] ?? 0, fov: a[4] ?? 50 } });
const B = [24, 0];
const SHOTS = [
  ['street', { environment: 'nightstreet', lighting: 'env', env: { power: true } }, [], cam([0, 3, -6], [0, 18, 3, 0, 55])],
  ['street-off', { environment: 'nightstreet', lighting: 'env', env: { power: false } }, [], cam([0, 3, -6], [0, 18, 3, 0, 55])],
  ['door', { environment: 'knockhouse', lighting: 'env', env: { visitor: true } }, [['ben', [0.4, 1.6], 180, 'scared', 'scared']], cam([0, 1.8, -2.5], [10, 6.5, 0.6, 0, 50])],
  ['door-close', { environment: 'knockhouse', lighting: 'env', env: { visitor: true } }, [], cam([0.3, 1.7, -3.9], [0, 2.2, 0.1, 0, 50])],
  ['bedroom', { environment: 'knockhouse', lighting: 'env', env: { eyes: true, phone: true } }, [['ben', [B[0] - 1.4, B[1] + 0.4], 160, 'idle', 'scared', 'phone']], cam([B[0], 1.8, B[1] - 1.5], [0, 7.5, 1.0, 0.2, 55])],
  ['closet', { environment: 'knockhouse', lighting: 'env', env: { eyes: true } }, [], cam([B[0] + 0.6, 2.4, B[1] - 3.3], [0, 2.4, 0.0, 0, 50])],
  ['grandma', { environment: 'grandmaroom', lighting: 'env' }, [['grandma', [-0.6, -0.4], 30, 'talk', 'sad'], ['ben', [0.8, 0.0], -40, 'idle', 'surprised']], cam([0, 1.5, -0.4], [0, 5.5, 0.4, 0.1, 52])],
  ['mum-phone', { environment: 'grandmaroom', lighting: 'env' }, [['mum', [0.5, -0.5], 0, 'talk', 'happy', 'phone'], ['grandma', [-1.4, -1.2], 20, 'idle', 'happy']], cam([0, 1.6, -0.5], [0, 5.0, 0.3, 0.1, 52])],
];
const scenes = SHOTS.map(([, sc, cast, camera]) => ({ ...sc, envSeed: 9, cast: cast.map(([id, at, face]) => ({ id, at, face })),
  beats: [{ duration: 1.2, camera: [{ ...camera, at: 0, end: 1 }], actions: cast.map(([id, , face, action, expr, prop]) => ({ char: id, action, expr, face, prop, at: 0, end: 1 })) }] }));
const sb = { title: 'looks', seed: 9, style: 'bright', scenes, characters: [...new Set(SHOTS.flatMap((s) => s[2].map((c) => c[0])))] };
const tl = buildTimeline(sb, { width: W, height: H }); tl.bloom = true;
const imgs = await renderStills({ timeline: tl, width: W, height: H, times: tl.scenes.map((s) => s.start + 0.6), distDir: path.join(ROOT, 'dist') });
const files = imgs.map((b, i) => { const f = path.join(OUT, `${i + 1}-${SHOTS[i][0]}.jpg`); fs.writeFileSync(f, b); return f; });
spawnSync('ffmpeg', ['-y', '-v', 'error', ...files.flatMap((f) => ['-i', f]), '-filter_complex', `${files.map((_, i) => `[${i}:v]scale=270:480[s${i}]`).join(';')};${files.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % 4) ? Array.from({ length: i % 4 }, () => 'w0').join('+') : 0}_${Math.floor(i / 4) ? 'h0' : 0}`).join('|')}`, path.join(OUT, 'sheet.jpg')]);
console.log('ok', files.length);
