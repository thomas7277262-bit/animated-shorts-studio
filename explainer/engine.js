// Hand-drawn 2D drawing kit for finance explainer videos.
// Every stroke is re-jittered 8 times a second ("line boil"), which gives the
// frames the slightly alive look of hand-drawn animation. Everything is
// deterministic: the same time always produces the same frame.

export let W = 1080, H = 1920;
export function setSize(w, h) { W = w; H = h; paperTex = null; }
export const C = {
  ink: '#1f1d1a', paper: '#fbf7ee', red: '#d62828', skin: '#f7d6b0', board: '#2f7a4b', wood: '#6b3f1d',
  beige: '#f1e4c6', bar: '#d8bf8c', gold: '#e8b422', green: '#3e9b52', grey: '#c9c5bd', chalk: '#f4f1e6',
  blue: '#2f6fb3', yellow: '#ffe066', money: '#7fbf6a', dark: '#3a3631',
};

let ctx = null, BOIL = 0, TIME = 0;
export function bind(c) { ctx = c; }
export function setTime(t) { TIME = t; BOIL = Math.floor(t * 8); }
export const now = () => TIME;
export const g = () => ctx;

// ---------- maths ----------
export function hash(a, b = 0, c = 0) {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export const sh = (s) => { let h = 7; for (const ch of String(s)) h = Math.imul(h, 31) + ch.charCodeAt(0); return h; };
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const prog = (t, a, d) => clamp01((t - a) / d);
export const easeOut = (x) => 1 - (1 - x) ** 3;
export const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
export const easeIn = (x) => x * x * x;
export function back(x) { const c1 = 1.9, c3 = c1 + 1; return x <= 0 ? 0 : x >= 1 ? 1 : 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2; }
/** Pop-in scale for something that appears at time a. */
export const pop = (t, a, d = 0.38) => back(prog(t, a, d));
const jit = (seed, i, amp) => (hash(seed, i, BOIL) - 0.5) * 2 * amp;

// ---------- strokes ----------
function wobbly(pts, seed, amp, close) {
  const out = [];
  const n = pts.length;
  const segs = close ? n : n - 1;
  let k = 0;
  for (let s = 0; s < segs; s++) {
    const [x0, y0] = pts[s], [x1, y1] = pts[(s + 1) % n];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(len / 45));
    for (let j = 0; j < steps; j++) {
      const f = j / steps;
      out.push([x0 + (x1 - x0) * f + jit(seed, k, amp), y0 + (y1 - y0) * f + jit(seed + 99, k, amp)]);
      k++;
    }
  }
  if (!close) { const [x, y] = pts[n - 1]; out.push([x + jit(seed, k, amp), y + jit(seed + 99, k, amp)]); }
  return out;
}
function truncate(pts, p) {
  if (p >= 1) return pts;
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let left = total * p;
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (d >= left) { const f = d ? left / d : 0; out.push([lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]); return out; }
    left -= d; out.push(pts[i]);
  }
  return out;
}
function trace(pts, close) {
  ctx.beginPath();
  if (pts.length < 3) { ctx.moveTo(...pts[0]); for (const p of pts.slice(1)) ctx.lineTo(...p); if (close) ctx.closePath(); return; }
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  const l = pts[pts.length - 1];
  if (close) { ctx.quadraticCurveTo(l[0], l[1], pts[0][0], pts[0][1]); ctx.closePath(); } else ctx.lineTo(l[0], l[1]);
}
/** Hand-drawn polyline. o: { w, color, amp, seed, p (0..1 draw-on), close, fill, alpha, dash } */
export function path(pts, o = {}) {
  if (!pts.length) return;
  const { w = 6, color = C.ink, amp = 1.6, seed = 1, p = 1, close = false, fill = null, alpha = 1, cap = 'round' } = o;
  if (p <= 0) return;
  const raw = wobbly(pts, seed, amp, close);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.lineJoin = 'round'; ctx.lineCap = cap;
  if (fill && p >= 1) { trace(raw, close); ctx.fillStyle = fill; ctx.fill(); }
  if (w > 0) {
    const pts2 = close && p < 1 ? truncate([...raw, raw[0]], p) : truncate(raw, p);
    trace(pts2, close && p >= 1);
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
  }
  ctx.restore();
}
export const line = (x0, y0, x1, y1, o) => path([[x0, y0], [x1, y1]], o);
export function ellipse(x, y, rx, ry, o = {}) {
  const n = Math.max(14, Math.round((rx + ry) / 7));
  const pts = [];
  const seed = o.seed ?? 3;
  const start = o.start ?? -Math.PI * 0.6;
  for (let i = 0; i < n; i++) {
    const a = start + (i / n) * Math.PI * 2;
    const r = 1 + jit(seed + 7, i, 0.012);
    pts.push([x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r]);
  }
  path(pts, { ...o, close: true, amp: o.amp ?? 1.1 });
}
export const circle = (x, y, r, o) => ellipse(x, y, r, r, o);
export function rect(x, y, w, h, o = {}) { path([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { ...o, close: true }); }

/** Loose "marker" circle drawn around something, overshooting its start like a real pen. */
export function scribbleCircle(x, y, rx, ry, p, o = {}) {
  const pts = [];
  const n = 40;
  for (let i = 0; i <= n * 1.12; i++) {
    const a = -Math.PI * 0.7 + (i / n) * Math.PI * 2;
    const r = 1 + 0.06 * Math.sin(i * 0.4) + (i / n) * 0.06;
    pts.push([x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r]);
  }
  path(pts, { w: 7, color: C.red, amp: 1, seed: o.seed ?? 11, p, ...o });
}
export function arrow(x0, y0, x1, y1, o = {}) {
  const p = o.p ?? 1;
  const mx = (x0 + x1) / 2 + (o.bend ?? 0), my = (y0 + y1) / 2 - Math.abs(o.bend ?? 0) * 0.3;
  const pts = [];
  for (let i = 0; i <= 12; i++) { const f = i / 12; pts.push([(1 - f) ** 2 * x0 + 2 * (1 - f) * f * mx + f * f * x1, (1 - f) ** 2 * y0 + 2 * (1 - f) * f * my + f * f * y1]); }
  path(pts, { w: 7, color: C.red, ...o, p: Math.min(1, p * 1.25) });
  if (p > 0.8) {
    const a = Math.atan2(y1 - pts[10][1], x1 - pts[10][0]);
    const L = o.head ?? 30;
    path([[x1 - Math.cos(a - 0.5) * L, y1 - Math.sin(a - 0.5) * L], [x1, y1], [x1 - Math.cos(a + 0.5) * L, y1 - Math.sin(a + 0.5) * L]], { w: 7, color: C.red, ...o, p: 1 });
  }
}

// ---------- text ----------
export function text(s, x, y, o = {}) {
  const { size = 60, font = 'Kalam', color = C.ink, align = 'center', base = 'middle', rot = 0, alpha = 1, stroke = null, sw = 10, weight = 'bold', maxW = 0, wobble = true } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(rot + (wobble ? jit(sh(s), 1, 0.006) : 0));
  ctx.font = `${weight} ${size}px "${font}"`;
  ctx.textAlign = align; ctx.textBaseline = base;
  if (maxW) { const m = ctx.measureText(s).width; if (m > maxW) ctx.scale(maxW / m, maxW / m); }
  if (stroke) { ctx.lineJoin = 'round'; ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.strokeText(s, 0, 0); }
  ctx.fillStyle = color; ctx.fillText(s, 0, 0);
  ctx.restore();
}
export function measure(s, size, font = 'Kalam', weight = 'bold') { ctx.save(); ctx.font = `${weight} ${size}px "${font}"`; const m = ctx.measureText(s).width; ctx.restore(); return m; }

// ---------- transforms ----------
export function at(x, y, s, fn, rot = 0, alpha = 1) {
  if (s <= 0.001 || alpha <= 0.001) return;
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= alpha; fn(); ctx.restore();
}

// ---------- paper ----------
let paperTex = null;
export function paper(color = C.paper) {
  if (!paperTex) {
    paperTex = document.createElement('canvas');
    paperTex.width = W; paperTex.height = H;
    const p = paperTex.getContext('2d');
    for (let i = 0; i < 26000; i++) {
      const x = hash(i, 1) * W, y = hash(i, 2) * H, v = hash(i, 3);
      p.fillStyle = v > 0.5 ? 'rgba(80,60,30,0.035)' : 'rgba(255,255,255,0.05)';
      p.fillRect(x, y, 1 + hash(i, 4) * 2.5, 1 + hash(i, 5) * 2.5);
    }
    const gr = p.createRadialGradient(W / 2, H * 0.42, H * 0.25, W / 2, H * 0.5, H * 0.75);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(90,70,40,0.10)');
    p.fillStyle = gr; p.fillRect(0, 0, W, H);
  }
  ctx.fillStyle = color; ctx.fillRect(-W, -H, W * 3, H * 3);
  ctx.drawImage(paperTex, 0, 0);
}
