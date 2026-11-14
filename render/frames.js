// Captures frames from the Three.js render page in headless Chromium and
// encodes them with FFmpeg. Several browser workers render different parts
// of the video in parallel; the parts are joined losslessly afterwards.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { spawn, run, log } from './util.js';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.otf': 'font/otf' };

export function serveDir(dir) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const f = path.join(dir, decodeURIComponent(req.url.split('?')[0]));
      if (!f.startsWith(dir)) { res.writeHead(403); res.end(); return; }
      fs.readFile(f, (e, d) => {
        if (e) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
        res.end(d);
      });
    }).listen(0, '127.0.0.1', () => resolve(srv));
  });
}

export const CHROME_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-sandbox'];

async function openPage(url, timeline, width, height) {
  const browser = await chromium.launch({ args: CHROME_ARGS });
  const page = await browser.newPage({ viewport: { width: Math.min(width, 1080), height: Math.min(height, 1920) } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.__studio && window.__studio.ready);
  await page.evaluate(([tl, w, h]) => window.__studio.load(tl, w, h), [timeline, width, height]);
  if (errors.length) throw new Error('Render page errors: ' + errors.join('\n'));
  return { browser, page, errors };
}

function write(stream, buf) {
  if (stream.destroyed) return Promise.reject(new Error('ffmpeg input closed'));
  return new Promise((resolve) => {
    if (stream.write(buf)) resolve(); else stream.once('drain', resolve);
  });
}

async function renderSegment({ url, timeline, width, height, fps, from, to, outFile, crf, quality, onFrame }) {
  const { browser, page, errors } = await openPage(url, timeline, width, height);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-r', String(fps), outFile], { stdio: ['pipe', 'inherit', 'pipe'] });
  let ffErr = '';
  ff.stdin.on('error', (e) => { ffErr += e.message; });
  ff.stderr.on('data', (d) => { ffErr += d; });
  const done = new Promise((resolve, reject) => ff.on('close', (c) => (c === 0 ? resolve() : reject(new Error('ffmpeg segment failed: ' + ffErr)))));
  for (let i = from; i < to; i++) {
    const t = i / fps;
    const dataUrl = await page.evaluate(([t, q]) => window.__studio.frame(t, q), [t, quality]);
    if (!dataUrl.startsWith('data:image/jpeg')) throw new Error(`Frame ${i} is not a JPEG`);
    await write(ff.stdin, Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64'));
    onFrame?.();
  }
  ff.stdin.end();
  await done;
  await browser.close();
  if (errors.length) throw new Error('Render page errors: ' + errors.join('\n'));
}

/** Render the whole timeline to a silent MP4 (no subtitles yet). */
export async function renderVideo({ timeline, width, height, fps, distDir, workDir, outFile, workers = 2, crf = 14, quality = 0.93 }) {
  const srv = await serveDir(distDir);
  const url = `http://127.0.0.1:${srv.address().port}/render.html`;
  const total = Math.round(timeline.duration * fps);
  workers = Math.max(1, Math.min(workers, Math.ceil(total / 30)));
  const per = Math.ceil(total / workers);
  let doneFrames = 0;
  const started = Date.now();
  const tick = () => {
    doneFrames++;
    if (doneFrames % Math.max(1, Math.round(total / 20)) === 0 || doneFrames === total) {
      const el = (Date.now() - started) / 1000;
      log(`  frames ${doneFrames}/${total} (${(doneFrames / el).toFixed(2)} fps, ~${Math.round((total - doneFrames) / (doneFrames / el))}s left)`);
    }
  };
  const segs = [];
  try {
    await Promise.all(Array.from({ length: workers }, (_, k) => {
      const from = k * per, to = Math.min(total, (k + 1) * per);
      const outSeg = path.join(workDir, `seg${k}.mp4`);
      segs[k] = outSeg;
      return renderSegment({ url, timeline, width, height, fps, from, to, outFile: outSeg, crf, quality, onFrame: tick });
    }));
  } finally {
    srv.close();
  }
  const list = path.join(workDir, 'segments.txt');
  fs.writeFileSync(list, segs.map((s) => `file '${path.basename(s)}'`).join('\n'));
  run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', 'segments.txt', '-c', 'copy', path.resolve(outFile)], { cwd: workDir });
  return { frames: total, seconds: (Date.now() - started) / 1000 };
}

/** Render a handful of still frames (used for scene previews and tests). */
export async function renderStills({ timeline, width, height, times, distDir }) {
  const srv = await serveDir(distDir);
  const url = `http://127.0.0.1:${srv.address().port}/render.html`;
  const { browser, page } = await openPage(url, timeline, width, height);
  const out = [];
  for (const t of times) {
    const d = await page.evaluate(([t]) => window.__studio.frame(t, 0.9), [t]);
    out.push(Buffer.from(d.slice(d.indexOf(',') + 1), 'base64'));
  }
  await browser.close();
  srv.close();
  return out;
}
