// Characters and props built from the hand-drawn primitives in engine.js.
import { C, path, line, circle, ellipse, rect, text, at, hash, now, g, lerp } from './engine.js';

const rad = (d) => (d * Math.PI) / 180;
const limb = (x, y, a, L) => [x + Math.sin(rad(a)) * L, y + Math.cos(rad(a)) * L];

// Angles: 0 = straight down, +90 = pointing to screen-right, 180 = straight up.
const POSES = {
  stand:    { la: [-22, -8], ra: [22, 8], ll: [-14, -6], rl: [14, 6] },
  hips:     { la: [-50, -150], ra: [50, 150], ll: [-16, -8], rl: [16, 8] },
  point:    { la: [-22, -8], ra: [118, 112], ll: [-14, -6], rl: [14, 6] },
  pointL:   { la: [-118, -112], ra: [22, 8], ll: [-14, -6], rl: [14, 6] },
  cheer:    { la: [-150, -168], ra: [150, 168], ll: [-18, -8], rl: [18, 8] },
  shrug:    { la: [-62, -150], ra: [62, 150], ll: [-14, -6], rl: [14, 6] },
  panic:    { la: [-150, 40], ra: [150, -40], ll: [-24, -10], rl: [24, 10] },
  mega:     { la: [-22, -8], ra: [96, 96], ll: [-14, -6], rl: [14, 6] },
  megaL:    { la: [-96, -96], ra: [22, 8], ll: [-14, -6], rl: [14, 6] },
  think:    { la: [-22, -8], ra: [28, 168], ll: [-14, -6], rl: [14, 6] },
  hold:     { la: [-140, -175], ra: [140, 175], ll: [-14, -6], rl: [14, 6] },
  phone:    { la: [-22, -8], ra: [40, 175], ll: [-14, -6], rl: [14, 6] },
  sad:      { la: [-10, -4], ra: [10, 4], ll: [-10, -4], rl: [10, 4] },
  sit:      { la: [30, 70], ra: [40, 80], ll: [80, 0], rl: [90, 5] },
};

/**
 * Stick figure with a round head. Feet at (x, y).
 * o: { s, pose, face, talk (0..1), hat, hair, glasses, tie, mustache, beard (0..1), look, seed, flip, prop, armWave }
 */
export function stick(x, y, o = {}) {
  const t = now();
  const { s = 1, pose = 'stand', face = 'smile', talk = 0, hat = null, hair = 'messy', glasses = false, tie = null,
    mustache = false, beard = 0, look = 0, seed = 1, prop = null, wave = 0, bob = 1, flip = false, skin = C.skin, hairColor = C.ink, color = C.ink } = o;
  const P = typeof pose === 'string' ? POSES[pose] || POSES.stand : pose;
  const ctx = g();
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  const breathe = Math.sin(t * 2.2 + seed) * 3 * bob;
  const sitting = pose === 'sit';
  const hipY = sitting ? -120 : -135;
  const shY = hipY - 115 + breathe;
  const headY = shY - 92;
  const sd = seed * 13;
  const w = 6.5;
  const sway = (k) => Math.sin(t * 3 + seed + k) * wave;
  // legs
  for (const [key, side] of [['ll', -1], ['rl', 1]]) {
    const [a1, a2] = P[key];
    const k = limb(side * 4, hipY, a1, sitting ? 70 : 70);
    const f = limb(k[0], k[1], sitting ? 0 : a2, sitting ? 72 : 70);
    path([[side * 4, hipY], k, f], { w, seed: sd + (side > 0 ? 1 : 2), color });
    path([f, [f[0] + side * 16, f[1] + 1]], { w, seed: sd + 3 + side, color });
  }
  // body
  line(0, shY - 8, 0, hipY, { w, seed: sd + 4, color });
  // tie
  const tw = o.tieW || 9;
  if (tie) path([[0, shY - 4], [-tw, shY + 8], [0, shY + 58], [tw, shY + 8]], { w: 3, fill: tie, close: true, seed: sd + 5, color });
  // arms
  const hands = {};
  for (const [key, side] of [['la', -1], ['ra', 1]]) {
    const [a1, a2] = P[key];
    const e = limb(0, shY + 6, a1 + sway(side) * 10, 68);
    const h = limb(e[0], e[1], a2 + sway(side + 2) * 16, 66);
    path([[0, shY + 6], e, h], { w, seed: sd + 6 + side, color });
    hands[key] = h;
  }
  // head
  const hx = 0, hy = headY;
  circle(hx, hy, 62, { w: 6, fill: skin, seed: sd + 8, color });
  if (beard > 0) {
    ctx.save();
    ctx.beginPath(); ctx.arc(hx, hy, 60, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineTo(hx, hy + 20 + 40 * beard); ctx.closePath();
    ctx.fillStyle = 'rgba(110,100,95,0.85)'; ctx.globalAlpha = Math.min(1, beard * 1.4); ctx.fill(); ctx.restore();
  }
  // hair
  if (hair === 'messy') {
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const a = Math.PI * (1.08 + (i / 14) * 0.84);
      const r = i % 2 ? 62 : 74 + hash(seed, i) * 8;
      pts.push([hx + Math.cos(a) * r, hy + Math.sin(a) * r - 2]);
    }
    path(pts, { w: 5, seed: sd + 9, color: hairColor, fill: null });
    path([[hx - 52, hy - 30], [hx - 30, hy - 52], [hx, hy - 60], [hx + 30, hy - 52], [hx + 52, hy - 30]], { w: 14, seed: sd + 10, color: hairColor, amp: 2.5 });
  } else if (hair === 'neat') {
    ctx.save(); ctx.beginPath(); ctx.arc(hx, hy, 63, Math.PI * 1.05, Math.PI * 1.95); ctx.quadraticCurveTo(hx + 10, hy - 30, hx - 60, hy - 18); ctx.closePath(); ctx.fillStyle = hairColor; ctx.fill(); ctx.restore();
  } else if (hair === 'bun') {
    circle(hx + 8, hy - 74, 22, { w: 4, fill: hairColor, seed: sd + 11 });
    ctx.save(); ctx.beginPath(); ctx.arc(hx, hy, 63, Math.PI * 1.0, Math.PI * 2.0); ctx.quadraticCurveTo(hx, hy - 36, hx - 63, hy); ctx.closePath(); ctx.fillStyle = hairColor; ctx.fill(); ctx.restore();
  }
  if (o.sideburns) { line(hx - 58, hy - 26, hx - 56, hy + 16, { w: 11, seed: sd + 30, color: hairColor }); line(hx + 58, hy - 26, hx + 56, hy + 16, { w: 11, seed: sd + 31, color: hairColor }); }
  // face
  const lx = look * 10;
  const blink = hash(seed, Math.floor(t * 1.3)) < 0.18 && (t * 1.3) % 1 < 0.12;
  const eyeY = hy - 6;
  const worried = face === 'worried' || face === 'sad' || face === 'shock';
  if (blink) { line(hx - 28 + lx, eyeY, hx - 14 + lx, eyeY, { w: 4, seed: sd + 12 }); line(hx + 14 + lx, eyeY, hx + 28 + lx, eyeY, { w: 4, seed: sd + 13 }); }
  else if (face === 'shock') { circle(hx - 21 + lx, eyeY, 9, { w: 4, fill: '#fff', seed: sd + 12 }); circle(hx + 21 + lx, eyeY, 9, { w: 4, fill: '#fff', seed: sd + 13 }); circle(hx - 21 + lx, eyeY, 3, { w: 3, fill: C.ink }); circle(hx + 21 + lx, eyeY, 3, { w: 3, fill: C.ink }); }
  else { circle(hx - 21 + lx, eyeY, 4.5, { w: 3, fill: C.ink, seed: sd + 12 }); circle(hx + 21 + lx, eyeY, 4.5, { w: 3, fill: C.ink, seed: sd + 13 }); }
  if (worried) { line(hx - 34 + lx, eyeY - 18, hx - 12 + lx, eyeY - 24, { w: 4, seed: sd + 14 }); line(hx + 12 + lx, eyeY - 24, hx + 34 + lx, eyeY - 18, { w: 4, seed: sd + 15 }); }
  if (face === 'angry' || face === 'shout') { line(hx - 34 + lx, eyeY - 26, hx - 12 + lx, eyeY - 16, { w: 5, seed: sd + 14 }); line(hx + 12 + lx, eyeY - 16, hx + 34 + lx, eyeY - 26, { w: 5, seed: sd + 15 }); }
  if (glasses) { circle(hx - 21 + lx, eyeY, 17, { w: 3.5, seed: sd + 16 }); circle(hx + 21 + lx, eyeY, 17, { w: 3.5, seed: sd + 17 }); line(hx - 4 + lx, eyeY, hx + 4 + lx, eyeY, { w: 3.5 }); }
  const my = hy + 26;
  if (mustache) path([[hx - 26, my - 4], [hx - 10, my - 12], [hx, my - 8], [hx + 10, my - 12], [hx + 26, my - 4]], { w: 9, seed: sd + 18 });
  const open = Math.max(talk, face === 'shout' ? 0.9 : 0, face === 'shock' ? 0.6 : 0);
  if (open > 0.12) {
    ellipse(hx + lx * 0.5, my + 2, face === 'shout' ? 24 : 14 + open * 6, 5 + open * 16, { w: 4, fill: '#7a2a2a', seed: sd + 19 });
  } else if (face === 'smile' || face === 'grin') {
    const pts = []; for (let i = 0; i <= 8; i++) { const a = Math.PI * (0.18 + 0.64 * (i / 8)); pts.push([hx + lx * 0.5 + Math.cos(a) * 26, my - 18 + Math.sin(a) * 22]); }
    path(pts, { w: 4.5, seed: sd + 20, fill: face === 'grin' ? '#fff' : null, close: face === 'grin' });
  } else if (face === 'sad' || face === 'worried') {
    const pts = []; for (let i = 0; i <= 8; i++) { const a = Math.PI * (1.2 + 0.6 * (i / 8)); pts.push([hx + lx * 0.5 + Math.cos(a) * 20, my + 16 + Math.sin(a) * 14]); }
    path(pts, { w: 4.5, seed: sd + 21 });
  } else line(hx - 14, my, hx + 14, my, { w: 4.5, seed: sd + 22 });
  // hats
  if (hat === 'top') {
    rect(hx - 44, hy - 150, 88, 98, { fill: '#26221f', w: 5, seed: sd + 23 });
    rect(hx - 44, hy - 80, 88, 18, { fill: C.gold, w: 0, seed: sd + 24 });
    line(hx - 70, hy - 52, hx + 70, hy - 52, { w: 12, seed: sd + 25 });
  } else if (hat === 'cap') {
    ctx.save(); ctx.beginPath(); ctx.arc(hx, hy - 10, 64, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fillStyle = o.capColor || C.blue; ctx.fill(); ctx.restore();
    path([[hx - 64, hy - 10], [hx + 64, hy - 10], [hx + 112, hy - 2]], { w: 7, seed: sd + 26 });
  }
  // props in the right hand
  const hr = hands.ra, hl = hands.la;
  if (prop === 'mega') megaphone(hr[0], hr[1], 1);
  if (prop === 'megaL') { ctx.save(); ctx.translate(hl[0], hl[1]); ctx.scale(-1, 1); megaphone(0, 0, 1); ctx.restore(); }
  if (prop === 'pointer') line(hr[0], hr[1], hr[0] + 120, hr[1] - 90, { w: 7, color: '#8a8a8a', seed: sd + 27 });
  if (prop === 'phone') rect(hr[0] - 14, hr[1] - 44, 28, 48, { fill: '#333', w: 4, seed: sd + 28 });
  if (prop === 'cash') { money(hl[0], hl[1] - 10, 0.8, -0.3); money(hr[0], hr[1] - 10, 0.8, 0.3); }
  ctx.restore();
  return { headX: x, headY: y + headY * s, hands };
}

export function megaphone(x, y, s) {
  at(x, y, s, () => {
    path([[0, -14], [70, -44], [70, 44], [0, 14]], { close: true, fill: '#fff', w: 5, seed: 61 });
    rect(66, -46, 12, 92, { fill: C.red, w: 4, seed: 62 });
    line(-6, 0, 6, 26, { w: 7, seed: 63 });
  });
}

export function money(x, y, s = 1, rot = 0) {
  at(x, y, s, () => {
    rect(-50, -26, 100, 52, { fill: C.money, w: 4, seed: 71 });
    circle(0, 0, 16, { w: 3, fill: '#a9dc93', seed: 72 });
    text('$', 0, 2, { size: 30, font: 'Kalam', color: '#1f5a1f', wobble: false });
  }, rot);
}

/** Wooden-framed chalkboard (or beige paper board). Returns inner rect. */
export function board(x, y, w, h, o = {}) {
  const fill = o.fill || C.board;
  rect(x, y, w, h, { fill, w: 22, color: C.wood, seed: o.seed ?? 81, amp: 2 });
  return { x: x + 30, y: y + 30, w: w - 60, h: h - 60 };
}

/** Draw a data series inside box b. values are normalised to [lo, hi]. */
export function chartLine(b, values, o = {}) {
  const { lo = Math.min(...values), hi = Math.max(...values), p = 1, color = C.chalk, w = 6, seed = 91 } = o;
  const pts = values.map((v, i) => [b.x + (i / (values.length - 1)) * b.w, b.y + b.h - ((v - lo) / (hi - lo)) * b.h]);
  path(pts, { w, color, p, amp: 1.2, seed });
  return pts;
}
export function pointAt(pts, p) {
  const i = Math.min(pts.length - 1, Math.max(0, p * (pts.length - 1)));
  const a = pts[Math.floor(i)], b = pts[Math.ceil(i)];
  return [lerp(a[0], b[0], i % 1), lerp(a[1], b[1], i % 1)];
}

export function bubble(x, y, w, h, tailX, tailY, o = {}) {
  const r = 30;
  const pts = [];
  const corner = (cx, cy, a0) => { for (let i = 0; i <= 4; i++) { const a = a0 + (i / 4) * Math.PI / 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  corner(x + w - r, y + r, -Math.PI / 2);
  corner(x + w - r, y + h - r, 0);
  const bx = Math.max(x + 50, Math.min(x + w - 90, tailX));
  pts.push([bx + 60, y + h], [tailX, tailY], [bx + 10, y + h]);
  corner(x + r, y + h - r, Math.PI / 2);
  corner(x + r, y + r, Math.PI);
  path(pts, { close: true, fill: o.fill || '#fff', w: 5.5, seed: o.seed ?? 95 });
}

export function certificate(x, y, name, s = 1, o = {}) {
  at(x, y, s, () => {
    rect(-150, -100, 300, 200, { fill: '#fdf6dc', w: 5, seed: sh2(name) });
    rect(-134, -84, 268, 168, { w: 2.5, color: '#7a6a3a', seed: sh2(name) + 1 });
    text('STOCK CERTIFICATE', 0, -58, { size: 20, font: 'Patrick Hand', color: '#7a6a3a', weight: 'normal' });
    text(name, 0, -6, { size: 50, font: 'Kalam', maxW: 250 });
    circle(-92, 50, 24, { fill: C.gold, w: 3.5, seed: sh2(name) + 2 });
    text('★', -92, 52, { size: 26, color: '#fff', font: 'Kalam', wobble: false });
    line(-40, 58, 100, 58, { w: 2.5, color: '#7a6a3a' });
    if (o.badge) text(o.badge, 40, 40, { size: 26, color: C.red, font: 'Kalam' });
  }, o.rot || 0, o.alpha ?? 1);
}
function sh2(s) { let h = 3; for (const c of s) h = h * 31 + c.charCodeAt(0); return h & 0xffff; }

export function newspaper(x, y, s, headline, sub, o = {}) {
  at(x, y, s, () => {
    rect(-330, -250, 660, 500, { fill: '#f5f1e6', w: 5, seed: 401 });
    text(o.masthead || 'THE DAILY LEDGER', 0, -205, { size: 46, font: 'Permanent Marker', weight: 'normal' });
    line(-300, -172, 300, -172, { w: 3 });
    text(o.date || '', -300, -152, { size: 22, font: 'Patrick Hand', align: 'left', weight: 'normal' });
    line(-300, -134, 300, -134, { w: 3 });
    const lines = headline.split('\n');
    lines.forEach((l, i) => text(l, 0, -88 + i * 64, { size: 62, font: 'Kalam', maxW: 600 }));
    const top = -88 + lines.length * 64 - 10;
    if (sub) text(sub, 0, top + 4, { size: 26, font: 'Patrick Hand', weight: 'normal', color: '#555' });
    const picY = top + 30;
    rect(-300, picY, 300, 230 - picY + 0, { w: 3, fill: '#e4dfd1', seed: 402 });
    if (o.picture) { const ctx = g(); ctx.save(); ctx.beginPath(); ctx.rect(-300, picY, 300, 230 - picY); ctx.clip(); o.picture(-150, (picY + 230) / 2); ctx.restore(); }
    for (let i = 0; i < 6; i++) line(30, picY + 14 + i * ((230 - picY - 20) / 6), 300, picY + 14 + i * ((230 - picY - 20) / 6), { w: 3, color: '#9a968c', seed: 410 + i });
  }, o.rot || 0);
}

export function stamp(x, y, label, s, rot = -0.18, color = C.red) {
  at(x, y, s, () => {
    const w = Math.max(220, label.length * 52 + 70);
    rect(-w / 2, -70, w, 140, { w: 10, color, seed: 501 });
    text(label, 0, 6, { size: 104, font: 'Permanent Marker', color, weight: 'normal' });
  }, rot);
}

export function ground(y, color = C.grey) {
  const ctx = g();
  ctx.save(); ctx.fillStyle = color; ctx.fillRect(-200, y, 1480, 2000); ctx.restore();
  path([[-20, y + 4], [300, y - 3], [700, y + 5], [1100, y - 2]], { w: 6, seed: 601 });
}

export function cloud(x, y, s, dark = false) {
  at(x, y, s, () => {
    const fill = dark ? '#6e6a66' : '#fff';
    for (const [cx, cy, r] of [[-90, 10, 60], [-30, -30, 75], [50, -20, 70], [100, 20, 55], [0, 25, 65]]) circle(cx, cy, r, { fill, w: 0, seed: 701 + cx });
    for (const [cx, cy, r] of [[-90, 10, 60], [-30, -30, 75], [50, -20, 70], [100, 20, 55]]) circle(cx, cy, r, { w: 5, seed: 711 + cx, p: 0.55, start: Math.PI * 0.95 });
  });
}

export function bolt(x, y, s, alpha = 1) {
  at(x, y, s, () => path([[0, 0], [-30, 80], [10, 80], [-20, 170], [50, 60], [10, 60], [30, 0]], { close: true, fill: C.yellow, w: 5, seed: 801 }), 0, alpha);
}

export function goldBar(x, y, s, rot = 0) {
  at(x, y, s, () => {
    path([[-80, 30], [80, 30], [55, -30], [-55, -30]], { close: true, fill: C.gold, w: 5, seed: 811 });
    text('GOLD', 0, 4, { size: 30, color: '#7a5a00', font: 'Kalam' });
  }, rot);
}

export function barrel(x, y, s, label = 'OIL') {
  at(x, y, s, () => {
    rect(-70, -100, 140, 200, { fill: '#2b2b2b', w: 5, seed: 821 });
    ellipse(0, -100, 70, 18, { fill: '#444', w: 5, seed: 822 });
    line(-70, -40, 70, -40, { w: 5, color: '#777' }); line(-70, 40, 70, 40, { w: 5, color: '#777' });
    text(label, 0, 0, { size: 44, color: C.yellow, font: 'Permanent Marker', weight: 'normal' });
  });
}

export function calendar(x, y, s, label, sub = '') {
  at(x, y, s, () => {
    rect(-110, -120, 220, 240, { fill: '#fff', w: 5, seed: 831 });
    rect(-110, -120, 220, 64, { fill: C.red, w: 5, seed: 832 });
    for (const cx of [-60, 60]) line(cx, -140, cx, -100, { w: 8 });
    text(label, 0, 30, { size: 86, font: 'Kalam' });
    if (sub) text(sub, 0, -88, { size: 30, font: 'Kalam', color: '#fff' });
  });
}

export function trophy(x, y, s) {
  at(x, y, s, () => {
    path([[-70, -120], [70, -120], [50, -20], [15, 10], [15, 50], [-15, 50], [-15, 10], [-50, -20]], { close: true, fill: C.gold, w: 5, seed: 841 });
    path([[-70, -100], [-110, -90], [-95, -40], [-55, -40]], { w: 5, seed: 842 });
    path([[70, -100], [110, -90], [95, -40], [55, -40]], { w: 5, seed: 843 });
    rect(-60, 50, 120, 40, { fill: '#5b3a1e', w: 5, seed: 844 });
    text('★', 0, -60, { size: 56, color: '#fff7c2', wobble: false });
  });
}

export function priceTag(x, y, s, label, rot = 0.15) {
  at(x, y, s, () => {
    path([[-40, -60], [170, -60], [170, 60], [-40, 60], [-90, 0]], { close: true, fill: '#fff', w: 5, seed: 851 });
    circle(-48, 0, 10, { w: 4, seed: 852 });
    text(label, 65, 4, { size: 64, color: C.red, font: 'Permanent Marker', weight: 'normal', maxW: 200 });
  }, rot);
}

export function thermometer(x, y, s, level, labelTop, labelBot) {
  at(x, y, s, () => {
    rect(-34, -260, 68, 300, { fill: '#fff', w: 5, seed: 861 });
    circle(0, 70, 60, { fill: C.red, w: 5, seed: 862 });
    const h = 290 * level;
    g().fillStyle = C.red; g().fillRect(-20, 40 - h, 40, h + 10);
    for (let i = 0; i < 6; i++) line(34, -230 + i * 48, 58, -230 + i * 48, { w: 4, seed: 863 + i });
    if (labelTop) text(labelTop, 80, -230, { size: 40, align: 'left', color: C.red });
    if (labelBot) text(labelBot, 80, 10, { size: 40, align: 'left' });
  });
}

export function pie(x, y, r, frac, p, o = {}) {
  const ctx = g();
  const a0 = -Math.PI / 2;
  const sweep = Math.PI * 2 * frac * p;
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = o.rest || C.beige; ctx.fill();
  if (sweep > 0) { ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, a0, a0 + sweep); ctx.closePath(); ctx.fillStyle = o.slice || C.bar; ctx.fill(); }
  ctx.restore();
  circle(x, y, r, { w: 6, seed: 871 });
  if (sweep > 0) { line(x, y, x, y - r, { w: 5 }); line(x, y, x + Math.cos(a0 + sweep) * r, y + Math.sin(a0 + sweep) * r, { w: 5 }); }
}
