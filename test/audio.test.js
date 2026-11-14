import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { generateMusic, sfx, SFX_NAMES, mix, encodeWav, MOODS } from '../src/audio/synth.js';
import { synthLine } from '../render/tts.js';

const finite = (a) => a.every((x) => Number.isFinite(x));

test('every sound effect is finite and non-silent', () => {
  for (const n of SFX_NAMES) {
    const s = sfx(n);
    assert.ok(s.length > 100, n);
    assert.ok(finite(s), n);
    assert.ok(s.some((x) => Math.abs(x) > 0.01), `${n} silent`);
  }
});

test('music for every mood is finite, right length, not silent', () => {
  for (const m of Object.keys(MOODS)) {
    const pcm = generateMusic(4, m, 1, 16000);
    assert.equal(pcm.length, 64000);
    assert.ok(finite(pcm), m);
    assert.ok(Math.max(...pcm.map(Math.abs)) > 0.05, m);
  }
});

test('mixer normalises without clipping and ducks music under speech', () => {
  const sr = 8000;
  const music = new Float32Array(sr * 4).fill(0.5);
  const out = mix({ duration: 4, music, musicGain: 1, speech: [{ start: 2, end: 3 }], sr });
  assert.ok(Math.max(...out.map(Math.abs)) <= 0.9);
  assert.ok(Math.abs(out[Math.floor(sr * 2.5)]) < Math.abs(out[Math.floor(sr * 1)]) * 0.6);
  const wav = encodeWav(out, sr);
  assert.equal(String.fromCharCode(...wav.slice(0, 4)), 'RIFF');
});

const hasEspeak = !spawnSync('espeak-ng', ['--version']).error;
test('TTS produces audio with ordered word timings', { skip: !hasEspeak && 'espeak-ng not installed' }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tts-'));
  const r = synthLine({ id: 't1', speaker: 'narrator', text: 'Hello brave knight, are you ready?' }, { workDir: dir });
  assert.ok(r.duration > 1 && r.duration < 5, `duration ${r.duration}`);
  assert.equal(r.words.length, 6);
  for (let i = 1; i < r.words.length; i++) assert.ok(r.words[i].start >= r.words[i - 1].end - 1e-6);
  assert.ok(Math.abs(r.words.at(-1).end - r.duration) < 0.01);
  assert.ok(r.envelope.length > 10);
  fs.rmSync(dir, { recursive: true, force: true });
});
