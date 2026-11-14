import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createFaceCanvas, drawFace, faceKey } from './face.js';
import { clamp, smoothstep } from './rng.js';

// Blocky (game-avatar style) dogs. Same player interface as characters:
// applyPose / setFace / setProp / height / head / dims. Supports a missing leg
// (Patch has three legs) with a matching three-legged hopping gait, floppy or
// pointed ears, fluffy coats (Duchess) and printed fur patches.

const DEG = Math.PI / 180;
const sin = Math.sin, cos = Math.cos;

const mats = new Map();
function mat(color, o = {}) {
  const k = color + JSON.stringify(o);
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o }));
  return mats.get(k);
}
function block(w, h, d, m, r = 0.04) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 3, h / 3, d / 3)), m);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}
const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };

/** Fur texture with irregular patches (deterministic per spec). */
function furTexture(base, patches, patchColor, seed = 3, stripes = null) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  let s = seed;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  if (stripes) {
    g.fillStyle = stripes;
    for (let i = 0; i < 9; i++) {
      const x = 12 + i * 28;
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 14, 0); g.lineTo(x + 6 + (i % 2) * 8, 150); g.lineTo(x + 2, 150); g.fill();
    }
  }
  g.fillStyle = patchColor;
  for (let i = 0; i < patches; i++) {
    const x = r() * 256, y = r() * 256, rad = 30 + r() * 50;
    g.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 16) {
      const rr = rad * (0.88 + 0.12 * sin(a * 2 + i));
      g.lineTo(x + cos(a) * rr, y + sin(a) * rr);
    }
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Dog {
  constructor(spec) {
    this.spec = spec;
    this.kind = 'animal';
    const k = spec.scale || 1;
    const glow = spec.glow ? { emissive: spec.fur, emissiveIntensity: spec.glow, metalness: 0.35, roughness: 0.35 } : {};
    const fur = (spec.patches || spec.stripes)
      ? new THREE.MeshStandardMaterial({ map: furTexture(spec.fur, spec.patches || 0, spec.patchColor, spec.patchSeed, spec.stripes), roughness: 0.8, ...glow })
      : mat(spec.fur, { roughness: 0.85, ...glow });
    const furPlain = mat(spec.fur, { roughness: 0.85, ...glow });
    const dark = mat(spec.patchColor || spec.fur, { roughness: 0.8 });
    const nose = mat('#1d1712', { roughness: 0.35 });

    this.root = new THREE.Group();
    this.root.name = spec.id;
    this.body = new THREE.Group();
    this.body.scale.setScalar(k);
    this.root.add(this.body);

    const B = spec.body || [1, 1, 1];          // torso width, height, length multipliers
    const LS = spec.legScale ?? 1;              // leg length multiplier
    this.legLen = 0.36;
    this.hipBase = 0.12 * B[1] + 0.42 * LS + 0.02;
    this.torso = new THREE.Group();
    this.torso.position.y = this.hipBase;
    this.body.add(this.torso);
    this.torso.add(block(0.46 * B[0], 0.4 * B[1], 0.86 * B[2], fur, spec.round ? 0.18 : 0.1));
    if (spec.belly) this.torso.add(at(block(0.36 * B[0], 0.08, 0.6 * B[2], mat(spec.belly, glow)), 0, -0.18 * B[1], 0.04));
    if (spec.fluffy) {
      const fm = mat(spec.fur, { roughness: 1 });
      for (let i = 0; i < 9; i++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.13 + (i % 3) * 0.02, 10, 8), fm);
        p.position.set((i % 3 - 1) * 0.18, 0.14 + ((i * 7) % 3) * 0.04, -0.3 + Math.floor(i / 3) * 0.3);
        p.castShadow = true;
        this.torso.add(p);
      }
    }

    // neck + head
    this.neck = new THREE.Group();
    this.neck.position.set(0, 0.16 * B[1], 0.4 * B[2]);
    this.torso.add(this.neck);
    this.head = new THREE.Group();
    this.head.position.set(0, 0.22, 0.12);
    this.neck.add(this.head);
    this.faceCanvas = createFaceCanvas();
    this.faceTex = new THREE.CanvasTexture(this.faceCanvas);
    this.faceTex.colorSpace = THREE.SRGBColorSpace;
    const W = 2048, H = 1024, P = W / (Math.PI * 2), span = 0.62;
    this.faceTex.repeat.set((2 * span * P) / W, (2 * span * P) / H);
    this.faceTex.offset.set((W * 0.25 - span * P) / W, 1 - (H * 0.5 + span * P) / H);
    const faceMat = new THREE.MeshStandardMaterial({ map: this.faceTex, roughness: 0.7, ...(spec.glow ? { emissive: 0xffffff, emissiveMap: this.faceTex, emissiveIntensity: spec.glow * 0.8 } : {}) });
    const hs = 0.46;
    if (spec.headScale) this.head.scale.setScalar(spec.headScale);
    this.head.add(block(hs, hs * 0.92, hs * 0.9, [furPlain, furPlain, furPlain, furPlain, faceMat, furPlain], 0.08));
    if (spec.fluffy) {
      const fm = mat(spec.fur, { roughness: 1 });
      for (let i = 0; i < 5; i++) this.head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), fm), (i - 2) * 0.1, 0.22, -0.05 - (i % 2) * 0.06));
    }
    // snout with nose and an opening jaw
    const snout = at(block(0.24, 0.15, 0.2, mat(spec.muzzle || spec.fur)), 0, -0.1, hs * 0.5 + 0.06);
    this.head.add(snout);
    const noseMesh = at(block(0.1, 0.07, 0.06, nose, 0.03), 0, -0.05, hs * 0.5 + 0.17);
    this.head.add(noseMesh);
    if (spec.snout === 'small') { // rodents: tiny muzzle and button nose close to the face
      snout.scale.set(0.7, 0.6, 0.35); snout.position.z = hs * 0.5 + 0.02;
      noseMesh.scale.setScalar(0.6); noseMesh.position.set(0, -0.06, hs * 0.5 + 0.06);
    }
    this.jaw = new THREE.Group();
    this.jaw.position.set(0, -0.17, hs * 0.5 - 0.02);
    if (spec.snout === 'small') { this.jaw.scale.set(0.6, 0.6, 0.4); this.jaw.position.set(0, -0.13, hs * 0.5 - 0.03); }
    this.head.add(this.jaw);
    this.jaw.add(at(block(0.2, 0.05, 0.18, mat(spec.muzzle || spec.fur)), 0, -0.02, 0.09));
    this.jaw.add(at(block(0.1, 0.02, 0.1, mat('#e86a7a')), 0, 0.01, 0.1)); // tongue
    // ears
    this.ears = [];
    for (const side of [-1, 1]) {
      const floppy = spec.ears === 'floppy' || (spec.ears === 'oneFloppy' && side === 1);
      const ear = new THREE.Group();
      ear.position.set(side * 0.19, 0.2, -0.02);
      this.head.add(ear);
      const earMesh = spec.ears === 'round'
        ? at(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 14), mat(spec.earColor || spec.fur, glow)), 0, 0.06, 0)
        : floppy ? at(block(0.1, 0.24, 0.14, dark, 0.04), side * 0.03, -0.1, 0) : at(new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), mat(spec.earColor || spec.patchColor || spec.fur, glow)), 0, 0.09, 0);
      if (spec.ears === 'round') { earMesh.rotation.x = Math.PI / 2; earMesh.scale.setScalar(spec.earSize || 1); earMesh.position.y = 0.06 * (spec.earSize || 1); }
      earMesh.castShadow = true;
      ear.add(earMesh);
      if (floppy) ear.rotation.z = side * 0.35;
      this.ears.push({ ear, side, floppy });
    }
    // collar + tag (+ bow)
    if (spec.collar) {
      const collar = at(block(0.34, 0.06, 0.3, mat(spec.collar)), 0, -0.02, 0.02);
      this.neck.add(collar);
      const tag = at(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 12), mat(spec.tag || '#ffc21a', { metalness: 0.7, roughness: 0.3 })), 0, -0.08, 0.17);
      tag.rotation.x = Math.PI / 2;
      this.neck.add(tag);
    }
    if (spec.bow) {
      const bm = mat(spec.bow);
      for (const sx of [-1, 1]) { const l = at(new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), bm), sx * 0.07, 0.25, 0.05); l.rotation.z = sx * Math.PI / 2; this.head.add(l); }
      this.head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), bm), 0, 0.25, 0.05));
    }
    // tail
    this.tail = new THREE.Group();
    this.tail.position.set(0, 0.12, -0.42);
    this.torso.add(this.tail);
    this.tail.position.z = -0.42 * B[2];
    if (spec.tail === 'stub') this.tail.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), furPlain), 0, 0.02, 0));
    else if (spec.tail === 'long') {
      this.tail.add(at(block(0.07, 0.55, 0.07, fur, 0.03), 0, 0.26, 0));
      this.tail.add(at(block(0.09, 0.12, 0.09, mat(spec.tailTip || spec.stripes || spec.fur), 0.03), 0, 0.55, 0));
    } else this.tail.add(spec.fluffy ? at(new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), mat(spec.fur)), 0, 0.12, 0) : at(block(0.07, 0.3, 0.07, dark, 0.03), 0, 0.14, 0));
    // lion mane, dragon wings and horns
    if (spec.mane) {
      const mm = mat(spec.mane, { roughness: 1 });
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; this.head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), mm), Math.cos(a) * 0.27, Math.sin(a) * 0.25 + 0.02, -0.12)); }
    }
    if (spec.wings) {
      const wm = mat(spec.wings, { side: THREE.DoubleSide, ...glow });
      for (const sx of [-1, 1]) {
        const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(sx * 0.6, 0.35); sh.lineTo(sx * 0.5, 0.05); sh.lineTo(sx * 0.65, -0.12); sh.lineTo(0, -0.18);
        const w = new THREE.Mesh(new THREE.ShapeGeometry(sh), wm); w.position.set(sx * 0.15, 0.2 * B[1], 0.05); w.rotation.set(-0.3, 0, sx * 0.25); w.castShadow = true;
        this.torso.add(w); (this.wings ||= []).push({ w, sx });
      }
    }
    if (spec.horns) for (const sx of [-1, 1]) { const h = at(new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 6), mat(spec.horns)), sx * 0.12, 0.3, -0.02); h.rotation.z = -sx * 0.3; this.head.add(h); }
    // legs: FL FR BL BR
    this.legs = {};
    for (const [name, x, z] of [['FL', 0.15, 0.3], ['FR', -0.15, 0.3], ['BL', 0.15, -0.3], ['BR', -0.15, -0.3]]) {
      const hip = new THREE.Group();
      hip.position.set(x * B[0], -0.12 * B[1], z * B[2]);
      hip.scale.set(1, LS, 1);
      this.torso.add(hip);
      if (spec.missingLeg === name) { hip.add(at(block(0.12, 0.1, 0.12, furPlain), 0, -0.04, 0)); continue; }
      hip.add(at(block(0.12, 0.22, 0.13, furPlain), 0, -0.1, 0));
      const knee = new THREE.Group(); knee.position.y = -0.2; hip.add(knee);
      knee.add(at(block(0.1, 0.2, 0.11, furPlain), 0, -0.09, 0));
      knee.add(at(block(0.13, 0.06, 0.16, mat(spec.paws || spec.fur)), 0, -0.2, 0.025));
      this.legs[name] = { hip, knee };
    }
    this.dims = { headR: 0.25 * k };
    this._faceKey = '';
    this.faceSpec = { ...spec, skin: spec.faceFur || spec.fur, cheeks: !!spec.cheeks };
  }

  get height() { return (this.hipBase + 0.2 * (this.spec.body?.[1] || 1) + 0.45 * (this.spec.headScale || 1)) * (this.spec.scale || 1); }
  setProp() {}

  setFace(state) {
    const s = { ...state, mouth: 0 }; // dogs talk with the jaw, not a drawn mouth
    const key = faceKey(this.faceSpec, s) + '|dog';
    if (key === this._faceKey) return;
    this._faceKey = key;
    drawFace(this.faceCanvas, { ...this.faceSpec, dogFace: true }, s);
    this.faceTex.needsUpdate = true;
  }

  applyPose(p, t = 0) {
    this.body.position.y = (p.bob || 0) * (this.spec.scale || 1);
    this.body.rotation.set(0, 0, p.roll || 0);
    const lie = p.lie || 0;
    this.torso.position.y = this.hipBase - lie * 0.33 - (p.sit || 0) * 0.17;
    this.torso.rotation.set((p.pitch || 0) * DEG - (p.sit || 0) * 0.5, (p.yaw || 0) * DEG, 0);
    this.neck.rotation.set((p.neckPitch || 0) * DEG + (p.sit || 0) * 0.5, (p.headYaw || 0) * DEG, 0);
    this.head.rotation.set((p.headPitch || 0) * DEG, 0, (p.headTilt || 0) * DEG);
    this.jaw.rotation.x = (p.jaw || 0) * DEG;
    this.tail.rotation.set((-(p.tailUp ?? 30)) * DEG, 0, (p.tailWag || 0) * DEG);
    if (this.wings) for (const { w, sx } of this.wings) w.rotation.z = sx * (0.25 + Math.sin(t * 7) * 0.3);
    for (const e of this.ears) {
      if (e.floppy) e.ear.rotation.set((p.earFlap || 0) * DEG, 0, e.side * (0.35 + (p.earDroop || 0) * 0.4));
      else e.ear.rotation.set(-(p.earBack || 0) * DEG, 0, e.side * -0.15);
    }
    const sit = p.sit || 0;
    for (const [n, l] of Object.entries(this.legs)) {
      const lp = p.legs?.[n] || {};
      const front = n[0] === 'F';
      // lying: front legs stretch forward, back legs fold back.
      // sitting: the torso tilts up ~29deg, front legs stay vertical, back thighs fold forward with shins tucked under.
      const swing = (lp.swing || 0) + lie * (front ? -80 : 80) + sit * (front ? 28.6 : -60);
      const bend = (lp.bend || 0) * (front ? -1 : 1) + sit * (front ? 0 : 95);
      l.hip.rotation.x = swing * DEG;
      l.knee.rotation.x = bend * DEG;
    }
  }
}

// ---------------- dog actions ----------------
const base = () => ({ bob: 0, roll: 0, pitch: 0, yaw: 0, neckPitch: 0, headYaw: 0, headPitch: 0, headTilt: 0, jaw: 0, tailWag: 0, tailUp: 30, earFlap: 0, earDroop: 0, earBack: 0, lie: 0, sit: 0, legs: {} });

function gait(t, speed, threeLeg) {
  const f = t * Math.PI * 2 * speed;
  const s = sin(f), c = cos(f);
  if (threeLeg) {
    // three-legged hop: the single front leg plants while the back legs push
    const hop = Math.max(0, sin(f));
    return { bob: hop * 0.06, pitch: -c * 5, legs: { FR: { swing: -s * 32, bend: Math.max(0, c) * 30 }, BL: { swing: s * 26, bend: Math.max(0, -c) * 35 }, BR: { swing: s * 24, bend: Math.max(0, -c) * 35 } }, earFlap: s * 15 };
  }
  return { bob: Math.abs(c) * 0.035, legs: { FL: { swing: s * 28, bend: Math.max(0, -c) * 30 }, FR: { swing: -s * 28, bend: Math.max(0, c) * 30 }, BL: { swing: -s * 26, bend: Math.max(0, c) * 35 }, BR: { swing: s * 26, bend: Math.max(0, -c) * 35 } }, earFlap: s * 10 };
}

export const DOG_ACTIONS = {
  idle: (t, d, p = {}) => ({ ...base(), bob: sin(t * 2.4) * 0.008, tailWag: sin(t * 6) * 18, headTilt: sin(t * 0.7) * 5 }),
  wag: (t) => ({ ...base(), bob: Math.abs(sin(t * 9)) * 0.03, tailWag: sin(t * 22) * 40, tailUp: 55, headTilt: sin(t * 3) * 10, jaw: 12 }),
  walk: (t, d, p = {}) => ({ ...base(), ...gait(t, 1.8 * (p.speed || 1), p.threeLeg), tailWag: sin(t * 8) * 20 }),
  run: (t, d, p = {}) => ({ ...base(), ...gait(t, 3.3 * (p.speed || 1), p.threeLeg), pitch: -4, tailUp: 10, earDroop: 0.6, jaw: 14 }),
  tilt: (t) => ({ ...base(), headTilt: 22 * smoothstep(t / 0.3), tailWag: sin(t * 7) * 15, earFlap: 10 }),
  sit: (t) => ({ ...base(), sit: 1, tailWag: sin(t * 5) * 12, bob: sin(t * 2.2) * 0.006 }),
  lie: (t) => ({ ...base(), lie: 1, neckPitch: 18, headPitch: 6, tailUp: -10, tailWag: 0, earDroop: 1, bob: sin(t * 1.6) * 0.004 }),
  sad: (t) => ({ ...base(), lie: 1, neckPitch: 30, headPitch: 14, tailUp: -20, earDroop: 1, earBack: 30 }),
  lieDown: (t, d) => { const u = smoothstep(t / 0.7); return { ...base(), lie: u, neckPitch: 22 * u, tailUp: 30 - 50 * u, earDroop: u }; },
  bark: (t) => { const c = (t % 0.55) / 0.55, b = c < 0.25 ? sin((c / 0.25) * Math.PI) : 0; return { ...base(), jaw: 32 * b, neckPitch: -10 * b, headPitch: -8 * b, bob: 0.03 * b, tailUp: 45, tailWag: sin(t * 14) * 20, pitch: -3 * b }; },
  pull: (t) => ({ ...base(), pitch: 8, neckPitch: 20, headPitch: 10, jaw: 10, bob: Math.abs(sin(t * 10)) * 0.015, legs: { FR: { swing: -25 }, BL: { swing: 30, bend: 25 }, BR: { swing: 28, bend: 25 }, FL: { swing: -25 } }, roll: sin(t * 12) * 0.03 }),
  shiver: (t) => ({ ...base(), roll: sin(t * 50) * 0.04, earDroop: 1, tailUp: -25, neckPitch: 12, earBack: 30 }),
  jump: (t, d) => { const u = clamp(t / Math.max(0.4, d), 0, 1), air = u > 0.15 && u < 0.85 ? 4 * ((u - 0.15) / 0.7) * (1 - (u - 0.15) / 0.7) : 0; return { ...base(), bob: air * 0.35, pitch: -12 * air, tailUp: 60, tailWag: sin(t * 20) * 30, jaw: 12 }; },
  lick: (t) => ({ ...base(), neckPitch: 10, headPitch: -6, jaw: 14 + sin(t * 18) * 10, tailWag: sin(t * 20) * 35, tailUp: 50 }),
};

const KEYS = ['bob', 'roll', 'pitch', 'yaw', 'neckPitch', 'headYaw', 'headPitch', 'headTilt', 'jaw', 'tailWag', 'tailUp', 'earFlap', 'earDroop', 'earBack', 'lie', 'sit'];
export function evalDogAction(name, t, d, params, spec) {
  const fn = DOG_ACTIONS[name] || DOG_ACTIONS.idle;
  return fn(Math.max(0, t), d, { threeLeg: !!spec?.missingLeg, ...(params || {}) });
}
export function blendDogPose(a, b, w) {
  if (w <= 0) return a; if (w >= 1) return b;
  const o = { legs: {} };
  for (const k of KEYS) o[k] = (a[k] ?? 0) * (1 - w) + (b[k] ?? 0) * w;
  for (const n of ['FL', 'FR', 'BL', 'BR']) {
    const x = a.legs?.[n] || {}, y = b.legs?.[n] || {};
    o.legs[n] = { swing: (x.swing || 0) * (1 - w) + (y.swing || 0) * w, bend: (x.bend || 0) * (1 - w) + (y.bend || 0) * w };
  }
  return o;
}
