// Builds the full storyboard for "The Weakest Pet in the World", timed to the
// real narration (timing/alignment.json, forced alignment of the 240 wpm James take).
//   node productions/weakest-pet/storyboard_build.mjs
// Writes storyboard.json (render input) and STORYBOARD.md (readable shot list).
//
// Every shot starts on a spoken word (cue = [line id, word index]) and lasts until
// the next shot's cue, so cuts land exactly on the narration.
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const AL = JSON.parse(fs.readFileSync(path.join(HERE, 'timing/alignment.json'), 'utf8'));
const LINES = Object.fromEntries(AL.lines.map((l) => [l.id, l]));
const AUDIO_END = AL.report.audio_s;
const TAIL = 1.2; // hold after the last word, then fade out

const cueTime = ([id, wi = 0]) => {
  const l = LINES[id]; if (!l) throw new Error('no line ' + id);
  const w = l.words[wi]; if (!w) throw new Error(`no word ${wi} in ${id}`);
  return w.start;
};

// camera: static, or moving from a -> b (each: [angle, dist, height, lookY, fov])
const cam = (target, a, b = a) => ({ type: 'medium', target, scale: false,
  from: { angle: a[0], dist: a[1], height: a[2], lookY: a[3] ?? 0, fov: a[4] ?? 50 },
  to: { angle: b[0], dist: b[1], height: b[2], lookY: b[3] ?? 0, fov: b[4] ?? 50 } });

// camera that follows characters (ids) at a fixed focus height
const camF = (ids, focusY, a, b = a) => ({ ...cam([0, 0, 0], a, b), target: ids, focusY });

// colours for power numbers
const RED = '#ff5a5a', GOLD = '#ffe14a', GREEN = '#7dff8a', ORANGE = '#ff9b3d', WHITE = '#ffffff';

// locations (one seed each so a set is built once and reused)
const STREET = { environment: 'suburb', envSeed: 6 };
const SCHOOL = { environment: 'school', envSeed: 4 };
const ROOM = { environment: 'house', envSeed: 4 };

// ------------------------------------------------------------------ shots
// c: [id, [x,z], face, action, expr, extra]   extra: {move:[x,z], ease, params, prop, at, end}
// labels: [id, text, color, {from: cue, to: cue, glitch: [...]}]
// pops:   [text, color, cue, {y, dur, size}]
// fx:     {type, at, cue, shake}
const S = [];
const shot = (o) => S.push(o);

// ---------------- HOOK
shot({ cue: ['L1', 0], ...STREET, light: 'day', note: 'Aerial: the bright town, kids walking their pets',
  c: [['maxkid', [-1.2, -0.2], 90, 'walk', 'happy', { move: [1.5, -0.2] }], ['nugget', [-0.3, 0.1], 90, 'walk', 'happy', { move: [2.4, 0.1] }],
    ['reyes', [3.5, -9.0], -90, 'walk', 'happy', { move: [0.5, -9.0] }], ['lion', [5.2, -8.9], -90, 'walk', 'happy', { move: [2.2, -8.9] }],
    ['brax', [-6, -0.4], 90, 'walk', 'smug', { move: [-3.4, -0.4] }], ['tiger', [-4.6, -0.2], 90, 'walk', 'angry', { move: [-2.0, -0.2] }],
    ['owen', [8, -3.4], -90, 'idle', 'happy'], ['petdragon', [9.5, -3.6], -90, 'idle', 'happy']],
  camera: cam([2, 0, -6], [-28, 30, 19, 0, 55], [-22, 24, 14, 0, 55]) });
shot({ cue: ['L1', 7], ...STREET, light: 'day', note: 'Every pet has a number floating above its head',
  c: [['reyes', [-2.6, -0.6], 15, 'idle', 'happy'], ['lion', [-1.3, 0.2], 20, 'idle', 'happy'], ['owen', [1.1, -0.8], -10, 'idle', 'happy'],
    ['petdragon', [2.3, 0.0], -25, 'wag', 'happy'], ['mia', [0.0, -1.6], 0, 'wave', 'happy'], ['puppy', [0.4, 0.9], 0, 'wag', 'happy']],
  labels: [['lion', '9,000'], ['petdragon', '50,000', GREEN], ['puppy', '800', WHITE]],
  camera: cam([0, 1.3, -0.3], [0, 8.6, 0.6, 0.7, 55], [0, 7.6, 0.4, 0.7, 55]) });
shot({ cue: ['L1', 10], ...STREET, light: 'day', note: 'Low angle: the number glowing over the lion',
  c: [['lion', [0, 0], 15, 'idle', 'happy']], labels: [['lion', '9,000']],
  camera: cam([0, 1.6, 0], [10, 4.4, -1.1, 0.9, 48], [5, 3.8, -1.2, 1.0, 48]) });
shot({ cue: ['L2', 0], ...STREET, light: 'day', note: 'Lions get 9,000',
  c: [['lion', [0, 0], 20, 'bark', 'angry']], labels: [['lion', '9,000']], pops: [['9,000', GOLD, ['L2', 2]]],
  camera: cam([0, 1.1, 0], [15, 4.2, 0.2, 0.3, 50], [8, 3.5, 0.1, 0.3, 50]) });
shot({ cue: ['L2', 4], ...STREET, light: 'day', note: 'Dragons get 50,000',
  c: [['petdragon', [0, 0], -20, 'jump', 'determined']], labels: [['petdragon', '50,000', GREEN]], pops: [['50,000', GREEN, ['L2', 6]]],
  fx: [{ type: 'sparkle', at: [0, 1.4, 0.3], cue: ['L2', 6] }],
  camera: cam([0, 1.1, 0], [-15, 4.4, 0.0, 0.4, 50], [-8, 3.6, 0.2, 0.4, 50]) });
shot({ cue: ['L3', 0], ...STREET, light: 'day', note: 'And my hamster, Nugget?',
  c: [['maxkid', [-0.55, -0.5], 15, 'wave', 'happy'], ['nugget', [0.35, 0.35], -10, 'wag', 'happy']], labels: [['nugget', '0', RED]],
  camera: cam([0, 1.05, 0], [0, 5.8, 0.1, 0.25, 50], [0, 5.2, 0.0, 0.2, 50]) });
shot({ cue: ['L3', 4], ...STREET, light: 'day', note: 'Zero. Literally zero. Extreme close-up of Nugget',
  c: [['nugget', [0, 0], 0, 'idle', 'surprised', { end: 0.5 }], ['nugget', null, 0, 'tilt', 'sad', { at: 0.5 }]], labels: [['nugget', '0', RED]], pops: [['ZERO', RED, ['L3', 4], { y: 1.0, size: 0.68 }]],
  camera: cam([0, 0.42, 0], [0, 1.9, 0.08, 0.18, 42], [0, 1.5, 0.05, 0.18, 42]) });
shot({ cue: ['L4', 0], ...STREET, light: 'day', note: 'The bully, Brax: low angle as he struts in',
  c: [['brax', [-2.4, -0.2], 90, 'walk', 'smug', { move: [-0.3, -0.2] }], ['tiger', [-1.4, 0.7], 90, 'walk', 'angry', { move: [0.9, 0.7] }]],
  camera: camF(['brax', 'tiger'], 1.3, [12, 7.6, -1.0, 0.9, 52], [6, 7.0, -1.0, 0.9, 52]) });
shot({ cue: ['L4', 5], ...STREET, light: 'day', note: 'His tiger: 12,000',
  c: [['brax', [-0.8, -0.6], 15, 'idle', 'smug'], ['tiger', [0.5, 0.3], -15, 'bark', 'angry']], labels: [['tiger', '12,000', ORANGE]],
  pops: [['12,000', ORANGE, ['L4', 7]]], camera: cam([-0.1, 1.3, 0], [-5, 6.2, -0.3, 0.6, 52], [-2, 5.6, -0.4, 0.6, 52]) });
shot({ cue: ['L5', 0], ...SCHOOL, light: 'day', note: 'First day of school: kids arriving',
  c: [['noah', [-2.5, 1.0], 160, 'walk', 'happy', { move: [-1.6, -1.0] }], ['mia', [2.4, 1.2], 200, 'walk', 'happy', { move: [1.4, -0.8] }],
    ['maxkid', [-0.5, 2.0], 180, 'walk', 'happy', { move: [-0.3, 0.2] }], ['nugget', [0.3, 2.2], 180, 'walk', 'happy', { move: [0.5, 0.5] }]],
  camera: cam([0, 1.4, -0.5], [0, 9.0, 1.6, 0.4, 55], [0, 8.0, 1.2, 0.4, 55]) });
shot({ cue: ['L5', 6], ...SCHOOL, light: 'day', note: 'The tiger swipes at Nugget',
  c: [['tiger', [-0.9, 0], 70, 'jump', 'angry'], ['nugget', [0.3, 0.1], -90, 'idle', 'scared', { at: 0.35, move: [2.6, 0.4], ease: 'linear', params: { arc: 1.1 }, action: 'jump' }]],
  labels: [['tiger', '12,000', ORANGE], ['nugget', '0', RED]],
  fx: [{ type: 'impact', at: [0.2, 0.4, 0.2], cue: ['L5', 7], shake: 0.6 }],
  camera: cam([0.5, 0.8, 0], [0, 6.8, 0.4, 0.2, 52]) });
shot({ cue: ['L5', 11], ...SCHOOL, light: 'day', note: 'Nugget flies across the playground',
  c: [['nugget', [-3.5, 0], 90, 'jump', 'scared', { move: [3.0, 0.5], ease: 'linear', params: { arc: 1.8 }, end: 0.6 }]],
  fx: [{ type: 'dust', at: [3.0, 0.1, 0.5], at01: 0.6 }, { type: 'stars', at: [3.0, 0.5, 0.5], at01: 0.6 }],
  camera: camF(['nugget'], 0.9, [0, 6.0, 0.6, 0.2, 55], [8, 5.5, 0.6, 0.2, 55]) });
shot({ cue: ['L5', 15], ...SCHOOL, light: 'day', note: 'The whole school filmed it (phones out, Brax laughing)',
  c: [['noah', [-1.8, -0.2], 10, 'idle', 'laugh', { prop: 'phone' }], ['mia', [1.7, -0.3], -10, 'idle', 'laugh', { prop: 'phone' }],
    ['zed', [-0.6, -1.4], 0, 'idle', 'laugh', { prop: 'phone' }], ['brax', [0.6, -0.9], 0, 'laugh', 'laugh'], ['tiger', [1.6, 0.6], -20, 'idle', 'smug']],
  camera: cam([0, 1.5, -0.5], [0, 8.4, 0.4, 0.3, 55], [0, 7.6, 0.4, 0.3, 55]) });
shot({ cue: ['L6', 0], ...SCHOOL, light: 'day', note: 'I picked him up, and he was shaking',
  c: [['maxkid', [0, -0.3], 0, 'idle', 'sad'], ['nugget', [0, 0.18], 0, 'shiver', 'cry', { params: { lift: 1.0 } }]],
  labels: [['nugget', '0', RED]], camera: cam([0, 1.6, 0], [0, 3.0, 0.05, 0.0, 45], [0, 2.6, 0.05, 0.0, 45]) });
shot({ cue: ['L7', 0], ...ROOM, light: 'dusk', note: 'That night, in Max\'s room',
  c: [['maxkid', [-0.6, -0.8], 20, 'sit', 'sad'], ['nugget', [0.5, -0.4], -20, 'lie', 'sad']], labels: [['nugget', '0', RED]],
  camera: cam([0, 0.8, -0.6], [0, 5.0, 0.8, 0.0, 50], [0, 4.4, 0.6, 0.0, 50]) });
shot({ cue: ['L7', 5], ...ROOM, light: 'dusk', note: 'I noticed something weird',
  c: [['maxkid', [0, 0], 0, 'think', 'surprised']], emotes: [['maxkid', '?', ['L7', 6]]],
  camera: cam([0, 1.75, 0], [0, 2.0, 0.05, 0.0, 45]) });
shot({ cue: ['L7', 7], ...ROOM, light: 'dusk', note: 'His number… had moved (the 0 flickers)',
  c: [['nugget', [0, 0], 0, 'idle', 'surprised']], labels: [['nugget', '0', RED, { glitch: ['0', '0', '0', '1', '0', '0', '1'] }]],
  camera: cam([0, 0.42, 0], [0, 1.9, 0.1, 0.25, 42], [0, 1.5, 0.08, 0.25, 42]) });
shot({ cue: ['L7', 11], ...ROOM, light: 'dusk', note: 'Zero… to one',
  c: [['maxkid', [-0.55, -0.5], 20, 'sit', 'surprised'], ['nugget', [0.35, 0.2], -20, 'wag', 'happy']],
  labels: [['nugget', '0', RED, { to: ['L7', 13] }], ['nugget', '1', GREEN, { from: ['L7', 13] }]], pops: [['1', GREEN, ['L7', 13]]],
  fx: [{ type: 'sparkle', at: 'nugget', cue: ['L7', 13] }], camera: cam([0, 0.8, 0], [0, 4.4, 0.4, 0.2, 50]) });

// ---------------- DISCOVERY
shot({ cue: ['L8', 0], ...STREET, light: 'day', note: 'The next morning: Nugget pushes a lost kitten out of the road',
  c: [['kitten', [0.2, -4.6], 0, 'walk', 'scared', { move: [0.2, -1.0] }], ['nugget', [0.2, -5.4], 0, 'pull', 'determined', { move: [0.2, -1.7] }]],
  labels: [['nugget', '1', GREEN]], camera: cam([0.2, 0.4, -3.0], [25, 4.6, 1.0, 0.0, 50], [15, 3.8, 0.8, 0.0, 50]) });
shot({ cue: ['L8', 7], ...STREET, light: 'day', note: 'Seven',
  c: [['kitten', [-0.3, 0], 30, 'wag', 'happy'], ['nugget', [0.3, 0.1], -30, 'wag', 'happy']], labels: [['nugget', '7', GREEN]],
  pops: [['7', GREEN, ['L8', 12]]], fx: [{ type: 'hearts', at: [0, 0.7, 0.2], cue: ['L8', 12] }],
  camera: cam([0, 0.4, 0], [0, 2.2, 0.15, 0.2, 45]) });
shot({ cue: ['L9', 0], ...STREET, light: 'day', weather: 'rain', note: 'He carried my homework through the rain (leaf umbrella)',
  c: [['nugget', [-1.6, 0], 90, 'walk', 'determined', { move: [1.2, 0] }]],
  props: [{ id: 'leaf', type: 'leaf', at: [-1.6, 0], move: [1.2, 0] }, { id: 'hw', type: 'homework', at: [-1.6, 0], y: 0.55, move: [1.2, 0] }],
  labels: [['nugget', '7', GREEN, { to: ['L9', 7] }], ['nugget', '40', GREEN, { from: ['L9', 7] }]], pops: [['40', GREEN, ['L9', 7]]],
  camera: camF(['nugget'], 0.5, [-15, 4.0, 0.3, 0.1, 48], [15, 3.6, 0.25, 0.1, 48]) });
shot({ cue: ['L9b', 0], ...STREET, light: 'day', note: 'Sharing his last sunflower seed with a hungry pigeon',
  c: [['nugget', [-0.32, 0], 90, 'idle', 'happy'], ['pigeon', [0.32, 0], -90, 'tilt', 'happy']], props: [{ type: 'seed', at: [0, 0.05] }],
  labels: [['nugget', '40', GREEN, { to: ['L9b', 11] }], ['nugget', '90', GREEN, { from: ['L9b', 11] }]], pops: [['90', GREEN, ['L9b', 11]]],
  fx: [{ type: 'hearts', at: [0, 0.6, 0.1], cue: ['L9b', 9] }, { type: 'sparkle', at: 'nugget', cue: ['L9b', 11] }],
  camera: cam([0, 0.3, 0], [0, 2.9, 0.2, 0.1, 45], [0, 2.6, 0.15, 0.1, 45]) });
shot({ cue: ['L10', 0], ...ROOM, light: 'day', note: 'That\'s when I figured it out',
  c: [['maxkid', [0, 0], 0, 'think', 'surprised']], emotes: [['maxkid', 'idea', ['L10', 3]]],
  camera: cam([0, 1.85, 0], [0, 2.8, 0.05, 0.1, 45], [0, 2.5, 0.05, 0.1, 45]) });
shot({ cue: ['L10', 6], ...SCHOOL, light: 'day', note: 'Not by fighting (Nugget is tiny next to the tiger)',
  c: [['tiger', [0.8, -0.3], -40, 'bark', 'angry'], ['nugget', [-0.6, 0.4], 30, 'shiver', 'scared']],
  labels: [['tiger', '12,000', ORANGE], ['nugget', '90', GREEN]], camera: cam([0, 0.8, 0], [-10, 4.2, 0.2, 0.2, 50]) });
shot({ cue: ['L10', 12], ...STREET, light: 'day', note: 'He got stronger by protecting people',
  c: [['nugget', [0, 0], 0, 'wag', 'determined'], ['kitten', [-0.8, -0.5], 20, 'wag', 'happy'], ['pigeon', [0.8, -0.5], -20, 'idle', 'happy']],
  labels: [['nugget', '90', GREEN]], fx: [{ type: 'sparkle', at: 'nugget', cue: ['L10', 15] }],
  camera: cam([0, 0.4, 0], [0, 2.9, 0.3, 0.2, 48], [0, 2.4, 0.2, 0.2, 48]) });

// ---------------- TRAINING MONTAGE
shot({ cue: ['L11', 0], ...STREET, light: 'sunset', note: 'So we trained. Every single day',
  c: [['maxkid', [-3, 0], 90, 'run', 'determined', { move: [3, 0] }], ['nugget', [-2.2, 0.6], 90, 'run', 'determined', { move: [3.8, 0.6] }]],
  camera: camF(['maxkid', 'nugget'], 1.0, [-30, 7.0, 0.6, 0.2, 52], [30, 7.0, 0.6, 0.2, 52]) });
shot({ cue: ['L12', 0], ...STREET, light: 'day', note: 'Helping Grandma carry her groceries',
  c: [['grandma', [-1.6, -0.4], 90, 'walk', 'happy', { move: [0.6, -0.4] }], ['nugget', [-0.9, 0.5], 90, 'pull', 'determined', { move: [1.3, 0.5] }]],
  props: [{ id: 'bag', type: 'groceries', at: [-0.4, 0.5], move: [1.8, 0.5] }], labels: [['nugget', '90', GREEN, { to: ['L12', 6] }], ['nugget', '300', GREEN, { from: ['L12', 6] }]],
  pops: [['300', GREEN, ['L12', 6]]],
  camera: camF(['grandma', 'nugget'], 1.0, [10, 6.4, 0.3, 0.2, 50]) });
shot({ cue: ['L13', 0], ...STREET, light: 'day', note: 'Saving a little kid\'s balloon from a tree',
  c: [['tot', [-1.2, 0.3], 30, 'scared', 'sad'], ['nugget', [0.3, 0.2], 0, 'jump', 'determined', { at: 0.15, end: 0.55, params: { arc: 2.1 } }]],
  props: [{ type: 'tree', at: [0.6, -0.8], scale: 1.0 }, { id: 'bal', type: 'balloon', at: [0.4, -0.2], y: 2.2, move: [-0.9, 0.3], moveY: 0.5, when: 0.55 }],
  camera: cam([-0.2, 1.4, 0], [0, 5.6, 0.0, 0.5, 52]) });
shot({ cue: ['L13', 9], ...STREET, light: 'day', note: 'Two thousand',
  c: [['tot', [-0.5, -0.2], 20, 'cheer', 'laugh'], ['nugget', [0.4, 0.4], -20, 'wag', 'happy']], props: [{ type: 'balloon', at: [-1.05, -0.4], y: 0.5 }],
  labels: [['nugget', '2,000', GREEN]], pops: [['2,000', GREEN, ['L13', 9]]], fx: [{ type: 'confetti', at: [0, 2.2, 0], cue: ['L13', 9] }],
  camera: cam([-0.1, 0.9, 0], [0, 5.0, 0.2, 0.3, 50]) });
shot({ cue: ['L13b', 0], ...STREET, light: 'day', note: 'Walking a lost puppy all the way home',
  c: [['nugget', [-2.0, 0.4], 90, 'pull', 'determined', { move: [0.8, 0.4] }], ['puppy', [-2.8, 0.3], 90, 'walk', 'happy', { move: [0.0, 0.3] }],
    ['reyes', [2.2, -0.8], -60, 'wave', 'happy']],
  labels: [['nugget', '2,000', GREEN]], camera: camF(['nugget', 'puppy'], 0.7, [0, 5.4, 0.6, 0.2, 50], [10, 5.0, 0.5, 0.2, 50]) });
shot({ cue: ['L13b', 9], ...STREET, light: 'day', note: 'Ten thousand',
  c: [['reyes', [-0.6, -0.6], 20, 'cheer', 'laugh'], ['puppy', [-0.2, 0.3], 10, 'lick', 'happy'], ['nugget', [0.5, 0.4], -20, 'wag', 'happy']],
  labels: [['nugget', '10,000', GREEN]], pops: [['10,000', GREEN, ['L13b', 9]]], camera: cam([0, 1.0, 0], [0, 5.6, 0.3, 0.2, 50]) });
shot({ cue: ['L14', 0], ...STREET, light: 'day', note: 'Stopping a runaway shopping cart',
  c: [['nugget', [0, 0.6], -90, 'pull', 'determined']], props: [{ id: 'cart', type: 'shoppingcart', at: [-7, 0.5], move: [-0.9, 0.5], ease: 'linear', end: 0.6, ry: 0 }],
  labels: [['nugget', '10,000', GREEN]], fx: [{ type: 'impact', at: [-0.4, 0.6, 0.6], at01: 0.6, shake: 0.7 }],
  camera: cam([-0.6, 0.6, 0.5], [30, 4.4, 0.2, 0.2, 52]) });
shot({ cue: ['L14', 6], ...STREET, light: 'day', note: 'Eighty-eight thousand! The crowd goes wild',
  c: [['noah', [-1.8, -0.8], 20, 'cheer', 'laugh'], ['mia', [1.8, -0.8], -20, 'cheer', 'laugh'], ['grandma', [-0.9, -1.8], 10, 'cheer', 'laugh'],
    ['maxkid', [0.9, -1.6], -10, 'cheer', 'laugh'], ['nugget', [0, 0.4], 0, 'jump', 'happy']], props: [{ type: 'shoppingcart', at: [-1.0, 0.9], ry: 0.3 }],
  labels: [['nugget', '88,000', GOLD]], pops: [['88,000', GOLD, ['L14', 6]]], fx: [{ type: 'confetti', at: [0, 3, -0.5], cue: ['L14', 6] }],
  camera: cam([0, 1.2, -0.5], [0, 6.0, 0.6, 0.4, 55]) });
shot({ cue: ['L15', 0], ...SCHOOL, light: 'day', note: 'But Brax just laughed',
  c: [['brax', [-0.3, 0], 15, 'laugh', 'laugh'], ['tiger', [0.9, 0.6], -15, 'idle', 'smug']], labels: [['tiger', '12,000', ORANGE]],
  camera: cam([0.2, 1.5, 0], [0, 6.2, -0.9, 0.8, 52]) });
shot({ cue: ['L15', 4], ...SCHOOL, light: 'day', note: '"A hamster with eighty-eight thousand?"',
  c: [['brax', [0, 0], 0, 'point', 'smug']], camera: cam([0, 2.1, 0], [10, 2.3, -0.1, 0.0, 45], [5, 2.0, -0.1, 0.0, 45]) });
shot({ cue: ['L15', 8], ...SCHOOL, light: 'day', note: '"Prove it." (looking up from Nugget\'s height)',
  c: [['brax', [0, -0.6], 0, 'angry', 'angry'], ['tiger', [0.9, -0.2], -10, 'bark', 'angry'], ['nugget', [0, 1.6], 180, 'idle', 'determined']],
  labels: [['nugget', '88,000', GOLD]], camera: cam([0, 0.3, 1.6], [0, 1.8, 0.2, 1.4, 60]) });

// ---------------- CRISIS
const PURPLE = 'purple';
shot({ cue: ['L16', 0], ...STREET, light: PURPLE, transition: 'flash', note: 'Then the sky turned purple (everyone looks up)',
  c: [['maxkid', [-0.7, 0], 180, 'scared', 'scared'], ['nugget', [0.1, 0.4], 180, 'idle', 'surprised'], ['noah', [1.1, -0.3], 170, 'scared', 'scared'], ['grandma', [-1.9, -0.5], 190, 'scared', 'scared']],
  camera: cam([0, 1.6, 0], [0, 6.5, -0.8, 2.4, 62], [0, 6.0, -1.0, 3.2, 62]) });
shot({ cue: ['L17', 0], ...STREET, light: PURPLE, note: 'A shadow monster rises over the city',
  c: [['shadowbeast', [2, -60], 0, 'roar', 'angry', { params: { rise: [-28, 0] }, end: 0.9 }]],
  camera: cam([2, 10, -40], [0, 50, -6, 4, 55]) });
shot({ cue: ['L17', 8], ...STREET, light: PURPLE, note: 'Taller than every skyscraper',
  c: [['shadowbeast', [2, -60], 0, 'roar', 'angry'], ['maxkid', [1.2, 3], 180, 'scared', 'scared']],
  camera: cam([1, 12, -30], [0, 34, -11, 8, 62], [0, 32, -11.5, 10, 62]) });
shot({ cue: ['L18', 0], ...STREET, light: PURPLE, note: 'Everywhere it walked…',
  c: [['shadowbeast', [10, -48], -60, 'walk', 'angry', { move: [-2, -44] }]],
  camera: cam([2, 9, -44], [15, 62, -5, 4, 58]) });
shot({ cue: ['L18', 4], ...STREET, light: PURPLE, note: '…every pet\'s power dropped to zero',
  c: [['lion', [-1.8, 0], 20, 'scared', 'scared'], ['petdragon', [1.8, -0.2], -20, 'scared', 'scared'], ['puppy', [0, 0.6], 0, 'shiver', 'scared']],
  labels: [['lion', '9,000', GOLD, { glitch: ['9,000', '900', '90', '9'], to: ['L18', 9] }], ['lion', '0', RED, { from: ['L18', 9] }],
    ['petdragon', '50,000', GREEN, { glitch: ['50,000', '5,000', '500', '5'], to: ['L18', 9] }], ['petdragon', '0', RED, { from: ['L18', 9] }],
    ['puppy', '800', WHITE, { to: ['L18', 9] }], ['puppy', '0', RED, { from: ['L18', 9] }]],
  camera: cam([0, 1.2, 0], [0, 8.4, 0.4, 0.6, 55]) });
shot({ cue: ['L18', 10], ...STREET, light: PURPLE, note: 'The lions. The dragons.',
  c: [['lion', [-0.95, 0], 15, 'sad', 'scared'], ['petdragon', [0.95, -0.1], -15, 'sad', 'scared']], labels: [['lion', '0', RED], ['petdragon', '0', RED]],
  camera: cam([0, 1.1, 0], [12, 6.2, 0.2, 0.3, 50], [-12, 6.2, 0.2, 0.3, 50]) });
shot({ cue: ['L18', 14], ...STREET, light: PURPLE, note: 'Even Brax\'s tiger',
  c: [['brax', [-0.8, -0.6], 15, 'scared', 'scared'], ['tiger', [0.5, 0.3], -15, 'shiver', 'scared']],
  labels: [['tiger', '12,000', ORANGE, { to: ['L18', 16] }], ['tiger', '0', RED, { from: ['L18', 16] }]], camera: cam([0, 1.3, 0], [0, 4.6, 0.0, 0.5, 52]) });
shot({ cue: ['L18b', 0], ...STREET, light: PURPLE, note: 'Police dogs, fire dragons charge in…',
  c: [['policedog', [-1.6, 3], 180, 'run', 'angry', { move: [-1.2, -3.5] }], ['firedragon', [1.4, 3.4], 180, 'run', 'angry', { move: [1.0, -3.5] }],
    ['shadowbeast', [0, -48], 0, 'roar', 'angry']],
  fx: [{ type: 'fire', at: [1.0, 1.6, -3], cue: ['L18b', 3] }], camera: cam([0, 2.0, -1], [0, 10, -0.6, 2.2, 62]) });
shot({ cue: ['L18b', 4], ...STREET, light: PURPLE, note: '…even the mayor\'s giant eagle',
  c: [['eagle', [-3, 3], 150, 'jump', 'angry', { move: [2, -12], params: { arc: 7 } }], ['shadowbeast', [4, -48], -10, 'roar', 'angry']],
  camera: cam([0, 3, -5], [0, 15, -1.5, 2.5, 62]) });
shot({ cue: ['L18b', 8], ...STREET, light: PURPLE, note: 'Nothing worked',
  c: [['policedog', [-1.4, 0], 20, 'lieDown', 'sad'], ['firedragon', [1.4, -0.4], -20, 'lieDown', 'sad'], ['eagle', [0.3, -2.4], 0, 'lie', 'sad']],
  labels: [['policedog', '0', RED], ['firedragon', '0', RED], ['eagle', '0', RED]], fx: [{ type: 'smoke', at: [0, 0.4, 0], cue: ['L18b', 9] }],
  camera: cam([0, 1.0, -0.8], [0, 7.5, 1.0, 0.4, 55]) });
shot({ cue: ['L19', 0], ...SCHOOL, light: PURPLE, note: 'The monster turned toward the school',
  c: [['shadowbeast', [18, -36], -60, 'walk', 'angry', { move: [13, -30] }], ['brax', [1.5, 2], 160, 'scared', 'scared'], ['tiger', [2.7, 2.4], 160, 'shiver', 'scared']],
  camera: cam([5, 8, -12], [0, 30, -6.5, 5, 64]) });
shot({ cue: ['L19', 5], ...SCHOOL, light: PURPLE, note: 'Toward Brax',
  c: [['brax', [0, 0], 0, 'scared', 'scared']], camera: cam([0, 2.0, 0], [0, 2.4, 0.0, 0.0, 45], [0, 2.0, 0.0, 0.0, 45]) });
shot({ cue: ['L19', 8], ...SCHOOL, light: PURPLE, note: 'And nobody could stop it',
  c: [['shadowbeast', [13, -30], -25, 'roar', 'angry'], ['brax', [2.7, 3.0], 160, 'scared', 'scared'], ['maxkid', [0.3, 3.2], 160, 'scared', 'scared'],
    ['noah', [-1.1, 3.6], 160, 'scared', 'scared'], ['mia', [4.1, 3.6], 160, 'scared', 'scared']],
  camera: cam([5, 7, -6], [0, 21, -6.0, 5.5, 66]) });

// ---------------- CLIMAX
shot({ cue: ['L20', 0], ...SCHOOL, light: PURPLE, note: 'Nobody… except Nugget (he leaps out of Max\'s hood)',
  c: [['maxkid', [0, 0.6], 180, 'scared', 'scared'], ['nugget', [0.25, 0.75], 180, 'idle', 'determined', { params: { lift: 1.55 }, end: 0.3 }],
    ['nugget', null, 180, 'jump', 'determined', { move: [0.1, -1.4], params: { arc: 1.0, rise: [1.55, 0] }, at: 0.3, end: 0.75 }]],
  labels: [['nugget', '0', RED]], camera: cam([0, 1.1, -0.4], [150, 5.6, 0.2, 0.3, 52]) });
shot({ cue: ['L21', 0], ...SCHOOL, light: PURPLE, note: 'He stood in front of the whole school',
  c: [['nugget', [2.2, 1.0], 160, 'idle', 'determined'], ['shadowbeast', [13, -30], -25, 'idle', 'angry'], ['maxkid', [0.6, 3.2], 160, 'scared', 'scared'],
    ['brax', [3.5, 3.0], 160, 'scared', 'scared'], ['noah', [-0.8, 3.8], 160, 'scared', 'scared'], ['mia', [4.9, 3.8], 160, 'scared', 'scared']],
  labels: [['nugget', '0', RED]], camera: cam([5, 7, -6], [-8, 20, -6.0, 5.5, 66], [-8, 19, -6.2, 6.0, 66]) });
shot({ cue: ['L21', 8], ...SCHOOL, light: PURPLE, note: 'And the monster laughed',
  c: [['shadowbeast', [13, -30], -25, 'roar', 'angry']], fx: [{ type: 'bigdust', at: [13, 0.5, -26], cue: ['L21', 11], shake: 0.6 }],
  camera: cam([13, 15, -30], [30, 34, -13, 5, 60]) });
shot({ cue: ['L21b', 0], ...SCHOOL, light: PURPLE, note: 'I yelled, "Nugget, run!"',
  c: [['maxkid', [0, 0], 0, 'point', 'scared']], camera: cam([0, 1.75, 0], [-15, 2.1, 0.05, 0.0, 45]) });
shot({ cue: ['L21b', 4], ...SCHOOL, light: PURPLE, note: 'But he didn\'t run',
  c: [['nugget', [9, 0], 172, 'idle', 'determined'], ['shadowbeast', [13, -30], -25, 'idle', 'angry']],
  camera: cam([9, 0.4, 0], [-8, 2.4, 0.15, 2.6, 64], [-8, 2.1, 0.1, 3.0, 64]) });
shot({ cue: ['L21b', 8], ...SCHOOL, light: PURPLE, note: 'He looked back at me… and smiled',
  c: [['nugget', [0, 0], 150, 'idle', 'determined', { end: 0.45 }], ['nugget', null, 0, 'wag', 'happy', { at: 0.45 }]],
  camera: cam([0, 0.42, 0], [0, 1.7, 0.08, 0.18, 42], [0, 1.4, 0.05, 0.18, 42]) });
shot({ cue: ['L22', 0], ...SCHOOL, light: PURPLE, note: 'Then Nugget\'s number started glitching',
  c: [['nugget', [0, 0], 0, 'idle', 'determined']],
  labels: [['nugget', '0', RED, { glitch: ['0', '9', '0', '99', '0', '9', '#', '0'] }]], fx: [{ type: 'magic', at: 'nugget', cue: ['L22', 4] }],
  camera: cam([0, 0.45, 0], [0, 2.6, 0.15, 0.3, 48], [0, 2.1, 0.12, 0.3, 48]) });
shot({ cue: ['L22', 5], ...SCHOOL, light: PURPLE, note: 'Nine… nine, nine… NINE BILLION!',
  c: [['nugget', [0, 0], 0, 'idle', 'determined']],
  labels: [['nugget', '9', GOLD, { to: ['L22', 6] }], ['nugget', '99', GOLD, { from: ['L22', 6], to: ['L22', 7] }], ['nugget', '999,999', GOLD, { from: ['L22', 7], to: ['L22', 8] }],
    ['nugget', '9,999,999,999', GOLD, { from: ['L22', 8] }]],
  pops: [['9,999,999,999', GOLD, ['L22', 9], { size: 0.8, y: 0.85, dur: 1.2 }]], fx: [{ type: 'sparkle', at: 'nugget', cue: ['L22', 5] }, { type: 'magic', at: 'nugget', cue: ['L22', 8] }],
  camera: cam([0, 0.45, 0], [0, 3.0, 0.2, 0.35, 50], [0, 2.4, 0.15, 0.35, 50]) });
const G0 = 0.5 / 14; // nuggetGold starts at normal Nugget size
shot({ cue: ['L23', 0], ...SCHOOL, light: PURPLE, note: 'And he grew…',
  c: [['nuggetGold', [0, 0], 0, 'idle', 'determined', { params: { grow: [G0, 0.2] } }]], fx: [{ type: 'magic', at: [0, 0.5, 0.3], cue: ['L23', 0] }],
  camera: cam([0, 1.0, 0], [0, 5.0, 0.2, 0.6, 52], [0, 6.0, 0.0, 1.0, 55]) });
shot({ cue: ['L23', 3], ...STREET, light: PURPLE, note: 'Bigger than the trees',
  c: [['nuggetGold', [0, -10], 0, 'idle', 'determined', { params: { grow: [0.2, 0.45] } }]],
  camera: cam([0, 3, -10], [0, 18, -1.0, 2.0, 58], [0, 20, -1.5, 3.0, 58]) });
shot({ cue: ['L23', 7], ...SCHOOL, light: PURPLE, note: 'Bigger than the school',
  c: [['nuggetGold', [-13, -18], 15, 'idle', 'determined', { params: { grow: [0.45, 1] } }], ['maxkid', [-3, 2.5], 200, 'scared', 'surprised']],
  camera: cam([-5, 7, -10], [0, 28, -6, 4, 64], [0, 30, -6.5, 6, 64]) });
shot({ cue: ['L23', 11], ...STREET, light: PURPLE, note: 'A giant golden hamster, glowing like the sun',
  c: [['nuggetGold', [-1, -12], 15, 'idle', 'determined']], labels: [['nuggetGold', '9,999,999,999', GOLD]],
  fx: [{ type: 'sparkle', at: [-1, 8, -9], cue: ['L23', 13] }], camera: cam([-1, 8, -12], [8, 30, -7.5, 3, 62], [4, 27, -7.8, 3.5, 62]) });
shot({ cue: ['L24', 0], ...STREET, light: PURPLE, note: 'One punch, and the monster exploded into stars',
  c: [['nuggetGold', [-16, -40], 60, 'idle', 'angry', { move: [-5, -46], action: 'jump', params: { arc: 6 }, at: 0.02, end: 0.22 }],
    ['shadowbeast', [8, -52], -60, 'roar', 'angry', { end: 0.22 }], ['shadowbeast', null, -60, 'scared', 'scared', { at: 0.22, end: 0.5, params: { grow: [1, 0.01] } }]],
  fx: [{ type: 'impact', at: [2, 14, -40], cue: ['L24', 1], shake: 1.4 }, { type: 'stars', at: [6, 14, -44], cue: ['L24', 5], shake: 1.2 },
    { type: 'sparkle', at: [6, 14, -43], cue: ['L24', 5] }, { type: 'confetti', at: [6, 16, -43], cue: ['L24', 6] }, { type: 'magic', at: [6, 12, -43], cue: ['L24', 6] }],
  camera: cam([-2, 12, -46], [0, 66, -5, 4, 62]) });
shot({ cue: ['L24b', 0], ...STREET, light: 'day', transition: 'flash', note: 'The whole city chanted his name',
  c: [['noah', [-1.8, -0.4], 15, 'cheer', 'laugh'], ['mia', [1.8, -0.4], -15, 'cheer', 'laugh'], ['grandma', [-0.7, -1.4], 5, 'cheer', 'laugh'],
    ['tot', [0.7, -0.9], -5, 'cheer', 'laugh'], ['reyes', [2.8, -1.6], -20, 'cheer', 'laugh'], ['owen', [-2.8, -1.6], 20, 'cheer', 'laugh']],
  fx: [{ type: 'confetti', at: [0, 3.5, -0.5], cue: ['L24b', 0] }], camera: cam([0, 1.3, -0.8], [0, 6.6, 0.6, 0.4, 55]) });
shot({ cue: ['L24b', 6], ...STREET, light: 'day', note: 'Nugget! Nugget!',
  c: [['nuggetGold', [0, -30], 0, 'wag', 'happy'], ['maxkid', [-0.8, 1.5], 180, 'cheer', 'laugh'], ['noah', [0.8, 1.6], 180, 'cheer', 'laugh']],
  fx: [{ type: 'confetti', at: [0, 4, 0], cue: ['L24b', 6] }, { type: 'confetti', at: [0, 4, 0], cue: ['L24b', 7] }],
  camera: cam([0, 6, -10], [0, 20, -4.5, 4, 62]) });

// ---------------- ENDING
shot({ cue: ['L25', 0], ...STREET, light: 'sunset', note: 'Every pet got its power back',
  c: [['lion', [-1.8, 0], 20, 'wag', 'happy'], ['petdragon', [1.8, -0.2], -20, 'jump', 'happy'], ['tiger', [0, -0.8], 0, 'idle', 'happy']],
  labels: [['lion', '9,000'], ['petdragon', '50,000', GREEN], ['tiger', '12,000', ORANGE]], fx: [{ type: 'sparkle', at: [0, 2, 0], cue: ['L25', 0] }],
  camera: cam([0, 1.2, -0.3], [0, 8.4, 0.5, 0.6, 55]) });
shot({ cue: ['L25', 6], ...STREET, light: 'sunset', note: 'And Brax walked over…',
  c: [['brax', [2.6, -0.4], -90, 'walk', 'sad', { move: [0.7, -0.3] }], ['maxkid', [-0.7, -0.2], 60, 'idle', 'surprised'], ['nugget', [-0.2, 0.5], 30, 'idle', 'happy']],
  camera: cam([0, 1.2, 0], [0, 5.4, 0.4, 0.3, 52]) });
shot({ cue: ['L25', 11], ...STREET, light: 'sunset', note: '…and for the first time ever, he said sorry',
  c: [['brax', [0.6, -0.3], -60, 'idle', 'sad', { end: 0.6 }], ['brax', null, -60, 'bow', 'sad', { at: 0.6 }], ['maxkid', [-0.6, -0.2], 60, 'idle', 'surprised']],
  camera: cam([0, 1.7, 0], [0, 3.4, 0.1, 0.1, 48]) });
shot({ cue: ['L26', 0], ...ROOM, light: 'sunset', note: 'Nugget shrank back down, curled up in my hand, and fell asleep',
  c: [['maxkid', [0, -0.3], 0, 'idle', 'happy'], ['nugget', [0, 0.18], 0, 'lie', 'sleepy', { params: { lift: 1.0 } }]],
  labels: [['nugget', '9,999,999,999', GOLD, { to: ['L26', 1] }], ['nugget', '0', RED, { from: ['L26', 1] }]], emotes: [['nugget', 'zzz', ['L26', 10]]],
  camera: cam([0, 1.45, 0], [0, 2.4, 0.1, 0.05, 45], [0, 1.9, 0.05, 0.05, 45]) });
shot({ cue: ['L27', 0], ...STREET, light: 'sunset', note: 'But then I looked at Brax\'s tiger…',
  c: [['tiger', [0.4, 0], -20, 'idle', 'neutral'], ['brax', [1.4, -0.8], -20, 'idle', 'happy']], labels: [['tiger', '12,000', ORANGE]],
  camera: cam([0.4, 1.0, 0], [0, 4.4, 0.3, 0.3, 50], [0, 3.8, 0.3, 0.3, 50]) });
shot({ cue: ['L27', 7], ...STREET, light: 'sunset', note: '…and its number was glitching too',
  c: [['tiger', [0, 0], 0, 'tilt', 'surprised']],
  labels: [['tiger', '12,000', ORANGE, { glitch: ['12,000', '12,000', '99,999', '12,000', '?????', '12,0#0', '999,999'] }]],
  camera: cam([0, 1.2, 0], [0, 3.6, 0.2, 0.5, 48], [0, 2.4, 0.15, 0.6, 46]) });

// ------------------------------------------------------------------ build
const starts = S.map((o) => (o.cue[0] === 'L1' && o.cue[1] === 0 ? 0 : cueTime(o.cue)));
for (let i = 1; i < starts.length; i++) if (!(starts[i] > starts[i - 1])) throw new Error(`shot ${i + 1} does not start after shot ${i}`);
const END = AUDIO_END + TAIL;

const scenes = S.map((o, i) => {
  const t0 = starts[i], t1 = i + 1 < S.length ? starts[i + 1] : END, dur = t1 - t0;
  const f = (cue) => Math.min(1, Math.max(0, (cueTime(cue) - t0) / dur));
  const castIds = [];
  const actions = [];
  const castPos = {};
  for (const [id, at, face, action, expr, x = {}] of o.c) {
    if (at) { castPos[id] = at; castIds.push({ id, at, face }); }
    if (x.move && x.at) {
      actions.push({ char: id, action, expr, face, at: 0, end: x.at, glasses: false });
      actions.push({ char: id, action: x.action || action, expr, at: x.at, end: x.end ?? 1, move: x.move, ease: x.ease, params: x.params, glasses: false });
    } else {
      actions.push({ char: id, action, expr, face, at: x.at ?? 0, end: x.end ?? 1, move: x.move, ease: x.ease, params: x.params, prop: x.prop, glasses: false });
    }
  }
  const props = [], propMoves = [];
  (o.props || []).forEach((p, k) => {
    const id = p.id || `p${k}`;
    props.push({ id, type: p.type, at: p.at, y: p.y, ry: p.ry, scale: p.scale, color: p.color });
    if (p.move) propMoves.push({ prop: id, to: p.move, y: p.moveY, ease: p.ease, when: p.when ?? 0, end: p.end ?? 1 });
  });
  const labels = (o.labels || []).map(([char, text, color, x = {}]) => ({ char, text, color, glitch: x.glitch, when: x.from ? f(x.from) : 0, end: x.to ? f(x.to) : 1 }));
  const pops = (o.pops || []).map(([text, color, cue, x = {}]) => ({ text, color, when: f(cue), dur: x.dur ?? 1.0, y: x.y ?? 0.75, size: x.size ?? 0.82 }));
  for (const pp of pops) {
    for (const lb of [...labels]) {
      if (lb.text !== pp.text || lb.glitch || !(pp.when >= lb.when && pp.when < lb.end)) continue;
      const back = Math.min(1, pp.when + (pp.dur * 0.95) / dur);
      if (back < lb.end) labels.push({ ...lb, when: back });
      lb.end = pp.when;
    }
  }
  const fx = (o.fx || []).map((e) => ({ type: e.type, at: e.at, when: e.cue ? f(e.cue) : e.at01 ?? 0, shake: e.shake }));
  const emotes = (o.emotes || []).map(([char, icon, cue]) => ({ char, icon, when: f(cue), dur: 1.0 }));
  return {
    environment: o.environment, envSeed: o.envSeed, envOptions: o.envOptions, lighting: o.light, weather: o.weather || null,
    music: o.light === 'purple' ? 'danger' : o.light === 'night' ? 'sad' : undefined,
    transition: o.transition || 'cut', transitionDur: o.transition === 'flash' ? 0.35 : undefined,
    props, cast: castIds,
    beats: [{ duration: +dur.toFixed(4), camera: [{ ...o.camera, at: 0, end: 1 }], actions, labels, pops, fx, emotes, propMoves }],
    note: o.note, cue: o.cue, t0: +t0.toFixed(3), t1: +t1.toFixed(3),
  };
});

const storyboard = {
  title: 'The Weakest Pet in the World', seed: 6, style: 'bright', captionStyle: 'yellow', mood: 'adventure',
  narration: { audio: 'productions/weakest-pet/audio/narration_james_240wpm.mp3', alignment: 'productions/weakest-pet/timing/alignment.json', offset: 0 },
  musicVolume: 0.3, sfxVolume: 0.9, voiceVolume: 1,
  characters: [...new Set(S.flatMap((o) => o.c.map((c) => c[0])))],
  scenes,
};
fs.writeFileSync(path.join(HERE, 'storyboard.json'), JSON.stringify(storyboard, null, 1));
// preview cut for approval: the hook, up to "Zero… to one" (shots before line L8)
const cut = scenes.findIndex((sc) => sc.cue[0] === 'L8');
fs.writeFileSync(path.join(HERE, 'storyboard.preview.json'), JSON.stringify({ ...storyboard, title: storyboard.title + ' (preview)', scenes: scenes.slice(0, cut) }, null, 1));

const md = ['# "The Weakest Pet in the World" – Storyboard (timed to the real narration)', '',
  `Narration: James, 240 wpm, ${AUDIO_END.toFixed(2)} s · video length ${END.toFixed(2)} s · ${S.length} shots · average shot ${(END / S.length).toFixed(2)} s`, '',
  'Times come from free offline forced alignment of the narration (render/align.py). Every cut lands on a spoken word.', '',
  '| # | Time | Set / light | Shot | Numbers on screen |', '|---|---|---|---|---|'];
scenes.forEach((sc, i) => {
  const nums = [...new Set([...(sc.beats[0].labels || []).map((l) => l.text), ...(sc.beats[0].pops || []).map((p) => `**${p.text}**`)])].join(' ');
  md.push(`| ${i + 1} | ${sc.t0.toFixed(2)}–${sc.t1.toFixed(2)} | ${sc.environment} / ${sc.lighting}${sc.weather ? ' + ' + sc.weather : ''} | ${sc.note} | ${nums} |`);
});
fs.writeFileSync(path.join(HERE, 'STORYBOARD.md'), md.join('\n') + '\n');
console.log(`storyboard: ${S.length} shots, ${END.toFixed(2)} s, shortest ${Math.min(...scenes.map((s) => s.t1 - s.t0)).toFixed(2)} s, longest ${Math.max(...scenes.map((s) => s.t1 - s.t0)).toFixed(2)} s`);
