import React, { useEffect, useRef, useState, useMemo } from 'react';
import { StoryPlayer } from '../engine/player.js';
import { generateMusic, sfx as makeSfx, mix, SR } from '../audio/synth.js';
import { ENVIRONMENT_LABELS } from '../engine/environments/index.js';

// Live 3D preview of the timeline in the phone's browser. The final video is
// rendered in the cloud at full quality; this is a lighter real-time version.
export default function Preview({ timeline, musicOn, musicVolume }) {
  const canvasRef = useRef();
  const playerRef = useRef();
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [err, setErr] = useState(null);
  const audioRef = useRef({ ctx: null, src: null, buffer: null, key: '' });
  const clock = useRef({ start: 0, offset: 0 });

  useEffect(() => {
    if (!timeline) return;
    setPlaying(false);
    try {
      const canvas = canvasRef.current;
      const w = Math.min(720, Math.round(canvas.clientWidth * Math.min(2, window.devicePixelRatio || 1)));
      const h = Math.round((w * 16) / 9);
      playerRef.current?.dispose();
      const p = new StoryPlayer(canvas, timeline, { width: w, height: h });
      playerRef.current = p;
      p.renderFrame(0.5);
      setT(0.5);
      setErr(null);
    } catch (e) { setErr(String(e.message || e)); }
    return () => { stopAudio(); };
  }, [timeline]);

  const subtitle = useMemo(() => {
    if (!timeline) return null;
    const line = timeline.lines.find((l) => t >= l.start && t <= l.end + 0.15);
    if (!line) return null;
    const idx = line.words.findIndex((w) => t >= w.start && t < w.end);
    const chunkStart = Math.max(0, idx < 0 ? line.words.length - 3 : idx - (idx % 3));
    const words = line.words.slice(chunkStart, chunkStart + 3);
    const spk = timeline.characters[line.speaker];
    return { words, active: idx, chunkStart, speaker: spk?.name, color: spk?.accent || '#FFD60A' };
  }, [t, timeline]);

  function stopAudio() {
    const a = audioRef.current;
    try { a.src?.stop(); } catch {}
    a.src = null;
  }

  function startAudio(offset) {
    if (!musicOn) return;
    const a = audioRef.current;
    a.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    const key = timeline.duration + ':' + timeline.music.mood + ':' + musicVolume + ':' + timeline.sfx.length;
    if (a.key !== key) {
      const music = generateMusic(timeline.duration + 0.5, timeline.music.mood, timeline.seed, 24000);
      const clips = timeline.sfx.map((s) => ({ pcm: makeSfx(s.name, 24000), at: s.t, gain: (s.gain ?? 0.8) * 0.55 }));
      const pcm = mix({ duration: timeline.duration, music, musicGain: musicVolume, clips, speech: timeline.lines, sr: 24000 });
      a.buffer = a.ctx.createBuffer(1, pcm.length, 24000);
      a.buffer.copyToChannel(pcm, 0);
      a.key = key;
    }
    stopAudio();
    a.src = a.ctx.createBufferSource();
    a.src.buffer = a.buffer;
    a.src.connect(a.ctx.destination);
    a.src.start(0, Math.max(0, offset));
  }

  useEffect(() => {
    if (!playing) return;
    let raf;
    clock.current.offset = t >= timeline.duration - 0.05 ? 0 : t;
    startAudio(clock.current.offset); // may take a moment the first time (music is generated)
    clock.current.start = performance.now();
    const loop = () => {
      const now = clock.current.offset + (performance.now() - clock.current.start) / 1000;
      if (now >= timeline.duration) { setPlaying(false); setT(timeline.duration); return; }
      playerRef.current.renderFrame(now);
      setT(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); stopAudio(); };
  }, [playing]);

  const seek = (v) => {
    setPlaying(false);
    setT(v);
    playerRef.current?.renderFrame(v);
  };

  if (!timeline) return <p className="muted">Generate or load a story to preview it.</p>;
  return (
    <div className="preview">
      <div className="stage">
        <canvas ref={canvasRef} className="canvas" />
        {subtitle && (
          <div className="subs">
            {subtitle.speaker && <div className="spk" style={{ color: subtitle.color }}>{subtitle.speaker.toUpperCase()}</div>}
            {subtitle.words.map((w, i) => (
              <span key={i} className={i + subtitle.chunkStart === subtitle.active ? 'hi' : ''} style={i + subtitle.chunkStart === subtitle.active ? { color: subtitle.color } : null}>
                {w.w.toUpperCase()}{' '}
              </span>
            ))}
          </div>
        )}
        {err && <div className="err">Preview error: {err}</div>}
      </div>
      <div className="controls">
        <button className="btn round" onClick={() => setPlaying(!playing)}>{playing ? '❚❚' : '▶'}</button>
        <input type="range" min="0" max={timeline.duration} step="0.01" value={t} onChange={(e) => seek(Number(e.target.value))} />
        <span className="time">{t.toFixed(1)}/{timeline.duration.toFixed(1)}s</span>
      </div>
      <div className="scenes">
        {timeline.scenes.map((s, i) => (
          <button key={s.id} className={'scene' + (t >= s.start && t < s.end ? ' on' : '')} onClick={() => seek(s.start + 0.6)}>
            <b>Scene {i + 1}</b><span>{ENVIRONMENT_LABELS[s.environment]}</span><span className="muted">{(s.end - s.start).toFixed(1)}s</span>
          </button>
        ))}
      </div>
      <p className="note">Preview timing is estimated. The voice is created during the cloud render, which re-times scenes to the real narration.</p>
    </div>
  );
}
