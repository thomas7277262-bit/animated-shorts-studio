import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createFaceCanvas, drawFace, faceKey } from './face.js';

// Original blocky humanoid (game-avatar style): block head with a drawn face,
// rectangular torso, two-part arms and legs so elbows and knees can bend.
// It exposes the same rig interface as the stick Character, so every action in
// poses.js (walk, run, jump, cheer, scared, sword swing, ...) works unchanged.

const DEG = Math.PI / 180;
const STUD = 0.42; // one "block" unit in world units

const matCache = new Map();
function mat(color, opts = {}) {
  const k = color + JSON.stringify(opts);
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.02, ...opts }));
  return matCache.get(k);
}

function at(m, x, y, z) { m.position.set(x, y, z); return m; }

function block(w, h, d, material, r = 0.03) {
  const g = new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 3, h / 3, d / 3));
  const m = new THREE.Mesh(g, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** A limb segment hanging down from its pivot. */
function seg(w, h, d, material) {
  const m = block(w, h, d, material);
  m.position.y = -h / 2;
  return m;
}

// Shirt texture: simple printed detail so outfits read as clothing.
function shirtTexture(color, detail, accent) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = color; g.fillRect(0, 0, 256, 256);
  // fabric shading
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, 'rgba(255,255,255,0.10)'); grd.addColorStop(1, 'rgba(0,0,0,0.12)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  g.fillStyle = accent;
  switch (detail) {
    case 'stripe': g.fillRect(0, 100, 256, 40); break;
    case 'zip': g.fillRect(120, 0, 16, 256); g.fillRect(0, 0, 256, 18); break;
    case 'star': {
      g.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 30 : 70; g.lineTo(128 + Math.cos(a) * r, 120 + Math.sin(a) * r); }
      g.fill(); break;
    }
    case 'tie': g.fillRect(0, 0, 256, 26); g.beginPath(); g.moveTo(118, 26); g.lineTo(138, 26); g.lineTo(146, 190); g.lineTo(128, 215); g.lineTo(110, 190); g.fill(); break;
    case 'overalls': g.fillRect(40, 120, 176, 136); g.fillRect(50, 0, 26, 130); g.fillRect(180, 0, 26, 130); break;
    case 'armor': g.fillStyle = '#c9d1da'; g.fillRect(20, 0, 216, 256); g.fillStyle = accent; g.fillRect(110, 20, 36, 200); g.fillRect(50, 90, 156, 30); break;
    default: break;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class BlockCharacter {
  constructor(spec) {
    this.spec = spec;
    this.kind = 'humanoid';
    const h = spec.height || 1;
    const S = STUD * h;
    this.dims = { upperLeg: S * 1.0, lowerLeg: S * 1.0, torso: S * 2, upperArm: S * 1.0, lowerArm: S * 0.95, headR: S * 0.62 };
    const d = this.dims;
    const skin = mat(spec.skin || '#f3c99a');
    const shirt = new THREE.MeshStandardMaterial({ map: shirtTexture(spec.shirt || spec.accent, spec.shirtDetail, spec.shirtAccent || '#ffffff'), roughness: 0.7 });
    const shirtPlain = mat(spec.shirt || spec.accent, { roughness: 0.7 });
    const pants = mat(spec.pants || '#2e4a7d', { roughness: 0.75 });
    const shoes = mat(spec.shoes || '#2b2b2b', { roughness: 0.6 });

    this.root = new THREE.Group();
    this.root.name = spec.id;
    this.body = new THREE.Group();
    this.root.add(this.body);
    this.hipBase = d.upperLeg + d.lowerLeg + 0.02;
    this.hips = new THREE.Group();
    this.hips.position.y = this.hipBase;
    this.body.add(this.hips);

    this.spine = new THREE.Group();
    this.hips.add(this.spine);
    const torso = block(S * 2, d.torso, S * 1.0, [shirtPlain, shirtPlain, shirtPlain, shirtPlain, shirt, shirtPlain], 0.04);
    torso.position.y = d.torso / 2;
    this.spine.add(torso);
    const belt = block(S * 2.04, S * 0.16, S * 1.04, mat(spec.belt || '#3a2a1c'), 0.02);
    belt.position.y = S * 0.1;
    this.spine.add(belt);

    this.chest = new THREE.Group();
    this.chest.position.y = d.torso;
    this.spine.add(this.chest);

    // head
    this.neck = new THREE.Group();
    this.chest.add(this.neck);
    this.head = new THREE.Group();
    this.head.position.y = d.headR + 0.03;
    this.neck.add(this.head);
    this.faceCanvas = createFaceCanvas();
    this.faceTex = new THREE.CanvasTexture(this.faceCanvas);
    this.faceTex.colorSpace = THREE.SRGBColorSpace;
    this.faceTex.anisotropy = 8;
    // show only the face area of the (equirectangular) face canvas on the front side
    const W = 2048, H = 1024, P = W / (Math.PI * 2), span = 0.62;
    this.faceTex.repeat.set((2 * span * P) / W, (2 * span * P) / H);
    this.faceTex.offset.set((W * 0.25 - span * P) / W, 1 - (H * 0.5 + span * P) / H);
    const faceMat = new THREE.MeshStandardMaterial({ map: this.faceTex, roughness: 0.55 });
    const hs = d.headR * 2;
    const headMesh = block(hs * 1.08, hs, hs, [skin, skin, skin, skin, faceMat, skin], hs * 0.18);
    this.head.add(headMesh);
    this.headMesh = headMesh;
    this.buildHair(spec, hs);

    // arms
    this.arms = {};
    for (const side of ['L', 'R']) {
      const sx = side === 'L' ? 1 : -1;
      const shoulder = new THREE.Group();
      shoulder.position.set(sx * S * 1.5, -S * 0.15, 0);
      this.chest.add(shoulder);
      const upper = seg(S * 0.95, d.upperArm, S * 0.95, spec.sleeves === 'short' ? skin : shirtPlain);
      upper.position.y = -d.upperArm / 2 + S * 0.12;
      shoulder.add(upper);
      const elbow = new THREE.Group();
      elbow.position.y = -d.upperArm + S * 0.12;
      shoulder.add(elbow);
      elbow.add(seg(S * 0.9, d.lowerArm, S * 0.9, spec.sleeves === 'long' ? shirtPlain : skin));
      const hand = new THREE.Group();
      hand.position.y = -d.lowerArm;
      elbow.add(hand);
      const handMesh = block(S * 0.9, S * 0.35, S * 0.9, skin, 0.03);
      handMesh.position.y = -S * 0.12;
      hand.add(handMesh);
      this.arms[side] = { shoulder, elbow, hand, sx };
    }
    // legs
    this.legs = {};
    for (const side of ['L', 'R']) {
      const sx = side === 'L' ? 1 : -1;
      const hip = new THREE.Group();
      hip.position.set(sx * S * 0.5, S * 0.05, 0);
      this.hips.add(hip);
      hip.add(seg(S * 0.98, d.upperLeg, S * 0.98, pants));
      const knee = new THREE.Group();
      knee.position.y = -d.upperLeg;
      hip.add(knee);
      knee.add(seg(S * 0.96, d.lowerLeg * 0.82, S * 0.96, pants));
      const shoe = block(S * 1.0, d.lowerLeg * 0.2, S * 1.25, shoes, 0.03);
      shoe.position.set(0, -d.lowerLeg * 0.9, S * 0.12);
      knee.add(shoe);
      this.legs[side] = { hip, knee, sx };
    }
    this.props = {};
    this.buildProps(S);
    this._faceKey = '';
  }

  buildHair(spec, hs) {
    const acc = new THREE.Group();
    this.head.add(acc);
    const hair = mat(spec.hair || '#3b2414', { roughness: 0.9 });
    const top = hs / 2;
    switch (spec.hairStyle) {
      case 'spiky':
        acc.add(at(block(hs * 1.14, hs * 0.22, hs * 1.08, hair, 0.04), 0, top, -hs * 0.02));
        for (let i = 0; i < 5; i++) {
          const sp = new THREE.Mesh(new THREE.ConeGeometry(hs * 0.14, hs * 0.32, 4), hair);
          sp.position.set((i - 2) * hs * 0.22, top + hs * 0.22, (i % 2) * -hs * 0.2);
          sp.castShadow = true;
          acc.add(sp);
        }
        break;
      case 'long':
        acc.add(at(block(hs * 1.16, hs * 0.22, hs * 1.1, hair, 0.05), 0, top, 0));
        acc.add(at(block(hs * 1.16, hs * 1.15, hs * 0.25, hair, 0.05), 0, top - hs * 0.55, -hs * 0.48));
        for (const sx of [-1, 1]) acc.add(at(block(hs * 0.14, hs * 0.75, hs * 0.9, hair, 0.03), sx * hs * 0.6, top - hs * 0.3, -hs * 0.08));
        break;
      case 'cap': {
        const capM = mat(spec.hatColor || spec.accent);
        acc.add(at(block(hs * 1.14, hs * 0.3, hs * 1.1, capM, 0.05), 0, top + hs * 0.05, 0));
        acc.add(at(block(hs * 1.0, hs * 0.06, hs * 0.5, capM, 0.02), 0, top - hs * 0.06, hs * 0.7));
        break;
      }
      case 'helmet': {
        const steel = mat('#b9c2cc', { metalness: 0.55, roughness: 0.35 });
        acc.add(at(block(hs * 1.18, hs * 0.5, hs * 1.14, steel, 0.06), 0, top - hs * 0.08, 0));
        const plume = block(hs * 0.14, hs * 0.4, hs * 0.7, mat(spec.accent), 0.03);
        plume.position.set(0, top + hs * 0.32, -hs * 0.1);
        acc.add(plume);
        break;
      }
      case 'crown': {
        acc.add(at(block(hs * 1.1, hs * 0.12, hs * 1.06, hair, 0.03), 0, top, 0));
        const gold = mat('#ffc21a', { metalness: 0.6, roughness: 0.3 });
        for (let i = 0; i < 4; i++) for (const zz of [-1, 1]) {
          const p = block(hs * 0.16, hs * 0.3, hs * 0.08, gold, 0.02);
          p.position.set((i - 1.5) * hs * 0.3, top + hs * 0.2, zz * hs * 0.5);
          acc.add(p);
        }
        break;
      }
      case 'bald': break;
      default:
        acc.add(at(block(hs * 1.13, hs * 0.24, hs * 1.08, hair, 0.05), 0, top, -hs * 0.02));
        acc.add(at(block(hs * 1.13, hs * 0.5, hs * 0.2, hair, 0.04), 0, top - hs * 0.25, -hs * 0.48));
    }
  }

  buildProps(S) {
    const flat = (c, o = {}) => mat(c, o);
    const sword = new THREE.Group();
    const blade = block(0.07, 0.9, 0.02, flat('#dfe6ee', { metalness: 0.8, roughness: 0.2 }), 0.01); blade.position.y = 0.55;
    const guard = block(0.28, 0.05, 0.06, flat('#c9a227', { metalness: 0.6 }), 0.01); guard.position.y = 0.1;
    sword.add(blade, guard, block(0.05, 0.18, 0.05, flat('#5a3418'), 0.01));
    sword.rotation.x = Math.PI / 2; sword.visible = false;
    this.arms.R.hand.add(sword);
    const flashlight = new THREE.Group();
    flashlight.add(block(0.08, 0.3, 0.08, flat('#333')));
    const lens = block(0.1, 0.04, 0.1, flat('#fff6c0', { emissive: '#ffe680', emissiveIntensity: 1.5 }), 0.01); lens.position.y = 0.16;
    flashlight.add(lens);
    flashlight.rotation.x = Math.PI / 2; flashlight.visible = false;
    this.arms.R.hand.add(flashlight);
    const phone = block(0.14, 0.24, 0.03, flat('#222', { emissive: '#3366ff', emissiveIntensity: 0.25 }), 0.01);
    phone.position.set(0, 0.0, 0.08); phone.visible = false;
    this.arms.R.hand.add(phone);
    const wand = new THREE.Group();
    wand.add(at(block(0.04, 0.5, 0.04, flat('#6b3d1f'), 0.01), 0, 0.2, 0));
    wand.add(at(block(0.1, 0.1, 0.1, flat('#ffe24a', { emissive: '#ffaa00', emissiveIntensity: 0.8 }), 0.02), 0, 0.47, 0));
    wand.rotation.x = Math.PI / 2; wand.visible = false;
    this.arms.R.hand.add(wand);
    this.props = { sword, flashlight, phone, wand };
  }

  setProp(name) { for (const [k, p] of Object.entries(this.props)) p.visible = k === name; }

  applyPose(p) {
    this.body.position.y = p.bodyY || 0;
    this.body.rotation.set(p.fall || 0, 0, p.roll || 0);
    this.hips.position.y = this.hipBase + (p.hipDrop || 0) * 0.9;
    this.spine.rotation.set((p.lean || 0) * DEG, (p.twist || 0) * DEG, (p.sway || 0) * DEG);
    this.neck.rotation.set((p.headNod || 0) * DEG, (p.headTurn || 0) * DEG, (p.headTilt || 0) * DEG, 'YXZ');
    const sq = (p.squash || 0) * 0.5;
    this.head.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
    for (const side of ['L', 'R']) {
      const a = this.arms[side], ap = p['arm' + side] || {};
      // stick-figure poses hold arms ~10 degrees out; blocky arms hang straight
      a.shoulder.rotation.set(-(ap.fwd || 0) * DEG, 0, a.sx * Math.max(0, (ap.raise ?? 8) - 8) * DEG, 'ZXY');
      a.elbow.rotation.set(-(ap.elbow || 0) * 0.85 * DEG, 0, 0);
      const l = this.legs[side], lp = p['leg' + side] || {};
      l.hip.rotation.set(-(lp.fwd || 0) * DEG, 0, l.sx * Math.max(0, (lp.out || 3) - 3) * DEG);
      l.knee.rotation.set((lp.knee || 0) * DEG, 0, 0);
    }
  }

  setFace(state) {
    const key = faceKey(this.spec, state);
    if (key === this._faceKey) return;
    this._faceKey = key;
    drawFace(this.faceCanvas, this.spec, state);
    this.faceTex.needsUpdate = true;
  }

  get height() { const d = this.dims; return d.upperLeg + d.lowerLeg + d.torso + d.headR * 2 + 0.05; }
}
