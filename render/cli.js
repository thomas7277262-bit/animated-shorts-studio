#!/usr/bin/env node
// Animated Shorts Studio – command line renderer.
//
//   node render/cli.js --demo --out output/demo.mp4
//   node render/cli.js --storyboard my-story.json --res 4k --fps 30
//   node render/cli.js --idea "a knight who is afraid of chickens" --duration 30
//
// Steps: storyboard -> voice (TTS) -> timeline -> music+sfx mix -> subtitles
//        -> 3D frames (headless Chromium + Three.js) -> MP4 -> verification.
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { DEMO_STORYBOARD } from '../src/story/demo.js';
import { DEMO_GIANT } from '../src/story/demo-giant.js';
import { generateStory } from '../src/story/generator.js';
import { buildTimeline, collectLines } from '../src/story/timeline.js';
import { generateMusic, sfx as makeSfx, mix, encodeWav, ambience, SR } from '../src/audio/synth.js';
import { synthLine } from './tts.js';
import { buildAss } from './subtitles.js';
import { renderVideo } from './frames.js';
import { verifyVideo } from './verify.js';
import { run, have, log } from './util.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const { values: opt } = parseArgs({
  options: {
    demo: { type: 'boolean' },
    'demo-name': { type: 'string', default: 'giant' },
    'sfx-volume': { type: 'string' },
    captions: { type: 'string' },
    storyboard: { type: 'string' },
    'storyboard-b64': { type: 'string' },
    idea: { type: 'string' },
    characters: { type: 'string' },
    duration: { type: 'string' },
    out: { type: 'string', default: 'output/video.mp4' },
    res: { type: 'string', default: '1080p' },
    fps: { type: 'string', default: '30' },
    workers: { type: 'string' },
    voice: { type: 'string' },
    'music-volume': { type: 'string' },
    'voice-volume': { type: 'string' },
    mood: { type: 'string' },
    'no-music': { type: 'boolean' },
    'no-subs': { type: 'boolean' },
    seed: { type: 'string' },
    'skip-build': { type: 'boolean' },
    'audio-only': { type: 'boolean' },
  },
});

const RES = { '720p': [720, 1280], '1080p': [1080, 1920], '1440p': [1440, 2560], '4k': [2160, 3840] };

async function main() {
  for (const tool of ['ffmpeg', 'ffprobe', 'espeak-ng']) if (!have(tool)) throw new Error(`${tool} is not installed (see docs/SETUP.md)`);
  const [width, height] = RES[opt.res] || RES['1080p'];
  const fps = Number(opt.fps);
  const outFile = path.resolve(opt.out);
  const workDir = outFile.replace(/\.mp4$/, '') + '_work';
  fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true });

  // 1. storyboard
  let sb;
  if (opt.storyboard) sb = JSON.parse(fs.readFileSync(opt.storyboard, 'utf8'));
  else if (opt['storyboard-b64']) sb = JSON.parse(Buffer.from(opt['storyboard-b64'], 'base64').toString('utf8'));
  else if (opt.demo) sb = structuredClone(opt['demo-name'] === 'stickman' ? DEMO_STORYBOARD : DEMO_GIANT);
  else sb = generateStory({ idea: opt.idea || '', characters: opt.characters ? opt.characters.split(',') : undefined, duration: Number(opt.duration || 30), seed: Number(opt.seed || Date.now() % 100000) });
  if (opt.duration) sb.targetDuration = Number(opt.duration);
  if (opt.voice) sb.narratorVoice = opt.voice;
  if (opt.mood) sb.mood = opt.mood;
  if (opt['music-volume']) sb.musicVolume = Number(opt['music-volume']);
  if (opt['voice-volume']) sb.voiceVolume = Number(opt['voice-volume']);
  if (opt['sfx-volume']) sb.sfxVolume = Number(opt['sfx-volume']);
  if (opt.captions) sb.captionStyle = opt.captions;
  const voiceVolume = sb.voiceVolume ?? 1;
  const sfxVolume = sb.sfxVolume ?? 1;
  fs.writeFileSync(path.join(workDir, 'storyboard.json'), JSON.stringify(sb, null, 2));
  log(`Story: "${sb.title}" – ${sb.scenes.length} scenes, target ${sb.targetDuration || 'auto'}s, ${width}x${height} @ ${fps}fps`);

  // 2. web bundle with the 3D engine
  const distDir = path.join(ROOT, 'dist');
  if (!opt['skip-build'] || !fs.existsSync(path.join(distDir, 'render.html'))) {
    log('Building 3D engine bundle…');
    run('npx', ['vite', 'build', '--logLevel', 'error'], { cwd: ROOT, stdio: 'inherit' });
  }

  // 3. voices (TTS) – speed up a little if the story is longer than the target
  const lines = collectLines(sb);
  let speed = 1, timings, timeline;
  for (let pass = 0; pass < 3; pass++) {
    timings = {};
    for (const l of lines) timings[l.id] = synthLine(l, { narratorVoice: sb.narratorVoice, speedFactor: speed, workDir });
    timeline = buildTimeline(sb, { lineTimings: timings, fps, width, height });
    const target = sb.targetDuration;
    if (!target || timeline.duration <= target + 0.05 || speed >= 1.35) break;
    const speechTotal = Object.values(timings).reduce((a, t) => a + t.duration, 0);
    const over = timeline.duration - target;
    speed = Math.min(1.35, speed * (speechTotal / Math.max(0.5, speechTotal - over)) * 1.02);
    log(`  story is ${over.toFixed(2)}s too long – re-voicing at ${speed.toFixed(2)}x speed`);
  }
  log(`Voices: ${lines.length} lines, speed ${speed.toFixed(2)}x → timeline ${timeline.duration.toFixed(2)}s`);
  const lean = JSON.parse(JSON.stringify(timeline));
  fs.writeFileSync(path.join(workDir, 'timeline.json'), JSON.stringify(lean, null, 1));

  // 4. audio mix
  let music = null;
  if (!opt['no-music']) {
    // music follows the mood of each scene (consecutive scenes share one piece)
    music = new Float32Array(Math.floor((timeline.duration + 0.5) * SR));
    const segs = [];
    for (const s of timeline.scenes) {
      const mood = s.music || timeline.music.mood;
      if (segs.length && segs.at(-1).mood === mood) segs.at(-1).end = s.end; else segs.push({ mood, start: s.start, end: s.end });
    }
    segs.forEach((g, i) => {
      const last = i === segs.length - 1;
      const pcm = generateMusic(g.end - g.start + (last ? 0.5 : 0.8), g.mood, timeline.seed + i);
      const off = Math.floor(g.start * SR);
      for (let j = 0; j < pcm.length && off + j < music.length; j++) music[off + j] += pcm[j];
    });
  }
  const clips = [];
  for (const line of timeline.lines) clips.push({ pcm: timings[line.id].pcm, at: line.start, gain: 0.95 * voiceVolume, voice: true });
  for (const s of timeline.sfx) clips.push({ pcm: makeSfx(s.name), at: s.t, gain: (s.gain ?? 0.8) * 0.55 * sfxVolume, duck: true });
  for (const s of timeline.scenes) if (s.ambience) clips.push({ pcm: ambience(s.ambience, s.end - s.start + 0.6, SR, s.index + 1), at: Math.max(0, s.start - 0.3), gain: 0.25 * sfxVolume, duck: true });
  const mixStats = {};
  const audio = mix({ duration: timeline.duration, music, musicGain: timeline.music.gain, clips, speech: timeline.lines, stats: mixStats });
  const voiceStem = new Float32Array(Math.floor(timeline.duration * SR));
  for (const line of timeline.lines) { const p = timings[line.id].pcm, o = Math.round(line.start * SR); for (let i = 0; i < p.length && o + i < voiceStem.length; i++) voiceStem[o + i] += p[i]; }
  const audioFile = path.join(workDir, 'audio.wav');
  fs.writeFileSync(audioFile, encodeWav(audio, SR));
  if (opt['audio-only']) { log(`Audio-only: voice is ${mixStats.voiceOverBackgroundDb.toFixed(1)} dB above music+effects during speech → ${audioFile}`); return; }
  log(`Audio: music "${timeline.music.mood}", ${timeline.sfx.length} sound effects, ${timeline.lines.length} voice clips`);

  // 5. subtitles
  const assFile = path.join(workDir, 'subs.ass');
  fs.writeFileSync(assFile, buildAss(timeline, { width, height }));

  // 6. frames → video
  const workers = Number(opt.workers || Math.max(1, Math.min(4, Math.floor((await import('node:os')).cpus().length / 1))));
  log(`Rendering ${Math.round(timeline.duration * fps)} frames with ${workers} worker(s)…`);
  const rv = await renderVideo({ timeline: lean, width, height, fps, distDir, workDir, outFile: path.join(workDir, 'video.mp4'), workers, crf: height > 2000 ? 16 : 14 });
  log(`Frames done in ${rv.seconds.toFixed(1)}s`);

  // 7. final encode: burn subtitles + add audio
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  for (const f of fs.readdirSync(path.join(ROOT, 'assets/fonts'))) if (/\.(otf|ttf)$/.test(f)) fs.copyFileSync(path.join(ROOT, 'assets/fonts', f), path.join(workDir, f));
  const vf = (opt['no-subs'] ? '' : 'ass=subs.ass:fontsdir=.,') + 'scale=out_range=tv,format=yuv420p';
  run('ffmpeg', ['-y', '-v', 'error', '-i', 'video.mp4', '-i', 'audio.wav', '-vf', vf,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', height > 2000 ? '20' : '18', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-r', String(fps),
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-t', timeline.duration.toFixed(3), '-movflags', '+faststart', outFile], { cwd: workDir });
  // poster image (middle of the video)
  run('ffmpeg', ['-y', '-v', 'error', '-ss', (timeline.duration * 0.6).toFixed(2), '-i', outFile, '-frames:v', '1', '-vf', 'scale=540:-2', outFile.replace(/\.mp4$/, '.jpg')]);

  // 8. verify
  const speechPcm = Object.fromEntries(Object.entries(timings).map(([k, v]) => [k, v.pcm]));
  const report = verifyVideo(outFile, timeline, { width, height, fps, speechPcm, voiceStem, master: audio });
  report.checks.push({ name: 'narration clearly louder than music + effects (>= 6 dB)', pass: mixStats.voiceOverBackgroundDb >= 6, detail: `voice is ${mixStats.voiceOverBackgroundDb.toFixed(1)} dB above the background during speech` });
  report.pass = report.checks.every((c) => c.pass);
  report.timeline = { duration: timeline.duration, scenes: timeline.scenes.length, lines: timeline.lines.length, sfx: timeline.sfx.length };
  report.render = { width, height, fps, workers, frameSeconds: rv.seconds };
  fs.writeFileSync(outFile.replace(/\.mp4$/, '.report.json'), JSON.stringify(report, null, 2));
  for (const c of report.checks) log(`  ${c.pass ? 'PASS' : 'FAIL'}  ${c.name} – ${c.detail}`);
  log(report.pass ? `✅ Video ready: ${outFile} (${(report.size / 1e6).toFixed(1)} MB)` : '❌ Verification failed');
  if (!report.pass) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
