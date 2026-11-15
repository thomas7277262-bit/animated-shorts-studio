// Look test stills for "Sneeze Swap".  node productions/lights-out/render_looks.mjs <outDir> [width]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildTimeline } from '../../src/story/timeline.js';
import { renderStills } from '../../render/frames.js';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const OUT = path.resolve(process.argv[2] || 'output/sneeze-looks'); fs.mkdirSync(OUT, { recursive: true });
const W = Number(process.argv[3] || 540), H = Math.round(W * 16 / 9);
const cam = (target, a) => ({ type: 'medium', target, scale: false, from: { angle: a[0], dist: a[1], height: a[2], lookY: a[3] ?? 0, fov: a[4] ?? 50 }, to: { angle: a[0], dist: a[1], height: a[2], lookY: a[3] ?? 0, fov: a[4] ?? 50 } });
const SHOTS = [
  ['classroom', { environment: 'classroom', lighting: 'day' }, [['max', [0, 1.45], 180, 'sitWrite', 'sad'], ['noah', [-3.2, -1.15], 180, 'sitWrite', 'happy'], ['mia', [3.2, -1.15], 180, 'sitWrite', 'happy'], ['teacher', [3.5, -3.4], 0, 'idle', 'happy']], cam([0, 1.2, 0.8], [180, 5.5, 1.4, 0.0, 55])],
  ['pizzashop', { environment: 'pizzashop', lighting: 'day', props: [{ type: 'dough', at: [0, -0.4], y: 3.2 }] }, [['max', [0, -0.4], 0, 'toss', 'surprised']], cam([0, 1.6, -0.6], [0, 6.0, 0.6, 0.4, 55])],
  ['stadium', { environment: 'stadium', lighting: 'day', props: [{ type: 'ball', at: [0, 4], y: 1.2 }] }, [['max', [0, -0.2], 0, 'goalie', 'scared']], cam([0, 1.6, 0], [0, 9, 1.0, 0.8, 55])],
  ['zoo', { environment: 'zoo', lighting: 'day' }, [['max', [1.2, 0.5], -30, 'holdOut', 'scared', 'bucket'], ['lion', [-1.6, -0.2], 60, 'idle', 'angry']], cam([0, 1.2, 0], [0, 7.5, 0.8, 0.2, 55])],
  ['wedding', { environment: 'wedding', lighting: 'day' }, [['max', [0.6, -0.6], 0, 'holdOut', 'scared', 'ring'], ['bride', [-0.6, -0.6], 20, 'idle', 'surprised']], cam([0, 1.3, -0.6], [0, 5.2, 0.5, 0.1, 55])],
  ['downtown', { environment: 'downtown', lighting: 'day', props: [{ type: 'firetruck', at: [0, -3] }] }, [['max', [2.9, -3.5], 90, 'drive', 'scared', null, { lift: 1.0 }]], cam([2.4, 2.0, -3], [10, 6.5, 0.4, 0.0, 55])],
  ['cockpit', { environment: 'cockpit', lighting: 'day', env: { alarm: true, dive: 0.6 } }, [['max', [-0.95, 0.55], 180, 'sitPanic', 'scared']], cam([-0.95, 1.25, 0.55], [180, 1.9, 0.25, 0.0, 70])],
  ['skies', { environment: 'skies', lighting: 'day', props: [{ type: 'plane', at: [0, 0], y: 0, ry: 0.4, rz: -0.25 }] }, [], cam([0, 0, 0], [30, 38, 6, 0, 50])],
];
const scenes = SHOTS.map(([, sc, cast, camera]) => ({ ...sc, envSeed: 9, cast: cast.map(([id, at, face]) => ({ id, at, face })),
  beats: [{ duration: 1.2, camera: [{ ...camera, at: 0, end: 1 }], actions: cast.map(([id, , face, action, expr, prop, params]) => ({ char: id, action, expr, face, prop, params, at: 0, end: 1 })) }] }));
const sb = { title: 'looks', seed: 9, style: 'bright', scenes, characters: [...new Set(SHOTS.flatMap((s) => s[2].map((c) => c[0])))] };
const tl = buildTimeline(sb, { width: W, height: H }); tl.bloom = true;
const imgs = await renderStills({ timeline: tl, width: W, height: H, times: tl.scenes.map((s) => s.start + 0.6), distDir: path.join(ROOT, 'dist') });
const files = imgs.map((b, i) => { const f = path.join(OUT, `${i + 1}-${SHOTS[i][0]}.jpg`); fs.writeFileSync(f, b); return f; });
spawnSync('ffmpeg', ['-y', '-v', 'error', ...files.flatMap((f) => ['-i', f]), '-filter_complex', `${files.map((_, i) => `[${i}:v]scale=270:480[s${i}]`).join(';')};${files.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % 4) ? Array.from({ length: i % 4 }, () => 'w0').join('+') : 0}_${Math.floor(i / 4) ? 'h0' : 0}`).join('|')}`, path.join(OUT, 'sheet.jpg')]);
console.log('ok', files.length);
