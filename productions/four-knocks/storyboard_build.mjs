// Storyboard for "Four Knocks" (Don't Answer the Door After Midnight), timed to the real narration.
//   node productions/four-knocks/storyboard_build.mjs   → storyboard.json, storyboard.preview.json, STORYBOARD.md
// Every shot starts on a spoken word (cue = [line id, word index]) and lasts until the next cue.
// Horror grammar: slow push-ins, dark frames, a real knock on every counted number, door jolts,
// a flickering hall light, and a final push into the closet gap where two red eyes open.
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const AL = JSON.parse(fs.readFileSync(path.join(HERE, 'timing/alignment.json'), 'utf8'));
const LINES = Object.fromEntries(AL.lines.map((l) => [l.id, l]));
const AUDIO_END = AL.report.audio_s;
const TAIL = 1.8;
const PACE = 0.9;                        // slightly slower, heavier gestures for horror
const cueTime = ([id, wi = 0]) => { const w = LINES[id]?.words[wi]; if (!w) throw new Error(`bad cue ${id}:${wi}`); return w.start; };

const DEG = 180 / Math.PI;
function look(P, T, fov = 50, P2 = P, T2 = T, ease) {
  const st = (p, t) => ({ angle: Math.atan2(p[0] - T[0], p[2] - T[2]) * DEG, dist: Math.hypot(p[0] - T[0], p[2] - T[2]), height: p[1] - T[1], lookY: t[1] - T[1], fov });
  return { type: 'medium', target: T, scale: false, from: st(P, T), to: st(P2, T2), ease };
}

const RED = '#ff2a2a', WHITE = '#ffffff', BONE = '#f2ead8';
const STREET = { environment: 'nightstreet', envSeed: 13, light: 'env' };
const HALL = { environment: 'knockhouse', envSeed: 13, light: 'env' };
const GRAN = { environment: 'grandmaroom', envSeed: 13, light: 'env' };
const BX = 24, BZ = 0;                                   // Ben's bedroom origin (matches horror.js BEDROOM)
const B = (x, z) => [BX + x, BZ + z];
const DOOR = [0, 1.7, -3.95];                            // middle of the front door
const doorCam = (d = 2.6, h = 0.2, fov = 48, d2 = d - 0.6) => look([0.15, DOOR[1] + h, DOOR[2] + d], DOOR, fov, [0.1, DOOR[1] + h * 0.8, DOOR[2] + d2], DOOR);
const LOCKS = [0.5, 1.75, -3.95];
const lockCam = (d = 1.8, fov = 46, d2 = d - 0.4) => look([0.9, 1.95, LOCKS[2] + d], LOCKS, fov, [0.8, 1.9, LOCKS[2] + d2], LOCKS);

const S = [];
const shot = (o) => S.push(o);
const knock = (cue) => ['knock', cueTime(cue), cue];        // env event: door jolts at this exact time
const KN = (cue) => ({ name: 'knock', cue, gain: 1.0 });     // the knock sound itself

// ================================================================ HOOK
shot({ cue: ['L1', 0], ...STREET, env: { power: true }, music: 'suspense', note: 'A silent street of barred houses under a huge moon',
  camera: look([2, 7, 22], [0, 3, -8], 52, [1, 5.5, 15], [0, 3, -10]) });
shot({ cue: ['L1', 6], ...HALL, env: { visitor: false }, music: 'suspense', note: 'Never open the door after midnight (slow push into the locked front door)',
  camera: doorCam(4.8, 0.3, 50, 3.4) });

// ================================================================ GRANDMA'S SECRET
shot({ cue: ['L2', 0], ...GRAN, music: 'suspense', note: 'Grandma by the fire, Ben listening',
  c: [['grandma', [-0.7, -0.6], 35, 'talk', 'sad'], ['ben', [0.8, -0.2], -45, 'idle', 'surprised']],
  camera: look([0.4, 2.2, 4.6], [0, 1.4, -0.4], 50, [0.3, 2.0, 3.6], [0, 1.4, -0.4]) });
shot({ cue: ['L2', 5], ...GRAN, music: 'suspense', note: 'Real people knock three times (Grandma whispers)',
  c: [['grandma', [-0.7, -0.6], 35, 'talk', 'sad']], pops: [['3 = REAL', BONE, ['L2', 8], { size: 0.6, y: 0.78, sfx: 'knock' }]],
  camera: look([0.6, 1.95, 1.4], [-0.7, 1.75, -0.6], 46, [0.4, 1.9, 1.0], [-0.7, 1.78, -0.6]) });
shot({ cue: ['L2', 10], ...GRAN, music: 'suspense', note: 'It always knocks FOUR (extreme close, the fire dims)',
  c: [['grandma', [-0.7, -0.6], 35, 'idle', 'angry']], pops: [['4', RED, ['L2', 13], { size: 0.95, y: 0.76, sfx: 'sting', dur: 1.1 }]],
  camera: look([0.1, 1.9, 0.6], [-0.7, 1.82, -0.6], 42, [0.0, 1.88, 0.35], [-0.7, 1.84, -0.6]) });

// ================================================================ MIDNIGHT
shot({ cue: ['L3', 0], ...HALL, env: { hall: true }, music: 'suspense', note: 'Last Friday, home alone (Ben on his bed with his notebook)',
  c: [['ben', B(-2.9, -1.2), 20, 'sit', 'sad', { prop: 'paper', params: { lift: 0.95 } }]],
  camera: look([BX - 0.4, 2.8, BZ + 2.6], [BX - 2.9, 1.7, BZ - 1.2], 50, [BX - 0.8, 2.6, BZ + 1.8], [BX - 2.9, 1.7, BZ - 1.2]) });
shot({ cue: ['L4', 0], ...STREET, env: { power: true }, events: [['power', false, ['L4', 2]]], music: 'suspense', note: 'At exactly midnight… every light in town goes out',
  pops: [['12:00', BONE, ['L4', 1], { size: 0.6, y: 0.8, sfx: 'heartbeat' }]],
  camera: look([-1, 4, 14], [0, 3, -10], 52) });
shot({ cue: ['L4', 3], ...HALL, env: { visitor: false }, events: [knock(['L4', 3])], music: 'suspense', note: 'KNOCK. (the door jolts)',
  sfx: [KN(['L4', 3])], fx: [{ type: 'none', at: [0.6, 1.7, -3.7], cue: ['L4', 3], shake: 0.35 }],
  camera: lockCam(2.2, 46, 1.8) });
shot({ cue: ['L5', 0], ...HALL, env: { visitor: true }, music: 'suspense', note: '"Ben? It\'s Mom." Ben freezes on the stairs side of the hall',
  c: [['ben', [0.6, 1.4], 180, 'lookUp', 'surprised']],
  camera: look([0.2, 2.0, -2.6], [0.6, 1.5, 1.4], 50, [0.25, 1.95, -2.2], [0.6, 1.5, 1.4]) });
shot({ cue: ['L5', 3], ...HALL, env: { visitor: true }, music: 'suspense', note: '"I forgot my keys." (low shot: light under the door… and two feet)',
  camera: look([0.1, 0.45, -1.6], [0, 0.1, -3.9], 44, [0.05, 0.4, -2.2], [0, 0.1, -3.9]) });
shot({ cue: ['L6', 0], ...HALL, env: { visitor: true }, music: 'suspense', note: 'It was her voice (Ben, unsure)',
  c: [['ben', [0.6, 0.6], 180, 'idle', 'sad']],
  camera: look([0.45, 1.75, -0.8], [0.6, 1.6, 0.6], 46, [0.5, 1.72, -0.6], [0.6, 1.6, 0.6]) });
shot({ cue: ['L6', 4], ...HALL, env: { visitor: true }, music: 'suspense', note: 'Her EXACT voice (very slow push on the door)',
  camera: doorCam(3.4, 0.1, 46, 2.4) });
shot({ cue: ['L7', 0], ...HALL, env: { visitor: true }, music: 'suspense', note: 'I reached for the lock (Ben\'s hand creeps toward the brass locks)',
  c: [['ben', [0.25, -2.85], 180, 'holdOut', 'scared']],
  camera: look([2.2, 2.1, -1.4], [0.45, 1.6, -3.4], 48, [1.9, 2.0, -1.8], [0.5, 1.65, -3.5]) });
shot({ cue: ['L7', 5], ...HALL, env: { visitor: true }, music: 'suspense', note: '…and I started counting (Ben\'s face from the door side, whispering)',
  c: [['ben', [0.25, -2.6], 180, 'idle', 'determined']],
  camera: look([0.1, 1.72, -3.55], [0.25, 1.62, -2.6], 52) });

// ================================================================ ONE… TWO… THREE… FOUR
shot({ cue: ['L8', 0], ...HALL, env: { visitor: true }, events: [knock(['L8', 0])], music: 'suspense', note: 'ONE (knock, door jolts)',
  sfx: [KN(['L8', 0])], pops: [['1', WHITE, ['L8', 0], { size: 0.8, y: 0.72, sfx: 'none', dur: 0.75 }]],
  camera: lockCam(2.0, 46, 1.8) });
shot({ cue: ['L8', 1], ...HALL, env: { visitor: true }, events: [knock(['L8', 1])], music: 'suspense', note: 'TWO (Ben flinches)',
  sfx: [KN(['L8', 1])], c: [['ben', [0.25, -2.6], 180, 'scared', 'scared']], pops: [['2', WHITE, ['L8', 1], { size: 0.8, y: 0.72, sfx: 'none', dur: 0.75 }]],
  camera: look([0.1, 1.72, -3.5], [0.25, 1.62, -2.6], 50) });
shot({ cue: ['L8', 2], ...HALL, env: { visitor: true }, events: [knock(['L8', 2])], music: 'suspense', note: 'THREE (the locks rattle)',
  sfx: [KN(['L8', 2])], pops: [['3', WHITE, ['L8', 2], { size: 0.8, y: 0.72, sfx: 'none', dur: 0.75 }]],
  camera: look([0.9, 1.9, -2.7], [0.6, 1.75, -3.9], 44) });
shot({ cue: ['L9', 0], ...HALL, env: { visitor: true, flicker: true }, events: [knock(['L9', 0])], music: 'suspense', note: 'FOUR. (red 4, the hall light starts to flicker)',
  sfx: [KN(['L9', 0]), { name: 'sting', cue: ['L9', 0], gain: 0.9 }], pops: [['4', RED, ['L9', 0], { size: 1.0, y: 0.72, sfx: 'none', dur: 0.95 }]],
  fx: [{ type: 'none', at: [0.6, 1.7, -3.7], cue: ['L9', 0], shake: 0.6 }],
  camera: lockCam(1.5, 44, 1.2) });
shot({ cue: ['L10', 0], ...HALL, env: { visitor: true, flicker: true }, music: 'suspense', note: 'I froze (terrified close-up, flicker)',
  c: [['ben', [0.25, -2.6], 180, 'scared', 'scared']], sfx: [{ name: 'heartbeat', cue: ['L10', 0], gain: 0.9 }],
  camera: look([0.15, 1.75, -3.6], [0.25, 1.66, -2.6], 48) });
shot({ cue: ['L11', 0], ...HALL, env: { visitor: true, flicker: true }, events: [knock(['L11', 0]), knock(['L11', 5])], music: 'suspense',
  note: '"Ben, open the door. It\'s so cold out here." (wide hall, Ben backing away, door jolting)',
  sfx: [KN(['L11', 0]), KN(['L11', 5])], c: [['ben', [0.25, -2.6], 180, 'walk', 'scared', { move: [0.4, -0.2] }]],
  camera: look([2.6, 3.2, 3.6], [0.2, 1.6, -2.6], 54, [2.2, 2.9, 3.0], [0.2, 1.6, -2.4]) });

// ================================================================ THE PHONE
shot({ cue: ['L12', 0], ...HALL, env: { visitor: true, flicker: true, phone: true, phoneAt: [0.45, 0.2, 1.7] }, music: 'suspense', note: 'Then my phone buzzed (blue glow on Ben\'s face)',
  c: [['ben', [0.4, -0.2], 0, 'idle', 'surprised', { prop: 'phone' }]], sfx: [{ name: 'boop', cue: ['L12', 3], gain: 0.7 }],
  camera: look([0.5, 1.75, 1.3], [0.4, 1.55, -0.2], 46, [0.45, 1.72, 1.0], [0.4, 1.55, -0.2]) });
shot({ cue: ['L12', 4], ...HALL, env: { visitor: true, flicker: true, phone: true, phoneAt: [0.45, 0.2, 1.7] }, music: 'suspense', note: 'It was Mom (the screen reads MOM)',
  c: [['ben', [0.4, -0.2], 0, 'idle', 'scared', { prop: 'phone' }]], pops: [['MOM', '#8fd0ff', ['L12', 6], { size: 0.7, y: 0.75, sfx: 'none' }]],
  camera: look([0.35, 1.5, 0.9], [0.2, 1.3, -0.1], 44) });
shot({ cue: ['L13', 0], ...GRAN, music: 'calm', note: '"Hi sweetie, we\'re staying at Grandma\'s tonight." (warm, safe, far away)',
  c: [['mum', [0.4, -0.4], -10, 'talk', 'happy', { prop: 'phone' }], ['grandma', [-1.4, -1.2], 25, 'idle', 'happy']],
  camera: look([0.2, 2.1, 4.0], [-0.3, 1.5, -0.6], 50, [0.15, 1.95, 3.0], [-0.2, 1.55, -0.6]) });

// ================================================================ SILENCE… AND THE CLOSET
shot({ cue: ['L14', 0], ...HALL, env: { visitor: true, flicker: false }, music: 'suspense', note: 'I looked at the door (over Ben\'s shoulder)',
  c: [['ben', [0.4, -0.2], 180, 'idle', 'scared', { prop: 'phone' }]],
  camera: look([1.0, 2.0, 1.6], [0, 1.6, -3.9], 48, [0.8, 1.95, 1.0], [0, 1.6, -3.9]) });
shot({ cue: ['L14', 5], ...HALL, env: { visitor: true }, events: [['visitor', false, ['L14', 7]], ['hall', false, ['L14', 8]]], music: 'suspense',
  note: 'The knocking had stopped (the light under the door goes out… then the hall light)',
  camera: look([0.2, 1.4, -0.6], [0, 0.8, -3.9], 52, [0.15, 1.35, -1.1], [0, 0.8, -3.9]) });
shot({ cue: ['L15', 0], ...HALL, env: { eyes: false }, music: 'suspense', note: 'Then I heard it again (Ben in bed, blanket up to his chin)',
  c: [['ben', B(-2.9, -1.8), 0, 'sit', 'scared', { params: { lift: 0.95 } }]],
  camera: look([BX - 1.6, 2.4, BZ + 1.2], [BX - 2.9, 2.0, BZ - 1.8], 46, [BX - 1.9, 2.35, BZ + 0.7], [BX - 2.9, 2.0, BZ - 1.8]) });
shot({ cue: ['L15', 5], ...HALL, env: { eyes: false }, events: [['closet', cueTime(['L15', 5]), ['L15', 5]]], music: 'suspense', note: 'Knock. (Ben jolts)',
  sfx: [KN(['L15', 5])], c: [['ben', B(-2.9, -1.8), 0, 'sitPanic', 'scared', { params: { lift: 0.95 } }]],
  camera: look([BX - 1.9, 2.4, BZ + 0.6], [BX - 2.9, 2.0, BZ - 1.8], 46) });
shot({ cue: ['L15', 6], ...HALL, env: { eyes: false }, events: [['closet', cueTime(['L15', 6]), ['L15', 6]]], music: 'suspense', note: 'Knock. (the dark bedroom, wide)',
  sfx: [KN(['L15', 6])], c: [['ben', B(-2.9, -1.8), 0, 'sitPanic', 'scared', { params: { lift: 0.95 } }]],
  camera: look([BX + 2.6, 3.6, BZ + 4.0], [BX - 0.6, 1.4, BZ - 2.0], 56) });
shot({ cue: ['L15', 7], ...HALL, env: { eyes: false }, events: [['closet', cueTime(['L15', 7]), ['L15', 7]]], music: 'suspense', note: 'Knock. (Ben\'s eyes slide toward the closet)',
  sfx: [KN(['L15', 7])], c: [['ben', B(-2.9, -1.8), 40, 'sitPanic', 'scared', { params: { lift: 0.95 } }]],
  camera: look([BX - 1.6, 2.35, BZ + 0.3], [BX - 2.9, 2.0, BZ - 1.8], 44) });
shot({ cue: ['L15', 8], ...HALL, env: { eyes: false }, events: [['closet', cueTime(['L15', 8]), ['L15', 8]]], music: 'suspense', note: 'Knock. (over Ben\'s shoulder: the closet doors shiver)',
  sfx: [KN(['L15', 8]), { name: 'sting', cue: ['L15', 8], gain: 0.7 }], c: [['ben', B(-2.9, -1.8), 60, 'sitPanic', 'scared', { params: { lift: 0.95 } }]],
  camera: look([BX - 3.6, 2.2, BZ - 0.6], [BX + 0.6, 1.9, BZ - 3.4], 50, [BX - 3.3, 2.15, BZ - 0.9], [BX + 0.6, 1.9, BZ - 3.4]) });
shot({ cue: ['L16', 0], ...HALL, env: { eyes: false }, events: [['closet', cueTime(['L16', 2]), ['L16', 2]], ['eyes', true, ['L16', 9]]], music: 'suspense',
  note: 'But this time… it was coming from inside my closet (slow push into the black gap… two red eyes open)',
  sfx: [KN(['L16', 2]), { name: 'sting', cue: ['L16', 9], gain: 1.0 }],
  camera: look([BX + 0.6, 2.3, BZ + 1.2], [BX + 0.6, 2.4, BZ - 3.4], 50, [BX + 0.6, 2.5, BZ - 2.3], [BX + 0.6, 2.55, BZ - 3.4], 'linear') });

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
  const pops = (o.pops || []).map(([text, color, cue, x = {}]) => ({ text, color, when: f(cue), dur: x.dur ?? 1.0, y: x.y ?? 0.8, size: x.size ?? 0.8, sfx: x.sfx }));
  const fx = (o.fx || []).map((e) => ({ type: e.type, at: e.at, when: e.cue ? f(e.cue) : 0, shake: e.shake, sfx: 'none' }));
  const sfx = (o.sfx || []).map((s) => ({ name: s.name, when: f(s.cue), gain: s.gain }));
  const envEvents = (o.events || []).map(([key, value, cue]) => ({ key, value, when: f(cue) }));
  return {
    environment: o.environment, envSeed: o.envSeed, lighting: o.light, weather: null, env: o.env, music: o.music,
    transition: 'cut', props: [], cast,
    beats: [{ duration: +dur.toFixed(4), camera: [{ ...o.camera, at: 0, end: 1 }], actions, pops, fx, sfx, propMoves: [], envEvents }],
    note: o.note, cue: o.cue, t0: +t0.toFixed(3), t1: +t1.toFixed(3),
  };
});

const storyboard = {
  title: "Don't Answer the Door After Midnight", seed: 13, style: 'bright', captionStyle: 'yellow', mood: 'suspense',
  narration: { audio: 'productions/four-knocks/audio/narration_michael_raw_elevenlabs.mp3', alignment: 'productions/four-knocks/timing/alignment.json', offset: 0 },
  musicVolume: 0.22, sfxVolume: 0.95, voiceVolume: 1, animSpeed: PACE,
  characters: [...new Set(S.flatMap((o) => (o.c || []).map((c) => c[0])))],
  scenes,
};
fs.writeFileSync(path.join(HERE, 'storyboard.json'), JSON.stringify(storyboard, null, 1));
const cut = scenes.findIndex((sc) => sc.cue[0] === 'L12');
fs.writeFileSync(path.join(HERE, 'storyboard.preview.json'), JSON.stringify({ ...storyboard, title: storyboard.title + ' (preview)', scenes: scenes.slice(0, cut) }, null, 1));
const md = ['# "Don\'t Answer the Door After Midnight" – Storyboard (timed to the real narration)', '',
  `Narration: Michael C. Vincent, ${AUDIO_END.toFixed(2)} s · video ${END.toFixed(2)} s · ${S.length} shots · average shot ${(END / S.length).toFixed(2)} s`, '',
  '| # | Time | Set | Shot | On-screen text |', '|---|---|---|---|---|'];
scenes.forEach((sc, i) => md.push(`| ${i + 1} | ${sc.t0.toFixed(2)}–${sc.t1.toFixed(2)} | ${sc.environment} | ${sc.note} | ${(sc.beats[0].pops || []).map((p) => `**${p.text}**`).join(' ')} |`));
fs.writeFileSync(path.join(HERE, 'STORYBOARD.md'), md.join('\n') + '\n');
console.log(`storyboard: ${S.length} shots, ${END.toFixed(2)} s, shortest ${Math.min(...scenes.map((s) => s.t1 - s.t0)).toFixed(2)} s, longest ${Math.max(...scenes.map((s) => s.t1 - s.t0)).toFixed(2)} s`);
