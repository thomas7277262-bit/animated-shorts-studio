#!/usr/bin/env node
// Render a hand-drawn finance explainer (vertical 1080x1920) to MP4.
//
//   node explainer/render.mjs --project nifty-fifty --out output/nifty-fifty.mp4
//   node explainer/render.mjs --project nifty-fifty --stills 3,20,40   (preview PNGs)
//
// Inputs in explainer/projects/<name>/: scenes.js, words.json (word timings),
// voice.mp3 (narration) and optionally music.mp3 (background bed).
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { serveDir, CHROME_ARGS } from '../render/frames.js';
import { sfx as makeSfx, mix, encodeWav, SR } from '../src/audio/synth.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { values: opt } = parseArgs({ options: {
  project: { type: 'string', default: 'nifty-fifty' }, out: { type: 'string' }, fps: { type: 'string', default: '30' },
  workers: { type: 'string', default: '4' }, stills: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' },
  'music-gain': { type: 'string', default: '0.22' },
} });
const fps = Number(opt.fps);
const dir = path.join(ROOT, 'explainer/projects', opt.project);
const words = JSON.parse(fs.readFileSync(path.join(dir, 'words.json'), 'utf8'));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

function decode(file) {
  const buf = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 1 << 30 });
  return new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
}

const beatsFile = path.join(dir, 'beats.json');
const beats = fs.existsSync(beatsFile) ? JSON.parse(fs.readFileSync(beatsFile, 'utf8')) : null;
const newest = (names) => names.map((f) => path.join(dir, f)).filter((f) => fs.existsSync(f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
const voiceFile = newest(['voice.mp3', 'voice.wav']);

async function openPage(srv, env) {
  const browser = await chromium.launch({ args: CHROME_ARGS });
  const page = await browser.newPage({ viewport: { width: 960, height: 960 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:${srv.address().port}/explainer/page.html`);
  await page.waitForFunction(() => window.__studio && window.__studio.ready);
  const info = await page.evaluate((a) => window.__studio.load(a), { project: opt.project, words, beats, env, fps });
  if (errors.length) throw new Error(errors.join('\n'));
  return { browser, page, info, errors };
}

async function main() {
  const OFFSET = (await import(path.join(dir, 'scenes.js'))).OFFSET;
  const voice = decode(voiceFile);
  // per-frame voice loudness (drives lip-sync)
  const spf = SR / fps;
  const env = [];
  const off = Math.round(OFFSET * fps);
  for (let i = 0; i < off; i++) env.push(0);
  let peak = 0;
  const raw = [];
  for (let f = 0; f * spf < voice.length; f++) { let s = 0; const a = Math.floor(f * spf), b = Math.min(voice.length, Math.floor((f + 1) * spf)); for (let i = a; i < b; i++) s += voice[i] ** 2; const r = Math.sqrt(s / Math.max(1, b - a)); raw.push(r); peak = Math.max(peak, r); }
  for (const r of raw) env.push(Math.round((r / peak) * 1000) / 1000);

  const srv = await serveDir(ROOT);
  try {
    if (opt.stills) {
      const { browser, page } = await openPage(srv, env);
      const outDir = path.resolve(opt.out || 'output/stills');
      fs.mkdirSync(outDir, { recursive: true });
      for (const t of opt.stills.split(',').map(Number)) {
        const d = await page.evaluate(([t]) => window.__studio.frame(t, 0.9), [t]);
        fs.writeFileSync(path.join(outDir, `still_${String(t).padStart(5, '0')}.jpg`), Buffer.from(d.split(',')[1], 'base64'));
      }
      await browser.close();
      log('stills written to', outDir);
      return;
    }
    const outFile = path.resolve(opt.out || `output/${opt.project}.mp4`);
    const work = outFile.replace(/\.mp4$/, '') + '_work';
    fs.rmSync(work, { recursive: true, force: true }); fs.mkdirSync(work, { recursive: true });
    const probe = await openPage(srv, env);
    const { duration, sfx, subtitles } = probe.info;
    if (subtitles) fs.writeFileSync(outFile.replace(/\.mp4$/, '.srt'), subtitles);
    await probe.browser.close();
    const total = Math.round(duration * fps);
    const from = opt.from ? Math.round(Number(opt.from) * fps) : 0, to = opt.to ? Math.round(Number(opt.to) * fps) : total;

    // ---- audio ----
    log('mixing audio');
    const clips = [{ pcm: voice, at: OFFSET, gain: 1, voice: true }];
    for (const c of sfx) clips.push({ pcm: makeSfx(c.name), at: c.t, gain: c.gain, duck: true });
    let music = null;
    const musicFile = newest(['music.mp3', 'music.wav']) || '';
    if (fs.existsSync(musicFile)) {
      const m = decode(musicFile);
      const n = Math.floor(duration * SR);
      music = new Float32Array(n);
      for (let i = 0; i < n; i++) music[i] = m[i % m.length];
      const fo = Math.floor(2.5 * SR);
      for (let i = 0; i < fo; i++) music[n - 1 - i] *= i / fo;
    }
    const speech = words.map((w) => ({ start: w.s + OFFSET, end: w.e + OFFSET }));
    const stats = {};
    const pcm = mix({ duration, music, musicGain: Number(opt['music-gain']), clips, speech, duck: 0.45, fxDuck: 0.6, stats });
    fs.writeFileSync(path.join(work, 'mix.wav'), encodeWav(pcm));
    log(`voice over background: ${stats.voiceOverBackgroundDb.toFixed(1)} dB`);

    // ---- video ----
    const workers = Math.max(1, Number(opt.workers));
    const per = Math.ceil((to - from) / workers);
    let done = 0; const started = Date.now();
    const segs = [];
    await Promise.all(Array.from({ length: workers }, async (_, k) => {
      const a = from + k * per, b = Math.min(to, from + (k + 1) * per);
      const seg = path.join(work, `seg${k}.mp4`); segs[k] = seg;
      if (a >= b) return;
      const { browser, page, errors } = await openPage(srv, env);
      const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
        '-vf', 'scale=in_range=pc:out_range=tv,format=yuv420p', '-color_range', 'tv', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(fps), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
      const closed = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg failed')))));
      for (let i = a; i < b; i++) {
        const d = await page.evaluate(([t]) => window.__studio.frame(t, 0.93), [i / fps]);
        const buf = Buffer.from(d.slice(d.indexOf(',') + 1), 'base64');
        if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
        if (++done % 150 === 0) log(`frames ${done}/${to - from} (${(done / ((Date.now() - started) / 1000)).toFixed(1)} fps)`);
      }
      ff.stdin.end(); await closed; await browser.close();
      if (errors.length) throw new Error(errors.join('\n'));
    }));
    fs.writeFileSync(path.join(work, 'segs.txt'), segs.filter((s) => fs.existsSync(s)).map((s) => `file '${path.basename(s)}'`).join('\n'));
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', 'segs.txt', '-c', 'copy', 'video.mp4'], { cwd: work });
    const aStart = from / fps;
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', path.join(work, 'video.mp4'), '-ss', String(aStart), '-t', String((to - from) / fps), '-i', path.join(work, 'mix.wav'),
      '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest', outFile]);
    log(`done: ${outFile} (${((Date.now() - started) / 1000).toFixed(0)} s)`);
  } finally { srv.close(); }
}
main().catch((e) => { console.error(e); process.exit(1); });
