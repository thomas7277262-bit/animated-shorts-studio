// Storyboard for "Every Time I Sneeze, I Swap Places With a Stranger", timed to the real narration.
//   node productions/sneeze-swap/storyboard_build.mjs   → storyboard.json, storyboard.preview.json, STORYBOARD.md
// Every shot starts on a spoken word (cue = [line id, word index]) and lasts until the next cue.
// Fast, bright, lots of scene changes: every "Achoo!" is a white flash + swoosh into a new place.
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const AL = JSON.parse(fs.readFileSync(path.join(HERE, 'timing/alignment.json'), 'utf8'));
const LINES = Object.fromEntries(AL.lines.map((l) => [l.id, l]));
const AUDIO_END = AL.report.audio_s;
const TAIL = 1.4;
const PACE = 1.2;                       // faster gestures and walk cycles than usual ("fast motion")
const cueTime = ([id, wi = 0]) => { const w = LINES[id]?.words[wi]; if (!w) throw new Error(`bad cue ${id}:${wi}`); return w.start; };

const DEG = 180 / Math.PI;
function look(P, T, fov = 50, P2 = P, T2 = T, ease) {
  const st = (p, t) => ({ angle: Math.atan2(p[0] - T[0], p[2] - T[2]) * DEG, dist: Math.hypot(p[0] - T[0], p[2] - T[2]), height: p[1] - T[1], lookY: t[1] - T[1], fov });
  return { type: 'medium', target: T, scale: false, from: st(P, T), to: st(P2, T2), ease };
}
const cam = (target, a, b = a, ease) => ({ type: 'medium', target, scale: false, ease,
  from: { angle: a[0], dist: a[1], height: a[2], lookY: a[3] ?? 0, fov: a[4] ?? 50 },
  to: { angle: b[0], dist: b[1], height: b[2], lookY: b[3] ?? 0, fov: b[4] ?? 50 } });
const camF = (ids, focusY, a, b = a, ease) => ({ ...cam([0, 0, 0], a, b, ease), target: ids, focusY });

const GOLD = '#ffe14a', RED = '#ff3b3b', WHITE = '#ffffff', YEL = '#ffd23f', PINK = '#ff5fa2';
const CLASS = { environment: 'classroom', envSeed: 5, light: 'day' };
const PIZZA = { environment: 'pizzashop', envSeed: 5, light: 'day' };
const STAD = { environment: 'stadium', envSeed: 5, light: 'day' };
const ZOO = { environment: 'zoo', envSeed: 5, light: 'day' };
const WED = { environment: 'wedding', envSeed: 5, light: 'day' };
const TOWN = { environment: 'downtown', envSeed: 5, light: 'day' };
const COCK = { environment: 'cockpit', envSeed: 5, light: 'day' };
const SKY = { environment: 'skies', envSeed: 5, light: 'day' };
const SUB = { environment: 'suburb', envSeed: 5, light: 'day' };
const SCHOOL = { environment: 'school', envSeed: 5, light: 'day' };
const HOME = { environment: 'house', envSeed: 5, light: 'day' };
const SWAP = { transition: 'flash' };   // every sneeze-teleport

// classroom seats (chair is 0.85 behind each desk; everyone faces the blackboard at -z)
const SEAT = { max: [0, 1.45], L1: [-2.2, 1.45], R1: [2.2, 1.45], F0: [0, -1.15], FL: [-2.2, -1.15], FR: [2.2, -1.15], B0: [0, 4.05], BL: [-2.2, 4.05], BR: [2.2, 4.05] };
const classmates = (act = 'sitWrite', expr = 'happy') => [
  ['noah', SEAT.L1, 180, act, expr], ['mia', SEAT.R1, 180, act, expr], ['zed', SEAT.B0, 180, act, expr], ['tot', SEAT.FL, 180, act, expr],
];
// the desk camera: from the blackboard side, looking at whoever sits at Max's desk
const deskCam = (d = 2.6, h = 0.9, fov = 50, d2 = d - 0.5) => look([0.35, 1.3 + h, 1.45 - d], [0, 1.3, 1.45], fov, [0.3, 1.3 + h * 0.9, 1.45 - d2], [0, 1.3, 1.45]);
const sneezeLead = 0.4 / PACE;          // the sneeze pose snaps 0.4 s (scaled) after it starts

const S = [];
const shot = (o) => S.push(o);
const ACHOO = (cue, at) => ['ACHOO!', YEL, cue, at, 0.55];

// ================================================================ HOOK
shot({ cue: ['L1', 0], ...CLASS, music: 'comedy', note: 'Max at his desk… sneezes ("Every time I sneeze")',
  c: [['max', SEAT.max, 180, 'sitWrite', 'sad', { end: ['L1', 3, sneezeLead] }], ['max', null, 180, 'sneeze', 'surprised', { at: ['L1', 3, sneezeLead] }], ...classmates()],
  comic: [['ACHOO!', YEL, ['L1', 3], [0.15, 1.95, 0.7], 0.42]], fx: [{ type: 'poof', at: [0, 1.4, 1.0], cue: ['L1', 4], shake: 0.5 }],
  camera: deskCam(3.0, 0.6, 50, 2.4) });
shot({ cue: ['L1', 5], ...TOWN, ...SWAP, music: 'comedy', note: '…and swap places with a random stranger: Max is suddenly on a busy street holding someone\'s shopping',
  c: [['max', [0, 2.2], 10, 'scared', 'surprised', { prop: 'phone' }]], fx: [{ type: 'poof', at: [0, 1.0, 2.2], cue: ['L1', 5] }],
  pops: [['SWAP!', PINK, ['L1', 6], { size: 0.7 }]],
  camera: camF(['max'], 1.4, [-15, 4.2, 0.3, 0.1, 52], [15, 3.4, 0.2, 0.1, 52]) });
shot({ cue: ['L1', 11], ...CLASS, ...SWAP, music: 'comedy', note: '…and the stranger (a grandma) lands at his school desk, totally confused',
  c: [['grandma', SEAT.max, 180, 'sitPanic', 'surprised'], ...classmates('sitWrite', 'surprised')],
  fx: [{ type: 'poof', at: [0, 1.4, 1.3], cue: ['L1', 11] }], emotes: [['grandma', '?', ['L1', 13]]],
  camera: deskCam(3.2, 1.2, 52, 2.6) });
shot({ cue: ['L2', 0], ...SUB, music: 'comedy', note: 'Today the pollen count was the highest in history: Max walking past blooming trees, itchy nose',
  c: [['max', [-2, 1.2], 90, 'walk', 'sad', { move: [1.2, 1.2] }]], fx: [{ type: 'sparkle', at: [-0.5, 2.2, 1.2], cue: ['L2', 3] }, { type: 'sparkle', at: [0.6, 1.9, 1.2], cue: ['L2', 5] }],
  pops: [['POLLEN', YEL, ['L2', 3], { size: 0.6, dur: 0.8 }]],
  camera: camF(['max'], 1.5, [45, 4.8, 0.4, 0.2, 50], [25, 3.8, 0.3, 0.2, 50]) });
shot({ cue: ['L2', 6], ...SUB, music: 'comedy', note: '…highest in history (big red RECORD pop)',
  c: [['max', [0, 1.2], 0, 'scared', 'surprised']], pops: [['RECORD HIGH!', RED, ['L2', 7], { size: 0.62 }]],
  camera: camF(['max'], 1.75, [0, 3.2, 0.1, 0.0, 48], [0, 2.1, 0.0, 0.0, 48]) });

// ================================================================ SETUP
shot({ cue: ['L3', 0], ...SCHOOL, music: 'comedy', note: '"My name is Max." Max waves in front of his school',
  c: [['max', [0, 1.0], 0, 'wave', 'happy']], pops: [['MAX', '#2fbf71', ['L3', 3], { size: 0.7 }]],
  camera: camF(['max'], 1.5, [10, 4.6, 0.3, 0.1, 50], [-5, 3.6, 0.2, 0.1, 50]) });
shot({ cue: ['L3', 4], ...CLASS, music: 'comedy', note: 'It started in the middle of a math test (the whole class writing, MATH TEST on the board)',
  c: [['max', SEAT.max, 180, 'sitWrite', 'determined'], ...classmates(), ['teacher', [3.0, -4.0], -20, 'idle', 'happy']],
  camera: look([2.6, 4.4, 6.4], [0, 2.4, -3.5], 58, [1.6, 3.9, 5.2], [0, 2.6, -4.5]) });
shot({ cue: ['L4', 0], ...CLASS, music: 'comedy', note: 'ACHOO! (close on Max, the whole desk shakes)',
  c: [['max', SEAT.max, 180, 'sneeze', 'surprised', { at: 0 }]], comic: [ACHOO(['L4', 0], [0.5, 2.2, 1.0])],
  fx: [{ type: 'poof', at: [0, 1.4, 1.3], cue: ['L4', 0], shake: 0.6 }],
  camera: deskCam(2.0, 0.5, 46, 1.6) });
shot({ cue: ['L4', 1], ...PIZZA, ...SWAP, music: 'comedy', note: 'Suddenly Max is in a pizza shop',
  c: [['max', [0, -0.3], 0, 'scared', 'surprised']], fx: [{ type: 'poof', at: [0, 1.0, -0.3], cue: ['L4', 1] }],
  props: [{ type: 'dough', at: [0, -0.3], y: 2.4, moves: [{ y: 4.6, when: 0, end: 0.5, ease: 'out' }, { y: 3.2, when: 0.5, end: 1, ease: 'in' }] }],
  camera: look([0.8, 3.0, 6.5], [0, 1.9, -0.6], 55, [0.4, 2.6, 5.2], [0, 2.0, -0.6]) });
shot({ cue: ['L4', 8], ...PIZZA, music: 'comedy', note: '…with dough flying over his head (he tries to catch it)',
  c: [['max', [0, -0.3], 0, 'toss', 'scared']],
  props: [{ type: 'dough', at: [0, -0.3], y: 2.6, moves: [{ y: 4.0, when: 0, end: 0.45, ease: 'out' }, { y: 2.65, when: 0.45, end: 0.95, ease: 'in' }] }],
  camera: look([0.3, 1.7, 3.4], [0, 2.15, -0.3], 60, [0.2, 1.7, 3.0], [0, 2.25, -0.3]) });
shot({ cue: ['L5', 0], ...CLASS, ...SWAP, music: 'comedy', note: 'And the pizza chef? Poof: he is sitting at Max\'s desk',
  c: [['chef', SEAT.max, 180, 'sitPanic', 'surprised'], ...classmates('sitWrite', 'surprised')],
  fx: [{ type: 'poof', at: [0, 1.5, 1.3], cue: ['L5', 0] }], emotes: [['chef', '!?', ['L5', 3]]],
  camera: deskCam(3.0, 1.0, 50, 2.4) });
shot({ cue: ['L5', 10], ...CLASS, music: 'comedy', note: '…staring at the math test (close, he scratches his head)',
  c: [['chef', SEAT.max, 180, 'sitWrite', 'surprised']], emotes: [['chef', '?', ['L5', 11]]],
  camera: deskCam(2.5, 0.6, 46, 2.1) });

// ================================================================ ESCALATION: stadium
shot({ cue: ['L6', 0], ...PIZZA, music: 'comedy', note: 'ACHOO! (the dough flops onto his head)',
  c: [['max', [0, -0.3], 0, 'sneeze', 'surprised', { at: 0 }]], comic: [ACHOO(['L6', 0], [0.7, 3.0, -0.2])],
  props: [{ type: 'dough', at: [0, -0.3], y: 4.2, moves: [{ y: 2.3, when: 0.25, end: 0.6, ease: 'in' }] }],
  fx: [{ type: 'poof', at: [0, 1.6, 0], cue: ['L6', 0], shake: 0.5 }],
  camera: look([0.5, 2.3, 3.4], [0, 1.85, -0.3], 52) });
shot({ cue: ['L6', 1], ...STAD, ...SWAP, music: 'comedy', note: 'Now I was a goalkeeper (Max in the goal, arms up)',
  c: [['max', [0, -0.3], 0, 'goalie', 'scared']], fx: [{ type: 'poof', at: [0, 1.0, -0.3], cue: ['L6', 1] }],
  camera: look([0, 2.4, 9], [0, 1.6, -0.3], 52, [0, 2.0, 6.5], [0, 1.6, -0.3]) });
shot({ cue: ['L6', 6], ...STAD, music: 'comedy', note: '…in a giant stadium with fifty thousand people screaming (huge sweeping wide)',
  c: [['max', [0, -0.3], 0, 'goalie', 'scared']], pops: [['50,000', WHITE, ['L6', 11], { size: 0.75, y: 0.75 }]],
  camera: look([-22, 18, 30], [0, 3, -6], 60, [18, 15, 28], [0, 3, -6]) });
shot({ cue: ['L7', 0], ...STAD, music: 'comedy', note: 'The ball flew straight at his face (ball rockets toward the goal)',
  c: [['max', [0, -0.3], 0, 'goalie', 'scared']],
  props: [{ type: 'ball', at: [0.5, 12], y: 0.1, moves: [{ to: [0.1, 1.2], y: 1.75, when: 0.05, end: 1, ease: 'linear' }] }],
  camera: look([3.6, 1.5, -1.8], [0, 1.4, 6], 55, [3.2, 1.5, -1.5], [0, 1.6, 4]) });
shot({ cue: ['L7', 4], ...STAD, music: 'comedy', note: '…at my face (close: the ball fills the frame, Max cross-eyed)',
  c: [['max', [0, -0.3], 0, 'scared', 'scared']],
  props: [{ type: 'ball', at: [0.1, 4.0], y: 1.6, moves: [{ to: [0.05, 1.1], y: 1.7, when: 0, end: 1, ease: 'linear' }] }],
  camera: look([0.7, 2.0, 2.4], [0, 1.85, -0.3], 45) });
shot({ cue: ['L7', 7], ...STAD, music: 'comedy', note: '"I sneezed again." ACHOO! just before impact',
  c: [['max', [0, -0.3], 0, 'scared', 'scared', { end: ['L8', 0, sneezeLead] }], ['max', null, 0, 'sneeze', 'surprised', { at: ['L8', 0, sneezeLead] }]],
  props: [{ type: 'ball', at: [0.05, 1.2], y: 1.75 }],
  comic: [ACHOO(['L8', 0], [0.6, 2.6, 0.2])], fx: [{ type: 'poof', at: [0, 1.8, 0.4], cue: ['L8', 0], shake: 0.6 }],
  camera: look([0.9, 2.1, 3.0], [0, 1.85, -0.3], 48, [0.6, 2.0, 2.4], [0, 1.85, -0.3]) });

// ================================================================ zoo
shot({ cue: ['L8', 1], ...ZOO, ...SWAP, music: 'comedy', note: 'I was in the zoo (wide: LIONS sign, visitors behind the bars)',
  c: [['max', [1.2, 0.8], -20, 'scared', 'surprised']], fx: [{ type: 'poof', at: [1.2, 1.0, 0.8], cue: ['L8', 1] }],
  camera: look([-2, 5.5, 13], [0, 2.6, -4], 55, [-1, 4.6, 10], [0, 2.4, -4]) });
shot({ cue: ['L8', 6], ...ZOO, music: 'comedy', note: 'Inside the lion cage… (the lion is right behind him)',
  c: [['max', [1.2, 0.8], 0, 'idle', 'surprised'], ['lion', [-1.4, -0.6], 50, 'walk', 'angry', { move: [-0.6, -0.1] }]],
  camera: look([3.2, 2.4, 6.5], [0, 1.4, 0], 52, [2.6, 2.2, 5.4], [0, 1.4, 0]) });
shot({ cue: ['L8', 10], ...ZOO, music: 'comedy', note: '…holding a bucket of meat',
  c: [['max', [1.2, 0.8], -20, 'holdOut', 'scared', { prop: 'bucket' }]],
  camera: look([0.0, 2.0, 3.8], [1.0, 1.5, 0.9], 48, [0.1, 1.9, 3.3], [1.0, 1.55, 0.9]) });
shot({ cue: ['L9', 0], ...ZOO, music: 'tense', note: 'The lion looked at me (slow push in on the lion\'s face)',
  c: [['lion', [-0.6, -0.1], 60, 'tilt', 'angry']],
  camera: look([0.9, 1.9, 2.6], [-0.4, 1.4, -0.1], 46, [0.6, 1.8, 1.9], [-0.4, 1.45, -0.1]) });
shot({ cue: ['L9', 5], ...ZOO, music: 'tense', note: 'I looked at the lion (Max, sweating)',
  c: [['max', [1.2, 0.8], -60, 'holdOut', 'scared', { prop: 'bucket' }]], emotes: [['max', 'sweat', ['L9', 6]]],
  camera: look([-0.6, 2.0, 2.0], [1.2, 1.85, 0.8], 46) });
shot({ cue: ['L9', 10], ...CLASS, ...SWAP, music: 'comedy', note: 'The zookeeper was now in my math class',
  c: [['zookeeper', SEAT.max, 180, 'sitPanic', 'surprised'], ...classmates('sitWrite', 'laugh')],
  fx: [{ type: 'poof', at: [0, 1.5, 1.3], cue: ['L9', 10] }], emotes: [['zookeeper', '!?', ['L9', 13]]],
  camera: deskCam(3.0, 1.1, 52, 2.4) });

// ================================================================ wedding
shot({ cue: ['L10', 0], ...ZOO, music: 'comedy', note: 'ACHOO! (the lion jumps back in fright)',
  c: [['max', [1.2, 0.8], -40, 'sneeze', 'surprised', { at: 0, prop: 'bucket' }], ['lion', [-0.6, -0.1], 60, 'jump', 'surprised']],
  comic: [ACHOO(['L10', 0], [1.4, 2.8, 1.0])], fx: [{ type: 'poof', at: [1.0, 1.6, 0.8], cue: ['L10', 0], shake: 0.6 }],
  camera: look([3.0, 2.6, 5.0], [0.3, 1.4, 0.3], 52) });
shot({ cue: ['L10', 1], ...WED, ...SWAP, music: 'comedy', note: 'A wedding! Everyone was staring at me (Max at the flower arch beside the bride, rows of guests staring)',
  fx: [{ type: 'poof', at: [0.6, 1.0, -0.6], cue: ['L10', 1] }],
  c: [['max', [0.6, -0.6], 0, 'idle', 'scared'], ['bride', [-0.6, -0.6], 20, 'idle', 'surprised']],
  camera: look([0.9, 2.9, -3.4], [0, 1.2, 6], 58, [0.7, 2.4, -2.6], [0, 1.2, 4]) });
shot({ cue: ['L10', 8], ...WED, music: 'comedy', note: '…I was holding the ring (sparkle)',
  c: [['max', [0.6, -0.6], 0, 'holdOut', 'scared', { prop: 'ring' }], ['bride', [-0.6, -0.6], 30, 'idle', 'surprised']],
  fx: [{ type: 'glint', at: [0.85, 1.75, 0.2], cue: ['L10', 12] }],
  camera: look([-0.2, 2.4, 2.1], [0.4, 1.6, -0.6], 48) });

// ================================================================ fire truck
shot({ cue: ['L11', 0], ...WED, music: 'comedy', note: 'ACHOO! (petals blast everywhere)',
  c: [['max', [0.6, -0.6], 0, 'sneeze', 'surprised', { at: 0, prop: 'ring' }], ['bride', [-0.6, -0.6], 30, 'scared', 'surprised']],
  comic: [ACHOO(['L11', 0], [0.8, 2.9, -0.4])], fx: [{ type: 'confetti', at: [0.6, 2.2, -0.2], cue: ['L11', 0], shake: 0.5 }],
  camera: look([0.2, 2.2, 4.2], [0, 1.6, -0.6], 50) });
const TRUCK0 = -14, TRUCK1 = 10;
shot({ cue: ['L11', 1], ...TOWN, ...SWAP, music: 'city', note: 'A fire truck! (it roars down the street, lights flashing)',
  props: [{ id: 'truck', type: 'firetruck', at: [TRUCK0, -3], moves: [{ to: [TRUCK1, -3], when: 0, end: 1, ease: 'linear' }] }],
  c: [['max', [TRUCK0 + 2.9, -3.5], 90, 'drive', 'scared', { move: [TRUCK1 + 2.9, -3.5], ease: 'linear', params: { lift: 1.0 } }]],
  camera: camF(['max'], 1.8, [55, 15, 2.5, 0.0, 52], [20, 12, 2.0, 0.0, 52], 'linear') });
shot({ cue: ['L11', 7], ...TOWN, music: 'city', note: 'And I was driving it! (side close, Max gripping the wheel)',
  props: [{ id: 'truck', type: 'firetruck', at: [-2, -3], moves: [{ to: [12, -3], when: 0, end: 1, ease: 'linear' }] }],
  c: [['max', [0.9, -3.5], 90, 'drive', 'scared', { move: [14.9, -3.5], ease: 'linear', params: { lift: 1.0 } }]],
  pops: [["I'M 11!", RED, ['L11', 9], { size: 0.62 }]],
  camera: camF(['max'], 2.6, [62, 4.6, 0.2, 0.0, 52], [50, 4.0, 0.2, 0.0, 52], 'linear') });

// ================================================================ the biggest sneeze → cockpit
shot({ cue: ['L12', 0], ...TOWN, music: 'tense', note: 'Then came the biggest sneeze of my life (slow push into Max\'s face, nose twitching)',
  c: [['max', [0, 2.0], 0, 'sniff', 'surprised', { end: ['L12', 7, sneezeLead] }], ['max', null, 0, 'sneeze', 'surprised', { at: ['L12', 7, sneezeLead] }]],
  comic: [['ACHOOOO!', YEL, ['L12', 7], [0, 3.0, 2.3], 0.7]], fx: [{ type: 'poof', at: [0, 1.8, 2.6], cue: ['L12', 7], shake: 0.9 }],
  camera: camF(['max'], 1.8, [0, 3.6, 0.1, 0.0, 50], [0, 1.6, 0.0, 0.0, 50]) });
shot({ cue: ['L13', 0], ...COCK, ...SWAP, env: { alarm: false, dive: 0 }, music: 'tense', note: 'I opened my eyes in the cockpit of a plane',
  c: [['max', [-0.95, 0.55], 180, 'sit', 'surprised']], fx: [{ type: 'poof', at: [-0.95, 1.4, 0.4], cue: ['L13', 0] }],
  camera: look([-0.2, 1.8, -0.6], [-0.95, 1.4, 0.55], 60, [-0.3, 1.75, -0.45], [-0.95, 1.4, 0.55]) });
shot({ cue: ['L13', 10], ...SKY, music: 'tense', note: '…high above the clouds (the jet soaring over a sea of clouds)',
  props: [{ id: 'plane', type: 'plane', at: [-6, 0], y: 0, ry: 0.15, moves: [{ to: [6, 0], when: 0, end: 1, ease: 'linear' }] }],
  camera: look([8, 3, 22], [0, 0, 0], 50, [-5, 4.5, 19], [2, 0, 0]) });
shot({ cue: ['L14', 0], ...CLASS, ...SWAP, music: 'comedy', note: 'And the pilot? He\'s at Max\'s desk',
  c: [['pilot', SEAT.max, 180, 'sitPanic', 'surprised'], ...classmates('sitWrite', 'surprised')],
  fx: [{ type: 'poof', at: [0, 1.5, 1.3], cue: ['L14', 0] }], emotes: [['pilot', '!', ['L14', 2]]],
  camera: deskCam(3.0, 1.0, 50, 2.4) });
shot({ cue: ['L14', 8], ...CLASS, music: 'comedy', note: '…doing long division (calmly, very seriously)',
  c: [['pilot', SEAT.max, 180, 'sitWrite', 'determined']], pops: [['144 ÷ 12', WHITE, ['L14', 9], { size: 0.55, y: 0.78 }]],
  camera: deskCam(2.5, 0.6, 46, 2.1) });

// ================================================================ the dive
shot({ cue: ['L15', 0], ...SKY, env: { dive: 1 }, music: 'tense', note: 'The plane started to dive (nose drops, it plunges toward the clouds)',
  props: [{ id: 'plane', type: 'plane', at: [-4, 0], y: 2, ry: 0.15, moves: [{ to: [6, 0], y: -10, rz: -0.55, when: 0, end: 1, ease: 'in' }] }],
  camera: look([12, 6, 30], [0, -1, 0], 55, [10, 2, 28], [3, -6, 0]) });
shot({ cue: ['L15', 5], ...COCK, env: { alarm: true, dive: 0.7 }, music: 'tense', note: 'Alarms everywhere (red flashing, everything shaking)',
  c: [['max', [-0.95, 0.55], 180, 'sitPanic', 'scared']], fx: [{ type: 'impact', at: [-0.95, 1.8, -0.4], cue: ['L15', 5], shake: 0.8 }],
  camera: look([0.1, 2.2, 2.6], [-0.4, 1.7, -1.2], 62, [0.05, 2.1, 2.2], [-0.4, 1.7, -1.4]) });
shot({ cue: ['L15', 7], ...COCK, env: { alarm: true, dive: 0.7 }, music: 'tense', note: 'I needed one more sneeze… (Max scrunches his face, trying)',
  c: [['max', [-0.95, 0.55], 180, 'sniff', 'determined']],
  camera: look([-0.15, 1.9, -1.0], [-0.95, 1.45, 0.55], 50, [-0.25, 1.85, -0.85], [-0.95, 1.45, 0.55]) });
shot({ cue: ['L15', 12], ...COCK, env: { alarm: true, dive: 0.7 }, music: 'tense', note: '…but nothing came',
  c: [['max', [-0.95, 0.55], 180, 'sit', 'sad']], pops: [['. . .', WHITE, ['L15', 13], { size: 0.6, y: 0.7 }]],
  camera: look([-0.3, 1.75, -0.55], [-0.95, 1.45, 0.55], 48) });
shot({ cue: ['L16', 0], ...COCK, env: { alarm: true, dive: 0.7 }, music: 'tense', note: 'I searched everywhere (Max standing, frantically looking around)',
  c: [['max', [0, 0.9], 180, 'scared', 'scared']],
  camera: look([-1.1, 2.6, 2.9], [0, 1.6, 0.4], 62, [1.0, 2.5, 2.8], [0, 1.6, 0.4]) });
shot({ cue: ['L16', 3], ...COCK, env: { alarm: true, dive: 0.7 }, music: 'tense', note: 'Then I found it: the pilot\'s lunch on the co-pilot seat',
  props: [{ type: 'sandwich', at: [0.95, 0.55], y: 0.76, ry: 0.4 }], fx: [{ type: 'glint', at: [0.95, 1.0, 0.55], cue: ['L16', 5] }],
  pops: [['LUNCH', GOLD, ['L16', 9], { size: 0.5, y: 0.72 }]],
  camera: look([0.5, 2.1, -0.6], [0.95, 0.85, 0.55], 52, [0.55, 1.9, -0.5], [0.95, 0.85, 0.55]) });
shot({ cue: ['L16', 10], ...COCK, env: { alarm: true, dive: 0.7 }, music: 'tense', note: 'A PEPPER sandwich (big sparkle)',
  props: [{ type: 'sandwich', at: [0.95, 0.55], y: 0.76, ry: 0.4 }], fx: [{ type: 'glint', at: [0.95, 1.0, 0.55], cue: ['L16', 11] }],
  pops: [['PEPPER!', RED, ['L16', 11], { size: 0.62, y: 0.72 }]],
  camera: look([0.6, 1.75, -0.45], [0.95, 0.85, 0.55], 46) });
shot({ cue: ['L17', 0], ...COCK, env: { alarm: true, dive: 0.7 }, music: 'suspense', note: 'I took one big sniff (push in)',
  c: [['max', [0, 0.9], 180, 'sniff', 'determined', { prop: 'sandwich' }]],
  camera: look([0.25, 2.0, -0.65], [0, 1.75, 0.9], 52, [0.15, 1.95, -0.45], [0, 1.8, 0.9]) });
shot({ cue: ['L17', 5], ...COCK, env: { alarm: true, dive: 0.7 }, music: 'suspense', note: 'ACHOO! (the biggest one yet)',
  c: [['max', [0, 0.9], 180, 'sneeze', 'surprised', { at: 0, prop: 'sandwich' }]],
  comic: [['ACHOO!', YEL, ['L17', 5], [0.3, 2.6, 0.4], 0.6]], fx: [{ type: 'poof', at: [0, 1.7, 0.8], cue: ['L17', 5], shake: 1.0 }],
  camera: look([0.3, 2.3, -0.7], [0, 1.75, 0.9], 62) });

// ================================================================ PAYOFF
shot({ cue: ['L18', 0], ...COCK, ...SWAP, env: { alarm: false, dive: 0 }, music: 'adventure', note: 'The pilot was back in the sky (calmly levelling the plane)',
  c: [['pilot', [-0.95, 0.55], 180, 'drive', 'determined']], fx: [{ type: 'poof', at: [-0.95, 1.4, 0.4], cue: ['L18', 0] }],
  camera: look([0.2, 1.95, -1.1], [-0.95, 1.4, 0.55], 58, [0.1, 1.9, -0.95], [-0.95, 1.4, 0.55]) });
shot({ cue: ['L18', 7], ...CLASS, ...SWAP, music: 'adventure', note: 'And I was back at my desk',
  c: [['max', SEAT.max, 180, 'sit', 'surprised'], ...classmates('sitWrite', 'surprised')], fx: [{ type: 'poof', at: [0, 1.5, 1.3], cue: ['L18', 7] }],
  camera: deskCam(2.8, 0.9, 50, 2.2) });
shot({ cue: ['L19', 0], ...CLASS, music: 'adventure', note: 'My whole class was clapping',
  c: [['max', SEAT.max, 180, 'sit', 'surprised'], ['noah', SEAT.L1, 180, 'sitClap', 'laugh'], ['mia', SEAT.R1, 180, 'sitClap', 'laugh'], ['zed', SEAT.B0, 180, 'sitClap', 'laugh'], ['tot', SEAT.FL, 180, 'sitClap', 'laugh'],
    ['teacher', [2.2, -2.6], -30, 'clap', 'laugh']],
  camera: look([0.5, 4.4, -6.2], [0, 1.2, 1.0], 62, [0.3, 3.9, -5.4], [0, 1.2, 1.0]) });
shot({ cue: ['L20', 0], ...CLASS, music: 'adventure', note: 'The teacher handed back my test',
  c: [['max', SEAT.max, 180, 'sit', 'surprised'], ['teacher', [1.2, 0.1], -120, 'holdOut', 'happy', { prop: 'paper' }]],
  camera: look([-1.4, 2.6, -1.4], [0.5, 1.5, 0.9], 52) });
shot({ cue: ['L20', 6], ...CLASS, music: 'adventure', note: 'A PLUS! Perfect score (Max jumps up cheering, confetti)',
  c: [['max', [0, 1.0], 180, 'cheer', 'laugh', { prop: 'paper' }]], fx: [{ type: 'confetti', at: [0, 2.6, 1.0], cue: ['L20', 7] }],
  pops: [['A+', GOLD, ['L20', 6], { size: 0.9, dur: 0.8 }], ['100%', '#2fbf71', ['L20', 8], { size: 0.6, y: 0.6 }]],
  camera: look([0.3, 2.3, -2.0], [0, 1.75, 1.0], 54, [0.25, 2.1, -1.5], [0, 1.8, 1.0]) });
// montage: who really solved the test
shot({ cue: ['L21', 0], ...PIZZA, music: 'adventure', note: 'Because a chef… (Chef Tony spinning dough, winks)',
  c: [['chef', [0, -0.3], 0, 'toss', 'happy']], props: [{ type: 'dough', at: [0, -0.3], y: 3.0, moves: [{ y: 3.8, when: 0, end: 0.5, ease: 'out' }, { y: 3.0, when: 0.5, end: 1, ease: 'in' }] }],
  pops: [['Q1 ✔', '#2fbf71', ['L21', 2], { size: 0.55, y: 0.75 }]],
  camera: look([0.4, 2.4, 3.8], [0, 2.1, -0.3], 52) });
shot({ cue: ['L21', 3], ...STAD, music: 'adventure', note: '…a goalkeeper (making a diving save)',
  c: [['goalie', [0, -0.3], 0, 'goalie', 'happy']], pops: [['Q2 ✔', '#2fbf71', ['L21', 4], { size: 0.55, y: 0.75 }]],
  camera: look([0.6, 2.3, 4.6], [0, 1.6, -0.3], 52) });
shot({ cue: ['L21', 5], ...ZOO, music: 'adventure', note: '…a zookeeper (feeding the now-happy lion)',
  c: [['zookeeper', [1.0, 0.6], -50, 'holdOut', 'happy', { prop: 'bucket' }], ['lion', [-0.6, -0.1], 60, 'sit', 'happy']],
  pops: [['Q3 ✔', '#2fbf71', ['L21', 6], { size: 0.55, y: 0.75 }]],
  camera: look([2.4, 2.3, 4.8], [0.2, 1.4, 0.2], 52) });
shot({ cue: ['L21', 7], ...COCK, env: { alarm: false, dive: 0 }, music: 'adventure', note: '…and a pilot had each solved one question (pilot gives a thumbs up)',
  c: [['pilot', [-0.95, 0.55], 180, 'drive', 'happy']], pops: [['Q4 ✔', '#2fbf71', ['L21', 9], { size: 0.55, y: 0.75 }]],
  camera: look([0.2, 1.95, -1.1], [-0.95, 1.4, 0.55], 56) });

// ================================================================ ENDING
shot({ cue: ['L22', 0], ...HOME, music: 'comedy', note: 'The doctor says I\'ll grow out of it',
  c: [['doctor', [-1.0, 0.3], 40, 'talk', 'happy'], ['max', [0.9, 0.5], -40, 'idle', 'happy'], ['mum', [1.9, 0.1], -30, 'idle', 'happy']],
  camera: look([0.3, 2.6, 6.2], [0.2, 1.5, 0.3], 52, [0.25, 2.4, 5.2], [0.2, 1.5, 0.3]) });
shot({ cue: ['L23', 0], ...HOME, music: 'comedy', note: 'But tomorrow is the math final (Max turns to camera, sly grin)',
  c: [['max', [0.6, 0.6], 0, 'think', 'determined']], pops: [['MATH FINAL', RED, ['L23', 4], { size: 0.6 }]],
  camera: camF(['max'], 1.75, [0, 3.0, 0.1, 0.0, 48], [0, 2.2, 0.05, 0.0, 48]) });
shot({ cue: ['L24', 0], ...TOWN, music: 'comedy', note: 'So tonight, I\'m buying pepper (Max marches out of the grocery with a cart full of pepper)',
  props: [{ id: 'cart', type: 'shoppingcart', at: [-2.2, 3.0], ry: Math.PI / 2, moves: [{ to: [1.4, 3.0], when: 0, end: 1 }] },
    ...[[-0.25, -0.15], [0, 0.1], [0.25, -0.1], [-0.1, 0.18], [0.15, 0.2]].map(([dx, dz], k) => ({ id: `pep${k}`, type: 'pepper', at: [-2.2 + dx, 3.0 + dz], y: 0.62, moves: [{ to: [1.4 + dx, 3.0 + dz], when: 0, end: 1 }] }))],
  c: [['max', [-3.3, 3.0], 90, 'walk', 'laugh', { move: [0.3, 3.0], prop: 'pepper' }]],
  pops: [['PEPPER', RED, ['L24', 4], { size: 0.6 }]],
  camera: camF(['max'], 1.4, [-25, 6.2, 0.8, 0.2, 54], [15, 5.6, 0.7, 0.2, 54]) });

// ------------------------------------------------------------------ build
const starts = S.map((o) => (o.cue[0] === 'L1' && o.cue[1] === 0 ? 0 : cueTime(o.cue)));
for (let i = 1; i < starts.length; i++) if (!(starts[i] > starts[i - 1])) throw new Error(`shot ${i + 1} does not start after shot ${i}`);
const END = AUDIO_END + TAIL;

const scenes = S.map((o, i) => {
  const t0 = starts[i], t1 = i + 1 < S.length ? starts[i + 1] : END, dur = t1 - t0;
  const f = (cue) => Math.min(1, Math.max(0, (cueTime(cue) - (cue[2] || 0) - t0) / dur));
  const fr = (v, d) => (v === undefined ? d : Array.isArray(v) ? f(v) : v);
  const cast = [], actions = [];
  for (const [id, at, face, action, expr, x = {}] of o.c || []) {
    if (at) cast.push({ id, at, face });
    actions.push({ char: id, action, expr, face, at: fr(x.at, 0), end: fr(x.end, 1), move: x.move, ease: x.ease, params: x.params, prop: x.prop, glasses: false });
  }
  const props = [], propMoves = [];
  (o.props || []).forEach((p, k) => {
    const id = p.id || `p${k}`;
    props.push({ id, type: p.type, at: p.at, y: p.y, ry: p.ry, rx: p.rx, rz: p.rz, scale: p.scale, rockAmp: p.rockAmp });
    for (const m of p.moves || []) propMoves.push({ prop: id, to: m.to, y: m.y, rx: m.rx, rz: m.rz, ease: m.ease, spin: m.spin, when: m.when ?? 0, end: m.end ?? 1 });
  });
  const pops = (o.pops || []).map(([text, color, cue, x = {}]) => ({ text, color, when: f(cue), dur: x.dur ?? 1.0, y: x.y ?? 0.8, size: x.size ?? 0.8 }));
  const comic = (o.comic || []).map(([text, color, cue, at, size]) => ({ text, color, at, size, when: f(cue), dur: 0.9 }));
  const fx = (o.fx || []).map((e) => ({ type: e.type, at: e.at, when: e.cue ? f(e.cue) : 0, shake: e.shake }));
  const emotes = (o.emotes || []).map(([char, icon, cue]) => ({ char, icon, when: f(cue), dur: 1.1 }));
  const envEvents = (o.events || []).map(([key, value, cue]) => ({ key, value, when: f(cue) }));
  return {
    environment: o.environment, envSeed: o.envSeed, lighting: o.light, weather: o.weather || null, env: o.env, music: o.music,
    transition: o.transition || 'cut', transitionDur: o.transition === 'flash' ? 0.24 : undefined,
    props, cast,
    beats: [{ duration: +dur.toFixed(4), camera: [{ ...o.camera, at: 0, end: 1 }], actions, pops, comic, fx, emotes, propMoves, envEvents }],
    note: o.note, cue: o.cue, t0: +t0.toFixed(3), t1: +t1.toFixed(3),
  };
});

const storyboard = {
  title: 'Every Time I Sneeze, I Swap Places With a Stranger', seed: 5, style: 'bright', captionStyle: 'yellow', mood: 'comedy',
  narration: { audio: 'productions/sneeze-swap/audio/narration_james_raw_elevenlabs.mp3', alignment: 'productions/sneeze-swap/timing/alignment.json', offset: 0 },
  musicVolume: 0.26, sfxVolume: 0.8, voiceVolume: 1, animSpeed: PACE,
  characters: [...new Set(S.flatMap((o) => (o.c || []).map((c) => c[0])))],
  scenes,
};
fs.writeFileSync(path.join(HERE, 'storyboard.json'), JSON.stringify(storyboard, null, 1));
const cut = scenes.findIndex((sc) => sc.cue[0] === 'L12');
fs.writeFileSync(path.join(HERE, 'storyboard.preview.json'), JSON.stringify({ ...storyboard, title: storyboard.title + ' (preview)', scenes: scenes.slice(0, cut) }, null, 1));
const md = ['# "Every Time I Sneeze, I Swap Places With a Stranger" – Storyboard (timed to the real narration)', '',
  `Narration: James, ${AUDIO_END.toFixed(2)} s · video ${END.toFixed(2)} s · ${S.length} shots · average shot ${(END / S.length).toFixed(2)} s`, '',
  '| # | Time | Set | Shot | On-screen text |', '|---|---|---|---|---|'];
scenes.forEach((sc, i) => md.push(`| ${i + 1} | ${sc.t0.toFixed(2)}–${sc.t1.toFixed(2)} | ${sc.environment} | ${sc.note} | ${[...(sc.beats[0].pops || []), ...(sc.beats[0].comic || [])].map((p) => `**${p.text}**`).join(' ')} |`));
fs.writeFileSync(path.join(HERE, 'STORYBOARD.md'), md.join('\n') + '\n');
console.log(`storyboard: ${S.length} shots, ${END.toFixed(2)} s, shortest ${Math.min(...scenes.map((s) => s.t1 - s.t0)).toFixed(2)} s, longest ${Math.max(...scenes.map((s) => s.t1 - s.t0)).toFixed(2)} s, preview ${cut} shots`);
