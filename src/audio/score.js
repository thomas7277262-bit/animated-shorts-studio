// Royalty-free cinematic "motivational anthem" composer.
// Builds a stereo track with real song structure from a section plan:
//   intro (piano + pad) → build (arps, kick, snare roll, riser) → break
//   (silence) → drop (supersaw chords with side-chain pump, bass, drums,
//   lead hook, crashes) → outro (final chord, reverb tail).
// Everything is synthesized from math, so there are no licensing issues.
// Films use the same bar grid for their cues, so picture and music line up
// by construction.
import { Rng } from '../engine/rng.js';

const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

class Track {
  constructor(n) { this.L = new Float32Array(n); this.R = new Float32Array(n); }
}

function addMono(tr, buf, at, gain, pan = 0) {
  const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  const s = Math.floor(at), n = tr.L.length;
  for (let i = 0; i < buf.length; i++) { const j = s + i; if (j < 0 || j >= n) continue; tr.L[j] += buf[i] * gl; tr.R[j] += buf[i] * gr; }
}

// ---------------- instruments (return mono buffers) ----------------
function piano(f, dur, sr, vel = 1) {
  const n = Math.floor((dur + 1.2) * sr), out = new Float32Array(n);
  const parts = [[1, 1, 1.0], [2, 0.5, 1.6], [3, 0.25, 2.4], [4, 0.12, 3.2], [5, 0.06, 4]];
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    let v = 0;
    for (const [h, a, d] of parts) v += Math.sin(2 * Math.PI * f * h * (1 + 0.0004 * h * h) * t) * a * Math.exp(-t * d * (0.9 + f / 900));
    const rel = t > dur ? Math.exp(-(t - dur) * 9) : 1;
    out[i] = v * Math.min(1, t / 0.004) * rel * 0.35 * vel;
  }
  return out;
}

function saws(f, dur, sr, { voices = 5, detune = 0.012, cutoff = 2200, attack = 0.02, release = 0.25, seed = 1 } = {}) {
  const n = Math.floor((dur + release) * sr), out = new Float32Array(n);
  const rng = new Rng(seed);
  const ph = Array.from({ length: voices }, () => rng.float(0, 1));
  const fr = Array.from({ length: voices }, (_, k) => f * (1 + detune * (k / Math.max(1, voices - 1) - 0.5) * 2));
  const a = 1 - Math.exp(-2 * Math.PI * cutoff / sr);
  let lp = 0, lp2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    let v = 0;
    for (let k = 0; k < voices; k++) { ph[k] += fr[k] / sr; ph[k] -= Math.floor(ph[k]); v += ph[k] * 2 - 1; }
    v /= Math.sqrt(voices);
    lp += (v - lp) * a; lp2 += (lp - lp2) * a;
    const e = Math.min(1, t / attack) * (t > dur ? Math.max(0, 1 - (t - dur) / release) : 1);
    out[i] = lp2 * e;
  }
  return out;
}

// bowed-string ensemble: detuned saws with vibrato, slow attack, darkened
function strings(f, dur, sr, { attack = 0.5, release = 0.9, cutoff = 2400, seed = 3 } = {}) {
  const n = Math.floor((dur + release) * sr), out = new Float32Array(n);
  const rng = new Rng(seed);
  const V = 6, ph = Array.from({ length: V }, () => rng.float(0, 1)), det = Array.from({ length: V }, (_, k) => 1 + (k / (V - 1) - 0.5) * 0.014);
  const vr = Array.from({ length: V }, () => rng.float(4.6, 5.8)), vp = Array.from({ length: V }, () => rng.float(0, 6));
  const a = 1 - Math.exp(-2 * Math.PI * cutoff / sr);
  let l1 = 0, l2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    let v = 0;
    for (let k = 0; k < V; k++) { ph[k] += f * det[k] * (1 + 0.004 * Math.sin(2 * Math.PI * vr[k] * t + vp[k]) * Math.min(1, t / 0.6)) / sr; ph[k] -= Math.floor(ph[k]); v += ph[k] * 2 - 1; }
    v /= Math.sqrt(V);
    l1 += (v - l1) * a; l2 += (l1 - l2) * a;
    const e = Math.min(1, t / attack) ** 1.5 * (t > dur ? Math.max(0, 1 - (t - dur) / release) : 1);
    out[i] = l2 * e;
  }
  return out;
}

function sub(f, dur, sr) {
  const n = Math.floor(dur * sr), out = new Float32Array(n);
  let ph = 0, lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    ph += f / sr; ph -= Math.floor(ph);
    const saw = ph * 2 - 1;
    lp += (saw - lp) * 0.06;
    out[i] = (Math.sin(2 * Math.PI * ph) * 0.8 + lp * 0.5) * Math.min(1, t / 0.006) * Math.min(1, (dur - t) / 0.03);
  }
  return out;
}

function kick(sr, punch = 1) {
  const n = Math.floor(0.45 * sr), out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    ph += (45 + 140 * Math.exp(-t * 28)) / sr;
    out[i] = (Math.sin(2 * Math.PI * ph) * Math.exp(-t * 7) + (i < sr * 0.003 ? (1 - i / (sr * 0.003)) * 0.6 : 0)) * punch;
  }
  return out;
}
function noiseHit(sr, rng, len, decay, hp = 0.5, tone = 0) {
  const n = Math.floor(len * sr), out = new Float32Array(n);
  let prev = 0, lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr, x = rng.float(-1, 1);
    const h = x - prev * hp; prev = x;
    lp += (h - lp) * 0.6;
    out[i] = (lp + Math.sin(2 * Math.PI * tone * t) * (tone ? 0.4 : 0)) * Math.exp(-t * decay);
  }
  return out;
}
function clap(sr, rng) {
  const out = new Float32Array(Math.floor(0.3 * sr));
  for (const off of [0, 0.011, 0.022]) {
    const h = noiseHit(sr, rng, 0.25, off === 0.022 ? 14 : 60, 0.85);
    for (let i = 0; i < h.length; i++) { const j = i + Math.floor(off * sr); if (j < out.length) out[j] += h[i] * 0.7; }
  }
  return out;
}
function riser(sr, rng, len) {
  const n = Math.floor(len * sr), out = new Float32Array(n);
  let lp = 0, bp = 0, ph = 0;
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const c = 0.01 + 0.5 * u * u;
    lp += (rng.float(-1, 1) - lp) * c; bp += (lp - bp) * c;
    ph += (220 + 1400 * u * u) / sr;
    out[i] = ((lp - bp) * 2.2 + Math.sin(2 * Math.PI * ph) * 0.12) * u * u;
  }
  return out;
}
function impact(sr, rng) {
  const n = Math.floor(2.5 * sr), out = new Float32Array(n);
  let ph = 0, lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    ph += (32 + 60 * Math.exp(-t * 6)) / sr;
    lp += (rng.float(-1, 1) - lp) * 0.04;
    out[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t * 1.6) + lp * Math.exp(-t * 2.5) * 1.6;
  }
  return out;
}

// simple stereo reverb (Schroeder/Freeverb style)
function reverb(tr, mix = 0.25, size = 0.84, sr = 48000) {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356], aps = [556, 441, 341];
  const out = new Track(tr.L.length);
  for (const [src, dst, spread] of [[tr.L, out.L, 0], [tr.R, out.R, 23]]) {
    const wet = new Float32Array(src.length);
    for (const c of combs) {
      const d = Math.round((c + spread) * sr / 44100), buf = new Float32Array(d);
      let idx = 0, lp = 0;
      for (let i = 0; i < src.length; i++) {
        const y = buf[idx];
        lp = y * 0.7 + lp * 0.3;
        buf[idx] = src[i] * 0.015 + lp * size;
        wet[i] += y;
        idx = (idx + 1) % d;
      }
    }
    for (const a of aps) {
      const d = Math.round((a + spread) * sr / 44100), buf = new Float32Array(d);
      let idx = 0;
      for (let i = 0; i < wet.length; i++) { const b = buf[idx], x = wet[i]; buf[idx] = x + b * 0.5; wet[i] = b - x; idx = (idx + 1) % d; }
    }
    for (let i = 0; i < src.length; i++) dst[i] = src[i] + wet[i] * mix;
  }
  return out;
}

/**
 * Compose an anthem.
 * plan: { bpm, bars: total bars, chords: [[bass, [notes...]], ...] (one per bar, cycling),
 *         sections: { intro:[a,b), build:[a,b), breakAt: seconds, drop:[a,b), outro:[a,b) } in bars,
 *         lead: [[barOffsetInPhrase(beats), midi, lenBeats], ...] phrases, crashes: [bar...], tail }
 * Returns { L, R, sr, duration }.
 */
export function composeAnthem(plan, sr = 48000) {
  const bpm = plan.bpm, beat = 60 / bpm, bar = beat * 4;
  const duration = plan.duration ?? plan.bars * bar + (plan.tail ?? 2.5);
  const n = Math.floor(duration * sr);
  const rng = new Rng(plan.seed ?? 5);
  const S = plan.sections;
  const inSec = (b, [a, z]) => b >= a && b < z;
  const chordAt = (b) => plan.chords[b % plan.chords.length];
  const T = (b, bt = 0) => (b * bar + bt * beat) * sr;

  const music = new Track(n);     // pumped by side-chain in the drop
  const drums = new Track(n);
  const fx = new Track(n);
  const breakS = Math.floor(S.breakAt * sr), dropS = Math.floor(S.drop[0] * bar * sr);

  for (let b = 0; b < plan.bars; b++) {
    const [bassN, notes] = chordAt(b);
    const intro = inSec(b, S.intro), build = inSec(b, S.build), drop = inSec(b, S.drop), outro = inSec(b, S.outro);
    // ---- piano ----
    if (intro || build) {
      const pat = intro ? [0, 1, 2, 3] : [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5];
      pat.forEach((bt, k) => {
        const m = [notes[0], notes[1], notes[2], notes[1] + 12][k % 4];
        addMono(music, piano(midiHz(m), beat * 0.9, sr, intro ? 0.8 : 0.65), T(b, bt), 0.5, (k % 2 ? 0.25 : -0.25));
      });
      addMono(music, piano(midiHz(bassN - 12), bar * 0.95, sr, 0.9), T(b), 0.5, 0);
    }
    if (drop || outro) {
      // piano doubles the chord on the downbeat
      for (const m of notes) addMono(music, piano(midiHz(m + 12), beat * 1.5, sr, 0.6), T(b), 0.35, 0);
    }
    // ---- pad (intro, build, outro) ----
    if (intro || build || outro) {
      const len = outro ? (plan.bars - b) * bar + 1.5 : bar;
      if (!outro || b === S.outro[0]) {
        for (const m of notes) {
          const p = saws(midiHz(m), len, sr, { voices: 3, detune: 0.006, cutoff: build ? 900 + 600 * (b - S.build[0]) : 700, attack: 0.5, release: 0.8, seed: m + b });
          addMono(music, p, T(b), outro ? 0.16 : 0.1, 0);
        }
      }
    }
    // ---- strings: enter in the build, carry the drop and the outro ----
    if (build || drop || (outro && b === S.outro[0])) {
      const len = outro ? (plan.bars - b) * bar + 0.5 : bar;
      const g = build ? 0.05 + 0.03 * (b - S.build[0]) : outro ? 0.12 : 0.1;
      for (const m of notes) for (const [oct, pan] of [[12, -0.45], [0, 0.45]]) {
        addMono(music, strings(midiHz(m + oct), len, sr, { attack: build ? 0.8 : 0.25, release: outro ? 1.8 : 0.5, cutoff: build ? 1600 + 400 * (b - S.build[0]) : 2600, seed: m + b * 3 + oct }), T(b), g, pan);
      }
    }
    // ---- drop: supersaw chords, bass, lead ----
    if (drop) {
      for (const m of notes) for (const [oct, pan] of [[0, -0.6], [12, 0.6]]) {
        addMono(music, saws(midiHz(m + oct), bar, sr, { voices: 7, detune: 0.016, cutoff: 2600, attack: 0.01, release: 0.05, seed: m * 7 + b + oct }), T(b), 0.075, pan);
      }
      for (let q = 0; q < 8; q++) addMono(music, sub(midiHz(bassN - 12), beat * 0.45, sr), T(b, q * 0.5), 0.42, 0);
    }
    if (outro && b === S.outro[0]) {
      for (const m of notes) for (const [oct, pan] of [[0, -0.5], [12, 0.5]]) addMono(music, saws(midiHz(m + oct), bar * 1.6, sr, { voices: 7, detune: 0.016, cutoff: 2600, attack: 0.01, release: 1.6, seed: m + 99 }), T(b), 0.1, pan);
      addMono(music, sub(midiHz(bassN - 12), bar * 1.4, sr), T(b), 0.4, 0);
    }
    // ---- drums ----
    if (build && b >= S.build[0] + 1) for (let q = 0; q < 4; q++) addMono(drums, kick(sr, 0.8), T(b, q), 0.55, 0);
    if (intro && b >= S.intro[0] + 2) addMono(drums, kick(sr, 0.6), T(b), 0.45, 0); // heartbeat-like
    if (drop) {
      for (let q = 0; q < 4; q++) addMono(drums, kick(sr, 1), T(b, q), 0.75, 0);
      for (const q of [1, 3]) addMono(drums, clap(sr, rng), T(b, q), 0.32, 0);
      for (let s = 0; s < 16; s++) addMono(drums, noiseHit(sr, rng, 0.05, s % 2 ? 90 : 55, 0.97), T(b, s * 0.25), s % 4 === 2 ? 0.14 : 0.08, s % 2 ? 0.35 : -0.35);
    }
  }
  // snare roll + riser over the build (accelerating), ends at the break
  {
    const r0 = S.build[0] + 1;
    const t0 = r0 * bar, t1 = S.breakAt;
    let t = t0;
    while (t < t1 - 0.02) {
      const u = (t - t0) / (t1 - t0);
      addMono(drums, noiseHit(sr, rng, 0.12, 30, 0.6, 210), t * sr, 0.08 + 0.2 * u, 0);
      t += u < 0.4 ? beat : u < 0.7 ? beat / 2 : u < 0.9 ? beat / 4 : beat / 8;
    }
    const rz = riser(sr, rng, t1 - (S.build[0] + 0.5) * bar);
    addMono(fx, rz, (S.build[0] + 0.5) * bar * sr, 0.22, 0);
  }
  // lead hook in the drop (own track, ping-pong echo)
  const leadTr = new Track(n);
  if (plan.lead) {
    const phraseBars = 2;
    for (let b = S.drop[0], k = 0; b < S.drop[1]; b += phraseBars, k++) {
      const phrase = plan.lead[k % plan.lead.length];
      for (const [bt, m, len] of phrase) {
        const v = saws(midiHz(m), len * beat * 0.95, sr, { voices: 3, detune: 0.008, cutoff: 4200, attack: 0.008, release: 0.12, seed: m + k });
        // gentle vibrato-free square-ish lead + piano double for definition
        addMono(leadTr, v, T(b, bt), 0.13, 0.1);
        addMono(leadTr, piano(midiHz(m), len * beat, sr, 0.55), T(b, bt), 0.24, -0.1);
      }
    }
  }
  {
    const d = Math.floor(beat * 0.75 * sr);
    for (let i = d; i < n; i++) { leadTr.L[i] += leadTr.R[i - d] * 0.32; leadTr.R[i] += leadTr.L[i - d] * 0.32; }
    for (let i = 0; i < n; i++) { music.L[i] += leadTr.L[i]; music.R[i] += leadTr.R[i]; }
  }
  // crashes and the drop impact
  for (const cb of plan.crashes || []) addMono(fx, noiseHit(sr, rng, 2.2, 1.8, 0.95), T(cb), 0.22, 0);
  addMono(fx, impact(sr, rng), dropS, 0.55, 0);
  if (S.outro) addMono(fx, impact(sr, rng), T(S.outro[0]), 0.4, 0);

  // break: hard silence before the drop (everything but a soft tail)
  for (const tr of [music, drums, fx]) {
    for (let i = breakS; i < dropS && i < n; i++) {
      const k = Math.max(0, 1 - (i - breakS) / (0.06 * sr));
      tr.L[i] *= k; tr.R[i] *= k;
    }
  }
  // side-chain pump: duck music after each drop kick
  for (let b = S.drop[0]; b < S.drop[1]; b++) for (let q = 0; q < 4; q++) {
    const s = Math.floor(T(b, q)), len = Math.floor(beat * sr);
    for (let i = 0; i < len && s + i < n; i++) { const g = 0.35 + 0.65 * Math.min(1, i / (beat * sr * 0.55)); music.L[s + i] *= g; music.R[s + i] *= g; }
  }
  const verbM = reverb(music, 0.3, 0.86, sr);
  const verbF = reverb(fx, 0.35, 0.88, sr);
  const L = new Float32Array(n), R = new Float32Array(n);
  // master glue compressor (RMS detector, ratio 3:1) then soft clip
  let env2 = 0, peak = 0;
  const att = 1 - Math.exp(-1 / (0.01 * sr)), rel = 1 - Math.exp(-1 / (0.18 * sr));
  const thr = 0.22;
  for (let i = 0; i < n; i++) {
    const l = verbM.L[i] + drums.L[i] + verbF.L[i], r = verbM.R[i] + drums.R[i] + verbF.R[i];
    const lvl = (l * l + r * r) / 2;
    env2 += (lvl - env2) * (lvl > env2 ? att : rel);
    const rms = Math.sqrt(env2);
    const g = rms > thr ? Math.pow(thr / rms, 1 - 1 / 3) : 1;
    L[i] = Math.tanh(l * g * 1.6);
    R[i] = Math.tanh(r * g * 1.6);
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
  const fo = Math.floor(0.8 * sr);
  const norm = 0.84 / (peak || 1);
  for (let i = 0; i < n; i++) { const f = i > n - fo ? (n - i) / fo : 1; L[i] *= norm * f; R[i] *= norm * f; }
  return { L, R, sr, duration };
}

export function encodeWavStereo(L, R, sr = 48000) {
  const n = L.length;
  const buf = new ArrayBuffer(44 + n * 4);
  const v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) {
    v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true);
    v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true);
  }
  return new Uint8Array(buf);
}
