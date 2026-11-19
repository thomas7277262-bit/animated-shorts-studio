// "Drop The Excuses" – a 33-second motivational short.
//
// Two versions of the same person trudge up a mountain path before dawn,
// bent under backpacks full of rocks: TOMORROW, TOO TIRED, NOT READY,
// NO TIME, WHAT IF. The gold one (DISCIPLINE) throws them off one by one as
// the music builds; the grey one (EXCUSES) sits down under the weight.
// In the silent beat gold drops into a sprint start, and on the drop he
// sprints uphill, leaps a gap and reaches the summit as the sun rises.
// Finally grey looks up, and drops his first rock too.
//
// Timed to the royalty-free score in drop-the-excuses.score.js
// (120 BPM: 1 bar = 2 s, silence 15–16 s, drop at 16 s, outro at 28 s).
import * as THREE from 'three';
import { Character } from '../engine/character.js';
import { blendPose } from '../engine/poses.js';
import { ParticleSystem } from '../engine/effects.js';
import { sky, mat, mesh, box, rock, mountains, flag } from '../engine/environments/common.js';
import { Rng, clamp, lerp, easeInOut, easeOutBack, smoothstep } from '../engine/rng.js';
import { EASE, kf, win, P, seq, addPose, breathe, walk, cheer, sitSulk, lookUp, LABEL_STYLE } from './kit.js';
import { SCORE, SCORE_DURATION } from './drop-the-excuses.score.js';

const DEG = Math.PI / 180;
const { sin, cos, PI, abs, max, min, exp } = Math;

export const CUE = {
  stop: 8.0, tosses: [9.0, 10.5, 11.5, 12.5, 13.5], greySit: 12.4, crouch: 15.0, drop: 16.0,
  jump: 20.0, land: 20.65, summit: 24.0, greyLook: 26.0, greyDrop: 27.0, title: 28.0, title2: 30.0,
  end: SCORE_DURATION,
};
export const DURATION = CUE.end;
export { SCORE };

const WORDS = ['WHAT IF', 'NO TIME', 'NOT READY', 'TOO TIRED', 'TOMORROW']; // bottom → top
const WORD_POP = [7.0, 5.5, 4.0, 2.5, 1.0];
const WORD_STYLE = { size: 40, weight: 800, spacing: 0.22, color: '#ffd9cf', shadow: 0.85 };

// ---------------- world layout ----------------
const SLOPE = 0.18, GAP0 = -24.5, GAP1 = -27.3, TOP = -50;
const groundY = (z) => (z >= 0 ? 0 : z > TOP ? -z * SLOPE : -TOP * SLOPE);
const onPath = (z) => !(z < GAP0 && z > GAP1);
const GX = 0.75, RX = -0.75; // lanes (gold, grey)

// ---------------- poses ----------------
function heavyWalk(t, load) {
  const p = walk(t, 0.42 + 0.25 * (1 - load), 0.55);
  return addPose(p, { lean: 10 + 22 * load, headNod: 8 + 16 * load, hipDrop: -0.06 * load, legL: { knee: 10 * load }, legR: { knee: 10 * load }, armL: { raise: 10 }, armR: { raise: 10 } });
}
function standLoad(t, load) {
  return P({ ...breathe(t, 1.6), lean: 8 + 20 * load, headNod: 6 + 14 * load, hipDrop: -0.05 * load, legL: { knee: 8 * load + 4 }, legR: { knee: 8 * load + 4 } });
}
function sprint(t) {
  const f = t * 2 * PI * 2.3, s = sin(f), c = cos(f);
  return P({
    lean: 20, bodyY: abs(c) * 0.09, twist: s * 10, headNod: -4, scarf: s * 0.4,
    armL: { raise: 12, fwd: -s * 78, elbow: 95 }, armR: { raise: 12, fwd: s * 78, elbow: 95 },
    legL: { fwd: s * 58 + 8, knee: 15 + 100 * max(0, c) }, legR: { fwd: -s * 58 + 8, knee: 15 + 100 * max(0, -c) },
  });
}
const jumpPose = (u) => P({
  lean: 14 - 10 * u, headNod: -12, roll: 0,
  armL: { raise: 30, fwd: 110 - 60 * u, elbow: 30 }, armR: { raise: 30, fwd: -40 + 30 * u, elbow: 40 },
  legL: { fwd: 75 - 40 * u, knee: 100 - 60 * u }, legR: { fwd: -35 + 20 * u, knee: 70 },
});
const crouchStart = (t) => P({
  hipDrop: -0.62, lean: 52, headNod: -38 + sin(t * 3) * 2, bodyY: sin(t * 7) * 0.006,
  armL: { raise: 8, fwd: 62, elbow: 0 }, armR: { raise: 8, fwd: 62, elbow: 0 },
  legL: { fwd: 78, knee: 118, out: 4 }, legR: { fwd: -18, knee: 112, out: 4 },
});

// ---------------- props ----------------
function backpack(rng) {
  const g = new THREE.Group();
  g.position.set(0, -0.32, -0.36);
  const sack = box(0.5, 0.55, 0.3, '#6b4a33', { y: -0.25 });
  g.add(sack);
  for (const sx of [-1, 1]) g.add(box(0.05, 0.6, 0.36, '#3b2a1d', { x: sx * 0.2, y: -0.15, z: 0.12 }));
  const rocks = [];
  const R = [[0.24, 0.0, 0.12], [0.21, 0.04, 0.46], [0.18, -0.04, 0.74], [0.15, 0.03, 0.97], [0.13, 0, 1.16]];
  const rmat = mat('#8a8f99');
  R.forEach(([r, x, y], i) => {
    const m = mesh(new THREE.DodecahedronGeometry(r, 0), i % 2 ? mat('#7b808a') : rmat, { x, y: y - 0.15, z: -0.12, rx: rng.float(0, 3), ry: rng.float(0, 3) });
    g.add(m);
    rocks.push(m);
  });
  return { group: g, rocks, sizes: R.map((r) => r[0]) };
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
  scene.add(hemi, sun, sun.target);

  // ---- world ----
  const world = new THREE.Group(); scene.add(world);
  const skyM = sky('#1b2147', '#d9776a', '#2a2140', new THREE.Vector3(0, -0.05, -1));
  world.add(skyM);
  const pathMat = mat('#a8907a');
  const edgeMat = mat('#6d5a4c');
  const W = 3.4;
  const ramp = (z0, z1) => {
    const len = Math.hypot(z0 - z1, (groundY(z1) - groundY(z0)));
    const ang = Math.atan2(groundY(z1) - groundY(z0), z0 - z1);
    const zc = (z0 + z1) / 2, yc = (groundY(z0) + groundY(z1)) / 2;
    const m = mesh(new THREE.BoxGeometry(W, 0.8, len), pathMat, { x: 0, y: yc - 0.4 * cos(ang), z: zc - 0.4 * sin(ang) * 0, rx: ang, cast: false });
    world.add(m);
  };
  world.add(mesh(new THREE.BoxGeometry(W, 0.8, 14), pathMat, { y: -0.4, z: 7, cast: false }));
  ramp(0, GAP0); ramp(GAP1, TOP);
  world.add(mesh(new THREE.BoxGeometry(W + 3, 0.8, 9), pathMat, { y: -TOP * SLOPE - 0.4, z: TOP - 4.5, cast: false }));
  // cliffs below the path
  for (let z = 12; z > TOP - 10; z -= 3.2) {
    if (z < GAP0 + 1 && z > GAP1 - 1) continue;
    const top = groundY(z) - 0.6;
    for (const sx of [-1, 1]) {
      const w = rng.float(1.6, 3.2);
      world.add(box(w, top + 30, rng.float(2.6, 3.6), rng.pick(['#5a4a40', '#4d3f37', '#64524a']), { x: sx * (W / 2 + w / 2 - 0.6 + rng.float(0, 0.5)), y: -30, z, base: true, ry: rng.float(-0.2, 0.2), cast: false }));
    }
    world.add(box(W - 0.4, top + 30, 3.2, '#4a3c34', { y: -30, z, base: true, cast: false }));
  }
  // stones along the path edges
  for (let z = 10; z > TOP - 6; z -= 1.4) {
    if (!onPath(z) || (z < GAP0 + 1.2 && z > GAP1 - 1.2)) continue;
    for (const sx of [-1, 1]) if (rng.chance(0.55)) {
      const r = rock(rng, { x: sx * (W / 2 - 0.1 + rng.float(-0.1, 0.3)), z, s: rng.float(0.3, 0.7), color: rng.pick(['#7b7069', '#8a7d72', '#6a5f58']) });
      r.position.y += groundY(z);
      world.add(r);
    }
  }
  const mts = mountains(rng, { count: 13, radius: 120, color: '#3c3f63', snow: true });
  world.add(mts);
  const fl = flag('#ffb000', { x: -1.5, y: -TOP * SLOPE, z: TOP - 5.2, pole: 2.4 });
  world.add(fl);
  // low clouds in the valley
  const cloudMat = new THREE.MeshStandardMaterial({ color: '#c8b3c9', roughness: 1, flatShading: true, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 26; i++) {
    const x = rng.float(-60, 60), z = rng.float(-80, 20);
    if (abs(x) < 6) continue;
    world.add(mesh(new THREE.IcosahedronGeometry(rng.float(2, 5), 0), cloudMat, { x, y: rng.float(-9, -5), z, s: [1.8, 0.5, 1.2], cast: false, receive: false }));
  }

  // ---- cast ----
  const gold = new Character({ id: 'gold', accent: '#ffb000', height: 1.0, eyeStyle: 'round', brows: 'normal', cheeks: true, accessory: 'none' });
  const grey = new Character({ id: 'grey', accent: '#8d9ab0', height: 1.0, eyeStyle: 'round', brows: 'normal', cheeks: false, accessory: 'none', skin: '#eef0f4' });
  scene.add(gold.root, grey.root);
  const gPack = backpack(rng), rPack = backpack(rng);
  gold.chest.add(gPack.group); grey.chest.add(rPack.group);
  // world-space copies for rocks in flight
  const flying = gPack.rocks.map((r) => { const m = r.clone(); m.visible = false; world.add(m); return m; });
  const greyDropRock = rPack.rocks[4].clone(); greyDropRock.visible = false; world.add(greyDropRock);

  const particles = new ParticleSystem(scene);
  const streakN = 36;
  const streaks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.012, 2.2), new THREE.MeshBasicMaterial({ color: '#fff4dc', transparent: true, opacity: 0.4, toneMapped: false }), streakN);
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

  // gold's travel along the path
  function goldZ(t) {
    if (t < CUE.stop) return kf(t, [[0, 6.2], [CUE.stop, 3.6, 'lin']]);
    if (t < CUE.drop) return 3.6;
    if (t < CUE.jump) return lerp(3.6, -24.2, EASE.in(clamp((t - CUE.drop) / 0.5, 0, 1)) * 0.06 + clamp((t - CUE.drop - 0.25) / (CUE.jump - CUE.drop - 0.25), 0, 1) * 0.94);
    if (t < CUE.land) return lerp(-24.2, -28.0, (t - CUE.jump) / (CUE.land - CUE.jump));
    return kf(t, [[CUE.land, -28.0], [23.55, -50.2, 'lin'], [CUE.summit, -52.4, 'out']]);
  }
  function goldY(t, z) {
    if (t >= CUE.jump && t < CUE.land) {
      const u = (t - CUE.jump) / (CUE.land - CUE.jump);
      return lerp(groundY(-24.2), groundY(-28.0), u) + sin(u * PI) * 1.5;
    }
    return groundY(z);
  }
  const loadAt = (t) => {
    let n = 5;
    for (const tk of CUE.tosses) if (t >= tk + 0.05) n--;
    return n / 5;
  };

  const labels = [];
  const words = []; // { pos, text, op }

  function update(t) {
    // ---------------- sky & light: pre-dawn → sunrise ----------------
    const rise = smoothstep(clamp((t - CUE.drop) / (CUE.summit - CUE.drop + 0.5), 0, 1));
    const burst = smoothstep(clamp((t - (CUE.summit - 0.3)) / 1.2, 0, 1));
    const U = skyM.material.uniforms;
    U.top.value.set('#161b40').lerp(new THREE.Color('#3f63c4'), rise);
    U.horizon.value.set('#b35f66').lerp(new THREE.Color('#ffb15e'), rise).lerp(new THREE.Color('#ffd28a'), burst * 0.6);
    U.bottom.value.set('#251c3a').lerp(new THREE.Color('#6b4f6e'), rise);
    const sunY = lerp(-0.06, 0.13, rise);
    U.sunDir.value.set(0.08, sunY, -1).normalize();
    hemi.color.set('#56609c').lerp(new THREE.Color('#ffd7b0'), rise); hemi.groundColor.set('#2b2235').lerp(new THREE.Color('#6a4b44'), rise);
    hemi.intensity = lerp(1.05, 1.1, rise);
    sun.color.set('#ff8a6a').lerp(new THREE.Color('#ffc27a'), rise);
    sun.intensity = lerp(1.6, 2.1, rise) + burst * 0.2;
    scene.fog = new THREE.Fog(new THREE.Color('#4a3f66').lerp(new THREE.Color('#f0a878'), rise), 30, 150);
    player.bloom.strength = lerp(0.35, 0.55, rise); player.bloom.threshold = lerp(0.88, 0.84, rise);

    // ---------------- GOLD ----------------
    const gz = goldZ(t), gy = goldY(t, gz);
    const load = loadAt(t);
    let gpose;
    if (t < CUE.stop) gpose = heavyWalk(t, 1);
    else if (t < CUE.crouch) {
      // stand, then throw each rock over the right shoulder
      gpose = standLoad(t, load);
      for (const tk of CUE.tosses) {
        const u = (t - (tk - 0.35)) / 0.6;
        if (u < 0 || u > 1) continue;
        const reach = smoothstep(clamp(u / 0.55, 0, 1)), thr = smoothstep(clamp((u - 0.55) / 0.3, 0, 1));
        const k = Math.sin(clamp(u, 0, 1) * PI);
        gpose = addPose(gpose, { twist: (-18 * reach + 30 * thr) * (1 - thr * 0.6), headTurn: -35 * reach * (1 - thr) });
        gpose.armR = { raise: lerp(lerp(10, 165, reach), 110, thr), fwd: lerp(lerp(0, -50, reach), 70, thr), elbow: lerp(lerp(10, 80, reach), 15, thr), elbowOut: 0 };
        gpose.lean = lerp(gpose.lean, gpose.lean - 6, k);
      }
      if (t > CUE.tosses[0] - 1.0 && t < CUE.tosses[0] - 0.35) gpose = addPose(gpose, { headTurn: -40 * win(t, CUE.tosses[0] - 1.0, CUE.tosses[0] - 0.35, 0.2, 0.2), headNod: 10 });
      if (t > 13.9) gpose = blendPose(gpose, P({ ...breathe(t, 1.2), lean: -2, headNod: -6, armL: { raise: 28 }, armR: { raise: 28 }, sway: sin(t * 6) * 3 }), smoothstep(clamp((t - 13.9) / 0.3, 0, 1)));
    } else if (t < CUE.drop) gpose = blendPose(P({ lean: -2, headNod: -6 }), crouchStart(t - CUE.crouch), smoothstep(clamp((t - CUE.crouch) / 0.35, 0, 1)));
    else if (t < CUE.jump) gpose = blendPose(crouchStart(1), sprint(t - CUE.drop), smoothstep(clamp((t - CUE.drop) / 0.18, 0, 1)));
    else if (t < CUE.land) gpose = jumpPose((t - CUE.jump) / (CUE.land - CUE.jump));
    else if (t < 23.55) gpose = blendPose(jumpPose(1), sprint(t - CUE.land + 0.1), smoothstep(clamp((t - CUE.land) / 0.15, 0, 1)));
    else gpose = seq(t, [[23.55, (lt) => sprint(lt * (1 - lt))], [CUE.summit - 0.05, cheer], [26.5, (lt) => P({ ...breathe(lt), headNod: -8, armL: { raise: 160, elbow: 15 }, armR: { raise: 40, elbow: 30 } })]], 0.2);
    if (t >= CUE.land && t < CUE.land + 0.18) gpose = addPose(gpose, { hipDrop: -0.25 * sin(((t - CUE.land) / 0.18) * PI) });
    place(gold, GX, gy, gz, t >= CUE.summit + 0.6 ? kf(t, [[CUE.summit + 0.6, PI], [CUE.summit + 1.2, PI - 0.6]]) : PI);
    gold.applyPose(gpose, t);
    face(gold, t, t < CUE.stop ? 'sad' : t < CUE.crouch ? (load > 0.5 ? 'neutral' : 'determined') : t < CUE.summit ? 'determined' : 'happy', 0.3);
    gPack.rocks.forEach((r, i) => { r.visible = t < CUE.tosses[4 - i] + 0.05; });
    gPack.group.visible = t < CUE.drop + 0.2; // the empty sack is dropped in the crouch
    gPack.group.children[0].visible = t < CUE.crouch;
    gPack.group.children[1].visible = gPack.group.children[2].visible = t < CUE.crouch;

    // rocks in flight (thrown over the right shoulder, off the cliff edge)
    words.length = 0;
    flying.forEach((m, i) => {
      const tk = CUE.tosses[4 - i];
      const tau = t - (tk + 0.05);
      if (tau < 0 || tau > 2.4) { m.visible = false; return; }
      m.visible = true;
      const p0 = new THREE.Vector3(GX + 0.45, 2.35 + 0.1 * i, 3.6);
      m.position.set(p0.x + 3.4 * tau, p0.y + 3.2 * tau - 4.9 * tau * tau, p0.z + 0.9 * tau);
      m.rotation.set(tau * 7 + i, tau * 5, tau * 3);
      if (tau < 0.9) words.push({ pos: m.position.clone().add(new THREE.Vector3(0, 0.45, 0)), text: WORDS[i], op: clamp(1 - tau / 0.9, 0, 1) });
    });
    // words on the pack during the intro
    gold.root.updateMatrixWorld(true);
    gPack.rocks.forEach((r, i) => {
      if (!r.visible || t < WORD_POP[i]) return;
      const p = r.getWorldPosition(new THREE.Vector3());
      const side = i % 2 ? -1 : 1;
      words.push({ pos: p.add(new THREE.Vector3(side * 0.75, 0.05, 0)), text: WORDS[i], op: clamp((t - WORD_POP[i]) / 0.25, 0, 1) * (t < CUE.stop + 0.6 ? 1 : 0.0), pop: t - WORD_POP[i] });
    });

    // ---------------- GREY ----------------
    const rz = kf(t, [[0, 6.0], [CUE.greySit, 2.95, 'lin']]);
    const rpose = seq(t, [
      [0, (lt) => heavyWalk(lt + 0.4, 1)],
      [CUE.greySit, (lt) => addPose(sitSulk(lt), { lean: 12 })],
      [CUE.greyLook, (lt) => addPose(sitSulk(lt), { headNod: -46, lean: -10 })],
      [CUE.greyDrop - 0.35, (lt) => {
        const u = clamp(lt / 0.7, 0, 1), k = sin(u * PI);
        const p = addPose(sitSulk(lt), { headNod: -30, lean: -6 });
        p.armR = { raise: lerp(20, 150, k), fwd: lerp(70, -30, k), elbow: lerp(110, 60, k), elbowOut: 0 };
        return p;
      }],
      [CUE.greyDrop + 0.5, (lt) => P({ ...breathe(lt), bodyY: -0.82 + smoothstep(clamp((lt - 0.6) / 0.6, 0, 1)) * 0.82, headNod: -24, lean: 14 - smoothstep(clamp((lt - 0.6) / 0.6, 0, 1)) * 10, legL: { fwd: 95 * (1 - smoothstep(clamp((lt - 0.6) / 0.6, 0, 1))), knee: 120 * (1 - smoothstep(clamp((lt - 0.6) / 0.6, 0, 1))), out: 8 }, legR: { fwd: 95 * (1 - smoothstep(clamp((lt - 0.6) / 0.6, 0, 1))), knee: 120 * (1 - smoothstep(clamp((lt - 0.6) / 0.6, 0, 1))), out: 8 }, armL: { raise: 15, fwd: 10 }, armR: { raise: 15, fwd: 10 } })],
    ], 0.3);
    place(grey, RX, 0, rz, PI);
    grey.applyPose(rpose, t);
    face(grey, t, t < CUE.greySit ? 'sad' : t < CUE.greyLook ? 'sad' : t < CUE.greyDrop + 0.4 ? 'surprised' : 'determined', 1.4);
    rPack.rocks[4].visible = t < CUE.greyDrop + 0.05;
    if (t >= CUE.greyDrop + 0.05) {
      const tau = t - (CUE.greyDrop + 0.05);
      greyDropRock.visible = tau < 2.0;
      greyDropRock.position.set(RX - 0.5 - 1.6 * tau, max(0.17, 2.3 + 1.2 * tau - 4.9 * tau * tau), rz + 0.2);
      greyDropRock.rotation.set(tau * 6, tau * 3, 0);
    } else greyDropRock.visible = false;

    // ---------------- light follows the action ----------------
    const focus = new THREE.Vector3(GX, gy, gz);
    sun.target.position.copy(focus);
    sun.position.copy(focus).add(new THREE.Vector3(6, 14 + rise * 4, -30));

    // ---------------- speed streaks during the sprint ----------------
    const sOn = win(t, CUE.drop + 0.1, 23.6, 0.3, 0.3) * (t > CUE.jump && t < CUE.land + 0.2 ? 0.4 : 1);
    streaks.visible = sOn > 0.01;
    streaks.material.opacity = 0.32 * sOn;
    const m4 = new THREE.Matrix4();
    streakData.forEach((d, i) => {
      const zz = ((d.ph + t * 3.2) % 1) * 14 - 6;
      m4.makeTranslation(GX + d.x, gy + d.y, gz + zz);
      streaks.setMatrixAt(i, m4);
    });
    streaks.instanceMatrix.needsUpdate = true;

    // ---------------- particles ----------------
    const ev = [];
    CUE.tosses.forEach((tk, i) => ev.push({ t: tk + 0.95, type: 'dust', pos: [GX + 3.6, groundY(3.6) - 1.6, 4.4], seed: 30 + i }));
    for (let ts = CUE.drop + 0.05; ts < 23.6; ts += 0.217) {
      if (ts > CUE.jump - 0.05 && ts < CUE.land) continue;
      const z = goldZ(ts);
      ev.push({ t: ts, type: 'dust', pos: [GX, groundY(z) + 0.05, z + 0.3], seed: Math.floor(ts * 100) });
    }
    ev.push({ t: CUE.drop, type: 'dust', pos: [GX, 0.05, 3.6], seed: 7 });
    ev.push({ t: CUE.land, type: 'dust', pos: [GX, groundY(-28), -28], seed: 8 });
    ev.push({ t: CUE.land, type: 'impact', pos: [GX, groundY(-28) + 0.2, -28], seed: 9 });
    ev.push({ t: CUE.summit, type: 'confetti', pos: [GX, groundY(TOP) + 1.6, -52.4], seed: 10 });
    ev.push({ t: CUE.summit + 0.1, type: 'sparkle', pos: [GX, groundY(TOP) + 2.4, -52.4], seed: 11 });
    ev.push({ t: CUE.greyDrop + 0.5, type: 'dust', pos: [RX - 1.3, 0.05, rz + 0.2], seed: 12 });
    ev.push({ t: CUE.greyDrop + 0.55, type: 'sparkle', pos: [RX, 1.6, rz], seed: 13 });
    particles.update(ev, t);

    // ---------------- camera ----------------
    let pos, lk, fov = 45;
    if (t < 4.0) {
      pos = v3(kf(t, [[0, [6.8, 2.6, 6.8]], [4.0, [6.0, 2.3, 5.2]]]));
      lk = new THREE.Vector3(0, 1.5, kf(t, [[0, 5.6], [4, 4.8]]));
      fov = 42;
    } else if (t < CUE.stop) {
      pos = v3(kf(t, [[4.0, [0.2, 2.1, -2.8]], [CUE.stop, [0.2, 2.0, -1.9]]]));
      lk = new THREE.Vector3(0, 1.5, 4.2);
      fov = 44;
    } else if (t < CUE.greySit) {
      pos = v3(kf(t, [[CUE.stop, [4.8, 2.5, -0.9]], [CUE.greySit, [4.4, 2.4, -0.4]]]));
      lk = new THREE.Vector3(0.9, 1.6, 3.7);
      fov = 46;
    } else if (t < 13.2) {
      pos = v3(kf(t, [[CUE.greySit, [-3.6, 1.9, -0.9]], [13.2, [-3.3, 1.8, -0.5]]]));
      lk = new THREE.Vector3(-0.6, 1.0, 3.0);
      fov = 42;
    } else if (t < CUE.crouch) {
      pos = v3(kf(t, [[13.2, [4.0, 2.3, -0.4]], [CUE.crouch, [3.5, 2.1, 0.1]]]));
      lk = new THREE.Vector3(0.8, 1.55, 3.6);
      fov = 46;
    } else if (t < CUE.drop) {
      pos = v3(kf(t, [[CUE.crouch, [2.3, 0.75, -0.4]], [CUE.drop, [1.8, 0.65, 0.5]]]));
      lk = new THREE.Vector3(GX, 0.75, 3.6);
      fov = 44;
    } else if (t < 18.0) {
      // ahead of the runner, low, racing backwards
      pos = new THREE.Vector3(GX + 1.4, gy + 0.95, gz - 4.6 + 1.0 * EASE.out(clamp((t - CUE.drop) / 0.5, 0, 1)) * 0);
      lk = new THREE.Vector3(GX, gy + 1.25, gz);
      pos.add(shake(t, CUE.drop, 0.12, 0.5));
      fov = 58;
    } else if (t < CUE.jump) {
      pos = new THREE.Vector3(GX + 5.8, gy + 1.9, gz + 0.4);
      lk = new THREE.Vector3(GX, gy + 1.15, gz - 1.6);
      fov = 50;
    } else if (t < CUE.land + 0.25) {
      // under the gap, looking up as he flies over
      pos = new THREE.Vector3(3.8, groundY(-26) - 2.6, -25.6);
      lk = new THREE.Vector3(GX, gy + 0.8, gz);
      fov = 62;
    } else if (t < CUE.summit) {
      pos = new THREE.Vector3(GX + 0.9, gy + 2.3, gz + 5.2);
      lk = new THREE.Vector3(GX, gy + 1.6, gz - 6);
      pos.add(shake(t, CUE.land, 0.1, 0.4));
      fov = 52;
    } else if (t < CUE.greyLook) {
      const a = kf(t, [[CUE.summit, 35], [CUE.greyLook, -15]]) * DEG;
      const c = new THREE.Vector3(GX, groundY(TOP) + 1.4, -52.4);
      pos = c.clone().add(new THREE.Vector3(sin(a) * 5.4, 0.1, -cos(a) * 5.4));
      lk = c.clone().add(new THREE.Vector3(0, 0.3, 0));
      fov = 48;
    } else if (t < CUE.title) {
      pos = v3(kf(t, [[CUE.greyLook, [0.9, 1.7, -1.4]], [CUE.title, [0.8, 1.75, -2.0]]]));
      lk = new THREE.Vector3(RX, 1.05, 2.95);
      fov = 44;
    } else {
      pos = v3(kf(t, [[CUE.title, [0.8, 1.75, -2.0]], [CUE.end, [1.5, 7.5, 9.5], 'io']]));
      lk = v3(kf(t, [[CUE.title, [RX, 1.05, 2.95]], [CUE.end, [0, 6.5, -45], 'io']]));
      fov = kf(t, [[CUE.title, 44], [CUE.end, 50]]);
    }
    aimCam(pos, lk, fov);

    labels.length = 0;
    labels.push({ char: gold, text: 'DISCIPLINE', style: LABEL_STYLE.gold, op: win(t, CUE.stop + 0.2, CUE.title, 0.4, 0.4) * (t > CUE.jump && t < CUE.land + 0.25 ? 0 : 1) * (t >= CUE.greyLook && t < CUE.title ? 0 : 1) });
    labels.push({ char: grey, text: 'EXCUSES', style: LABEL_STYLE.grey, op: win(t, CUE.stop + 0.2, CUE.greyDrop + 0.3, 0.4, 0.3) * (t >= CUE.drop && t < CUE.greyLook ? 0 : 1) });
  }

  const tmp = new THREE.Vector3();
  const aspect = player.width / player.height;
  const project = (p) => { tmp.copy(p).project(camera); return tmp.z > 1 ? null : { x: tmp.x * aspect, y: tmp.y }; };
  return {
    warmTimes: [2, 17, 25],
    update(t) { update(t); return {}; },
    overlay(t) {
      update(t);
      camera.updateMatrixWorld();
      const hud = [];
      for (const l of labels) {
        if (l.op <= 0.002) continue;
        const hp = headPos(l.char).add(new THREE.Vector3(0, 0.85, 0));
        const s = project(hp);
        if (!s) continue;
        const halfW = 0.0175 * l.text.length + 0.05;
        hud.push({ text: l.text, style: l.style, x: clamp(s.x, -aspect + halfW, aspect - halfW), y: clamp(s.y, -0.92, 0.92), height: 0.0175, opacity: l.op, scale: 0.85 + 0.15 * easeOutBack(clamp(l.op, 0, 1)) });
      }
      for (const w of words) {
        if (w.op <= 0.01) continue;
        const s = project(w.pos);
        if (!s) continue;
        const pop = w.pop !== undefined ? easeOutBack(clamp(w.pop / 0.3, 0, 1)) : 1;
        hud.push({ text: w.text, style: WORD_STYLE, x: clamp(s.x, -aspect + 0.2, aspect - 0.2), y: s.y, height: 0.016, opacity: w.op, scale: 0.6 + 0.4 * pop, rot: 0.04 });
      }
      const t1 = t - CUE.title, t2 = t - CUE.title2;
      if (t1 > 0) hud.push({ text: 'DROP THE EXCUSES.', style: { size: 96, weight: 900, spacing: 0.12, color: '#ffffff', shadow: 0.75 }, x: 0, y: 0.52, height: 0.042, opacity: clamp(t1 / 0.25, 0, 1), scale: 0.8 + 0.2 * easeOutBack(clamp(t1 / 0.45, 0, 1)) });
      if (t2 > 0) hud.push({ text: 'START TODAY.', style: { size: 80, weight: 800, spacing: 0.3, color: '#ffc04d', shadow: 0.75 }, x: 0, y: 0.41, height: 0.032, opacity: clamp(t2 / 0.2, 0, 1), scale: 0.7 + 0.3 * easeOutBack(clamp(t2 / 0.4, 0, 1)) });
      const overlays = [
        { type: 'fade', amount: max(1 - t / 0.5, clamp((t - (CUE.end - 0.6)) / 0.55, 0, 1)) },
        { type: 'flash', amount: 0.85 * (t >= CUE.drop ? clamp(1 - (t - CUE.drop) / 0.3, 0, 1) : 0) },
        { type: 'flash', amount: 0.6 * (t >= CUE.summit ? clamp(1 - (t - CUE.summit) / 0.4, 0, 1) : 0) },
        { type: 'fade', amount: 0.55 * win(t, CUE.crouch, CUE.drop, 0.15, 0.02) * 0 },
      ];
      return { hud, overlays };
    },
  };
}
