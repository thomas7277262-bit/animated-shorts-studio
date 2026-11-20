// "Why did GTA 6 take 13 years?" – original motion graphics, 1080x1920.
// Everything is drawn procedurally; renderAt(t) depends only on t.
const W = 1080, H = 1920;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');

// ---------- palette ----------
const C = {
  navy: '#070a1f', deep: '#0d0f2e', purple: '#2a0f4a', pink: '#ff3e9a', teal: '#00e5d4',
  orange: '#ff8a3d', gold: '#ffc94a', white: '#ffffff', red: '#ff2d4a', amber: '#ffb020', blue: '#4aa3ff',
};

// ---------- utils ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, u) => a + (b - a) * u;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eOut = (u) => 1 - Math.pow(1 - u, 3);
const eIn = (u) => u * u * u;
const eIO = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const eBack = (u) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const fmt = (n) => Math.round(n).toLocaleString('en-US');

// window helper: visibility of a segment with fade in/out
function seg(t, a, b, fi = 0.25, fo = 0.25) { if (t < a || t > b) return 0; return Math.min(prog(t, a, a + fi), 1 - prog(t, b - fo, b)); }

// ---------- text ----------
function text(str, x, y, o = {}) {
  const { size = 100, font = 'Anton', color = C.white, align = 'center', alpha = 1, glow = 0, glowColor = color,
    stroke = 0, strokeColor = '#000', scale = 1, rot = 0, track = 0, base = 'middle', grad = null, maxW = 0 } = o;
  if (alpha <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
  let fs = size;
  ctx.font = `${fs}px ${font}`;
  if (track) ctx.letterSpacing = `${track}px`;
  if (maxW) { const w = ctx.measureText(str).width; if (w > maxW) { fs = size * maxW / w; ctx.font = `${fs}px ${font}`; } }
  ctx.textAlign = align; ctx.textBaseline = base;
  if (grad) {
    const g = ctx.createLinearGradient(0, -fs * 0.5, 0, fs * 0.5);
    grad.forEach((c, i) => g.addColorStop(i / (grad.length - 1), c));
    ctx.fillStyle = g;
  } else ctx.fillStyle = color;
  if (stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = stroke; ctx.strokeStyle = strokeColor; ctx.strokeText(str, 0, 0); }
  if (glow) { ctx.shadowColor = glowColor; ctx.shadowBlur = glow; ctx.fillText(str, 0, 0); ctx.shadowBlur = glow * 0.4; }
  ctx.fillText(str, 0, 0);
  ctx.restore();
}
function measure(str, size, font = 'Anton', track = 0) { ctx.save(); ctx.font = `${size}px ${font}`; if (track) ctx.letterSpacing = `${track}px`; const w = ctx.measureText(str).width; ctx.restore(); return w; }

// slam-in: big -> normal with overshoot
function slam(t, at, dur = 0.22) { const u = prog(t, at, at + dur); return { alpha: clamp((t - at) / 0.06), scale: t < at ? 2.4 : lerp(2.4, 1, eBack(u)) }; }
function pop(t, at, dur = 0.3) { const u = prog(t, at, at + dur); return { alpha: clamp((t - at) / 0.1), scale: t < at ? 0 : eBack(u) }; }

const CHROME = ['#ffffff', '#dff4ff', '#8fb8ff', '#3b2a7a', '#ff9ad0', '#ffffff'];
const SUNSET = ['#ffe28a', '#ff8a3d', '#ff3e9a'];

function pill(x, y, w, h, fill, alpha = 1, stroke = null) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 4; ctx.stroke(); }
  ctx.restore();
}
function card(x, y, w, h, o = {}) {
  const { r = 28, fill = 'rgba(10,12,40,0.78)', stroke = C.teal, lw = 4, glow = 30, alpha = 1 } = o;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, r);
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.shadowColor = stroke; ctx.shadowBlur = glow; ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  ctx.restore();
}

// ---------- backgrounds ----------
const stars = (() => { const r = rng(7); return Array.from({ length: 140 }, () => ({ x: r() * W, y: r() * H * 0.7, s: r() * 2.2 + 0.4, p: r() * 6 })); })();
function sky(t, top = C.navy, mid = C.purple, bot = '#4a1450', starA = 1) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top); g.addColorStop(0.55, mid); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (starA > 0) for (const s of stars) { ctx.globalAlpha = starA * (0.4 + 0.6 * Math.abs(Math.sin(t * 1.3 + s.p))); ctx.fillStyle = '#fff'; ctx.fillRect(s.x, s.y, s.s, s.s); }
  ctx.globalAlpha = 1;
}
function sun(x, y, r, t, a = 1) {
  ctx.save(); ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(0, y - r, 0, y + r);
  g.addColorStop(0, '#ffe28a'); g.addColorStop(0.5, '#ff8a3d'); g.addColorStop(1, '#ff3e9a');
  ctx.shadowColor = '#ff6a6a'; ctx.shadowBlur = 120;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
  ctx.shadowBlur = 0;
  // synthwave stripes
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 7; i++) { const yy = y + r * (0.1 + i * 0.14) + ((t * 18) % (r * 0.14)); ctx.fillRect(x - r, yy, 2 * r, 4 + i * 2.2); }
  ctx.restore();
}
function grid(t, horizon, color = C.pink, a = 0.7, speed = 1) {
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.shadowColor = color; ctx.shadowBlur = 12;
  const g = ctx.createLinearGradient(0, horizon, 0, H); g.addColorStop(0, '#1a0630'); g.addColorStop(1, '#05030f');
  ctx.fillStyle = g; ctx.fillRect(0, horizon, W, H - horizon);
  for (let i = -14; i <= 14; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 30, horizon); ctx.lineTo(W / 2 + i * 260, H); ctx.stroke(); }
  const off = (t * speed * 0.6) % 1;
  for (let k = 0; k < 18; k++) { const z = (k + off) / 18; const yy = horizon + Math.pow(z, 2.2) * (H - horizon); ctx.globalAlpha = a * z; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
  ctx.restore();
}
const skyCache = new Map();
function buildings(seed, n, minH, maxH) {
  const k = `${seed}:${n}`; if (skyCache.has(k)) return skyCache.get(k);
  const r = rng(seed); const out = []; let x = -40;
  while (x < W + 40) { const w = 40 + r() * 90; const h = minH + Math.pow(r(), 1.6) * (maxH - minH); const win = []; for (let wy = 14; wy < h - 10; wy += 22) for (let wx = 8; wx < w - 8; wx += 16) if (r() < 0.32) win.push([wx, wy, r()]); out.push({ x, w, h, win, ant: r() < 0.2, roof: r() }); x += w + 2 + r() * 6; }
  skyCache.set(k, out); return out;
}
function skyline(base, o = {}) {
  const { seed = 1, color = '#120a2a', win = '#ffd27a', winA = 0.8, minH = 120, maxH = 560, palms = false, palmColor = '#0a0518', t = 0, shift = 0, edge = null } = o;
  const bs = buildings(seed, 0, minH, maxH);
  ctx.save(); ctx.translate(shift, 0);
  for (const b of bs) {
    ctx.fillStyle = color; ctx.fillRect(b.x, base - b.h, b.w, b.h);
    if (b.ant) ctx.fillRect(b.x + b.w / 2 - 2, base - b.h - 50, 4, 50);
    if (edge) { ctx.fillStyle = edge; ctx.fillRect(b.x, base - b.h, b.w, 3); }
    ctx.fillStyle = win;
    for (const [wx, wy, p] of b.win) { ctx.globalAlpha = winA * (0.55 + 0.45 * Math.sin(t * 0.7 + p * 30)); ctx.fillRect(b.x + wx, base - b.h + wy, 7, 10); }
    ctx.globalAlpha = 1;
  }
  if (palms) { const r = rng(seed + 99); for (let i = 0; i < 7; i++) palm(r() * W, base + 10, 260 + r() * 200, palmColor, t, r() * 6); }
  ctx.restore();
}
function palm(x, base, h, color, t, ph) {
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineCap = 'round';
  const sway = Math.sin(t * 0.9 + ph) * 10;
  ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + 30, base - h * 0.5, x + sway + 20, base - h); ctx.stroke();
  const tx = x + sway + 20, ty = base - h;
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.5 + Math.sin(t + i) * 0.05; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(tx, ty); const ex = tx + Math.cos(a) * 150, ey = ty + Math.sin(a) * 60 + 70; ctx.quadraticCurveTo(tx + Math.cos(a) * 90, ty + Math.sin(a) * 90 - 10, ex, ey); ctx.stroke(); }
  ctx.restore();
}
function hills(base, color, seed) { const r = rng(seed); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, base); for (let x = 0; x <= W; x += 60) ctx.lineTo(x, base - 160 - Math.sin(x / 210 + seed) * 90 - r() * 40); ctx.lineTo(W, base); ctx.closePath(); ctx.fill(); }

// "Los Santos-like" cool scene and "Vice-like" hot scene (generic, original)
function coolCity(t, y0, h, shift = 0) {
  ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W, h); ctx.clip();
  const g = ctx.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, '#0b1d3f'); g.addColorStop(1, '#3c6ea8');
  ctx.fillStyle = g; ctx.fillRect(0, y0, W, h);
  hills(y0 + h * 0.86, '#1b3157', 4);
  skyline(y0 + h, { seed: 11, color: '#0d1a33', win: '#bfe3ff', minH: h * 0.18, maxH: h * 0.62, t, shift, edge: '#4aa3ff55' });
  ctx.restore();
}
function hotCity(t, y0, h, shift = 0) {
  ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W, h); ctx.clip();
  const g = ctx.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, '#2a0b4a'); g.addColorStop(0.7, '#ff4f8b'); g.addColorStop(1, '#ffb36b');
  ctx.fillStyle = g; ctx.fillRect(0, y0, W, h);
  sun(W * 0.5, y0 + h * 0.62, h * 0.26, t);
  skyline(y0 + h, { seed: 23, color: '#1a0626', win: '#ff9ad0', minH: h * 0.15, maxH: h * 0.55, palms: true, t, shift, edge: '#ff3e9a66' });
  ctx.restore();
}

// ---------- subtitles ----------
let WORDS = [], CHUNKS = [];
function buildChunks() {
  CHUNKS = []; let cur = [];
  const flush = () => { if (cur.length) CHUNKS.push(cur); cur = []; };
  for (const w of WORDS) {
    cur.push(w);
    const len = cur.map((x) => x.w).join(' ').length;
    if (/[.,!?:]$/.test(w.w) || cur.length >= 4 || len > 18) flush();
  }
  flush();
  CHUNKS.forEach((c, i) => { c.s = c[0].s; c.e = Math.min(c.at(-1).e + 0.25, CHUNKS[i + 1] ? CHUNKS[i + 1][0].s : 1e9); });
}
function subtitles(t) {
  const c = CHUNKS.find((k) => t >= k.s - 0.05 && t < k.e);
  if (!c) return;
  const words = c.map((w) => w.w.replace(/["]/g, '').toUpperCase());
  const size = 76, gap = 22, y = 1445;
  const ws = words.map((w) => measure(w, size));
  const total = ws.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  let x = W / 2 - total / 2;
  const intro = eBack(prog(t, c.s - 0.05, c.s + 0.12));
  words.forEach((w, i) => {
    const on = t >= c[i].s - 0.03;
    const active = t >= c[i].s - 0.03 && t < (c[i + 1] ? c[i + 1].s : c.e);
    text(w, x + ws[i] / 2, y, { size, align: 'center', color: active ? C.gold : C.white, alpha: on ? 1 : 0.55, stroke: 14, strokeColor: '#000', scale: (active ? 1.08 : 1) * lerp(0.85, 1, intro), glow: active ? 25 : 0, glowColor: C.orange });
    x += ws[i] + gap;
  });
}

// ---------- overlays ----------
const grain = Array.from({ length: 4 }, (_, i) => { const c = document.createElement('canvas'); c.width = 270; c.height = 480; const g = c.getContext('2d'); const id = g.createImageData(270, 480); const r = rng(100 + i); for (let p = 0; p < id.data.length; p += 4) { const v = r() * 255; id.data[p] = id.data[p + 1] = id.data[p + 2] = v; id.data[p + 3] = 26; } g.putImageData(id, 0, 0); return c; });
function overlays(t) {
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalCompositeOperation = 'overlay'; ctx.drawImage(grain[Math.floor(t * 24) % 4], 0, 0, W, H); ctx.restore();
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}
function flash(t, at, dur = 0.25, color = '255,255,255') { const u = prog(t, at, at + dur); if (t < at || u >= 1) return; ctx.fillStyle = `rgba(${color},${(1 - u) * 0.85})`; ctx.fillRect(0, 0, W, H); }
function lightSweep(t, a, b, y0 = 0, h = H) { const u = prog(t, a, b); if (u <= 0 || u >= 1) return; ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W, h); ctx.clip(); ctx.globalCompositeOperation = 'lighter'; const x = lerp(-600, W + 600, eIO(u)); const g = ctx.createLinearGradient(x - 200, 0, x + 200, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.translate(x, H / 2); ctx.rotate(0.35); ctx.translate(-x, -H / 2); ctx.fillRect(x - 200, -H, 400, H * 3); ctx.restore(); }
function source(str, y = 1290, a = 1) { text(str, W / 2, y, { size: 30, font: 'Bebas', color: '#c9c7ff', alpha: a * 0.9, track: 3 }); }

// camera shake from impacts
const IMPACTS = [0.15, 0.45, 1.75, 6.5, 14.0, 22.9, 25.45, 41.85, 47.6, 59.1, 61.4, 62.24, 78.92, 80.08, 85.12];
function shake(t) { let s = 0; for (const a of IMPACTS) { const d = t - a; if (d >= 0 && d < 0.35) s += (1 - d / 0.35) * 14; } return [Math.sin(t * 91) * s, Math.cos(t * 77) * s]; }

// ---------- map ----------
let STATES = [];
function proj(lon, lat, v) { return [W / 2 + (lon - v.lon) * Math.cos(v.lat * Math.PI / 180) * v.k, v.cy - (lat - v.lat) * v.k]; }
function drawStates(v, filter, fill, stroke, lw, glow = 0) {
  ctx.save(); if (glow) { ctx.shadowColor = stroke; ctx.shadowBlur = glow; }
  for (const s of STATES) {
    if (filter && !filter(s.name)) continue;
    ctx.beginPath();
    for (const ring of s.rings) ring.forEach(([lo, la], i) => { const [x, y] = proj(lo, la, v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }
  ctx.restore();
}

// =====================================================================
// SCENES (times come from the narration's word timestamps)
// =====================================================================
function scene1(t) {
  // 0.00–1.75 split screen 2013 / 2026
  if (t < 2.05) {
    const push = 1 + t * 0.05;
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(push, push); ctx.translate(-W / 2, -H / 2);
    coolCity(t, 0, H / 2, -t * 30); hotCity(t, H / 2, H / 2, t * 30);
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.shadowColor = C.teal; ctx.shadowBlur = 30; ctx.fillRect(0, H / 2 - 4, W, 8); ctx.shadowBlur = 0;
    lightSweep(t, 0.2, 1.4);
    const s1 = slam(t, 0.15), s2 = slam(t, 0.45);
    text('2013', W / 2, 560, { size: 300, grad: CHROME, stroke: 10, strokeColor: '#0a1030', glow: 40, glowColor: C.blue, ...s1 });
    text('GTA V', W / 2, 740, { size: 64, font: 'Bebas', track: 14, color: '#bfe3ff', alpha: s1.alpha });
    text('2026', W / 2, 1310, { size: 300, grad: SUNSET, stroke: 10, strokeColor: '#2a0630', glow: 40, glowColor: C.pink, ...s2 });
    text('GTA VI', W / 2, 1140, { size: 64, font: 'Bebas', track: 14, color: '#ffd0e6', alpha: s2.alpha });
    const s3 = slam(t, 1.75, 0.2);
    if (t > 1.75) { ctx.fillStyle = `rgba(0,0,0,${0.55 * s3.alpha})`; ctx.fillRect(0, 0, W, H); text('13 YEARS', W / 2, H / 2, { size: 230, color: '#fff', stroke: 12, glow: 60, glowColor: C.pink, ...s3 }); }
    flash(t, 1.75, 0.2);
    return;
  }
  // 2.05–5.9 odometer 2013 -> 2026
  sky(t, '#05061a', '#1b0a3a', '#3a0d46');
  grid(t, 1150, C.pink, 0.6, 1.5);
  sun(W / 2, 1090, 210, t, 0.9);
  if (t < 5.95) {
    const u = eIO(prog(t, 2.2, 5.2));
    const yr = 2013 + u * 13; const whole = Math.floor(yr), frac = yr - whole;
    const yC = 650;
    ctx.save(); ctx.beginPath(); ctx.rect(0, yC - 165, W, 330); ctx.clip();
    for (let k = -1; k <= 1; k++) { const v = Math.min(2026, whole + k); if (whole + k > 2026 || whole + k < 2013) continue; const yy = yC - (k - frac) * 330; text(String(v), W / 2, yy, { size: 330, grad: k === 0 ? CHROME : ['#7a6bb0', '#3b2a7a'], stroke: 8, strokeColor: '#0a1030', glow: k === 0 ? 40 : 0, glowColor: C.teal, alpha: 1 - Math.abs(k - frac) * 0.6 }); }
    ctx.restore();
    text('GTA V', 210, 400, { size: 70, font: 'Bebas', track: 10, color: '#bfe3ff', alpha: seg(t, 2.1, 5.95) });
    text('GTA VI', 870, 400, { size: 70, font: 'Bebas', track: 10, color: '#ffd0e6', alpha: seg(t, 3.5, 5.95) });
    // arrow line
    const a = prog(t, 2.2, 5.2); ctx.save(); ctx.strokeStyle = C.teal; ctx.lineWidth = 6; ctx.shadowColor = C.teal; ctx.shadowBlur = 20; ctx.beginPath(); ctx.moveTo(300, 400); ctx.lineTo(300 + 460 * a, 400); ctx.stroke(); ctx.restore();
    const rest = pop(t, 5.15);
    text('THE LONGEST WAIT IN GTA HISTORY', W / 2, 870, { size: 54, font: 'Bebas', track: 6, color: C.gold, ...rest, glow: 20, glowColor: C.orange });
    return;
  }
  // 5.95–8.3 WHY SO LONG?
  const s = slam(t, 6.0), q = slam(t, 7.5);
  text('WHY DID IT TAKE', W / 2, 640, { size: 90, font: 'Bebas', track: 10, color: '#d8d0ff', ...pop(t, 5.95) });
  text('SO LONG', W / 2, 800, { size: 230, grad: SUNSET, stroke: 10, strokeColor: '#2a0630', glow: 50, glowColor: C.pink, ...s });
  text('?', W / 2, 1010, { size: 260, color: C.teal, glow: 60, glowColor: C.teal, rot: Math.sin(t * 6) * 0.08, ...q });
}

function scene2(t) {
  sky(t, '#04102a', '#123a6b', '#2b5d93', 0.5);
  // 8.3–10.9 launch date over cool city
  if (t < 10.95) {
    coolCity(t, 900, 1020, -(t - 8.3) * 40);
    const n = Math.floor(clamp((t - 8.6) / 0.06, 0, 13));
    const str = 'SEPT 17, 2013'.slice(0, n);
    card(W / 2, 560, 860, 220, { stroke: C.blue, alpha: seg(t, 8.4, 10.95) });
    text(str, W / 2, 560, { size: 150, color: '#fff', glow: 30, glowColor: C.blue });
    if (n < 13 && Math.floor(t * 4) % 2) text('|', W / 2 + measure(str, 150) / 2 + 20, 560, { size: 150, color: C.teal });
    text('GTA V LAUNCHES', W / 2, 740, { size: 64, font: 'Bebas', track: 12, color: '#bfe3ff', ...pop(t, 9.6) });
    text('PS3 · XBOX 360', W / 2, 820, { size: 44, font: 'Bebas', track: 10, color: '#8fb8ff', ...pop(t, 9.9) });
    return;
  }
  // 10.95–17.85 one billion in 3 days
  if (t < 17.85) {
    const dayIdx = t < 12.3 ? 1 : t < 13.6 ? 2 : 3;
    const cal = pop(t, 11.0);
    ctx.save(); ctx.translate(W / 2, 520); ctx.scale(cal.scale, cal.scale); ctx.globalAlpha = cal.alpha;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(-170, -150, 340, 300, 26); ctx.fill();
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.roundRect(-170, -150, 340, 90, [26, 26, 0, 0]); ctx.fill();
    ctx.restore();
    text('SEPTEMBER 2013', W / 2, 415, { size: 40, font: 'Bebas', track: 6, color: '#fff', alpha: cal.alpha, scale: cal.scale });
    const flip = slam(t, [11.0, 12.3, 13.6][dayIdx - 1], 0.18);
    text(`DAY ${dayIdx}`, W / 2, 560, { size: 140, color: '#14142e', alpha: cal.alpha * flip.alpha, scale: cal.scale * lerp(1, flip.scale, 0.3) });
    const money = 1e9 * eOut(prog(t, 11.2, 14.0));
    const done = t >= 14.0;
    text('$' + fmt(money), W / 2, 830, { size: done ? 140 : 128, color: done ? C.gold : '#fff', glow: done ? 50 : 10, glowColor: C.gold, maxW: 1000, scale: done ? slam(t, 14.0, 0.2).scale : 1 });
    text('IN JUST 3 DAYS', W / 2, 960, { size: 70, font: 'Bebas', track: 10, color: '#fff', ...pop(t, 14.0) });
    // faster than movies, games, albums
    const items = [['MOVIES', 15.6], ['GAMES', 16.0], ['ALBUMS', 16.64]];
    items.forEach(([s, at], i) => { const p = pop(t, at); pill(220 + i * 320, 1110, 280, 90, 'rgba(255,62,154,0.18)', p.alpha, C.pink); text(s, 220 + i * 320, 1112, { size: 54, font: 'Bebas', track: 6, ...p }); });
    text('FASTEST ENTERTAINMENT PROPERTY EVER TO $1B', W / 2, 1220, { size: 44, font: 'Bebas', track: 4, color: C.teal, ...pop(t, 14.6) });
    source('SOURCE: GUINNESS WORLD RECORDS', 1285, seg(t, 14.6, 17.85));
    if (t > 11.2 && t < 14.0) { const r = rng(Math.floor(t * 30)); for (let i = 0; i < 20; i++) { ctx.fillStyle = `rgba(110,220,140,${0.6 * r()})`; const x = r() * W, y = ((r() * H + t * 900) % H); ctx.fillRect(x, y, 60, 28); } }
    return;
  }
  // 17.85–21.1 re-releases timeline
  if (t < 21.1) {
    const y = 760, x0 = 120, x1 = 960;
    const X = (yr) => lerp(x0, x1, (yr - 2013) / 9);
    const a = eOut(prog(t, 17.9, 18.8));
    ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.shadowColor = C.teal; ctx.shadowBlur = 25; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(lerp(x0, x1, a), y); ctx.stroke(); ctx.restore();
    for (let yr = 2013; yr <= 2022; yr++) { const al = clamp((lerp(x0, x1, a) - X(yr)) / 40 + 1); ctx.fillStyle = `rgba(255,255,255,${al})`; ctx.fillRect(X(yr) - 2, y - 14, 4, 28); if ([2013, 2014, 2015, 2018, 2022].includes(yr)) text(String(yr), X(yr), y + 60, { size: 40, font: 'Bebas', color: '#c9c7ff', alpha: al }); }
    text('IT KEPT GOING', W / 2, 470, { size: 120, grad: CHROME, stroke: 6, strokeColor: '#0a1030', ...pop(t, 17.85) });
    const marks = [[2014.88, 'PS4 · XBOX ONE', 'NOV 2014', 19.0, -1], [2015.28, 'PC', 'APR 2015', 20.0, 1], [2022.2, 'PS5 · XBOX SERIES', 'MAR 2022', 19.6, -1]];
    marks.forEach(([yr, name, date, at, side]) => {
      const p = pop(t, at); const x = X(yr), yy = y + side * 190;
      ctx.save(); ctx.globalAlpha = p.alpha; ctx.strokeStyle = C.pink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, yy + side * -50); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = C.pink; ctx.shadowColor = C.pink; ctx.shadowBlur = 25; ctx.beginPath(); ctx.arc(x, y, 16 * p.scale, 0, 7); ctx.fill(); ctx.restore();
      const cx = clamp(x, 200, 880);
      card(cx, yy, 330, 120, { stroke: C.pink, alpha: p.alpha });
      text(name, cx, yy - 18, { size: 44, font: 'Bebas', track: 3, ...p, maxW: 300 });
      text(date, cx, yy + 28, { size: 34, font: 'Bebas', track: 3, color: C.gold, alpha: p.alpha });
    });
    return;
  }
  // 21.1–24.1 sales tower
  const u = eOut(prog(t, 21.2, 22.9));
  grid(t, 1250, C.teal, 0.5);
  const n = Math.floor(u * 26);
  for (let i = 0; i < n; i++) { const yy = 1240 - i * 30; const w = 300 + Math.sin(i) * 8; ctx.fillStyle = i % 2 ? '#1c3f8a' : '#2a5bc0'; ctx.fillRect(W / 2 - w / 2, yy - 26, w, 26); ctx.fillStyle = '#fff3'; ctx.fillRect(W / 2 - w / 2, yy - 26, w, 3); }
  const cnt = 230e6 * u;
  text(fmt(cnt) + (u >= 1 ? '+' : ''), W / 2, 380, { size: 130, color: u >= 1 ? C.gold : '#fff', glow: u >= 1 ? 50 : 10, glowColor: C.gold, maxW: 1000, scale: u >= 1 ? slam(t, 22.9, 0.2).scale : 1 });
  text('COPIES OF GTA V SOLD', W / 2, 510, { size: 64, font: 'Bebas', track: 10, ...pop(t, 22.9) });
  source('SOURCE: TAKE-TWO INTERACTIVE (SOLD-IN UNITS), 2026', 1310, seg(t, 22.9, 24.2));
}

function scene3(t) {
  sky(t, '#060818', '#140a30', '#200b36', 0.6);
  // 24.1–25.4 twist
  if (t < 25.45) {
    const g = Math.floor(t * 20) % 3;
    text("HERE'S THE TWIST", W / 2 + (g - 1) * 6, 820, { size: 150, color: C.pink, alpha: 0.6 * seg(t, 24.1, 25.45, 0.1, 0.1) });
    text("HERE'S THE TWIST", W / 2 - (g - 1) * 6, 820, { size: 150, color: C.teal, alpha: 0.6 * seg(t, 24.1, 25.45, 0.1, 0.1) });
    text("HERE'S THE TWIST", W / 2, 820, { size: 150, color: '#fff', ...slam(t, 24.2) });
    return;
  }
  // 25.45–29.1 release gap != development time
  if (t < 29.1) {
    const y = 700, x0 = 110, x1 = 970; const a = eOut(prog(t, 25.5, 26.4));
    ctx.save(); const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, C.blue); g.addColorStop(1, C.pink); ctx.strokeStyle = g; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.shadowColor = C.pink; ctx.shadowBlur = 30; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(lerp(x0, x1, a), y); ctx.stroke(); ctx.restore();
    text('2013', x0, y + 80, { size: 60, font: 'Bebas', alpha: a }); text('2026', x1, y + 80, { size: 60, font: 'Bebas', alpha: prog(t, 26.2, 26.4) });
    text('13 YEARS = RELEASE GAP', W / 2, 560, { size: 92, color: '#fff', ...pop(t, 26.8), maxW: 980 });
    const p = slam(t, 27.5);
    text('≠ DEVELOPMENT TIME', W / 2, 930, { size: 96, color: C.red, glow: 40, glowColor: C.red, ...p, maxW: 980 });
    return;
  }
  // 29.1–43.8 vertical timeline with camera scroll
  const yTop = 360, step = 175; // px per year
  const Y = (yr) => yTop + (yr - 2013) * step;
  const focus = t < 31.4 ? 2015.5 : t < 34.0 ? 2018 : t < 38.6 ? 2021.2 : 2014.6;
  const prevF = t < 31.4 ? 2015.5 : t < 34.0 ? 2015.5 : t < 38.6 ? 2018 : 2021.2;
  const changeAt = t < 31.4 ? 29.1 : t < 34.0 ? 31.4 : t < 38.6 ? 34.0 : 38.6;
  const f = lerp(prevF, focus, eIO(prog(t, changeAt, changeAt + 0.9)));
  const cam = Y(f) - 960;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 560, W, 790); ctx.clip(); ctx.translate(0, -cam);
  const xL = 300;
  ctx.save(); ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(xL, Y(2013) - 40); ctx.lineTo(xL, Y(2026) + 40); ctx.stroke(); ctx.restore();
  for (let yr = 2013; yr <= 2026; yr++) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(xL, Y(yr), 9, 0, 7); ctx.fill(); text(String(yr), xL - 40, Y(yr), { size: 58, font: 'Bebas', align: 'right', color: '#d8d0ff' }); }
  // GTA Online live band (runs the whole timeline)
  const on = prog(t, 29.1, 30.4);
  if (on > 0) {
    const pulse = 0.6 + 0.4 * Math.sin(t * 6);
    ctx.save(); ctx.strokeStyle = C.teal; ctx.lineWidth = 16; ctx.shadowColor = C.teal; ctx.shadowBlur = 30 * pulse; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(xL + 50, Y(2013)); ctx.lineTo(xL + 50, lerp(Y(2013), Y(2026), eOut(on))); ctx.stroke(); ctx.restore();
  }
  const marker = (yr, at, color, l1, l2, l3, ghost = false) => {
    const p = pop(t, at); if (p.alpha <= 0) return;
    const y = Y(yr); const fl = ghost ? (0.55 + 0.45 * Math.abs(Math.sin(t * 13) * Math.sin(t * 5))) : 1;
    ctx.save(); ctx.globalAlpha = p.alpha * fl; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 30; ctx.beginPath(); ctx.arc(xL, y, 22 * p.scale, 0, 7); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 4; if (ghost) ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(xL + 24, y); ctx.lineTo(xL + 110, y); ctx.stroke(); ctx.restore();
    card(xL + 395, y, 560, 200, { stroke: color, alpha: p.alpha * fl, fill: ghost ? 'rgba(40,25,5,0.7)' : 'rgba(10,12,40,0.82)' });
    text(l1, xL + 395, y - 52, { size: 56, color, alpha: p.alpha * fl, maxW: 520 });
    text(l2, xL + 395, y + 10, { size: 42, font: 'Bebas', track: 3, alpha: p.alpha * fl, maxW: 520 });
    text(l3, xL + 395, y + 60, { size: 34, font: 'Bebas', track: 3, color: '#c9c7ff', alpha: p.alpha * fl, maxW: 520 });
  };
  marker(2018.82, 31.6, C.orange, 'RED DEAD REDEMPTION 2', 'ROCKSTAR SHIPS ANOTHER GIANT', 'OCT 26, 2018');
  marker(2022.1, 34.4, C.pink, '"WELL UNDERWAY"', 'FIRST OFFICIAL CONFIRMATION', 'ROCKSTAR NEWSWIRE · FEB 4, 2022');
  marker(2014.0, 38.8, C.amber, 'REPORTED: WORK BEGAN ~2014', 'BLOOMBERG REPORT, JULY 2022', 'START DATE NEVER PUBLISHED', true);
  // stamp
  if (t > 41.85) { const s = slam(t, 41.85, 0.18); text('NOT CONFIRMED', xL + 395, Y(2014) + 6, { size: 96, color: C.red, stroke: 6, strokeColor: '#200', rot: -0.12, ...s }); }
  ctx.restore();
  // fade edges of the timeline window
  for (const [y0, y1] of [[560, 640], [1350, 1270]]) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#120a2e'); g.addColorStop(1, 'rgba(18,10,46,0)'); ctx.fillStyle = g; ctx.fillRect(0, Math.min(y0, y1), W, 80); }
  const on2 = prog(t, 29.1, 29.5);
  card(W / 2, 455, 860, 140, { stroke: C.teal, alpha: on2, glow: 20 + 20 * Math.sin(t * 6) });
  text('GTA ONLINE', W / 2, 425, { size: 64, color: C.teal, alpha: on2 });
  text('KEPT RUNNING THE WHOLE TIME', W / 2, 490, { size: 40, font: 'Bebas', track: 6, alpha: on2 });
  // header
  text('WHAT FILLED THE GAP', W / 2, 300, { size: 64, font: 'Bebas', track: 10, color: C.gold, alpha: seg(t, 29.1, 43.8) });
}

function scene4(t) {
  // 43.8–47.6 trailer 1
  if (t < 47.6) {
    sky(t, '#0a0420', '#3a0d4a', '#ff4f8b', 0.4);
    const u = prog(t, 43.8, 47.6);
    text('DEC 2023', W / 2, 400, { size: 170, grad: SUNSET, stroke: 8, strokeColor: '#2a0630', glow: 40, glowColor: C.pink, ...slam(t, 43.9) });
    const p = pop(t, 45.7, 0.35);
    ctx.save(); ctx.translate(W / 2, 830); ctx.scale(p.scale * (1 + u * 0.05), p.scale * (1 + u * 0.05)); ctx.globalAlpha = p.alpha;
    ctx.beginPath(); ctx.roundRect(-430, -250, 860, 500, 30); ctx.clip();
    hotCityLocal(t);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = p.alpha; ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(W / 2 - 430 * p.scale, 830 - 250 * p.scale, 860 * p.scale, 500 * p.scale, 30); ctx.stroke(); ctx.restore();
    // play triangle
    ctx.save(); ctx.globalAlpha = p.alpha * 0.9; ctx.fillStyle = '#fff'; ctx.translate(W / 2, 830); ctx.scale(p.scale, p.scale); ctx.beginPath(); ctx.moveTo(-45, -60); ctx.lineTo(70, 0); ctx.lineTo(-45, 60); ctx.closePath(); ctx.shadowColor = '#000'; ctx.shadowBlur = 30; ctx.fill(); ctx.restore();
    text('TRAILER 1', W / 2, 1150, { size: 90, color: '#fff', ...pop(t, 46.2) });
    text('BREAKS RECORDS', W / 2, 1245, { size: 60, font: 'Bebas', track: 10, color: C.gold, ...pop(t, 46.7) });
    return;
  }
  // 47.6–50.5 view counter
  if (t < 50.5) {
    sky(t, '#0a0420', '#2a0b4a', '#4a1450', 0.6);
    const v = 90e6 * eOut(prog(t, 47.6, 49.6)); const done = t >= 49.6;
    const r = rng(9); for (let i = 0; i < 40; i++) { const a = r() * Math.PI * 2; const d = ((t * 600 + r() * 1200) % 1200); ctx.strokeStyle = `rgba(255,255,255,${0.15 + r() * 0.2})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * d, 700 + Math.sin(a) * d); ctx.lineTo(W / 2 + Math.cos(a) * (d + 80), 700 + Math.sin(a) * (d + 80)); ctx.stroke(); }
    text(fmt(v), W / 2, 700, { size: 150, color: done ? C.gold : '#fff', glow: done ? 50 : 20, glowColor: C.gold, maxW: 1000, scale: done ? slam(t, 49.6, 0.2).scale : 1 });
    text('YOUTUBE VIEWS IN 24 HOURS', W / 2, 850, { size: 66, font: 'Bebas', track: 8, ...pop(t, 48.7) });
    text('MOST-VIEWED GAME TRAILER DEBUT', W / 2, 1000, { size: 50, font: 'Bebas', track: 5, color: C.teal, ...pop(t, 49.7) });
    source('SOURCE: GUINNESS WORLD RECORDS · 90,421,491 VIEWS', 1285, seg(t, 49.0, 50.5));
    return;
  }
  // 50.5–54.8 map
  if (t < 54.8) {
    sky(t, '#02101c', '#06243a', '#0b3550', 0.3);
    const u = eIO(prog(t, 50.5, 52.6));
    const v = { lon: lerp(-96, -82.3, u), lat: lerp(38, 27.6, u), k: Math.exp(lerp(Math.log(19), Math.log(150), u)), cy: 800 };
    drawStates(v, null, 'rgba(0,229,212,0.06)', 'rgba(0,229,212,0.45)', 2);
    const fl = prog(t, 52.3, 52.9);
    drawStates(v, (n) => n === 'Florida', `rgba(255,62,154,${0.15 + fl * 0.3})`, C.pink, 5, 30 * (0.5 + fl));
    // Vice City pin (Miami)
    const [px, py] = proj(-80.19, 25.77, v); const pp = pop(t, 50.7);
    ctx.save(); ctx.globalAlpha = pp.alpha; ctx.translate(px, py); ctx.scale(pp.scale, pp.scale); ctx.fillStyle = C.gold; ctx.shadowColor = C.gold; ctx.shadowBlur = 30; ctx.beginPath(); ctx.arc(0, -60, 30, Math.PI, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#2a0630'; ctx.beginPath(); ctx.arc(0, -60, 12, 0, 7); ctx.fill();
    const ring = (t * 1.2) % 1; ctx.strokeStyle = C.gold; ctx.globalAlpha = pp.alpha * (1 - ring); ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, 0, 30 + ring * 60, 10 + ring * 20, 0, 0, 7); ctx.stroke(); ctx.restore();
    text('VICE CITY', clamp(px - 40, 220, 860), py + 70, { size: 80, color: C.gold, glow: 30, glowColor: C.orange, ...pop(t, 50.8) });
    text('LEONIDA', W / 2, 380, { size: 200, grad: SUNSET, stroke: 8, strokeColor: '#2a0630', glow: 40, glowColor: C.pink, ...slam(t, 52.4) });
    text("ROCKSTAR'S TAKE ON FLORIDA", W / 2, 520, { size: 56, font: 'Bebas', track: 8, ...pop(t, 53.1) });
    source('MAP: U.S. CENSUS BOUNDARIES (PUBLIC DOMAIN) · ILLUSTRATIVE', 1300, seg(t, 51, 54.8));
    return;
  }
  // 54.8–57.2 two leads
  if (t < 57.2) {
    sky(t, '#0a0420', '#2a0b4a', '#ff4f8b', 0.4);
    text('TWO LEADS', W / 2, 360, { size: 120, grad: CHROME, stroke: 6, strokeColor: '#0a1030', ...pop(t, 54.8) });
    const plate = (name, y, at, color, side) => {
      const p = pop(t, at); const x = W / 2 + side * (1 - eOut(prog(t, at, at + 0.35))) * 700;
      card(x, y, 760, 260, { stroke: color, alpha: p.alpha, glow: 50 });
      text(name, x, y - 10, { size: 170, color: '#fff', glow: 40, glowColor: color, alpha: p.alpha, track: 10 });
      text('PROTAGONIST', x, y + 95, { size: 40, font: 'Bebas', track: 14, color, alpha: p.alpha });
    };
    plate('LUCIA', 680, 55.6, C.pink, -1);
    plate('JASON', 1030, 56.5, C.teal, 1);
    return;
  }
  // 57.2–62.9 delays
  sky(t, '#12020a', '#2a0612', '#3a0a1c', 0.2);
  text('TWO DELAYS', W / 2, 330, { size: 140, color: C.red, glow: 40, glowColor: C.red, ...slam(t, 57.9) });
  const stamp = (label, y, at, cut, final) => {
    const p = pop(t, at); if (p.alpha <= 0) return;
    card(W / 2, y, 720, 200, { stroke: final ? C.gold : '#ffffff88', alpha: p.alpha, glow: final ? 60 : 10, fill: final ? 'rgba(60,40,0,0.6)' : 'rgba(20,10,20,0.8)' });
    text(label, W / 2, y, { size: 120, color: final ? C.gold : '#fff', glow: final ? 40 : 0, glowColor: C.gold, ...p, maxW: 660 });
    if (cut && t > cut) { const u = eOut(prog(t, cut, cut + 0.15)); ctx.save(); ctx.strokeStyle = C.red; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.shadowColor = C.red; ctx.shadowBlur = 20; ctx.beginPath(); ctx.moveTo(W / 2 - 380, y + 60); ctx.lineTo(W / 2 - 380 + 760 * u, y + 60 - 120 * u); ctx.stroke(); ctx.restore(); text('DELAYED', W / 2 + 230, y - 95, { size: 60, color: C.red, rot: 0.1, ...slam(t, cut + 0.05, 0.15) }); }
  };
  stamp('FALL 2025', 600, 58.7, 59.1);
  stamp('MAY 26, 2026', 870, 59.95, 61.4);
  stamp('NOV 19, 2026', 1140, 62.2, 0, true);
}
function hotCityLocal(t) { ctx.save(); ctx.translate(-W / 2, -250 - 450); hotCity(t, 450, 500, (t - 45) * 20); ctx.restore(); }

// scenic mini-panels for scene 5
function panelBeach(t, x, y, w, h) { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#ff9e6b'); g.addColorStop(0.5, '#ffd28a'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(x + w * 0.7, y + h * 0.42, 50, 0, 7); ctx.fill(); ctx.fillStyle = '#1aa6b7'; ctx.fillRect(x, y + h * 0.5, w, h * 0.2); for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x + ((i * 97 + t * 40) % w), y + h * 0.55 + (i % 3) * 18, 50, 4); } ctx.fillStyle = '#f5d39a'; ctx.fillRect(x, y + h * 0.7, w, h * 0.3); const cols = [C.pink, C.teal, C.orange, '#fff', C.blue]; for (let i = 0; i < 9; i++) { const ux = x + 30 + i * (w - 60) / 8, uy = y + h * 0.8 + (i % 2) * 30; ctx.fillStyle = '#333'; ctx.fillRect(ux - 2, uy - 50, 4, 50); ctx.fillStyle = cols[i % 5]; ctx.beginPath(); ctx.arc(ux, uy - 50, 34, Math.PI, 0); ctx.fill(); } ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); palm(x + 60, y + h * 0.75, h * 0.6, '#3a1a20', t, 1); ctx.restore(); }
function panelHighway(t, x, y, w, h) { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#2a0b4a'); g.addColorStop(0.45, '#ff6a7a'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); const hz = y + h * 0.45, cx = x + w / 2; ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.moveTo(cx - 10, hz); ctx.lineTo(cx + 10, hz); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill(); for (let k = 0; k < 8; k++) { const z = ((k / 8) + t * 0.8) % 1; const yy = hz + Math.pow(z, 2) * (h * 0.55); ctx.fillStyle = '#ffd27a'; ctx.fillRect(cx - 3 - z * 8, yy, 6 + z * 16, 6 + z * 30); } for (let k = 0; k < 6; k++) { const z = ((k / 6) + t * 0.5) % 1; const yy = hz + Math.pow(z, 2) * (h * 0.55); ctx.fillStyle = '#ff3355'; ctx.beginPath(); ctx.arc(cx - 40 - z * w * 0.3, yy, 3 + z * 10, 0, 7); ctx.fill(); ctx.fillStyle = '#fff6d0'; ctx.beginPath(); ctx.arc(cx + 40 + z * w * 0.3, yy, 3 + z * 12, 0, 7); ctx.fill(); } }
function panelNeon(t, x, y, w, h) { ctx.fillStyle = '#0a0420'; ctx.fillRect(x, y, w, h); ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.translate(x, 0); ctx.scale(w / W, 1); skyline(y + h, { seed: 41, color: '#14082a', win: '#ff9ad0', minH: h * 0.25, maxH: h * 0.85, t, edge: C.teal }); ctx.restore(); const signs = [[0.2, 0.35, C.pink, 'HOTEL'], [0.65, 0.25, C.teal, 'CLUB'], [0.45, 0.6, C.gold, 'OPEN']]; for (const [sx, sy, c, s] of signs) text(s, x + w * sx, y + h * sy, { size: 44, color: c, glow: 30, glowColor: c, alpha: 0.7 + 0.3 * (Math.sin(t * 9 + sx * 10) > -0.7 ? 1 : 0) }); }
function panelWild(t, x, y, w, h) { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#0b2a3a'); g.addColorStop(0.6, '#3a6a5a'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#f4f0c8'; ctx.beginPath(); ctx.arc(x + w * 0.75, y + h * 0.25, 36, 0, 7); ctx.fill(); ctx.fillStyle = '#143a30'; for (let i = 0; i < 9; i++) { const tx = x + i * w / 8, th = h * (0.3 + (i % 3) * 0.1); ctx.beginPath(); ctx.moveTo(tx - 40, y + h * 0.7); ctx.lineTo(tx, y + h * 0.7 - th); ctx.lineTo(tx + 40, y + h * 0.7); ctx.fill(); } ctx.fillStyle = '#2a5a6a'; ctx.fillRect(x, y + h * 0.7, w, h * 0.3); for (let i = 0; i < 30; i++) { ctx.strokeStyle = '#1a4a2a'; ctx.lineWidth = 4; const gx = x + (i * 37) % w; ctx.beginPath(); ctx.moveTo(gx, y + h); ctx.lineTo(gx + Math.sin(t * 2 + i) * 8, y + h * 0.78); ctx.stroke(); } ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x + w * 0.2 + Math.sin(t) * 20, y + h * 0.8, 120, 4); }

function scene5(t) {
  sky(t, '#060818', '#12102e', '#1c0b33', 0.6);
  // 62.9–65.55 what took the extra time / the jump (platform generations)
  if (t < 65.55) {
    text('WHAT TOOK THE', W / 2, 330, { size: 90, font: 'Bebas', track: 10, color: '#d8d0ff', ...pop(t, 62.95) });
    text('EXTRA TIME?', W / 2, 450, { size: 150, grad: SUNSET, stroke: 8, strokeColor: '#2a0630', glow: 40, glowColor: C.pink, ...slam(t, 63.4) });
    const p1 = pop(t, 64.5), p2 = pop(t, 64.9);
    card(W / 2, 720, 820, 200, { stroke: C.blue, alpha: p1.alpha });
    text('2013 · PS3 / XBOX 360', W / 2, 700, { size: 70, ...p1, maxW: 760 });
    text('GTA V LAUNCH PLATFORMS', W / 2, 770, { size: 36, font: 'Bebas', track: 6, color: '#8fb8ff', alpha: p1.alpha });
    text('▼', W / 2, 875, { size: 70, color: C.gold, alpha: p2.alpha });
    card(W / 2, 1040, 820, 200, { stroke: C.pink, alpha: p2.alpha, glow: 50 });
    text('2026 · PS5 / XBOX SERIES', W / 2, 1020, { size: 70, ...p2, maxW: 760 });
    text('TWO CONSOLE GENERATIONS LATER', W / 2, 1090, { size: 36, font: 'Bebas', track: 6, color: '#ffb0d6', alpha: p2.alpha });
    return;
  }
  // 65.55–68.95 captured in-game on PS5
  if (t < 68.95) {
    const u = prog(t, 65.55, 68.95);
    ctx.save(); ctx.translate(W / 2, 800); ctx.scale(1 + u * 0.06, 1 + u * 0.06); ctx.translate(-W / 2, -800); hotCity(t, 450, 700, (t - 66) * 25); ctx.restore();
    // viewfinder
    ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; const fx0 = 90, fy0 = 470, fx1 = 990, fy1 = 1130, L = 70;
    for (const [x, y, dx, dy] of [[fx0, fy0, 1, 1], [fx1, fy0, -1, 1], [fx0, fy1, 1, -1], [fx1, fy1, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x, y + dy * L); ctx.lineTo(x, y); ctx.lineTo(x + dx * L, y); ctx.stroke(); }
    ctx.restore();
    if (Math.floor(t * 2) % 2) { ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(150, 530, 16, 0, 7); ctx.fill(); }
    text('REC', 210, 532, { size: 44, font: 'Bebas', align: 'left', track: 4 });
    text('TRAILER 2 · MAY 2025', W / 2, 340, { size: 80, color: '#fff', ...pop(t, 65.6) });
    text('CAPTURED IN-GAME ON PS5', W / 2, 1230, { size: 80, color: C.gold, glow: 30, glowColor: C.orange, ...slam(t, 67.7), maxW: 980 });
    source('ILLUSTRATION · LABEL PER ROCKSTAR GAMES', 1300, seg(t, 66, 68.95));
    return;
  }
  // 68.95–72.85 four panels
  if (t < 72.85) {
    const panels = [[panelBeach, 'BEACHES', 69.28], [panelHighway, 'HIGHWAYS', 69.96], [panelNeon, 'NEON NIGHTS', 70.64], [panelWild, 'BACKCOUNTRY', 71.68]];
    const pw = 470, ph = 470, gx = 30, ox = (W - pw * 2 - gx) / 2, oy = 330;
    panels.forEach(([fn, label, at], i) => {
      const p = pop(t, at, 0.35); if (p.alpha <= 0) return;
      const x = ox + (i % 2) * (pw + gx), y = oy + Math.floor(i / 2) * (ph + gx);
      ctx.save(); ctx.globalAlpha = p.alpha; ctx.translate(x + pw / 2, y + ph / 2); ctx.scale(p.scale, p.scale); ctx.translate(-pw / 2, -ph / 2);
      ctx.beginPath(); ctx.roundRect(0, 0, pw, ph, 24); ctx.clip();
      const z = 1 + prog(t, at, at + 3) * 0.12; ctx.translate(pw / 2, ph / 2); ctx.scale(z, z); ctx.translate(-pw / 2, -ph / 2);
      fn(t, 0, 0, pw, ph);
      ctx.restore();
      ctx.save(); ctx.globalAlpha = p.alpha; ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(x, y, pw, ph, 24); ctx.stroke(); ctx.restore();
      pill(x + pw / 2, y + ph - 50, measure(label, 46, 'Bebas', 4) + 50, 70, 'rgba(0,0,0,0.65)', p.alpha);
      text(label, x + pw / 2, y + ph - 48, { size: 46, font: 'Bebas', track: 4, alpha: p.alpha });
    });
    source('ILLUSTRATIONS · NOT GAME FOOTAGE', 1330, seg(t, 69.3, 72.85));
    return;
  }
  // 72.85–75.0 one city -> whole state
  if (t < 75.0) {
    const u = eIO(prog(t, 73.2, 74.2));
    const v = { lon: -82.3, lat: 27.6, k: 125, cy: 820 };
    ctx.save(); ctx.globalAlpha = u; drawStates(v, (n) => n === 'Florida', 'rgba(255,62,154,0.25)', C.pink, 5, 30); ctx.restore();
    const [cx, cy] = [W / 2 - 330, 820];
    ctx.save(); ctx.globalAlpha = 1 - u * 0.5; ctx.fillStyle = C.blue; ctx.shadowColor = C.blue; ctx.shadowBlur = 30; ctx.beginPath(); ctx.arc(cx, cy, 70, 0, 7); ctx.fill(); ctx.restore();
    text('ONE CITY', cx, cy + 130, { size: 60, font: 'Bebas', track: 6, color: '#bfe3ff', alpha: 1 - u * 0.5 });
    text('GTA V', cx, cy, { size: 44, color: '#0a1030', alpha: 1 - u * 0.5 });
    text('A WHOLE STATE', W / 2 + 120, 340, { size: 130, grad: SUNSET, stroke: 8, strokeColor: '#2a0630', glow: 40, glowColor: C.pink, ...slam(t, 73.2), maxW: 860 });
    text('LEONIDA · GTA VI', W / 2 + 120, 470, { size: 50, font: 'Bebas', track: 8, ...pop(t, 73.6) });
    return;
  }
  // 75.0–77.65 polish
  const s = slam(t, 75.1);
  text('THE EXTRA MONTHS?', W / 2, 640, { size: 110, color: '#fff', ...s });
  text('POLISH.', W / 2, 840, { size: 240, grad: CHROME, stroke: 8, strokeColor: '#0a1030', glow: 50, glowColor: C.teal, ...slam(t, 76.8) });
  lightSweep(t, 76.9, 77.6, 700, 300);
  source('PARAPHRASING ROCKSTAR GAMES, DELAY STATEMENTS 2025', 1000, seg(t, 75.4, 77.65));
}

function scene6(t) {
  // 77.65–78.9 black with growing flare
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (t < 78.9) {
    const u = prog(t, 77.65, 78.9);
    const g = ctx.createRadialGradient(W / 2, 800, 0, W / 2, 800, 50 + u * 500); g.addColorStop(0, `rgba(255,220,180,${0.9 * u})`); g.addColorStop(0.2, `rgba(255,62,154,${0.4 * u})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = `rgba(255,255,255,${u})`; ctx.fillRect(0, 798, W * u, 4);
    return;
  }
  sky(t, '#0a0420', '#3a0d4a', '#ff4f8b', 0.6);
  sun(W / 2, 1130, 300, t);
  grid(t, 1230, C.pink, 0.8, 1);
  skyline(1240, { seed: 57, color: '#12041e', win: '#ff9ad0', minH: 100, maxH: 420, palms: true, t, edge: '#ff3e9a88' });
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, W, H);
  // particles
  const r = rng(5); for (let i = 0; i < 60; i++) { const x = r() * W, sp = 60 + r() * 120; const y = H - ((t * sp + r() * H) % H); ctx.fillStyle = `rgba(255,${180 + r() * 70},200,${0.3 + r() * 0.5})`; ctx.fillRect(x, y, 4, 4); }
  if (t < 81.3) {
    text('NOVEMBER 19', W / 2, 520, { size: 190, grad: CHROME, stroke: 10, strokeColor: '#0a1030', glow: 60, glowColor: C.teal, ...slam(t, 78.92), maxW: 1000 });
    text('2026', W / 2, 760, { size: 300, grad: SUNSET, stroke: 12, strokeColor: '#2a0630', glow: 70, glowColor: C.pink, ...slam(t, 80.08) });
    flash(t, 78.92, 0.25); flash(t, 80.08, 0.3, '255,180,220');
    return;
  }
  // 81.3–87.8 bar + gap + title
  const u = eOut(prog(t, 81.4, 83.6));
  const y = 520, x0 = 110, x1 = 970;
  const hide = 1 - prog(t, 84.9, 85.2);
  ctx.globalAlpha = hide;
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 34; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, C.blue); g.addColorStop(0.5, C.teal); g.addColorStop(1, C.pink); ctx.strokeStyle = g; ctx.shadowColor = C.pink; ctx.shadowBlur = 40; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(lerp(x0, x1, u), y); ctx.stroke(); ctx.restore();
  text('2013', x0, y - 70, { size: 60, font: 'Bebas' }); text('2026', x1, y - 70, { size: 60, font: 'Bebas', alpha: prog(t, 83.4, 83.7) });
  const parts = [['13 YEARS', 81.36], ['2 MONTHS', 82.4], ['2 DAYS', 83.2]];
  parts.forEach(([s, at], i) => { const p = pop(t, at); text(s, W / 2, 680 + i * 110, { size: 100, color: i ? '#fff' : C.gold, glow: 30, glowColor: C.orange, ...p }); });
  ctx.globalAlpha = 1;
  if (t > 85.1) {
    ctx.fillStyle = `rgba(0,0,0,${0.5 * prog(t, 85.1, 85.4)})`; ctx.fillRect(0, 300, W, 800);
    text('GRAND THEFT AUTO VI', W / 2, 620, { size: 120, grad: CHROME, stroke: 8, strokeColor: '#0a1030', glow: 50, glowColor: C.teal, ...slam(t, 85.12), maxW: 1000 });
    text('IS FINALLY HERE', W / 2, 780, { size: 110, grad: SUNSET, stroke: 6, strokeColor: '#2a0630', glow: 40, glowColor: C.pink, ...slam(t, 86.7) });
    flash(t, 85.12, 0.3);
  }
}

function scene7(t) {
  sky(t, '#05061a', '#1b0a3a', '#3a0d46');
  grid(t, 1250, C.teal, 0.5);
  text('WORTH THE', W / 2, 360, { size: 120, color: '#fff', ...slam(t, 88.0) });
  text('WAIT?', W / 2, 520, { size: 230, grad: SUNSET, stroke: 10, strokeColor: '#2a0630', glow: 50, glowColor: C.pink, ...slam(t, 90.56) });
  // vote bar
  const p = pop(t, 88.6);
  const split = 0.5 + Math.sin(t * 2.4) * 0.12;
  const x0 = 120, x1 = 960, y = 800;
  ctx.save(); ctx.globalAlpha = p.alpha;
  ctx.fillStyle = C.teal; ctx.beginPath(); ctx.roundRect(x0, y - 45, (x1 - x0) * split, 90, [45, 0, 0, 45]); ctx.fill();
  ctx.fillStyle = C.pink; ctx.beginPath(); ctx.roundRect(x0 + (x1 - x0) * split, y - 45, (x1 - x0) * (1 - split), 90, [0, 45, 45, 0]); ctx.fill();
  ctx.restore();
  text('YES', x0 + 30, y + 4, { size: 60, align: 'left', color: '#04201e', alpha: p.alpha });
  text('NO', x1 - 30, y + 4, { size: 60, align: 'right', color: '#2a0418', alpha: p.alpha });
  // comment bubble
  const b = pop(t, 91.2); const bob = Math.sin(t * 8) * 10 * b.alpha;
  ctx.save(); ctx.globalAlpha = b.alpha; ctx.translate(W / 2, 1050 + bob); ctx.scale(b.scale, b.scale);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(-380, -90, 760, 180, 40); ctx.fill(); ctx.beginPath(); ctx.moveTo(-60, 85); ctx.lineTo(-110, 160); ctx.lineTo(10, 85); ctx.fill();
  ctx.restore();
  text('TELL US IN THE COMMENTS', W / 2, 1052 + bob, { size: 64, color: '#1a0626', ...b, maxW: 700 });
  const end = seg(t, 91.6, 99, 0.4, 0.1);
  text('ORIGINAL MOTION GRAPHICS · NOT AFFILIATED WITH ROCKSTAR GAMES OR TAKE-TWO', W / 2, 1300, { size: 26, font: 'Bebas', track: 2, color: '#b8b4e8', alpha: end, maxW: 1000 });
  text('SOURCES: ROCKSTAR NEWSWIRE · TAKE-TWO · GUINNESS WORLD RECORDS · BLOOMBERG', W / 2, 1340, { size: 26, font: 'Bebas', track: 2, color: '#b8b4e8', alpha: end, maxW: 1000 });
}

const SCENES = [[0, scene1], [8.3, scene2], [24.1, scene3], [43.8, scene4], [62.9, scene5], [77.65, scene6], [87.8, scene7]];
export const DURATION = 93.6;

function renderAt(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.shadowBlur = 0; ctx.letterSpacing = '0px';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const [sx, sy] = shake(t);
  ctx.save(); ctx.translate(sx, sy);
  let idx = 0; for (let i = 0; i < SCENES.length; i++) if (t >= SCENES[i][0]) idx = i;
  SCENES[idx][1](t);
  ctx.restore();
  // scene-cut flash (short white blink at each scene change)
  for (const [a] of SCENES.slice(1)) flash(t, a, 0.12);
  overlays(t);
  subtitles(t);
  if (t > DURATION - 0.6) { ctx.fillStyle = `rgba(0,0,0,${prog(t, DURATION - 0.6, DURATION)})`; ctx.fillRect(0, 0, W, H); }
}

async function init() {
  await Promise.all([document.fonts.load('100px Anton'), document.fonts.load('100px Bebas')]);
  STATES = await (await fetch('assets/states.json')).json();
  WORDS = await (await fetch('assets/words.json')).json();
  buildChunks();
  window.__gta = { renderAt, DURATION, frame: (t) => { renderAt(t); return cv.toDataURL('image/jpeg', 0.93); } };
  const q = new URLSearchParams(location.search);
  if (q.has('t')) renderAt(Number(q.get('t')));
  else if (q.has('play')) { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DURATION); requestAnimationFrame(loop); }; loop(); }
}
init();
