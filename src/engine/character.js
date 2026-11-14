import * as THREE from 'three';
import { createFaceCanvas, drawFace, faceKey } from './face.js';

const DEG = Math.PI / 180;
const INK = 0x151515;

// Shared materials keep every character visually identical in style.
const inkMat = new THREE.MeshStandardMaterial({ color: INK, roughness: 0.6, metalness: 0.0 });

function limb(length, radius) {
  const g = new THREE.CapsuleGeometry(radius, length, 4, 10);
  g.translate(0, -length / 2, 0);
  const m = new THREE.Mesh(g, inkMat);
  m.castShadow = true;
  return m;
}

function flat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, flatShading: true, ...opts });
}

/**
 * A rigged stick-figure character with a round white head.
 * Proportions are in world units (about 2.2 units tall at height 1.0).
 */
export class Character {
  constructor(spec) {
    this.spec = spec;
    const h = spec.height || 1;
    this.dims = {
      upperLeg: 0.46 * h, lowerLeg: 0.44 * h, torso: 0.58 * h,
      upperArm: 0.36 * h, lowerArm: 0.34 * h, headR: 0.4, limbR: 0.034,
    };
    const d = this.dims;
    this.root = new THREE.Group();
    this.root.name = spec.id;

    this.body = new THREE.Group(); // bob / fall rotations happen here
    this.root.add(this.body);

    this.hips = new THREE.Group();
    this.hips.position.y = d.upperLeg + d.lowerLeg + 0.03;
    this.body.add(this.hips);

    // spine
    this.spine = new THREE.Group();
    this.hips.add(this.spine);
    const spineMesh = limb(d.torso, d.limbR * 1.15);
    spineMesh.rotation.x = Math.PI; // points up
    this.spine.add(spineMesh);

    this.chest = new THREE.Group();
    this.chest.position.y = d.torso;
    this.spine.add(this.chest);

    // scarf in the character's accent colour (identity marker)
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.04, 8, 16), flat(spec.accent));
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 0.0;
    scarf.castShadow = true;
    this.chest.add(scarf);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.025), flat(spec.accent));
    tail.position.set(0.05, -0.08, -0.07); tail.rotation.z = 0.3;
    this.chest.add(tail);
    this.scarfTail = tail;

    // head
    this.neck = new THREE.Group();
    this.chest.add(this.neck);
    this.head = new THREE.Group();
    this.head.position.y = d.headR + 0.02;
    this.neck.add(this.head);

    this.faceCanvas = createFaceCanvas();
    this.faceTex = new THREE.CanvasTexture(this.faceCanvas);
    this.faceTex.colorSpace = THREE.SRGBColorSpace;
    this.faceTex.anisotropy = 8;
    const headMat = new THREE.MeshStandardMaterial({ map: this.faceTex, roughness: 0.45, metalness: 0, emissive: 0xffffff, emissiveMap: this.faceTex, emissiveIntensity: 0.22 });
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(d.headR, 48, 32), headMat);
    headMesh.castShadow = true;
    this.head.add(headMesh);
    this.headMesh = headMesh;
    this.buildAccessory(spec);

    // arms (stick figure: both arms start at the top of the spine)
    this.arms = {};
    for (const side of ['L', 'R']) {
      const sx = side === 'L' ? 1 : -1;
      const shoulder = new THREE.Group();
      shoulder.position.set(sx * 0.03, -0.06, 0);
      this.chest.add(shoulder);
      shoulder.add(limb(d.upperArm, d.limbR));
      const elbow = new THREE.Group();
      elbow.position.y = -d.upperArm;
      shoulder.add(elbow);
      elbow.add(limb(d.lowerArm, d.limbR));
      const hand = new THREE.Group();
      hand.position.y = -d.lowerArm - 0.02;
      elbow.add(hand);
      const handMesh = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), inkMat);
      handMesh.castShadow = true;
      hand.add(handMesh);
      this.arms[side] = { shoulder, elbow, hand, sx };
    }

    // legs
    this.legs = {};
    for (const side of ['L', 'R']) {
      const sx = side === 'L' ? 1 : -1;
      const hip = new THREE.Group();
      hip.position.set(sx * 0.07, 0, 0);
      this.hips.add(hip);
      hip.add(limb(d.upperLeg, d.limbR));
      const knee = new THREE.Group();
      knee.position.y = -d.upperLeg;
      hip.add(knee);
      knee.add(limb(d.lowerLeg, d.limbR));
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), inkMat);
      foot.scale.set(0.9, 0.55, 1.7);
      foot.position.set(0, -d.lowerLeg - 0.01, 0.06);
      foot.castShadow = true;
      knee.add(foot);
      this.legs[side] = { hip, knee, sx };
    }

    if (spec.creature) this.buildCreature(spec);
    this.props = {};
    this.buildProps();
    this._faceKey = '';
  }

  buildAccessory(spec) {
    const r = this.dims.headR;
    const acc = new THREE.Group();
    this.head.add(acc);
    switch (spec.accessory) {
      case 'crown': {
        const gold = flat(0xffc21a, { metalness: 0.5, roughness: 0.3 });
        const band = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.66, r * 0.28, 10, 1, true), gold);
        band.material.side = THREE.DoubleSide;
        band.position.y = r * 0.88;
        acc.add(band);
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          const spike = new THREE.Mesh(new THREE.ConeGeometry(r * 0.12, r * 0.32, 4), gold);
          spike.position.set(Math.sin(a) * r * 0.62, r * 1.15, Math.cos(a) * r * 0.62);
          acc.add(spike);
          const gem = new THREE.Mesh(new THREE.OctahedronGeometry(r * 0.06), flat(i % 2 ? 0xff2b4a : 0x2bb3ff));
          gem.position.set(Math.sin(a) * r * 0.66, r * 0.88, Math.cos(a) * r * 0.66);
          acc.add(gem);
        }
        break;
      }
      case 'helmet': {
        const steel = flat(0xb7c0cc, { metalness: 0.6, roughness: 0.35 });
        const dome = new THREE.Mesh(new THREE.SphereGeometry(r * 1.06, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.34), steel);
        acc.add(dome);
        const plume = new THREE.Mesh(new THREE.ConeGeometry(r * 0.12, r * 0.7, 6), flat(0xe8262b));
        plume.position.set(0, r * 1.25, -r * 0.1); plume.rotation.x = -0.4;
        acc.add(plume);
        const ridge = new THREE.Mesh(new THREE.BoxGeometry(r * 0.12, r * 0.18, r * 1.9), steel);
        ridge.position.y = r * 0.98;
        acc.add(ridge);
        break;
      }
      case 'bow': {
        const pink = flat(spec.accent);
        for (const sx of [-1, 1]) {
          const lobe = new THREE.Mesh(new THREE.ConeGeometry(r * 0.22, r * 0.4, 4), pink);
          lobe.rotation.z = sx * Math.PI / 2;
          lobe.position.set(sx * r * 0.22, r * 0.95, -r * 0.1);
          acc.add(lobe);
        }
        const knot = new THREE.Mesh(new THREE.SphereGeometry(r * 0.1, 8, 6), pink);
        knot.position.set(0, r * 0.95, -r * 0.1);
        acc.add(knot);
        acc.rotation.z = 0.35;
        break;
      }
      case 'wizardHat': {
        const blue = flat(spec.accent);
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.25, r * 1.25, r * 0.06, 16), blue);
        brim.position.y = r * 0.7;
        acc.add(brim);
        const cone = new THREE.Mesh(new THREE.ConeGeometry(r * 0.75, r * 1.8, 12), blue);
        cone.position.set(0, r * 1.55, -r * 0.08); cone.rotation.x = -0.15;
        acc.add(cone);
        for (let i = 0; i < 4; i++) {
          const star = new THREE.Mesh(new THREE.OctahedronGeometry(r * 0.08), flat(0xffe24a, { emissive: 0x554400 }));
          const a = i * 1.7;
          star.position.set(Math.sin(a) * r * 0.55, r * (1.0 + i * 0.25), Math.cos(a) * r * 0.5 * (1 - i * 0.2));
          acc.add(star);
        }
        break;
      }
      case 'glasses': {
        for (const sx of [-1, 1]) {
          const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 0.17, r * 0.025, 6, 16), inkMat);
          const a = sx * 0.3;
          rim.position.set(Math.sin(a) * r * 1.0, r * 0.14, Math.cos(a) * r * 1.0);
          rim.rotation.y = a;
          acc.add(rim);
        }
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(r * 0.16, r * 0.03, r * 0.03), inkMat);
        bridge.position.set(0, r * 0.17, r * 1.02);
        acc.add(bridge);
        // hair bun
        const bun = new THREE.Mesh(new THREE.SphereGeometry(r * 0.3, 10, 8), flat(0x6b3d1f));
        bun.position.set(0, r * 0.95, -r * 0.35);
        acc.add(bun);
        break;
      }
      case 'cap': {
        const yellow = flat(spec.accent);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(r * 1.03, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.36), yellow);
        acc.add(dome);
        const visor = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, r * 0.05, 16, 1, false, -Math.PI / 2, Math.PI), yellow);
        visor.position.set(0, r * 0.62, r * 0.55);
        visor.rotation.y = Math.PI; // brim faces forward
        visor.rotation.x = 0.15;
        acc.add(visor);
        acc.rotation.y = 0.5; // cheeky sideways cap
        break;
      }
      case 'horns': {
        const hornMat = flat(0xfff2c2);
        for (const sx of [-1, 1]) {
          const horn = new THREE.Mesh(new THREE.ConeGeometry(r * 0.17, r * 0.75, 6), hornMat);
          horn.position.set(sx * r * 0.5, r * 1.0, -r * 0.1);
          horn.rotation.z = -sx * 0.45;
          acc.add(horn);
        }
        const spikes = flat(spec.accent);
        for (let i = 0; i < 4; i++) {
          const sp = new THREE.Mesh(new THREE.ConeGeometry(r * 0.1, r * 0.25, 4), spikes);
          const a = -0.4 - i * 0.45;
          sp.position.set(0, Math.cos(a) * r * 1.0, Math.sin(a) * r * 1.0);
          sp.rotation.x = a;
          acc.add(sp);
        }
        break;
      }
      default: {
        // a tiny hair curl so the default hero still has a silhouette
        const curl = new THREE.Mesh(new THREE.TorusGeometry(r * 0.12, r * 0.025, 6, 12, Math.PI * 1.5), inkMat);
        curl.position.set(0, r * 1.06, 0);
        curl.rotation.y = Math.PI / 2;
        acc.add(curl);
      }
    }
    if (spec.beard) {
      const beard = new THREE.Mesh(new THREE.ConeGeometry(r * 0.45, r * 0.9, 8), flat(0xdedede));
      beard.rotation.x = Math.PI;
      beard.position.set(0, -r * 0.75, r * 0.45);
      acc.add(beard);
    }
  }

  buildCreature(spec) {
    // little dragon wings on the back and a tail (still stick-figure style)
    const green = flat(spec.accent, { side: THREE.DoubleSide });
    this.wings = [];
    for (const sx of [-1, 1]) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0); shape.lineTo(sx * 0.55, 0.35); shape.lineTo(sx * 0.45, 0.05); shape.lineTo(sx * 0.6, -0.15); shape.lineTo(sx * 0.3, -0.12); shape.lineTo(0, -0.2);
      const wing = new THREE.Mesh(new THREE.ShapeGeometry(shape), green);
      wing.position.set(0, -0.12, -0.06);
      wing.rotation.y = -sx * 0.5;
      wing.castShadow = true;
      this.chest.add(wing);
      this.wings.push({ wing, sx });
    }
    const tail = new THREE.Group();
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.06, 0.7, 6), inkMat);
    seg.position.y = -0.35;
    tail.add(seg);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 4), green);
    tip.position.y = -0.75; tip.rotation.x = Math.PI;
    tail.add(tip);
    tail.position.set(0, 0.02, -0.05);
    tail.rotation.x = -2.2;
    this.hips.add(tail);
    this.tail = tail;
  }

  buildProps() {
    // sword
    const sword = new THREE.Group();
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.015), flat(0xdfe6ee, { metalness: 0.8, roughness: 0.2 }));
    blade.position.y = 0.5;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.05), flat(0xc9a227, { metalness: 0.6 }));
    guard.position.y = 0.1;
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.16, 6), flat(0x5a3418));
    sword.add(blade, guard, grip);
    sword.rotation.x = Math.PI / 2; // points forward from the fist
    sword.visible = false;
    sword.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.arms.R.hand.add(sword);
    this.props.sword = sword;

    // magic wand
    const wand = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.5, 6), flat(0x6b3d1f));
    stick.position.y = 0.2;
    const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), flat(0xffe24a, { emissive: 0xffaa00, emissiveIntensity: 0.8 }));
    tip.position.y = 0.47;
    wand.add(stick, tip);
    wand.rotation.x = Math.PI / 2;
    wand.visible = false;
    this.arms.R.hand.add(wand);
    this.props.wand = wand;

    // book
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.06), flat(0xc0392b));
    book.position.set(0, 0.05, 0.08);
    book.visible = false;
    this.arms.L.hand.add(book);
    this.props.book = book;

    // phone
    const phone = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.02), flat(0x222222, { emissive: 0x3366ff, emissiveIntensity: 0.15 }));
    phone.position.set(0, 0.08, 0.05);
    phone.visible = false;
    this.arms.R.hand.add(phone);
    this.props.phone = phone;
  }

  setProp(name) {
    for (const [k, p] of Object.entries(this.props)) p.visible = k === name;
  }

  /** Apply a pose (see poses.js) to the rig. */
  applyPose(p, t = 0) {
    this._t = t;
    this.body.position.y = p.bodyY || 0;
    this.body.rotation.set(p.fall || 0, 0, p.roll || 0);
    this.hips.position.y = this.dims.upperLeg + this.dims.lowerLeg + 0.03 + (p.hipDrop || 0);
    this.spine.rotation.set((p.lean || 0) * DEG, (p.twist || 0) * DEG, (p.sway || 0) * DEG);
    this.neck.rotation.set((p.headNod || 0) * DEG, (p.headTurn || 0) * DEG, (p.headTilt || 0) * DEG, 'YXZ');
    const sq = p.squash || 0;
    this.head.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
    for (const side of ['L', 'R']) {
      const a = this.arms[side];
      const ap = p['arm' + side] || {};
      a.shoulder.rotation.set(-(ap.fwd || 0) * DEG, 0, a.sx * (ap.raise ?? 8) * DEG, 'ZXY');
      a.elbow.rotation.set(-(ap.elbow || 0) * DEG, 0, a.sx * (ap.elbowOut || 0) * DEG);
      const l = this.legs[side];
      const lp = p['leg' + side] || {};
      l.hip.rotation.set(-(lp.fwd || 0) * DEG, 0, l.sx * (lp.out || 3) * DEG);
      l.knee.rotation.set((lp.knee || 0) * DEG, 0, 0);
    }
    this.scarfTail.rotation.z = 0.3 + (p.scarf || 0);
    if (this.wings) {
      const flap = Math.sin(this._t * 9) * 0.35;
      for (const { wing, sx } of this.wings) wing.rotation.y = -sx * (0.5 + flap);
      this.tail.rotation.z = Math.sin(this._t * 3) * 0.4;
    }
  }

  /** Update the face texture only when the visible face actually changes. */
  setFace(state) {
    const key = faceKey(this.spec, state);
    if (key === this._faceKey) return;
    this._faceKey = key;
    drawFace(this.faceCanvas, this.spec, state);
    this.faceTex.needsUpdate = true;
  }

  get height() {
    const d = this.dims;
    return d.upperLeg + d.lowerLeg + d.torso + d.headR * 2;
  }
}
