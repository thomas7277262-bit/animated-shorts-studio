// Renders character reference sheets for "Patch, the Dog Nobody Picked" using
// the real 3D engine (so the sheets show exactly what the video will use).
//   npx vite build && node productions/patch/render_sheets.mjs <outDir>
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildTimeline } from '../../src/story/timeline.js';
import { CHARACTER_LIBRARY } from '../../src/story/characters.js';
import { renderStills } from '../../render/frames.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const OUT = path.resolve(process.argv[2] || 'output/patch-sheets');
fs.mkdirSync(OUT, { recursive: true });
const distDir = path.join(ROOT, 'dist');

const HUMANS = ['owen', 'reyes', 'vivian', 'preston'];
const DOGS = ['patch', 'duchess'];
const ALL = ['reyes', 'owen', 'patch', 'duchess', 'vivian', 'preston'];

// approximate standing heights (world units) for framing
const H = (id) => {
  const s = CHARACTER_LIBRARY[id];
  if (s.kind === 'animal') return 1.2 * (s.scale || 1);
  return 2.3 * (s.height || 1);
};

/** One scene = one still. */
function scene({ cast, action = 'idle', expr = 'neutral', face = 0, camera, actions }) {
  return {
    environment: 'studio', envSeed: 1,
    cast: cast.map((c) => ({ id: c.id, at: c.at || [0, 0], face: c.face ?? face })),
    beats: [{ minDuration: 1, camera: [{ ...camera, at: 0, end: 1 }], actions: actions || cast.map((c) => ({ char: c.id, action: c.action || action, expr: c.expr || expr, at: 0, end: 1, face: c.face ?? face, params: c.params })) }],
  };
}
const full = (id, angle = 0) => {
  const h = H(id);
  return { type: 'medium', target: [0, h * 0.5, 0], from: { angle, dist: h * 2.35 + 0.6, height: 0.1, lookY: 0, fov: 38 }, to: { angle, dist: h * 2.35 + 0.6, height: 0.1, lookY: 0, fov: 38 }, scale: false };
};
const face = (id) => {
  const s = CHARACTER_LIBRARY[id], h = H(id);
  const y = s.kind === 'animal' ? h * 0.78 : h - 0.3 * (s.height || 1);
  const z = s.kind === 'animal' ? 0.45 * (s.scale || 1) : 0;
  const d = s.kind === 'animal' ? 1.15 * (s.scale || 1) + 0.25 : 1.55;
  return { type: 'medium', target: [0, y, z], from: { angle: 0, dist: d, height: 0.02, lookY: 0, fov: 34 }, to: { angle: 0, dist: d, height: 0.02, lookY: 0, fov: 34 }, scale: false };
};

async function stills(scenes, width, height, name) {
  const sb = { title: name, seed: 3, scenes, characters: [...new Set(scenes.flatMap((s) => s.cast.map((c) => c.id)))] };
  const tl = buildTimeline(sb, { width, height });
  tl.bloom = false;
  const times = tl.scenes.map((s) => s.start + 0.6);
  return renderStills({ timeline: tl, width, height, times, distDir });
}

function tile(files, cols, out, label) {
  const inputs = files.flatMap((f) => ['-i', f]);
  const n = files.length, rows = Math.ceil(n / cols);
  const layout = files.map((_, i) => `${(i % cols) ? Array.from({ length: i % cols }, (_, j) => `w${j}`).join('+') : 0}_${Math.floor(i / cols) ? Array.from({ length: Math.floor(i / cols) }, (_, j) => `h${j * cols}`).join('+') : 0}`).join('|');
  const filter = `${files.map((_, i) => `[${i}:v]`).join('')}xstack=inputs=${n}:layout=${layout}:fill=white${label ? `,pad=iw:ih+70:0:70:white,drawtext=fontfile=${path.join(ROOT, 'assets/fonts/Fredoka-Bold.ttf')}:text='${label}':x=24:y=18:fontsize=40:fontcolor=0x222222` : ''}`;
  const r = spawnSync('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', filter, out]);
  if (r.status !== 0) throw new Error(r.stderr.toString());
}

function save(buf, name) { const f = path.join(OUT, name); fs.writeFileSync(f, buf); return f; }

// 1) Line-up (landscape)
{
  const xs = [-4.6, -2.6, -0.8, 0.8, 2.6, 4.7];
  const cast = ALL.map((id, i) => ({ id, at: [xs[i], id === 'patch' || id === 'duchess' ? 0.6 : 0], face: id === 'patch' ? 20 : id === 'duchess' ? -15 : 0, action: id === 'patch' ? 'wag' : 'idle', expr: id === 'vivian' ? 'smug' : 'happy' }));
  const [img] = await stills([scene({ cast, camera: { type: 'medium', target: [0.1, 1.15, 0], from: { angle: 0, dist: 12.5, height: 0.6, lookY: 0, fov: 34 }, to: { angle: 0, dist: 12.5, height: 0.6, lookY: 0, fov: 34 }, scale: false } })], 2560, 1280, 'lineup');
  save(img, '1-lineup.jpg');
}

// 2) Turnarounds: front, three-quarter, side, back
{
  const files = [];
  for (const id of [...HUMANS, ...DOGS]) {
    const angles = [0, -40, -90, 180];
    const imgs = await stills(angles.map((a) => scene({ cast: [{ id }], face: -a, action: CHARACTER_LIBRARY[id].kind === 'animal' ? 'idle' : 'idle', camera: full(id, 0) })), 540, 800, id);
    const fs4 = imgs.map((b, i) => save(b, `_turn-${id}-${i}.jpg`));
    const row = path.join(OUT, `_turnrow-${id}.jpg`);
    tile(fs4, 4, row, `${CHARACTER_LIBRARY[id].name}  ·  front / three-quarter / side / back`);
    files.push(row);
  }
  tile(files.slice(0, 3), 1, path.join(OUT, '2-turnarounds-a.jpg'));
  tile(files.slice(3), 1, path.join(OUT, '3-turnarounds-b.jpg'));
}

// 3) Expressions (face close-ups)
{
  const sets = {
    owen: ['neutral', 'sad', 'cry', 'happy', 'surprised', 'laugh'],
    reyes: ['neutral', 'happy', 'sad', 'surprised', 'love', 'laugh'],
    vivian: ['smug', 'smug', 'laugh', 'surprised', 'sad', 'cry'],
    patch: ['neutral', 'happy', 'sad', 'cry', 'determined', 'love'],
    duchess: ['neutral', 'happy', 'scared', 'cry', 'surprised', 'love'],
  };
  const rows = [];
  for (const [id, exprs] of Object.entries(sets)) {
    const sceneList = exprs.map((e, i) => scene({ cast: [{ id }], camera: face(id), actions: [{ char: id, action: 'idle', expr: e, at: 0, end: 1, face: 0, glasses: id === 'vivian' ? i === 0 : undefined }] }));
    // Mrs. V's sunglasses hide her eyes, so show one expression with them on and the rest pushed up (shot uses face close-up only)
    const imgs = await stills(sceneList, 420, 420, id + '-expr');
    const files = imgs.map((b, i) => save(b, `_expr-${id}-${i}.jpg`));
    const row = path.join(OUT, `_exprrow-${id}.jpg`);
    tile(files, 6, row, `${CHARACTER_LIBRARY[id].name}  ·  ${exprs.join(' / ')}`);
    rows.push(row);
  }
  tile(rows, 1, path.join(OUT, '4-expressions.jpg'));
}

// 4) Patch & Duchess poses (three-legged walk/run cycle, sit, lie, sad, bark, wag, pull, shiver)
{
  const poses = [
    ['patch', 'idle'], ['patch', 'wag'], ['patch', 'walk'], ['patch', 'run'], ['patch', 'sit'],
    ['patch', 'sad'], ['patch', 'bark'], ['patch', 'pull'], ['duchess', 'shiver'], ['duchess', 'wag'],
  ];
  const imgs = await stills(poses.map(([id, a]) => scene({ cast: [{ id, action: a, expr: a === 'sad' ? 'cry' : a === 'bark' || a === 'pull' ? 'determined' : a === 'shiver' ? 'scared' : 'happy', face: -55 }], camera: full(id, 0) })), 480, 480, 'poses');
  const files = imgs.map((b, i) => save(b, `_pose-${i}.jpg`));
  tile(files, 5, path.join(OUT, '5-dog-poses.jpg'), 'Patch: idle/wag/walk/run/sit/sad/bark/pull · Duchess: shiver/wag');
}

for (const f of fs.readdirSync(OUT)) if (f.startsWith('_')) fs.rmSync(path.join(OUT, f));
console.log('sheets in', OUT, fs.readdirSync(OUT));
