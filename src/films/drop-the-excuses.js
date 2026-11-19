// "Drop The Excuses" – a 33-second motivational short (v2).
//
// Two versions of the same person trudge up a mountain path at dawn, each
// carrying three boulders on their back: TOMORROW, NOT READY, TOO TIRED.
// The gold one (DISCIPLINE) throws them off the cliff one by one as the
// music builds; the grey one (EXCUSES) sits down under the weight. In the
// silent beat gold drops into a sprint start, and on the drop he races
// uphill, leaps a gap and reaches the summit as the sun rises. Last shot:
// from behind grey, looking up at gold on the summit – grey drops his first
// rock, stands up and starts walking.
//
// Timed to the royalty-free score in drop-the-excuses.score.js
// (120 BPM: 1 bar = 2 s, silence 15–16 s, drop at 16 s, outro at 28 s).
import * as THREE from 'three';
import { Character } from '../engine/character.js';
import { blendPose } from '../engine/poses.js';
import { ParticleSystem } from '../engine/effects.js';
import { sky, mat, mesh, box, rock, flag } from '../engine/environments/common.js';
import { Rng, clamp, lerp, easeOutBack, smoothstep } from '../engine/rng.js';
import { kf, win, P, seq, addPose, breathe, cheer, sitSulk, LABEL_STYLE } from './kit.js';
import { SCORE, SCORE_DURATION } from './drop-the-excuses.score.js';

const DEG = Math.PI / 180;
const { sin, cos, PI, abs, max, min } = Math;

export const CUE = {
  stop: 8.0, look: 8.6, tosses: [10.0, 12.0, 13.5], greySit: 12.4, crouch: 14.6, drop: 16.0,
  jump: 20.0, land: 20.7, summit: 24.0, endShot: 27.0, greyDrop: 27.4, greyStand: 27.9, greyWalk: 28.9,
  title: 28.0, title2: 30.0, end: SCORE_DURATION,
};
export const DURATION = CUE.end;
export { SCORE };

const WORDS = ['TOO TIRED', 'NOT READY', 'TOMORROW']; // bottom → top (top is thrown first)
const WORD_POP = [3.2, 2.2, 1.2];
const TAG = { size: 44, weight: 800, spacing: 0.16, color: '#ffe3d6', shadow: 0.0, pill: 'rgba(28,22,40,0.82)' };

// ---------------- world layout ----------------
const SLOPE = 0.18, GAP0 = -24.5, GAP1 = -27.3, TOP = -50;
const groundY = (z) => (z >= 0 ? 0 : z > TOP ? -z * SLOPE : -TOP * SLOPE);
const GX = 0.72, RX = -0.72; // lanes (gold, grey)
const STOPZ = 5.2, GREY_SIT_Z = 4.5;

// ---------------- poses ----------------
function heavyWalk(t, load, speed = 0.85) {
  const f = t * 2 * PI * speed, s = sin(f), c = cos(f);
  return P({
    bodyY: -0.04 * load + abs(c) * 0.055, lean: 12 + 20 * load, twist: s * 5, sway: s * 3,
    headNod: 10 + 14 * load + sin(f * 2 - 0.7) * 4, headTilt: s * 3,
    armL: { raise: 9, fwd: -s * 16, elbow: 18 }, armR: { raise: 9, fwd: s * 16, elbow: 18 },
    legL: { fwd: s * 26 + 4, knee: 14 + max(0, -c) * 40 }, legR: { fwd: -s * 26 + 4, knee: 14 + max(0, c) * 40 },
  });
}
function standLoad(t, load) {
  return P({ ...breathe(t, 1.8), lean: 6 + 18 * load, headNod: 4 + 12 * load, hipDrop: -0.04 * load, legL: { knee: 8 * load + 4 }, legR: { knee: 8 * load + 4 } });
}
/** throw over the right shoulder: u 0..1 (release at u = 0.55) */
function throwPose(base, u) {
  const ant = smoothstep(clamp(u / 0.45, 0, 1));            // wind-up
  const act = smoothstep(clamp((u - 0.45) / 0.17, 0, 1));    // whip
  const rec = smoothstep(clamp((u - 0.62) / 0.38, 0, 1));    // follow-through → settle
  const o = addPose(base, {
    twist: -24 * ant + 58 * act * (1 - rec * 0.85), lean: -7 * ant + 16 * act * (1 - rec), hipDrop: -0.08 * ant * (1 - act) - 0.04 * act * (1 - rec),
    headTurn: -38 * ant * (1 - act), headNod: -6 * ant,
    legL: { knee: 14 * ant * (1 - rec) }, legR: { knee: 10 * ant * (1 - rec) },
  });
  const up = { raise: 165, fwd: -55, elbow: 95 };
  const out = { raise: 100, fwd: 85, elbow: 8 };
  const rest = base.armR;
  const a1 = { raise: lerp(rest.raise, up.raise, ant), fwd: lerp(rest.fwd, up.fwd, ant), elbow: lerp(rest.elbow, up.elbow, ant) };
  const a2 = { raise: lerp(a1.raise, out.raise, act), fwd: lerp(a1.fwd, out.fwd, act), elbow: lerp(a1.elbow, out.elbow, act) };
  o.armR = { raise: lerp(a2.raise, rest.raise, rec), fwd: lerp(a2.fwd, rest.fwd, rec), elbow: lerp(a2.elbow, rest.elbow, rec), elbowOut: 0 };
  o.armL = { ...o.armL, raise: o.armL.raise + 25 * ant * (1 - rec), fwd: o.armL.fwd + 30 * act * (1 - rec) };
  return o;
}
function sprint(t) {
  const f = t * 2 * PI * 2.3, s = sin(f), c = cos(f);
  return P({
    lean: 17, bodyY: abs(c) * 0.1, twist: s * 11, headNod: -6 - abs(c) * 3, scarf: s * 0.4,
    armL: { raise: 14, fwd: -s * 80, elbow: 92 + s * 10 }, armR: { raise: 14, fwd: s * 80, elbow: 92 - s * 10 },
    legL: { fwd: s * 60 + 10, knee: 14 + 105 * max(0, c) }, legR: { fwd: -s * 60 + 10, knee: 14 + 105 * max(0, -c) },
  });
}
const jumpPose = (u) => P({
  lean: 12 - 10 * u, headNod: -14,
  armL: { raise: 35, fwd: 120 - 70 * u, elbow: 25 }, armR: { raise: 35, fwd: -45 + 35 * u, elbow: 35 },
  legL: { fwd: 80 - 45 * u, knee: 105 - 70 * u }, legR: { fwd: -38 + 25 * u, knee: 75 - 30 * u },
});
const crouchStart = (t) => P({
  hipDrop: -0.6, lean: 50, headNod: -36 + sin(t * 3) * 2, bodyY: sin(t * 6) * 0.006,
  armL: { raise: 8, fwd: 62, elbow: 0 }, armR: { raise: 8, fwd: 62, elbow: 0 },
  legL: { fwd: 78, knee: 118, out: 4 }, legR: { fwd: -18, knee: 112, out: 4 },
});
function walkOn(t) {
  const f = t * 2 * PI * 1.6, s = sin(f), c = cos(f);
  return P({ bodyY: abs(c) * 0.05, lean: 6, twist: s * 6, headNod: -10, armL: { raise: 9, fwd: -s * 30, elbow: 22 }, armR: { raise: 9, fwd: s * 30, elbow: 22 }, legL: { fwd: s * 30, knee: 6 + max(0, -c) * 45 }, legR: { fwd: -s * 30, knee: 6 + max(0, c) * 45 } });
}

// ---------------- props ----------------
function boulderPack(rng) {
  const g = new THREE.Group();
  g.position.set(0, -0.3, -0.34);
  g.add(box(0.42, 0.34, 0.24, '#7a5236', { y: -0.18 }));
  for (const sx of [-1, 1]) g.add(box(0.05, 0.62, 0.32, '#3d2a1c', { x: sx * 0.17, y: 0.0, z: 0.14 }));
  const rocks = [];
  const R = [[0.26, 0.0, 0.08], [0.22, 0.04, 0.47], [0.19, -0.03, 0.8]];
  const colors = ['#8c8a94', '#9a96a0', '#85828c'];
  R.forEach(([r, x, y], i) => {
    const m = mesh(new THREE.IcosahedronGeometry(r, 1), new THREE.MeshToonMaterial({ color: colors[i] }), { x, y, z: -0.12, rx: rng.float(0, 3), ry: rng.float(0, 3), s: [1.05, 0.92, 1] });
    const ol = new THREE.Mesh(m.geometry, new THREE.MeshBasicMaterial({ color: 0x141414, side: THREE.BackSide }));
    ol.scale.setScalar(1.07);
    m.add(ol);
    g.add(m);
    rocks.push(m);
  });
  for (let k = 0; k < 3; k++) g.add(mesh(new THREE.TorusGeometry(0.24 - k * 0.03, 0.012, 4, 16), mat('#d9c39a'), { y: 0.1 + k * 0.36, z: -0.12, rx: PI / 2 }));
  return { group: g, rocks };
}

// =====================================================================
export function createDropTheExcuses(player) {
  const scene = player.scene, camera = player.camera;
  const rng = new Rng(77);

  const hemi = new THREE.HemisphereLight('#ffffff', '#555555', 1);
  const sun = new THREE.DirectionalLight('#ffffff', 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  const sc = sun.shadow.camera; sc.left = -12; sc.right = 12; sc.top = 12; sc.bottom = -12; sc.near = 1; sc.far = 90;
  const rim = new THREE.DirectionalLight('#9fc2ff', 0.9); // cool back/rim light for silhouettes
  scene.add(hemi, sun, sun.target, rim, rim.target);

  // ---- world ----
  const world = new THREE.Group(); scene.add(world);
  const skyM = sky('#2a3f7a', '#f2a98a', '#5a4a72', new THREE.Vector3(0, -0.04, -1));
  world.add(skyM);
  const pathMat = new THREE.MeshToonMaterial({ color: '#e0b98f' });
  const W = 3.4;
  const ramp = (z0, z1) => {
    const len = Math.hypot(z0 - z1, groundY(z1) - groundY(z0));
    const ang = Math.atan2(groundY(z1) - groundY(z0), z0 - z1);
    world.add(mesh(new THREE.BoxGeometry(W, 0.8, len), pathMat, { y: (groundY(z0) + groundY(z1)) / 2 - 0.4 * cos(ang), z: (z0 + z1) / 2, rx: ang, cast: false }));
  };
  world.add(mesh(new THREE.BoxGeometry(W, 0.8, 16), pathMat, { y: -0.4, z: 8, cast: false }));
  ramp(0, GAP0); ramp(GAP1, TOP);
  world.add(mesh(new THREE.BoxGeometry(W + 4, 0.8, 9), pathMat, { y: -TOP * SLOPE - 0.4, z: TOP - 4.5, cast: false }));
  // cliffs below the path (cool mauve, so the warm path and figures pop)
  const cliffMats = ['#7e6b8f', '#6f5e82', '#8a779a'].map((c) => new THREE.MeshToonMaterial({ color: c }));
  for (let z = 15; z > TOP - 10; z -= 3.4) {
    if (z < GAP0 + 1.2 && z > GAP1 - 1.2) continue;
    const top = groundY(z) - 0.5;
    for (const sx of [-1, 1]) {
      const w = rng.float(1.8, 3.0);
      world.add(mesh(new THREE.BoxGeometry(w, top + 30, rng.float(2.8, 3.6)), rng.pick(cliffMats), { x: sx * (W / 2 + w / 2 - 0.55), y: (top - 30) / 2, z, ry: rng.float(-0.15, 0.15), cast: false }));
    }
    world.add(mesh(new THREE.BoxGeometry(W - 0.4, top + 30, 3.4), cliffMats[1], { y: (top - 30) / 2, z, cast: false }));
  }
  for (let z = 12; z > TOP - 4; z -= 3.1) {
    if (z < GAP0 + 1.5 && z > GAP1 - 1.5) continue;
    const sx = rng.chance(0.5) ? 1 : -1;
    const r = rock(rng, { x: sx * (W / 2 - 0.05), z, s: rng.float(0.35, 0.6), color: '#a48f7c' });
    r.position.y += groundY(z);
    world.add(r);
  }
  // distant mountains: layered silhouettes for depth
  for (const [rad, col, h0, h1] of [[150, '#5d5f93', 26, 46], [110, '#6f6aa0', 18, 34]]) {
    const m = new THREE.MeshToonMaterial({ color: col });
    for (let i = 0; i < 11; i++) {
      const a = -PI * 0.95 + (i / 10) * PI * 0.9;
      const h = rng.float(h0, h1), r = rng.float(14, 24);
      world.add(mesh(new THREE.ConeGeometry(r, h, 5), m, { x: cos(a) * rad, y: h / 2 - 8, z: sin(a) * rad - 30, ry: rng.float(0, 3), cast: false, receive: false }));
    }
  }
  world.add(flag('#ffb000', { x: -1.6, y: -TOP * SLOPE, z: TOP - 5.5, pole: 2.4 }));
  const cloudMat = new THREE.MeshToonMaterial({ color: '#f1c9c4', transparent: true, opacity: 0.9 });
  for (let i = 0; i < 24; i++) {
    const x = rng.float(-70, 70), z = rng.float(-90, 20);
    if (abs(x) < 7) continue;
    world.add(mesh(new THREE.IcosahedronGeometry(rng.float(2.5, 5), 1), cloudMat, { x, y: rng.float(-10, -6), z, s: [1.9, 0.45, 1.2], cast: false, receive: false }));
  }

  // ---- cast ----
  const gold = new Character({ id: 'gold', style: 'toon', body: '#f7f3ea', accent: '#ffb000', height: 1.0, eyeStyle: 'round', brows: 'normal', cheeks: true, accessory: 'bald' });
  const grey = new Character({ id: 'grey', style: 'toon', body: '#bcc2cf', accent: '#5f6b82', height: 1.0, eyeStyle: 'round', brows: 'normal', cheeks: false, accessory: 'bald', skin: '#dfe3ea' });
  scene.add(gold.root, grey.root);
  const gPack = boulderPack(rng), rPack = boulderPack(rng);
  gold.chest.add(gPack.group); grey.chest.add(rPack.group);
  const flying = gPack.rocks.map((r) => { const m = r.clone(); m.visible = false; world.add(m); return m; });
  const greyDrop = rPack.rocks[2].clone(); greyDrop.visible = false; world.add(greyDrop);

  const particles = new ParticleSystem(scene);
  const streakN = 30;
  const streaks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.014, 0.014, 2.4), new THREE.MeshBasicMaterial({ color: '#fff4dc', transparent: true, opacity: 0.4, toneMapped: false }), streakN);
  streaks.frustumCulled = false;
  scene.add(streaks);
  const streakData = Array.from({ length: streakN }, () => ({ x: rng.float(-3.5, 3.5), y: rng.float(0.1, 3.5), ph: rng.float(0, 1) }));

  // ---- helpers ----
  const place = (c, x, y, z, ry) => { c.root.position.set(x, y, z); c.root.rotation.set(0, ry, 0); };
  const blinkAt = (t, off) => { const p = (t + off) % 3.1; return p < 0.13 ? sin((p / 0.13) * PI) : 0; };
  const face = (c, t, expr, off = 0) => c.setFace({ expr, blink: blinkAt(t, off), mouth: 0, lookX: 0, lookY: 0 });
  const headPos = (c, out = new THREE.Vector3()) => c.head.getWorldPosition(out);
  const v3 = (a) => new THREE.Vector3(...a);
  const aimCam = (pos, look, fov) => {
    camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look);
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  };
  const shake = (t, t0, amt, dur = 0.5) => { const k = t >= t0 ? clamp(1 - (t - t0) / dur, 0, 1) : 0; return new THREE.Vector3(sin(t * 71) * amt * k, cos(t * 53) * amt * k * 0.8, 0); };

  function goldZ(t) {
    if (t < CUE.stop) return kf(t, [[0, 7.6], [CUE.stop - 0.3, STOPZ, 'lin'], [CUE.stop, STOPZ - 0.05, 'out']]);
    if (t < CUE.drop) return STOPZ - 0.05;
    const z0 = STOPZ - 0.05;
    if (t < CUE.jump) { const u = (t - CUE.drop) / (CUE.jump - CUE.drop); return lerp(z0, -24.2, u * u * 0.12 + u * 0.88); }
    if (t < CUE.land) return lerp(-24.2, -28.0, (t - CUE.jump) / (CUE.land - CUE.jump));
    return kf(t, [[CUE.land, -28.0], [23.55, -50.2, 'lin'], [CUE.summit, -52.4, 'out']]);
  }
  function goldY(t, z) {
    if (t >= CUE.jump && t < CUE.land) {
      const u = (t - CUE.jump) / (CUE.land - CUE.jump);
      return lerp(groundY(-24.2), groundY(-28.0), u) + sin(u * PI) * 1.6;
    }
    return groundY(z);
  }
  const rocksLeft = (t) => CUE.tosses.filter((tk) => t < tk).length;

  const labels = [];
  const tags = [];

  function update(t) {
    // ---------------- sky & light: dawn → sunrise ----------------
    const rise = smoothstep(clamp((t - CUE.drop) / (CUE.summit - CUE.drop + 0.5), 0, 1));
    const burst = smoothstep(clamp((t - (CUE.summit - 0.3)) / 1.2, 0, 1));
    const U = skyM.material.uniforms;
    U.top.value.set('#2a3f7a').lerp(new THREE.Color('#4f86d9'), rise);
    U.horizon.value.set('#f2a98a').lerp(new THREE.Color('#ffd08a'), rise);
    U.bottom.value.set('#6a5a86').lerp(new THREE.Color('#9a7d92'), rise);
    U.sunDir.value.set(0.06, lerp(-0.03, 0.12, rise), -1).normalize();
    hemi.color.set('#c9d6ff').lerp(new THREE.Color('#fff0dc'), rise); hemi.groundColor.set('#6e5e78').lerp(new THREE.Color('#8a6e64'), rise);
    hemi.intensity = lerp(1.25, 1.2, rise);
    sun.color.set('#ffb08a').lerp(new THREE.Color('#ffd49a'), rise);
    sun.intensity = lerp(1.5, 2.2, rise) + burst * 0.2;
    rim.intensity = lerp(0.9, 0.5, rise);
    scene.fog = new THREE.Fog(new THREE.Color('#9c86a8').lerp(new THREE.Color('#f3c49a'), rise), 35, 170);
    player.bloom.strength = lerp(0.3, 0.5, rise); player.bloom.threshold = 0.86;

    // ---------------- GOLD ----------------
    const gz = goldZ(t), gy = goldY(t, gz);
    const load = rocksLeft(t) / 3;
    let gpose;
    if (t < CUE.stop) gpose = heavyWalk(t, 1);
    else if (t < CUE.crouch) {
      gpose = blendPose(heavyWalk(t, 1), standLoad(t, load), smoothstep(clamp((t - CUE.stop) / 0.4, 0, 1)));
      const lookW = win(t, CUE.look, CUE.tosses[0] - 0.55, 0.3, 0.3);
      gpose = addPose(gpose, { headTurn: -50 * lookW, headNod: 12 * lookW });
      for (const tk of CUE.tosses) {
        const u = (t - (tk - 0.5)) / 0.9;
        if (u >= 0 && u <= 1) gpose = throwPose(gpose, u);
      }
      if (t > 14.0) gpose = blendPose(gpose, P({ ...breathe(t, 1.2), lean: -3, headNod: -8, armL: { raise: 25 }, armR: { raise: 25 }, sway: sin(t * 7) * 2 }), smoothstep(clamp((t - 14.0) / 0.3, 0, 1)));
    } else if (t < CUE.drop) gpose = blendPose(P({ lean: -2, headNod: -6 }), crouchStart(t - CUE.crouch), smoothstep(clamp((t - CUE.crouch) / 0.4, 0, 1)));
    else if (t < CUE.jump) gpose = blendPose(crouchStart(1), sprint(t - CUE.drop), smoothstep(clamp((t - CUE.drop) / 0.2, 0, 1)));
    else if (t < CUE.land) gpose = jumpPose((t - CUE.jump) / (CUE.land - CUE.jump));
    else if (t < 23.55) gpose = blendPose(jumpPose(1), sprint(t - CUE.land + 0.1), smoothstep(clamp((t - CUE.land) / 0.15, 0, 1)));
    else gpose = seq(t, [[23.55, (lt) => sprint(lt * 0.6)], [CUE.summit - 0.05, cheer], [26.4, (lt) => P({ ...breathe(lt), headNod: -10, armL: { raise: 165, elbow: 12 }, armR: { raise: 35, elbow: 25 } })]], 0.25);
    if (t >= CUE.land && t < CUE.land + 0.2) gpose = addPose(gpose, { hipDrop: -0.25 * sin(((t - CUE.land) / 0.2) * PI) });
    place(gold, GX, gy, gz, t >= CUE.summit + 0.5 ? kf(t, [[CUE.summit + 0.5, PI], [CUE.summit + 1.1, PI - 0.5]]) : PI);
    gold.applyPose(gpose, t);
    face(gold, t, t < CUE.look ? 'sad' : t < CUE.tosses[0] - 0.5 ? 'neutral' : t < CUE.summit ? 'determined' : 'happy', 0.3);
    gPack.rocks.forEach((r, i) => { r.visible = t < CUE.tosses[2 - i] + 0.05; });
    gPack.group.visible = t < CUE.tosses[2] + 0.45;

    // rocks in flight: over the shoulder and off the cliff
    tags.length = 0;
    flying.forEach((m, i) => {
      const tk = CUE.tosses[2 - i];
      const tau = t - (tk + 0.05);
      if (tau < 0 || tau > 2.6) { m.visible = false; return; }
      m.visible = true;
      const p0 = new THREE.Vector3(GX + 0.35, 2.3 - 0.25 * (2 - i), STOPZ - 0.1);
      m.position.set(p0.x + 3.1 * tau, p0.y + 3.4 * tau - 4.9 * tau * tau, p0.z - 1.3 * tau);
      m.rotation.set(tau * 7 + i, tau * 5, tau * 3);
      if (tau < 1.1) tags.push({ pos: m.position.clone().add(new THREE.Vector3(0, 0.5, 0)), text: WORDS[i], op: clamp(1 - (tau - 0.5) / 0.6, 0, 1) });
    });
    gold.root.updateMatrixWorld(true);
    gPack.rocks.forEach((r, i) => {
      if (!r.visible || t < WORD_POP[i] || t > CUE.tosses[2 - i]) return;
      const p = r.getWorldPosition(new THREE.Vector3());
      tags.push({ pos: p.add(new THREE.Vector3(0.62 + (i === 1 ? 0.12 : 0), 0, 0)), text: WORDS[i], op: clamp((t - WORD_POP[i]) / 0.25, 0, 1), pop: t - WORD_POP[i] });
    });

    // ---------------- GREY ----------------
    const rz = kf(t, [[0, 7.4], [CUE.greySit, GREY_SIT_Z, 'lin'], [CUE.greyWalk, GREY_SIT_Z], [CUE.end, GREY_SIT_Z - 2.6, 'lin']]);
    const stand = smoothstep(clamp((t - CUE.greyStand) / 0.8, 0, 1));
    const rpose = seq(t, [
      [0, (lt) => addPose(heavyWalk(lt + 0.4, 1, 0.78), { headNod: 4 })],
      [6.3, (lt) => addPose(heavyWalk(lt + 0.4, 1, 0.78), { hipDrop: -0.16 * sin(clamp(lt / 0.5, 0, 1) * PI), lean: 10 * sin(clamp(lt / 0.5, 0, 1) * PI) })],
      [6.8, (lt) => heavyWalk(lt + 0.9, 1, 0.7)],
      [CUE.greySit, (lt) => addPose(sitSulk(lt), { lean: 10 })],
      [CUE.endShot, (lt) => addPose(sitSulk(lt), { headNod: -48, lean: -8 })],
      [CUE.greyDrop - 0.35, (lt) => {
        const u = clamp(lt / 0.75, 0, 1), k = sin(u * PI);
        const p = addPose(sitSulk(lt), { headNod: -34, lean: -6 });
        p.armR = { raise: lerp(20, 155, k), fwd: lerp(70, -30, k), elbow: lerp(110, 60, k), elbowOut: 0 };
        return p;
      }],
      [CUE.greyStand, (lt) => blendPose(addPose(sitSulk(lt), { headNod: -30 }), P({ ...breathe(lt), headNod: -26, lean: 4 }), stand)],
      [CUE.greyWalk, (lt) => addPose(walkOn(lt), { headNod: -14 })],
    ], 0.3);
    place(grey, RX, 0, rz, PI);
    grey.applyPose(rpose, t);
    face(grey, t, t < CUE.endShot ? 'sad' : t < CUE.greyDrop + 0.3 ? 'surprised' : 'determined', 1.4);
    rPack.rocks[2].visible = t < CUE.greyDrop + 0.05;
    rPack.group.visible = t < CUE.greyWalk + 0.6;
    if (t >= CUE.greyDrop + 0.05) {
      const tau = t - (CUE.greyDrop + 0.05);
      greyDrop.visible = tau < 2.2;
      greyDrop.position.set(RX - 0.4 - 1.5 * tau, max(0.18, 1.9 + 1.0 * tau - 4.9 * tau * tau), GREY_SIT_Z + 0.25);
      greyDrop.rotation.set(tau * 6, tau * 3, 0);
    } else greyDrop.visible = false;

    // ---------------- light follows the action ----------------
    const end = t > CUE.endShot;
    const focus = new THREE.Vector3(end ? RX : GX, end ? 0 : gy, end ? rz : gz);
    sun.target.position.copy(focus); sun.position.copy(focus).add(new THREE.Vector3(7, 13 + rise * 4, -30));
    rim.target.position.copy(focus); rim.position.copy(focus).add(new THREE.Vector3(-8, 6, -12));

    // ---------------- speed streaks ----------------
    const sOn = win(t, CUE.drop + 0.1, 23.6, 0.3, 0.3) * (t > CUE.jump && t < CUE.land + 0.2 ? 0.4 : 1);
    streaks.visible = sOn > 0.01;
    streaks.material.opacity = 0.3 * sOn;
    const m4 = new THREE.Matrix4();
    streakData.forEach((d, i) => {
      const zz = ((d.ph + t * 3.0) % 1) * 14 - 6;
      m4.makeTranslation(GX + d.x, gy + d.y, gz + zz);
      streaks.setMatrixAt(i, m4);
    });
    streaks.instanceMatrix.needsUpdate = true;

    // ---------------- particles ----------------
    const ev = [];
    for (let ts = CUE.drop + 0.05; ts < 23.6; ts += 0.217) {
      if (ts > CUE.jump - 0.05 && ts < CUE.land) continue;
      const z = goldZ(ts);
      ev.push({ t: ts, type: 'dust', pos: [GX, groundY(z) + 0.05, z + 0.3], seed: Math.floor(ts * 100) });
    }
    ev.push({ t: CUE.drop, type: 'dust', pos: [GX, 0.05, STOPZ], seed: 7 });
    ev.push({ t: CUE.land, type: 'dust', pos: [GX, groundY(-28), -28], seed: 8 });
    ev.push({ t: CUE.land, type: 'impact', pos: [GX, groundY(-28) + 0.2, -28], seed: 9 });
    ev.push({ t: CUE.summit, type: 'confetti', pos: [GX, groundY(TOP) + 1.6, -52.4], seed: 10 });
    ev.push({ t: CUE.summit + 0.1, type: 'sparkle', pos: [GX, groundY(TOP) + 2.4, -52.4], seed: 11 });
    ev.push({ t: CUE.greyDrop + 0.45, type: 'dust', pos: [RX - 1.1, 0.05, GREY_SIT_Z + 0.25], seed: 12 });
    ev.push({ t: CUE.greyStand + 0.4, type: 'sparkle', pos: [RX, 1.7, GREY_SIT_Z], seed: 13 });
    particles.update(ev, t);

    // ---------------- camera ----------------
    let pos, lk, fov = 42;
    if (t < 4.0) {
      pos = v3(kf(t, [[0, [5.6, 3.6, 13.0]], [4.0, [4.8, 3.0, 11.6]]]));
      lk = new THREE.Vector3(0, 1.4, kf(t, [[0, 6.6], [4, 6.0]]));
      fov = 40;
    } else if (t < CUE.stop) {
      pos = v3(kf(t, [[4.0, [0.0, 2.0, -0.9]], [CUE.stop, [0.0, 1.95, -0.2]]]));
      lk = new THREE.Vector3(0, 1.25, 6.2);
      fov = 44;
    } else if (t < CUE.crouch) {
      pos = v3(kf(t, [[CUE.stop, [4.9, 2.4, 1.2]], [CUE.crouch, [4.3, 2.2, 1.9]]]));
      lk = v3(kf(t, [[CUE.stop, [0.3, 1.35, 5.2]], [CUE.crouch, [0.6, 1.3, 5.0]]]));
      fov = 44;
    } else if (t < CUE.drop) {
      pos = v3(kf(t, [[CUE.crouch, [3.1, 1.1, 1.3]], [CUE.drop, [2.6, 0.95, 1.9]]]));
      lk = new THREE.Vector3(GX, 0.85, STOPZ);
      fov = 40;
    } else if (t < 18.0) {
      pos = new THREE.Vector3(GX + 1.7, gy + 1.4, gz - 6.0);
      lk = new THREE.Vector3(GX, gy + 1.1, gz);
      pos.add(shake(t, CUE.drop, 0.12, 0.5));
      fov = 50;
    } else if (t < CUE.jump) {
      pos = new THREE.Vector3(GX + 6.6, gy + 2.0, gz + 0.6);
      lk = new THREE.Vector3(GX, gy + 1.1, gz - 0.5);
      fov = 46;
    } else if (t < CUE.land + 0.25) {
      pos = new THREE.Vector3(3.8, groundY(-26) - 2.6, -25.6);
      lk = new THREE.Vector3(GX, gy + 0.8, gz);
      fov = 62;
    } else if (t < CUE.summit) {
      pos = new THREE.Vector3(GX + 0.9, gy + 2.4, gz + 5.6);
      lk = new THREE.Vector3(GX, gy + 1.5, gz - 6);
      pos.add(shake(t, CUE.land, 0.1, 0.4));
      fov = 52;
    } else if (t < CUE.endShot) {
      const a = kf(t, [[CUE.summit, 40], [CUE.endShot, -15]]) * DEG;
      const c = new THREE.Vector3(GX, groundY(TOP) + 1.3, -52.4);
      pos = c.clone().add(new THREE.Vector3(sin(a) * 6.6, 0.7, -cos(a) * 6.6));
      lk = c.clone().add(new THREE.Vector3(0, 0.2, 0));
      fov = 46;
    } else {
      // from behind grey, looking up the mountain at gold on the summit
      const k = smoothstep(clamp((t - CUE.endShot) / (CUE.end - CUE.endShot), 0, 1));
      pos = new THREE.Vector3(RX + 0.3, lerp(2.3, 2.6, k), rz + lerp(4.8, 4.2, k));
      lk = new THREE.Vector3(0.2, lerp(3.0, 3.6, k), -45);
      fov = 46;
    }
    aimCam(pos, lk, fov);

    labels.length = 0;
    labels.push({ char: gold, text: 'DISCIPLINE', style: LABEL_STYLE.gold, op: win(t, CUE.look, CUE.endShot, 0.4, 0.3) * (t > CUE.jump && t < CUE.land + 0.25 ? 0 : 1) });
    labels.push({ char: grey, text: 'EXCUSES', style: LABEL_STYLE.grey, op: win(t, CUE.look, CUE.greyDrop + 0.2, 0.4, 0.3) * (t >= CUE.drop && t < CUE.endShot ? 0 : 1) });
  }

  const tmp = new THREE.Vector3();
  const aspect = player.width / player.height;
  const project = (p) => { tmp.copy(p).project(camera); return tmp.z > 1 ? null : { x: tmp.x * aspect, y: tmp.y }; };
  return {
    warmTimes: [2, 17, 25, 29],
    update(t) { update(t); return {}; },
    overlay(t) {
      update(t);
      camera.updateMatrixWorld();
      const hud = [];
      for (const l of labels) {
        if (l.op <= 0.002) continue;
        const s = project(headPos(l.char).add(new THREE.Vector3(0, 0.75, 0)));
        if (!s) continue;
        const halfW = 0.0175 * l.text.length + 0.05;
        hud.push({ text: l.text, style: l.style, x: clamp(s.x, -aspect + halfW, aspect - halfW), y: clamp(s.y, -0.92, 0.92), height: 0.0175, opacity: l.op, scale: 0.85 + 0.15 * easeOutBack(clamp(l.op, 0, 1)) });
      }
      for (const w of tags) {
        if (w.op <= 0.01) continue;
        const s = project(w.pos);
        if (!s) continue;
        const pop = w.pop !== undefined ? easeOutBack(clamp(w.pop / 0.3, 0, 1)) : 1;
        const halfW = 0.021 * w.text.length + 0.06;
        hud.push({ text: w.text, style: TAG, x: clamp(s.x + halfW * 0.6, -aspect + halfW, aspect - halfW), y: s.y, height: 0.021, opacity: w.op, scale: 0.6 + 0.4 * pop });
      }
      const t1 = t - CUE.title, t2 = t - CUE.title2;
      if (t1 > 0) hud.push({ text: 'DROP THE EXCUSES.', style: { size: 96, weight: 900, spacing: 0.12, color: '#ffffff', shadow: 0.75 }, x: 0, y: 0.55, height: 0.042, opacity: clamp(t1 / 0.25, 0, 1), scale: 0.8 + 0.2 * easeOutBack(clamp(t1 / 0.45, 0, 1)) });
      if (t2 > 0) hud.push({ text: 'START TODAY.', style: { size: 80, weight: 800, spacing: 0.3, color: '#ffc04d', shadow: 0.75 }, x: 0, y: 0.44, height: 0.032, opacity: clamp(t2 / 0.2, 0, 1), scale: 0.7 + 0.3 * easeOutBack(clamp(t2 / 0.4, 0, 1)) });
      return {
        hud,
        overlays: [
          { type: 'fade', amount: max(1 - t / 0.5, clamp((t - (CUE.end - 0.6)) / 0.55, 0, 1)) },
          { type: 'flash', amount: 0.85 * (t >= CUE.drop ? clamp(1 - (t - CUE.drop) / 0.3, 0, 1) : 0) },
          { type: 'flash', amount: 0.55 * (t >= CUE.summit ? clamp(1 - (t - CUE.summit) / 0.4, 0, 1) : 0) },
        ],
      };
    },
  };
}
