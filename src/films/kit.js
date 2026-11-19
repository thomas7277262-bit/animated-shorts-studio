// Shared toolkit for hand-directed films: keyframes, pose sequencing,
// a pose library for the stick-figure rig, and label styles.
import { BASE_POSE, blendPose } from '../engine/poses.js';
import { clamp, lerp, easeInOut, easeOutBack, smoothstep } from '../engine/rng.js';

const { sin, cos, PI, abs, max } = Math;
const EASE = {
  lin: (u) => u, in: (u) => u * u * u, out: (u) => 1 - (1 - u) ** 3, io: easeInOut,
  back: easeOutBack, sine: (u) => 0.5 - 0.5 * cos(PI * u), step: () => 0,
};
const mixv = (a, b, u) => (Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], u)) : lerp(a, b, u));
/** keyframes: [[time, value, easeIntoThisKey?], ...] (value: number or array) */
function kf(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e = 'io'] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      return mixv(v0, v1, EASE[e](clamp((t - t0) / (t1 - t0 || 1), 0, 1)));
    }
  }
  return keys[keys.length - 1][1];
}
const win = (t, a, b, fi = 0.25, fo = 0.25) => clamp((t - a) / fi, 0, 1) * clamp((b - t) / fo, 0, 1);

function P(over = {}) {
  return {
    ...BASE_POSE, ...over,
    armL: { ...BASE_POSE.armL, ...(over.armL || {}) }, armR: { ...BASE_POSE.armR, ...(over.armR || {}) },
    legL: { ...BASE_POSE.legL, ...(over.legL || {}) }, legR: { ...BASE_POSE.legR, ...(over.legR || {}) },
  };
}
/** pose sequence: [[startTime, (localT, t) => pose], ...] blended over `bl` seconds */
function seq(t, list, bl = 0.25) {
  let i = list.length - 1;
  while (i > 0 && t < list[i][0]) i--;
  const cur = list[i][1](t - list[i][0], t);
  if (i > 0) {
    const w = (t - list[i][0]) / bl;
    if (w < 1) return blendPose(list[i - 1][1](t - list[i - 1][0], t), cur, smoothstep(w));
  }
  return cur;
}
function addPose(p, over) {
  const o = { ...p };
  for (const [k, v] of Object.entries(over)) {
    if (typeof v === 'object') { o[k] = { ...p[k] }; for (const [kk, vv] of Object.entries(v)) o[k][kk] = (o[k][kk] || 0) + vv; } else o[k] = (o[k] || 0) + v;
  }
  return o;
}

// ---- pose library (all angles in degrees, see engine/poses.js) ----
const breathe = (t, a = 1) => ({ bodyY: sin(t * 2.2) * 0.012 * a, sway: sin(t * 1.1) * 1.5 * a, headTilt: sin(t * 0.9 + 1) * 2 * a });
const idle = (t) => P(breathe(t));
const lookUp = (amt = 25) => (t) => P({ ...breathe(t), headNod: -amt, lean: -3 });
const thinkP = (t) => P({ ...breathe(t), headTilt: 10 + sin(t * 1.3) * 3, headNod: 6, armR: { raise: 20, fwd: 70, elbow: 140 }, armL: { raise: 15, fwd: 35, elbow: 95 } });
function walk(t, speed = 1, amp = 1) {
  const f = t * 2 * PI * 1.7 * speed, s = sin(f);
  return P({
    bodyY: abs(cos(f)) * 0.06 * amp, lean: 4 * amp, twist: s * 6 * amp, headNod: 2, scarf: s * 0.3,
    armL: { raise: 8, fwd: -s * 35 * amp, elbow: 20 + max(0, -s) * 20 }, armR: { raise: 8, fwd: s * 35 * amp, elbow: 20 + max(0, s) * 20 },
    legL: { fwd: s * 30 * amp, knee: max(0, -cos(f)) * 45 * amp + 5 }, legR: { fwd: -s * 30 * amp, knee: max(0, cos(f)) * 45 * amp + 5 },
  });
}
const clutchHead = (crouch) => (t) => P({
  hipDrop: -0.28 * crouch, lean: 18 * crouch, headNod: 22, sway: sin(t * 7) * 2.5, headTilt: sin(t * 5.5) * 6,
  armL: { raise: 130, fwd: 40, elbow: 135 }, armR: { raise: 130, fwd: 40, elbow: 135 },
  legL: { fwd: 30 * crouch, knee: 60 * crouch, out: 6 }, legR: { fwd: 30 * crouch, knee: 60 * crouch, out: 6 },
});
const crossArms = (t) => P({
  ...breathe(t, 0.6), headNod: -4, headTilt: -8, lean: -4,
  armL: { raise: 22, fwd: 72, elbow: 128, elbowOut: -35 }, armR: { raise: 22, fwd: 66, elbow: 128, elbowOut: -35 },
  legL: { out: 9 }, legR: { out: 9 },
});
const cheer = (t) => {
  const b = abs(sin(t * 6.2));
  return P({ bodyY: b * 0.12, headNod: -14, armL: { raise: 158 + b * 12, elbow: 12 }, armR: { raise: 158 + b * 12, elbow: 12 }, legL: { knee: (1 - b) * 22 }, legR: { knee: (1 - b) * 22 } });
};
const holdFront = (t) => P({ ...breathe(t), headNod: 14, armL: { raise: 18, fwd: 55, elbow: 70, elbowOut: -20 }, armR: { raise: 18, fwd: 55, elbow: 70, elbowOut: -20 } });
const holdUp = (t) => P({ ...breathe(t, 0.5), headNod: -26, lean: -5, armL: { raise: 168, fwd: 10, elbow: 25 }, armR: { raise: 168, fwd: 10, elbow: 25 } });
const sitSulk = (t) => P({
  bodyY: -0.82, headNod: 24, lean: 22, sway: sin(t * 0.8) * 1.5,
  armL: { raise: 18, fwd: 78, elbow: 120, elbowOut: -30 }, armR: { raise: 18, fwd: 72, elbow: 120, elbowOut: -30 },
  legL: { fwd: 95, knee: 120, out: 12 }, legR: { fwd: 95, knee: 120, out: 12 },
});

const LABEL_STYLE = {
  grey: { size: 46, weight: 800, spacing: 0.34, color: '#e9edf5', underline: '#8d9ab0' },
  gold: { size: 46, weight: 800, spacing: 0.34, color: '#ffffff', underline: '#ffb000' },
};

export { EASE, mixv, kf, win, P, seq, addPose, breathe, idle, lookUp, thinkP, walk, clutchHead, crossArms, cheer, holdFront, holdUp, sitSulk, LABEL_STYLE };
