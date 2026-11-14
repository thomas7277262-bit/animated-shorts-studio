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
import { generateStory } from '../src/story/generator.js';
import { buildTimeline, collectLines } from '../src/story/timeline.js';
import { generateMusic, sfx as makeSfx, mix, encodeWav, SR } from '../src/audio/synth.js';
import { synthLine } from './tts.js';
import { buildAss } from './subtitles.js';
import { renderVideo } from './frames.js';
import { verifyVideo } from './verify.js';
import { run, have, log } from './util.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const { values: opt } = parseArgs({
  options: {
    demo: { type: 'boolean' },
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
  else if (opt.demo) sb = structuredClone(DEMO_STORYBOARD);
  else sb = generateStory({ idea: opt.idea || '', characters: opt.characters ? opt.characters.split(',') : undefined, duration: Number(opt.duration || 30), seed: Number(opt.seed || Date.now() % 100000) });
  if (opt.duration) sb.targetDuration = Number(opt.duration);
  if (opt.voice) sb.narratorVoice = opt.voice;
  if (opt.mood) sb.mood = opt.mood;
  if (opt['music-volume']) sb.musicVolume = Number(opt['music-volume']);
  const voiceVolume = Number(opt['voice-volume'] || 1);
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
  const music = opt['no-music'] ? null : generateMusic(timeline.duration + 0.5, timeline.music.mood, timeline.seed);
  const clips = [];
  for (const line of timeline.lines) clips.push({ pcm: timings[line.id].pcm, at: line.start, gain: 0.95 * voiceVolume });
  for (const s of timeline.sfx) clips.push({ pcm: makeSfx(s.name), at: s.t, gain: (s.gain ?? 0.8) * 0.55 });
  const audio = mix({ duration: timeline.duration, music, musicGain: timeline.music.gain, clips, speech: timeline.lines });
  const audioFile = path.join(workDir, 'audio.wav');
  fs.writeFileSync(audioFile, encodeWav(audio, SR));
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
  fs.copyFileSync(path.join(ROOT, 'assets/fonts/Inter-ExtraBold.otf'), path.join(workDir, 'Inter-ExtraBold.otf'));
  const vf = opt['no-subs'] ? 'null' : 'ass=subs.ass:fontsdir=.';
  run('ffmpeg', ['-y', '-v', 'error', '-i', 'video.mp4', '-i', 'audio.wav', '-vf', vf,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', height > 2000 ? '20' : '18', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', String(fps),
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-t', timeline.duration.toFixed(3), '-movflags', '+faststart', outFile], { cwd: workDir });
  // poster image (middle of the video)
  run('ffmpeg', ['-y', '-v', 'error', '-ss', (timeline.duration * 0.6).toFixed(2), '-i', outFile, '-frames:v', '1', '-vf', 'scale=540:-2', outFile.replace(/\.mp4$/, '.jpg')]);

  // 8. verify
  const speechPcm = Object.fromEntries(Object.entries(timings).map(([k, v]) => [k, v.pcm]));
  const report = verifyVideo(outFile, timeline, { width, height, fps, speechPcm });
  report.timeline = { duration: timeline.duration, scenes: timeline.scenes.length, lines: timeline.lines.length, sfx: timeline.sfx.length };
  report.render = { width, height, fps, workers, frameSeconds: rv.seconds };
  fs.writeFileSync(outFile.replace(/\.mp4$/, '.report.json'), JSON.stringify(report, null, 2));
  for (const c of report.checks) log(`  ${c.pass ? 'PASS' : 'FAIL'}  ${c.name} – ${c.detail}`);
  log(report.pass ? `✅ Video ready: ${outFile} (${(report.size / 1e6).toFixed(1)} MB)` : '❌ Verification failed');
  if (!report.pass) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
