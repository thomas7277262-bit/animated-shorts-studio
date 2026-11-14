// Free, offline text-to-speech using eSpeak NG (open source), plus
// word-level timing for subtitles and an amplitude envelope for lip sync.
import fs from 'node:fs';
import path from 'node:path';
import { run, decodeAudio } from './util.js';
import { CHARACTER_LIBRARY, NARRATOR_VOICES } from '../src/story/characters.js';
import { splitWords } from '../src/story/timeline.js';

const SR = 48000;

function voiceFor(speaker, narratorVoice) {
  if (speaker && speaker !== 'narrator' && CHARACTER_LIBRARY[speaker]) return CHARACTER_LIBRARY[speaker].voice;
  return NARRATOR_VOICES[narratorVoice] || NARRATOR_VOICES.storyteller;
}

function espeak(text, voice, speedFactor, outFile) {
  const speed = Math.round((voice.speed || 160) * speedFactor);
  run('espeak-ng', ['-v', voice.espeak, '-p', String(voice.pitch ?? 50), '-s', String(speed), '-a', '160', '-g', '2', '-w', outFile, text]);
  return decodeAudio(outFile, SR);
}

/** Find the first/last sample above a threshold (trim silence). */
export function speechBounds(pcm, thresh = 0.02) {
  let a = 0, b = pcm.length - 1;
  while (a < pcm.length && Math.abs(pcm[a]) < thresh) a++;
  while (b > a && Math.abs(pcm[b]) < thresh) b--;
  return [a, b + 1];
}

/** RMS envelope at `fps` frames per second, normalised 0..1. */
export function envelope(pcm, fps = 30) {
  const win = Math.floor(SR / fps);
  const out = [];
  let max = 1e-6;
  for (let i = 0; i < pcm.length; i += win) {
    let s = 0;
    const end = Math.min(pcm.length, i + win);
    for (let j = i; j < end; j++) s += pcm[j] * pcm[j];
    const v = Math.sqrt(s / Math.max(1, end - i));
    out.push(v); max = Math.max(max, v);
  }
  return out.map((v) => Math.round(Math.min(1, v / (max * 0.8)) * 100) / 100);
}

/** Silent gaps (>= minGap seconds) inside the clip, as [startSec, endSec]. */
function silentGaps(pcm, minGap = 0.05, thresh = 0.015) {
  const win = Math.floor(SR * 0.01);
  const gaps = [];
  let start = -1;
  for (let i = 0; i < pcm.length; i += win) {
    let m = 0;
    for (let j = i; j < Math.min(pcm.length, i + win); j++) m = Math.max(m, Math.abs(pcm[j]));
    if (m < thresh) { if (start < 0) start = i; }
    else if (start >= 0) { if ((i - start) / SR >= minGap) gaps.push([start / SR, i / SR]); start = -1; }
  }
  return gaps;
}

/**
 * Synthesize one line. Returns { pcm, duration, words:[{w,start,end}], envelope }.
 * Word timing method: every word is also synthesized on its own to learn its
 * relative length; the line's real duration is split in those proportions and
 * each boundary is then snapped to the nearest real silence in the audio.
 */
export function synthLine(line, { narratorVoice = 'storyteller', speedFactor = 1, workDir }) {
  const voice = voiceFor(line.speaker, narratorVoice);
  const file = path.join(workDir, `${line.id}.wav`);
  const raw = espeak(line.text, voice, speedFactor, file);
  const [a, b] = speechBounds(raw);
  const pcm = raw.slice(a, b);
  const duration = pcm.length / SR;

  const words = splitWords(line.text);
  const lens = words.map((w, i) => {
    const wf = path.join(workDir, `${line.id}_w${i}.wav`);
    const p = espeak(w.replace(/[^\w'’-]/g, '') || w, voice, speedFactor, wf);
    fs.rmSync(wf, { force: true });
    const [wa, wb] = speechBounds(p);
    // punctuation adds a pause after the word
    const pause = /[.!?]$/.test(w) ? 0.35 : /[,;:]$/.test(w) ? 0.18 : 0.04;
    return Math.max(0.08, (wb - wa) / SR) + pause;
  });
  const total = lens.reduce((x, y) => x + y, 0);
  const gaps = silentGaps(pcm);
  let acc = 0;
  const bounds = [0];
  for (let i = 0; i < words.length - 1; i++) {
    acc += lens[i];
    let tb = (acc / total) * duration;
    // snap to the centre of a nearby silence gap
    let best = null;
    for (const g of gaps) {
      const c = (g[0] + g[1]) / 2;
      if (Math.abs(c - tb) < 0.18 && (!best || Math.abs(c - tb) < Math.abs(best - tb))) best = c;
    }
    if (best !== null && best > bounds[bounds.length - 1] + 0.05) tb = best;
    bounds.push(Math.max(tb, bounds[bounds.length - 1] + 0.05));
  }
  bounds.push(duration);
  const wordTimes = words.map((w, i) => ({ w, start: +bounds[i].toFixed(3), end: +bounds[i + 1].toFixed(3) }));
  return { pcm, duration, words: wordTimes, envelope: envelope(pcm, 30), envelopeFps: 30, voice: voice.espeak, gaps };
}
