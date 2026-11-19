// "Run Your Race" – a 33-second motivational short built from three visual
// metaphors, each a contrast between two versions of the same person:
//
//   1. OVERTHINKING vs DOING      – a staircase to a glowing door
//   2. COMPARISON  vs FOCUS       – two tightropes across a canyon at sunset
//   3. ENVY        vs INSPIRATION – sky lanterns on a hill at night
//   finale: "RUN YOUR RACE / NOT THEIRS."
//
// The grey character is always the "holding back" version, the gold one the
// "moving forward" version. Every cue is timed to the beat map of the music
// track (≈123 BPM, quiet break 14.0–15.5 s, drop at 15.58 s), see CUE below.
// Everything is a pure function of time, so frames render in any order.
import * as THREE from 'three';
import { Character } from '../engine/character.js';
import { BASE_POSE, blendPose } from '../engine/poses.js';
import { ParticleSystem, SpriteLayer } from '../engine/effects.js';
import { sky, ground, mat, mesh, box, rock } from '../engine/environments/common.js';
import { Rng, clamp, lerp, easeInOut, easeOutBack, smoothstep } from '../engine/rng.js';

const DEG = Math.PI / 180;
const { sin, cos, PI, abs, max, min } = Math;

// ---------------------------------------------------------------- timing
export const CUE = {
  s1: 0, s2: 7.04, s3: 15.58, finale: 28.26, end: 32.79,
  // beats the climber lands on (scene 1)
  climb: [1.02, 1.49, 1.97, 2.46, 2.93, 3.46, 3.99, 4.5, 4.99, 5.5, 6.01, 6.52],
  breakStart: 14.0, slip: 14.63, drop: 15.58,
  envy: 18.11, idea: 20.02, light: 22.24, release: 25.4, title2: 30.79,
};
export const DURATION = CUE.end;

// ---------------------------------------------------------------- helpers
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

// ---- the cast ----
const SPECS = {
  gold: { id: 'gold', accent: '#ffb000', height: 1.0, eyeStyle: 'round', brows: 'normal', cheeks: true, accessory: 'none' },
  grey: { id: 'grey', accent: '#8d9ab0', height: 1.0, eyeStyle: 'round', brows: 'normal', cheeks: false, accessory: 'none', skin: '#eef0f4' },
  teal: { id: 'teal', accent: '#22d3b8', height: 1.06, eyeStyle: 'round', brows: 'thick', cheeks: true, accessory: 'none' },
};
const LABEL_STYLE = {
  grey: { size: 46, weight: 800, spacing: 0.34, color: '#e9edf5', underline: '#8d9ab0' },
  gold: { size: 46, weight: 800, spacing: 0.34, color: '#ffffff', underline: '#ffb000' },
};

function lantern(lit = true) {
  const g = new THREE.Group();
  const paper = new THREE.MeshStandardMaterial({ color: lit ? '#ffc477' : '#efe2c9', emissive: '#ff8a2a', emissiveIntensity: lit ? 2.4 : 0, roughness: 0.8, side: THREE.DoubleSide });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.19, 0.46, 12, 1, true), paper);
  body.position.y = 0.23;
  const top = new THREE.Mesh(new THREE.CircleGeometry(0.24, 12), paper);
  top.rotation.x = -PI / 2; top.position.y = 0.46;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.012, 4, 12), mat('#6b3d1f'));
  ring.rotation.x = PI / 2;
  g.add(body, top, ring);
  g.userData.paper = paper;
  return g;
}
function setLit(l, k) {
  const p = l.userData.paper;
  p.emissiveIntensity = 2.4 * k;
  p.color.set(k > 0.01 ? '#ffc477' : '#efe2c9');
}

// =====================================================================
export function createRunYourRace(player) {
  const scene = player.scene;
  const camera = player.camera;
  const rng = new Rng(2026);

  // ---------- shared lights ----------
  const hemi = new THREE.HemisphereLight('#ffffff', '#666666', 1);
  const sun = new THREE.DirectionalLight('#ffffff', 2.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  scene.add(hemi, sun, sun.target);
  const setShadowBox = (r, near = 1, far = 80) => { const c = sun.shadow.camera; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = near; c.far = far; c.updateProjectionMatrix(); };

  // ---------- cast ----------
  const C = {};
  for (const [id, spec] of Object.entries(SPECS)) { C[id] = new Character(spec); scene.add(C[id].root); }
  const particles = new ParticleSystem(scene);
  const sprites = new SpriteLayer(scene);

  // =================== SCENE 1: staircase ===================
  const s1 = new THREE.Group(); scene.add(s1);
  const sky1 = sky('#7fb4ff', '#dff1ff', '#e9f6ff', new THREE.Vector3(0.5, 0.6, -0.6));
  s1.add(sky1);
  const floor1 = mesh(new THREE.CircleGeometry(60, 48), mat('#cfc3dc', { flatShading: false }), { rx: -PI / 2, cast: false });
  s1.add(floor1);
  const STEP_H = 0.34, STEP_D = 0.62, NSTEP = 12, LANE = 1.2, STEP_W = 1.3;
  const stepZ = (k) => -0.9 - k * STEP_D;
  const stepY = (k) => STEP_H * (k + 1);
  const doors = {};
  for (const [lane, x] of [['over', -LANE], ['doer', LANE]]) {
    for (let k = 0; k < NSTEP; k++) s1.add(box(STEP_W, stepY(k), STEP_D, k % 2 ? '#efe9e0' : '#e4ddd2', { x, z: stepZ(k), base: true }));
    const topY = stepY(NSTEP - 1), platZ = stepZ(NSTEP - 1) - STEP_D / 2 - 1.0;
    s1.add(box(STEP_W, topY, 2.0, '#e9e2d8', { x, z: platZ, base: true }));
    // door frame + door
    const fz = platZ - 0.75;
    s1.add(box(0.12, 1.9, 0.14, '#5b3a22', { x: x - 0.52, y: topY, z: fz, base: true }));
    s1.add(box(0.12, 1.9, 0.14, '#5b3a22', { x: x + 0.52, y: topY, z: fz, base: true }));
    s1.add(box(1.16, 0.14, 0.14, '#5b3a22', { x, y: topY + 1.9, z: fz, base: true }));
    const glow = mesh(new THREE.PlaneGeometry(0.92, 1.86), new THREE.MeshBasicMaterial({ color: '#fff1c4', toneMapped: false }), { x, y: topY + 0.93, z: fz - 0.04, cast: false });
    glow.material = glow.material.clone();
    s1.add(glow);
    const pivot = new THREE.Group(); pivot.position.set(x - 0.46, topY, fz + 0.02);
    const panel = box(0.92, 1.86, 0.06, '#8a5a36', { x: 0.46, base: true });
    pivot.add(panel);
    const knob = mesh(new THREE.SphereGeometry(0.04, 8, 6), mat('#e8c25a', { metalness: 0.6 }), { x: 0.8, y: 0.95, z: 0.05 });
    pivot.add(knob);
    s1.add(pivot);
    const light = new THREE.PointLight('#ffd58a', 0, 9, 1.6);
    light.position.set(x, topY + 1.2, fz + 0.6);
    s1.add(light);
    doors[lane] = { pivot, glow, light, topY, platZ, fz, x };
  }
  // the overthinker's storm of thoughts
  const thought = new THREE.Group();
  const thoughtMat = new THREE.MeshStandardMaterial({ color: '#4a4f5e', roughness: 1, flatShading: true });
  const thoughtBits = [];
  for (let i = 0; i < 16; i++) {
    const m = mesh(new THREE.IcosahedronGeometry(rng.float(0.18, 0.38), 0), thoughtMat, { x: rng.float(-0.7, 0.7), y: rng.float(-0.18, 0.3), z: rng.float(-0.45, 0.45), cast: true });
    m.userData = { ph: rng.float(0, 6), sp: rng.float(0.5, 1.4), appear: rng.float(0, 1) };
    thought.add(m); thoughtBits.push(m);
  }
  s1.add(thought);
  // floating scenery: soft clouds of blocks far away
  for (let i = 0; i < 14; i++) {
    const a = rng.float(-1.2, 1.2), d = rng.float(22, 45);
    s1.add(box(rng.float(1, 4), rng.float(0.6, 1.4), rng.float(1, 3), '#ffffff', { x: sin(a) * d, y: rng.float(5, 16), z: -cos(a) * d - 5, ry: rng.float(0, 3), cast: false }));
  }

  // =================== SCENE 2: canyon tightropes ===================
  const s2 = new THREE.Group(); scene.add(s2);
  const sky2 = sky('#5b6fb8', '#ffb07a', '#ff9a66', new THREE.Vector3(0, 0.06, -1));
  s2.add(sky2);
  const NEAR = 1.5, FAR = -14.5, ROPE_X = { grey: -0.9, gold: 0.9 }, SAG = 0.32;
  const ropeY = (z) => -SAG * sin(PI * clamp((NEAR - z) / (NEAR - FAR), 0, 1));
  const rockA = '#c8744c', rockB = '#a35a3c', rockC = '#7c4636';
  s2.add(box(30, 50, 14, rockA, { y: -50, z: NEAR + 7, base: true }));
  s2.add(box(30, 50, 20, rockA, { y: -50, z: FAR - 10, base: true }));
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const w = rng.float(4, 7), z = NEAR - 1 - i * 3.2;
      s2.add(box(w, rng.float(30, 46), 3.4, i % 2 ? rockB : rockC, { x: sx * (4.2 + w / 2 + rng.float(0, 2)), y: -48, z, base: true, ry: rng.float(-0.15, 0.15) }));
    }
  }
  for (let i = 0; i < 26; i++) {
    const side = i % 2 ? NEAR + rng.float(1, 12) : FAR - rng.float(1, 18);
    const r = rock(rng, { x: rng.float(-14, 14), z: side, s: rng.float(0.6, 2.2), color: rng.pick([rockA, rockB, '#d98b5f']) });
    if (abs(r.position.x) > 2.4 || abs(r.position.z - NEAR) > 3 && abs(r.position.z - FAR) > 3) s2.add(r);
  }
  // distant mesas
  for (let i = 0; i < 9; i++) {
    const x = rng.float(-80, 80), z = rng.float(-70, -130), h = rng.float(8, 20);
    s2.add(box(rng.float(10, 26), h, rng.float(8, 16), '#b56a4f', { x, y: -12, z, base: true, cast: false }));
  }
  const ropeMat = mat('#f3e3c3', { flatShading: false, roughness: 0.7 });
  for (const x of Object.values(ROPE_X)) {
    const pts = [];
    for (let i = 0; i <= 24; i++) { const z = NEAR + 0.3 - (i / 24) * (NEAR - FAR + 0.6); pts.push(new THREE.Vector3(x, ropeY(z) + 0.02, z)); }
    s2.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.025, 6), ropeMat, {}));
    for (const z of [NEAR + 0.35, FAR - 0.35]) s2.add(box(0.14, 1.0, 0.14, '#6b4527', { x, y: -0.35, z, base: true }));
  }
  // attention particles: little lights flowing from grey's eyes to gold
  const gazeMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: '#bfe6ff', toneMapped: false, transparent: true }), 14);
  gazeMesh.frustumCulled = false;
  s2.add(gazeMesh);

  // =================== SCENE 3: lantern hill ===================
  const s3 = new THREE.Group(); scene.add(s3);
  const sky3 = sky('#070b24', '#3b3f7e', '#141a3a', new THREE.Vector3(0, -1, 0));
  s3.add(sky3);
  {
    const n = 900, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = rng.float(0, PI * 2), y = rng.float(0.08, 1);
      const r = Math.sqrt(1 - y * y);
      pos.set([cos(a) * r * 380, y * 380, sin(a) * r * 380], i * 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    s3.add(new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 })));
  }
  const moon = mesh(new THREE.SphereGeometry(9, 24, 16), new THREE.MeshBasicMaterial({ color: '#f4f1ff', fog: false, toneMapped: false }), { x: -90, y: 120, z: -260, cast: false, receive: false });
  s3.add(moon);
  const hill = ground('#26324e', 44, 31, { bumps: 0.18, flatRadius: 6, variation: 0.06 });
  s3.add(hill);
  // valley below: the hill drops away behind the characters
  const valley = ground('#141c33', 400, 32, { bumps: 0.6, flatRadius: 0, variation: 0.05 });
  valley.position.set(0, -14, -120);
  s3.add(valley);
  const townN = 260;
  const town = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: '#ffcf7a', fog: false, toneMapped: false }), townN);
  {
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < townN; i++) {
      const x = rng.float(-110, 110), z = rng.float(-50, -190);
      m4.makeScale(rng.float(0.6, 1.6), rng.float(0.6, 1.6), 1).setPosition(x, -13 + rng.float(0, 1.5), z);
      town.setMatrixAt(i, m4);
      town.setColorAt(i, new THREE.Color(rng.pick(['#ffcf7a', '#ffb05c', '#fff0b8', '#ffd28f'])));
    }
  }
  s3.add(town);
  const stoneMat = mat('#3a4560');
  const pedestal = mesh(new THREE.DodecahedronGeometry(0.75, 0), stoneMat, { x: 0, y: 0.15, z: -2.6, s: [1.3, 0.62, 1.1] });
  s3.add(pedestal);
  for (let i = 0; i < 18; i++) s3.add(rock(rng, { x: rng.float(-14, 14), z: rng.float(-12, 6), s: rng.float(0.4, 1.4), color: '#2e3852' }));
  // grass tufts
  for (let i = 0; i < 70; i++) {
    const x = rng.float(-10, 10), z = rng.float(-10, 7);
    if (abs(x) < 3.5 && z > -4 && z < 2.5) continue;
    s3.add(mesh(new THREE.ConeGeometry(0.06, rng.float(0.25, 0.5), 3), mat('#2f4a4a'), { x, y: 0.15, z, rz: rng.float(-0.3, 0.3) }));
  }
  const L1 = lantern(true), L2 = lantern(false);
  const spare = [lantern(false), lantern(false)];
  spare[0].position.set(0.75, 0, -2.0); spare[1].position.set(0.95, 0, -2.45); spare[1].rotation.z = 0.3;
  s3.add(L1, L2, ...spare);
  const l1Light = new THREE.PointLight('#ffa64d', 0, 14, 1.4); s3.add(l1Light);
  const l2Light = new THREE.PointLight('#ffa64d', 0, 14, 1.4); s3.add(l2Light);
  const flame = mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd27a', toneMapped: false }), {});
  s3.add(flame);
  const FARN = 140;
  const farL = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.24, 0.55, 8), new THREE.MeshBasicMaterial({ color: '#ffb35c', fog: false, toneMapped: false }), FARN);
  farL.frustumCulled = false;
  const farData = [];
  for (let i = 0; i < FARN; i++) {
    farData.push({
      x: rng.float(-40, 40), z: rng.float(-24, -90), y0: rng.float(-6, 0), sp: rng.float(1.8, 3.4),
      start: CUE.release + 0.1 + i * 0.035 + rng.float(0, 0.5), ph: rng.float(0, 6), s: rng.float(0.8, 1.5),
    });
  }
  s3.add(farL);

  const groups = [s1, s2, s3];
  const show = (g) => { for (const x of groups) x.visible = x === g; };

  // ---------- small utilities ----------
  const place = (c, x, y, z, ry) => { c.root.visible = true; c.root.position.set(x, y, z); c.root.rotation.set(0, ry, 0); };
  const blinkAt = (t, off) => { const p = (t + off) % 3.3; return p < 0.13 ? sin((p / 0.13) * PI) : 0; };
  const face = (c, t, expr, off = 0, lookX = 0, lookY = 0) => c.setFace({ expr, blink: blinkAt(t, off), mouth: 0, lookX, lookY });
  const headPos = (c, out = new THREE.Vector3()) => { c.head.getWorldPosition(out); return out; };
  const v3 = (a) => new THREE.Vector3(...a);
  const aimCam = (pos, look, fov, roll = 0) => {
    camera.position.copy(pos);
    camera.up.set(sin(roll), cos(roll), 0);
    camera.lookAt(look);
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  };
  const whip = (look, pos, yawDeg) => {
    // rotate the look target around the camera (a fast pan) for whip transitions
    const d = look.clone().sub(pos), a = yawDeg * DEG;
    return pos.clone().add(new THREE.Vector3(d.x * cos(a) - d.z * sin(a), d.y, d.x * sin(a) + d.z * cos(a)));
  };
  const shake = (t, t0, amt, dur = 0.5) => { const k = clamp(1 - (t - t0) / dur, 0, 1) * (t >= t0 ? 1 : 0); return new THREE.Vector3(sin(t * 71) * amt * k, cos(t * 53) * amt * k * 0.8, 0); };

  const labels = []; // filled per frame: { char, text, style, op }
  let sceneIdx = 0;

  // =====================================================================
  function scene1(t) {
    show(s1); sceneIdx = 1;
    player.bloom.strength = 0.22; player.bloom.threshold = 0.92;
    C.teal.root.visible = false;
    const u = t / CUE.s2;
    const skyU = smoothstep(clamp((t - 0.8) / 6, 0, 1));
    const U = sky1.material.uniforms;
    U.top.value.set('#5f9cf5').lerp(new THREE.Color('#3a2d6e'), skyU);
    U.horizon.value.set('#e3f2ff').lerp(new THREE.Color('#ff9a6b'), skyU);
    U.bottom.value.set('#e9f6ff').lerp(new THREE.Color('#6a4f86'), skyU);
    U.sunDir.value.set(0.5, lerp(0.55, 0.06, skyU), -0.7).normalize();
    hemi.color.set('#dfe9ff').lerp(new THREE.Color('#b59ad8'), skyU); hemi.groundColor.set('#b8a9c9').lerp(new THREE.Color('#5a4466'), skyU);
    hemi.intensity = lerp(0.85, 0.75, skyU);
    sun.color.set('#fff6e8').lerp(new THREE.Color('#ff9b5e'), skyU); sun.intensity = lerp(2.6, 2.0, skyU);
    sun.position.set(8, lerp(14, 5, skyU), lerp(4, 8, skyU)); sun.target.position.set(0, 1, -4);
    setShadowBox(12, 1, 60);
    scene.fog = new THREE.Fog(new THREE.Color('#e7eefc').lerp(new THREE.Color('#c48aa0'), skyU), 30, 90);
    floor1.material.color.set('#bfb0d4').lerp(new THREE.Color('#9a7ea8'), skyU);

    // --- DOER: climbs one step on every beat ---
    const D = C.gold, beats = CUE.climb;
    let x = LANE, y = 0, z = 0.1, ry = PI, pose;
    let k = -1;
    for (let i = 0; i < beats.length; i++) if (t >= beats[i] - 0.4) k = i;
    if (k < 0) {
      pose = seq(t, [[0, lookUp(28)], [0.55, (lt) => P({ ...breathe(lt), headNod: 8 - sin(clamp(lt / 0.35, 0, 1) * PI) * 16, lean: 4 })]]);
    } else if (t < beats[NSTEP - 1]) {
      const land = beats[k], st = land - 0.4;
      const su = clamp((t - st) / 0.4, 0, 1);
      const z0 = k === 0 ? 0.1 : stepZ(k - 1), y0 = k === 0 ? 0 : stepY(k - 1);
      z = lerp(z0, stepZ(k) + 0.05, easeInOut(su)); y = lerp(y0, stepY(k), smoothstep(su)) + sin(su * PI) * 0.16;
      const lead = k % 2 ? 'L' : 'R', trail = lead === 'L' ? 'R' : 'L';
      const s = sin(su * PI);
      pose = P({
        lean: 12, headNod: 6 - s * 4, bodyY: 0, twist: (lead === 'L' ? 1 : -1) * 6 * s,
        ['leg' + lead]: { fwd: 20 + 50 * s, knee: 15 + 80 * s }, ['leg' + trail]: { fwd: -10 - 12 * su, knee: 10 + 25 * s },
        ['arm' + lead]: { raise: 10, fwd: -30 * s, elbow: 30 }, ['arm' + trail]: { raise: 10, fwd: 40 * s, elbow: 55 },
      });
      if (su >= 1) pose = P({ lean: 8, headNod: 4, legL: { knee: 8 }, legR: { knee: 8 } });
    } else {
      // on the top: glance back, then walk into the light
      const dr = doors.doer;
      const wu = clamp((t - 6.62) / 0.42, 0, 1);
      z = lerp(stepZ(NSTEP - 1), dr.fz + 0.35, easeInOut(wu)); y = dr.topY;
      pose = seq(t, [[beats[NSTEP - 1], (lt) => P({ ...breathe(lt), headTurn: 0 })], [6.62, (lt) => walk(lt, 1.1, 1)]], 0.12);
    }
    place(D, x, y, z, ry);
    D.applyPose(pose, t);
    face(D, t, t < 0.55 ? 'neutral' : 'determined', 0.4);

    // the door opens as the doer arrives
    const dr = doors.doer;
    const open = smoothstep(clamp((t - 6.05) / 0.55, 0, 1));
    dr.pivot.rotation.y = open * 1.75;
    dr.light.intensity = open * 14;
    dr.glow.material.color.set('#3a2a1a').lerp(new THREE.Color('#fff1c4'), open);
    const over = doors.over;
    over.pivot.rotation.y = 0; over.light.intensity = 0; over.glow.material.color.set('#3a2a1a');

    // --- OVERTHINKER: looks, thinks, paces, then freezes under the storm ---
    const O = C.grey;
    const ox = kf(t, [[2.4, -LANE], [3.05, -LANE - 0.45, 'io'], [3.7, -LANE + 0.3, 'io'], [4.35, -LANE - 0.1, 'io']]);
    const ory = t < 1.0 ? PI - 0.25 : t < 2.4 ? kf(t, [[1.0, PI - 0.25], [1.5, 0.35]]) : t < 4.4 ? (t < 3.05 ? -PI / 2 : t < 3.7 ? PI / 2 : -PI / 2) * 0.85 : kf(t, [[4.4, -1.3], [4.7, 0.25]]);
    const crouch = smoothstep(clamp((t - 4.6) / 2.2, 0, 1));
    const opose = seq(t, [
      [0, lookUp(30)],
      [1.0, thinkP],
      [2.4, (lt) => addPose(walk(lt, 0.85, 0.75), { headNod: 18, lean: 6 })],
      [4.4, (lt) => clutchHead(crouch)(lt)],
    ], 0.22);
    place(O, ox, 0, 0.35, ory);
    O.applyPose(opose, t);
    face(O, t, t < 1 ? 'neutral' : t < 2.4 ? 'confused' : t < 4.4 ? 'sad' : 'scared', 1.7);

    // thought storm grows above the overthinker's head
    const hp = headPos(O);
    const grow = smoothstep(clamp((t - 1.1) / 5.2, 0, 1));
    thought.position.set(hp.x, hp.y + 0.95 + 0.35 * grow, hp.z);
    thought.scale.setScalar(0.3 + grow * 0.9);
    thought.rotation.y = t * 0.6;
    thoughtMat.color.set('#8f96a8').lerp(new THREE.Color('#2b2f3a'), grow);
    for (const b of thoughtBits) {
      const d = b.userData;
      b.visible = grow > d.appear * 0.85;
      b.position.y += 0; // positions fixed; wobble via rotation for determinism
      b.rotation.set(t * d.sp + d.ph, t * d.sp * 0.7, 0);
      const pop = clamp((grow - d.appear * 0.85) * 8, 0, 1);
      b.scale.setScalar(easeOutBack(pop) * (1 + 0.08 * sin(t * 6 + d.ph)));
    }

    // --- camera ---
    let pos = v3(kf(t, [[0, [0, 2.1, 10.8]], [2.2, [0.1, 2.5, 9.9], 'io'], [5.9, [0.6, 5.9, 9.4], 'io'], [CUE.s2, [0.8, 6.3, 8.4], 'io']]));
    let look = v3(kf(t, [[0, [0, 1.6, -2.0]], [2.2, [0, 1.9, -2.5], 'io'], [5.9, [0.2, 2.7, -4.5], 'io'], [CUE.s2, [0.5, 3.2, -6.5], 'io']]));
    const wy = t > CUE.s2 - 0.18 ? EASE.in(clamp((t - (CUE.s2 - 0.18)) / 0.18, 0, 1)) * 70 : 0;
    look = whip(look, pos, wy);
    aimCam(pos, look, 50);

    // effects
    const ev = [
      { t: beats[NSTEP - 1], type: 'dust', pos: [LANE, dr.topY, stepZ(NSTEP - 1)], seed: 3 },
      { t: 6.15, type: 'sparkle', pos: [LANE, dr.topY + 1.0, dr.fz + 0.2], seed: 4 },
    ];
    particles.update(ev, t);
    const em = [];
    const emote = (key, t0, dur, size = 0.55) => { if (t >= t0 && t < t0 + dur) em.push({ kind: 'emote', key, pos: hp.clone().add(new THREE.Vector3(0.45, 0.65, 0)), age: t - t0, life: dur, size }); };
    emote('?', 1.45, 1.0); emote('!?', 2.95, 0.9); emote('sweat', 3.95, 0.9, 0.45);
    sprites.update(em);

    labels.length = 0;
    labels.push({ char: O, text: 'OVERTHINKING', style: LABEL_STYLE.grey, op: win(t, 0.35, CUE.s2 - 0.1, 0.4, 0.2), lift: 1.2 + grow * 1.3 });
    labels.push({ char: D, text: 'DOING', style: LABEL_STYLE.gold, op: win(t, 0.5, CUE.s2 - 0.1, 0.4, 0.2), lift: 0.75 });
  }

  // =====================================================================
  function scene2(t) {
    show(s2); sceneIdx = 2;
    player.bloom.strength = 0.35; player.bloom.threshold = 0.86;
    C.teal.root.visible = false;
    hemi.color.set('#ffd2a8'); hemi.groundColor.set('#6a3a3a'); hemi.intensity = 1.0;
    sun.color.set('#ffb36b'); sun.intensity = 2.8;
    sun.position.set(-3, 6, -22); sun.target.position.set(0, 0, -6);
    setShadowBox(14, 1, 60);
    scene.fog = new THREE.Fog('#f2a77c', 14, 95);

    const G = C.gold, R = C.grey;
    const gz = kf(t, [[CUE.s2, 2.7], [7.7, 1.75, 'in'], [15.25, FAR + 0.15, 'lin'], [15.9, FAR - 0.8, 'out']]);
    const rzMain = kf(t, [[CUE.s2, 2.7], [7.7, 1.75, 'in'], [10.6, -3.0, 'lin'], [12.4, -5.0, 'lin'], [CUE.slip, -6.0, 'out']]);
    const onRope = (z) => z < NEAR + 0.05 && z > FAR - 0.05;
    const gy = onRope(gz) ? ropeY(gz) + 0.03 : 0;

    // FOCUS – calm, steady, eyes forward
    const gWalk = (lt) => {
      const p = walk(lt, 0.62, 0.55);
      return addPose(p, { armL: { raise: 70, fwd: -p.armL.fwd + sin(lt * 2.1) * 6 }, armR: { raise: 70, fwd: -p.armR.fwd - sin(lt * 2.1) * 6 }, legL: { out: -3 }, legR: { out: -3 }, roll: sin(lt * 1.9) * 0.025 });
    };
    const gpose = t < 15.25 ? gWalk(t - CUE.s2) : seq(t, [[15.25, (lt) => walk(lt, 0.9, 0.9)], [15.9, (lt) => P({ ...breathe(lt), headNod: -6 })]], 0.2);
    place(G, ROPE_X.gold, gy, gz, PI);
    G.applyPose(gpose, t);
    face(G, t, t > 15.3 ? 'happy' : 'determined', 0.2);

    // COMPARISON – keeps looking over, wobbles, slips and ends up hanging
    const glances = [[8.4, 9.4], [10.2, 11.2], [11.7, 13.0], [13.3, 15.0]];
    let look = 0;
    for (const [a, b] of glances) look = max(look, win(t, a, b, 0.22, 0.25));
    const wobAmt = clamp((t - 9.0) / 5.0, 0, 1) * 0.06 + win(t, CUE.breakStart, CUE.slip, 0.2, 0.05) * 0.2;
    const fallU = clamp((t - CUE.slip) / 0.38, 0, 1);
    let ry2 = rzMain, ryy = 0;
    let rpose;
    const rWalk = (lt) => {
      const p = walk(lt, 0.62 * (1 - look * 0.45), 0.55);
      return addPose(p, { armL: { raise: 70 + sin(lt * 5) * wobAmt * 300, fwd: -p.armL.fwd }, armR: { raise: 70 - sin(lt * 5) * wobAmt * 300, fwd: -p.armR.fwd }, legL: { out: -3 }, legR: { out: -3 }, headTurn: -62 * look, headNod: -4 * look });
    };
    let hangY = 0;
    if (t < CUE.slip) {
      rpose = rWalk(t - CUE.s2);
      rpose.roll = sin((t - CUE.s2) * 5) * wobAmt * (t > CUE.breakStart ? 2.2 : 1);
    } else {
      // slip → grab the rope → dangle and swing
      const sw = t - CUE.slip;
      const hang = P({ headNod: -30, headTurn: -20, armL: { raise: 172, elbow: 8 }, armR: { raise: 40 + sin(sw * 9) * 25, fwd: 30, elbow: 40 }, legL: { fwd: 10 + sin(sw * 3.2) * 18, knee: 25 }, legR: { fwd: -6 - sin(sw * 3.2) * 18, knee: 15 } });
      const slipP = P({ roll: 0.9, headTurn: -40, armL: { raise: 150 }, armR: { raise: 120 }, legL: { fwd: 40, knee: 30 }, legR: { fwd: -20 } });
      rpose = blendPose(slipP, hang, smoothstep(clamp(sw / 0.3, 0, 1)));
      rpose.roll = lerp(0.9, 0, smoothstep(clamp(sw / 0.35, 0, 1))) + sin(sw * 3.2) * 0.12 * Math.exp(-sw * 0.5);
      const drop = fallU < 1 ? fallU * fallU * 2.25 : 2.25 - 0.18 * sin(clamp((sw - 0.38) / 0.4, 0, 1) * PI) * Math.exp(-(sw - 0.38));
      hangY = -min(drop, 2.25);
    }
    const ry0 = onRope(ry2) ? ropeY(ry2) + 0.03 : 0;
    place(R, ROPE_X.grey + (t > CUE.slip ? -0.05 : 0), ry0 + hangY, ry2, PI + ryy);
    R.applyPose(rpose, t);
    face(R, t, t >= CUE.slip ? 'scared' : t > CUE.breakStart ? 'scared' : t > 12.4 ? 'sad' : t > 10.2 ? 'confused' : 'determined', 1.1, look * -0.8, 0);

    // attention trail
    const hR = headPos(R), hG = headPos(G);
    const m4 = new THREE.Matrix4();
    const gazeOp = t < CUE.slip ? look : 0;
    gazeMesh.material.opacity = gazeOp;
    for (let i = 0; i < 14; i++) {
      const f = ((i / 14) + t * 0.9) % 1;
      const p = hR.clone().lerp(hG, f); p.y += sin(f * PI) * 0.35;
      m4.makeScale(1, 1, 1).setPosition(p);
      gazeMesh.setMatrixAt(i, m4);
    }
    gazeMesh.instanceMatrix.needsUpdate = true;
    gazeMesh.visible = gazeOp > 0.01;

    // --- camera: 4 shots ---
    let pos, lk, fov = 50;
    if (t < 9.57) {
      pos = v3(kf(t, [[CUE.s2, [0.2, 3.3, 8.6]], [9.57, [0.0, 2.6, 6.6]]]));
      lk = v3(kf(t, [[CUE.s2, [0, -0.2, -8]], [9.57, [0, 0.2, -6]]]));
      const wy = -70 * (1 - EASE.out(clamp((t - CUE.s2) / 0.3, 0, 1)));
      lk = whip(lk, pos, wy);
      fov = 55;
    } else if (t < 12.4) {
      const mid = (gz + rzMain) / 2;
      pos = new THREE.Vector3(0.9, 1.15, min(gz, rzMain) - 4.8 + (t - 9.57) * 0.2);
      lk = new THREE.Vector3(0, 1.45, mid);
      fov = 52;
    } else if (t < CUE.breakStart) {
      pos = new THREE.Vector3(ROPE_X.grey - 3.0, 2.3, rzMain + 3.4 + (t - 12.4) * 0.3);
      lk = hR.clone().lerp(hG, 0.5); lk.y -= 0.2;
      fov = 50;
    } else {
      pos = v3(kf(t, [[CUE.breakStart, [3.3, 1.0, -21.5]], [CUE.drop, [3.0, 0.85, -20.8]]]));
      lk = v3(kf(t, [[CUE.breakStart, [-0.5, 0.2, -7.5]], [CUE.drop, [-0.4, 0.0, -9.0]]]));
      fov = 40;
    }
    aimCam(pos, lk, fov);

    particles.update([
      { t: 7.72, type: 'dust', pos: [ROPE_X.gold, 0, NEAR], seed: 9 },
      { t: 15.3, type: 'dust', pos: [ROPE_X.gold, 0, FAR - 0.4], seed: 10 },
      { t: CUE.slip + 0.05, type: 'impact', pos: [ROPE_X.grey, ropeY(-6), -6], seed: 11 },
    ], t);
    const em = [];
    if (t >= CUE.slip && t < CUE.slip + 1.1) em.push({ kind: 'emote', key: '!', pos: hR.clone().add(new THREE.Vector3(0.5, 0.5, 0)), age: t - CUE.slip, life: 1.1, size: 0.6 });
    sprites.update(em);

    labels.length = 0;
    labels.push({ char: R, text: 'COMPARISON', style: LABEL_STYLE.grey, op: win(t, CUE.s2 + 0.35, CUE.drop - 0.05, 0.4, 0.15) * (t > 12.4 && t < CUE.breakStart ? 0 : 1), lift: 0.75 });
    labels.push({ char: G, text: 'FOCUS', style: LABEL_STYLE.gold, op: win(t, CUE.s2 + 0.5, CUE.drop - 0.05, 0.4, 0.15) * (t > 12.4 && t < CUE.breakStart ? 0 : 1), lift: 0.75 });
  }

  // =====================================================================
  function scene3(t) {
    show(s3); sceneIdx = 3;
    player.bloom.strength = 0.7; player.bloom.threshold = 0.8;
    hemi.color.set('#5a6fb8'); hemi.groundColor.set('#0d1120'); hemi.intensity = 0.95;
    sun.color.set('#9fb4ff'); sun.intensity = 1.1;
    sun.position.set(-8, 10, -10); sun.target.position.set(0, 0, 0);
    setShadowBox(12, 1, 60);
    scene.fog = new THREE.Fog('#1a2148', 25, 160);

    const A = C.teal, E = C.grey, I = C.gold;
    const T = (x) => CUE.s3 + x;

    // ---- ACHIEVER on the rock: releases the first lantern on the drop ----
    const apose = seq(t, [
      [CUE.s3 - 1, holdUp],
      [16.35, (lt) => P({ ...breathe(lt), headNod: -30, armL: { raise: lerp(168, 120, clamp(lt / 0.5, 0, 1)), elbow: 20 }, armR: { raise: lerp(168, 120, clamp(lt / 0.5, 0, 1)), elbow: 20 } })],
      [16.9, cheer],
      [17.9, lookUp(26)],
      [20.7, (lt) => P({ ...breathe(lt), headNod: 4, armR: { raise: 70 + sin(lt * 9) * 18, fwd: 20, elbow: 40 } })],
      [21.5, (lt) => P({ ...breathe(lt), lean: 22 * sin(clamp(lt / 0.6, 0, 1) * PI), armL: { raise: 20, fwd: 60, elbow: 30 }, armR: { raise: 20, fwd: 60, elbow: 30 } })],
      [22.05, (lt) => P({ ...breathe(lt), headNod: 10, armR: { raise: 25, fwd: 75, elbow: 50 } })],
      [22.8, idle],
      [CUE.release, cheer],
    ], 0.22);
    place(A, 0, 0.5, -2.6, kf(t, [[20.6, 0.15], [21.0, 0.75]]));
    A.applyPose(apose, t);
    face(A, t, t < 16.4 ? 'determined' : 'happy', 2.2);

    // ---- ENVY: watches, then "NOT FAIR!", turns away, sulks ----
    const epose = seq(t, [
      [CUE.s3 - 1, lookUp(22)],
      [CUE.envy - 0.05, (lt) => addPose(crossArms(lt), { bodyY: abs(sin(clamp(lt / 0.3, 0, 1) * PI)) * 0.08 })],
      [CUE.release + 0.4, sitSulk],
    ], 0.25);
    const ery = kf(t, [[CUE.envy + 0.4, 0.55], [CUE.envy + 0.9, -0.55]]);
    place(E, -2.3, 0, 0.6, ery);
    E.applyPose(epose, t);
    face(E, t, t < CUE.envy ? 'neutral' : t < CUE.release ? 'angry' : 'sad', 0.9);

    // ---- INSPIRATION: idea → asks → lantern is lit → releases her own ----
    const ipos = v3(kf(t, [[20.6, [2.2, 0, 0.9]], [21.55, [0.95, 0, -1.25], 'io'], [22.6, [0.95, 0, -1.25]], [23.7, [1.5, 0, 0.35], 'io']]));
    const iry = kf(t, [[20.55, -0.35], [20.75, -2.4], [21.5, -2.55], [22.6, -2.55], [22.8, 0.2], [23.7, 0.35]]);
    const ipose = seq(t, [
      [CUE.s3 - 1, lookUp(26)],
      [CUE.idea - 0.05, (lt) => P({ ...breathe(lt), headNod: -10, bodyY: abs(sin(clamp(lt / 0.35, 0, 1) * PI)) * 0.15, armR: { raise: 35, fwd: 60, elbow: 110 } })],
      [20.6, (lt) => walk(lt, 1.05, 1)],
      [21.55, holdFront],
      [22.6, (lt) => addPose(walk(lt, 0.9, 0.6), { armL: { raise: 18, fwd: 55 - walk(lt, 0.9, 0.6).armL.fwd, elbow: 70, elbowOut: -20 }, armR: { raise: 18, fwd: 55 - walk(lt, 0.9, 0.6).armR.fwd, elbow: 70, elbowOut: -20 } })],
      [23.7, holdFront],
      [24.25, holdUp],
      [CUE.release + 0.15, (lt) => P({ ...breathe(lt), headNod: -30, armL: { raise: 150, elbow: 20 }, armR: { raise: 150, elbow: 20 } })],
      [26.0, cheer],
      [27.6, lookUp(32)],
    ], 0.24);
    place(I, ipos.x, 0, ipos.z, iry);
    I.applyPose(ipose, t);
    face(I, t, t < CUE.idea ? 'surprised' : t < CUE.light ? 'determined' : 'happy', 1.5);

    // ---- lanterns ----
    const hand = (c) => { const a = new THREE.Vector3(), b = new THREE.Vector3(); c.arms.L.hand.getWorldPosition(a); c.arms.R.hand.getWorldPosition(b); return a.add(b).multiplyScalar(0.5); };
    if (t < 16.35) { L1.position.copy(hand(A)).add(new THREE.Vector3(0, 0.02, 0)); }
    else {
      const r = t - 16.35;
      const h0 = hand(A);
      L1.position.set(0.0 + sin(r * 0.7) * 0.4 + r * 0.06, 2.95 + r * 0.95 + r * r * 0.02, -2.6 - r * 0.25);
      if (r < 0.3) L1.position.lerp(new THREE.Vector3(h0.x, h0.y + 0.02, h0.z), 1 - r / 0.3);
    }
    L1.rotation.set(0, t * 0.4, sin(t * 1.3) * 0.06);
    l1Light.position.copy(L1.position).add(new THREE.Vector3(0, 0.25, 0));
    l1Light.intensity = 9 * clamp(1 - (t - 20) / 8, 0.25, 1);

    // spare lanterns: one is handed to inspiration
    spare[1].visible = true;
    const handOff = clamp((t - 21.6) / 0.45, 0, 1);
    if (t < 21.6) { L2.position.set(0.75, 0, -2.0); L2.rotation.set(0, 0, 0); }
    else if (t < CUE.release) {
      const target = hand(I).add(new THREE.Vector3(0, t > 24.25 ? 0.05 : -0.18, 0));
      if (handOff < 1) {
        const from = hand(A).add(new THREE.Vector3(0, -0.15, 0));
        L2.position.copy(from.lerp(target, easeInOut(handOff)));
      } else L2.position.copy(target);
      L2.rotation.set(0, t * 0.3, 0);
    } else {
      const r = t - CUE.release;
      L2.position.set(1.5 + sin(r * 0.8) * 0.35, 3.1 + r * 1.05 + r * r * 0.03, 0.35 - r * 0.4);
      const h0 = hand(I);
      if (r < 0.3) L2.position.lerp(new THREE.Vector3(h0.x, h0.y + 0.05, h0.z), 1 - r / 0.3);
      L2.rotation.set(0, t * 0.4, sin(t * 1.5) * 0.07);
    }
    spare[0].visible = t < 21.6;
    const lit = smoothstep(clamp((t - CUE.light) / 0.35, 0, 1));
    setLit(L2, lit);
    l2Light.position.copy(L2.position).add(new THREE.Vector3(0, 0.25, 0));
    l2Light.intensity = 5 * lit;
    // the achiever's little flame lights it
    const fOn = win(t, 21.95, CUE.light + 0.25, 0.15, 0.2);
    flame.visible = fOn > 0.01;
    A.arms.R.hand.getWorldPosition(flame.position); flame.position.y += 0.08;
    flame.scale.setScalar(fOn * (1 + 0.2 * sin(t * 30)));

    // lanterns rising from the whole valley after inspiration lets hers go
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    farData.forEach((d, i) => {
      const r = t - d.start;
      if (r < 0) { m4.makeScale(0, 0, 0); farL.setMatrixAt(i, m4); return; }
      const sc = d.s * clamp(r / 0.4, 0, 1);
      m4.compose(new THREE.Vector3(d.x + sin(r * 0.6 + d.ph) * 0.8, d.y0 + r * d.sp, d.z), q, new THREE.Vector3(sc, sc, sc));
      farL.setMatrixAt(i, m4);
    });
    farL.instanceMatrix.needsUpdate = true;

    // ---- camera ----
    let pos, lk, fov = 50;
    if (t < CUE.envy) {
      const up = smoothstep(clamp((t - 16.2) / 1.9, 0, 1));
      pos = v3(kf(t, [[CUE.s3, [1.3, 0.45, 4.6]], [CUE.envy, [1.0, 0.5, 4.2]]]));
      lk = new THREE.Vector3(0.1, lerp(2.4, 5.4, up), -2.6);
      pos.add(shake(t, CUE.s3, 0.09, 0.45));
      fov = 58;
    } else if (t < CUE.idea) {
      pos = v3(kf(t, [[CUE.envy, [-0.4, 2.1, 6.0]], [CUE.idea, [-0.9, 2.0, 5.2]]]));
      lk = new THREE.Vector3(-1.9, 1.75, 0.5);
      pos.add(shake(t, CUE.envy, 0.05, 0.3));
      fov = 42;
    } else if (t < 20.6) {
      // in front of inspiration as the idea lands
      pos = v3(kf(t, [[CUE.idea, [1.3, 1.9, 5.6]], [20.6, [1.5, 1.95, 5.0]]]));
      lk = new THREE.Vector3(2.0, 1.85, 0.8);
      fov = 40;
    } else if (t < 22.6) {
      // side two-shot that keeps inspiration and the achiever both in frame
      pos = v3(kf(t, [[20.6, [7.8, 2.6, 0.2]], [22.6, [7.0, 2.5, -0.6]]]));
      lk = new THREE.Vector3((ipos.x + 0) / 2, 1.6, (ipos.z - 2.6) / 2);
      fov = kf(t, [[20.6, 50], [21.5, 40]]);
      } else if (t < CUE.release) {
      const a = kf(t, [[22.6, 35], [CUE.release, -25]]) * DEG;
      const c = new THREE.Vector3(ipos.x, 1.7, ipos.z);
      pos = c.clone().add(new THREE.Vector3(sin(a) * 5.2, 0.9 + (t - 22.6) * 0.12, cos(a) * 5.2));
      lk = c.clone().add(new THREE.Vector3(0, kf(t, [[23.9, 0.2], [CUE.release, 1.0]]), 0));
      fov = 46;
    } else {
      pos = v3(kf(t, [[CUE.release, [2.0, 1.7, 4.0]], [CUE.finale, [0.6, 7.5, 11.5], 'io'], [CUE.end, [0.2, 9.0, 13.5], 'out']]));
      lk = v3(kf(t, [[CUE.release, [1.2, 2.6, -0.4]], [CUE.finale, [0.0, 7.0, -14.0], 'io'], [CUE.end, [0.0, 12.5, -22.0], 'out']]));
      pos.add(shake(t, CUE.release, 0.04, 0.35));
      fov = 52;
    }
    aimCam(pos, lk, fov);

    particles.update([
      { t: CUE.s3 + 0.02, type: 'sparkle', pos: [0, 3.0, -2.6], seed: 21 },
      { t: CUE.light, type: 'sparkle', pos: [L2.position.x, L2.position.y + 0.2, L2.position.z], seed: 22 },
      { t: CUE.release, type: 'magic', pos: [1.5, 3.2, 0.35], seed: 23 },
      { t: 15.0, type: 'fireflies', pos: [-3, 0.8, -3], seed: 24 }, { t: 23.0, type: 'fireflies', pos: [-3, 0.8, -3], seed: 26 },
    ], t);
    const hE = headPos(E), hI = headPos(I);
    const em = [];
    if (t >= CUE.envy && t < CUE.envy + 1.5) em.push({ kind: 'comic', key: 'NOT FAIR!', color: '#ff4d4d', pos: hE.clone().add(new THREE.Vector3(0.75, 0.6, 0.3)), age: t - CUE.envy, life: 1.5, size: 0.75 });
    if (t >= CUE.envy + 0.1 && t < CUE.envy + 1.6) em.push({ kind: 'emote', key: 'anger', pos: hE.clone().add(new THREE.Vector3(-0.4, 0.45, 0)), age: t - CUE.envy - 0.1, life: 1.5, size: 0.38 });
    if (t >= CUE.idea && t < CUE.idea + 1.2) em.push({ kind: 'emote', key: 'idea', pos: hI.clone().add(new THREE.Vector3(0.0, 0.85, 0)), age: t - CUE.idea, life: 1.2, size: 0.6 });
    sprites.update(em);

    labels.length = 0;
    const endFade = 1 - smoothstep(clamp((t - (CUE.finale - 0.6)) / 0.6, 0, 1));
    labels.push({ char: E, text: 'ENVY', style: LABEL_STYLE.grey, op: win(t, CUE.s3 + 0.5, CUE.end, 0.4, 0.2) * endFade, lift: t > CUE.release + 0.4 ? 0.2 : 0.75 });
    labels.push({ char: I, text: 'INSPIRATION', style: LABEL_STYLE.gold, op: win(t, CUE.s3 + 0.7, CUE.end, 0.4, 0.2) * endFade, lift: 0.75 });
  }

  // =====================================================================
  const tmp = new THREE.Vector3();
  const aspect = player.width / player.height;
  return {
    warmTimes: [1, 9, 20],
    update(t) {
      if (t < CUE.s2) scene1(t); else if (t < CUE.s3) scene2(t); else scene3(t);
      return { scene: sceneIdx };
    },
    overlay(t) {
      // labels are placed from the centre-time scene state
      this.update(t);
      camera.updateMatrixWorld();
      const hud = [];
      for (const l of labels) {
        if (l.op <= 0.002) continue;
        headPos(l.char, tmp); tmp.y += 0.45 + (l.lift ?? 0.75) * 0.5;
        tmp.project(camera);
        if (tmp.z > 1) continue;
        const halfW = 0.0175 * 2 * 0.99 * l.text.length / 2 + 0.05;
        hud.push({ text: l.text, style: l.style, x: clamp(tmp.x * aspect, -aspect + halfW, aspect - halfW), y: clamp(tmp.y, -0.92, 0.92), height: 0.0175, opacity: l.op, scale: 0.85 + 0.15 * easeOutBack(clamp(l.op, 0, 1)) });
      }
      // finale title
      const t1 = t - CUE.finale, t2 = t - CUE.title2;
      if (t1 > 0) hud.push({ text: 'RUN YOUR RACE', style: { size: 96, weight: 900, spacing: 0.16, color: '#ffffff', shadow: 0.7 }, x: 0, y: 0.5, height: 0.05, opacity: clamp(t1 / 0.25, 0, 1), scale: 0.8 + 0.2 * easeOutBack(clamp(t1 / 0.45, 0, 1)) });
      if (t2 > 0) hud.push({ text: 'NOT THEIRS.', style: { size: 80, weight: 800, spacing: 0.3, color: '#ffc04d', shadow: 0.7 }, x: 0, y: 0.39, height: 0.032, opacity: clamp(t2 / 0.2, 0, 1), scale: 0.7 + 0.3 * easeOutBack(clamp(t2 / 0.4, 0, 1)) });
      const overlays = [];
      overlays.push({ type: 'fade', amount: max(1 - t / 0.45, clamp((t - (CUE.end - 0.55)) / 0.5, 0, 1)) });
      overlays.push({ type: 'flash', amount: 0.55 * clamp(1 - abs(t - CUE.s2) / 0.12, 0, 1) });
      overlays.push({ type: 'flash', amount: 0.9 * (t >= CUE.drop ? clamp(1 - (t - CUE.drop) / 0.35, 0, 1) : 0) });
      return { hud, overlays };
    },
  };
}
