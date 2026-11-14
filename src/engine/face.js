// Draws a cartoon face onto a canvas that is wrapped around the round head.
// The canvas uses an equirectangular layout (like a world map), so all face
// coordinates below are in "radians on the head": x = sideways, y = up.
// The front of the head (facing +Z) is at texture u = 0.25.

export const EXPRESSIONS = [
  'neutral', 'happy', 'laugh', 'sad', 'angry', 'surprised', 'scared',
  'smug', 'confused', 'determined', 'dizzy', 'sleepy', 'love', 'cry',
];

const W = 2048, H = 1024;
const S = W / (Math.PI * 2); // pixels per radian
const CX = W * 0.25, CY = H * 0.5;

const P = (x, y) => [CX + x * S, CY - y * S];

export function createFaceCanvas() {
  if (typeof OffscreenCanvas !== 'undefined' && typeof document === 'undefined') {
    return new OffscreenCanvas(W, H);
  }
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  return c;
}

// state: { expr, blink (0 open..1 closed), mouth (0..1 talk openness), lookX, lookY }
export function faceKey(spec, s) {
  return `${spec.skin || ''}|${spec.eyePatch || ''}|${spec.freckles ? 'f' : ''}|${s.expr}|${Math.round(s.blink * 4)}|${Math.round(s.mouth * 6)}|${Math.round(s.lookX * 4)}|${Math.round(s.lookY * 4)}`;
}

export function drawFace(canvas, spec, s) {
  const g = canvas.getContext('2d');
  g.fillStyle = spec.skin || '#ffffff';
  g.fillRect(0, 0, W, H);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const ink = '#141414';
  const lw = 0.035 * S;

  const expr = s.expr || 'neutral';
  const eyeX = 0.30, eyeY = 0.13;
  const blink = Math.max(s.blink || 0, expr === 'sleepy' ? 0.55 : 0, spec.eyeStyle === 'sleepy' ? 0.3 : 0);

  // --- cheeks ---
  if (spec.cheeks || expr === 'love' || expr === 'happy' || expr === 'laugh') {
    g.fillStyle = 'rgba(255,120,140,0.45)';
    for (const sx of [-1, 1]) {
      const [x, y] = P(sx * 0.46, -0.05);
      g.beginPath(); g.ellipse(x, y, 0.1 * S, 0.06 * S, 0, 0, Math.PI * 2); g.fill();
    }
  }

  // --- fur patch around one eye (dogs) ---
  if (spec.eyePatch) {
    g.fillStyle = spec.eyePatch;
    const [px, py] = P(0.3, 0.15);
    g.beginPath(); g.ellipse(px, py, 0.2 * S, 0.24 * S, 0.3, 0, Math.PI * 2); g.fill();
  }
  // --- freckles ---
  if (spec.freckles) {
    g.fillStyle = 'rgba(160,80,40,0.55)';
    for (const sx of [-1, 1]) for (const [fx, fy] of [[0.38, -0.02], [0.46, 0.0], [0.42, -0.08], [0.5, -0.06], [0.34, -0.07]]) {
      const [x, y] = P(sx * fx, fy);
      g.beginPath(); g.arc(x, y, 0.014 * S, 0, Math.PI * 2); g.fill();
    }
  }
  // --- eyes ---
  for (const sx of [-1, 1]) {
    const [ex, ey] = P(sx * eyeX, eyeY);
    drawEye(g, ex, ey, sx, expr, blink, s, spec, ink, lw);
  }

  // --- brows ---
  const browW = spec.brows === 'thick' || spec.brows === 'bushy' ? 0.055 : spec.brows === 'thin' ? 0.022 : 0.035;
  g.strokeStyle = ink; g.lineWidth = browW * S;
  const browTilt = {
    angry: -0.12, determined: -0.08, sad: 0.1, scared: 0.12, cry: 0.12, surprised: 0, confused: 0.06, smug: -0.03,
  }[expr] ?? 0;
  const browLift = { surprised: 0.09, scared: 0.07, confused: 0.03, sad: 0.02, laugh: 0.04, happy: 0.03 }[expr] ?? 0;
  if (expr !== 'dizzy') {
    for (const sx of [-1, 1]) {
      // confused: one brow up one down
      const lift = browLift + (expr === 'confused' ? sx * 0.05 : 0);
      const inner = P(sx * 0.17, 0.33 + lift + browTilt);
      const outer = P(sx * 0.44, 0.33 + lift - browTilt * 0.5);
      g.beginPath();
      g.moveTo(inner[0], inner[1]);
      const mid = P(sx * 0.3, 0.37 + lift + browTilt * 0.25);
      g.quadraticCurveTo(mid[0], mid[1], outer[0], outer[1]);
      g.stroke();
    }
  }

  // --- mouth (dogs use a 3D jaw instead) ---
  if (!spec.dogFace) drawMouth(g, expr, Math.min(1, Math.max(0, s.mouth || 0)), ink, lw);

  // --- extras ---
  if (expr === 'cry' || expr === 'sad') {
    g.fillStyle = 'rgba(80,170,255,0.85)';
    const [tx, ty] = P(0.36, -0.04);
    g.beginPath(); g.ellipse(tx, ty, 0.035 * S, 0.06 * S, 0, 0, Math.PI * 2); g.fill();
    if (expr === 'cry') {
      const [tx2, ty2] = P(-0.36, -0.1);
      g.beginPath(); g.ellipse(tx2, ty2, 0.035 * S, 0.06 * S, 0, 0, Math.PI * 2); g.fill();
    }
  }
  if (expr === 'scared') {
    g.fillStyle = 'rgba(90,180,255,0.9)';
    const [sx, sy] = P(0.55, 0.32);
    g.beginPath(); g.moveTo(sx, sy - 0.07 * S);
    g.quadraticCurveTo(sx + 0.05 * S, sy, sx, sy + 0.04 * S);
    g.quadraticCurveTo(sx - 0.05 * S, sy, sx, sy - 0.07 * S); g.fill();
  }
}

function drawEye(g, ex, ey, sx, expr, blink, s, spec, ink, lw) {
  const r = 0.085 * S;
  g.strokeStyle = ink; g.fillStyle = ink; g.lineWidth = lw;
  const lookX = (s.lookX || 0) * 0.04 * S, lookY = -(s.lookY || 0) * 0.04 * S;

  if (expr === 'dizzy') {
    g.lineWidth = lw * 0.7;
    g.beginPath();
    for (let a = 0; a < Math.PI * 6; a += 0.2) {
      const rr = (a / (Math.PI * 6)) * r * 1.2;
      const x = ex + Math.cos(a * sx) * rr, y = ey + Math.sin(a * sx) * rr;
      a === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.stroke();
    return;
  }
  if (expr === 'laugh' || (expr === 'happy' && blink < 0.5)) {
    // closed happy arcs ^ ^ for laugh; happy uses open eyes with smile-lids
    if (expr === 'laugh') {
      g.lineWidth = lw * 1.2;
      g.beginPath(); g.arc(ex, ey + r * 0.5, r * 0.9, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
      return;
    }
  }
  if (expr === 'love') {
    drawHeart(g, ex, ey, r * 1.3, '#ff2d55');
    return;
  }
  if (blink > 0.85) {
    g.lineWidth = lw * 1.1;
    g.beginPath(); g.moveTo(ex - r, ey); g.quadraticCurveTo(ex, ey + r * 0.35, ex + r, ey); g.stroke();
    return;
  }

  const big = expr === 'surprised' || expr === 'scared';
  if (big) {
    // white eye with outline + small pupil
    g.fillStyle = '#ffffff';
    g.beginPath(); g.ellipse(ex, ey, r * 1.35, r * 1.5, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = ink;
    g.beginPath(); g.arc(ex + lookX, ey + lookY, r * (expr === 'scared' ? 0.35 : 0.55), 0, Math.PI * 2); g.fill();
  } else {
    // classic black oval eye with highlight
    const ry = r * 1.25 * (1 - blink);
    g.fillStyle = ink;
    g.beginPath(); g.ellipse(ex + lookX, ey + lookY, r * 0.9, Math.max(ry, r * 0.12), 0, 0, Math.PI * 2); g.fill();
    if (ry > r * 0.4) {
      g.fillStyle = '#ffffff';
      g.beginPath(); g.arc(ex + lookX - r * 0.3, ey + lookY - r * 0.4, r * 0.28, 0, Math.PI * 2); g.fill();
    }
    // eyelids for angry / determined / smug / sleepy
    g.fillStyle = '#ffffff';
    if (expr === 'angry' || expr === 'determined' || spec.eyeStyle === 'determined') {
      const innerY = ey - r * (expr === 'angry' ? 0.1 : 0.5);
      const outerY = ey - r * 1.05;
      g.beginPath();
      g.moveTo(ex - r * 1.5, ey - r * 2);
      g.lineTo(ex + r * 1.5, ey - r * 2);
      g.lineTo(ex + r * 1.5, sx > 0 ? outerY : innerY);
      g.lineTo(ex - r * 1.5, sx > 0 ? innerY : outerY);
      g.closePath(); g.fill();
    }
    if (expr === 'smug') {
      g.fillRect(ex - r * 1.3, ey - r * 1.7, r * 2.6, r * 1.45);
      g.strokeStyle = ink; g.beginPath(); g.moveTo(ex - r, ey - r * 0.25); g.lineTo(ex + r, ey - r * 0.25); g.stroke();
    }
    if (expr === 'happy') {
      // lower lids pushed up by smile
      g.beginPath(); g.ellipse(ex, ey + r * 1.25, r * 1.3, r * 0.65, 0, 0, Math.PI * 2); g.fill();
    }
    if (spec.eyeStyle === 'lashes') {
      g.strokeStyle = ink; g.lineWidth = lw * 0.6;
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + sx * (0.5 + i * 0.35);
        g.beginPath();
        g.moveTo(ex + Math.cos(a) * r * 1.0, ey + Math.sin(a) * r * 1.2);
        g.lineTo(ex + Math.cos(a) * r * 1.5, ey + Math.sin(a) * r * 1.7);
        g.stroke();
      }
    }
  }
}

function drawMouth(g, expr, open, ink, lw) {
  const [mx, my] = P(0, -0.2);
  const w = 0.2 * S;
  g.strokeStyle = ink; g.lineWidth = lw;
  const talking = open > 0.08;

  const openMouth = (width, height, smile = 0.3) => {
    // D-shaped open mouth with tongue
    g.fillStyle = '#3a0d12';
    g.beginPath();
    g.moveTo(mx - width, my - height * smile);
    g.quadraticCurveTo(mx, my + height * (1 - smile) * 2.0, mx + width, my - height * smile);
    g.quadraticCurveTo(mx, my - height * smile * 0.6 - height * 0.15, mx - width, my - height * smile);
    g.closePath(); g.fill(); g.stroke();
    g.save(); g.clip();
    g.fillStyle = '#ff6b7a';
    g.beginPath(); g.ellipse(mx, my + height * 0.9, width * 0.6, height * 0.5, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  };

  switch (expr) {
    case 'laugh':
      openMouth(w * 1.2, w * (0.7 + open * 0.3), 0.25); return;
    case 'happy': case 'love':
      if (talking) { openMouth(w, w * (0.35 + open * 0.45)); return; }
      g.beginPath(); g.arc(mx, my - w * 0.6, w * 1.0, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); return;
    case 'sad': case 'cry':
      if (talking) { g.fillStyle = '#3a0d12'; g.beginPath(); g.ellipse(mx, my, w * 0.5, w * (0.15 + open * 0.3), 0, 0, Math.PI * 2); g.fill(); return; }
      g.beginPath(); g.arc(mx, my + w * 0.7, w * 0.8, Math.PI * 1.25, Math.PI * 1.75); g.stroke(); return;
    case 'angry':
      g.fillStyle = '#3a0d12';
      g.beginPath(); g.rect(mx - w * 0.75, my - w * 0.12, w * 1.5, w * (0.25 + open * 0.35)); g.fill(); g.stroke();
      g.fillStyle = '#fff'; g.fillRect(mx - w * 0.7, my - w * 0.1, w * 1.4, w * 0.12); // teeth
      return;
    case 'surprised':
      g.fillStyle = '#3a0d12';
      g.beginPath(); g.ellipse(mx, my - w * 0.05, w * 0.35, w * (0.45 + open * 0.15), 0, 0, Math.PI * 2); g.fill(); g.stroke(); return;
    case 'scared': {
      g.beginPath();
      for (let i = 0; i <= 8; i++) {
        const x = mx - w * 0.7 + (w * 1.4 * i) / 8;
        const y = my + (i % 2 ? -1 : 1) * w * (0.08 + open * 0.08);
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke(); return;
    }
    case 'smug':
      g.beginPath(); g.moveTo(mx - w * 0.6, my); g.quadraticCurveTo(mx + w * 0.2, my + w * 0.15, mx + w * 0.7, my - w * 0.25); g.stroke(); return;
    case 'confused':
      g.beginPath(); g.moveTo(mx - w * 0.6, my + w * 0.05);
      g.bezierCurveTo(mx - w * 0.2, my - w * 0.2, mx + w * 0.2, my + w * 0.25, mx + w * 0.6, my - w * 0.05); g.stroke(); return;
    case 'dizzy':
      g.beginPath(); g.moveTo(mx - w * 0.6, my);
      for (let i = 1; i <= 6; i++) g.lineTo(mx - w * 0.6 + (w * 1.2 * i) / 6, my + (i % 2 ? -1 : 1) * w * 0.1);
      g.stroke(); return;
    case 'sleepy':
      g.fillStyle = '#3a0d12'; g.beginPath(); g.ellipse(mx, my, w * 0.2, w * (0.12 + open * 0.2), 0, 0, Math.PI * 2); g.fill(); return;
    case 'determined':
      if (talking) { openMouth(w * 0.8, w * (0.25 + open * 0.4), 0.1); return; }
      g.beginPath(); g.moveTo(mx - w * 0.55, my); g.lineTo(mx + w * 0.55, my - w * 0.05); g.stroke(); return;
    default:
      if (talking) { openMouth(w * 0.8, w * (0.25 + open * 0.5)); return; }
      g.beginPath(); g.arc(mx, my - w * 0.9, w * 1.0, Math.PI * 0.32, Math.PI * 0.68); g.stroke();
  }
}

function drawHeart(g, x, y, r, color) {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(x, y + r * 0.7);
  g.bezierCurveTo(x - r * 1.2, y - r * 0.1, x - r * 0.6, y - r * 1.0, x, y - r * 0.4);
  g.bezierCurveTo(x + r * 0.6, y - r * 1.0, x + r * 1.2, y - r * 0.1, x, y + r * 0.7);
  g.fill();
}
