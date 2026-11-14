// Preview frames of key story moments for "The Weakest Pet in the World".
//   npx vite build && node productions/weakest-pet/render_previews.mjs <outDir>
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildTimeline } from '../../src/story/timeline.js';
import { renderStills } from '../../render/frames.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const OUT = path.resolve(process.argv[2] || 'output/weakest-pet-previews');
fs.mkdirSync(OUT, { recursive: true });
const FONT = path.join(ROOT, 'assets/fonts/Fredoka-Bold.ttf');
const cam = (target, angle, dist, height, lookY = 0, fov = 50) => ({ type: 'medium', target, from: { angle, dist, height, lookY, fov }, to: { angle, dist, height, lookY, fov }, scale: false });

// each preview: one scene, one still; `word` = the caption word on screen at that moment
const P = [
  { name: '01-hook-power-levels', word: 'power', env: 'city', lighting: 'day',
    cast: [['lion', [-1.7, -1.0], 25, 'idle', 'happy'], ['petdragon', [1.9, -1.3], -25, 'idle', 'happy'], ['maxkid', [-0.3, 0.8], 10, 'idle', 'happy'], ['nugget', [0.6, 1.6], -15, 'wag', 'happy'], ['reyes', [-3.6, -2.2], 30, 'idle', 'happy'], ['owen', [3.8, -2.6], -30, 'idle', 'happy']],
    labels: [['lion', '9,000'], ['petdragon', '50,000', '#7dff8a'], ['nugget', '0', '#ff5a5a']], camera: cam([0, 1.2, -0.3], 0, 7.2, 0.3, 0.6, 58) },
  { name: '02-nugget-zero', word: 'zero', env: 'school', lighting: 'day',
    cast: [['nugget', [0, 0], 0, 'idle', 'sad']], labels: [['nugget', '0', '#ff5a5a']], pops: [['ZERO', '#ff5a5a', 1.25]], camera: cam([0, 0.45, 0.2], 0, 2.1, 0.12, 0.2, 42) },
  { name: '03-bully-tiger', word: 'twelve', env: 'school', lighting: 'day',
    cast: [['brax', [0.9, -0.2], -25, 'idle', 'smug'], ['tiger', [1.9, 0.6], -40, 'bark', 'angry'], ['maxkid', [-1.4, 0.8], 30, 'scared', 'scared'], ['nugget', [-0.6, 1.4], 30, 'shiver', 'scared']],
    labels: [['tiger', '12,000', '#ff9b3d'], ['nugget', '0', '#ff5a5a']], camera: cam([0.2, 1.1, 0.4], -12, 6.2, -0.6, 0.6, 55) },
  { name: '04-night-number-moves', word: 'moved', env: 'house', lighting: 'dusk',
    cast: [['maxkid', [-0.5, -1.0], 20, 'sit', 'surprised'], ['nugget', [0.6, -0.4], -20, 'tilt', 'surprised']],
    labels: [['nugget', '1', '#7dff8a']], camera: cam([0.1, 0.9, -0.6], 0, 3.6, 0.3, 0.2, 48) },
  { name: '05-training-88000', word: 'eighty-eight', env: 'city', lighting: 'day', props: [{ type: 'cart', at: [0.6, -0.4], ry: 1.2 }],
    cast: [['nugget', [-0.2, 0.5], 60, 'pull', 'determined'], ['maxkid', [-1.6, -0.2], 30, 'cheer', 'laugh']],
    labels: [], pops: [['88,000', '#ffe14a', 1.0]], camera: cam([-0.3, 0.7, 0.2], 10, 4.0, 0.2, 0.5, 52) },
  { name: '06-purple-sky-monster', word: 'zero', env: 'city', lighting: 'purple',
    cast: [['shadowbeast', [2, -24], -10, 'roar', 'angry'], ['lion', [-2.2, 0.4], 160, 'scared', 'scared'], ['petdragon', [2.2, 0.2], 200, 'scared', 'scared'], ['tiger', [0.3, -0.6], 180, 'scared', 'scared']],
    labels: [['lion', '0', '#ff5a5a'], ['petdragon', '0', '#ff5a5a'], ['tiger', '0', '#ff5a5a']], camera: cam([0.5, 9, -14], 0, 26, -7.5, 1, 60) },
  { name: '07-except-nugget', word: 'except', env: 'school', lighting: 'purple',
    cast: [['shadowbeast', [0.5, -20], 0, 'roar', 'angry'], ['nugget', [0, 1.5], 180, 'idle', 'determined'], ['maxkid', [-1.4, 3.2], 180, 'scared', 'scared'], ['brax', [1.5, 3.0], 180, 'scared', 'scared']],
    labels: [['nugget', '0', '#ff5a5a']], camera: cam([0, 5, -4], 0, 13, -4.2, 1.5, 60) },
  { name: '08-golden-giant', word: 'billion', env: 'city', lighting: 'purple',
    cast: [['nuggetGold', [-1, -8], 15, 'idle', 'determined'], ['shadowbeast', [6, -24], -30, 'scared', 'scared']],
    labels: [['nuggetGold', '9,999,999,999', '#ffe14a']], pops: [], camera: cam([-1, 6, -8], 8, 20, -5.5, 2, 62) },
  { name: '09-ending-glitch', word: 'glitching', env: 'city', lighting: 'sunset',
    cast: [['nugget', [-0.3, 0.6], 15, 'lie', 'sleepy'], ['maxkid', [-0.9, -0.3], 20, 'idle', 'happy'], ['tiger', [1.0, -0.3], -30, 'idle', 'surprised'], ['brax', [1.9, -1.2], -20, 'idle', 'sad']],
    labels: [['tiger', '12,000', '#ff9b3d']], camera: cam([0.2, 0.9, 0], 0, 4.4, 0.1, 0.4, 52) },
];

for (const p of P) if (p.env === 'city') {
  const dx = 0;
  p.cast = p.cast.map(([id, at, ...r]) => [id, [at[0] + dx, at[1]], ...r]);
  p.camera.target = [p.camera.target[0] + dx, p.camera.target[1], p.camera.target[2]];
  if (p.props) p.props = p.props.map((q) => ({ ...q, at: [q.at[0] + dx, q.at[1]] }));
}
const scenes = P.map((p) => ({
  environment: p.env, envSeed: 4, envOptions: p.env === 'city' ? { clearStage: true } : undefined, lighting: p.lighting, props: p.props,
  cast: p.cast.map(([id, at, face]) => ({ id, at, face })),
  beats: [{
    minDuration: 1, camera: [{ ...p.camera, at: 0, end: 1 }],
    actions: p.cast.map(([id, , face, action, expr]) => ({ char: id, action, expr, face, at: 0, end: 1, glasses: false })),
    labels: (p.labels || []).map(([char, text, color]) => ({ char, text, color, when: 0 })),
    pops: (p.pops || []).map(([text, color, y]) => ({ text, color, y: y ?? 0.75, when: 0.1, dur: 2 })),
  }],
}));
const sb = { title: 'previews', seed: 4, scenes, characters: [...new Set(P.flatMap((p) => p.cast.map((c) => c[0])))] };
const W = 1080, H = 1920;
const tl = buildTimeline(sb, { width: W, height: H });
const imgs = await renderStills({ timeline: tl, width: W, height: H, times: tl.scenes.map((s) => s.start + 0.5), distDir: path.join(ROOT, 'dist') });
const files = [];
imgs.forEach((buf, i) => {
  const raw = path.join(OUT, `_${P[i].name}.jpg`), out = path.join(OUT, `${P[i].name}.jpg`);
  fs.writeFileSync(raw, buf);
  // burn the caption exactly like the sample videos: one yellow word, black outline, lower-middle
  const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-vf',
    `drawtext=fontfile=${FONT}:text='${P[i].word}':fontsize=${Math.round(H * 0.068)}:fontcolor=0xF2FF2E:borderw=${Math.round(H * 0.006)}:bordercolor=black:shadowx=4:shadowy=6:shadowcolor=black@0.5:x=(w-tw)/2:y=h*0.66`, '-q:v', '2', out]);
  if (r.status !== 0) throw new Error(r.stderr.toString());
  fs.rmSync(raw); files.push(out);
});
// contact sheet
spawnSync('ffmpeg', ['-y', '-v', 'error', ...files.flatMap((f) => ['-i', f]), '-filter_complex',
  `${files.map((_, i) => `[${i}:v]scale=360:640[s${i}]`).join(';')};${files.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % 3) ? Array.from({ length: i % 3 }, () => 'w0').join('+') : 0}_${Math.floor(i / 3) ? Array.from({ length: Math.floor(i / 3) }, () => 'h0').join('+') : 0}`).join('|')}`,
  path.join(OUT, '00-contact-sheet.jpg')]);
console.log('previews:', fs.readdirSync(OUT));
