// "5 More Minutes" – a 33-second motivational short.
//
// Hook: "THIS IS HOW YOU LOSE A YEAR…"
// Two roommates, two alarms. Gold switches his off, jumps up and heads out.
// Grey hits snooze ("5 more minutes…") – again and again, while the
// calendar flips through a whole year and gold jogs past the window every
// day. In the silent break grey finally sits up: "1 YEAR LATER". On the
// drop we see where gold is now: breaking the finish-line tape on DAY 365
// and getting his medal; he points at the viewer. Last scene: the alarm
// rings again – grey switches it OFF, gets up, throws open the curtains
// and sunlight floods in, with gold waving outside. "WAKE UP. YOUR DREAMS
// WON'T WAIT."
//
// Cues follow the music track's beat map (≈123 BPM, break 14.0–15.5 s,
// drop at 15.58 s, hits at 18.11 / 20.02 / 22.24 / 25.4 / 28.26 / 30.79).
import * as THREE from 'three';
import { Character } from '../engine/character.js';
import { blendPose } from '../engine/poses.js';
import { ParticleSystem, SpriteLayer } from '../engine/effects.js';
import { sky, mat, mesh, box, tree } from '../engine/environments/common.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Rng, clamp, lerp, easeOutBack, smoothstep } from '../engine/rng.js';
import { kf, win, P, seq, addPose, breathe, cheer, LABEL_STYLE } from './kit.js';

const DEG = Math.PI / 180;
const { sin, cos, PI, abs, max, min, floor } = Math;

export const CUE = {
  ring1: 0.56, gWake: 0.95, snooze1: 1.49, gSit: 1.35, gStand: 2.0, gStretch: 2.55, gWalk: 3.15, doorOpen: 3.75, gGone: 4.35,
  medium: 4.2, snoozes: [1.49, 4.5, 5.99, 7.52, 8.5, 9.48, 10.45, 11.43, 12.41],
  montage: 7.04, beat: 0.4878, yearLater: 13.05, brk: 14.0, greySit: 14.3, greyLook: 14.85,
  drop: 15.58, tape: 18.11, medal: 20.02, point: 22.24, home: 25.4, greyOff: 25.75, greyUp: 25.95, greyStand: 26.45,
  curtains: 27.05, title: 28.26, title2: 30.79, end: 32.79,
};
export const DURATION = CUE.end;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// ---------------- layout ----------------
const BED_X = { grey: -0.95, gold: 0.95 }, STAND_X = { grey: -1.95, gold: 1.95 };
const MATTRESS = 0.55, HIP_Z = -0.55, HIP_H = 1.0; // toon rig: hips 1.0 above the feet
const DOOR_X = 2.575, BACK_Z = -2.1;
const FINISH_Z = -20;

// ---------------- poses ----------------
const lying = (t, amt = 1) => P({ bodyY: 0, headTurn: 12 + sin(t * 0.7) * 3, headTilt: 0, sway: sin(t * 1.4) * 1.2 * amt, armL: { raise: 9, fwd: 4, elbow: 12 }, armR: { raise: 9, fwd: 4, elbow: 12 }, legL: { out: 3 }, legR: { out: 3 } });
function sprint(t) {
  const f = t * 2 * PI * 2.3, s = sin(f), c = cos(f);
  return P({
    lean: 15, bodyY: abs(c) * 0.1, twist: s * 11, headNod: -6 - abs(c) * 3, scarf: s * 0.4,
    armL: { raise: 14, fwd: -s * 80, elbow: 92 + s * 10 }, armR: { raise: 14, fwd: s * 80, elbow: 92 - s * 10 },
    legL: { fwd: s * 60 + 10, knee: 14 + 105 * max(0, c) }, legR: { fwd: -s * 60 + 10, knee: 14 + 105 * max(0, -c) },
  });
}
function walkP(t, speed = 1.6, amp = 1) {
  const f = t * 2 * PI * speed, s = sin(f), c = cos(f);
  return P({ bodyY: abs(c) * 0.05 * amp, lean: 4, twist: s * 6 * amp, armL: { raise: 9, fwd: -s * 32 * amp, elbow: 22 }, armR: { raise: 9, fwd: s * 32 * amp, elbow: 22 }, legL: { fwd: s * 30 * amp, knee: 6 + max(0, -c) * 45 * amp }, legR: { fwd: -s * 30 * amp, knee: 6 + max(0, c) * 45 * amp } });
}
const stretchUp = (t) => P({ ...breathe(t), headNod: -14, lean: -6, sway: sin(t * 3) * 4, armL: { raise: 172, elbow: 10 }, armR: { raise: 172, elbow: 10 }, legL: { out: 6 }, legR: { out: 6 } });
const handsOnHips = (t) => P({ ...breathe(t), headNod: -8, lean: -3, armL: { raise: 38, fwd: -8, elbow: 105, elbowOut: 45 }, armR: { raise: 38, fwd: -8, elbow: 105, elbowOut: 45 }, legL: { out: 9 }, legR: { out: 9 } });
const pointAt = (t) => P({ ...breathe(t), headNod: -4, armR: { raise: 14, fwd: 88, elbow: 4 }, armL: { raise: 38, fwd: -8, elbow: 105, elbowOut: 45 }, legL: { out: 8 }, legR: { out: 8 } });
const beckon = (t) => P({ ...breathe(t), headTilt: 8, armR: { raise: 20, fwd: 80, elbow: 30 + 60 * (0.5 + 0.5 * sin(t * 9)) }, armL: { raise: 12 }, legL: { out: 6 }, legR: { out: 6 } });
const waveBig = (t) => P({ ...breathe(t), armR: { raise: 150 + sin(t * 8) * 18, elbow: 20 }, armL: { raise: 12 } });

// ---------------- canvas textures ----------------
function calendarCanvas(label, big) {
  const c = document.createElement('canvas'); c.width = 400; c.height = 500;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 400, 500);
  g.fillStyle = '#ff4d5e'; g.fillRect(0, 0, 400, 130);
  g.fillStyle = '#ffffff'; g.font = '900 96px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(label, 200, 70);
  g.fillStyle = '#222'; g.font = `900 ${big.length > 2 ? 110 : 230}px Inter, Arial, sans-serif`;
  g.fillText(big, 200, 320);
  g.strokeStyle = '#333'; g.lineWidth = 8; g.strokeRect(4, 4, 392, 492);
  return c;
}
function bannerCanvas(text) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 220;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 1024, 220);
  g.fillStyle = '#ff4d5e'; g.fillRect(0, 0, 1024, 26); g.fillRect(0, 194, 1024, 26);
  g.fillStyle = '#1d2433'; g.font = '900 130px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 512, 114);
  return c;
}
function webCanvas() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 3;
  for (let i = 0; i < 8; i++) { const a = (i / 8) * PI / 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(cos(a) * 250, sin(a) * 250); g.stroke(); }
  for (let r = 40; r < 250; r += 42) { g.beginPath(); g.arc(0, 0, r, 0, PI / 2); g.stroke(); }
  return c;
}
const tex = (canvas) => { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const toon = (color, o = {}) => new THREE.MeshToonMaterial({ color, ...o });

function alarmClock() {
  const g = new THREE.Group();
  const red = toon('#ff4d5e');
  const body = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 24), red, { rx: PI / 2, y: 0.17 });
  const face = mesh(new THREE.CircleGeometry(0.12, 24), toon('#ffffff'), { y: 0.17, z: 0.051, cast: false });
  const hand1 = box(0.012, 0.08, 0.005, '#222', { y: 0.2, z: 0.055, cast: false });
  const hand2 = box(0.06, 0.012, 0.005, '#222', { x: 0.025, y: 0.17, z: 0.055, cast: false });
  g.add(body, face, hand1, hand2);
  for (const sx of [-1, 1]) {
    g.add(mesh(new THREE.SphereGeometry(0.065, 12, 8, 0, PI * 2, 0, PI / 2), toon('#ffd23f'), { x: sx * 0.09, y: 0.3, rz: -sx * 0.5 }));
    g.add(box(0.025, 0.05, 0.025, '#333', { x: sx * 0.09, y: 0.04 }));
  }
  return g;
}

// =====================================================================
export function createFiveMoreMinutes(player) {
  const scene = player.scene, camera = player.camera;
  const rng = new Rng(55);

  const hemi = new THREE.HemisphereLight('#fff6ea', '#c9b29a', 1.5);
  const sun = new THREE.DirectionalLight('#fff1d6', 3.0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  const sc = sun.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.near = 1; sc.far = 60;
  const key = new THREE.DirectionalLight('#ffffff', 0.9); // soft front key so faces stay bright
  scene.add(hemi, sun, sun.target, key, key.target);

  // ================= BEDROOM =================
  const room = new THREE.Group(); scene.add(room);
  const skyR = sky('#5fb2ff', '#d8f0ff', '#e9f6ff', new THREE.Vector3(-0.3, 0.6, -1));
  room.add(skyR);
  // outside: lawn, path, trees (seen through the window)
  room.add(mesh(new THREE.PlaneGeometry(120, 80), toon('#9fdc72'), { rx: -PI / 2, y: -0.02, z: -40, cast: false }));
  room.add(mesh(new THREE.PlaneGeometry(60, 1.6), toon('#f2dcb0'), { rx: -PI / 2, y: 0.0, z: -6.2, cast: false }));
  for (let i = 0; i < 14; i++) { const t = tree(rng, { x: rng.float(-14, 14), z: rng.float(-9, -20), s: rng.float(0.9, 1.5) }); room.add(t); }
  // floor & walls
  const wallMat = toon('#fff0dc'), sideMat = toon('#ffe3c2');
  room.add(box(6.6, 0.2, 5.6, toon('#f2c38f'), { y: -0.1, z: 0.6, cast: false }));
  room.add(box(3.4, 0.02, 2.0, toon('#8fc7ff'), { y: 0.005, z: 1.25, cast: false })); // rug
  const H = 4.2, T = 0.16;
  const wall = (x0, x1, y0, y1) => room.add(box(x1 - x0, y1 - y0, T, wallMat, { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: BACK_Z }));
  wall(-3.3, -0.95, 0, H); wall(-0.95, 0.95, 0, 1.85); wall(-0.95, 0.95, 3.35, H); wall(0.95, 2.15, 0, H); wall(2.15, 3.0, 2.15, H); wall(3.0, 3.3, 0, H);
  for (const sx of [-1, 1]) room.add(box(T, H, 3.6, sideMat, { x: sx * 3.3, y: H / 2, z: -0.3 }));
  room.add(box(6.6, 0.12, 0.2, toon('#e8cfa8'), { y: 0.06, z: BACK_Z + 0.1, cast: false })); // skirting
  // window frame + curtains
  const frameMat = toon('#ffffff');
  for (const [w, h, x, y] of [[2.0, 0.1, 0, 1.85], [2.0, 0.1, 0, 3.35], [0.1, 1.6, -0.95, 2.6], [0.1, 1.6, 0.95, 2.6], [0.06, 1.5, 0, 2.6], [1.9, 0.05, 0, 2.6]]) room.add(box(w, h, 0.2, frameMat, { x, y, z: BACK_Z + 0.02 }));
  room.add(box(2.3, 0.12, 0.24, toon('#ffffff'), { y: 1.82, z: BACK_Z + 0.12 })); // sill
  const curtainMat = toon('#ff9fb3');
  const curtL = box(0.62, 1.75, 0.05, curtainMat, { y: 2.6, z: BACK_Z + 0.2 });
  const curtR = box(0.62, 1.75, 0.05, curtainMat, { y: 2.6, z: BACK_Z + 0.2 });
  room.add(curtL, curtR);
  room.add(box(2.6, 0.05, 0.05, '#c99a6a', { y: 3.5, z: BACK_Z + 0.22 }));
  // door (opens into the room) + bright hallway behind
  const doorPivot = new THREE.Group(); doorPivot.position.set(DOOR_X - 0.43, 0, BACK_Z + 0.09);
  doorPivot.add(box(0.86, 2.1, 0.07, toon('#c98a5a'), { x: 0.43, y: 1.05 }));
  doorPivot.add(mesh(new THREE.SphereGeometry(0.045, 10, 8), toon('#ffd23f'), { x: 0.76, y: 1.0, z: 0.06 }));
  room.add(doorPivot);
  room.add(mesh(new THREE.PlaneGeometry(1.0, 2.2), new THREE.MeshBasicMaterial({ color: '#fff7e0', toneMapped: false }), { x: DOOR_X, y: 1.1, z: BACK_Z - 0.3, cast: false }));
  // beds, nightstands, clocks
  const blankets = {}, clocks = {};
  for (const [id, x] of Object.entries(BED_X)) {
    const frameC = id === 'gold' ? '#f5d39a' : '#c9cfdb', blanketC = id === 'gold' ? '#ffc94d' : '#8e9bb4';
    room.add(box(1.25, 0.35, 2.55, toon(frameC), { x, y: 0.175, z: -0.6 }));
    room.add(mesh(new RoundedBoxGeometry(1.15, 0.22, 2.45, 3, 0.08), toon('#ffffff'), { x, y: 0.45, z: -0.6 }));
    room.add(box(1.25, 1.1, 0.12, toon(frameC), { x, y: 0.55, z: -1.9 }));
    room.add(mesh(new RoundedBoxGeometry(0.82, 0.16, 0.42, 3, 0.07), toon('#ffffff'), { x, y: 0.62, z: -1.5 }));
    const bl = mesh(new RoundedBoxGeometry(1.26, 0.26, 1.0, 3, 0.1), toon(blanketC), { x, y: 0.74, z: 0 });
    room.add(bl); blankets[id] = bl;
    const nx = id === 'gold' ? 1.85 : -1.85;
    room.add(box(0.5, 0.55, 0.45, toon('#e9b77f'), { x: nx, y: 0.275, z: -1.5 }));
    const ck = alarmClock(); ck.position.set(nx, 0.55, -1.45); room.add(ck); clocks[id] = ck;
  }
  // calendar on the wall above grey's nightstand
  const calTex = new Map();
  const calPage = (k) => { if (!calTex.has(k)) calTex.set(k, tex(k === 'Y' ? calendarCanvas('1 YEAR', 'LATER') : calendarCanvas(MONTHS[k], String(1 + ((k * 7) % 28))))); return calTex.get(k); };
  const calendar = mesh(new THREE.PlaneGeometry(0.8, 1.0), new THREE.MeshToonMaterial({ map: calPage(0) }), { x: -2.25, y: 2.45, z: BACK_Z + 0.09, cast: false });
  room.add(calendar);
  const tearing = mesh(new THREE.PlaneGeometry(0.8, 1.0), new THREE.MeshToonMaterial({ map: calPage(0), side: THREE.DoubleSide }), { cast: false });
  room.add(tearing);
  // little extras: plant, poster, spider web on grey's headboard
  room.add(mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.4, 10), toon('#ff8a5c'), { x: -2.85, y: 0.2, z: -1.4 }));
  for (let i = 0; i < 5; i++) room.add(mesh(new THREE.IcosahedronGeometry(0.22, 0), toon('#4cbb53'), { x: -2.85 + rng.float(-0.15, 0.15), y: 0.55 + i * 0.15, z: -1.4 + rng.float(-0.12, 0.12) }));
  room.add(mesh(new THREE.PlaneGeometry(0.9, 0.6), new THREE.MeshToonMaterial({ map: tex(bannerCanvas('DREAM BIG')) }), { x: 1.55, y: 2.75, z: BACK_Z + 0.09, cast: false }));
  const web = mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshBasicMaterial({ map: tex(webCanvas()), transparent: true, depthWrite: false }), { x: -0.95 - 0.27, y: 1.05 - 0.0, z: -1.83, rz: -PI / 2, cast: false });
  room.add(web);

  // ================= PARK / FINISH LINE =================
  const park = new THREE.Group(); scene.add(park);
  park.add(sky('#3d9bff', '#cdeeff', '#e9f6ff', new THREE.Vector3(0.3, 0.55, -0.8)));
  park.add(mesh(new THREE.PlaneGeometry(200, 200), toon('#8fd65f'), { rx: -PI / 2, y: -0.02, z: -20, cast: false }));
  park.add(mesh(new THREE.PlaneGeometry(2.8, 70), toon('#f3d9a6'), { rx: -PI / 2, y: 0.0, z: -15, cast: false }));
  for (const sx of [-1, 1]) for (let z = 12; z > -50; z -= 3.4) {
    park.add(tree(rng, { x: sx * rng.float(4.2, 8), z: z + rng.float(-1, 1), s: rng.float(0.9, 1.4) }));
    if (rng.chance(0.4)) park.add(mesh(new THREE.IcosahedronGeometry(0.5, 0), toon('#5cc95a'), { x: sx * rng.float(2.2, 3.2), y: 0.3, z: z + 1.3, s: [1.3, 0.8, 1.1] }));
  }
  for (const sx of [-1, 1]) park.add(box(0.22, 3.2, 0.22, '#ffffff', { x: sx * 1.8, y: 1.6, z: FINISH_Z }));
  const bannerMat = new THREE.MeshToonMaterial({ map: tex(bannerCanvas('DAY 365')) });
  park.add(mesh(new THREE.PlaneGeometry(3.8, 0.8), bannerMat, { y: 3.0, z: FINISH_Z + 0.01, cast: false }));
  park.add(mesh(new THREE.PlaneGeometry(3.8, 0.8), bannerMat, { y: 3.0, z: FINISH_Z - 0.01, ry: PI, cast: false }));
  const tapeL = new THREE.Group(), tapeR = new THREE.Group();
  tapeL.position.set(-1.7, 1.05, FINISH_Z); tapeR.position.set(1.7, 1.05, FINISH_Z);
  tapeL.add(box(1.7, 0.05, 0.02, '#ff3b4f', { x: 0.85 })); tapeR.add(box(1.7, 0.05, 0.02, '#ff3b4f', { x: -0.85 }));
  park.add(tapeL, tapeR);
  const balloons = [];
  for (let i = 0; i < 8; i++) {
    const sx = i % 2 ? 1 : -1;
    const b = mesh(new THREE.SphereGeometry(0.25, 14, 10), toon(['#ff4d6d', '#ffd166', '#06d6a0', '#4dabf7'][i % 4]), { s: [1, 1.15, 1] });
    b.userData = { x: sx * (2.1 + (i % 3) * 0.3), y: 3.4 + (i % 4) * 0.35, ph: i * 1.3 };
    park.add(b); balloons.push(b);
  }

  // ================= CAST =================
  const gold = new Character({ id: 'gold', style: 'toon', body: '#fbf7ee', accent: '#ffb000', height: 1.0, eyeStyle: 'round', brows: 'normal', cheeks: true, accessory: 'bald' });
  const grey = new Character({ id: 'grey', style: 'toon', body: '#c3c9d6', accent: '#5f6b82', height: 1.0, eyeStyle: 'round', brows: 'normal', cheeks: false, accessory: 'bald', skin: '#e4e7ee' });
  const mini = new Character({ id: 'mini', style: 'toon', body: '#fbf7ee', accent: '#ffb000', height: 1.0, eyeStyle: 'round', brows: 'normal', cheeks: true, accessory: 'bald' });
  mini.root.scale.setScalar(0.62);
  scene.add(gold.root, grey.root, mini.root);
  // medal on gold's chest
  const medal = new THREE.Group();
  medal.add(box(0.05, 0.3, 0.01, '#3d7bff', { x: -0.06, y: 0.0, rz: -0.35 }));
  medal.add(box(0.05, 0.3, 0.01, '#ff4d5e', { x: 0.06, y: 0.0, rz: 0.35 }));
  medal.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 20), toon('#ffcc33', { emissive: '#664400' }), { rx: PI / 2, y: -0.2, z: 0.02 }));
  medal.position.set(0, -0.12, 0.1);
  gold.chest.add(medal);

  const particles = new ParticleSystem(scene);
  const sprites = new SpriteLayer(scene);

  // ---- helpers ----
  const blinkAt = (t, off) => { const p = (t + off) % 3.1; return p < 0.13 ? sin((p / 0.13) * PI) : 0; };
  const face = (c, t, expr, off = 0) => c.setFace({ expr, blink: blinkAt(t, off), mouth: 0, lookX: 0, lookY: 0 });
  const headPos = (c, out = new THREE.Vector3()) => c.head.getWorldPosition(out);
  const v3 = (a) => new THREE.Vector3(...a);
  const aimCam = (pos, look, fov) => {
    camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look);
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  };
  const shake = (t, t0, amt, dur = 0.5) => { const k = t >= t0 ? clamp(1 - (t - t0) / dur, 0, 1) : 0; return new THREE.Vector3(sin(t * 71) * amt * k, cos(t * 53) * amt * k * 0.8, 0); };
  /** place a character in bed: sit = 0 lying flat … 1 sitting up */
  function inBed(c, x, sit) {
    const th = -PI / 2 * (1 - sit);
    c.root.rotation.set(th, 0, 0);
    c.root.position.set(x, MATTRESS + 0.08 - cos(th) * HIP_H + (sit > 0 ? 0 : 0), HIP_Z - sin(th) * HIP_H);
    c.root.visible = true;
  }
  /** blend from sitting-in-bed to standing at a floor point */
  function bedToStand(c, x, u, sx, sz) {
    const e = smoothstep(u);
    const hx = lerp(x, sx, e), hz = lerp(HIP_Z, sz, e), hy = lerp(MATTRESS + 0.08, HIP_H, e) + sin(e * PI) * 0.18;
    c.root.rotation.set(0, 0, 0);
    c.root.position.set(hx, hy - HIP_H, hz);
    c.root.visible = true;
  }
  const ringing = (t) => [CUE.ring1, ...CUE.snoozes.slice(1).map((s) => s - 0.38), CUE.home].some((r) => t >= r && t < r + 0.42);
  const snoozeCount = (t) => CUE.snoozes.filter((s) => t >= s).length;

  const labels = [], tags = [];
  let where = 'room';

  function update(t) {
    const inPark = t >= CUE.drop && t < CUE.home;
    room.visible = !inPark; park.visible = inPark;
    mini.root.visible = false;
    labels.length = 0; tags.length = 0;
    const em = [];

    if (!inPark) {
      // ---------------- light: bright morning; time-lapse sweep in the montage ----------------
      let sx = -3.5;
      if (t >= CUE.montage && t < CUE.yearLater) sx = lerp(-7, 7, ((t - CUE.montage) / (2 * CUE.beat)) % 1);
      const flood = smoothstep(clamp((t - CUE.curtains) / 0.6, 0, 1));
      sun.position.set(sx, 7.5, -9); sun.target.position.set(0, 0, 0);
      sun.intensity = 3.0 + flood * 0.4;
      hemi.intensity = 1.45;
      key.position.set(1.5, 6, 9); key.target.position.set(0, 1, -1); key.intensity = 0.9;
      scene.fog = null;
      player.bloom.strength = 0.22; player.bloom.threshold = 0.93;

      // curtains (half open; fully open in the ending)
      const open = 0.25 + 0.75 * flood;
      curtL.position.x = lerp(-0.48, -1.25, open); curtR.position.x = lerp(0.48, 1.25, open);
      // door: opens for gold
      doorPivot.rotation.y = -1.6 * win(t, CUE.doorOpen, CUE.gGone + 0.3, 0.3, 0.3);
      // clocks shake when ringing
      for (const id of ['gold', 'grey']) {
        const r = id === 'gold' ? t >= CUE.ring1 && t < CUE.gWake + 0.35 : ringing(t) && (t < CUE.greyOff + 0.05 || t < CUE.home);
        clocks[id].rotation.z = r ? sin(t * 70) * 0.18 : 0;
        clocks[id].position.y = 0.55 + (r ? abs(sin(t * 50)) * 0.02 : 0);
      }
      // calendar pages
      let page = 0;
      if (t >= CUE.montage) page = min(11, floor((t - CUE.montage) / CUE.beat));
      const isYear = t >= CUE.yearLater;
      calendar.material.map = isYear ? calPage('Y') : calPage(page); calendar.material.needsUpdate = true;
      const tp = (t - CUE.montage) / CUE.beat;
      if (t >= CUE.montage + CUE.beat && t < CUE.yearLater + 0.45 && (tp % 1) < 0.8) {
        const k = isYear ? 11 : floor(tp) - 1, u = isYear ? (t - CUE.yearLater) / 0.45 : (tp % 1) / 0.8;
        tearing.visible = u < 1 && k >= 0;
        tearing.material.map = calPage(clamp(k, 0, 11)); tearing.material.needsUpdate = true;
        tearing.position.set(-2.25 + u * 0.35, 2.45 - u * u * 1.6, BACK_Z + 0.12 + u * 0.5);
        tearing.rotation.set(u * 1.2, u * 0.6, u * 0.9);
      } else tearing.visible = false;
      web.material.opacity = smoothstep(clamp((t - 9.5) / 3.5, 0, 1)) * (t < CUE.home ? 1 : 0);

      // ---------------- GOLD (morning routine) ----------------
      if (t < CUE.gGone) {
        let pose;
        if (t < CUE.gSit) {
          inBed(gold, BED_X.gold, 0);
          pose = lying(t);
          // reach to switch off his alarm (left arm, towards +x)
          const r = win(t, CUE.gWake, CUE.gSit + 0.1, 0.18, 0.18);
          pose.armL = { raise: lerp(9, 92, r), fwd: lerp(4, 40, r), elbow: lerp(12, 20, r), elbowOut: 0 };
          pose.headTurn = lerp(12, -30, win(t, CUE.gWake - 0.1, CUE.gSit, 0.2, 0.2));
        } else if (t < CUE.gStand) {
          const a = smoothstep(clamp((t - CUE.gSit) / 0.55, 0, 1));
          inBed(gold, BED_X.gold, a);
          pose = P({ lean: 8 * a, headNod: 4, armL: { raise: 14, fwd: 20 * a }, armR: { raise: 14, fwd: 20 * a }, legL: { fwd: 90 * a, knee: 0 }, legR: { fwd: 90 * a, knee: 0 } });
        } else if (t < CUE.gStretch) {
          const u = clamp((t - CUE.gStand) / 0.5, 0, 1);
          bedToStand(gold, BED_X.gold, u, STAND_X.gold, 0.15);
          pose = blendPose(P({ lean: 8, legL: { fwd: 90 }, legR: { fwd: 90 } }), P({ ...breathe(t), legL: { knee: 10 * sin(u * PI) }, legR: { knee: 10 * sin(u * PI) } }), smoothstep(u));
        } else if (t < CUE.gWalk) {
          gold.root.position.set(STAND_X.gold, 0, 0.15); gold.root.rotation.set(0, 0, 0); gold.root.visible = true;
          pose = seq(t, [[CUE.gStretch - 0.1, (lt) => P(breathe(lt))], [CUE.gStretch, stretchUp]], 0.25);
        } else {
          // walk to the door and out
          const u = clamp((t - CUE.gWalk) / (CUE.gGone - CUE.gWalk), 0, 1);
          const p = u < 0.55 ? new THREE.Vector3(lerp(STAND_X.gold, DOOR_X, u / 0.55), 0, lerp(0.15, -1.2, u / 0.55)) : new THREE.Vector3(DOOR_X, 0, lerp(-1.2, -2.6, (u - 0.55) / 0.45));
          const dir = u < 0.55 ? Math.atan2(DOOR_X - STAND_X.gold, -1.35) : PI;
          gold.root.position.copy(p);
          gold.root.rotation.set(0, kf(u, [[0, 0], [0.12, dir], [0.5, dir], [0.62, PI]]), 0);
          gold.root.visible = p.z > -2.3;
          pose = blendPose(stretchUp(t), walkP(t - CUE.gWalk, 1.8, 1), smoothstep(clamp((t - CUE.gWalk) / 0.25, 0, 1)));
        }
        gold.applyPose(pose, t);
        face(gold, t, t < CUE.gWake ? 'sleepy' : t < CUE.gStretch ? 'determined' : 'happy', 0.4);
        medal.visible = false;
      } else if (t >= CUE.home) {
        // ending: gold waves outside the window
        gold.root.visible = t > CUE.curtains;
        gold.root.position.set(0.62, 0.35, -3.3); gold.root.rotation.set(0, 0, 0);
        gold.applyPose(waveBig(t), t);
        face(gold, t, 'happy', 0.4);
        medal.visible = true; medal.scale.setScalar(1);
      } else gold.root.visible = false;
      const gb = blankets.gold;
      const thrown = smoothstep(clamp((t - CUE.gSit) / 0.5, 0, 1)) * (t < CUE.home ? 1 : 1);
      gb.scale.set(1, 1, lerp(1.6, 0.55, thrown)); gb.position.set(BED_X.gold, 0.74 - thrown * 0.05, lerp(-0.15, 0.4, thrown));

      // ---------------- GREY ----------------
      let gpose, sit = 0;
      const snoozeW = (t0) => win(t, t0 - 0.38, t0 + 0.28, 0.2, 0.22);
      let reach = 0;
      for (const s of CUE.snoozes) reach = max(reach, snoozeW(s));
      if (t < CUE.greySit) {
        gpose = lying(t, 1.2);
        // tossing & turning during the montage
        if (t > CUE.montage) gpose.roll = sin((t - CUE.montage) * PI / (2 * CUE.beat)) * 0.12;
        gpose.armR = { raise: lerp(9, 100, reach), fwd: lerp(4, 28, reach), elbow: lerp(12, 25, reach), elbowOut: 0 };
        gpose.headTurn = lerp(10, 40, reach);
      } else if (t < CUE.drop) {
        sit = smoothstep(clamp((t - CUE.greySit) / 0.55, 0, 1));
        gpose = P({ lean: 10 * sit, headNod: 10 - 25 * win(t, CUE.greyLook, 99, 0.2, 0.1), headTurn: -65 * win(t, CUE.greyLook, 99, 0.25, 0.1), armL: { raise: 14, fwd: 15 }, armR: { raise: 14, fwd: 15 }, legL: { fwd: 90 * sit }, legR: { fwd: 90 * sit } });
      } else {
        // ending: alarm → OFF → sit → stand → to the window → curtains → turn to us
        if (t < CUE.greyUp) {
          gpose = lying(t);
          const r = win(t, CUE.home + 0.05, CUE.greyUp, 0.2, 0.15);
          gpose.armR = { raise: lerp(9, 100, r), fwd: lerp(4, 30, r), elbow: lerp(12, 20, r), elbowOut: 0 };
        } else if (t < CUE.greyStand) {
          sit = smoothstep(clamp((t - CUE.greyUp) / 0.45, 0, 1));
          gpose = P({ lean: 8 * sit, headNod: 4, armL: { raise: 14 }, armR: { raise: 14 }, legL: { fwd: 90 * sit }, legR: { fwd: 90 * sit } });
        } else gpose = null;
      }
      if (gpose && t < CUE.greyStand) {
        inBed(grey, BED_X.grey, t < CUE.drop || t >= CUE.home ? sit : 0);
        grey.applyPose(gpose, t);
      } else if (t >= CUE.greyStand) {
        const u1 = clamp((t - CUE.greyStand) / 0.45, 0, 1);
        if (u1 < 1) {
          bedToStand(grey, BED_X.grey, u1, -0.05, 0.95);
          grey.applyPose(blendPose(P({ lean: 8, legL: { fwd: 90 }, legR: { fwd: 90 } }), P(breathe(t)), smoothstep(u1)), t);
        } else {
          // walk up between the beds to the window, open curtains, turn around
          const wz = kf(t, [[CUE.greyStand + 0.45, 0.95], [CUE.curtains, -1.35, 'io']]);
          const turn = smoothstep(clamp((t - (CUE.title - 0.2)) / 0.5, 0, 1));
          grey.root.position.set(-0.05 * (1 - smoothstep(clamp((t - CUE.greyStand - 0.45) / 0.4, 0, 1))), 0, wz);
          grey.root.rotation.set(0, lerp(PI, 2 * PI, turn), 0);
          let p;
          if (t < CUE.curtains) p = walkP(t, 1.7, 0.9);
          else if (t < CUE.title - 0.2) {
            const o = smoothstep(clamp((t - CUE.curtains) / 0.55, 0, 1));
            p = P({ ...breathe(t), lean: -4, headNod: -10, armL: { raise: lerp(150, 95, o), fwd: lerp(30, 0, o), elbow: 20 }, armR: { raise: lerp(150, 95, o), fwd: lerp(30, 0, o), elbow: 20 } });
          } else p = seq(t, [[CUE.title - 0.2, (lt) => P({ ...breathe(lt), headNod: -6 })], [CUE.title + 0.3, cheer], [CUE.title2 - 0.4, handsOnHips]], 0.3);
          grey.applyPose(p, t);
        }
        grey.root.visible = true;
      }
      const sleepy = t < CUE.greySit || (t >= CUE.home && t < CUE.greyOff);
      face(grey, t, sleepy ? 'sleepy' : t < CUE.greyLook ? 'neutral' : t < CUE.drop ? 'surprised' : t < CUE.title - 0.2 ? 'determined' : 'happy', 1.3);
      // grey's blanket: pulled over his head after the first snooze
      const cover = smoothstep(clamp((t - (CUE.snooze1 + 0.15)) / 0.4, 0, 1)) * (1 - smoothstep(clamp((t - CUE.greySit) / 0.4, 0, 1))) * (t < CUE.home ? 1 : 0);
      const off = t >= CUE.greySit && t < CUE.home ? 1 : t >= CUE.greyUp ? smoothstep(clamp((t - CUE.greyUp) / 0.4, 0, 1)) : 0;
      const bb = blankets.grey;
      bb.scale.set(1, lerp(1, 1.2, cover) * (1 - off * 0.2), lerp(lerp(1.6, 1.95, cover), 0.55, off));
      bb.position.set(BED_X.grey, lerp(0.74, 0.78, cover) - off * 0.05, lerp(lerp(-0.15, -0.33, cover), 0.4, off));

      // mini gold jogging past the window every "day" of the montage
      for (const b0 of [7.2, 9.15, 11.1, 13.05]) {
        const u = (t - b0) / 1.3;
        if (u >= 0 && u <= 1) {
          mini.root.visible = true;
          mini.root.position.set(lerp(-5, 5, u), 0, -6.2);
          mini.root.rotation.set(0, PI / 2, 0);
          mini.applyPose(sprint(t), t);
          face(mini, t, 'determined');
        }
      }

      // ---------------- comic + tags ----------------
      const hG = headPos(grey);
      if (t >= CUE.ring1 && t < CUE.ring1 + 0.9) em.push({ kind: 'comic', key: 'RING!', color: '#ff4d5e', pos: new THREE.Vector3(0, 2.15, -1.3), age: t - CUE.ring1, life: 0.9, size: 0.9 });
      if (t >= CUE.home && t < CUE.home + 0.8) em.push({ kind: 'comic', key: 'RING!', color: '#ff4d5e', pos: new THREE.Vector3(-2.1, 1.45, -1.3), age: t - CUE.home, life: 0.8, size: 0.48 });
      for (const s of CUE.snoozes.slice(1, 3)) if (t >= s - 0.38 && t < s + 0.4) em.push({ kind: 'comic', key: 'RING!', color: '#ff4d5e', pos: new THREE.Vector3(-2.1, 1.45, -1.3), age: t - s + 0.38, life: 0.78, size: 0.42 });
      if (t >= CUE.montage + 0.4 && t < CUE.brk) em.push({ kind: 'emote', key: 'zzz', pos: new THREE.Vector3(-1.2, 1.5 + 0.1 * sin(t * 2), -0.9), age: (t - CUE.montage) % 1.6, life: 1.7, size: 0.5 });
      if (t >= CUE.greyLook + 0.1 && t < CUE.drop) em.push({ kind: 'emote', key: '!?', pos: hG.clone().add(new THREE.Vector3(0.35, 0.55, 0)), age: t - CUE.greyLook - 0.1, life: 1.0, size: 0.45 });
      if (t >= CUE.snooze1 + 0.1 && t < 3.6) tags.push({ pos: new THREE.Vector3(-0.95, 1.25, -0.6), text: '5 more minutes…', op: win(t, CUE.snooze1 + 0.1, 3.6, 0.2, 0.3), pop: t - CUE.snooze1 - 0.1, style: 'speech' });
      for (const s of CUE.snoozes.slice(1, 3)) if (t >= s && t < s + 1.0) tags.push({ pos: new THREE.Vector3(-1.85, 0.95 + (t - s) * 0.4, -1.2), text: '+5 MIN', op: clamp(1 - (t - s - 0.5) / 0.5, 0, 1), pop: t - s });
      if (t < CUE.medium) {
        labels.push({ char: grey, text: 'SNOOZE', style: LABEL_STYLE.grey, op: win(t, 0.4, CUE.medium, 0.3, 0.2), off: new THREE.Vector3(0, 0.9, 0) });
        labels.push({ char: gold, text: 'WAKE UP', style: LABEL_STYLE.gold, op: win(t, 0.6, CUE.gWalk + 0.6, 0.3, 0.3), off: new THREE.Vector3(0, 0.9, 0) });
      }
    } else {
      // ================= PARK =================
      const pu = clamp((t - CUE.drop) / (CUE.home - CUE.drop), 0, 1);
      sun.position.set(6, 12, 6); sun.intensity = 2.4; hemi.intensity = 1.15;
      key.position.set(-2, 6, 8); key.intensity = 0.7;
      scene.fog = new THREE.Fog('#d9f0ff', 40, 140);
      player.bloom.strength = 0.22; player.bloom.threshold = 0.93;
      grey.root.visible = false;
      let gz;
      if (t < CUE.tape) gz = lerp(0, FINISH_Z, (t - CUE.drop) / (CUE.tape - CUE.drop));
      else gz = kf(t, [[CUE.tape, FINISH_Z], [19.1, FINISH_Z - 3.6, 'out']]);
      sun.target.position.set(0, 0, gz);
      const facing = PI;
      gold.root.position.set(0, 0, gz); gold.root.rotation.set(0, facing, 0); gold.root.visible = true;
      const pose = seq(t, [
        [CUE.drop, (lt) => sprint(lt)],
        [19.05, (lt) => walkP(lt, 1.4, 0.6)],
        [19.45, cheer],
        [CUE.medal, handsOnHips],
        [CUE.point, pointAt],
        [23.6, beckon],
      ], 0.25);
      gold.applyPose(pose, t);
      face(gold, t, t < 19.4 ? 'determined' : 'happy', 0.4);
      medal.visible = t >= CUE.medal;
      medal.scale.setScalar(easeOutBack(clamp((t - CUE.medal) / 0.35, 0, 1)));
      // tape snaps open when he hits it
      const br = smoothstep(clamp((t - CUE.tape) / 0.35, 0, 1));
      tapeL.rotation.set(0, -br * 1.4, -br * 0.5); tapeR.rotation.set(0, br * 1.4, br * 0.5);
      balloons.forEach((b) => { const d = b.userData; b.position.set(d.x + sin(t * 1.3 + d.ph) * 0.08, d.y + sin(t * 2 + d.ph) * 0.08, FINISH_Z); });
      const ev = [];
      for (let ts = CUE.drop + 0.05; ts < CUE.tape + 0.4; ts += 0.217) ev.push({ t: ts, type: 'dust', pos: [0, 0.05, lerp(0, FINISH_Z, clamp((ts - CUE.drop) / (CUE.tape - CUE.drop), 0, 1)) + 0.3], seed: floor(ts * 100) });
      ev.push({ t: CUE.tape, type: 'confetti', pos: [0, 2.6, FINISH_Z], seed: 41 }, { t: CUE.tape + 0.25, type: 'confetti', pos: [-1.4, 3.2, FINISH_Z], seed: 42 }, { t: CUE.tape + 0.45, type: 'confetti', pos: [1.4, 3.2, FINISH_Z], seed: 43 });
      ev.push({ t: CUE.medal, type: 'sparkle', pos: [0, 1.5, FINISH_Z - 3.5], seed: 44 }, { t: CUE.point, type: 'sparkle', pos: [0.2, 1.7, FINISH_Z - 3.2], seed: 45 });
      particles.update(ev, t);
      labels.push({ char: gold, text: 'DAY 365', style: LABEL_STYLE.gold, op: win(t, CUE.medal + 0.2, CUE.home, 0.3, 0.2), off: new THREE.Vector3(0, 0.95, 0) });
    }
    if (!inPark) {
      const ev = [
        { t: CUE.gWake + 0.2, type: 'impact', pos: [1.85, 0.8, -1.45], seed: 1 },
        ...CUE.snoozes.map((s, i) => ({ t: s, type: 'impact', pos: [-1.85, 0.8, -1.45], seed: 2 + i })),
        { t: CUE.greyOff, type: 'stars', pos: [-1.85, 0.85, -1.45], seed: 20 },
        { t: CUE.curtains + 0.2, type: 'sparkle', pos: [0, 2.6, -1.8], seed: 21 },
        { t: CUE.title + 0.3, type: 'confetti', pos: [0, 2.6, -1.2], seed: 22 },
      ];
      particles.update(ev, t);
    }
    sprites.update(em);

    // ---------------- camera ----------------
    let pos, lk, fov = 50;
    if (t < CUE.medium) {
      pos = v3(kf(t, [[0, [0.35, 2.2, 7.2]], [CUE.medium, [0.45, 2.1, 6.6]]]));
      lk = new THREE.Vector3(0.4, 1.15, -0.8);
    } else if (t < CUE.montage) {
      pos = v3(kf(t, [[CUE.medium, [-0.1, 2.75, 1.4]], [CUE.montage, [-0.2, 2.65, 1.1]]]));
      lk = new THREE.Vector3(-1.15, 0.8, -1.4);
      fov = 46;
    } else if (t < CUE.brk) {
      pos = v3(kf(t, [[CUE.montage, [0.2, 2.3, 7.4]], [CUE.brk, [-0.45, 2.0, 5.0]]]));
      lk = v3(kf(t, [[CUE.montage, [-0.3, 1.55, -1.4]], [CUE.brk, [-0.95, 1.4, -1.2]]]));
    } else if (t < CUE.drop) {
      pos = v3(kf(t, [[CUE.brk, [-0.35, 1.85, 2.3]], [CUE.drop, [-0.45, 1.8, 1.85]]]));
      lk = new THREE.Vector3(-1.2, 1.3, -0.7);
      fov = 44;
    } else if (t < 17.0) {
      const gz = lerp(0, FINISH_Z, (t - CUE.drop) / (CUE.tape - CUE.drop));
      pos = new THREE.Vector3(1.4, 1.25, gz - 5.8);
      lk = new THREE.Vector3(0, 1.1, gz);
      pos.add(shake(t, CUE.drop, 0.12, 0.5));
      fov = 50;
    } else if (t < CUE.medal) {
      // beyond the finish line: he runs at us and bursts through the tape
      pos = v3(kf(t, [[17.0, [2.3, 1.25, FINISH_Z - 7.6]], [CUE.medal, [1.7, 1.15, FINISH_Z - 7.2]]]));
      lk = v3(kf(t, [[17.0, [0, 1.5, FINISH_Z + 1.0]], [CUE.tape, [0, 1.5, FINISH_Z - 0.5]], [CUE.medal, [0, 1.5, FINISH_Z - 3.0]]]));
      pos.add(shake(t, CUE.tape, 0.08, 0.4));
      fov = 48;
    } else if (t < CUE.point) {
      const a = kf(t, [[CUE.medal, 34], [CUE.point, -12]]) * DEG;
      const c = new THREE.Vector3(0, 1.2, FINISH_Z - 3.6);
      pos = c.clone().add(new THREE.Vector3(sin(a) * 3.9, 0.15, -cos(a) * 3.9));
      lk = c.clone().add(new THREE.Vector3(0, 0.45, 0));
      fov = 46;
    } else if (t < CUE.home) {
      pos = v3(kf(t, [[CUE.point, [0.25, 1.7, FINISH_Z - 7.7]], [CUE.home, [0.1, 1.65, FINISH_Z - 6.6]]]));
      lk = new THREE.Vector3(0, 1.5, FINISH_Z - 3.6);
      fov = 44;
    } else if (t < CUE.greyStand) {
      pos = v3(kf(t, [[CUE.home, [-0.1, 2.75, 1.5]], [CUE.greyStand, [-0.1, 2.8, 1.9]]]));
      lk = new THREE.Vector3(-1.2, 1.0, -1.0);
      pos.add(shake(t, CUE.home, 0.03, 0.3));
      fov = 46;
    } else if (t < CUE.title - 0.2) {
      pos = v3(kf(t, [[CUE.greyStand, [1.0, 2.2, 5.4]], [CUE.title - 0.2, [0.45, 2.05, 3.4]]]));
      lk = new THREE.Vector3(-0.2, 1.8, -1.8);
      fov = 48;
    } else {
      pos = v3(kf(t, [[CUE.title - 0.2, [0.0, 1.85, 2.6]], [CUE.end, [0.0, 2.2, 6.0], 'io']]));
      lk = v3(kf(t, [[CUE.title - 0.2, [0, 1.75, -1.3]], [CUE.end, [0, 1.6, -1.4]]]));
      fov = 48;
    }
    aimCam(pos, lk, fov);
    where = inPark ? 'park' : 'room';
  }

  const tmp = new THREE.Vector3();
  const aspect = player.width / player.height;
  const project = (p) => { tmp.copy(p).project(camera); return tmp.z > 1 ? null : { x: tmp.x * aspect, y: tmp.y }; };
  const SPEECH = { size: 44, weight: 700, spacing: 0.04, color: '#2a2a35', shadow: 0, pill: 'rgba(255,255,255,0.95)' };
  const PILL = { size: 44, weight: 900, spacing: 0.12, color: '#ffffff', shadow: 0, pill: 'rgba(255,77,94,0.95)' };
  return {
    warmTimes: [1, 10, 17, 27],
    update(t) { update(t); return {}; },
    overlay(t) {
      update(t);
      camera.updateMatrixWorld();
      const hud = [];
      for (const l of labels) {
        if (l.op <= 0.002 || !l.char.root.visible) continue;
        const s = project(headPos(l.char).add(l.off));
        if (!s) continue;
        const halfW = 0.0175 * l.text.length + 0.05;
        hud.push({ text: l.text, style: l.style, x: clamp(s.x, -aspect + halfW, aspect - halfW), y: clamp(s.y, -0.92, 0.92), height: 0.0175, opacity: l.op, scale: 0.85 + 0.15 * easeOutBack(clamp(l.op, 0, 1)) });
      }
      for (const w of tags) {
        if (w.op <= 0.01) continue;
        const s = project(w.pos);
        if (!s) continue;
        const halfW = 0.021 * w.text.length + 0.06;
        hud.push({ text: w.text, style: w.style === 'speech' ? SPEECH : PILL, x: clamp(s.x, -aspect + halfW, aspect - halfW), y: s.y, height: 0.022, opacity: w.op, scale: 0.6 + 0.4 * easeOutBack(clamp((w.pop ?? 1) / 0.3, 0, 1)) });
      }
      // hook
      const hk = win(t, 0.05, 3.7, 0.25, 0.35);
      if (hk > 0) {
        hud.push({ text: 'THIS IS HOW YOU', style: { size: 80, weight: 900, spacing: 0.08, color: '#ffffff', shadow: 0.8 }, x: 0, y: 0.74, height: 0.033, opacity: hk, scale: 0.9 + 0.1 * easeOutBack(clamp(t / 0.35, 0, 1)) });
        hud.push({ text: 'LOSE A YEAR…', style: { size: 96, weight: 900, spacing: 0.08, color: '#ffcf33', shadow: 0.8 }, x: 0, y: 0.63, height: 0.045, opacity: win(t, 0.45, 3.7, 0.25, 0.35), scale: 0.8 + 0.2 * easeOutBack(clamp((t - 0.45) / 0.4, 0, 1)) });
      }
      // snooze counter
      const n = snoozeCount(t);
      if (t >= CUE.montage && t < CUE.drop && n > 0) hud.push({ text: `SNOOZE ×${n}`, style: PILL, x: -aspect + 0.3, y: 0.82, height: 0.024, opacity: win(t, CUE.montage, CUE.drop, 0.25, 0.2), scale: 1 + 0.25 * clamp(1 - (t - CUE.snoozes[n - 1]) / 0.25, 0, 1) });
      if (t >= CUE.yearLater) {
        const op = win(t, CUE.yearLater, CUE.drop, 0.25, 0.1);
        hud.push({ text: '1 YEAR LATER…', style: { size: 96, weight: 900, spacing: 0.1, color: '#ffffff', shadow: 0.85 }, x: 0, y: 0.6, height: 0.045, opacity: op, scale: 0.85 + 0.15 * easeOutBack(clamp((t - CUE.yearLater) / 0.4, 0, 1)) });
      }
      const t1 = t - CUE.title, t2 = t - CUE.title2;
      if (t1 > 0) hud.push({ text: 'WAKE UP.', style: { size: 120, weight: 900, spacing: 0.12, color: '#ffffff', shadow: 0.8 }, x: 0, y: 0.68, height: 0.06, opacity: clamp(t1 / 0.2, 0, 1), scale: 0.8 + 0.2 * easeOutBack(clamp(t1 / 0.4, 0, 1)) });
      if (t2 > 0) hud.push({ text: "YOUR DREAMS WON'T WAIT.", style: { size: 80, weight: 900, spacing: 0.08, color: '#ffcf33', shadow: 0.8 }, x: 0, y: 0.56, height: 0.03, opacity: clamp(t2 / 0.2, 0, 1), scale: 0.7 + 0.3 * easeOutBack(clamp(t2 / 0.4, 0, 1)) });
      return {
        hud,
        overlays: [
          { type: 'fade', amount: max(1 - t / 0.3, clamp((t - (CUE.end - 0.55)) / 0.5, 0, 1)) },
          { type: 'flash', amount: 0.9 * (t >= CUE.drop ? clamp(1 - (t - CUE.drop) / 0.3, 0, 1) : 0) },
          { type: 'flash', amount: 0.5 * (t >= CUE.tape ? clamp(1 - (t - CUE.tape) / 0.3, 0, 1) : 0) },
          { type: 'flash', amount: 0.45 * (t >= CUE.home ? clamp(1 - (t - CUE.home) / 0.25, 0, 1) : 0) },
          { type: 'flash', amount: 0.35 * (t >= CUE.curtains + 0.1 ? clamp(1 - (t - CUE.curtains - 0.1) / 0.6, 0, 1) : 0) },
        ],
      };
    },
  };
}
