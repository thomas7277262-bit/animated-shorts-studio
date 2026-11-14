import { spawnSync, spawn } from 'node:child_process';

export function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: opts.encoding ?? 'utf8', maxBuffer: 1 << 30, ...opts });
  if (r.error) throw new Error(`${cmd} failed to start: ${r.error.message}`);
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')}\nexited ${r.status}\n${r.stderr}`);
  return r;
}

export function have(cmd) {
  const r = spawnSync(cmd, ['--version'], { encoding: 'utf8' });
  return !r.error;
}

/** Decode any audio file to mono float32 PCM at the given sample rate using FFmpeg. */
export function decodeAudio(file, sr = 48000) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(sr), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`ffmpeg decode failed for ${file}: ${r.stderr}`);
  const b = r.stdout;
  return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}

export function log(...a) { console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a); }
export { spawn };
