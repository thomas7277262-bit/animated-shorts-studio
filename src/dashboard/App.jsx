import React, { useMemo, useState, useEffect, useRef } from 'react';
import CharacterPicker from './CharacterPicker.jsx';
import Preview from './Preview.jsx';
import { generateStory } from '../story/generator.js';
import { buildTimeline } from '../story/timeline.js';
import { DEMO_STORYBOARD } from '../story/demo.js';
import { NARRATOR_VOICES, CHARACTER_LIBRARY } from '../story/characters.js';
import { MOODS } from '../audio/synth.js';
import { ENVIRONMENT_LABELS } from '../engine/environments/index.js';
import { guessRepo, startRender, findRun, getRelease, listRenders } from './github.js';

const load = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

function Section({ n, title, children, right }) {
  return (
    <section className="card">
      <header><span className="num">{n}</span><h2>{title}</h2>{right}</header>
      {children}
    </section>
  );
}

export default function App() {
  const [idea, setIdea] = useState(load('idea', ''));
  const [duration, setDuration] = useState(load('duration', 15));
  const [chars, setChars] = useState(load('chars', []));
  const [voice, setVoice] = useState(load('voice', 'storyteller'));
  const [mood, setMood] = useState(load('mood', 'auto'));
  const [musicOn, setMusicOn] = useState(true);
  const [musicVolume, setMusicVolume] = useState(load('musicVolume', 0.35));
  const [voiceVolume, setVoiceVolume] = useState(load('voiceVolume', 1));
  const [storyboard, setStoryboard] = useState(load('storyboard', null) || DEMO_STORYBOARD);
  const [resolution, setResolution] = useState(load('resolution', '1080p'));
  const [fps, setFps] = useState(load('fps', 30));
  const [repo, setRepo] = useState(load('repo', guessRepo()));
  const [token, setToken] = useState(load('token', ''));
  const [job, setJob] = useState(load('job', null));
  const [renders, setRenders] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => { save('idea', idea); save('duration', duration); save('chars', chars); save('voice', voice); save('mood', mood); save('musicVolume', musicVolume); save('voiceVolume', voiceVolume); save('resolution', resolution); save('fps', fps); save('repo', repo); save('token', token); }, [idea, duration, chars, voice, mood, musicVolume, voiceVolume, resolution, fps, repo, token]);
  useEffect(() => { save('storyboard', storyboard); }, [storyboard]);
  useEffect(() => { save('job', job); }, [job]);
  useEffect(() => { if (!msg) return; const id = setTimeout(() => setMsg(''), 5000); return () => clearTimeout(id); }, [msg]);

  const finalBoard = useMemo(() => ({
    ...storyboard, narratorVoice: voice, targetDuration: duration,
    mood: mood === 'auto' ? storyboard.mood : mood, musicVolume: musicOn ? musicVolume : 0, voiceVolume,
  }), [storyboard, voice, duration, mood, musicOn, musicVolume, voiceVolume]);
  const timeline = useMemo(() => buildTimeline(finalBoard, { width: 1080, height: 1920 }), [finalBoard]);

  const generate = () => {
    const sb = generateStory({ idea, characters: chars, duration, narratorVoice: voice, seed: Math.floor(Math.random() * 1e6) });
    setStoryboard(sb);
    setMsg(`New story: "${sb.title}" (${sb.scenes.length} scenes)`);
  };

  const editLine = (si, bi, text) => {
    const sb = structuredClone(storyboard);
    sb.scenes[si].beats[bi].line.text = text;
    setStoryboard(sb);
  };

  // ---- cloud render ----
  const render = async () => {
    if (!token) { setMsg('Add your GitHub token in step 6 first.'); return; }
    const renderId = Date.now().toString(36);
    setJob({ id: renderId, status: 'starting', started: Date.now(), title: finalBoard.title });
    try {
      await startRender({ repo, token, storyboard: finalBoard, resolution, fps, renderId });
      setJob({ id: renderId, status: 'queued', started: Date.now(), title: finalBoard.title });
    } catch (e) { setJob(null); setMsg('Could not start render: ' + e.message); }
  };

  const poll = useRef();
  useEffect(() => {
    clearInterval(poll.current);
    if (!job || job.status === 'done' || job.status === 'failed') return;
    const tick = async () => {
      try {
        const run = await findRun({ repo, token, renderId: job.id });
        if (run) {
          if (run.status === 'completed') {
            if (run.conclusion === 'success') {
              const rel = await getRelease({ repo, token, renderId: job.id });
              const mp4 = rel?.assets?.find((a) => a.name.endsWith('.mp4'));
              setJob((j) => ({ ...j, status: 'done', runUrl: run.html_url, mp4: mp4?.browser_download_url, release: rel?.html_url }));
              refreshRenders();
            } else setJob((j) => ({ ...j, status: 'failed', runUrl: run.html_url }));
          } else setJob((j) => ({ ...j, status: run.status, runUrl: run.html_url }));
        }
      } catch (e) { setMsg(e.message); }
    };
    tick();
    poll.current = setInterval(tick, 15000);
    return () => clearInterval(poll.current);
  }, [job?.id, job?.status]);

  const refreshRenders = async () => { try { setRenders(await listRenders({ repo, token })); } catch (e) { setMsg(e.message); } };
  useEffect(() => { refreshRenders(); }, [repo]);

  const elapsed = job ? Math.round((Date.now() - job.started) / 60000) : 0;

  return (
    <div className="app">
      <header className="top">
        <div className="logo">🎬</div>
        <div><h1>Animated Shorts Studio</h1><p>3D cartoon YouTube Shorts, rendered in the cloud</p></div>
      </header>
      {msg && <div className="toast" onClick={() => setMsg('')}>{msg}</div>}

      <Section n="1" title="Story idea">
        <textarea value={idea} onChange={(e) => setIdea(e.target.value)} rows={3} placeholder="e.g. a knight who is afraid of chickens (leave empty for a random story)" />
        <label className="lbl">Video length</label>
        <div className="chips">
          {[15, 30, 45, 60].map((d) => <button key={d} className={'chip' + (duration === d ? ' on' : '')} onClick={() => setDuration(d)}>{d}s</button>)}
        </div>
        <div className="row">
          <button className="btn primary" onClick={generate}>✨ Generate story</button>
          <button className="btn" onClick={() => { setStoryboard(DEMO_STORYBOARD); setDuration(15); setMsg('Loaded the 15-second demo story'); }}>Demo story</button>
        </div>
      </Section>

      <Section n="2" title="Characters" right={<span className="muted small">{chars.length}/3 · first = hero</span>}>
        <p className="muted small">Pick up to 3, then press Generate story. None picked = automatic cast.</p>
        <CharacterPicker selected={chars} onChange={setChars} />
      </Section>

      <Section n="3" title="Script">
        <h3 className="title">{storyboard.title}</h3>
        {storyboard.scenes.map((sc, si) => (
          <div key={si} className="sc">
            <div className="schead">Scene {si + 1} · {ENVIRONMENT_LABELS[sc.environment]}</div>
            {sc.beats.map((b, bi) => b.line && (
              <div key={bi} className="line">
                <span className="who">{b.line.speaker === 'narrator' ? '🎙 Narrator' : CHARACTER_LIBRARY[b.line.speaker]?.name}</span>
                <input value={b.line.text} onChange={(e) => editLine(si, bi, e.target.value)} />
              </div>
            ))}
          </div>
        ))}
      </Section>

      <Section n="4" title="Voice & music">
        <label className="lbl">Narrator voice</label>
        <select value={voice} onChange={(e) => setVoice(e.target.value)}>
          {Object.entries(NARRATOR_VOICES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <label className="lbl">Voice volume: {Math.round(voiceVolume * 100)}%</label>
        <input type="range" min="0.3" max="1.5" step="0.05" value={voiceVolume} onChange={(e) => setVoiceVolume(Number(e.target.value))} />
        <label className="lbl">Music style</label>
        <select value={mood} onChange={(e) => setMood(e.target.value)}>
          <option value="auto">Automatic (matches the story)</option>
          {Object.keys(MOODS).map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <label className="lbl row between"><span>Background music</span><input type="checkbox" checked={musicOn} onChange={(e) => setMusicOn(e.target.checked)} /></label>
        <label className="lbl">Music volume: {Math.round(musicVolume * 100)}%</label>
        <input type="range" min="0" max="0.8" step="0.05" value={musicVolume} disabled={!musicOn} onChange={(e) => setMusicVolume(Number(e.target.value))} />
      </Section>

      <Section n="5" title="Preview scenes">
        <Preview timeline={timeline} musicOn={musicOn} musicVolume={musicVolume} />
      </Section>

      <Section n="6" title="Render video">
        <div className="grid2">
          <div><label className="lbl">Resolution</label>
            <select value={resolution} onChange={(e) => setResolution(e.target.value)}>
              <option value="1080p">1080 × 1920 (fast)</option><option value="1440p">1440 × 2560</option><option value="4k">2160 × 3840 (4K, slow)</option>
            </select></div>
          <div><label className="lbl">Frame rate</label>
            <select value={fps} onChange={(e) => setFps(Number(e.target.value))}><option value={30}>30 fps</option><option value={60}>60 fps</option></select></div>
        </div>
        <details className="gh">
          <summary>GitHub connection {token ? '✅' : '⚠️ needed'}</summary>
          <label className="lbl">Repository</label>
          <input value={repo} onChange={(e) => setRepo(e.target.value.trim())} />
          <label className="lbl">Access token (stays on this phone only)</label>
          <input type="password" value={token} onChange={(e) => setToken(e.target.value.trim())} placeholder="github_pat_…" />
          <p className="muted small">Make a fine-grained token with <b>Actions: read & write</b> and <b>Contents: read</b> for this repository only. See docs/SETUP.md.</p>
        </details>
        <button className="btn primary big" onClick={render} disabled={job && !['done', 'failed'].includes(job.status)}>🚀 Render video in the cloud</button>
        {job && (
          <div className={'job ' + job.status}>
            <b>{job.title}</b>
            <div>Status: {{ starting: 'Starting…', queued: 'Waiting for a cloud computer…', in_progress: `Rendering… (${elapsed} min)`, done: 'Finished ✅', failed: 'Failed ❌' }[job.status] || job.status}</div>
            {job.runUrl && <a href={job.runUrl} target="_blank" rel="noreferrer">View progress on GitHub</a>}
            {job.mp4 && <a className="btn primary big" href={job.mp4}>⬇️ Download MP4</a>}
          </div>
        )}
      </Section>

      <Section n="7" title="Finished videos" right={<button className="btn tiny" onClick={refreshRenders}>↻</button>}>
        {!renders.length && <p className="muted small">No cloud renders yet.</p>}
        <div className="renders">
          {renders.map((r) => (
            <div key={r.id} className="render">
              {r.poster && <img src={r.poster.browser_download_url} alt="" loading="lazy" />}
              <div>
                <b>{r.title}</b>
                <div className="muted small">{new Date(r.date).toLocaleString()}</div>
                {r.mp4 && <a className="btn primary" href={r.mp4.browser_download_url}>⬇️ Download MP4 ({(r.mp4.size / 1e6).toFixed(1)} MB)</a>}
              </div>
            </div>
          ))}
        </div>
      </Section>
      <footer className="muted small">Free & open source: Three.js · eSpeak NG · FFmpeg · GitHub Actions</footer>
    </div>
  );
}
