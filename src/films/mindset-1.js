// "Mindset." #1 – a 33-second compilation of four mini-stories in a minimal
// monochrome style: black void, flat white faceless figures, hanging
// spotlights, small typewriter headers, two labels with counters.
//
//   1. SCROLLER vs BUILDER      – phone glow vs a tower of bricks
//   2. QUITTER vs CONSISTENT    – digging for treasure, one stops inches away
//   3. SPENDER vs SAVER         – coins rain; bags crumble vs a jar overflows
//   4. WAITER vs STARTER        – waiting for "the perfect time" vs running laps
//
// Hard cuts on the bar lines of the 123 BPM track (bars every 1.951 s from
// 0.12 s): scene cuts at 7.92 / 15.73 / 23.54, hits at 5.71, 13.33, 20.92, 28.54, 31.07.
import * as THREE from 'three';
import { Character } from '../engine/character.js';
import { blendPose } from '../engine/poses.js';
import { ParticleSystem } from '../engine/effects.js';
import { mesh } from '../engine/environments/common.js';
import { Rng, clamp, lerp, easeOutBack, smoothstep } from '../engine/rng.js';
import { kf, win, P, seq, addPose, breathe, walk, cheer } from './kit.js';

const { sin, cos, PI, abs, max, min, floor } = Math;
const BEAT = 60 / 123, BAR = BEAT * 4, B0 = 0.12;
export const CUE = { s2: 7.92, s3: 15.73, s4: 23.54, hit1: 5.71, hit2: 13.33, hit3: 20.92, hit4: 28.54, hit5: 31.07, end: 33.6 };
export const DURATION = CUE.end;
const LX = -1.35, RX = 1.35;

// ---------- flat materials ----------
const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
const WHITE = '#f4f4f4', GREY = '#a9a9a9', GOLD = '#ffc23a';
function flatFigure(color) {
  const c = new Character({ id: 'f' + color, style: 'toon', body: color, accent: color, accessory: 'bald' });
  const m = basic(color);
  c.root.traverse((o) => {
    if (!o.isMesh || o.userData.noOutline) return;
    if (o.geometry.type === 'TorusGeometry' || o === c.scarfTail) { o.visible = false; return; }
    o.material = m; o.castShadow = false; o.receiveShadow = false;
  });
  return c;
}
function spotlight(x, y = 5.2, h = 5.4, r = 1.25) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.SphereGeometry(0.42, 20, 10, 0, PI * 2, 0, PI / 2), basic('#1c1c1c', { side: THREE.DoubleSide }), { y: y, cast: false }));
  g.add(mesh(new THREE.CircleGeometry(0.4, 20), basic('#fffbe8', { toneMapped: false }), { y: y - 0.01, rx: PI / 2, cast: false }));
  g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 3, 4), basic('#333'), { y: y + 1.5, cast: false }));
  const cone = mesh(new THREE.CylinderGeometry(0.38, r, h, 32, 1, true), basic('#fff6dc', { transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }), { y: y - h / 2, cast: false });
  g.add(cone);
  const pool = mesh(new THREE.CircleGeometry(r * 1.05, 40), basic('#fff3d0', { transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending }), { y: 0.005, rx: -PI / 2, cast: false });
  g.add(pool);
  g.position.x = x;
  g.userData = { cone, pool };
  return g;
}
function setSpot(s, k) { s.userData.cone.material.opacity = 0.045 * k; s.userData.pool.material.opacity = 0.1 * k; }
const floor0 = () => mesh(new THREE.PlaneGeometry(40, 30), basic('#121212'), { rx: -PI / 2, y: 0, z: -5, cast: false });

// ---------- poses ----------
const sitPhone = (t) => P({ bodyY: -0.6, lean: 26, headNod: 34, armL: { raise: 14, fwd: 62, elbow: 105 }, armR: { raise: 14, fwd: 62, elbow: 105 + sin(t * 9) * 6 }, legL: { fwd: 88, knee: 92, out: 6 }, legR: { fwd: 88, knee: 92, out: 6 } });
function brickCycle(u) { // 0..1: bend to pile, lift, place high
  const down = sin(clamp(u / 0.5, 0, 1) * PI), up = sin(clamp((u - 0.5) / 0.5, 0, 1) * PI);
  return P({ lean: 55 * down - 6 * up, hipDrop: -0.25 * down, headNod: 20 * down - 15 * up, armL: { raise: 15, fwd: 70 * down + 120 * up, elbow: 20 }, armR: { raise: 15, fwd: 70 * down + 120 * up, elbow: 20 }, legL: { knee: 40 * down }, legR: { knee: 40 * down } });
}
function digCycle(u, power = 1) {
  const a = sin(u * PI * 2);
  return P({ lean: 22 + 18 * a * power, hipDrop: -0.1 - 0.06 * a, headNod: 22, armL: { raise: 12, fwd: 55 + 35 * a, elbow: 40 }, armR: { raise: 12, fwd: 45 + 35 * a, elbow: 60 }, legL: { fwd: 18, knee: 25 + 10 * a }, legR: { fwd: -10, knee: 15 } });
}
function sprint(t) {
  const f = t * 2 * PI * 2.2, s = sin(f), c = cos(f);
  return P({ lean: 15, bodyY: abs(c) * 0.09, twist: s * 10, headNod: -4, armL: { raise: 14, fwd: -s * 78, elbow: 92 }, armR: { raise: 14, fwd: s * 78, elbow: 92 }, legL: { fwd: s * 58 + 10, knee: 14 + 100 * max(0, c) }, legR: { fwd: -s * 58 + 10, knee: 14 + 100 * max(0, -c) } });
}
const cheerUp = (t) => { const b = abs(sin(t * 6.2)); return P({ bodyY: b * 0.1, headNod: -12, armL: { raise: 138, fwd: 10, elbow: 8 }, armR: { raise: 138, fwd: 10, elbow: 8 }, legL: { knee: (1 - b) * 20 }, legR: { knee: (1 - b) * 20 } }); };
const checkWatch = (t) => P({ ...breathe(t), headNod: 30 * (0.5 + 0.5 * sin(t * 1.6)), armL: { raise: 20, fwd: 70, elbow: 100, elbowOut: -20 }, armR: { raise: 10 }, sway: sin(t * 1.2) * 2 });

// =====================================================================
export function createMindset1(player) {
  const scene = player.scene, camera = player.camera;
  player.renderer.shadowMap.enabled = false;
  scene.background = new THREE.Color('#040404');
  const rng = new Rng(9);
  const L = flatFigure(GREY), R = flatFigure(WHITE);
  scene.add(L.root, R.root);
  const particles = new ParticleSystem(scene);

  // ===== scene 1: scroller vs builder =====
  const g1 = new THREE.Group(); scene.add(g1);
  g1.add(floor0());
  const sp1 = [spotlight(LX), spotlight(RX)]; g1.add(...sp1);
  g1.add(mesh(new THREE.BoxGeometry(0.7, 0.5, 0.6), basic('#2a2a2a'), { x: LX, y: 0.25, z: -0.2 })); // box seat
  const phone = new THREE.Group();
  phone.add(mesh(new THREE.BoxGeometry(0.12, 0.2, 0.015), basic('#111')));
  const screen = mesh(new THREE.PlaneGeometry(0.1, 0.17), basic('#7fc8ff', { toneMapped: false }), { z: 0.009 });
  phone.add(screen);
  const glow = mesh(new THREE.CircleGeometry(0.32, 24), basic('#5ab4ff', { transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending }), { z: 0.02 });
  phone.add(glow);
  g1.add(phone);
  const BRICKS = 9;
  const brickMat = basic('#e9e9e9'), brickHot = basic(GOLD);
  const bricks = Array.from({ length: BRICKS }, (_, i) => { const b = mesh(new THREE.BoxGeometry(0.62, 0.26, 0.4), brickMat, { cast: false }); g1.add(b); return b; });
  const pile = [];
  for (let i = 0; i < 5; i++) { const b = mesh(new THREE.BoxGeometry(0.62, 0.26, 0.4), basic('#bdbdbd'), { x: RX + 0.95 + (i % 2) * 0.1, y: 0.13 + floor(i / 2) * 0.27, z: 0.2, cast: false }); g1.add(b); pile.push(b); }
  const carry = mesh(new THREE.BoxGeometry(0.62, 0.26, 0.4), brickMat, { cast: false }); g1.add(carry);
  const bulb = mesh(new THREE.SphereGeometry(0.16, 16, 12), basic('#333'), { x: RX - 0.55, y: 0, cast: false }); g1.add(bulb);

  // ===== scene 2: quitter vs consistent (cross-section) =====
  const g2 = new THREE.Group(); scene.add(g2);
  g2.add(mesh(new THREE.BoxGeometry(8, 5, 1), basic('#3b2d21'), { y: -2.5, z: -0.6, cast: false }));
  g2.add(mesh(new THREE.BoxGeometry(8, 0.06, 1.2), basic('#5a4a3a'), { y: -0.03, z: -0.5, cast: false }));
  for (let i = 0; i < 40; i++) g2.add(mesh(new THREE.DodecahedronGeometry(rng.float(0.04, 0.12), 0), basic(rng.pick(['#4a3a2b', '#55432f', '#30261c'])), { x: rng.float(-3.8, 3.8), y: rng.float(-4.8, -0.3), z: -0.05, cast: false }));
  const holes = [LX, RX].map((x) => { const h = mesh(new THREE.BoxGeometry(1.0, 1, 0.1), basic('#050505'), { x, z: -0.04, cast: false }); g2.add(h); return h; });
  const CHEST_Y = -3.3;
  const chests = [LX, RX].map((x) => {
    const c = new THREE.Group();
    c.add(mesh(new THREE.BoxGeometry(0.8, 0.45, 0.5), basic('#8a5a2b'), { cast: false }));
    c.add(mesh(new THREE.BoxGeometry(0.84, 0.06, 0.54), basic(GOLD), { y: 0.0, cast: false }));
    const lid = mesh(new THREE.BoxGeometry(0.82, 0.18, 0.52), basic('#9a6a33'), { y: 0.31, cast: false });
    c.add(lid); c.userData.lid = lid;
    c.position.set(x, CHEST_Y, 0.05); g2.add(c); return c;
  });
  const treasureGlow = mesh(new THREE.CircleGeometry(0.85, 32), basic(GOLD, { transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), { x: RX, y: CHEST_Y + 0.2, z: 0.1, cast: false });
  g2.add(treasureGlow);
  const shovels = [L, R].map((c) => {
    const s = new THREE.Group();
    s.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 6), basic('#7a6a5a'), { y: -0.35, cast: false }));
    s.add(mesh(new THREE.BoxGeometry(0.22, 0.28, 0.03), basic('#cfcfcf'), { y: -1.0, cast: false }));
    c.arms.R.hand.add(s); s.rotation.x = PI / 2.4; s.visible = false; return s;
  });
  const droppedShovel = new THREE.Group();
  droppedShovel.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 6), basic('#7a6a5a'), { rz: PI / 2, cast: false }));
  droppedShovel.add(mesh(new THREE.BoxGeometry(0.03, 0.28, 0.22), basic('#cfcfcf'), { x: 0.65, cast: false }));
  g2.add(droppedShovel);

  // ===== scene 3: spender vs saver =====
  const g3 = new THREE.Group(); scene.add(g3);
  g3.add(floor0());
  const sp3 = [spotlight(LX), spotlight(RX)]; g3.add(...sp3);
  const jar = new THREE.Group();
  jar.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.0, 28, 1, true), basic('#ffffff', { transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }), { y: 0.5, cast: false }));
  jar.add(mesh(new THREE.TorusGeometry(0.42, 0.025, 6, 28), basic('#ddd'), { y: 1.0, rx: PI / 2, cast: false }));
  const fill = mesh(new THREE.CylinderGeometry(0.4, 0.4, 1, 28), basic(GOLD, { toneMapped: false }), { cast: false });
  jar.add(fill);
  jar.position.set(RX + 0.75, 0, 0.3); g3.add(jar);
  const bags = Array.from({ length: 6 }, (_, i) => {
    const b = new THREE.Group();
    b.add(mesh(new THREE.BoxGeometry(0.34, 0.4, 0.2), basic(['#d9d9d9', '#bfbfbf', '#9e9e9e'][i % 3]), { y: 0.2, cast: false }));
    b.add(mesh(new THREE.TorusGeometry(0.08, 0.015, 4, 12, PI), basic('#777'), { y: 0.4, cast: false }));
    b.position.set(LX - 0.6 - (i % 3) * 0.32, floor(i / 3) * 0.41, 0.2 - (i % 2) * 0.15); g3.add(b); return b;
  });
  const COINS = 40;
  const coins = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 14), basic(GOLD, { toneMapped: false }), COINS);
  coins.frustumCulled = false; g3.add(coins);

  // ===== scene 4: waiter vs starter =====
  const g4 = new THREE.Group(); scene.add(g4);
  g4.add(floor0());
  g4.add(mesh(new THREE.PlaneGeometry(14, 1.6), basic('#1b1b1b'), { rx: -PI / 2, y: 0.003, z: 0.5, cast: false }));
  for (const z of [-0.3, 1.3]) g4.add(mesh(new THREE.PlaneGeometry(14, 0.03), basic('#555'), { rx: -PI / 2, y: 0.006, z, cast: false }));
  g4.add(mesh(new THREE.PlaneGeometry(0.06, 1.6), basic('#eeeeee'), { rx: -PI / 2, y: 0.007, x: LX + 0.45, z: 0.5, cast: false }));
  const sp4 = spotlight(LX, 5.2, 5.4, 1.25); g4.add(sp4);
  const sp4b = spotlight(RX, 5.2, 5.4, 1.25); g4.add(sp4b);
  const pole = new THREE.Group();
  pole.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 8), basic('#3a3a3a'), { y: 1.3, cast: false }));
  pole.add(mesh(new THREE.BoxGeometry(0.34, 0.8, 0.2), basic('#222'), { y: 2.9, cast: false }));
  const redL = mesh(new THREE.CircleGeometry(0.11, 18), basic('#ff3b3b', { toneMapped: false }), { y: 3.1, z: 0.11, cast: false });
  const greenL = mesh(new THREE.CircleGeometry(0.11, 18), basic('#2a2a2a', { toneMapped: false }), { y: 2.72, z: 0.11, cast: false });
  pole.add(redL, greenL);
  pole.position.set(LX - 0.75, 0, -0.4); g4.add(pole);

  const groups = [g1, g2, g3, g4];
  const show = (g) => groups.forEach((x) => { x.visible = x === g; });
  const place = (c, x, y, z, ry) => { c.root.visible = true; c.root.position.set(x, y, z); c.root.rotation.set(0, ry, 0); };
  const cam = (pos, look, fov) => { camera.position.set(...pos); camera.up.set(0, 1, 0); camera.lookAt(...look); if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); } };
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler();

  let header = '', labels = null, counters = null, scn = 0;

  function update(t) {
    player.bloom.strength = 0.28; player.bloom.threshold = 0.95;
    shovels.forEach((s) => { s.visible = false; });
    phone.visible = false; carry.visible = false;
    const ev = [];
    if (t < CUE.s2) {
      // ---------------- 1. SCROLLER vs BUILDER ----------------
      scn = 1; show(g1);
      const lt = t;
      place(L, LX, 0, -0.1, 0.25);
      L.applyPose(sitPhone(lt), t);
      L.root.updateMatrixWorld(true);
      const dead = t >= CUE.hit1;
      phone.visible = true;
      const hp = new THREE.Vector3(); L.arms.L.hand.getWorldPosition(hp); const hp2 = new THREE.Vector3(); L.arms.R.hand.getWorldPosition(hp2);
      phone.position.copy(hp.add(hp2).multiplyScalar(0.5)).add(new THREE.Vector3(0, 0.06, 0.05));
      phone.rotation.set(-0.9, 0.25, 0);
      screen.material.color.set(dead ? '#111' : '#7fc8ff');
      glow.material.opacity = dead ? 0 : 0.18 + 0.05 * sin(t * 13);
      setSpot(sp1[0], dead ? 0.25 : 0.7); setSpot(sp1[1], 0.8 + (t > CUE.hit1 ? 0.6 : 0));
      // builder: one brick every 2 beats
      const per = 2 * BEAT, t0 = 0.3;
      const k = clamp(floor((lt - t0) / per), -1, BRICKS);
      const u = ((lt - t0) / per) % 1;
      const placed = clamp(k, 0, BRICKS);
      bricks.forEach((b, i) => {
        b.visible = i < placed;
        b.position.set(RX - 0.55 + (i % 2 ? 0.04 : -0.04), 0.13 + i * 0.27, 0.1);
        b.material = t >= CUE.hit1 && i >= BRICKS - 3 ? brickHot : brickMat;
      });
      bulb.position.y = 0.13 + BRICKS * 0.27 + 0.2;
      bulb.material.color.set(t >= CUE.hit1 ? '#fff2b0' : '#333');
      bulb.scale.setScalar(t >= CUE.hit1 ? 1 + 0.25 * easeOutBack(clamp((t - CUE.hit1) / 0.3, 0, 1)) - 0.25 : 1);
      if (lt >= t0 && k < BRICKS) {
        R.applyPose(brickCycle(u), t);
        place(R, RX + 0.2, 0, 0.1, lerp(PI / 2, -PI / 2, smoothstep(clamp((u - 0.42) / 0.2, 0, 1))));
        R.root.updateMatrixWorld(true);
        if (u > 0.35) {
          carry.visible = true;
          const a = new THREE.Vector3(), b = new THREE.Vector3(); R.arms.L.hand.getWorldPosition(a); R.arms.R.hand.getWorldPosition(b);
          const hand = a.add(b).multiplyScalar(0.5);
          const target = new THREE.Vector3(RX - 0.55, 0.13 + k * 0.27, 0.1);
          carry.position.copy(hand.lerp(target, smoothstep(clamp((u - 0.8) / 0.2, 0, 1))));
        }
      } else {
        place(R, RX + 0.35, 0, 0.1, -0.2);
        R.applyPose(t >= CUE.hit1 ? cheerUp(t - CUE.hit1) : P(breathe(t)), t);
      }
      ev.push({ t: CUE.hit1, type: 'sparkle', pos: [RX - 0.55, 0.13 + BRICKS * 0.27 + 0.2, 0.2], seed: 1 });
      cam([0, 2.1, 11.5], [0, 1.9, 0], 32);
      header = 'TIME IS YOUR REAL CURRENCY.';
      labels = ['SCROLLER', 'BUILDER'];
      counters = [`HOURS WASTED  ${min(6, floor(lt / 1.2) + 1)}`, `BRICKS  ${placed}`];
    } else if (t < CUE.s3) {
      // ---------------- 2. QUITTER vs CONSISTENT ----------------
      scn = 2; show(g2);
      const lt = t - CUE.s2;
      const quitT = 2.9, strikeT = CUE.hit2 - CUE.s2;
      const dL = min(lerp(0.3, 2.75, clamp(lt / quitT, 0, 1)), 2.75);
      const dR = lerp(0.3, 2.95, clamp(lt / strikeT, 0, 1));
      holes[0].scale.y = dL; holes[0].position.y = -dL / 2;
      holes[1].scale.y = dR; holes[1].position.y = -dR / 2;
      // quitter: digs, stops just above the chest, throws the shovel and climbs out
      if (lt < quitT) {
        place(L, LX, -dL, 0.25, 0.4); shovels[0].visible = true;
        L.applyPose(digCycle((lt * 1.6) % 1), t);
        droppedShovel.visible = false;
        if (((lt * 1.6) % 1) < 0.05) ev.push({ t, type: 'dust', pos: [LX, -dL + 0.2, 0.3], seed: floor(t * 10) });
      } else {
        const u = clamp((lt - quitT) / 1.2, 0, 1);
        droppedShovel.visible = true; droppedShovel.position.set(LX + 0.1, -dL + 0.05, 0.2); droppedShovel.rotation.set(0, 0, 0.1);
        if (u < 1) { place(L, LX, lerp(-dL, 0, smoothstep(u)), 0.25, 0); L.applyPose(addPose(P({ headNod: 15 }), { legL: { fwd: 50 * sin(u * 12), knee: 40 }, legR: { fwd: -50 * sin(u * 12), knee: 40 }, armL: { raise: 160 }, armR: { raise: 160 } }), t); }
        else { const w = lt - quitT - 1.2; place(L, LX - w * 1.1, 0, 0.25, -PI / 2); L.applyPose(addPose(walk(w, 0.9, 0.8), { headNod: 22, lean: 8 }), t); }
      }
      // consistent: keeps digging until he hits the chest on the beat
      if (lt < strikeT) {
        place(R, RX, -dR, 0.25, -0.4); shovels[1].visible = true;
        R.applyPose(digCycle((lt * 1.6) % 1, 1.1), t);
      } else {
        place(R, RX, -dR, 0.25, 0); R.applyPose(cheerUp(lt - strikeT), t);
      }
      const open = smoothstep(clamp((t - CUE.hit2) / 0.35, 0, 1));
      chests[1].userData.lid.rotation.x = -open * 1.2; chests[1].userData.lid.position.z = -open * 0.15;
      treasureGlow.material.opacity = open * (0.4 + 0.1 * sin(t * 8));
      ev.push({ t: CUE.hit2, type: 'confetti', pos: [RX, CHEST_Y + 0.4, 0.3], seed: 5 }, { t: CUE.hit2 + 0.05, type: 'sparkle', pos: [RX, CHEST_Y + 0.5, 0.3], seed: 6 });
      for (let ts = 0.2; ts < strikeT; ts += 1 / 1.6) ev.push({ t: CUE.s2 + ts, type: 'dust', pos: [RX, -lerp(0.3, 2.95, ts / strikeT) + 0.2, 0.3], seed: 50 + floor(ts * 10) });
      cam([0, -0.9, 12.5], [0, -1.15, 0], 34);
      header = 'MOST PEOPLE QUIT RIGHT BEFORE IT PAYS OFF.';
      labels = ['QUITTER', 'CONSISTENT'];
      counters = [`DAYS  ${min(3, floor(lt / 0.9) + 1)}`, `DAYS  ${min(100, floor(1 + 99 * clamp(lt / strikeT, 0, 1)))}`];
    } else if (t < CUE.s4) {
      // ---------------- 3. SPENDER vs SAVER ----------------
      scn = 3; show(g3);
      const lt = t - CUE.s3;
      const crash = smoothstep(clamp((t - CUE.hit3) / 0.5, 0, 1));
      setSpot(sp3[0], 0.8 - crash * 0.5); setSpot(sp3[1], 0.9 + crash * 0.5);
      const per = BEAT;
      const nCaught = floor(lt / per);
      // coins fall to each figure
      for (let i = 0; i < COINS; i++) {
        const side = i % 2, j = floor(i / 2);
        const tt = lt - j * per - (side ? 0.12 : 0);
        const x = side ? RX - 0.1 : LX + 0.1;
        if (tt < 0 || tt > per * 1.2) { m4.makeScale(0, 0, 0); coins.setMatrixAt(i, m4); continue; }
        const y = 5 - tt * tt * 14;
        q.setFromEuler(e3.set(tt * 9, tt * 5, 0));
        m4.compose(new THREE.Vector3(x, max(1.9, y), 0.4), q, new THREE.Vector3(1, 1, 1));
        coins.setMatrixAt(i, m4);
      }
      coins.instanceMatrix.needsUpdate = true;
      // spender: catches and tosses away (bags pile up, then crumble on the hit)
      const cyc = (lt % per) / per;
      place(L, LX, 0, 0.3, 0.5);
      L.applyPose(P({ ...breathe(t), armR: { raise: 60 + 90 * sin(cyc * PI), fwd: -30 * sin(cyc * PI), elbow: 30 }, armL: { raise: 40, fwd: 60, elbow: 40 }, headNod: -10 }), t);
      bags.forEach((b, i) => {
        const appear = clamp((lt - 0.6 - i * 0.8) / 0.25, 0, 1);
        b.visible = appear > 0 && crash < 1;
        b.scale.setScalar(easeOutBack(appear) * (1 - crash) + 0.0001);
        b.rotation.z = crash * (i % 2 ? 0.8 : -0.8);
      });
      if (crash > 0) L.applyPose(P({ ...breathe(t), headNod: 28, lean: 12, armL: { raise: 12 }, armR: { raise: 12 } }), t);
      // saver: drops each coin in the jar; it overflows on the hit
      place(R, RX, 0, 0.3, -0.6);
      R.applyPose(t < CUE.hit3 ? P({ ...breathe(t), armL: { raise: 20, fwd: 50 + 20 * sin(cyc * PI), elbow: 50 }, armR: { raise: 15, fwd: 30, elbow: 40 }, headNod: 18 }) : cheerUp(t - CUE.hit3), t);
      const level = clamp(lt / (CUE.hit3 - CUE.s3), 0, 1);
      fill.scale.y = max(0.02, level * 0.98); fill.position.y = fill.scale.y / 2 + 0.01;
      ev.push({ t: CUE.hit3, type: 'confetti', pos: [RX + 0.75, 1.1, 0.4], seed: 7 }, { t: CUE.hit3, type: 'sparkle', pos: [RX + 0.75, 1.2, 0.4], seed: 8 }, { t: CUE.hit3 + 0.05, type: 'smoke', pos: [LX - 0.9, 0.3, 0.2], seed: 9 });
      cam([0, 2.0, 11.5], [0, 1.8, 0], 32);
      header = 'SMALL DEPOSITS. BIG FUTURE.';
      labels = ['SPENDER', 'SAVER'];
      const money = floor(10000 * level * level);
      counters = ['$  0', `$  ${money.toLocaleString('en-US')}`];
    } else {
      // ---------------- 4. WAITER vs STARTER ----------------
      scn = 4; show(g4);
      const lt = t - CUE.s4;
      const green = t >= CUE.hit4;
      redL.material.color.set(green ? '#2a2a2a' : '#ff3b3b');
      greenL.material.color.set(green ? '#3bff6a' : '#2a2a2a');
      setSpot(sp4, 0.8); setSpot(sp4b, 0.9);
      place(L, LX, 0, 0.15, 0.3);
      L.applyPose(green ? seq(t, [[CUE.hit4, (x) => P({ ...breathe(x), headNod: -20, headTurn: 40 })], [CUE.hit5, (x) => addPose(walk(x, 1.0, 0.8), {})]], 0.3) : checkWatch(lt), t);
      if (t >= CUE.hit5) { L.root.position.x = LX + (t - CUE.hit5) * 0.9; L.root.rotation.y = PI / 2; }
      // starter runs laps: wraps across the frame every bar
      const lapT = BAR * 0.9;
      const ph = (lt % lapT) / lapT;
      place(R, lerp(-3.4, 3.4, ph), 0, 0.85, PI / 2);
      R.applyPose(sprint(lt), t);
      ev.push({ t: CUE.hit4, type: 'sparkle', pos: [LX - 0.75, 2.8, -0.2], seed: 11 });
      cam([0, 2.0, 11.5], [0, 1.8, 0], 32);
      header = "START BEFORE YOU'RE READY.";
      labels = ['WAITER', 'STARTER'];
      counters = ['LAPS  0', `LAPS  ${floor(lt / lapT)}`];
    }
    particles.update(ev, t);
  }

  const aspect = player.width / player.height;
  const MONO = '"Courier New", "DejaVu Sans Mono", monospace';
  return {
    warmTimes: [1, 9, 17, 25],
    update(t) { update(t); return {}; },
    overlay(t) {
      update(t);
      const sceneStart = [0, CUE.s2, CUE.s3, CUE.s4][scn - 1];
      const lt = t - sceneStart;
      const hud = [];
      // typewriter header (one character every ~35 ms)
      const n = clamp(floor(lt / 0.035), 0, header.length);
      if (n > 0) hud.push({ text: header.slice(0, n) + (n < header.length ? '_' : ''), style: { size: 40, weight: 700, spacing: 0.18, color: '#ffffff', shadow: 0, font: MONO }, x: 0, y: 0.86, height: 0.022, opacity: 1 });
      if (labels) {
        const op = clamp((lt - 0.25) / 0.25, 0, 1);
        labels.forEach((l, i) => {
          const x = (i ? 1 : -1) * aspect * 0.5;
          hud.push({ text: l, style: { size: 40, weight: 700, spacing: 0.22, color: i ? '#ffffff' : '#bdbdbd', shadow: 0, font: MONO }, x, y: 0.75, height: 0.021, opacity: op });
          hud.push({ text: counters[i], style: { size: 36, weight: 700, spacing: 0.14, color: i ? '#ffd166' : '#8a8a8a', shadow: 0, font: MONO }, x, y: 0.7, height: 0.017, opacity: op });
        });
      }
      hud.push({ text: 'Mindset.', style: { size: 64, weight: 600, spacing: 0, color: '#ffffff', shadow: 0.5 }, x: 0, y: 0.05, height: 0.03, opacity: 0.95 });
      return {
        hud,
        overlays: [
          { type: 'fade', amount: max(1 - t / 0.2, clamp((t - (CUE.end - 0.45)) / 0.4, 0, 1)) },
          { type: 'flash', amount: 0.35 * clamp(1 - abs(t - CUE.s3) / 0.12, 0, 1) },
        ],
      };
    },
  };
}
