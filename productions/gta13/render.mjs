// Render the motion graphics to video.
//   node productions/gta13/render.mjs --snap out-dir 1 5 10     (preview stills)
//   node productions/gta13/render.mjs --video out.mp4 [--fps 30] [--workers 4]
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT)) { r.writeHead(403); r.end(); return; }
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
}).listen(0);
const URL0 = `http://localhost:${srv.address().port}/index.html`;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

async function openPage() {
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.goto(URL0);
  await p.waitForFunction(() => window.__gta, null, { timeout: 30000 });
  return p;
}
const grab = async (p, t) => Buffer.from((await p.evaluate((t) => window.__gta.frame(t), t)).split(',')[1], 'base64');

if (args[0] === '--snap') {
  const out = args[1]; fs.mkdirSync(out, { recursive: true });
  const p = await openPage();
  for (const t of args.slice(2).map(Number)) fs.writeFileSync(path.join(out, `t${t.toFixed(2).padStart(6, '0')}.jpg`), await grab(p, t));
} else if (args[0] === '--video') {
  const outFile = path.resolve(args[1]);
  const fps = Number(args[args.indexOf('--fps') + 1] || 30) || 30;
  const workers = Number(args.includes('--workers') ? args[args.indexOf('--workers') + 1] : 4);
  const p0 = await openPage();
  const dur = await p0.evaluate(() => window.__gta.DURATION);
  await p0.close();
  const total = Math.round(dur * fps);
  const per = Math.ceil(total / workers);
  const tmp = outFile.replace(/\.mp4$/, '_parts'); fs.mkdirSync(tmp, { recursive: true });
  const t0 = Date.now(); let done = 0;
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const a = w * per, b = Math.min(total, a + per);
    const p = await openPage();
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', path.join(tmp, `part${w}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = a; f < b; f++) {
      const buf = await grab(p, f / fps);
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if (++done % 150 === 0) console.log(`frames ${done}/${total} (${(done / ((Date.now() - t0) / 1000)).toFixed(1)} fps)`);
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
  }));
  fs.writeFileSync(path.join(tmp, 'list.txt'), Array.from({ length: workers }, (_, w) => `file 'part${w}.mp4'`).join('\n'));
  await new Promise((r) => spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-c', 'copy', outFile], { stdio: 'inherit' }).on('close', r));
  console.log(`video done in ${((Date.now() - t0) / 1000).toFixed(0)}s → ${outFile}`);
}
await browser.close();
srv.close();
