// Procedural, royalty-free audio. Everything here is generated from math,
// so there are no licensing issues with music or sound effects.
// All functions return mono Float32Array PCM at the given sample rate.
import { Rng } from '../engine/rng.js';

export const SR = 48000;

const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

function env(i, n, a, r, sr) {
  const t = i / sr, len = n / sr;
  if (t < a) return t / a;
  return Math.max(0, 1 - (t - a) / Math.max(0.001, r === undefined ? len - a : r));
}

// ---------------- sound effects ----------------
function makeSfx(name, sr = SR, seed = 1) {
  const rng = new Rng(seed);
  const noise = () => rng.float(-1, 1);
  const buf = (sec) => new Float32Array(Math.floor(sec * sr));
  let out;
  switch (name) {
    case 'step': {
      out = buf(0.07); let lp = 0;
      for (let i = 0; i < out.length; i++) { lp += (noise() - lp) * 0.15; out[i] = lp * Math.exp(-i / (sr * 0.012)) * 2.2; }
      break;
    }
    case 'boing': {
      out = buf(0.5); let ph = 0;
      for (let i = 0; i < out.length; i++) {
        const t = i / sr;
        const f = 180 + 420 * (1 - Math.exp(-t * 18)) + Math.sin(t * 60) * 60 * Math.exp(-t * 5);
        ph += (2 * Math.PI * f) / sr;
        out[i] = Math.sin(ph) * Math.exp(-t * 6) * 0.8;
      }
      break;
    }
    case 'thud': {
      out = buf(0.4); let ph = 0, lp = 0;
      for (let i = 0; i < out.length; i++) {
        const t = i / sr; const f = 40 + 80 * Math.exp(-t * 25);
        ph += (2 * Math.PI * f) / sr; lp += (noise() - lp) * 0.08;
        out[i] = (Math.sin(ph) * 1.0 + lp * 0.8) * Math.exp(-t * 11);
      }
      break;
    }
    case 'whoosh': case 'swoosh': {
      const len = name === 'swoosh' ? 0.5 : 0.32;
      out = buf(len); let lp = 0, bp = 0;
      for (let i = 0; i < out.length; i++) {
        const u = i / out.length;
        const c = 0.02 + 0.25 * Math.sin(u * Math.PI);
        lp += (noise() - lp) * c; bp += (lp - bp) * 0.5;
        out[i] = (lp - bp) * 3 * Math.sin(u * Math.PI) ** 1.5;
      }
      break;
    }
    case 'bonk': {
      out = buf(0.35);
      for (let i = 0; i < out.length; i++) {
        const t = i / sr;
        out[i] = (Math.sin(2 * Math.PI * 520 * t) * 0.6 + Math.sin(2 * Math.PI * 1310 * t) * 0.3) * Math.exp(-t * 18) + (i < 200 ? noise() * 0.5 : 0);
      }
      // metal ring for clank
      for (let i = 0; i < out.length; i++) { const t = i / sr; out[i] += (Math.sin(2 * Math.PI * 2210 * t) + Math.sin(2 * Math.PI * 3170 * t) * 0.6) * Math.exp(-t * 9) * 0.18; }
      break;
    }
    case 'sparkle': case 'magic': {
      out = buf(name === 'magic' ? 1.0 : 0.7);
      const notes = name === 'magic' ? [84, 88, 91, 96, 100, 103] : [88, 91, 95, 100];
      notes.forEach((m, k) => {
        const start = Math.floor(k * 0.07 * sr), f = midiHz(m);
        for (let i = start; i < out.length; i++) { const t = (i - start) / sr; out[i] += Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 7) * 0.25; }
      });
      break;
    }
    case 'party': {
      out = buf(0.9);
      for (let i = 0; i < out.length; i++) {
        const t = i / sr;
        out[i] = (i < sr * 0.05 ? noise() * Math.exp(-t * 60) : 0) + Math.sin(2 * Math.PI * (700 + t * 900) * t) * 0.15 * Math.exp(-t * 3);
      }
      for (let k = 0; k < 12; k++) { // confetti crackles
        const st = Math.floor(rng.float(0.05, 0.7) * sr);
        for (let i = 0; i < 300 && st + i < out.length; i++) out[st + i] += noise() * 0.25 * Math.exp(-i / 60);
      }
      break;
    }
    case 'poof': {
      out = buf(0.5); let lp = 0;
      for (let i = 0; i < out.length; i++) { const t = i / sr; lp += (noise() - lp) * 0.05; out[i] = lp * 3 * Math.exp(-t * 7) * Math.min(1, t * 80); }
      break;
    }
    case 'pop': {
      out = buf(0.1); let ph = 0;
      for (let i = 0; i < out.length; i++) { const t = i / sr; ph += (2 * Math.PI * (900 - t * 5000)) / sr; out[i] = Math.sin(ph) * Math.exp(-t * 40) * 0.7; }
      break;
    }
    case 'ding': {
      out = buf(0.8);
      for (let i = 0; i < out.length; i++) { const t = i / sr; out[i] = (Math.sin(2 * Math.PI * 1320 * t) + Math.sin(2 * Math.PI * 2640 * t) * 0.3 + Math.sin(2 * Math.PI * 3960 * t) * 0.1) * Math.exp(-t * 5) * 0.4; }
      break;
    }
    case 'boop': {
      out = buf(0.18);
      for (let i = 0; i < out.length; i++) { const t = i / sr; out[i] = Math.sin(2 * Math.PI * (420 - t * 400) * t) * Math.exp(-t * 14) * 0.6; }
      break;
    }
    case 'grr': {
      out = buf(0.45); let ph = 0;
      for (let i = 0; i < out.length; i++) { const t = i / sr; ph += (2 * Math.PI * (85 + Math.sin(t * 40) * 10)) / sr; out[i] = ((ph / Math.PI) % 2 - 1) * 0.3 * Math.sin((t / 0.45) * Math.PI); }
      break;
    }
    case 'fire': {
      out = buf(1.0); let lp = 0;
      for (let i = 0; i < out.length; i++) { const t = i / sr; lp += (noise() - lp) * 0.04; out[i] = lp * 2.5 * Math.sin((t / 1.0) * Math.PI) + (rng.chance(0.002) ? noise() * 0.8 : 0); }
      break;
    }
    case 'slap': {
      out = buf(0.12); let hp = 0, prev = 0;
      for (let i = 0; i < out.length; i++) { const n = noise(); hp = 0.8 * (hp + n - prev); prev = n; out[i] = hp * Math.exp(-i / (sr * 0.015)) * 0.9; }
      break;
    }
    default: out = buf(0.05);
  }
  return out;
}

const sfxCache = new Map();
export function sfx(name, sr = SR) {
  const k = name + sr;
  if (!sfxCache.has(k)) sfxCache.set(k, makeSfx(name, sr, name.length * 7919));
  return sfxCache.get(k);
}
export const SFX_NAMES = ['step', 'boing', 'thud', 'whoosh', 'swoosh', 'bonk', 'sparkle', 'magic', 'party', 'poof', 'pop', 'ding', 'boop', 'grr', 'fire', 'slap'];

// ---------------- music ----------------
export const MOODS = {
  adventure: { bpm: 120, root: 50, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 5, 3, 4], lead: 'pluck', drums: true },
  medieval:  { bpm: 104, root: 50, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 6, 3, 0], lead: 'lute', drums: true },
  comedy:    { bpm: 132, root: 53, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 3, 4, 0], lead: 'pizz', drums: true },
  city:      { bpm: 112, root: 48, scale: [0, 2, 4, 5, 7, 9, 11], prog: [5, 3, 0, 4], lead: 'pluck', drums: true },
  tense:     { bpm: 96, root: 45, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 6, 4], lead: 'pizz', drums: true },
  calm:      { bpm: 84, root: 52, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 4, 5, 3], lead: 'lute', drums: false },
};

function ks(f, sec, sr, rng, damp = 0.996, bright = 0.5) {
  // Karplus-Strong plucked string
  const n = Math.max(2, Math.round(sr / f));
  const ring = new Float32Array(n);
  for (let i = 0; i < n; i++) ring[i] = rng.float(-1, 1);
  const out = new Float32Array(Math.floor(sec * sr));
  let idx = 0, last = 0;
  for (let i = 0; i < out.length; i++) {
    const v = ring[idx];
    const nv = damp * (bright * v + (1 - bright) * last);
    last = v; ring[idx] = nv; out[i] = v;
    idx = (idx + 1) % n;
  }
  return out;
}

function add(dst, src, at, gain) {
  const s = Math.floor(at);
  for (let i = 0; i < src.length && s + i < dst.length; i++) if (s + i >= 0) dst[s + i] += src[i] * gain;
}

export function generateMusic(duration, moodName = 'adventure', seed = 1, sr = SR) {
  const mood = MOODS[moodName] || MOODS.adventure;
  const rng = new Rng(seed * 31 + 7);
  const n = Math.floor(duration * sr);
  const out = new Float32Array(n);
  const beat = 60 / mood.bpm, bar = beat * 4;
  const deg = (d, oct = 0) => mood.root + mood.scale[((d % 7) + 7) % 7] + 12 * (oct + Math.floor(d / 7));
  const bars = Math.ceil(duration / bar) + 1;
  // melody motif (2 bars, repeated with variation)
  const motif = Array.from({ length: 8 }, () => rng.pick([0, 2, 4, 4, 2, 7, 5, 4, 6]));
  for (let b = 0; b < bars; b++) {
    const chord = mood.prog[b % mood.prog.length];
    const t0 = b * bar;
    // bass: root on beats 1 and 3, fifth on the "and" of 4
    for (const [off, d, len] of [[0, 0, 0.9], [2, 0, 0.9], [3.5, 4, 0.45]]) {
      const f = midiHz(deg(chord + d, -1));
      const note = new Float32Array(Math.floor(len * beat * sr));
      let ph = 0;
      for (let i = 0; i < note.length; i++) { ph += (2 * Math.PI * f) / sr; const tri = (2 / Math.PI) * Math.asin(Math.sin(ph)); out[Math.floor((t0 + off * beat) * sr) + i] += tri * 0.32 * env(i, note.length, 0.005, undefined, sr) || 0; }
    }
    // pad: soft chord, 3 detuned sines per note
    const padLen = Math.floor(bar * sr);
    for (const d of [0, 2, 4]) {
      const f = midiHz(deg(chord + d, 0));
      const s0 = Math.floor(t0 * sr);
      for (let i = 0; i < padLen && s0 + i < n; i++) {
        const t = i / sr;
        const a = Math.min(1, t / 0.3) * Math.min(1, (bar - t) / 0.3);
        out[s0 + i] += (Math.sin(2 * Math.PI * f * t) + Math.sin(2 * Math.PI * f * 1.003 * t) * 0.6 + Math.sin(2 * Math.PI * f * 2 * t) * 0.15) * a * 0.045;
      }
    }
    // arpeggio / lead pluck in 8ths
    for (let k = 0; k < 8; k++) {
      const useMotif = b % 2 === 1 || k % 2 === 0;
      const d = useMotif ? motif[(k + (b % 4 === 3 ? 2 : 0)) % 8] : [0, 2, 4, 2][k % 4];
      const f = midiHz(deg(chord + d, 1));
      if (rng.chance(0.12)) continue;
      const len = mood.lead === 'pizz' ? 0.18 : 0.5;
      const pl = ks(f, len, sr, rng, mood.lead === 'lute' ? 0.995 : 0.993, mood.lead === 'pizz' ? 0.3 : 0.5);
      add(out, pl, (t0 + k * beat * 0.5) * sr, mood.lead === 'pizz' ? 0.22 : 0.17);
    }
    // drums
    if (mood.drums) {
      for (let q = 0; q < 4; q++) {
        const tq = (t0 + q * beat) * sr;
        if (q % 2 === 0) { // kick
          const k = new Float32Array(Math.floor(0.25 * sr)); let ph = 0;
          for (let i = 0; i < k.length; i++) { const t = i / sr; ph += (2 * Math.PI * (50 + 100 * Math.exp(-t * 30))) / sr; k[i] = Math.sin(ph) * Math.exp(-t * 14); }
          add(out, k, tq, 0.45);
        } else { // snare/clap
          const s = new Float32Array(Math.floor(0.18 * sr)); let lp = 0;
          for (let i = 0; i < s.length; i++) { const t = i / sr; lp += (rng.float(-1, 1) - lp) * 0.5; s[i] = (lp * 0.8 + Math.sin(2 * Math.PI * 190 * t) * 0.3) * Math.exp(-t * 22); }
          add(out, s, tq, 0.22);
        }
        for (const h of [0, 0.5]) { // hats
          const hh = new Float32Array(Math.floor(0.04 * sr)); let prev = 0;
          for (let i = 0; i < hh.length; i++) { const nz = rng.float(-1, 1); hh[i] = (nz - prev) * Math.exp(-i / (sr * 0.008)); prev = nz; }
          add(out, hh, tq + h * beat * sr, 0.08);
        }
      }
    }
  }
  // gentle fade in/out
  const fi = Math.floor(0.3 * sr), fo = Math.floor(1.2 * sr);
  for (let i = 0; i < fi && i < n; i++) out[i] *= i / fi;
  for (let i = 0; i < fo && i < n; i++) out[n - 1 - i] *= i / fo;
  return out;
}

// ---------------- mixing ----------------
/**
 * Mix narration clips, sound effects and music into one mono track.
 * clips: [{ pcm: Float32Array, at: seconds, gain }]
 * speech: [{ start, end }] – used to duck the music under the voice.
 */
export function mix({ duration, music, musicGain = 0.35, clips = [], speech = [], duck = 0.4, sr = SR }) {
  const n = Math.floor(duration * sr);
  const out = new Float32Array(n);
  if (music) {
    // ducking envelope
    const g = new Float32Array(n).fill(1);
    for (const s of speech) {
      const a = Math.floor((s.start - 0.15) * sr), b = Math.floor((s.end + 0.2) * sr);
      for (let i = Math.max(0, a); i < Math.min(n, b); i++) g[i] = duck;
    }
    // smooth the envelope (one-pole, ~80 ms)
    const k = 1 - Math.exp(-1 / (0.08 * sr));
    let v = 1;
    for (let i = 0; i < n; i++) { v += (g[i] - v) * k; g[i] = v; }
    for (let i = 0; i < n && i < music.length; i++) out[i] += music[i] * musicGain * g[i];
  }
  for (const c of clips) add(out, c.pcm, c.at * sr, c.gain ?? 1);
  // soft limiter + peak normalisation to about -1 dBFS
  let peak = 0;
  for (let i = 0; i < n; i++) { out[i] = Math.tanh(out[i] * 1.1); peak = Math.max(peak, Math.abs(out[i])); }
  const norm = peak > 0 ? 0.89 / peak : 1;
  for (let i = 0; i < n; i++) out[i] *= norm;
  return out;
}

export function encodeWav(pcm, sr = SR) {
  const n = pcm.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, pcm[i])) * 32767, true);
  return new Uint8Array(buf);
}
