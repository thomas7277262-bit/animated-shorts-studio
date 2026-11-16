// Night horror sets for "Four Knocks" (Don't Answer the Door After Midnight).
//   nightstreet – a quiet street of barred houses under a big moon; windows go dark at midnight
//   knockhouse  – Ben's house: the front hall (door with three locks) around the origin,
//                 and his bedroom (bed, desk, closet) around BEDROOM
//   grandmaroom – Grandma's warm living room with a fireplace (the "safe" contrast)
// State keys (scene.env + envEvents):
//   power   true/false     – house windows / street lamps (nightstreet)
//   knock   <time s>       – door shakes for 0.35 s after this time (knockhouse)
//   closet  <time s>       – closet doors rattle after this time
//   visitor true/false     – light strip under the front door with two feet-shaped gaps
//   flicker true/false     – hall lamp flickers
//   eyes    true/false     – two glowing eyes in the dark closet gap
//   phone   true/false     – blue phone glow on Ben's face (bedroom)
import * as THREE from 'three';
import { Rng } from '../rng.js';
import { mat, mesh, box, sky, ground, tree } from './common.js';

export const BEDROOM = [24, 0];
const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o });
const glowM = (color, i = 1.5) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: i, roughness: 0.6 });
const smooth = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });
const NIGHT = (o = {}) => ({ sun: '#8fa6ff', sunI: 0.75, hemiSky: '#4a5a9a', hemiGround: '#141826', hemiI: 0.85, dir: [-8, 14, 6], ...o });

function moon(g, x, y, z, r = 9) {
  g.add(mesh(new THREE.SphereGeometry(r, 24, 16), basic('#f4f1dc', { fog: false }), { x, y, z, cast: false }));
  g.add(mesh(new THREE.SphereGeometry(r * 1.6, 24, 16), basic('#8ea4ff', { transparent: true, opacity: 0.12, fog: false, depthWrite: false }), { x, y, z, cast: false }));
}
function bareTree(rng, x, z, s = 1) {
  const t = new THREE.Group();
  const bark = mat('#2a2230');
  t.add(mesh(new THREE.CylinderGeometry(0.18 * s, 0.3 * s, 4 * s, 6), bark, { y: 2 * s }));
  for (let i = 0; i < 5; i++) {
    const a = rng.float(0, Math.PI * 2), l = rng.float(1.2, 2.2) * s;
    const b = mesh(new THREE.CylinderGeometry(0.05 * s, 0.1 * s, l, 5), bark, { y: rng.float(2.6, 3.8) * s, rz: 0.9 * Math.cos(a), rx: 0.9 * Math.sin(a) });
    b.position.x += Math.sin(0.9 * Math.cos(a)) * -l * 0.4; b.position.z += Math.sin(0.9 * Math.sin(a)) * l * 0.4;
    t.add(b);
  }
  t.position.set(x, 0, z);
  return t;
}
// house front with barred, lit windows (windows collected for the power switch)
function creepyHouse(rng, x, z, ry, wins) {
  const h = new THREE.Group();
  const wall = rng.pick(['#4a4f66', '#5a4e5e', '#3f4a5a', '#56505a']);
  h.add(box(6, 4.2, 5, wall, { base: true }));
  h.add(mesh(new THREE.ConeGeometry(4.6, 2.6, 4), mat('#23202c'), { y: 5.5, ry: Math.PI / 4, s: [1, 1, 0.8] }));
  h.add(box(1.3, 2.4, 0.12, '#2a1e18', { base: true, z: 2.52 }));
  for (const wx of [-1.9, 1.9]) {
    const w = box(1.2, 1.2, 0.08, glowM('#ffb85a', 1.4), { x: wx, y: 2.4, z: 2.52, cast: false });
    wins.push(w); h.add(w);
    for (let k = 0; k < 4; k++) h.add(box(0.06, 1.3, 0.06, '#151515', { x: wx - 0.45 + k * 0.3, y: 2.4, z: 2.6 }));
  }
  const up = box(1.0, 1.0, 0.08, glowM('#ffb85a', 1.2), { x: 0, y: 5.0, z: 1.9, cast: false });
  wins.push(up); h.add(up);
  h.position.set(x, 0, z); h.rotation.y = ry;
  return h;
}

// ------------------------------------------------------------------ the street
export function nightstreet(seed) {
  const rng = new Rng(seed);
  const g = new THREE.Group();
  g.add(sky('#03050f', '#141c3a', '#0c1024', new THREE.Vector3(0.3, 0.35, -1)));
  moon(g, 40, 60, -160, 12);
  g.add(ground('#1d2a22', 260, seed, { flatRadius: 40, bumps: 0.05 }));
  g.add(box(200, 0.03, 6, '#22252c', { y: 0.02, z: 0, cast: false }));
  g.add(box(200, 0.15, 2.4, '#3a3d44', { y: 0.07, z: -4.2, cast: false }));
  g.add(box(200, 0.15, 2.4, '#3a3d44', { y: 0.07, z: 4.2, cast: false }));
  const wins = [], lamps = [];
  for (let i = -5; i <= 5; i++) {
    g.add(creepyHouse(rng, i * 9, -11, 0, wins));
    if (Math.abs(i) > 0) g.add(creepyHouse(rng, i * 9 + 4, 12, Math.PI, wins));
  }
  for (let i = -5; i <= 5; i++) {
    const L = new THREE.Group();
    L.add(box(0.15, 4.2, 0.15, '#1b1b22', { base: true }));
    L.add(box(0.9, 0.12, 0.15, '#1b1b22', { y: 4.2, x: 0.35 }));
    const bulb = mesh(new THREE.SphereGeometry(0.2, 10, 8), glowM('#ffcf7a', 2.2), { x: 0.75, y: 4.0, cast: false });
    L.add(bulb); lamps.push(bulb);
    L.position.set(i * 9 + 4.5, 0, -3.4); g.add(L);
  }
  for (let i = 0; i < 10; i++) g.add(bareTree(rng, rng.float(-50, 50), rng.pick([-6.5, 6.5]) + rng.float(-0.5, 0.5), rng.float(0.9, 1.3)));
  // low mist
  for (let i = 0; i < 14; i++) {
    const m = mesh(new THREE.SphereGeometry(rng.float(3, 6), 10, 6), basic('#8b97c4', { transparent: true, opacity: 0.06, depthWrite: false }), { x: rng.float(-40, 40), y: 0.4, z: rng.float(-8, 8), s: [2, 0.25, 1], cast: false });
    m.userData.drive = { offset: rng.float(0, 80), speed: 0.6, range: 90 }; g.add(m);
  }
  const lampLight = new THREE.PointLight('#ffcf7a', 10, 14, 2); lampLight.position.set(4.5, 3.8, -2.6); g.add(lampLight);
  function update(t, st) {
    const on = st.power !== false;
    for (const w of wins) w.material.emissiveIntensity = on ? 1.4 : 0.0;
    for (const w of wins) w.material.color.set(on ? '#ffb85a' : '#101218');
    for (const b of lamps) b.material.emissiveIntensity = on ? 2.2 : 0.0;
    lampLight.intensity = on ? 10 : 0;
  }
  return { group: g, update, light: NIGHT(), fog: ['#0e1430', 20, 140] };
}

// ------------------------------------------------------------------ Ben's house
export function knockhouse(seed) {
  const rng = new Rng(seed);
  const g = new THREE.Group();
  g.add(sky('#03050f', '#0e1430', '#0e1430'));
  // ---- front hall around the origin; the front door is on the back wall at z = -4
  g.add(box(12, 0.2, 12, '#3a2a22', { y: -0.1, z: 0, cast: false }));
  for (let i = 0; i < 10; i++) g.add(box(0.03, 0.01, 12, '#2b1f19', { x: -5.4 + i * 1.2, y: 0.005, cast: false }));
  g.add(box(12, 6, 0.3, '#3b4256', { base: true, z: -4.15 }));
  g.add(box(0.3, 6, 12, '#363c4f', { base: true, x: -4.5 }));
  g.add(box(0.3, 6, 12, '#363c4f', { base: true, x: 4.5 }));
  g.add(box(12, 0.3, 12, '#2a2e3c', { y: 6.0 }));
  for (const sx of [-1, 1]) g.add(box(5, 0.5, 0.35, '#262a36', { x: sx * 3.5, y: 0.25, z: -3.95 }));   // skirting (gap at the door)
  // the front door (pivot group so it can shake), three brass locks, peephole
  const door = new THREE.Group();
  door.add(box(1.7, 3.2, 0.14, '#4a2c1c', { base: true }));
  for (const [y, h] of [[0.9, 1.0], [2.35, 1.0]]) door.add(box(1.2, h, 0.04, '#5a3624', { y, z: 0.09 }));
  const brass = smooth('#d4a64a', { metalness: 0.7, roughness: 0.3 });
  for (const y of [1.25, 1.75, 2.25]) {
    door.add(box(0.26, 0.16, 0.08, brass, { x: 0.6, y, z: 0.11 }));
    door.add(box(0.36, 0.06, 0.05, brass, { x: 0.83, y, z: 0.12 }));
  }
  door.add(mesh(new THREE.SphereGeometry(0.08, 10, 8), brass, { x: 0.62, y: 1.45, z: 0.18 }));         // handle knob
  door.add(box(0.22, 0.04, 0.04, brass, { x: 0.55, y: 1.45, z: 0.2 }));
  door.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 10), smooth('#111'), { y: 2.65, z: 0.1, rx: Math.PI / 2 }));
  door.position.set(0, 0, -3.98);
  g.add(door);
  g.add(box(2.0, 0.2, 0.2, '#2a1a12', { y: 3.3, z: -3.95 }));
  for (const sx of [-1, 1]) g.add(box(0.18, 3.4, 0.2, '#2a1a12', { base: true, x: sx * 0.95, z: -3.95 }));
  // light strip under the door + feet-shaped gaps (visitor)
  const strip = mesh(new THREE.PlaneGeometry(1.6, 0.07), basic('#ffd9a0'), { y: 0.04, z: -3.86, cast: false });
  const feet = [-0.3, 0.3].map((x) => mesh(new THREE.PlaneGeometry(0.28, 0.08), basic('#000000'), { x, y: 0.04, z: -3.855, cast: false }));
  const spill = mesh(new THREE.PlaneGeometry(1.6, 0.9), basic('#ffb870', { transparent: true, opacity: 0.25, depthWrite: false }), { y: 0.012, z: -3.45, rx: -Math.PI / 2, cast: false });
  spill.visible = false;
  g.add(strip, ...feet);
  // small barred window beside the door showing moonlight
  g.add(box(1.0, 1.4, 0.06, glowM('#5a72c8', 0.5), { x: -2.4, y: 2.4, z: -3.98, cast: false }));
  for (let k = 0; k < 4; k++) g.add(box(0.05, 1.5, 0.06, '#0d0d10', { x: -2.75 + k * 0.23, y: 2.4, z: -3.92 }));
  // coat rack, side table with old phone, framed photos, stairs going up on the right
  g.add(box(0.1, 2.0, 0.1, '#2b1f19', { base: true, x: -3.6, z: -3.2 }));
  for (let i = 0; i < 3; i++) g.add(box(0.6, 0.9, 0.25, ['#5a3c3c', '#3c4a5a', '#4a4a3a'][i], { x: -3.6 + (i - 1) * 0.25, y: 1.5, z: -3.0 + i * 0.05 }));
  g.add(box(1.2, 0.9, 0.5, '#3a2a22', { base: true, x: 2.6, z: -3.5 }));
  for (let i = 0; i < 3; i++) g.add(box(0.6, 0.8, 0.05, '#c9b48e', { x: -1.6 + i * 1.6 - (i === 1 ? 0 : 0), y: 4.4, z: -3.98 }));
  for (let i = 0; i < 9; i++) g.add(box(1.4, 0.3, 0.6, '#3a2a22', { x: 3.6, y: 0.15 + i * 0.32, z: 2.5 - i * 0.55 }));
  // hall lamp (flickers)
  const shade = mesh(new THREE.ConeGeometry(0.45, 0.4, 12, 1, true), smooth('#c9b48e', { side: THREE.DoubleSide }), { y: 5.4, z: -1.5 });
  const bulb = mesh(new THREE.SphereGeometry(0.14, 10, 8), glowM('#ffcf8a', 2), { y: 5.3, z: -1.5, cast: false });
  g.add(box(0.03, 0.5, 0.03, '#222', { y: 5.85, z: -1.5 }), shade, bulb);
  const hallLight = new THREE.PointLight('#ffcf8a', 16, 14, 2); hallLight.position.set(0, 5.0, -1.4); g.add(hallLight);
  const moonFill = new THREE.PointLight('#6f86d8', 9, 12, 2); moonFill.position.set(-2.4, 2.4, -2.8); g.add(moonFill);

  // ---- Ben's bedroom around BEDROOM (camera looks toward -z as usual)
  const [bx, bz] = BEDROOM;
  const room = new THREE.Group();
  room.add(box(10, 0.2, 10, '#2c3448', { y: -0.1, cast: false }));
  room.add(box(10, 5.5, 0.3, '#2d3550', { base: true, z: -4.15 }));
  room.add(box(0.3, 5.5, 10, '#283049', { base: true, x: -4.6 }));
  room.add(box(0.3, 5.5, 10, '#283049', { base: true, x: 4.6 }));
  room.add(box(10, 0.3, 10, '#1f2538', { y: 5.5 }));
  // bed (left), with blanket and pillow
  room.add(box(2.2, 0.6, 3.6, '#4a3a2e', { base: true, x: -2.9, z: -1.6 }));
  room.add(box(2.1, 0.25, 3.0, '#3f5fa8', { x: -2.9, y: 0.72, z: -1.3 }));
  room.add(box(1.2, 0.25, 0.6, '#e8e6f0', { x: -2.9, y: 0.75, z: -3.0 }));
  room.add(box(2.2, 1.4, 0.15, '#4a3a2e', { base: true, x: -2.9, z: -3.45 }));
  // desk with notebook (tally marks) and a lamp off
  room.add(box(1.6, 0.08, 0.8, '#5a4636', { x: 2.9, y: 1.1, z: 2.2 }));
  for (const [lx, lz] of [[-0.7, -0.3], [0.7, -0.3], [-0.7, 0.3], [0.7, 0.3]]) room.add(box(0.06, 1.1, 0.06, '#3a2c22', { x: 2.9 + lx, y: 0.55, z: 2.2 + lz }));
  const nb = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.4), new THREE.MeshStandardMaterial({ map: tallyTexture(), roughness: 0.9 }));
  nb.rotation.x = -Math.PI / 2; nb.position.set(2.8, 1.15, 2.15); room.add(nb);
  // window with bars and moonlight (right wall)
  room.add(box(0.06, 1.6, 1.4, glowM('#5a72c8', 0.55), { x: 4.43, y: 2.9, z: -0.5, cast: false }));
  for (let k = 0; k < 5; k++) room.add(box(0.06, 1.7, 0.05, '#0d0d10', { x: 4.38, y: 2.9, z: -1.05 + k * 0.28 }));
  // the closet: back wall, two tall doors slightly open with a black gap and hidden eyes
  const closet = new THREE.Group();
  closet.add(box(2.6, 3.8, 0.9, '#20263a', { base: true, z: -0.3 }));
  closet.add(box(0.5, 3.6, 0.05, '#000000', { base: true, z: 0.16 }));
  const doorL = new THREE.Group(), doorR = new THREE.Group();
  doorL.add(box(1.05, 3.6, 0.08, '#e6dccb', { base: true, x: 0.525 })); doorL.add(mesh(new THREE.SphereGeometry(0.05, 8, 6), smooth('#b8902f', { metalness: 0.6 }), { x: 0.95, y: 1.7, z: 0.07 }));
  doorR.add(box(1.05, 3.6, 0.08, '#e6dccb', { base: true, x: -0.525 })); doorR.add(mesh(new THREE.SphereGeometry(0.05, 8, 6), smooth('#b8902f', { metalness: 0.6 }), { x: -0.95, y: 1.7, z: 0.07 }));
  for (const d of [doorL, doorR]) for (let k = 0; k < 6; k++) d.add(box(0.85, 0.04, 0.02, '#cfc3ae', { x: d === doorL ? 0.525 : -0.525, y: 0.6 + k * 0.45, z: 0.05 }));
  doorL.position.set(-1.3, 0, 0.2); doorR.position.set(1.3, 0, 0.2);
  doorL.rotation.y = -0.16; doorR.rotation.y = 0.16;
  closet.add(doorL, doorR);
  const eyes = [-0.09, 0.09].map((x) => mesh(new THREE.SphereGeometry(0.04, 10, 8), basic('#ff2a2a'), { x, y: 2.55, z: 0.19, cast: false }));
  for (const e of eyes) { e.visible = false; closet.add(e); }
  closet.position.set(0.6, 0, -3.6);
  room.add(closet);
  // rug, toys, nightlight
  room.add(mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.03, 20), smooth('#5a3a6a'), { x: 0.2, y: 0.02, z: 0.4, cast: false }));
  room.add(box(0.4, 0.4, 0.4, '#c0392b', { base: true, x: 1.6, z: 1.6, ry: 0.4 }));
  const nl = mesh(new THREE.SphereGeometry(0.1, 10, 8), glowM('#9fe0ff', 1.6), { x: -1.4, y: 0.4, z: -3.95, cast: false }); room.add(nl);
  room.position.set(bx, 0, bz);
  g.add(room);
  const roomMoon = new THREE.PointLight('#7a90e6', 11, 12, 2); roomMoon.position.set(bx + 3.6, 3.2, bz - 0.5); g.add(roomMoon);
  const roomFill = new THREE.PointLight('#6a7ac0', 16, 16, 2); roomFill.position.set(bx, 4.6, bz + 2.5); g.add(roomFill);
  const phoneLight = new THREE.PointLight('#8fd0ff', 0, 3, 2); g.add(phoneLight);

  function update(t, st) {
    // door shake on a knock (two quick jolts)
    const dk = t - (st.knock ?? -99);
    const jolt = dk >= 0 && dk < 0.35 ? Math.sin(dk * 60) * (1 - dk / 0.35) : 0;
    door.position.z = -3.98 + jolt * 0.035; door.rotation.z = jolt * 0.006;
    const ck = t - (st.closet ?? -99);
    const cj = ck >= 0 && ck < 0.35 ? Math.sin(ck * 55) * (1 - ck / 0.35) : 0;
    doorL.rotation.y = -0.16 - cj * 0.06; doorR.rotation.y = 0.16 + cj * 0.06;
    const vis = !!st.visitor;
    strip.visible = vis; for (const f of feet) f.visible = vis;
    const fl = st.flicker ? (Math.sin(t * 37) + Math.sin(t * 91) > 0.6 ? 0.15 : 1) : 1;
    hallLight.intensity = (st.hall === false ? 0 : 16) * fl; bulb.material.emissiveIntensity = (st.hall === false ? 0 : 2) * fl;
    for (const e of eyes) e.visible = !!st.eyes;
    phoneLight.intensity = st.phone ? 1.6 : 0;
    phoneLight.position.set(st.phoneAt?.[0] ?? bx - 1.4, st.phoneAt?.[2] ?? 1.6, st.phoneAt?.[1] ?? bz + 0.4);
  }
  return { group: g, update, light: NIGHT({ sunI: 0.6, hemiI: 1.45, hemiSky: '#6a7ac0', hemiGround: '#2a2a3a' }), fog: ['#0a0e20', 25, 90], interior: true };
}

function tallyTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 384;
  const g = c.getContext('2d');
  g.fillStyle = '#f2ecd8'; g.fillRect(0, 0, 512, 384);
  g.strokeStyle = '#9fb6d8'; g.lineWidth = 2; for (let y = 40; y < 384; y += 34) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  g.strokeStyle = '#1b1b1b'; g.lineWidth = 6;
  for (let row = 0; row < 8; row++) for (let grp = 0; grp < 5; grp++) {
    const x0 = 30 + grp * 95, y0 = 50 + row * 40;
    const n = (row * 5 + grp) % 7 === 3 ? 4 : 3;              // mostly threes… and a few fours
    for (let k = 0; k < n; k++) { g.beginPath(); g.moveTo(x0 + k * 16, y0); g.lineTo(x0 + k * 16, y0 + 26); g.stroke(); }
    if (n === 4) { g.strokeStyle = '#c0141c'; g.beginPath(); g.arc(x0 + 24, y0 + 13, 30, 0, Math.PI * 2); g.stroke(); g.strokeStyle = '#1b1b1b'; }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// ------------------------------------------------------------------ Grandma's room
export function grandmaroom(seed) {
  const rng = new Rng(seed);
  const g = new THREE.Group();
  g.add(sky('#03050f', '#0e1430', '#0e1430'));
  g.add(box(12, 0.2, 10, '#5a3a24', { y: -0.1, cast: false }));
  g.add(box(12, 6, 0.3, '#7a4e3a', { base: true, z: -4.15 }));
  for (const sx of [-1, 1]) g.add(box(0.3, 6, 10, '#6e4634', { base: true, x: sx * 5.5 }));
  g.add(box(12, 0.3, 10, '#3a2618', { y: 6 }));
  // wallpaper stripes
  for (let i = 0; i < 16; i++) g.add(box(0.12, 5.6, 0.02, '#8a5c46', { x: -5.4 + i * 0.72, y: 3, z: -3.98, cast: false }));
  // fireplace with fire
  const fp = new THREE.Group();
  fp.add(box(3.0, 2.6, 0.8, '#7a6a5a', { base: true }));
  fp.add(box(1.8, 1.4, 0.82, '#140c08', { base: true, y: 0.2 }));
  fp.add(box(3.4, 0.2, 1.0, '#5a4a3a', { y: 2.7 }));
  const flames = [];
  for (let i = 0; i < 5; i++) { const f = mesh(new THREE.ConeGeometry(0.18, 0.6, 6), glowM(i % 2 ? '#ffb02e' : '#ff6a1a', 2.4), { x: -0.5 + i * 0.25, y: 0.55, z: 0.25, cast: false }); f.userData.bob = i * 1.7; f.userData.bobBase = 0.55; fp.add(f); flames.push(f); }
  fp.position.set(0, 0, -3.8);
  g.add(fp);
  const fire = new THREE.PointLight('#ff9a3a', 16, 12, 2); fire.position.set(0, 1.0, -2.6); g.add(fire);
  // armchair, rug, side lamp, clock, photos, knitting basket
  const ch = new THREE.Group();
  ch.add(box(1.4, 0.6, 1.3, '#8a2a2a', { y: 0.55 })); ch.add(box(1.4, 1.3, 0.3, '#7a2222', { y: 1.2, z: -0.55 }));
  for (const sx of [-1, 1]) ch.add(box(0.25, 0.9, 1.3, '#7a2222', { x: sx * 0.7, y: 0.75 }));
  ch.position.set(-2.4, 0, -1.6); ch.rotation.y = 0.5; g.add(ch);
  g.add(mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.03, 24), smooth('#8a5a2a'), { y: 0.02, z: -0.8, cast: false }));
  g.add(box(0.6, 0.8, 0.6, '#4a3020', { base: true, x: 3.0, z: -3.2 }));
  g.add(mesh(new THREE.ConeGeometry(0.4, 0.5, 12, 1, true), smooth('#f0d8a0', { side: THREE.DoubleSide, emissive: '#ffcf80', emissiveIntensity: 0.6 }), { x: 3.0, y: 1.7, z: -3.2 }));
  const lampL = new THREE.PointLight('#ffcf80', 7, 9, 2); lampL.position.set(3.0, 1.6, -3.0); g.add(lampL);
  g.add(box(0.7, 2.6, 0.5, '#4a2e1c', { base: true, x: -4.6, z: -3.5 }));
  g.add(mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 16), smooth('#f2ead8'), { x: -4.6, y: 2.2, z: -3.22, rx: Math.PI / 2 }));
  for (let i = 0; i < 4; i++) g.add(box(0.7, 0.55, 0.05, rng.pick(['#c9a46a', '#a8784a', '#d8b88a']), { x: -2.4 + i * 1.6, y: 4.2 + (i % 2) * 0.4, z: -3.97 }));
  return { group: g, light: NIGHT({ sun: '#ffcf90', sunI: 0.4, hemiSky: '#a87a5a', hemiGround: '#3a2418', hemiI: 0.9 }), fog: ['#2a1a12', 30, 90], interior: true };
}
