// Render page for explainer videos: draws one frame at a time on request.
import { W, H, C, bind, setSize, setTime, paper, text, measure, rect, hash, prog, easeInOut, easeOut, back, g, at } from './engine.js';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
bind(ctx);

let P = null; // { scenes, sfx, shakes, flashes, caps, env, fps, duration }

let L = { w: 1080, h: 1920, captions: true, headerY: 168, headerX: null, camY: 0.42 };

async function load({ project, words, beats, env, fps }) {
  const mod = await import(`./projects/${project}/scenes.js`);
  L = { ...L, ...(mod.LAYOUT || {}) };
  setSize(L.w, L.h);
  canvas.width = L.w; canvas.height = L.h;
  const built = mod.build(words, beats);
  P = { ...built, caps: L.captions ? mod.captions(words) : [], env, fps, duration: built.duration ?? mod.DURATION };
  await Promise.all(['Kalam', 'Patrick Hand', 'Permanent Marker'].map((f) => document.fonts.load(`bold 40px "${f}"`)));
  return { duration: P.duration, sfx: P.sfx, width: L.w, height: L.h, subtitles: built.subtitles || null, scenes: P.scenes.map((s) => ({ start: s.start, label: s.label })) };
}

function talk(t) {
  if (!P.env) return 0;
  const i = Math.floor(t * P.fps);
  const v = Math.max(P.env[i] || 0, (P.env[i - 1] || 0) * 0.6);
  return Math.max(0, Math.min(1, (v - 0.08) * 1.7));
}

function drawScene(i, t, dx = 0, alpha = 1) {
  const s = P.scenes[i];
  const next = P.scenes[i + 1];
  const dur = (next ? next.start : P.duration) - s.start;
  const lt = t - s.start;
  const z = 1 + 0.035 * Math.min(1, lt / Math.max(1, dur)); // slow push-in
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(dx + W / 2, H * L.camY);
  ctx.scale(z, z);
  ctx.translate(-W / 2, -H * L.camY);
  s.draw(lt, t, { talk });
  ctx.restore();
}

function header(label, t, since) {
  const k = back(prog(t, since, 0.35));
  if (k <= 0) return;
  ctx.save();
  const w = Math.min(980, measure(label, 40, 'Kalam') + 70);
  const hx = L.headerX == null ? W / 2 : L.headerX + w / 2;
  at(hx, L.headerY, k, () => {
    rect(-w / 2, -36, w, 72, { fill: C.ink, w: 0, seed: 991 });
    text(label, 0, 3, { size: 40, color: '#fff' });
  });
  ctx.restore();
}

function captions(t) {
  const gp = P.caps.find((c) => t >= c.s - 0.05 && t < c.e + 0.25) || null;
  if (!gp) return;
  const size = 86;
  const parts = gp.words.map((w) => w.w);
  const space = measure(' ', size);
  const widths = parts.map((p) => measure(p, size));
  let total = widths.reduce((a, b) => a + b, 0) + space * (parts.length - 1);
  const scale = Math.min(1, 980 / total);
  const k = 0.9 + 0.1 * easeOut(prog(t, gp.s - 0.05, 0.15));
  ctx.save();
  ctx.translate(W / 2, 1430);
  ctx.scale(scale * k, scale * k);
  let x = -total / 2;
  gp.words.forEach((w, i) => {
    const active = t >= w.s - 0.03 && t < (gp.words[i + 1]?.s ?? gp.e + 0.25);
    if (active) {
      ctx.save(); ctx.fillStyle = C.yellow; ctx.translate(x + widths[i] / 2, 8); ctx.rotate(-0.02);
      ctx.beginPath(); ctx.roundRect(-widths[i] / 2 - 12, -size * 0.5, widths[i] + 24, size * 0.98, 14); ctx.fill(); ctx.restore();
    }
    text(w.w, x, 0, { size, align: 'left', stroke: active ? null : '#fff', sw: 14, color: C.ink, wobble: false });
    x += widths[i] + space;
  });
  ctx.restore();
}

function frame(t, q = 0.92) {
  setTime(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  // camera shake
  let sx = 0, sy = 0;
  for (const s of P.shakes) {
    const k = prog(t, s.t, s.dur);
    if (k > 0 && k < 1) { const a = s.amp * (1 - k) ** 2; sx += (hash(Math.floor(t * 60), 1) - 0.5) * 2 * a; sy += (hash(Math.floor(t * 60), 2) - 0.5) * 2 * a; }
  }
  ctx.save();
  ctx.translate(sx, sy);
  paper(P.paperAt ? P.paperAt(t) : undefined);
  let i = 0;
  while (i + 1 < P.scenes.length && t >= P.scenes[i + 1].start) i++;
  const s = P.scenes[i];
  const TR = s.tr === 'wipe' ? 0.6 : 0.32;
  const k = prog(t, s.start, TR);
  if (i > 0 && k < 1 && s.tr === 'slide') {
    const e = easeInOut(k);
    drawScene(i - 1, t, -e * W);
    drawScene(i, t, (1 - e) * W);
  } else if (i > 0 && k < 1 && s.tr === 'fade') {
    drawScene(i - 1, t, 0, 1 - k);
    drawScene(i, t, 0, k);
  } else if (i > 0 && k < 1 && s.tr === 'wipe') {
    // ink wipe: the new scene is revealed behind a wobbly vertical edge moving left to right
    const e = easeInOut(prog(t, s.start, 0.6));
    drawScene(i - 1, t);
    if (e > 0) {
      ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0);
      const X = e * (W + 160) - 80;
      for (let yy = 0; yy <= H; yy += 40) ctx.lineTo(X + Math.sin(yy * 0.021 + t * 3) * 34 + (hash(yy, 7) - 0.5) * 18, yy);
      ctx.lineTo(0, H); ctx.closePath(); ctx.clip();
      paper(P.paperAt ? P.paperAt(t) : undefined);
      drawScene(i, t); ctx.restore();
    }
  } else drawScene(i, t);
  ctx.restore();
  for (const f of P.flashes) { const a = 1 - prog(t, f, 0.35); if (t >= f && a > 0) { ctx.fillStyle = `rgba(255,255,255,${0.85 * a})`; ctx.fillRect(0, 0, W, H); } }
  if (P.overlay) { ctx.save(); P.overlay(t); ctx.restore(); }
  if (s.label) { let j = i; while (j > 0 && P.scenes[j - 1].label === s.label) j--; header(s.label, t, P.scenes[j].start); }
  if (L.captions) captions(t);
  // fade from/to black at the very edges
  const edge = Math.max(1 - prog(t, 0, 0.25), prog(t, P.duration - 0.6, 0.6));
  if (edge > 0) { ctx.fillStyle = `rgba(0,0,0,${edge})`; ctx.fillRect(0, 0, W, H); }
  return canvas.toDataURL('image/jpeg', q);
}

window.__studio = { ready: true, load, frame };
