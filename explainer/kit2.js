// Documentary props for long-form explainers (16:9). Built on engine.js primitives.
// Palette follows the style bible: paper, ink, warm grey, yellow = focus, red = losses.
import { path, line, circle, ellipse, rect, text, at, g, lerp, prog, easeOut, easeInOut, back, hash, now } from './engine.js';

export const P = {
  paper: '#F7F3EA', sepia: '#EFE4CC', ink: '#1E1E1E', grey: '#9A968E', light: '#D9D4C9',
  yellow: '#F5C518', red: '#D7263D', head: '#FFFDF8', cert: '#FBF5E1', certLine: '#8C7A4B', board: '#2E2B27',
};

/** Fountain pen whose nib touches (x, y): the narrator's hand. */
export function pen(x, y, a = 1) {
  if (a <= 0) return;
  const ctx = g();
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(-0.55);
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(40, 18, 120, 14, 0.1, 0, Math.PI * 2); ctx.fill();
  path([[0, 0], [10, -22], [22, -22], [32, 0]].map(([px, py]) => [px - 16, py]), { close: true, fill: '#c9a227', w: 3, color: P.ink, seed: 3 });
  rect(-14, -230, 28, 210, { fill: P.board, w: 3, color: P.ink, seed: 4 });
  rect(-16, -110, 32, 18, { fill: '#c9a227', w: 2, color: P.ink, seed: 5 });
  ctx.restore();
}

/** Where a pen should be while a polyline (pts) is drawn to progress p. */
export function tipOf(pts, p) {
  let total = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); total += d; }
  let left = total * Math.max(0, Math.min(1, p));
  for (let i = 1; i < pts.length; i++) {
    if (seg[i - 1] >= left) { const f = seg[i - 1] ? left / seg[i - 1] : 0; return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]; }
    left -= seg[i - 1];
  }
  return pts[pts.length - 1];
}

export function certificate(x, y, s = 1, o = {}) {
  const name = o.name || '';
  const fill = o.fill ?? 1; // 1 = full, 0.09 = drained to 9%
  at(x, y, s, () => {
    const W = 360, H = 230;
    rect(-W / 2, -H / 2, W, H, { fill: P.cert, w: 5, seed: o.seed ?? 11 });
    // remaining value shaded in warm grey from the bottom up; the lost part outlined in red
    if (fill < 1) {
      const ctx = g();
      const top = H / 2 - (H - 20) * fill - 10;
      ctx.save(); ctx.fillStyle = 'rgba(215,38,61,0.10)'; ctx.fillRect(-W / 2 + 8, -H / 2 + 10, W - 16, top + H / 2 - 10); ctx.restore();
      line(-W / 2 + 8, top, W / 2 - 8, top, { w: 4, color: P.red, seed: 12 });
    }
    rect(-W / 2 + 16, -H / 2 + 16, W - 32, H - 32, { w: 2.5, color: P.certLine, seed: (o.seed ?? 11) + 1 });
    text('STOCK CERTIFICATE', 0, -H / 2 + 44, { size: 22, font: 'Patrick Hand', weight: 'normal', color: P.certLine });
    text(name, 0, -4, { size: 58, font: 'Kalam', maxW: 300, color: P.ink });
    circle(-W / 2 + 62, H / 2 - 52, 26, { fill: o.seal || P.yellow, w: 3.5, seed: 13 });
    text('★', -W / 2 + 62, H / 2 - 50, { size: 28, color: '#fff', wobble: false });
    line(-30, H / 2 - 44, W / 2 - 40, H / 2 - 44, { w: 2.5, color: P.certLine });
    if (o.stamp) text(o.stamp, 40, 50, { size: 54, font: 'Permanent Marker', weight: 'normal', color: P.red, rot: -0.12 });
  }, o.rot || 0, o.alpha ?? 1);
}

export function priceTag(x, y, s, label, o = {}) {
  at(x, y, s, () => {
    if (o.glow) { const c = g(); c.save(); c.fillStyle = 'rgba(245,197,24,0.45)'; c.beginPath(); c.ellipse(60, 0, 160 * o.glow, 90 * o.glow, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
    path([[-40, -56], [170, -56], [170, 56], [-40, 56], [-90, 0]], { close: true, fill: o.fill || '#fff', w: 5, seed: 21 });
    circle(-46, 0, 10, { w: 4, seed: 22 });
    text(label, 65, 4, { size: o.size || 56, color: o.color || P.ink, font: 'Kalam', maxW: 200 });
  }, o.rot ?? 0.12, o.alpha ?? 1);
}

export function briefcase(x, y, s, o = {}) {
  const open = o.open ?? 0, locked = o.locked ?? false;
  at(x, y, s, () => {
    rect(-210, -130, 420, 260, { fill: '#6b4a2e', w: 6, seed: 31 });
    rect(-210, -130, 420, 40, { fill: '#5a3d25', w: 5, seed: 32 });
    path([[-60, -130], [-60, -175], [60, -175], [60, -130]], { w: 12, color: '#3d2a19', seed: 33 });
    if (open > 0) {
      const c = g(); c.save(); c.globalAlpha *= open;
      for (let i = 0; i < 3; i++) rect(-150 + i * 18, -110 + i * 12, 300, 200, { fill: P.cert, w: 3, seed: 34 + i });
      c.restore();
    }
    // latch + padlock
    rect(-24, -112, 48, 30, { fill: '#c9a227', w: 4, seed: 37 });
    if (locked) padlock(0, -60, 0.8, o.shackle ?? 0);
  });
}

export function padlock(x, y, s, openAmt = 0) {
  at(x, y, s, () => {
    path([[-34, 0], [-34, -50 - openAmt * 30], [-20, -80 - openAmt * 30], [20, -80 - openAmt * 30], [34, -50 - openAmt * 30], [34, 0 - openAmt * 30]], { w: 12, color: '#7a7a7a', seed: 41 });
    rect(-56, 0, 112, 90, { fill: '#c9a227', w: 5, seed: 42 });
    circle(0, 38, 12, { fill: P.ink, w: 0 }); line(0, 40, 0, 66, { w: 8 });
  });
}

export function key(x, y, s, rot = 0) {
  at(x, y, s, () => {
    circle(-60, 0, 26, { w: 7, color: '#b08a1f', seed: 51 });
    line(-34, 0, 70, 0, { w: 9, color: '#b08a1f', seed: 52 });
    line(50, 0, 50, 22, { w: 8, color: '#b08a1f' }); line(68, 0, 68, 18, { w: 8, color: '#b08a1f' });
  }, rot);
}

export function domino(x, y, s, label, fall = 0, o = {}) {
  // fall: 0 standing .. 1 flat (rotates around bottom-right corner)
  const ctx = g();
  ctx.save(); ctx.translate(x + 40 * s, y); ctx.rotate(easeInOut(Math.min(1, fall)) * Math.PI / 2 * 0.92); ctx.translate(-40 * s, 0);
  at(0, 0, s, () => {
    rect(-40, -170, 80, 170, { fill: o.fill || '#fff', w: 5, seed: 61 + (o.seed || 0) });
    line(-30, -85, 30, -85, { w: 3, color: P.grey });
    circle(0, -125, 8, { fill: P.ink, w: 0 }); circle(0, -45, 8, { fill: P.ink, w: 0 });
  });
  ctx.restore();
  if (label) text(label, x, y + 40, { size: 30, font: 'Kalam', color: fall > 0.5 ? P.red : P.ink });
}

export function newspaper(x, y, s, masthead, date, headline, o = {}) {
  at(x, y, s, () => {
    rect(-380, -280, 760, 560, { fill: '#F4F0E4', w: 5, seed: 71 });
    text(masthead, 0, -228, { size: 56, font: 'Permanent Marker', weight: 'normal' });
    line(-350, -190, 350, -190, { w: 3 }); line(-350, -150, 350, -150, { w: 3 });
    text(date, -350, -170, { size: 24, font: 'Patrick Hand', weight: 'normal', align: 'left' });
    headline.split('\n').forEach((l, i) => text(l, 0, -90 + i * 78, { size: 74, font: 'Kalam', maxW: 690 }));
    const top = -90 + headline.split('\n').length * 78;
    for (let i = 0; i < 6; i++) { line(-350, top + i * 34, -20, top + i * 34, { w: 3, color: P.grey, seed: 72 + i }); line(20, top + i * 34, 350, top + i * 34, { w: 3, color: P.grey, seed: 82 + i }); }
  }, o.rot || 0, o.alpha ?? 1);
}

export function tv(x, y, s, drawScreen) {
  at(x, y, s, () => {
    rect(-260, -190, 520, 360, { fill: '#7a5534', w: 6, seed: 91 });
    rect(-220, -160, 340, 290, { fill: '#cfd3cf', w: 5, seed: 92 });
    const c = g(); c.save(); c.beginPath(); c.rect(-220, -160, 340, 290); c.clip(); drawScreen(-50, -15);
    c.globalAlpha = 0.08; for (let i = -160; i < 130; i += 6) { c.fillStyle = '#000'; c.fillRect(-220, i, 340, 2); } c.restore();
    circle(180, -80, 22, { fill: '#c9a227', w: 4 }); circle(180, 0, 22, { fill: '#c9a227', w: 4 });
    line(-200, 170, -230, 230, { w: 8 }); line(200, 170, 230, 230, { w: 8 });
  });
}

export function goldBar(x, y, s, rot = 0) {
  at(x, y, s, () => {
    path([[-90, 34], [90, 34], [62, -34], [-62, -34]], { close: true, fill: P.yellow, w: 5, seed: 101 });
    text('GOLD', 0, 4, { size: 32, color: '#6b5200' });
  }, rot);
}

export function dollar(x, y, s, rot = 0) {
  at(x, y, s, () => {
    rect(-90, -42, 180, 84, { fill: '#e4ead9', w: 5, seed: 111 });
    circle(0, 0, 26, { w: 3, seed: 112 });
    text('$', 0, 3, { size: 44, color: P.ink });
  }, rot);
}

export function chain(x0, y0, x1, y1, broken = 0) {
  const n = 7;
  for (let i = 0; i < n; i++) {
    if (broken > 0 && i === 3) continue;
    const f = (i + 0.5) / n;
    const off = broken > 0 ? (i < 3 ? -1 : 1) * broken * 40 : 0;
    ellipse(lerp(x0, x1, f) + off, lerp(y0, y1, f) + Math.abs(off) * 0.6, 20, 12, { w: 6, color: '#777', seed: 120 + i });
  }
}

export function thermometer(x, y, s, level, o = {}) {
  at(x, y, s, () => {
    rect(-34, -300, 68, 340, { fill: '#fff', w: 5, seed: 131 });
    circle(0, 76, 62, { fill: P.red, w: 5, seed: 132 });
    const h = 330 * level; g().fillStyle = P.red; g().fillRect(-20, 40 - h, 40, h + 12);
    for (let i = 0; i < 7; i++) line(34, -270 + i * 46, 56, -270 + i * 46, { w: 4, seed: 133 + i });
  });
}

export function barrel(x, y, s) {
  at(x, y, s, () => {
    rect(-80, -115, 160, 230, { fill: '#2b2b2b', w: 5, seed: 141 });
    ellipse(0, -115, 80, 20, { fill: '#444', w: 5, seed: 142 });
    line(-80, -45, 80, -45, { w: 5, color: '#777' }); line(-80, 45, 80, 45, { w: 5, color: '#777' });
    text('OIL', 0, 0, { size: 50, color: P.yellow, font: 'Permanent Marker', weight: 'normal' });
  });
}

export function car(x, y, s, seed = 1) {
  at(x, y, s, () => {
    path([[-110, 0], [-110, -40], [-60, -44], [-36, -80], [50, -80], [76, -44], [110, -40], [110, 0]], { close: true, fill: '#fff', w: 5, seed: 151 + seed });
    circle(-62, 2, 22, { fill: P.ink, w: 0 }); circle(62, 2, 22, { fill: P.ink, w: 0 });
    line(6, -78, 6, -44, { w: 4 });
  });
}

export function dial(x, y, s, value, label) {
  at(x, y, s, () => {
    circle(0, 0, 120, { fill: '#fff', w: 6, seed: 161 });
    for (let i = 0; i <= 10; i++) { const a = Math.PI * (0.75 + 1.5 * i / 10); line(Math.cos(a) * 96, Math.sin(a) * 96, Math.cos(a) * 112, Math.sin(a) * 112, { w: 4, color: i > 7 ? P.red : P.ink }); }
    const a = Math.PI * (0.75 + 1.5 * value);
    line(0, 0, Math.cos(a) * 88, Math.sin(a) * 88, { w: 9, color: value > 0.7 ? P.red : P.ink, seed: 162 });
    circle(0, 0, 12, { fill: P.ink, w: 0 });
    text(label, 0, 160, { size: 34, font: 'Kalam' });
  });
}

export function coin(x, y, r, label) {
  circle(x, y, r, { fill: P.yellow, w: 5, seed: 171 + Math.round(r) });
  circle(x, y, r * 0.72, { w: 2.5, color: '#8a6d00' });
  if (label) text(label, x, y + 2, { size: r * 0.7, color: '#5c4700' });
}

export function photoFrame(x, y, s, drawInside, caption) {
  at(x, y, s, () => {
    rect(-120, -150, 240, 300, { fill: '#8a6542', w: 5, seed: 181 });
    rect(-96, -126, 192, 210, { fill: '#f3ead8', w: 3, seed: 182 });
    const c = g(); c.save(); c.beginPath(); c.rect(-96, -126, 192, 210); c.clip(); drawInside(0, 80); c.restore();
    if (caption) text(caption, 0, 118, { size: 24, font: 'Patrick Hand', weight: 'normal', color: '#fff', maxW: 200 });
  });
}

export function letter(x, y, s, lines, o = {}) {
  at(x, y, s, () => {
    rect(-240, -300, 480, 600, { fill: '#fffaf0', w: 4, seed: 191 });
    for (let i = 0; i < 12; i++) line(-200, -220 + i * 42, 200, -220 + i * 42, { w: 1.5, color: '#c8d4e0', seed: 192 + i });
    lines.forEach((l, i) => text(l, -200, -232 + i * 42, { size: 36, font: 'Patrick Hand', weight: 'normal', align: 'left', base: 'alphabetic', color: '#2a3550', alpha: o.reveal ? Math.max(0, Math.min(1, o.reveal * lines.length - i)) : 1 }));
  }, o.rot || 0);
}

export function ledger(x, y, s, rows, reveal = 1) {
  at(x, y, s, () => {
    rect(-330, -260, 660, 520, { fill: '#f6f1e2', w: 5, seed: 201 });
    line(0, -260, 0, 260, { w: 4, color: P.grey });
    text('PENSION FUND · MEMBERS', -300, -215, { size: 30, font: 'Kalam', align: 'left' });
    rows.forEach((r, i) => {
      const a = Math.max(0, Math.min(1, reveal * rows.length - i));
      text(r[0], -300, -150 + i * 56, { size: 30, font: 'Patrick Hand', weight: 'normal', align: 'left', alpha: a });
      text(r[1], 300, -150 + i * 56, { size: 30, font: 'Patrick Hand', weight: 'normal', align: 'right', alpha: a, color: P.grey });
    });
  });
}

export function factory(x, y, s, smoke = 1) {
  at(x, y, s, () => {
    path([[-220, 0], [-220, -140], [-140, -90], [-140, -140], [-60, -90], [-60, -140], [20, -90], [20, -140], [220, -140], [220, 0]], { close: true, fill: '#fff', w: 5, seed: 211 });
    rect(120, -300, 50, 160, { fill: '#fff', w: 5, seed: 212 });
    for (let i = 0; i < 4; i++) {
      const k = (now() * 0.6 + i / 4) % 1;
      circle(145 + k * 60, -320 - k * 150, (20 + k * 30), { fill: `rgba(154,150,142,${0.5 * (1 - k) * smoke})`, w: 0 });
    }
  });
}

/** Simple ink stick figure head-on, for Walt and Ruth. */
export { stick } from './kit.js';

/** Bottom date ribbon: a line of key years with a yellow marker at the current year. */
export function dateRibbon(W, H, year, alpha = 1) {
  if (alpha <= 0) return;
  const years = [1969, 1971, 1972, 1973, 1974, 1980, 1985, 1998, 2001, 2026];
  const x0 = 160, x1 = W - 160, y = H - 48;
  const c = g(); c.save(); c.globalAlpha *= alpha;
  line(x0, y, x1, y, { w: 3, color: P.grey, seed: 221 });
  const pos = (yr) => {
    for (let i = 0; i < years.length - 1; i++) if (yr <= years[i + 1]) return lerp(i, i + 1, (yr - years[i]) / (years[i + 1] - years[i]));
    return years.length - 1;
  };
  years.forEach((yr, i) => {
    const x = lerp(x0, x1, i / (years.length - 1));
    line(x, y - 8, x, y + 8, { w: 3, color: P.grey });
    text(String(yr), x, y + 26, { size: 20, font: 'Patrick Hand', weight: 'normal', color: P.grey, wobble: false });
  });
  const mx = lerp(x0, x1, pos(year) / (years.length - 1));
  circle(mx, y, 11, { fill: P.yellow, w: 3, seed: 222 });
  c.restore();
}

export function source(W, H, s) {
  text(s, 60, H - 92, { size: 22, font: 'Patrick Hand', weight: 'normal', color: P.grey, align: 'left', wobble: false });
}
