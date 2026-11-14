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

export function verifyVideo(file, timeline, { width, height, fps, speechPcm } = {}) {
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
    ok('vertical 9:16', Math.abs(v.width / v.height - 9 / 16) < 0.01, (v.width / v.height).toFixed(4));
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

  // audio sync: find the narration onset of each line in the final file's audio
  if (a) {
    const pcm = decodeAudio(file, 48000);
    const sr = 48000;
    const offsets = [];
    for (const line of timeline.lines) {
      // expected: the line's own speech onset is at line.start
      // measure: cross-correlate the line's clip energy envelope against the mix around line.start
      const clip = speechPcm?.[line.id];
      if (!clip) continue;
      const win = Math.floor(sr * 0.005);
      const envOf = (buf, from, len) => {
        const out = [];
        for (let i = 0; i < len; i++) {
          let s = 0;
          for (let j = 0; j < win; j++) { const x = buf[from + i * win + j] || 0; s += x * x; }
          out.push(Math.sqrt(s / win));
        }
        return out;
      };
      const clipLen = Math.min(Math.floor(clip.length / win), 200);
      const ce = envOf(clip, 0, clipLen);
      const search = 60; // +-300 ms
      let best = -Infinity, bestLag = 0;
      for (let lag = -search; lag <= search; lag++) {
        const from = Math.floor(line.start * sr) + lag * win;
        if (from < 0) continue;
        const me = envOf(pcm, from, clipLen);
        let dot = 0, n1 = 0, n2 = 0;
        for (let i = 0; i < clipLen; i++) { dot += ce[i] * me[i]; n1 += ce[i] ** 2; n2 += me[i] ** 2; }
        const c = dot / Math.sqrt(n1 * n2 + 1e-12);
        if (c > best) { best = c; bestLag = lag; }
      }
      offsets.push({ line: line.id, offsetMs: bestLag * 5, correlation: +best.toFixed(3) });
    }
    if (offsets.length) {
      const worst = Math.max(...offsets.map((o) => Math.abs(o.offsetMs)));
      ok('narration in sync with timeline (|offset| <= 40 ms)', worst <= 40, offsets.map((o) => `${o.line}:${o.offsetMs}ms(r=${o.correlation})`).join(' '));
    }
    // subtitles use the same line/word times, so they are in sync by construction
    let peak = 0, sum = 0;
    for (let i = 0; i < pcm.length; i++) { peak = Math.max(peak, Math.abs(pcm[i])); sum += pcm[i] * pcm[i]; }
    const rmsDb = 20 * Math.log10(Math.sqrt(sum / pcm.length) + 1e-9);
    ok('audio is not silent and not clipping', peak > 0.1 && peak < 1.0, `peak ${peak.toFixed(2)}, RMS ${rmsDb.toFixed(1)} dBFS`);
  }
  return { pass: checks.every((c) => c.pass), checks, size: Number(info.format.size) };
}
