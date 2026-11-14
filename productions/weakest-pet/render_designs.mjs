// Character design sheets for "The Weakest Pet in the World", rendered with the real engine.
//   npx vite build && node productions/weakest-pet/render_designs.mjs <outDir>
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildTimeline } from '../../src/story/timeline.js';
import { CHARACTER_LIBRARY } from '../../src/story/characters.js';
import { renderStills } from '../../render/frames.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const OUT = path.resolve(process.argv[2] || 'output/weakest-pet-designs');
fs.mkdirSync(OUT, { recursive: true });
const distDir = path.join(ROOT, 'dist');
const FONT = path.join(ROOT, 'assets/fonts/Fredoka-Bold.ttf');

const H = (id) => { const s = CHARACTER_LIBRARY[id]; return s.kind === 'animal' ? 1.0 * (s.scale || 1) : 2.3 * (s.height || 1); };
const cam = (target, dist, height = 0.1, fov = 36, angle = 0) => ({ type: 'medium', target, from: { angle, dist, height, lookY: 0, fov }, to: { angle, dist, height, lookY: 0, fov }, scale: false });

function scene({ env = 'studio', lighting, cast, camera, labels, pops, actions }) {
  return {
    environment: env, envSeed: 1, lighting,
    cast: cast.map((c) => ({ id: c.id, at: c.at || [0, 0], face: c.face ?? 0 })),
    beats: [{ minDuration: 1, camera: [{ ...camera, at: 0, end: 1 }], labels, pops,
      actions: actions || cast.map((c) => ({ char: c.id, action: c.action || 'idle', expr: c.expr || 'happy', at: 0, end: 1, face: c.face ?? 0 })) }],
  };
}
async function stills(scenes, width, height) {
  const sb = { title: 'designs', seed: 3, scenes, characters: [...new Set(scenes.flatMap((s) => s.cast.map((c) => c.id)))] };
  const tl = buildTimeline(sb, { width, height });
  tl.bloom = scenes.some((s) => s.lighting === 'purple'); // glow only for the night shot
  return renderStills({ timeline: tl, width, height, times: tl.scenes.map((s) => s.start + 0.6), distDir });
}
function tile(files, cols, out, label) {
  const n = files.length;
  const layout = files.map((_, i) => `${(i % cols) ? Array.from({ length: i % cols }, (_, j) => `w${j}`).join('+') : 0}_${Math.floor(i / cols) ? Array.from({ length: Math.floor(i / cols) }, (_, j) => `h${j * cols}`).join('+') : 0}`).join('|');
  const lab = label ? `,pad=iw:ih+70:0:70:white,drawtext=fontfile=${FONT}:text='${label}':x=24:y=18:fontsize=40:fontcolor=0x222222` : '';
  const filter = n === 1 ? `[0:v]null${lab}` : `${files.map((_, i) => `[${i}:v]`).join('')}xstack=inputs=${n}:layout=${layout}:fill=white${lab}`;
  const r = spawnSync('ffmpeg', ['-y', '-v', 'error', ...files.flatMap((f) => ['-i', f]), '-filter_complex', filter, out]);
  if (r.status !== 0) throw new Error(r.stderr.toString());
}
const save = (b, n) => { const f = path.join(OUT, n); fs.writeFileSync(f, b); return f; };

// 1) Line-up: Max + Nugget, Brax + tiger, other kids' pets, each with its power level
{
  const cast = [
    { id: 'lion', at: [-4.6, -0.6], face: 25 }, { id: 'maxkid', at: [-1.9, 0.4], face: 10 }, { id: 'nugget', at: [-0.9, 1.0], face: -10, action: 'wag' },
    { id: 'brax', at: [1.4, 0.3], face: -15, expr: 'smug' }, { id: 'tiger', at: [3.0, 0.7], face: -30, expr: 'angry' }, { id: 'petdragon', at: [5.4, -0.6], face: -30 },
  ];
  const labels = [
    { char: 'lion', text: '9,000', when: 0 }, { char: 'nugget', text: '0', color: '#ff5a5a', when: 0 },
    { char: 'tiger', text: '12,000', color: '#ff9b3d', when: 0 }, { char: 'petdragon', text: '50,000', color: '#7dff8a', when: 0 },
  ];
  const [img] = await stills([scene({ cast, labels, camera: cam([0.4, 1.3, 0], 13.5, 0.8, 36) })], 2560, 1280);
  save(img, '1-lineup.jpg');
}
// 2) Turnarounds for the main cast
{
  const rows = [];
  for (const id of ['maxkid', 'brax', 'nugget', 'tiger']) {
    const h = H(id);
    const imgs = await stills([0, 40, 90, 180].map((a) => scene({ cast: [{ id, face: a, expr: id === 'brax' ? 'smug' : 'happy' }], camera: cam([0, h * 0.5, 0], h * 2.4 + 0.8, 0.1, 36) })), 540, 760);
    const fsx = imgs.map((b, i) => save(b, `_t-${id}-${i}.jpg`));
    const row = path.join(OUT, `_trow-${id}.jpg`);
    tile(fsx, 4, row, `${CHARACTER_LIBRARY[id].name} · front / three-quarter / side / back`);
    rows.push(row);
  }
  tile(rows, 1, path.join(OUT, '2-turnarounds.jpg'));
}
// 3) Expressions: Nugget, Max, Brax
{
  const sets = { nugget: ['neutral', 'happy', 'sad', 'cry', 'determined', 'surprised'], maxkid: ['happy', 'sad', 'surprised', 'determined', 'scared', 'laugh'], brax: ['smug', 'laugh', 'angry', 'scared', 'sad', 'surprised'] };
  const rows = [];
  for (const [id, exprs] of Object.entries(sets)) {
    const s = CHARACTER_LIBRARY[id], h = H(id);
    const y = s.kind === 'animal' ? h * 0.72 : h - 0.3 * (s.height || 1);
    const z = s.kind === 'animal' ? 0.35 * (s.scale || 1) : 0;
    const d = s.kind === 'animal' ? 1.0 * (s.scale || 1) + 0.3 : 1.55;
    const imgs = await stills(exprs.map((e) => scene({ cast: [{ id, expr: e }], camera: cam([0, y, z], d, 0.02, 34) })), 420, 420);
    const fsx = imgs.map((b, i) => save(b, `_e-${id}-${i}.jpg`));
    const row = path.join(OUT, `_erow-${id}.jpg`);
    tile(fsx, 6, row, `${s.name} · ${exprs.join(' / ')}`);
    rows.push(row);
  }
  tile(rows, 1, path.join(OUT, '3-expressions.jpg'));
}
// 4) Giant forms: Golden Nugget vs the Shadow Monster (scale reference with Max)
{
  const cast = [{ id: 'shadowbeast', at: [5, -14], face: -20, action: 'roar', expr: 'angry' }, { id: 'nuggetGold', at: [-4, -6], face: 25, action: 'idle', expr: 'determined' }, { id: 'maxkid', at: [-1, 4], face: 180, expr: 'surprised' }];
  const [img] = await stills([scene({ env: 'city', lighting: 'purple', cast, camera: cam([0, 11, -9], 42, -9, 58), labels: [{ char: 'nuggetGold', text: '9,999,999,999', when: 0 }] })], 1080, 1920);
  save(img, '4-giant-forms.jpg');
}
for (const f of fs.readdirSync(OUT)) if (f.startsWith('_')) fs.rmSync(path.join(OUT, f));
console.log('designs:', fs.readdirSync(OUT));
