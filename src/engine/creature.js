import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { clamp, smoothstep } from './rng.js';

// Giant blocky creatures (an original prehistoric beast design). Same player
// interface as characters: applyPose / setFace / setProp / height / head,
// plus their own action library (walk = heavy stomping gait, roar, sniff...).

const DEG = Math.PI / 180;
const sin = Math.sin, cos = Math.cos;

function block(w, h, d, material, r = 0.12) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 3, h / 3, d / 3)), material);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };

export class Creature {
  constructor(spec) {
    this.spec = spec;
    this.kind = 'creature';
    const k = spec.scale || 1;
    const skin = new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.75, flatShading: false });
    const belly = new THREE.MeshStandardMaterial({ color: spec.belly, roughness: 0.8 });
    const dark = new THREE.MeshStandardMaterial({ color: spec.spikes, roughness: 0.6 });
    const toothM = new THREE.MeshStandardMaterial({ color: '#f4efe0', roughness: 0.5 });
    const eyeWhite = spec.glow ? new THREE.MeshBasicMaterial({ color: new THREE.Color(spec.glow).multiplyScalar(4), fog: false, toneMapped: false }) : new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 });
    const pupilM = new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.3 });
    this.root = new THREE.Group();
    this.root.name = spec.id;
    this.body = new THREE.Group();
    this.body.scale.setScalar(k);
    this.root.add(this.body);

    this.hipBase = 3.5;
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = this.hipBase;
    this.body.add(this.pelvis);

    // torso tilted slightly up at the front
    this.torso = new THREE.Group();
    this.pelvis.add(this.torso);
    this.torso.add(at(block(2.6, 2.5, 4.6, skin, 0.35), 0, 0.9, 0.6));
    this.torso.add(at(block(2.0, 1.6, 3.6, belly, 0.3), 0, 0.2, 0.9));
    for (let i = 0; i < 5; i++) this.torso.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 4), dark), 0, 2.4, -1.2 + i * 0.75));

    // neck + head
    this.neck = new THREE.Group();
    this.neck.position.set(0, 1.6, 2.6);
    this.torso.add(this.neck);
    this.neck.add(at(block(1.6, 1.8, 1.6, skin, 0.3), 0, 0.6, 0.3));
    this.head = new THREE.Group();
    this.head.position.set(0, 1.4, 0.8);
    this.neck.add(this.head);
    this.head.add(at(block(2.0, 1.4, 2.8, skin, 0.3), 0, 0.3, 0.9));     // skull + upper jaw
    this.head.add(at(block(1.7, 0.25, 2.3, new THREE.MeshStandardMaterial({ color: '#7a1f2a' }), 0.05), 0, -0.42, 1.0)); // mouth inside
    for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 4), toothM);
      tooth.rotation.x = Math.PI;
      tooth.position.set(sx * 0.78, -0.48, 0.2 + i * 0.36);
      this.head.add(tooth);
    }
    this.jaw = new THREE.Group();
    this.jaw.position.set(0, -0.45, -0.2);
    this.head.add(this.jaw);
    this.jaw.add(at(block(1.8, 0.5, 2.6, skin, 0.2), 0, -0.25, 1.2));
    for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) this.jaw.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 4), toothM), sx * 0.7, 0.1, 0.6 + i * 0.38));
    // eyes with lids and brows
    this.lids = []; this.brows = [];
    for (const sx of [-1, 1]) {
      const eye = at(block(0.52, 0.5, 0.35, eyeWhite, 0.08), sx * 0.85, 0.75, 1.55);
      if (spec.glow) eye.scale.set(1.6, 1.3, 1.6);
      eye.rotation.y = sx * 0.35;
      this.head.add(eye);
      if (!spec.glow) {
        const pupil = at(block(0.24, 0.3, 0.12, pupilM, 0.04), sx * 0.95, 0.72, 1.72);
        pupil.rotation.y = sx * 0.35;
        this.head.add(pupil);
      }
      const lid = at(block(0.58, 0.3, 0.42, skin, 0.06), sx * 0.85, 1.05, 1.55);
      lid.rotation.y = sx * 0.35;
      this.head.add(lid);
      this.lids.push(lid);
      const brow = at(block(0.7, 0.18, 0.4, dark, 0.05), sx * 0.85, 1.12, 1.62);
      brow.rotation.y = sx * 0.35;
      this.head.add(brow);
      this.brows.push({ brow, sx });
    }
    this.head.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 4), dark), 0, 1.15, 0.3));

    // tiny arms
    this.arms = [];
    for (const sx of [-1, 1]) {
      const sh = new THREE.Group();
      sh.position.set(sx * 1.1, 0.4, 2.3);
      this.torso.add(sh);
      sh.add(at(block(0.35, 0.9, 0.35, skin, 0.1), 0, -0.4, 0));
      const fore = new THREE.Group(); fore.position.y = -0.8; sh.add(fore);
      fore.add(at(block(0.3, 0.6, 0.3, skin, 0.08), 0, -0.25, 0.15));
      this.arms.push({ sh, fore, sx });
    }
    // tail chain
    this.tail = [];
    let parent = this.torso, len = 1.5, wid = 1.6;
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group();
      g.position.set(0, i === 0 ? 0.9 : 0, i === 0 ? -1.6 : -len);
      parent.add(g);
      g.add(at(block(wid, wid * 0.9, len + 0.2, skin, 0.2), 0, 0, -len / 2));
      g.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.22 * wid, 0.6 * wid, 4), dark), 0, wid * 0.55, -len / 2));
      this.tail.push(g);
      parent = g; len *= 0.9; wid *= 0.75;
    }
    // legs
    this.legs = {};
    for (const side of ['L', 'R']) {
      const sx = side === 'L' ? 1 : -1;
      const hip = new THREE.Group();
      hip.position.set(sx * 1.25, 0.3, -0.2);
      this.pelvis.add(hip);
      hip.add(at(block(1.1, 2.2, 1.4, skin, 0.25), 0, -0.8, 0.1));
      const knee = new THREE.Group(); knee.position.set(0, -1.8, 0.2); hip.add(knee);
      knee.add(at(block(0.8, 1.7, 0.9, skin, 0.2), 0, -0.75, -0.1));
      const ankle = new THREE.Group(); ankle.position.set(0, -1.55, -0.1); knee.add(ankle);
      ankle.add(at(block(1.0, 0.4, 1.7, skin, 0.12), 0, -0.05, 0.45));
      for (let c = -1; c <= 1; c++) ankle.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 4), toothM), c * 0.32, -0.05, 1.35)).children.at(-1)?.rotation.set(Math.PI / 2, 0, 0);
      this.legs[side] = { hip, knee, ankle, sx };
    }
    this.dims = { headR: 1.0 * k };
  }

  get height() { return 7.6 * (this.spec.scale || 1); }

  setProp() {}

  setFace(state) {
    const blink = this.spec.glow ? 0 : state.blink || 0;
    const angry = state.expr === 'angry' || state.expr === 'determined';
    const scared = state.expr === 'scared' || state.expr === 'surprised';
    for (const lid of this.lids) { lid.position.y = 1.05 - blink * 0.32; lid.scale.y = 1 + blink * 0.8; }
    for (const { brow, sx } of this.brows) {
      brow.rotation.z = angry ? sx * -0.45 : scared ? sx * 0.35 : 0;
      brow.position.y = scared ? 1.25 : angry ? 1.06 : 1.12;
    }
  }

  applyPose(p, t = 0) {
    this.body.position.y = p.bob || 0;
    this.body.rotation.set(0, 0, p.roll || 0);
    this.torso.rotation.set((-12 + (p.pitch || 0)) * DEG, (p.yaw || 0) * DEG, 0);
    this.neck.rotation.set((p.neckPitch || 0) * DEG, (p.neckYaw || 0) * DEG, 0);
    this.head.rotation.set((p.headPitch || 0) * DEG, 0, (p.headTilt || 0) * DEG);
    this.jaw.rotation.x = (p.jaw || 4) * DEG;
    this.tail.forEach((g, i) => {
      g.rotation.y = ((p.tailYaw || 0) * (0.6 + i * 0.25) + sin(t * 1.3 - i * 0.6) * 4) * DEG;
      g.rotation.x = ((p.tailPitch ?? 6) + i * 2) * DEG;
    });
    for (const a of this.arms) { a.sh.rotation.x = (-(p.arm || 20) + sin(t * 3 + a.sx) * 5) * DEG; a.fore.rotation.x = -60 * DEG; }
    for (const side of ['L', 'R']) {
      const l = this.legs[side], lp = p['leg' + side] || {};
      l.hip.rotation.x = (-(lp.thigh || 0) + 12) * DEG;
      l.knee.rotation.x = ((lp.knee || 0) - 4) * DEG;
      l.ankle.rotation.x = ((lp.foot || 0) - 8 + 12 - 12) * DEG;
    }
  }
}

// ---------------- creature actions ----------------
const base = () => ({ bob: 0, roll: 0, pitch: 0, yaw: 0, neckPitch: 0, neckYaw: 0, headPitch: 0, headTilt: 0, jaw: 4, tailYaw: 0, tailPitch: 6, arm: 20, legL: { thigh: 0, knee: 0, foot: 0 }, legR: { thigh: 0, knee: 0, foot: 0 } });

function gait(t, speed) {
  const f = t * 2 * Math.PI * 0.75 * speed;
  const s = sin(f);
  const lift = (x) => Math.max(0, x);
  return {
    bob: Math.abs(cos(f)) * -0.25 + 0.1, roll: s * 0.04, yaw: s * 4,
    neckPitch: 4 + Math.abs(cos(f)) * 4, headPitch: -Math.abs(cos(f)) * 3, tailYaw: -s * 14,
    legL: { thigh: s * 26, knee: lift(-cos(f)) * 40, foot: lift(-cos(f)) * -10 },
    legR: { thigh: -s * 26, knee: lift(cos(f)) * 40, foot: lift(cos(f)) * -10 },
  };
}

export const CREATURE_ACTIONS = {
  idle: (t) => ({ ...base(), bob: sin(t * 1.4) * 0.05, neckPitch: sin(t * 0.9) * 3, neckYaw: sin(t * 0.5) * 8, tailYaw: sin(t * 0.8) * 10, jaw: 4 + Math.max(0, sin(t * 0.7)) * 4 }),
  walk: (t, d, p = {}) => ({ ...base(), ...gait(t, p.speed || 1) }),
  run: (t, d, p = {}) => ({ ...base(), ...gait(t, 1.8 * (p.speed || 1)), pitch: 8, neckPitch: 14 }),
  roar: (t, d) => {
    const u = clamp(t / Math.max(0.5, d), 0, 1);
    const wind = smoothstep(u / 0.2), out = smoothstep((u - 0.2) / 0.15);
    const tremble = u > 0.3 ? sin(t * 40) * 1.5 : 0;
    return { ...base(), pitch: -6 * out + 6 * wind * (1 - out), neckPitch: 20 * wind - 50 * out + tremble, headPitch: -15 * out, jaw: 4 + 46 * out + tremble, arm: 20 + 40 * out, tailPitch: 6 - 12 * out, tailYaw: sin(t * 6) * 10 * out, bob: 0.2 * out };
  },
  sniff: (t) => ({ ...base(), pitch: 10, neckPitch: 38 + sin(t * 9) * 3, headPitch: 15, jaw: 6, neckYaw: sin(t * 1.5) * 15 }),
  lookBack: (t, d) => { const u = smoothstep(t / 0.6); return { ...base(), neckYaw: 75 * u, yaw: 15 * u, neckPitch: -10 * u, jaw: 10 * u, headTilt: 8 * u, bob: sin(t * 1.4) * 0.05 }; },
  stomp: (t, d) => {
    const c = (t % 1.2) / 1.2, up = c < 0.4 ? smoothstep(c / 0.4) : 1 - smoothstep((c - 0.4) / 0.12);
    return { ...base(), legL: { thigh: 30 * up, knee: 45 * up, foot: -10 * up }, roll: 0.05 * up, neckPitch: 10, jaw: 20 * up };
  },
  scared: (t) => ({ ...base(), pitch: -8, neckPitch: -25, neckYaw: sin(t * 20) * 3, jaw: 25, arm: 70, tailPitch: -10, bob: sin(t * 25) * 0.04 }),
};

const KEYS = ['bob', 'roll', 'pitch', 'yaw', 'neckPitch', 'neckYaw', 'headPitch', 'headTilt', 'jaw', 'tailYaw', 'tailPitch', 'arm'];
export function evalCreatureAction(name, t, d, params) { return (CREATURE_ACTIONS[name] || CREATURE_ACTIONS.idle)(Math.max(0, t), d, params); }
export function blendCreaturePose(a, b, w) {
  if (w <= 0) return a; if (w >= 1) return b;
  const o = {};
  for (const k of KEYS) o[k] = (a[k] ?? 0) * (1 - w) + (b[k] ?? 0) * w;
  for (const s of ['legL', 'legR']) o[s] = { thigh: a[s].thigh * (1 - w) + b[s].thigh * w, knee: a[s].knee * (1 - w) + b[s].knee * w, foot: a[s].foot * (1 - w) + b[s].foot * w };
  return o;
}
