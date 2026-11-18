// Storyboard for "The Trend Is Me" (HUSS), timed to the real narration.
//   node productions/huss-trend/storyboard_build.mjs   → storyboard.json, storyboard.preview.json, STORYBOARD.md
// Every shot starts on a spoken word (cue = [line id, word index]) and lasts until the next cue.
// Grammar of the reference style: a new shot every ~2 s, bright daytime town, punch-in on every
// HUSS!, fake phone-feed moments (view counter, comment wall, copycat grid).
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const AL = JSON.parse(fs.readFileSync(path.join(HERE, 'timing/alignment.json'), 'utf8'));
const LINES = Object.fromEntries(AL.lines.map((l) => [l.id, l]));
const AUDIO_END = AL.report.audio_s;
const TAIL = 1.4;
const PACE = 1.15;
const cueTime = ([id, wi = 0]) => { const w = LINES[id]?.words[wi]; if (!w) throw new Error(`bad cue ${id}:${wi}`); return w.start; };

const DEG = 180 / Math.PI;
function look(P, T, fov = 50, P2 = P, T2 = T, ease) {
  const st = (p, t) => ({ angle: Math.atan2(p[0] - T[0], p[2] - T[2]) * DEG, dist: Math.hypot(p[0] - T[0], p[2] - T[2]), height: p[1] - T[1], lookY: t[1] - T[1], fov });
  return { type: 'medium', target: T, scale: false, from: st(P, T), to: st(P2, T2), ease };
}

const TOWN = { environment: 'trendtown', envSeed: 9, light: 'env', music: 'comedy' };
const COURT = { environment: 'trendcourt', envSeed: 9, light: 'env', music: 'comedy' };
const FEED = { environment: 'trendfeed', envSeed: 9, light: 'env', music: 'comedy' };
const SCHOOL = { environment: 'classroom', envSeed: 9, light: 'env', music: 'comedy' };
const feedCam = (z1 = 13.9, z2 = 13.3) => look([0, 0, z1], [0, 0, 0], 60, [0, 0, z2], [0, 0, 0]);
const KAI_B = [-0.4, -9.0], KAI_LIFT = 1.56;               // Kai's spot on bleacher row 2
const face = (c, d = 2.4, h = 1.45, fov = 45, d2 = d - 0.5, side = 0) => look([c[0] + side, h + 0.1, c[1] + d], [c[0], h, c[1]], fov, [c[0] + side * 0.8, h + 0.05, c[1] + d2], [c[0], h, c[1]]);

const S = [];
const shot = (o) => S.push(o);
const DANCERS = (act = 'dance', expr = 'happy') => [['zoe', [-2.2, -3.6], 15, act, expr], ['leo', [-0.6, -4.4], 0, act, expr], ['mailman', [1.2, -3.4], -10, act, expr], ['mayor', [2.9, -4.6], -20, act, expr]];
const HUSS_SFX = (id, i0) => [0, 1, 2].map((k) => ({ name: 'pop', cue: [id, i0 + k], gain: 0.55 }));

// ================================================================ HOOK: everybody copies
shot({ cue: ['L1', 0], ...TOWN, note: 'Crane down over the town: the whole street doing the same dance',
  c: [...DANCERS(), ['kai', [0.2, 0.9], 0, 'idle', 'neutral']],
  camera: look([0, 9, 12], [0, 1.5, -6], 50, [0, 4.5, 9], [0, 1.4, -3]) });
shot({ cue: ['L1', 4], ...TOWN, note: 'Zoe and Leo, identical moves',
  c: [['zoe', [-0.8, -0.6], 15, 'dance', 'happy'], ['leo', [0.8, -0.6], -15, 'dance', 'happy']],
  camera: look([0.3, 1.9, 4.2], [0, 1.3, -0.6], 48, [0.2, 1.8, 3.4], [0, 1.3, -0.6]) });
shot({ cue: ['L2', 0], ...TOWN, note: 'One kid starts a dance (Zoe alone)',
  c: [['zoe', [0, 0], 0, 'dance', 'happy']], camera: face([0, 0], 3.0, 1.3, 46, 2.4, 0.6) });
shot({ cue: ['L2', 6], ...TOWN, note: 'The whole street joins in (low wide)',
  c: DANCERS(), camera: look([3.5, 0.9, 5.5], [0, 1.6, -4], 55, [2.2, 1.0, 4.4], [0, 1.6, -4]) });
shot({ cue: ['L3', 0], ...TOWN, note: 'Even the mailman (dancing with his mail)',
  c: [['mailman', [0, 0], 10, 'dance', 'laugh', { prop: 'paper' }]], camera: face([0, 0], 2.8, 1.5, 46, 2.2, -0.5) });
shot({ cue: ['L3', 3], ...TOWN, note: 'Even the mayor (town hall behind him)',
  c: [['mayor', [0, -1], 0, 'dance', 'laugh']], camera: look([0.4, 0.9, 2.2], [0, 2.4, -1], 52, [0.3, 0.9, 1.8], [0, 2.5, -1]) });
shot({ cue: ['L4', 0], ...TOWN, note: 'Everyone… except me (slow push on Kai standing still, dancers behind)',
  c: [...DANCERS(), ['kai', [0, 0.9], 0, 'idle', 'neutral']], camera: look([0, 1.5, 5.4], [0, 1.25, 0.9], 46, [0, 1.45, 3.4], [0, 1.3, 0.9], 'linear') });
shot({ cue: ['L5', 0], ...TOWN, note: 'Kai to camera: I make up my own stuff',
  c: [['kai', [0, 0.6], 0, 'talk', 'happy']], camera: face([0, 0.6], 2.6, 1.2, 46, 2.0, 0.4) });

// ================================================================ FIRST HUSS
shot({ cue: ['L6', 0], ...TOWN, note: 'One day I filmed myself (selfie at the bus stop)',
  c: [['kai', [-8.2, 0.6], 15, 'holdOut', 'happy', { prop: 'phone' }]], camera: look([-6.6, 1.6, 3.6], [-8.2, 1.2, 0.6], 48) });
shot({ cue: ['L6', 7], ...TOWN, note: 'HUSS! (punch-in)', sfx: HUSS_SFX('L6', 7),
  c: [['kai', [-8.2, 0.6], 15, 'huss', 'laugh']], camera: face([-8.2, 0.6], 3.0, 1.2, 46, 2.6, 0.8) });
shot({ cue: ['L6', 8], ...TOWN, note: 'HUSS! (closer)',
  c: [['kai', [-8.2, 0.6], 15, 'huss', 'laugh']], camera: face([-8.2, 0.6], 2.0, 1.25, 44, 1.8, -0.5) });
shot({ cue: ['L6', 9], ...TOWN, note: 'HUSS! (face)',
  c: [['kai', [-8.2, 0.6], 15, 'huss', 'laugh']], camera: face([-8.2, 0.6], 1.4, 1.3, 42, 1.25, 0.2) });
shot({ cue: ['L7', 0], ...FEED, env: { screen: 'views', views: 12 }, note: 'Twelve views', camera: feedCam() });
shot({ cue: ['L7', 2], ...TOWN, note: 'Everybody laughed (Leo and Zoe point and laugh)',
  c: [['leo', [-0.7, 0], 20, 'laugh', 'laugh'], ['zoe', [0.7, 0], -20, 'point', 'laugh']], camera: look([0, 1.3, 3.8], [0, 1.25, 0], 50, [0, 1.25, 3.2], [0, 1.25, 0]) });
shot({ cue: ['L8', 0], ...SCHOOL, note: 'At school: "Huss Boy" (classmates laughing, Kai slumps)',
  c: [['leo', [-1.3, -1.2], 20, 'laugh', 'laugh'], ['zoe', [1.3, -1.2], -20, 'laugh', 'laugh'], ['kai', [0, 0.6], 0, 'idle', 'sad']],
  pops: [['HUSS BOY', '#ff3030', ['L8', 5], { size: 0.65, y: 0.8, sfx: 'boing' }]],
  camera: look([0, 1.6, 4.4], [0, 1.2, -0.4], 50, [0, 1.5, 3.6], [0, 1.2, -0.4]) });

// ================================================================ NANA
shot({ cue: ['L9', 0], ...TOWN, note: 'Nana on the porch, watching his video on her phone',
  c: [['nana', [0, 0.4], 0, 'holdOut', 'happy', { prop: 'phone' }]], camera: face([0, 0.4], 2.6, 1.35, 46, 2.1, -0.4) });
shot({ cue: ['L9', 4], ...TOWN, note: 'Forty times!', pops: [['x40', '#ff3030', ['L9', 4], { size: 0.7, y: 0.78, sfx: 'ding' }]],
  c: [['nana', [0, 0.4], 0, 'holdOut', 'laugh', { prop: 'phone' }]], camera: face([0, 0.4], 1.6, 1.4, 42, 1.4, 0.3) });
shot({ cue: ['L9', 8], ...TOWN, note: '"Keep going, baby." (Nana and Kai, she pats his shoulder)',
  c: [['nana', [-0.5, 0.3], 30, 'talk', 'happy'], ['kai', [0.6, 0.5], -35, 'idle', 'happy']], camera: look([0.2, 1.5, 3.4], [0, 1.25, 0.4], 48, [0.15, 1.45, 2.8], [0, 1.25, 0.4]) });

// ================================================================ BUS STOP
shot({ cue: ['L10', 0], ...TOWN, note: 'So I did. At the bus stop (wide, bus stop and town hall)',
  c: [['kai', [-8.2, 0.6], 0, 'idle', 'happy']], camera: look([-5.2, 2.0, 6.0], [-8.2, 1.4, 0.2], 50) });
shot({ cue: ['L10', 7], ...TOWN, note: 'HUSS! HUSS! HUSS! at the bus stop', sfx: HUSS_SFX('L10', 7),
  c: [['kai', [-8.2, 0.6], 10, 'huss', 'laugh']], camera: face([-8.2, 0.6], 2.6, 1.0, 50, 2.2, -0.6) });
shot({ cue: ['L10', 9], ...TOWN, note: 'HUSS! (low hero angle)',
  c: [['kai', [-8.2, 0.6], 10, 'huss', 'laugh']], camera: look([-7.6, 0.5, 2.4], [-8.2, 1.5, 0.6], 54) });

// ================================================================ THE BIG GAME
shot({ cue: ['L11', 0], ...COURT, env: { score: '48 - 68' }, note: 'The big summer game (wide court, bleachers, banner)',
  c: [['kai', KAI_B, 0, 'idle', 'neutral', { params: { lift: KAI_LIFT } }]], camera: look([0, 4.5, 14], [0, 2.5, -6], 50, [0, 3.6, 11], [0, 2.6, -7]) });
shot({ cue: ['L11', 6], ...COURT, env: { score: '48 - 68', quiet: true }, music: 'tense', note: 'Losing by twenty (scoreboard)',
  pops: [], camera: look([0, 7.2, -6.5], [0, 7.4, -12.4], 46, [0, 7.3, -7.8], [0, 7.4, -12.4]) });
shot({ cue: ['L12', 0], ...COURT, env: { score: '48 - 68', quiet: true }, music: 'tense', note: 'Dead quiet crowd (Kai among them, sad)',
  c: [['kai', KAI_B, 0, 'idle', 'sad', { params: { lift: KAI_LIFT } }]], camera: look([1.5, 2.6, -1.5], [0, 2.0, -9], 50, [1.2, 2.6, -2.5], [0, 2.0, -9]) });
shot({ cue: ['L13', 0], ...COURT, env: { score: '48 - 68', quiet: true }, music: 'tense', note: 'Kai climbs the bleachers',
  c: [['kai', KAI_B, 0, 'climb', 'determined', { params: { rise: [0, KAI_LIFT] }, end: ['L13', 6] }]], camera: look([2.0, 1.4, -3.5], [-0.4, 1.6, -9], 50, [1.6, 2.0, -4.0], [-0.4, 2.4, -9]) });
shot({ cue: ['L13', 7], ...COURT, env: { score: '48 - 68', quiet: true }, note: 'HUSS! (low hero angle on the bleachers)', sfx: HUSS_SFX('L13', 7),
  c: [['kai', KAI_B, 0, 'huss', 'laugh', { params: { lift: KAI_LIFT } }]], camera: look([0.2, 1.4, -5.2], [-0.4, 2.9, -9], 54) });
shot({ cue: ['L13', 8], ...COURT, env: { score: '48 - 68', quiet: true }, note: 'HUSS! (face)',
  c: [['kai', KAI_B, 0, 'huss', 'laugh', { params: { lift: KAI_LIFT } }]], camera: face(KAI_B, 2.2, KAI_LIFT + 1.25, 44, 1.9, 0.5) });
shot({ cue: ['L14', 0], ...COURT, env: { score: '48 - 68', quiet: true }, note: 'One kid yells it back (Zoe stands up)',
  c: [['zoe', [3, -7.4], -10, 'huss', 'laugh', { params: { lift: 0.56 } }], ['kai', KAI_B, 20, 'huss', 'laugh', { params: { lift: KAI_LIFT } }]],
  camera: look([4.2, 1.9, -4.0], [3, 1.9, -7.4], 48) });
shot({ cue: ['L14', 5], ...COURT, env: { score: '48 - 68', cheer: true }, note: 'Then ten (crowd starts jumping)',
  c: [['kai', KAI_B, 0, 'huss', 'laugh', { params: { lift: KAI_LIFT } }]], camera: look([-3, 2.4, -2.5], [0, 2.4, -9], 50) });
shot({ cue: ['L14', 7], ...COURT, env: { score: '48 - 68', cheer: true }, note: 'The whole stadium! (wide, everyone shouting)',
  fx: [{ type: 'confetti', at: [0, 6, -9], cue: ['L14', 10] }],
  c: [['kai', KAI_B, 0, 'huss', 'laugh', { params: { lift: KAI_LIFT } }], ['zoe', [3, -7.4], -10, 'huss', 'laugh', { params: { lift: 0.56 } }]],
  camera: look([0, 3.2, 12], [0, 3.0, -8], 50, [0, 2.8, 8], [0, 3.0, -8]) });
shot({ cue: ['L15', 0], ...COURT, env: { score: '48 - 68', cheer: true }, events: [['score', '72 - 70', ['L15', 4]]], note: 'We came back and won (scoreboard flips)',
  sfx: [{ name: 'party', cue: ['L15', 4], gain: 0.8 }], fx: [{ type: 'confetti', at: [0, 8, -11], cue: ['L15', 4] }],
  camera: look([0, 6.0, -4.5], [0, 7.2, -12.4], 50, [0, 6.6, -6.5], [0, 7.4, -12.4]) });

// ================================================================ VIRAL
shot({ cue: ['L16', 0], ...FEED, env: { screen: 'views', from: 12, views: 2000000, t0: cueTime(['L16', 2]), t1: cueTime(['L16', 7]) }, note: 'Views roll from 12 to 2M',
  sfx: [{ name: 'sparkle', cue: ['L16', 6], gain: 0.7 }], camera: feedCam(14.2, 13.0) });
shot({ cue: ['L17', 0], ...TOWN, note: 'Now the mailman and the mayor say it',
  c: [['mayor', [-0.6, 0], 15, 'huss', 'laugh'], ['mailman', [0.8, 0], -15, 'huss', 'laugh']], camera: look([0, 1.6, 4.4], [0, 1.4, 0], 50, [0, 1.5, 3.6], [0, 1.4, 0]) });
shot({ cue: ['L17', 8], ...FEED, env: { screen: 'comments', views: 40000, t0: cueTime(['L17', 8]) }, note: 'Comment wall: HUSS! HUSS! HUSS!', sfx: HUSS_SFX('L17', 8), camera: feedCam(13.9, 13.4) });
shot({ cue: ['L18', 0], ...TOWN, note: 'Nana yells it louder than anybody',
  c: [['nana', [0, 0.4], 0, 'huss', 'laugh']], camera: face([0, 0.4], 2.4, 1.3, 46, 1.8, 0.4) });
shot({ cue: ['L19', 0], ...FEED, env: { screen: 'grid', t0: cueTime(['L19', 0]) }, note: 'Everybody copies the trend (copycat grid fills up)', camera: feedCam(13.9, 13.2) });
shot({ cue: ['L19', 4], ...TOWN, note: 'The whole town doing HUSS (crane up)',
  c: [...DANCERS('huss', 'laugh'), ['nana', [-3.4, 0.2], 20, 'huss', 'laugh']], camera: look([0, 2.0, 7], [0, 1.4, -3], 52, [0, 6.0, 10], [0, 1.4, -4]) });
shot({ cue: ['L20', 0], ...TOWN, note: 'But this time… the trend is me (slow push on Kai)',
  c: [['kai', [0, 0.9], 0, 'idle', 'happy'], ...DANCERS('idle', 'happy')], camera: look([0, 1.4, 4.6], [0, 1.25, 0.9], 46, [0, 1.35, 3.0], [0, 1.3, 0.9], 'linear') });
shot({ cue: ['L20', 7], ...TOWN, note: 'HUSS! HUSS! HUSS! (Kai and the whole town)', sfx: HUSS_SFX('L20', 7),
  fx: [{ type: 'confetti', at: [0, 5, -1], cue: ['L20', 9] }],
  c: [['kai', [0, 0.9], 0, 'huss', 'laugh'], ...DANCERS('huss', 'laugh'), ['nana', [-2.6, 0.4], 20, 'huss', 'laugh']],
  camera: look([0, 1.6, 4.6], [0, 1.4, -0.6], 50, [0, 1.5, 3.8], [0, 1.4, -0.6]) });

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
  const fx = (o.fx || []).map((e) => ({ type: e.type, at: e.at, when: e.cue ? f(e.cue) : 0, shake: e.shake, sfx: e.sfx || 'none' }));
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
  title: 'The Trend Is Me', seed: 9, style: 'bright', captionStyle: 'whitered', mood: 'comedy',
  captionRed: ['huss', 'trend', 'dance', 'views', 'million', 'laughed', 'quiet', 'won', 'twenty', 'stadium'],
  narration: { audio: 'productions/huss-trend/audio/narration_lukas_raw_elevenlabs.mp3', alignment: 'productions/huss-trend/timing/alignment.json', offset: 0 },
  musicVolume: 0.26, sfxVolume: 0.9, voiceVolume: 1, animSpeed: PACE,
  characters: [...new Set(S.flatMap((o) => (o.c || []).map((c) => c[0])))],
  scenes,
};
fs.writeFileSync(path.join(HERE, 'storyboard.json'), JSON.stringify(storyboard, null, 1));
const cut = scenes.findIndex((sc) => sc.cue[0] === 'L11');
fs.writeFileSync(path.join(HERE, 'storyboard.preview.json'), JSON.stringify({ ...storyboard, title: storyboard.title + ' (preview)', scenes: scenes.slice(0, cut) }, null, 1));
const md = ['# "The Trend Is Me" – Storyboard (timed to the real narration)', '',
  `Narration: Lukas (ElevenLabs), ${AUDIO_END.toFixed(2)} s · video ${END.toFixed(2)} s · ${S.length} shots · average shot ${(END / S.length).toFixed(2)} s`, '',
  '| # | Time | Set | Shot | On-screen text |', '|---|---|---|---|---|'];
scenes.forEach((sc, i) => md.push(`| ${i + 1} | ${sc.t0.toFixed(2)}–${sc.t1.toFixed(2)} | ${sc.environment} | ${sc.note} | ${(sc.beats[0].pops || []).map((p) => `**${p.text}**`).join(' ')} |`));
fs.writeFileSync(path.join(HERE, 'STORYBOARD.md'), md.join('\n') + '\n');
console.log(`storyboard: ${S.length} shots, ${END.toFixed(2)} s, shortest ${Math.min(...scenes.map((s) => s.t1 - s.t0)).toFixed(2)} s, longest ${Math.max(...scenes.map((s) => s.t1 - s.t0)).toFixed(2)} s`);
