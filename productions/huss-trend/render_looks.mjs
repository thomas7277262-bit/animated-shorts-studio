// Look test stills for "The Trend Is Me".  node productions/huss-trend/render_looks.mjs <outDir> [width]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildTimeline } from '../../src/story/timeline.js';
import { renderStills } from '../../render/frames.js';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const OUT = path.resolve(process.argv[2] || 'output/huss-looks'); fs.mkdirSync(OUT, { recursive: true });
const W = Number(process.argv[3] || 540), H = Math.round(W * 16 / 9);
const cam = (target, a) => ({ type: 'medium', target, scale: false, from: { angle: a[0], dist: a[1], height: a[2], lookY: a[3] ?? 0, fov: a[4] ?? 50 }, to: { angle: a[0], dist: a[1], height: a[2], lookY: a[3] ?? 0, fov: a[4] ?? 50 } });
const SHOTS = [
  ['street-dance', { environment: 'trendtown' }, [['zoe', [-1.6, 0.6], 10, 'dance', 'happy'], ['leo', [1.6, 0.4], -10, 'dance', 'happy'], ['mailman', [3.4, -1.5], -20, 'dance', 'happy'], ['kai', [0, 1.6], 0, 'idle', 'neutral']], cam([0, 1.2, 0], [0, 8, 1.2, 0.3, 50])],
  ['town-hall', { environment: 'trendtown' }, [['kai', [0, 0.5], 180, 'idle', 'neutral']], cam([0, 6, -20], [0, 26, -1, 2, 50])],
  ['bus-huss', { environment: 'trendtown' }, [['kai', [-8.2, 0.6], 15, 'huss', 'laugh']], cam([-8.3, 1.3, 0.4], [10, 4.2, 0.2, 0.2, 50])],
  ['laugh', { environment: 'trendtown' }, [['leo', [-0.7, 0], 20, 'laugh', 'laugh'], ['zoe', [0.7, 0], -20, 'laugh', 'laugh']], cam([0, 1.3, 0], [0, 4, 0.2, 0.2, 50])],
  ['nana', { environment: 'trendtown' }, [['nana', [0, 0.5], 0, 'talk', 'happy', 'phone']], cam([0, 1.5, 0.5], [0, 2.6, 0.1, 0.1, 45])],
  ['court-wide', { environment: 'trendcourt', env: { cheer: true, score: '72 - 68' } }, [['kai', [-0.4, -9.0], 0, 'huss', 'laugh', null, 1.56]], cam([0, 2.5, -6], [0, 16, 2, 0.6, 50])],
  ['court-face', { environment: 'trendcourt', env: { quiet: true, score: '48 - 68' } }, [['kai', [-0.4, -9.0], 0, 'huss', 'laugh', null, 1.56]], cam([-0.4, 2.8, -9], [0, 2.4, 0.3, 0.1, 45])],
  ['feed-views', { environment: 'trendfeed', env: { screen: 'views', views: 2000000 } }, [], cam([0, 0, 0], [0, 13.9, 0, 0, 60])],
  ['feed-comments', { environment: 'trendfeed', env: { screen: 'comments', views: 40000, t0: -10 } }, [], cam([0, 0, 0], [0, 13.9, 0, 0, 60])],
  ['feed-grid', { environment: 'trendfeed', env: { screen: 'grid', t0: -10 } }, [], cam([0, 0, 0], [0, 13.9, 0, 0, 60])],
  ['feed-12', { environment: 'trendfeed', env: { screen: 'views', views: 12 } }, [], cam([0, 0, 0], [0, 13.9, 0, 0, 60])],
  ['mayor', { environment: 'trendtown' }, [['mayor', [-0.6, 0], 15, 'huss', 'laugh'], ['mailman', [0.8, 0], -15, 'huss', 'laugh']], cam([0, 1.4, 0], [0, 4.6, 0.3, 0.2, 50])],
];
const scenes = SHOTS.map(([, sc, cast, camera]) => ({ lighting: 'env', ...sc, envSeed: 9, cast: cast.map(([id, at, face]) => ({ id, at, face })),
  beats: [{ duration: 1.2, camera: [{ ...camera, at: 0, end: 1 }], actions: cast.map(([id, , face, action, expr, prop, lift]) => ({ char: id, action, expr, face, prop: prop || undefined, params: lift ? { lift } : undefined, at: 0, end: 1 })) }] }));
const sb = { title: 'looks', seed: 9, style: 'bright', scenes, characters: [...new Set(SHOTS.flatMap((s) => s[2].map((c) => c[0])))] };
const tl = buildTimeline(sb, { width: W, height: H }); tl.bloom = true;
const imgs = await renderStills({ timeline: tl, width: W, height: H, times: tl.scenes.map((s) => s.start + 0.6), distDir: path.join(ROOT, 'dist') });
const files = imgs.map((b, i) => { const f = path.join(OUT, `${String(i + 1).padStart(2, '0')}-${SHOTS[i][0]}.jpg`); fs.writeFileSync(f, b); return f; });
const n = files.length, cols = 6;
spawnSync('ffmpeg', ['-y', '-v', 'error', ...files.flatMap((f) => ['-i', f]), '-filter_complex', `${files.map((_, i) => `[${i}:v]scale=270:480[s${i}]`).join(';')};${files.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${n}:layout=${files.map((_, i) => `${(i % cols) * 270}_${Math.floor(i / cols) * 480}`).join('|')}`, path.join(OUT, 'sheet.jpg')]);
console.log('ok', n);
