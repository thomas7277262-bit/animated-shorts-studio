// Storyboard for "The Town Where the Lights Go Out at 9", timed to the real narration.
//   node productions/lights-out/storyboard_build.mjs   → storyboard.json, storyboard.preview.json, STORYBOARD.md
// Every shot starts on a spoken word (cue = [line id, word index]) and lasts until the next cue.
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const AL = JSON.parse(fs.readFileSync(path.join(HERE, 'timing/alignment.json'), 'utf8'));
const LINES = Object.fromEntries(AL.lines.map((l) => [l.id, l]));
const AUDIO_END = AL.report.audio_s;
const TAIL = 1.6;
const cueTime = ([id, wi = 0]) => { const w = LINES[id]?.words[wi]; if (!w) throw new Error(`bad cue ${id}:${wi}`); return w.start; };

const DEG = 180 / Math.PI;
// camera from a world position P looking at a world point T (optionally moving to P2/T2)
function look(P, T, fov = 50, P2 = P, T2 = T) {
  // T2 shifts where the camera looks at the end of the shot (expressed as lookY on the same target)
  const st = (p, t) => ({ angle: Math.atan2(p[0] - T[0], p[2] - T[2]) * DEG, dist: Math.hypot(p[0] - T[0], p[2] - T[2]), height: p[1] - T[1], lookY: t[1] - T[1], fov });
  return { type: 'medium', target: T, scale: false, from: st(P, T), to: st(P2, T2) };
}
// relative camera around a fixed target: [angle, dist, height, lookY, fov]
const cam = (target, a, b = a) => ({ type: 'medium', target, scale: false,
  from: { angle: a[0], dist: a[1], height: a[2], lookY: a[3] ?? 0, fov: a[4] ?? 50 },
  to: { angle: b[0], dist: b[1], height: b[2], lookY: b[3] ?? 0, fov: b[4] ?? 50 } });
const camF = (ids, focusY, a, b = a) => ({ ...cam([0, 0, 0], a, b), target: ids, focusY });

// spiral stair geometry (matches coast.js lighthouseStairs)
const STEP = (i) => { const a = i * 0.32, r = 2.3; return { x: Math.sin(a) * r, z: Math.cos(a) * r, y: 0.31 + i * 0.26, face: Math.atan2(Math.cos(a), -Math.sin(a)) * DEG, a }; };
const stairCam = (i, back = -0.75, up = 1.7, fov = 60) => {
  back = back > 0 ? -back : back; // always film from ahead on the spiral, so we see faces
  const s = STEP(i), a = s.a - back, r = 3.9;
  return look([Math.sin(a) * r, s.y + Math.max(up, 2.4), Math.cos(a) * r], [s.x, s.y + 1.3, s.z], fov);
};

const WHITE = '#ffffff', GOLD = '#ffe14a', WARM = '#ffcf6b';
const TOWN = { environment: 'harbortown', envSeed: 9, light: 'env' };
const HOME = { environment: 'house', envSeed: 4, light: 'dusk' };
const SCHOOL = { environment: 'school', envSeed: 4, light: 'day' };
const STAIRS = { environment: 'lighthouseStairs', envSeed: 9, light: 'env' };
const LAMP = { environment: 'lampRoom', envSeed: 9, light: 'env' };
const LH = [22, 1.4, -46];         // lighthouse base
const STORM = { weather: 'storm', env: { power: true, beam: 'on', sea: 0.95 } };

const S = [];
const shot = (o) => S.push(o);

// ---------------- HOOK
shot({ cue: ['L1', 0], ...TOWN, env: { power: true, beam: 'on', sea: 0.2 }, events: [['power', false, ['L1', 12]]], music: 'calm',
  note: 'The harbour town at night, every window lit… then at "nine o\'clock" every light goes out at once',
  c: [], pops: [['9:00', WARM, ['L1', 11]]],
  camera: look([-6, 16, 22], [6, 2, -8], 55, [-4, 13, 17], [6, 2, -8]) });
shot({ cue: ['L2', 0], ...TOWN, env: { power: true, beam: 'on', sea: 0.2 }, events: [['power', false, ['L2', 2]]], music: 'calm',
  note: 'Not one streetlight (a lamp clicks off over a kid)', c: [['noah', [8.6, 0.2], 0, 'lookUp', 'surprised']],
  camera: look([9.6, 1.2, 4.2], [8, 2.6, -0.9], 55) });
shot({ cue: ['L2', 3], ...TOWN, env: { power: true, beam: 'on', sea: 0.2 }, events: [['power', false, ['L2', 5]]], music: 'calm',
  note: 'Not one TV (a family window goes dark)', c: [],
  camera: look([-5.2, 1.6, -1.5], [-5.2, 1.6, -6.5], 45) });
shot({ cue: ['L2', 6], ...TOWN, env: { power: false, beam: 'on', sea: 0.2 }, music: 'calm',
  note: 'Total darkness: only the lighthouse beam sweeps over the roofs', c: [],
  camera: look([0, 9, 16], [10, 4, -20], 58, [2, 8, 13], [12, 5, -24]) });
shot({ cue: ['L3', 0], ...TOWN, env: { power: false, beam: 'on', sea: 0.2 }, music: 'calm',
  note: 'Kids walk home in the dark, counting under their breath',
  c: [['noah', [-3, 1.0], 90, 'walk', 'determined', { move: [0.5, 1.0] }], ['mia', [-4.4, 1.8], 90, 'walk', 'determined', { move: [-1.0, 1.8] }], ['zed', [2.5, 0.6], -90, 'walk', 'determined', { move: [-0.5, 0.6] }]],
  camera: cam([-0.8, 1.2, 1.2], [0, 7.5, 0.6, 0.2, 55], [0, 6.5, 0.5, 0.2, 55]) });
shot({ cue: ['L4', 0], ...TOWN, env: { power: false, beam: 'on', sea: 0.2 }, music: 'calm',
  note: 'Most kids count the big ones: 300 to the bakery…',
  c: [['mia', [-2.5, 1.2], 90, 'walk', 'happy', { move: [1.5, 1.2] }]], pops: [['300', WHITE, ['L4', 7]]],
  camera: camF(['mia'], 1.2, [-20, 4.2, 0.3, 0.2, 50], [20, 4.2, 0.3, 0.2, 50]) });
shot({ cue: ['L4', 10], ...TOWN, env: { power: false, beam: 'on', sea: 0.2 }, music: 'calm',
  note: '…600 to school', c: [['zed', [2.5, 0.8], -90, 'walk', 'happy', { move: [-1.0, 0.8] }]], pops: [['600', WHITE, ['L4', 10]]],
  camera: camF(['zed'], 1.2, [15, 4.4, 0.3, 0.2, 50]) });

// ---------------- SETUP
shot({ cue: ['L5', 0], ...TOWN, env: { power: false, beam: 'on', sea: 0.2 }, music: 'calm',
  note: 'Leo: "But I count everything."', c: [['leo', [0, 0.8], 0, 'talk', 'happy']],
  camera: cam([0, 1.75, 0.8], [0, 2.4, 0.0, 0.0, 45], [0, 2.1, 0.0, 0.0, 45]) });
shot({ cue: ['L5', 4], ...TOWN, env: { power: false, beam: 'on', sea: 0.2 }, music: 'calm',
  note: 'Stairs. Fence posts. Cracks in the sidewalk. Out loud. (numbers pop as he walks)',
  c: [['leo', [-3, 1.1], 90, 'walk', 'determined', { move: [1.6, 1.1] }]],
  pops: [['18', WHITE, ['L5', 4], { dur: 0.6 }], ['37', WHITE, ['L5', 5], { dur: 0.6 }], ['204', WHITE, ['L5', 7], { dur: 0.8 }]],
  camera: camF(['leo'], 1.0, [-25, 4.6, 0.2, 0.3, 50], [25, 4.6, 0.2, 0.3, 50]) });
shot({ cue: ['L6', 0], ...SCHOOL, music: 'calm', note: 'At school they laugh: "CALCULATOR!"',
  c: [['leo', [0, 0.6], 0, 'idle', 'sad'], ['noah', [-1.5, -0.4], 30, 'point', 'laugh'], ['mia', [1.5, -0.4], -30, 'laugh', 'laugh'], ['zed', [0.5, -1.4], -10, 'laugh', 'laugh']],
  comic: [['CALCULATOR!', '#ffd23f', ['L6', 7], [0, 3.0, 0], 0.62]],
  camera: cam([0, 1.3, -0.2], [0, 6.6, 0.3, 0.4, 52], [0, 6.0, 0.3, 0.4, 52]) });
shot({ cue: ['L7', 0], ...TOWN, env: { power: false, beam: 'on', sea: 0.2 }, music: 'calm',
  note: 'Only one light stays on after nine: the lighthouse on the rocks', c: [],
  camera: look([4, 3, 6], [20, 8, -40], 50, [8, 3, -4], [21, 8.5, -44]) });
shot({ cue: ['L7', 15], ...TOWN, env: { power: false, beam: 'on', sea: 0.25 }, music: 'calm',
  note: 'Grandpa at the lighthouse door: forty years', c: [['grandpa', [22, -43.2], 0, 'idle', 'happy', { params: { lift: 1.4 } }]],
  pops: [['40 YEARS', GOLD, ['L7', 29], { size: 0.62 }]],
  camera: look([24.5, 4.0, -36], [22, 3.4, -43.4], 50, [23.5, 3.7, -38], [22, 3.4, -43.4]) });
shot({ cue: ['L8', 0], ...TOWN, env: { power: false, beam: 'on', sea: 0.25 }, music: 'calm',
  note: 'But Grandpa\'s eyes are getting worse', c: [['grandpa', [22, -43.2], 0, 'idle', 'sad', { params: { lift: 1.4 } }]],
  camera: look([22.2, 3.45, -41.0], [22, 3.35, -43.2], 42, [22.15, 3.42, -41.5], [22, 3.35, -43.2]) });
shot({ cue: ['L8', 6], ...STAIRS, music: 'calm', note: 'He holds the rail with both hands',
  c: [['grandpa', [STEP(8).x, STEP(8).z], STEP(8).face, 'climb', 'sad', { params: { lift: STEP(8).y, speed: 0.4 } }]],
  camera: stairCam(8, 0.7, 1.0, 58) });
shot({ cue: ['L9', 0], ...STAIRS, music: 'calm', note: 'Every evening I climb with him',
  c: [['leo', [STEP(14).x, STEP(14).z], STEP(14).face, 'climb', 'happy', { params: { lift: STEP(14).y, speed: 0.5 } }],
    ['grandpa', [STEP(11).x, STEP(11).z], STEP(11).face, 'climb', 'happy', { params: { lift: STEP(11).y, speed: 0.4 } }]],
  camera: stairCam(12, 0.9, 1.4, 64) });
shot({ cue: ['L9', 7], ...STAIRS, music: 'calm', note: 'Looking up the spiral: 214 steps', c: [],
  pops: [['214', GOLD, ['L9', 10]]],
  camera: look([1.2, 1.3, 2.4], [0.0, 12, -0.6], 72, [1.2, 1.6, 2.4], [0.0, 13, -0.6]) });
shot({ cue: ['L9', 14], ...STAIRS, music: 'calm', note: 'I\'ve counted them a thousand times',
  c: [['leo', [STEP(30).x, STEP(30).z], STEP(30).face + 60, 'idle', 'laugh', { params: { lift: STEP(30).y } }]],
  camera: stairCam(30, 0.8, 1.1, 50) });
shot({ cue: ['L10', 0], ...LAMP, env: { lamp: 'off', sea: 0.3 }, music: 'calm', note: 'Up top, Grandpa shows him the old oil lamp',
  c: [['grandpa', [0.8, 1.6], 40, 'point', 'happy'], ['leo', [2.3, 1.7], -40, 'idle', 'surprised']],
  camera: cam([1.5, 1.4, 1.0], [20, 2.6, 0.3, 0.0, 62], [15, 2.3, 0.3, 0.0, 62]) });
shot({ cue: ['L10', 9], ...LAMP, env: { lamp: 'off', sea: 0.3 }, music: 'calm', note: '"If the generator ever dies… this keeps the boats safe."',
  c: [['grandpa', [0.8, 1.6], 25, 'talk', 'determined']],
  camera: cam([0.8, 2.0, 1.6], [20, 2.2, 0.05, 0.0, 45]) });
shot({ cue: ['L11', 0], ...LAMP, env: { lamp: 'off', sea: 0.3 }, music: 'calm', note: 'When I counted, Grandpa just smiled',
  c: [['grandpa', [0.9, 1.6], 50, 'idle', 'happy'], ['leo', [2.1, 1.8], -50, 'talk', 'happy']],
  camera: cam([1.5, 1.6, 1.4], [10, 2.4, 0.2, 0.0, 60]) });
shot({ cue: ['L11', 7], ...LAMP, env: { lamp: 'off', sea: 0.3 }, music: 'calm', note: '"Lighthouse keepers count too."',
  c: [['grandpa', [0.9, 1.6], 20, 'talk', 'happy']], camera: cam([0.9, 2.0, 1.6], [10, 2.0, 0.05, 0.0, 45], [8, 1.8, 0.05, 0.0, 45]) });

// ---------------- THE STORM
shot({ cue: ['L12', 0], ...TOWN, ...STORM, music: 'tense', transition: 'flash', note: 'The night of the big storm', c: [],
  camera: look([10, 6, 4], [20, 6, -40], 58, [12, 5, -2], [21, 7, -44]) });
shot({ cue: ['L13', 0], ...TOWN, ...STORM, music: 'tense', note: 'Dad\'s fishing boat still out in the waves',
  props: [{ type: 'boat', at: [-6, -96], y: -0.4, ry: -0.6, rockAmp: 0.28 }], c: [],
  camera: look([-2, 2.5, -86], [-6, 1.2, -96], 55, [-3, 2.2, -88], [-6, 1.2, -96]) });
shot({ cue: ['L13', 7], ...HOME, music: 'tense', note: 'He\'s always home before nine. Mum and Leo wait at the window',
  c: [['mum', [-0.5, -1.2], 180, 'idle', 'sad'], ['leo', [0.5, -1.0], 180, 'idle', 'sad']], pops: [['8:58', WARM, ['L13', 10], { size: 0.6 }]],
  camera: cam([0, 1.5, -1.1], [180, 3.6, 0.2, 0.1, 50], [180, 3.2, 0.2, 0.1, 50]) });
shot({ cue: ['L14', 0], ...TOWN, ...STORM, events: [['power', false, ['L14', 6]]], music: 'tense', note: 'At nine o\'clock the town went black',
  pops: [['9:00', WARM, ['L14', 1]]], c: [],
  camera: look([-4, 14, 20], [4, 2, -8], 55) });
shot({ cue: ['L15', 0], ...TOWN, ...STORM, env: { power: false, beam: 'on', sea: 0.95 }, events: [['beam', 'flicker', ['L15', 7]], ['beam', 'off', ['L15', 10]]], music: 'tense',
  note: 'The lighthouse flickered… and went out', c: [],
  camera: look([30, 4, -24], [22, 10, -46], 52, [28, 4, -28], [22, 10, -46]) });
shot({ cue: ['L16', 0], ...TOWN, ...STORM, env: { power: false, beam: 'off', sea: 1.0 }, music: 'tense', note: 'The generator was dead', c: [],
  camera: look([24, 15.5, -40], [22, 15.5, -46], 45) });
shot({ cue: ['L16', 4], ...TOWN, ...STORM, env: { power: false, beam: 'off', sea: 1.0 }, music: 'tense',
  note: 'Dad\'s boat heading straight for the rocks in the dark',
  props: [{ id: 'boat', type: 'boat', at: [4, -92], y: -0.4, ry: -1.2, rockAmp: 0.3, move: [10, -72], ease: 'linear' }], c: [],
  camera: look([13, 2.4, -66], [8, 1.0, -80], 55, [13.5, 2.4, -64], [9.5, 1.0, -74]) });
shot({ cue: ['L17', 0], ...HOME, music: 'tense', note: 'Grandpa grabs his coat but can\'t even find the door',
  c: [['grandpa', [0.3, -0.4], -60, 'feel', 'scared']], camera: cam([0.3, 1.3, -0.4], [-20, 4.0, 0.3, 0.1, 50]) });
shot({ cue: ['L17', 12], ...HOME, music: 'tense', note: '"Leo… I can\'t do the stairs."',
  c: [['grandpa', [0, 0], 0, 'talk', 'sad']], camera: cam([0, 1.95, 0], [0, 2.1, 0.05, 0.0, 45], [0, 1.9, 0.05, 0.0, 45]) });

// ---------------- THE CLIMB
shot({ cue: ['L18', 0], ...HOME, music: 'suspense', note: 'So I went.', c: [['leo', [0, 0], 0, 'idle', 'determined']],
  camera: cam([0, 1.75, 0], [0, 1.9, 0.0, 0.0, 42]) });
shot({ cue: ['L19', 0], ...TOWN, ...STORM, env: { power: false, beam: 'off', sea: 1.0 }, music: 'suspense',
  note: '612 steps from our door to the lighthouse, counting in the rain', c: [['leo', [-4, 1.2], 90, 'run', 'determined', { move: [4, 1.2] }]],
  pops: [['612', WHITE, ['L19', 3]]], camera: camF(['leo'], 1.0, [-30, 5.0, 0.4, 0.3, 52], [30, 5.0, 0.4, 0.3, 52]) });
shot({ cue: ['L19', 11], ...TOWN, ...STORM, env: { power: false, beam: 'off', sea: 1.0 }, music: 'suspense',
  note: 'Running up the stone path to the dark lighthouse', c: [['leo', [19.5, -26], 170, 'run', 'determined', { move: [21.6, -40], params: { rise: [0.4, 1.4] } }]],
  camera: look([17, 4.5, -18], [21, 5, -38], 55, [18, 4.5, -24], [22, 6, -44]) });
shot({ cue: ['L20', 0], ...STAIRS, music: 'suspense', note: 'Inside: so dark he can\'t see his own hands',
  c: [['leo', [STEP(0).x, STEP(0).z], STEP(0).face, 'feel', 'scared', { params: { lift: 0 } }]],
  camera: stairCam(0, 0.9, 1.0, 58) });
shot({ cue: ['L20', 7], ...STAIRS, music: 'suspense', note: 'But I didn\'t need to see (hand finds the rail)',
  c: [['leo', [STEP(3).x, STEP(3).z], STEP(3).face, 'climb', 'determined', { params: { lift: STEP(3).y, speed: 0.6 } }]],
  camera: stairCam(3, 0.5, 0.9, 48) });
shot({ cue: ['L21', 0], ...STAIRS, music: 'suspense', note: 'Seventy-one, the cracked step',
  c: [['leo', [STEP(15).x, STEP(15).z], STEP(15).face, 'climb', 'determined', { move: [STEP(18).x, STEP(18).z], params: { rise: [STEP(15).y, STEP(18).y] } }]],
  pops: [['71', WHITE, ['L21', 0]]], camera: stairCam(16, 0.8, 1.2, 60) });
shot({ cue: ['L21', 4], ...STAIRS, music: 'suspense', note: 'One hundred and fifty, the turn',
  c: [['leo', [STEP(34).x, STEP(34).z], STEP(34).face, 'climb', 'determined', { move: [STEP(37).x, STEP(37).z], params: { rise: [STEP(34).y, STEP(37).y] } }]],
  pops: [['150', WHITE, ['L21', 5]]], camera: look([Math.sin(STEP(35).a + 0.9) * 3.6, STEP(35).y + 4.2, Math.cos(STEP(35).a + 0.9) * 3.6], [STEP(35).x, STEP(35).y + 0.8, STEP(35).z], 62) });
shot({ cue: ['L21', 9], ...STAIRS, music: 'suspense', note: 'Two hundred and fourteen: the top',
  c: [['leo', [STEP(48).x, STEP(48).z], STEP(48).face, 'climb', 'determined', { move: [STEP(50).x, STEP(50).z], params: { rise: [STEP(48).y, STEP(50).y] } }]],
  pops: [['214', GOLD, ['L21', 12]]], camera: stairCam(49, 0.9, 1.0, 58) });
shot({ cue: ['L22', 0], ...STAIRS, music: 'suspense', note: 'The matches: third shelf, left side',
  c: [['leo', [STEP(50).x, STEP(50).z], STEP(50).face + 70, 'point', 'determined', { params: { lift: STEP(50).y } }]],
  pops: [['3RD SHELF', WHITE, ['L22', 9], { size: 0.6 }]], camera: stairCam(50, 0.7, 0.9, 50) });

// ---------------- THE LIGHT
shot({ cue: ['L23', 0], ...LAMP, env: { lamp: 'off', sea: 1.0 }, music: 'suspense', note: 'The first match blew out. So did the second.',
  c: [['leo', [1.2, 1.5], -30, 'holdMatch', 'scared', { prop: 'match', end: 0.25 }], ['leo', null, -30, 'holdMatch', 'scared', { at: 0.25, end: 0.55 }], ['leo', null, -30, 'holdMatch', 'scared', { prop: 'match', at: 0.55, end: 0.75 }], ['leo', null, -30, 'holdMatch', 'scared', { at: 0.75 }]],
  fx: [{ type: 'smoke', at: [0.95, 1.55, 1.75], cue: ['L23', 4] }, { type: 'smoke', at: [0.95, 1.55, 1.75], cue: ['L23', 8] }],
  camera: cam([1.1, 1.55, 1.6], [-20, 1.3, 0.1, 0.0, 55]) });
shot({ cue: ['L24', 0], ...LAMP, env: { lamp: 'off', sea: 1.0 }, music: 'suspense', note: 'The third one caught',
  c: [['leo', [1.2, 1.5], -30, 'holdMatch', 'determined', { prop: 'match' }]], fx: [{ type: 'sparkle', at: [0.95, 1.55, 1.75], cue: ['L24', 3] }],
  camera: cam([1.0, 1.6, 1.6], [-15, 1.6, 0.0, 0.0, 42]) });
shot({ cue: ['L24', 4], ...LAMP, env: { lamp: 'off', sea: 1.0 }, events: [['lamp', 'on', ['L24', 7]]], music: 'adventure',
  note: 'The old lamp roars to life, the giant lens blazes',
  c: [['leo', [1.3, 1.6], -40, 'idle', 'surprised', { end: 0.4 }], ['leo', null, -40, 'cheer', 'laugh', { at: 0.4 }]],
  fx: [{ type: 'sparkle', at: [0.2, 1.6, -0.6], cue: ['L24', 7] }], camera: cam([0.6, 1.5, 0.3], [12, 3.4, 0.2, 0.0, 55], [12, 5.2, 0.6, 0.2, 58]) });
shot({ cue: ['L24', 12], ...TOWN, ...STORM, env: { power: false, beam: 'on', sea: 1.0 }, music: 'adventure', note: '…and threw its light across the sea', c: [],
  camera: look([-2, 10, -10], [22, 14, -46], 55, [0, 9, -14], [22, 14, -46]) });
shot({ cue: ['L25', 0], ...TOWN, ...STORM, env: { power: false, beam: 'on', sea: 1.0 }, music: 'adventure',
  note: 'Far out, the tiny boat turns away from the rocks',
  props: [{ id: 'boat', type: 'boat', at: [10, -74], y: -0.4, ry: -1.0, rockAmp: 0.3, move: [-2, -84], spin: -1.4 }], c: [],
  camera: look([18, 3.0, -58], [8, 1.0, -74], 55, [17, 3.0, -60], [2, 1.0, -80]) });
shot({ cue: ['L25', 9], ...TOWN, ...STORM, env: { power: false, beam: 'on', sea: 1.0 }, music: 'adventure', note: 'Just in time',
  props: [{ id: 'boat', type: 'boat', at: [4, -80], y: -0.4, ry: -2.2, rockAmp: 0.25, move: [-6, -86] }], c: [],
  camera: look([2, 2.2, -68], [0, 1, -82], 50) });

// ---------------- ENDING
shot({ cue: ['L26', 0], ...TOWN, env: { power: false, beam: 'on', sea: 0.5 }, weather: 'rain', music: 'calm', note: 'Dad\'s boat reaches the harbour at 10:52',
  props: [{ id: 'boat', type: 'boat', at: [-31, -44], y: -0.4, ry: Math.PI / 2, rockAmp: 0.1, move: [-31, -30] }], c: [],
  pops: [['10:52', WARM, ['L26', 7]]], camera: look([-24, 3.5, -16], [-31, 1.2, -32], 52) });
shot({ cue: ['L26', 9], ...LAMP, env: { lamp: 'on', sea: 0.5 }, music: 'calm', note: 'I know, because I counted every minute',
  c: [['leo', [1.3, 1.6], -30, 'idle', 'happy']], camera: cam([1.3, 1.75, 1.6], [-20, 2.1, 0.0, 0.0, 45]) });
shot({ cue: ['L27', 0], ...TOWN, env: { power: false, beam: 'on', sea: 0.4 }, music: 'calm', note: 'The whole town waiting on the dock in the dark, lanterns up',
  props: [{ type: 'boat', at: [-31, -30], y: -0.4, ry: Math.PI / 2, rockAmp: 0.06 }],
  c: [['dad', [-34, -26], 0, 'wave', 'happy', { params: { lift: 0.25 } }], ['mum', [-34.6, -21], 180, 'cheer', 'laugh', { prop: 'lantern', params: { lift: 0.25 } }],
    ['noah', [-33.4, -20], 180, 'cheer', 'laugh', { prop: 'lantern', params: { lift: 0.25 } }], ['mia', [-35.2, -19], 180, 'idle', 'happy', { prop: 'lantern', params: { lift: 0.25 } }], ['zed', [-33.0, -18.5], 180, 'cheer', 'laugh', { params: { lift: 0.25 } }]],
  camera: look([-30, 3.2, -14], [-34, 1.6, -23], 55) });
shot({ cue: ['L27', 9], ...TOWN, env: { power: false, beam: 'on', sea: 0.4 }, music: 'calm', note: 'Grandpa hugged me like he\'d never let go',
  c: [['grandpa', [0.0, 0.0], 50, 'hug', 'cry'], ['leo', [0.55, 0.25], -110, 'hug', 'happy']],
  camera: cam([0.3, 1.5, 0.1], [70, 3.4, 0.2, 0.0, 48], [70, 3.0, 0.2, 0.0, 48]) });
shot({ cue: ['L28', 0], ...TOWN, env: { power: false, beam: 'on', sea: 0.6 }, weather: 'rain', music: 'calm', note: 'Now on stormy nights nobody laughs at the kid who counts',
  c: [['leo', [0, 1.0], 0, 'talk', 'happy', { prop: 'lantern' }], ['noah', [-1.3, 0.6], 20, 'talk', 'happy'], ['mia', [1.3, 0.6], -20, 'talk', 'happy'], ['zed', [0.6, -0.4], -10, 'idle', 'happy']],
  camera: cam([0, 1.4, 0.4], [0, 6.0, 0.5, 0.2, 52], [0, 5.2, 0.4, 0.2, 52]) });
shot({ cue: ['L29', 0], ...TOWN, env: { power: false, beam: 'on', sea: 0.5 }, music: 'calm', note: 'They count with me (the whole town on the seafront, the beam passing over)',
  c: [['leo', [16, -11.5], 180, 'talk', 'happy', { prop: 'lantern' }], ['grandpa', [14.8, -11.8], 180, 'talk', 'happy'], ['dad', [17.3, -11.6], 180, 'talk', 'happy'],
    ['mum', [18.4, -11.2], 180, 'talk', 'happy'], ['noah', [13.6, -11.0], 180, 'talk', 'happy', { prop: 'lantern' }], ['mia', [19.5, -11.0], 180, 'talk', 'happy'], ['zed', [12.5, -11.4], 180, 'talk', 'happy']],
  camera: look([16, 3.0, -2], [17, 4, -24], 55, [16, 4.5, 2], [18, 6, -30]) });

// ------------------------------------------------------------------ build
const starts = S.map((o) => (o.cue[0] === 'L1' && o.cue[1] === 0 ? 0 : cueTime(o.cue)));
for (let i = 1; i < starts.length; i++) if (!(starts[i] > starts[i - 1])) throw new Error(`shot ${i + 1} does not start after shot ${i}`);
const END = AUDIO_END + TAIL;
const PACE = 0.85;

const scenes = S.map((o, i) => {
  const t0 = starts[i], t1 = i + 1 < S.length ? starts[i + 1] : END, dur = t1 - t0;
  const f = (cue) => Math.min(1, Math.max(0, (cueTime(cue) - t0) / dur));
  const cast = [], actions = [];
  for (const [id, at, face, action, expr, x = {}] of o.c) {
    if (at) cast.push({ id, at, face });
    actions.push({ char: id, action, expr, face, at: x.at ?? 0, end: x.end ?? 1, move: x.move, ease: x.ease, params: x.params, prop: x.prop, glasses: false });
  }
  const props = [], propMoves = [];
  (o.props || []).forEach((p, k) => {
    const id = p.id || `p${k}`;
    props.push({ id, type: p.type, at: p.at, y: p.y, ry: p.ry, scale: p.scale, rockAmp: p.rockAmp });
    if (p.move) propMoves.push({ prop: id, to: p.move, ease: p.ease, spin: p.spin, when: 0, end: 1 });
  });
  const pops = (o.pops || []).map(([text, color, cue, x = {}]) => ({ text, color, when: f(cue), dur: x.dur ?? 1.0, y: x.y ?? 0.8, size: x.size ?? 0.8 }));
  const comic = (o.comic || []).map(([text, color, cue, at, size]) => ({ text, color, at, size, when: f(cue), dur: 1.1 }));
  const fx = (o.fx || []).map((e) => ({ type: e.type, at: e.at, when: e.cue ? f(e.cue) : e.at01 ?? 0, shake: e.shake }));
  const envEvents = (o.events || []).map(([key, value, cue]) => ({ key, value, when: f(cue) }));
  return {
    environment: o.environment, envSeed: o.envSeed, lighting: o.light, weather: o.weather || null, env: o.env, music: o.music,
    transition: o.transition || 'cut', transitionDur: o.transition === 'flash' ? 0.3 : undefined, lightning: o.weather === 'storm', lightningStart: 0.3,
    props, cast,
    beats: [{ duration: +dur.toFixed(4), camera: [{ ...o.camera, at: 0, end: 1 }], actions, pops, comic, fx, propMoves, envEvents }],
    note: o.note, cue: o.cue, t0: +t0.toFixed(3), t1: +t1.toFixed(3),
  };
});

const storyboard = {
  title: 'The Town Where the Lights Go Out at 9', seed: 9, style: 'bright', captionStyle: 'yellow', mood: 'calm',
  narration: { audio: 'productions/lights-out/audio/narration_james_215wpm.mp3', alignment: 'productions/lights-out/timing/alignment.json', offset: 0 },
  musicVolume: 0.28, sfxVolume: 0.85, voiceVolume: 1, animSpeed: PACE,
  characters: [...new Set(S.flatMap((o) => o.c.map((c) => c[0])))],
  scenes,
};
fs.writeFileSync(path.join(HERE, 'storyboard.json'), JSON.stringify(storyboard, null, 1));
const cut = scenes.findIndex((sc) => sc.cue[0] === 'L12');
fs.writeFileSync(path.join(HERE, 'storyboard.preview.json'), JSON.stringify({ ...storyboard, title: storyboard.title + ' (preview)', scenes: scenes.slice(0, cut) }, null, 1));
const md = ['# "The Town Where the Lights Go Out at 9" – Storyboard (timed to the real narration)', '',
  `Narration: James, 215 wpm, ${AUDIO_END.toFixed(2)} s · video ${END.toFixed(2)} s · ${S.length} shots · average shot ${(END / S.length).toFixed(2)} s`, '',
  '| # | Time | Set | Shot | On-screen numbers |', '|---|---|---|---|---|'];
scenes.forEach((sc, i) => md.push(`| ${i + 1} | ${sc.t0.toFixed(2)}–${sc.t1.toFixed(2)} | ${sc.environment}${sc.weather ? ' + ' + sc.weather : ''} | ${sc.note} | ${(sc.beats[0].pops || []).map((p) => `**${p.text}**`).join(' ')} |`));
fs.writeFileSync(path.join(HERE, 'STORYBOARD.md'), md.join('\n') + '\n');
console.log(`storyboard: ${S.length} shots, ${END.toFixed(2)} s, shortest ${Math.min(...scenes.map((s) => s.t1 - s.t0)).toFixed(2)} s, longest ${Math.max(...scenes.map((s) => s.t1 - s.t0)).toFixed(2)} s`);
