// Checks a finished MP4: streams, resolution, frame rate, duration, that it
// decodes without errors from start to finish, and that the narration in the
// final file starts where the timeline says it should (audio sync).
import { spawnSync } from 'node:child_process';
import { decodeAudio } from './util.js';

function probe(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', '-count_frames', file], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error('ffprobe failed: ' + r.stderr);
  return JSON.parse(r.stdout);
}

export function verifyVideo(file, timeline, { width, height, fps, speechPcm, voiceStem, master } = {}) {
  const checks = [];
  const ok = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });
  const info = probe(file);
  const v = info.streams.find((s) => s.codec_type === 'video');
  const a = info.streams.find((s) => s.codec_type === 'audio');
  ok('has video stream', v, v && `${v.codec_name} ${v.width}x${v.height}`);
  ok('has audio stream', a, a && `${a.codec_name} ${a.sample_rate}Hz ${a.channels}ch`);
  if (v) {
    ok('video codec is H.264', v.codec_name === 'h264', v.codec_name);
    ok('pixel format yuv420p (plays everywhere)', v.pix_fmt === 'yuv420p', v.pix_fmt);
    ok('resolution', v.width === width && v.height === height, `${v.width}x${v.height} (wanted ${width}x${height})`);
    ok('vertical (portrait) frame', v.width < v.height, (v.width / v.height).toFixed(4));
    const [n, d] = v.avg_frame_rate.split('/').map(Number);
    ok('frame rate', Math.abs(n / d - fps) < 0.01, `${(n / d).toFixed(2)} fps`);
    const frames = Number(v.nb_read_frames);
    const want = Math.round(timeline.duration * fps);
    ok('frame count', Math.abs(frames - want) <= 2, `${frames} frames (expected ${want})`);
  }
  const dur = Number(info.format.duration);
  ok('duration', Math.abs(dur - timeline.duration) < 0.15, `${dur.toFixed(2)}s (timeline ${timeline.duration.toFixed(2)}s)`);

  // full decode test
  const dec = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 28 });
  ok('decodes without errors', dec.status === 0 && !dec.stderr.trim(), dec.stderr.trim().slice(0, 300) || 'clean');

  // audio sync, proven in two independent steps:
  //  (1) every voice clip sits at its timeline time in the voice-only stem
  //  (2) the final MP4's audio matches the master mix with no time shift
  //      (so encoding / muxing did not move anything)
  if (a) {
    const pcm = decodeAudio(file, 48000);
    const sr = 48000, win = Math.floor(sr * 0.005);
    const envOf = (buf, from, len) => {
      const out = new Float32Array(len);
      for (let i = 0; i < len; i++) { let s2 = 0; for (let j = 0; j < win; j++) { const x = buf[from + i * win + j] || 0; s2 += x * x; } out[i] = Math.sqrt(s2 / win); }
      return out;
    };
    const bestLag = (ref, refFrom, sig, sigCenter, len, search = 60) => {
      const re = envOf(ref, refFrom, len);
      let best = -Infinity, lagBest = 0;
      for (let lag = -search; lag <= search; lag++) {
        const from = sigCenter + lag * win;
        if (from < 0) continue;
        const me = envOf(sig, from, len);
        let dot = 0, n1 = 0, n2 = 0;
        for (let i = 0; i < len; i++) { dot += re[i] * me[i]; n1 += re[i] ** 2; n2 += me[i] ** 2; }
        const c = dot / Math.sqrt(n1 * n2 + 1e-12);
        if (c > best) { best = c; lagBest = lag; }
      }
      return { ms: lagBest * 5, r: +best.toFixed(3) };
    };
    if (voiceStem && speechPcm) {
      const res = timeline.lines.filter((l) => speechPcm[l.id]).map((l) => {
        const clip = speechPcm[l.id];
        const len = Math.min(Math.floor(clip.length / win), 200);
        return { id: l.id, ...bestLag(clip, 0, voiceStem, Math.floor(l.start * sr), len) };
      });
      const worst = Math.max(...res.map((o) => Math.abs(o.ms)));
      ok('voice lines placed at their timeline times (|offset| <= 10 ms)', worst <= 10 && res.every((o) => o.r > 0.95), res.map((o) => `${o.id}:${o.ms}ms(r=${o.r})`).join(' '));
    }
    if (master) {
      const probes = [];
      const step = Math.max(1, timeline.duration / 6);
      for (let t = 0.5; t < timeline.duration - 1.5; t += step) probes.push(t);
      for (const l of timeline.lines) probes.push(l.start);
      const res = probes.map((t) => ({ t: +t.toFixed(2), ...bestLag(master, Math.floor(t * sr), pcm, Math.floor(t * sr), 200, 40) }));
      const worst = Math.max(...res.map((o) => Math.abs(o.ms)));
      ok('final MP4 audio matches the master mix, no drift (|offset| <= 20 ms)', worst <= 20 && res.every((o) => o.r > 0.9), `max offset ${worst}ms, min r=${Math.min(...res.map((o) => o.r))} over ${res.length} probes`);
    }
    // subtitles use the same line/word times, so they are in sync by construction
    let peak = 0, sum = 0;
    for (let i = 0; i < pcm.length; i++) { peak = Math.max(peak, Math.abs(pcm[i])); sum += pcm[i] * pcm[i]; }
    const rmsDb = 20 * Math.log10(Math.sqrt(sum / pcm.length) + 1e-9);
    ok('audio is not silent and not clipping', peak > 0.1 && peak < 1.0, `peak ${peak.toFixed(2)}, RMS ${rmsDb.toFixed(1)} dBFS`);
  }
  return { pass: checks.every((c) => c.pass), checks, size: Number(info.format.size) };
}
