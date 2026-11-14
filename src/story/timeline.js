// Converts a storyboard (scenes made of "beats") into an absolute-time
// timeline that the 3D player, the audio mixer and the subtitle writer
// all share. This single source of truth is what keeps picture, voice,
// sound effects and subtitles in sync.
import { CHARACTER_LIBRARY } from './characters.js';
import { Rng } from '../engine/rng.js';

export const LEAD_IN = 0.15;   // silence before a line inside its beat
export const PAD_AFTER = 0.3;  // breathing room after a line

/** Rough speech-duration estimate used before real TTS audio exists (browser preview). */
export function estimateLineTiming(text, wordsPerSecond = 3.0) {
  const words = splitWords(text);
  const weights = words.map((w) => w.replace(/[^\w']/g, '').length + 2 + (/[.!?]$/.test(w) ? 3 : /[,;:]$/.test(w) ? 1.5 : 0));
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const duration = Math.max(0.6, words.length / wordsPerSecond + 0.2);
  let acc = 0;
  const out = words.map((w, i) => {
    const start = (acc / total) * duration;
    acc += weights[i];
    const end = (acc / total) * duration;
    return { w, start, end: start + (end - start) * 0.92 };
  });
  return { duration, words: out, estimated: true };
}

export function splitWords(text) {
  return text.trim().split(/\s+/).filter(Boolean);
}

export function lineId(si, bi) { return `s${si}b${bi}`; }

/** Collect all spoken lines from a storyboard (for TTS). */
export function collectLines(storyboard) {
  const lines = [];
  storyboard.scenes.forEach((sc, si) => sc.beats.forEach((b, bi) => {
    if (b.line && b.line.text) lines.push({ id: lineId(si, bi), speaker: b.line.speaker || 'narrator', text: b.line.text });
  }));
  return lines;
}

const AUTO_SFX = {
  jump: [{ name: 'boing', at: 0.15 }],
  fall: [{ name: 'thud', at: 0.4 }],
  swordSwing: [{ name: 'whoosh', at: 0.35 }],
  cast: [{ name: 'sparkle', at: 0.1 }],
  cheer: [{ name: 'pop', at: 0.0 }],
  facepalm: [{ name: 'slap', at: 0.3 }],
  roar: [{ name: 'roar', at: 0.2 }],
  stomp: [{ name: 'stomp', at: 0.5 }],
  scared: [{ name: 'gasp', at: 0.05 }],
};
const FX_SFX = { debris: 'crash', impact: 'bonk', stars: 'bonk', sparkle: 'sparkle', magic: 'magic', confetti: 'party', smoke: 'poof', dust: 'poof', hearts: 'pop', fire: 'fire' };
const EMOTE_SFX = { '!': 'ding', '?': 'boop', '!?': 'ding', heart: 'pop', anger: 'grr', sweat: 'boop', idea: 'ding' };

export function buildTimeline(storyboard, opts = {}) {
  const fps = opts.fps || storyboard.fps || 30;
  const width = opts.width || 1080, height = opts.height || 1920;
  const target = opts.targetDuration ?? storyboard.targetDuration ?? null;
  const timings = opts.lineTimings || {};

  // 1) base duration of every beat
  const beatInfo = [];
  storyboard.scenes.forEach((sc, si) => sc.beats.forEach((b, bi) => {
    const id = lineId(si, bi);
    let timing = null;
    if (b.line && b.line.text) timing = timings[id] || estimateLineTiming(b.line.text);
    const speech = timing ? LEAD_IN + timing.duration + PAD_AFTER : 0;
    const dur = Math.max(b.minDuration || 1.0, speech);
    beatInfo.push({ si, bi, id, timing, dur, speech });
  }));

  // 2) stretch to the requested total duration (never squash speech)
  let total = beatInfo.reduce((a, b) => a + b.dur, 0);
  if (target && total < target) {
    const extra = target - total;
    const w = beatInfo.reduce((a, b) => a + b.dur, 0);
    for (const b of beatInfo) b.dur += extra * (b.dur / w);
    total = target;
  }

  // 3) lay everything out on the absolute clock
  const characters = {};
  const want = new Set(storyboard.characters || []);
  storyboard.scenes.forEach((sc) => sc.cast.forEach((c) => want.add(c.id)));
  for (const id of want) characters[id] = { ...(storyboard.characterOverrides?.[id] || {}), ...CHARACTER_LIBRARY[id] };

  const scenes = [], lines = [], sfx = [];
  let clock = 0, k = 0;
  storyboard.scenes.forEach((sc, si) => {
    const scene = {
      id: `scene${si}`, index: si, start: clock, end: clock, environment: sc.environment, envSeed: sc.envSeed ?? (storyboard.seed || 7) + si,
      cast: sc.cast.map((c) => ({ id: c.id, start: c.at || [0, 0], face: c.face ?? 0 })),
      tracks: {}, shots: [], fx: [], emotes: [], comic: [],
      transitionIn: si === 0 ? null : { type: sc.transition || 'fade', dur: sc.transitionDur || 0.5 },
      envOptions: sc.envOptions, lighting: sc.lighting || 'day', weather: sc.weather || null, ambience: sc.ambience || null, music: sc.music || null,
      props: (sc.props || []).map((p, i) => ({ id: p.id || `p${i}`, ...p })),
      lightningTimes: [],
    };
    if (si > 0 && scene.transitionIn.type !== 'cut') sfx.push({ t: clock - 0.12, name: 'swoosh', gain: 0.5 });
    for (const c of sc.cast) scene.tracks[c.id] = [];
    sc.beats.forEach((b, bi) => {
      const info = beatInfo[k++];
      const b0 = clock, b1 = clock + info.dur;
      const at = (f) => b0 + (f ?? 0) * info.dur;
      for (const a of b.actions || []) {
        const seg = {
          t0: at(a.at), t1: at(a.end ?? 1), action: a.action || 'idle', expr: a.expr, params: a.params, face: a.face, prop: a.prop, glasses: a.glasses,
        };
        if (a.move) seg.move = { to: a.move, ease: a.ease };
        (scene.tracks[a.char] ||= []).push(seg);
        for (const s of AUTO_SFX[seg.action] || []) {
          const reps = seg.action === 'swordSwing' ? Math.max(1, Math.floor((seg.t1 - seg.t0) / 0.9)) : 1;
          for (let r = 0; r < reps; r++) sfx.push({ t: seg.t0 + s.at + r * 0.9, name: s.name, gain: 0.8 });
        }
        const isCreature = CHARACTER_LIBRARY[a.char]?.kind === 'creature';
        if (seg.move && isCreature) {
          const sp = (seg.action === 'run' ? 1.8 : 1) * (a.params?.speed || 1);
          const step = 1 / (0.75 * 2 * sp);
          const big = CHARACTER_LIBRARY[a.char].scale || 1;
          for (let t = seg.t0 + step * 0.5; t < seg.t1; t += step) {
            sfx.push({ t, name: 'stomp', gain: 0.6 });
            scene.fx.push({ type: 'bigdust', at: a.char, t, shake: (a.shake ?? 0.45) * Math.min(2, big) });
          }
        } else if (seg.move && (seg.action === 'walk' || seg.action === 'run' || seg.action === 'sneak')) {
          const step = seg.action === 'run' ? 0.17 : 0.29;
          for (let t = seg.t0 + 0.1; t < seg.t1 - 0.05; t += step) sfx.push({ t, name: 'step', gain: seg.action === 'sneak' ? 0.2 : 0.35 });
        }
      }
      for (const cam of [].concat(b.camera || [])) {
        scene.shots.push({ ...cam, t0: at(cam.at), t1: at(cam.end ?? 1) });
      }
      for (const f of b.fx || []) {
        scene.fx.push({ ...f, t: at(f.when) });
        const name = f.sfx ?? FX_SFX[f.type];
        if (name) sfx.push({ t: at(f.when), name, gain: 0.8 });
      }
      for (const e of b.emotes || []) {
        scene.emotes.push({ char: e.char, icon: e.icon, t0: at(e.when), t1: at(e.when) + (e.dur || 1.2) });
        if (EMOTE_SFX[e.icon]) sfx.push({ t: at(e.when), name: EMOTE_SFX[e.icon], gain: 0.6 });
      }
      for (const c of b.comic || []) {
        scene.comic.push({ text: c.text, at: c.at, color: c.color, size: c.size, t0: at(c.when), t1: at(c.when) + (c.dur || 1.0) });
        sfx.push({ t: at(c.when), name: 'pop', gain: 0.7 });
      }
      for (const s of b.sfx || []) sfx.push({ t: at(s.when), name: s.name, gain: s.gain ?? 0.8 });
      for (const d of b.destroy || []) {
        const prop = scene.props.find((p) => p.id === d.prop);
        if (!prop) continue;
        prop.collapseT = at(d.when); prop.fallDir = d.dir ?? -1;
        scene.fx.push({ type: 'debris', at: [prop.at[0], 1.5, prop.at[1]], t: prop.collapseT, shake: d.shake ?? 1.2 });
        scene.fx.push({ type: 'bigdust', at: [prop.at[0], 0.5, prop.at[1]], t: prop.collapseT + 0.3 });
        sfx.push({ t: prop.collapseT, name: 'crash', gain: 1 });
      }

      if (info.timing) {
        const start = b0 + LEAD_IN;
        lines.push({
          id: info.id, speaker: b.line.speaker || 'narrator', text: b.line.text,
          start, end: start + info.timing.duration,
          words: info.timing.words.map((w) => ({ w: w.w, start: start + w.start, end: start + w.end })),
          envelope: info.timing.envelope, envelopeFps: info.timing.envelopeFps,
          file: info.timing.file, estimated: !!info.timing.estimated,
        });
      }
      clock = b1;
    });
    scene.end = clock;
    if (scene.weather === 'storm' || sc.lightning) {
      const rng = new Rng((storyboard.seed || 7) * 13 + si);
      for (let t = scene.start + (sc.lightningStart ?? 0.6); t < scene.end - 0.3; t += rng.float(2.2, 3.6)) {
        scene.lightningTimes.push(+t.toFixed(3));
        sfx.push({ t: t + 0.25, name: 'thunder', gain: 0.9 });
      }
    }
    for (const id of Object.keys(scene.tracks)) scene.tracks[id].sort((a, b) => a.t0 - b.t0);
    if (!scene.shots.length) scene.shots.push({ type: 'wide', t0: scene.start, t1: scene.end });
    scenes.push(scene);
  });

  sfx.sort((a, b) => a.t - b.t);
  return {
    version: 1, title: storyboard.title, seed: storyboard.seed || 7, fps, width, height,
    duration: clock, characters, scenes, lines, sfx: sfx.filter((s) => s.t >= 0 && s.t < clock),
    music: { mood: storyboard.mood || 'adventure', gain: storyboard.musicVolume ?? 0.35, bpm: storyboard.bpm },
    volumes: { narration: storyboard.voiceVolume ?? 1, music: storyboard.musicVolume ?? 0.35, effects: storyboard.sfxVolume ?? 1 },
    captionStyle: storyboard.captionStyle || 'yellow',
    narratorVoice: storyboard.narratorVoice || 'storyteller',
  };
}
