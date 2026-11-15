// Procedural animation library. Each action is a pure function
// (localTime, duration, params) -> pose, so any frame can be rendered
// independently and deterministically (important for cloud rendering).
import { clamp, smoothstep, easeOutBack } from './rng.js';

const sin = Math.sin, cos = Math.cos, PI = Math.PI;

export const BASE_POSE = {
  bodyY: 0, fall: 0, roll: 0, hipDrop: 0, lean: 0, twist: 0, sway: 0,
  headNod: 0, headTurn: 0, headTilt: 0, squash: 0, scarf: 0,
  armL: { raise: 10, fwd: 0, elbow: 10, elbowOut: 0 },
  armR: { raise: 10, fwd: 0, elbow: 10, elbowOut: 0 },
  legL: { fwd: 0, knee: 0, out: 3 },
  legR: { fwd: 0, knee: 0, out: 3 },
};

function pose(over = {}) {
  return {
    ...BASE_POSE, ...over,
    armL: { ...BASE_POSE.armL, ...(over.armL || {}) },
    armR: { ...BASE_POSE.armR, ...(over.armR || {}) },
    legL: { ...BASE_POSE.legL, ...(over.legL || {}) },
    legR: { ...BASE_POSE.legR, ...(over.legR || {}) },
  };
}

function breathe(t, amt = 1) {
  return { bodyY: sin(t * 2.2) * 0.012 * amt, sway: sin(t * 1.1) * 1.5 * amt, headTilt: sin(t * 0.9 + 1) * 2 * amt };
}

function walkCycle(t, speed = 1, amp = 1) {
  const f = t * 2 * PI * 1.7 * speed;
  const s = sin(f);
  return {
    bodyY: Math.abs(cos(f)) * 0.06 * amp,
    lean: 4 * amp,
    twist: s * 6 * amp,
    headNod: 2,
    scarf: s * 0.3,
    armL: { raise: 8, fwd: -s * 35 * amp, elbow: 20 + Math.max(0, -s) * 20 },
    armR: { raise: 8, fwd: s * 35 * amp, elbow: 20 + Math.max(0, s) * 20 },
    legL: { fwd: s * 30 * amp, knee: Math.max(0, -cos(f)) * 45 * amp + 5 },
    legR: { fwd: -s * 30 * amp, knee: Math.max(0, cos(f)) * 45 * amp + 5 },
  };
}

export const ACTIONS = {
  idle: (t) => pose({ ...breathe(t) }),

  talk: (t, d, p = {}) => {
    const g = sin(t * 3.1), g2 = sin(t * 2.3 + 1.3);
    const side = p.hand === 'L' ? 'L' : 'R';
    const gesture = { raise: 25 + g * 15, fwd: 35 + g2 * 20, elbow: 60 + g * 25 };
    return pose({
      ...breathe(t),
      headNod: sin(t * 5.3) * 4, headTilt: sin(t * 1.7) * 6,
      ['arm' + side]: gesture,
      ['arm' + (side === 'L' ? 'R' : 'L')]: { raise: 12, fwd: 5 + g2 * 5, elbow: 15 },
    });
  },

  walk: (t, d, p = {}) => pose(walkCycle(t, p.speed || 1, 1)),
  run: (t, d, p = {}) => {
    const w = walkCycle(t, 1.7 * (p.speed || 1), 1.5);
    return pose({ ...w, lean: 16, armL: { ...w.armL, elbow: 85 }, armR: { ...w.armR, elbow: 85 } });
  },
  sneak: (t) => {
    const w = walkCycle(t, 0.6, 0.6);
    return pose({ ...w, hipDrop: -0.12, lean: 18, headNod: -5,
      legL: { ...w.legL, knee: w.legL.knee + 35, fwd: w.legL.fwd + 15 },
      legR: { ...w.legR, knee: w.legR.knee + 35, fwd: w.legR.fwd + 15 },
      armL: { raise: 30, fwd: 50, elbow: 100 }, armR: { raise: 30, fwd: 50, elbow: 100 } });
  },

  jump: (t, d) => {
    const u = clamp(t / d, 0, 1);
    // crouch 0-0.2, air 0.2-0.8, land 0.8-1
    let bodyY = 0, crouch = 0;
    if (u < 0.2) crouch = smoothstep(u / 0.2);
    else if (u < 0.8) { const a = (u - 0.2) / 0.6; bodyY = 4 * a * (1 - a) * 1.1; crouch = 0; }
    else crouch = 1 - smoothstep((u - 0.8) / 0.2);
    const air = u > 0.2 && u < 0.8;
    return pose({
      bodyY, hipDrop: -crouch * 0.18, lean: crouch * 10,
      squash: (crouch * 0.12) - (air ? 0.05 : 0),
      armL: { raise: air ? 150 : 20 - crouch * 10, fwd: air ? 10 : -20 * crouch, elbow: 20 },
      armR: { raise: air ? 150 : 20 - crouch * 10, fwd: air ? 10 : -20 * crouch, elbow: 20 },
      legL: { fwd: crouch * 30 + (air ? 25 : 0), knee: crouch * 60 + (air ? 50 : 0) },
      legR: { fwd: crouch * 30 + (air ? 5 : 0), knee: crouch * 60 + (air ? 20 : 0) },
    });
  },

  hug: (t) => pose({
    ...breathe(t, 0.6), lean: 6, headTilt: 10, sway: sin(t * 1.4) * 3,
    armL: { raise: 35, fwd: 80, elbow: 85, elbowOut: -25 }, armR: { raise: 35, fwd: 80, elbow: 85, elbowOut: -25 },
  }),
  feel: (t) => pose({ // reaching forward blindly in the dark
    ...breathe(t, 0.5), lean: 4, headNod: -4, headTurn: sin(t * 1.3) * 25,
    armL: { raise: 20, fwd: 75 + sin(t * 2.1) * 12, elbow: 15 }, armR: { raise: 20, fwd: 70 + sin(t * 2.1 + 1.5) * 12, elbow: 15 },
  }),
  holdMatch: (t) => pose({ ...breathe(t, 0.4), headNod: 12, armR: { raise: 18, fwd: 70, elbow: 65 }, armL: { raise: 18, fwd: 55, elbow: 80, elbowOut: -15 } }),
  climb: (t, d, p = {}) => { const w = walkCycle(t, 0.75 * (p.speed || 1), 0.9); return pose({ ...w, lean: 12, armR: { raise: 45, fwd: 40, elbow: 40 } }); },
  lookUp: (t) => pose({ ...breathe(t), headNod: -28, lean: -4, armL: { raise: 12, fwd: 10, elbow: 15 }, armR: { raise: 12, fwd: 10, elbow: 15 } }),
  // one big sneeze: wind-up (head back) then snap forward, then recover
  sneeze: (t) => {
    const w = smoothstep((t - 0) / (0.35 - 0)), snap = smoothstep((t - 0.35) / (0.45 - 0.35)), rec = smoothstep((t - 0.7) / (1.2 - 0.7));
    const k = snap * (1 - rec);
    return pose({
      ...breathe(t, 0.4), headNod: -24 * w * (1 - snap) + 30 * k, lean: -8 * w * (1 - snap) + 20 * k, bodyY: 0.04 * w * (1 - snap),
      squash: 0.05 * k,
      armL: { raise: 20 + 25 * w, fwd: 40 + 40 * w, elbow: 110 }, armR: { raise: 20 + 25 * w, fwd: 40 + 40 * w, elbow: 110 },
    });
  },
  sniff: (t) => pose({ ...breathe(t, 0.4), headNod: -10 + sin(t * 9) * 4, lean: 6, armR: { raise: 20, fwd: 80, elbow: 95 }, armL: { raise: 12, fwd: 15, elbow: 20 } }),
  sitWrite: (t) => pose({
    ...breathe(t, 0.4), hipDrop: -0.45, headNod: 22, lean: 10,
    legL: { fwd: 85, knee: 85 }, legR: { fwd: 85, knee: 85 },
    armL: { raise: 15, fwd: 55, elbow: 70 }, armR: { raise: 18 + sin(t * 11) * 4, fwd: 58, elbow: 75 + sin(t * 13) * 8, elbowOut: sin(t * 7) * 6 },
  }),
  sitPanic: (t) => pose({
    hipDrop: -0.45, headTurn: sin(t * 7) * 30, sway: sin(t * 30) * 2, headNod: -6,
    legL: { fwd: 85, knee: 85 }, legR: { fwd: 85, knee: 85 },
    armL: { raise: 30, fwd: 70, elbow: 40 + sin(t * 20) * 10 }, armR: { raise: 30, fwd: 70, elbow: 40 + sin(t * 20 + 1) * 10 },
  }),
  drive: (t) => pose({
    ...breathe(t, 0.3), hipDrop: -0.45, lean: 6, sway: sin(t * 3) * 6,
    legL: { fwd: 80, knee: 70 }, legR: { fwd: 80, knee: 70 },
    armL: { raise: 25 + sin(t * 3) * 12, fwd: 75, elbow: 35 }, armR: { raise: 25 - sin(t * 3) * 12, fwd: 75, elbow: 35 },
  }),
  toss: (t) => {
    const b = Math.abs(sin(t * 4));
    return pose({ headNod: -22, lean: -4, bodyY: b * 0.05, armL: { raise: 150 - b * 30, fwd: 20, elbow: 40 }, armR: { raise: 150 - b * 30, fwd: 20, elbow: 40 } });
  },
  goalie: (t) => {
    const j = smoothstep((t - 0) / (0.3 - 0));
    return pose({ hipDrop: -0.12 * (1 - j), bodyY: 0.25 * j * Math.max(0, sin(t * 3)), sway: sin(t * 30) * 2, headNod: 6,
      armL: { raise: 120 + 30 * j, fwd: 30, elbow: 15 }, armR: { raise: 120 + 30 * j, fwd: 30, elbow: 15 },
      legL: { out: 18, knee: 20 }, legR: { out: 18, knee: 20 } });
  },
  holdOut: (t) => pose({ ...breathe(t, 0.6), lean: -6, headNod: 4, sway: sin(t * 28) * 1.5, armR: { raise: 20, fwd: 80, elbow: 10 }, armL: { raise: 30, fwd: 30, elbow: 90 }, legL: { knee: 12 }, legR: { knee: 12 } }),
  clap: (t) => { const c = sin(t * 16); return pose({ ...breathe(t), headNod: -4, bodyY: Math.abs(c) * 0.02, armL: { raise: 30, fwd: 75, elbow: 55, elbowOut: 20 + c * 18 }, armR: { raise: 30, fwd: 75, elbow: 55, elbowOut: 20 + c * 18 } }); },
  sitClap: (t) => { const c = sin(t * 16); return pose({ hipDrop: -0.45, legL: { fwd: 85, knee: 85 }, legR: { fwd: 85, knee: 85 }, headNod: -4, armL: { raise: 30, fwd: 75, elbow: 55, elbowOut: 20 + c * 18 }, armR: { raise: 30, fwd: 75, elbow: 55, elbowOut: 20 + c * 18 } }); },
  wave: (t) => pose({
    ...breathe(t), headTilt: 8,
    armR: { raise: 140, fwd: 10, elbow: 30 + sin(t * 9) * 25, elbowOut: sin(t * 9) * 20 },
  }),

  cheer: (t) => {
    const b = Math.abs(sin(t * 6));
    return pose({
      bodyY: b * 0.18, squash: -b * 0.04, headNod: -10,
      armL: { raise: 155 + sin(t * 12) * 10, elbow: 15 }, armR: { raise: 155 + sin(t * 12 + 1) * 10, elbow: 15 },
      legL: { knee: (1 - b) * 20, fwd: (1 - b) * 10 }, legR: { knee: (1 - b) * 20, fwd: (1 - b) * 10 },
    });
  },

  point: (t, d, p = {}) => pose({
    ...breathe(t, 0.5), lean: -3, headNod: 0,
    armR: { raise: 15, fwd: 85 + sin(t * 4) * 3, elbow: 0 },
    armL: { raise: 15, fwd: 0, elbow: 70 },
  }),

  scared: (t) => {
    const shake = sin(t * 45) * 2.5;
    return pose({
      hipDrop: -0.08, lean: -8, sway: shake, headNod: 6, bodyY: Math.abs(sin(t * 30)) * 0.015,
      armL: { raise: 30, fwd: 70, elbow: 120 + shake }, armR: { raise: 30, fwd: 70, elbow: 120 - shake },
      legL: { knee: 25, fwd: 10, out: 10 }, legR: { knee: 25, fwd: 10, out: 10 },
    });
  },

  angry: (t) => {
    const stomp = Math.max(0, sin(t * 7));
    return pose({
      lean: 12, headNod: 8, bodyY: stomp * 0.04, sway: sin(t * 7) * 3,
      armL: { raise: 35, fwd: 10, elbow: 110 + sin(t * 14) * 10 }, armR: { raise: 35, fwd: 10, elbow: 110 + sin(t * 14 + 1) * 10 },
      legL: { fwd: stomp * 25, knee: stomp * 40 }, legR: {},
    });
  },

  laugh: (t) => {
    const b = sin(t * 14);
    return pose({
      lean: -14 + b * 4, bodyY: Math.abs(b) * 0.03, headNod: -14 + b * 6, headTilt: sin(t * 3) * 6,
      armL: { raise: 25, fwd: 40, elbow: 100 }, armR: { raise: 25, fwd: 40, elbow: 100 },
      legL: { knee: 8 }, legR: { knee: 8 },
    });
  },

  facepalm: (t, d) => {
    const u = smoothstep(clamp(t / 0.35, 0, 1));
    return pose({
      ...breathe(t, 0.4), headNod: 18 * u, lean: 6 * u,
      armR: { raise: 20, fwd: 40 + 75 * u, elbow: 30 + 120 * u },
    });
  },

  shrug: (t) => {
    const u = 0.5 + 0.5 * sin(t * 3);
    return pose({
      ...breathe(t, 0.5), headTilt: 12, bodyY: u * 0.03,
      armL: { raise: 50, fwd: 10, elbow: 100, elbowOut: 30 }, armR: { raise: 50, fwd: 10, elbow: 100, elbowOut: 30 },
    });
  },

  think: (t) => pose({
    ...breathe(t, 0.6), headTilt: 12, headNod: -4,
    armR: { raise: 15, fwd: 60, elbow: 140 },
    armL: { raise: 20, fwd: 45, elbow: 95 },
  }),

  bow: (t, d) => {
    const u = sin(clamp(t / d, 0, 1) * PI);
    return pose({ lean: 45 * u, headNod: 15 * u, armR: { raise: 10, fwd: 60 * u, elbow: 90 * u }, armL: { raise: 10, fwd: -30 * u } });
  },

  fall: (t, d) => {
    const u = clamp(t / 0.5, 0, 1);
    const f = easeOutBack(u);
    return pose({
      fall: -f * (PI / 2) * 0.98, bodyY: 0.05,
      armL: { raise: 120 * f, elbow: 30 }, armR: { raise: 120 * f, elbow: 30 },
      legL: { fwd: 40 * f, knee: 20 }, legR: { fwd: 10 * f, knee: 10 },
      headNod: -10 * f + sin(t * 3) * 3 * (u >= 1 ? 1 : 0),
    });
  },

  swordSwing: (t, d) => {
    // repeat a swing every 0.9s
    const c = (t % 0.9) / 0.9;
    let raise, fwd, elbow;
    if (c < 0.45) { const a = smoothstep(c / 0.45); raise = 20 + 130 * a; fwd = 20 + 40 * a; elbow = 40 * a; }
    else if (c < 0.62) { const a = smoothstep((c - 0.45) / 0.17); raise = 150 - 120 * a; fwd = 60 + 30 * a; elbow = 40 - 40 * a; }
    else { const a = smoothstep((c - 0.62) / 0.38); raise = 30 - 10 * a; fwd = 90 - 70 * a; elbow = 20 * a; }
    const lunge = c > 0.45 && c < 0.75 ? 1 : 0;
    return pose({
      lean: 6 + lunge * 10, twist: -10 + lunge * 20,
      armR: { raise, fwd, elbow }, armL: { raise: 30, fwd: -20, elbow: 40 },
      legL: { fwd: 25, knee: 20 }, legR: { fwd: -15, knee: 10 },
    });
  },

  cast: (t) => pose({
    ...breathe(t, 0.5), lean: -5, headNod: -6,
    armR: { raise: 60 + sin(t * 8) * 15, fwd: 70, elbow: 10 },
    armL: { raise: 80 + sin(t * 8 + 2) * 15, fwd: 40, elbow: 30 },
  }),

  sit: (t) => pose({
    ...breathe(t, 0.5), hipDrop: -0.45,
    legL: { fwd: 85, knee: 85 }, legR: { fwd: 85, knee: 85 },
    armL: { raise: 15, fwd: 35, elbow: 50 }, armR: { raise: 15, fwd: 35, elbow: 50 },
  }),

  dance: (t) => {
    const b = sin(t * 8);
    return pose({
      bodyY: Math.abs(b) * 0.08, sway: b * 10, headTilt: -b * 12, twist: sin(t * 4) * 15,
      armL: { raise: 90 + b * 50, fwd: 20, elbow: 60 }, armR: { raise: 90 - b * 50, fwd: 20, elbow: 60 },
      legL: { fwd: Math.max(0, b) * 30, knee: Math.max(0, b) * 50 }, legR: { fwd: Math.max(0, -b) * 30, knee: Math.max(0, -b) * 50 },
    });
  },

  dizzy: (t) => pose({
    sway: sin(t * 4) * 12, roll: sin(t * 4) * 0.08, headTilt: sin(t * 4 + 1) * 15, lean: cos(t * 3) * 6,
    armL: { raise: 40 + sin(t * 4) * 20, elbow: 20 }, armR: { raise: 40 - sin(t * 4) * 20, elbow: 20 },
    legL: { knee: 15, out: 8 }, legR: { knee: 15, out: 8 },
  }),
};

export function evalAction(name, t, d, params) {
  const fn = ACTIONS[name] || ACTIONS.idle;
  return fn(Math.max(0, t), d, params);
}

const NUM_KEYS = ['bodyY', 'fall', 'roll', 'hipDrop', 'lean', 'twist', 'sway', 'headNod', 'headTurn', 'headTilt', 'squash', 'scarf'];
const LIMB_KEYS = { arm: ['raise', 'fwd', 'elbow', 'elbowOut'], leg: ['fwd', 'knee', 'out'] };

export function blendPose(a, b, w) {
  if (w <= 0) return a;
  if (w >= 1) return b;
  const o = {};
  for (const k of NUM_KEYS) o[k] = (a[k] || 0) * (1 - w) + (b[k] || 0) * w;
  for (const side of ['L', 'R']) {
    for (const [limb, keys] of Object.entries(LIMB_KEYS)) {
      const key = limb + side;
      o[key] = {};
      for (const k of keys) o[key][k] = (a[key][k] ?? 0) * (1 - w) + (b[key][k] ?? 0) * w;
    }
  }
  return o;
}
