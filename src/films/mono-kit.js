// Shared kit for the minimal monochrome "Mindset." compilation format:
// black void, flat white faceless figures (grey = holding back, white =
// moving forward), hanging spotlights, typewriter header, two labels with
// counters, a centred brand word, hard cuts on bar lines.
//
// A film is a list of scenes:
//   { start, header, labels: [left, right], setup(g, k) -> state, update(state, lt, t, k) -> [counterL, counterR] }
import * as THREE from 'three';
import { Character } from '../engine/character.js';
import { ParticleSystem } from '../engine/effects.js';
import { mesh } from '../engine/environments/common.js';
import { clamp, lerp, smoothstep, easeOutBack } from '../engine/rng.js';
import { P, breathe, walk } from './kit.js';

const { sin, cos, PI, abs, max, floor } = Math;
export const BEAT = 60 / 123, BAR = BEAT * 4;
// cue grid of the 123 BPM track used by this format
export const GRID = { s2: 7.92, s3: 15.73, s4: 23.54, hit1: 5.71, hit2: 13.33, hit3: 20.92, hit4: 28.54, hit5: 31.07, end: 33.6 };
export const LX = -1.35, RX = 1.35;
export const WHITE = '#f4f4f4', GREY = '#a9a9a9', GOLD = '#ffc23a';
export const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
export const add = (g, geo, color, o = {}) => { const m = mesh(geo, typeof color === 'string' ? basic(color) : color, { cast: false, ...o }); g.add(m); return m; };
export const boxG = (w, h, d) => new THREE.BoxGeometry(w, h, d);

export function flatFigure(color) {
  const c = new Character({ id: 'f' + color, style: 'toon', body: color, accent: color, accessory: 'bald' });
  const m = basic(color);
  c.root.traverse((o) => {
    if (!o.isMesh || o.userData.noOutline) return;
    if (o.geometry.type === 'TorusGeometry' || o === c.scarfTail) { o.visible = false; return; }
    o.material = m; o.castShadow = false; o.receiveShadow = false;
  });
  return c;
}
export function spotlight(x, y = 5.2, h = 5.4, r = 1.25) {
  const g = new THREE.Group();
  add(g, new THREE.SphereGeometry(0.42, 20, 10, 0, PI * 2, 0, PI / 2), basic('#1c1c1c', { side: THREE.DoubleSide }), { y });
  add(g, new THREE.CircleGeometry(0.4, 20), basic('#fffbe8', { toneMapped: false }), { y: y - 0.01, rx: PI / 2 });
  add(g, new THREE.CylinderGeometry(0.008, 0.008, 3, 4), '#333', { y: y + 1.5 });
  const cone = add(g, new THREE.CylinderGeometry(0.38, r, h, 32, 1, true), basic('#fff6dc', { transparent: true, opacity: 0.045, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }), { y: y - h / 2 });
  const pool = add(g, new THREE.CircleGeometry(r * 1.05, 40), basic('#fff3d0', { transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending }), { y: 0.005, rx: -PI / 2 });
  g.position.x = x; g.userData = { cone, pool };
  return g;
}
export const setSpot = (s, k) => { s.userData.cone.material.opacity = 0.045 * k; s.userData.pool.material.opacity = 0.1 * k; };
export const floorPlane = () => mesh(new THREE.PlaneGeometry(40, 30), basic('#121212'), { rx: -PI / 2, y: 0, z: -5, cast: false });
/** standard stage: floor + two spotlights; returns the spots */
export function stage(g, spots = [LX, RX]) { g.add(floorPlane()); const s = spots.map((x) => spotlight(x)); g.add(...s); return s; }

// ---------- poses ----------
export const cheerUp = (t) => { const b = abs(sin(t * 6.2)); return P({ bodyY: b * 0.1, headNod: -12, armL: { raise: 138, fwd: 10, elbow: 8 }, armR: { raise: 138, fwd: 10, elbow: 8 }, legL: { knee: (1 - b) * 20 }, legR: { knee: (1 - b) * 20 } }); };
export const slump = (t) => P({ ...breathe(t, 0.6), headNod: 30, lean: 12, armL: { raise: 8 }, armR: { raise: 8 }, legL: { knee: 6 }, legR: { knee: 6 } });
export const sitFloor = (t, nod = 30) => P({ bodyY: -0.85, lean: 20, headNod: nod, sway: sin(t) * 1.5, armL: { raise: 18, fwd: 70, elbow: 110, elbowOut: -30 }, armR: { raise: 18, fwd: 70, elbow: 110, elbowOut: -30 }, legL: { fwd: 92, knee: 120, out: 12 }, legR: { fwd: 92, knee: 120, out: 12 } });
export function sprint(t) {
  const f = t * 2 * PI * 2.2, s = sin(f), c = cos(f);
  return P({ lean: 15, bodyY: abs(c) * 0.09, twist: s * 10, headNod: -4, armL: { raise: 14, fwd: -s * 78, elbow: 92 }, armR: { raise: 14, fwd: s * 78, elbow: 92 }, legL: { fwd: s * 58 + 10, knee: 14 + 100 * max(0, c) }, legR: { fwd: -s * 58 + 10, knee: 14 + 100 * max(0, -c) } });
}
export function brickCycle(u) {
  const down = sin(clamp(u / 0.5, 0, 1) * PI), up = sin(clamp((u - 0.5) / 0.5, 0, 1) * PI);
  return P({ lean: 55 * down - 6 * up, hipDrop: -0.25 * down, headNod: 20 * down - 15 * up, armL: { raise: 15, fwd: 70 * down + 110 * up, elbow: 20 }, armR: { raise: 15, fwd: 70 * down + 110 * up, elbow: 20 }, legL: { knee: 40 * down }, legR: { knee: 40 * down } });
}
export function climbStep(u, lead = 'L') {
  const s = sin(u * PI), tr = lead === 'L' ? 'R' : 'L';
  return P({ lean: 10, ['leg' + lead]: { fwd: 20 + 50 * s, knee: 15 + 80 * s }, ['leg' + tr]: { fwd: -10 * u, knee: 10 + 20 * s }, ['arm' + lead]: { raise: 10, fwd: -30 * s, elbow: 30 }, ['arm' + tr]: { raise: 10, fwd: 35 * s, elbow: 50 } });
}
export { P, breathe, walk };

/** wraps a scene list into a film object for FilmPlayer */
export function createMonoFilm(player, { scenes, end = GRID.end, brand = 'Mindset.', flashes = [] }) {
  const scene = player.scene, camera = player.camera;
  player.renderer.shadowMap.enabled = false;
  scene.background = new THREE.Color('#040404');
  const L = flatFigure(GREY), R = flatFigure(WHITE);
  scene.add(L.root, R.root);
  const particles = new ParticleSystem(scene);
  const k = {
    L, R, player, scene,
    place: (c, x, y, z, ry) => { c.root.visible = true; c.root.position.set(x, y, z); c.root.rotation.set(0, ry, 0); },
    cam: (pos, look, fov = 32) => { camera.position.set(...pos); camera.up.set(0, 1, 0); camera.lookAt(...look); if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); } },
    hands: (c) => { c.root.updateMatrixWorld(true); const a = new THREE.Vector3(), b = new THREE.Vector3(); c.arms.L.hand.getWorldPosition(a); c.arms.R.hand.getWorldPosition(b); return a.add(b).multiplyScalar(0.5); },
    hand: (c, side) => { c.root.updateMatrixWorld(true); const a = new THREE.Vector3(); c.arms[side].hand.getWorldPosition(a); return a; },
    ev: [],
  };
  const groups = scenes.map((s) => { const g = new THREE.Group(); scene.add(g); s._g = g; s._st = s.setup(g, k) || {}; return g; });
  let cur = scenes[0], counters = ['', ''];
  function update(t) {
    player.bloom.strength = 0.28; player.bloom.threshold = 0.95;
    let i = scenes.length - 1;
    while (i > 0 && t < scenes[i].start) i--;
    cur = scenes[i];
    groups.forEach((g, j) => { g.visible = j === i; });
    k.ev = [];
    L.root.visible = R.root.visible = true;
    counters = cur.update(cur._st, t - cur.start, t, k) || ['', ''];
    particles.update(k.ev, t);
  }
  const aspect = player.width / player.height;
  const MONO = '"Courier New", "DejaVu Sans Mono", monospace';
  return {
    warmTimes: scenes.map((s) => s.start + 1),
    update(t) { update(t); return {}; },
    overlay(t) {
      update(t);
      const lt = t - cur.start, hud = [];
      const n = clamp(floor(lt / 0.035), 0, cur.header.length);
      if (n > 0) hud.push({ text: cur.header.slice(0, n) + (n < cur.header.length ? '_' : ''), style: { size: 40, weight: 700, spacing: 0.18, color: '#ffffff', shadow: 0, font: MONO }, x: 0, y: 0.86, height: 0.022, opacity: 1 });
      if (cur.labels) {
        const op = clamp((lt - 0.25) / 0.25, 0, 1);
        cur.labels.forEach((l, j) => {
          const x = (j ? 1 : -1) * aspect * 0.5;
          hud.push({ text: l, style: { size: 40, weight: 700, spacing: 0.22, color: j ? '#ffffff' : '#bdbdbd', shadow: 0, font: MONO }, x, y: 0.75, height: 0.021, opacity: op });
          if (counters[j]) hud.push({ text: counters[j], style: { size: 36, weight: 700, spacing: 0.14, color: j ? '#ffd166' : '#8a8a8a', shadow: 0, font: MONO }, x, y: 0.7, height: 0.017, opacity: op });
        });
      }
      hud.push({ text: brand, style: { size: 64, weight: 600, spacing: 0, color: '#ffffff', shadow: 0.5 }, x: 0, y: 0.05, height: 0.03, opacity: 0.95 });
      return {
        hud,
        overlays: [
          { type: 'fade', amount: max(1 - t / 0.2, clamp((t - (end - 0.45)) / 0.4, 0, 1)) },
          ...flashes.map((f) => ({ type: 'flash', amount: 0.35 * clamp(1 - abs(t - f) / 0.12, 0, 1) })),
        ],
      };
    },
  };
}
export { clamp, lerp, smoothstep, easeOutBack, THREE };
