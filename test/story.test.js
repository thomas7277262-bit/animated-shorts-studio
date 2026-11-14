import test from 'node:test';
import assert from 'node:assert/strict';
import { generateStory } from '../src/story/generator.js';
import { buildTimeline, estimateLineTiming, collectLines } from '../src/story/timeline.js';
import { DEMO_STORYBOARD } from '../src/story/demo.js';
import { CHARACTER_LIBRARY } from '../src/story/characters.js';
import { ENVIRONMENTS } from '../src/engine/environments/index.js';
import { ACTIONS } from '../src/engine/poses.js';
import { SHOT_PRESETS } from '../src/engine/camera.js';
import { EXPRESSIONS } from '../src/engine/face.js';
import { buildAss, chunkWords } from '../render/subtitles.js';

function validate(sb) {
  assert.ok(sb.title);
  assert.ok(sb.scenes.length >= 1);
  for (const sc of sb.scenes) {
    assert.ok(ENVIRONMENTS[sc.environment], `env ${sc.environment}`);
    for (const c of sc.cast) assert.ok(CHARACTER_LIBRARY[c.id], `char ${c.id}`);
    for (const b of sc.beats) {
      for (const a of b.actions || []) {
        assert.ok(ACTIONS[a.action], `action ${a.action}`);
        assert.ok(!a.expr || EXPRESSIONS.includes(a.expr), `expr ${a.expr}`);
        assert.ok(sc.cast.find((c) => c.id === a.char), `actor ${a.char} in cast`);
      }
      for (const cam of [].concat(b.camera || [])) assert.ok(SHOT_PRESETS[cam.type], `shot ${cam.type}`);
    }
  }
}

test('demo storyboard is valid and builds a 15 s timeline', () => {
  validate(DEMO_STORYBOARD);
  const tl = buildTimeline(DEMO_STORYBOARD);
  assert.equal(tl.scenes.length, 4);
  assert.ok(tl.duration >= 15 && tl.duration < 16.5, `duration ${tl.duration}`); // estimate; real TTS is fitted to exactly 15 s
  assert.equal(tl.lines.length, 5);
});

test('generator makes valid stories for every length and setting', () => {
  for (const duration of [15, 30, 45, 60]) {
    for (const environment of Object.keys(ENVIRONMENTS)) {
      const sb = generateStory({ idea: 'a test idea', duration, environment, seed: duration + environment.length });
      validate(sb);
      const tl = buildTimeline(sb);
      assert.ok(tl.duration >= duration - 0.01, `${environment} ${duration}s -> ${tl.duration}`);
      assert.ok(tl.duration <= duration * 1.35, `${environment} ${duration}s too long: ${tl.duration}`);
    }
  }
});

test('generator is deterministic for the same seed and uses chosen characters', () => {
  const a = generateStory({ idea: 'king loses his crown', duration: 30, seed: 9, characters: ['king', 'lily'] });
  const b = generateStory({ idea: 'king loses his crown', duration: 30, seed: 9, characters: ['king', 'lily'] });
  assert.deepEqual(a, b);
  assert.deepEqual(a.characters, ['king', 'lily']);
  assert.match(a.scenes[0].beats[0].line.text, /King loses his crown/);
});

test('timeline: scenes are contiguous, lines and words are ordered', () => {
  const tl = buildTimeline(generateStory({ duration: 45, seed: 3 }));
  for (let i = 1; i < tl.scenes.length; i++) assert.equal(tl.scenes[i].start, tl.scenes[i - 1].end);
  let last = 0;
  for (const l of tl.lines) {
    assert.ok(l.start >= last - 1e-9); last = l.end;
    for (const w of l.words) { assert.ok(w.start >= l.start - 1e-9 && w.end <= l.end + 1e-9); assert.ok(w.end > w.start); }
  }
  for (const s of tl.sfx) assert.ok(s.t >= 0 && s.t < tl.duration);
});

test('real line timings re-time the story', () => {
  const lines = collectLines(DEMO_STORYBOARD);
  const timings = Object.fromEntries(lines.map((l) => [l.id, { ...estimateLineTiming(l.text), duration: 4 }]));
  const tl = buildTimeline({ ...DEMO_STORYBOARD, targetDuration: null }, { lineTimings: timings });
  assert.ok(tl.duration > 20);
});

test('subtitles: chunks and ASS output', () => {
  const words = 'Hello there, my good friend. How are you'.split(' ').map((w, i) => ({ w, start: i, end: i + 0.9 }));
  const chunks = chunkWords(words);
  assert.deepEqual(chunks.map((c) => c.length), [2, 3, 3]);
  const tl = buildTimeline(DEMO_STORYBOARD);
  const ass = buildAss(tl, { width: 1080, height: 1920 });
  assert.match(ass, /PlayResY: 1920/);
  const n = (ass.match(/^Dialogue: 0/gm) || []).length;
  assert.equal(n, tl.lines.reduce((a, l) => a + l.words.length, 0));
});
