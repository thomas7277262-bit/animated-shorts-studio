// Bright daytime sets for "Every Time I Sneeze, I Swap Places With a Stranger".
// Classroom, pizza shop, football stadium, zoo lion enclosure, garden wedding,
// downtown street, plane cockpit and open sky. Same contract as the other sets:
// { group, light, fog, update?(t, state) }. Stage is around the origin, cameras look from +z.
import * as THREE from 'three';
import { Rng } from '../rng.js';
import { mat, mesh, box, sky, ground, tree, rock, bush, cloud, lamp } from './common.js';

const glow = (color, i = 1) => mat(color, { emissive: color, emissiveIntensity: i });
const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o });

/** Canvas texture with big readable text (blackboards, signs, scoreboards). */
function textPlane(lines, w, h, { bg = '#2f5d3a', fg = '#ffffff', font = 'bold', px = 120, border = null, emissive = false } = {}) {
  const cw = 1024, ch = Math.round(1024 * h / w);
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, cw, ch);
  if (border) { g.strokeStyle = border; g.lineWidth = 28; g.strokeRect(14, 14, cw - 28, ch - 28); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  const arr = [].concat(lines);
  arr.forEach((l, i) => { g.font = `${font} ${px}px "Fredoka", "Arial Black", sans-serif`; g.fillText(l, cw / 2, ch * (i + 0.5) / arr.length); });
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = emissive ? new THREE.MeshBasicMaterial({ map: tex }) : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}
const place = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; return o; };

function clouds(g, rng, n = 7, { y = [24, 40], z = [-140, -60], x = [-80, 80] } = {}) {
  for (let i = 0; i < n; i++) g.add(cloud(rng, { x: rng.float(...x), y: rng.float(...y), z: rng.float(...z), s: rng.float(0.9, 1.8) }));
}
const DAY = (o = {}) => ({ sun: '#fff4dc', sunI: 2.8, hemiSky: '#d4ecff', hemiGround: '#8a9a72', hemiI: 1.25, dir: [10, 16, 12], ...o });

// simple background person (blocky crowd member / wedding guest / student), faces +z
function extra(rng, { shirt, skin, hair, h = 1 } = {}) {
  const p = new THREE.Group();
  shirt = shirt || rng.pick(['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#ff7f50', '#1abc9c', '#ff5fa2']);
  skin = skin || rng.pick(['#f1c9a6', '#e3ae84', '#c98d62', '#8d5a3b', '#f6d5b8']);
  hair = hair || rng.pick(['#2b1a10', '#5a3311', '#e0b050', '#111111', '#a0522d']);
  p.add(box(0.5 * h, 0.7 * h, 0.3 * h, shirt, { y: 0.75 * h }));
  p.add(box(0.2 * h, 0.4 * h, 0.22 * h, '#34495e', { x: -0.12 * h, y: 0.2 * h }));
  p.add(box(0.2 * h, 0.4 * h, 0.22 * h, '#34495e', { x: 0.12 * h, y: 0.2 * h }));
  p.add(box(0.42 * h, 0.42 * h, 0.4 * h, skin, { y: 1.32 * h }));
  p.add(box(0.46 * h, 0.12 * h, 0.44 * h, hair, { y: 1.56 * h }));
  for (const sx of [-1, 1]) p.add(box(0.06 * h, 0.08 * h, 0.02, '#111', { x: sx * 0.09 * h, y: 1.35 * h, z: 0.205 * h, cast: false }));
  return p;
}

// ------------------------------------------------------------------ classroom
export function classroom(seed) {
  const rng = new Rng(seed);
  const g = new THREE.Group();
  g.add(sky('#5ab4ff', '#d8f0ff', '#eef8ff'));
  g.add(box(18, 0.2, 16, '#d9b38c', { y: -0.1, z: -1, cast: false }));
  for (let i = 0; i < 12; i++) g.add(box(0.03, 0.01, 16, '#c49a70', { x: -8.25 + i * 1.5, y: 0.005, z: -1, cast: false }));
  g.add(box(18, 7, 0.3, '#ffe9b8', { base: true, z: -7 }));                       // back wall
  g.add(box(0.3, 7, 16, '#bfe3d0', { base: true, x: 8, z: -1 }));                  // right wall
  g.add(box(18, 7, 0.3, '#ffe9b8', { base: true, z: 7 }));                        // front wall (behind the camera in normal shots)
  g.add(box(1.6, 3.2, 0.1, '#a0663a', { base: true, x: 5.5, z: 6.82 }));
  g.add(place(textPlane(['2 + 2 = 4'], 3, 1.2, { bg: '#ffffff', fg: '#2d6cdf', px: 220 }), -3, 4.2, 6.83, Math.PI));
  // left wall with big sunny windows
  for (const [z0, z1] of [[-7, -5.6], [-3.4, -2.6], [-0.4, 0.4], [2.6, 7]]) g.add(box(0.3, 7, z1 - z0, '#bfe3d0', { base: true, x: -8, z: (z0 + z1) / 2 }));
  g.add(box(0.3, 1.4, 16, '#bfe3d0', { base: true, x: -8, z: -1 }));
  g.add(box(0.3, 1.6, 16, '#bfe3d0', { y: 6.2, x: -8, z: -1 }));
  for (const zc of [-4.5, -1.5, 1.5]) g.add(box(0.06, 4.0, 2.2, mat('#cfefff', { transparent: true, opacity: 0.25 }), { x: -8, y: 3.4, z: zc, cast: false }));
  // trees outside the windows
  for (let i = 0; i < 4; i++) g.add(tree(rng, { x: -13, z: -5 + i * 3, s: 1.5, kind: 'round' }));
  const lawn = ground('#79cf5a', 120, seed, { flatRadius: 30, bumps: 0 }); lawn.position.y = -0.3; g.add(lawn);
  // blackboard with today's maths test
  g.add(box(8.4, 3.3, 0.12, '#6b4a2c', { x: 0, y: 3.6, z: -6.8 }));
  g.add(place(textPlane(['MATH TEST', '7 × 8 = ?   144 ÷ 12 = ?'], 8, 2.9, { bg: '#2f5d3a', fg: '#f4f4e8', px: 118 }), 0, 3.6, -6.72));
  g.add(box(8.4, 0.12, 0.3, '#6b4a2c', { x: 0, y: 1.95, z: -6.65 }));
  // clock + posters
  g.add(mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.1, 20), mat('#ffffff'), { x: 5.5, y: 5.5, z: -6.8, rx: Math.PI / 2 }));
  g.add(box(0.05, 0.4, 0.03, '#222', { x: 5.5, y: 5.62, z: -6.72 })); g.add(box(0.3, 0.05, 0.03, '#222', { x: 5.62, y: 5.5, z: -6.72 }));
  g.add(place(textPlane(['A+'], 1.4, 1.4, { bg: '#ff5fa2', fg: '#fff', px: 420 }), 6.0, 3.2, -6.83));
  g.add(place(textPlane(['ABC'], 1.8, 1.0, { bg: '#ffd23f', fg: '#2d6cdf', px: 320 }), -5.7, 4.6, -6.83));
  g.add(place(textPlane(['123'], 1.8, 1.0, { bg: '#2d6cdf', fg: '#ffffff', px: 320 }), 7.83, 4.4, -2, -Math.PI / 2));
  // teacher's desk with apple
  const td = new THREE.Group();
  td.add(box(2.8, 1.1, 1.2, '#a0663a', { base: true }));
  td.add(mesh(new THREE.SphereGeometry(0.14, 10, 8), mat('#e2302b'), { x: 0.8, y: 1.24 }));
  td.add(box(0.5, 0.05, 0.36, '#ffffff', { x: -0.5, y: 1.13 }));
  g.add(place(td, 4.4, 0, -4.6, -0.25));
  // student desks: 3 rows of 3. Max's desk is the middle one at (0, 0.6)
  for (const z of [-2.0, 0.6, 3.2]) for (const x of [-2.2, 0, 2.2]) {
    const d = new THREE.Group();
    d.add(box(1.5, 0.08, 0.9, '#f2c879', { y: 1.0 }));
    for (const [lx, lz] of [[-0.65, -0.35], [0.65, -0.35], [-0.65, 0.35], [0.65, 0.35]]) d.add(box(0.07, 1.0, 0.07, '#7f8c8d', { x: lx, y: 0.5, z: lz }));
    d.add(box(0.42, 0.02, 0.3, '#fffdf2', { y: 1.05, z: 0.1, ry: 0.1 }));
    // chair behind (toward +z)
    d.add(box(0.8, 0.07, 0.75, '#3a7bd5', { y: 0.62, z: 0.85 }));
    d.add(box(0.8, 0.75, 0.07, '#3a7bd5', { y: 1.0, z: 1.22 }));
    for (const [lx, lz] of [[-0.33, 0.55], [0.33, 0.55], [-0.33, 1.15], [0.33, 1.15]]) d.add(box(0.05, 0.62, 0.05, '#7f8c8d', { x: lx, y: 0.31, z: lz }));
    g.add(place(d, x, 0, z));
  }
  return { group: g, light: DAY({ sun: '#fff1d0', sunI: 2.2, hemiSky: '#fff6e6', hemiGround: '#c8a27a', hemiI: 1.6, dir: [-14, 12, 4] }), fog: ['#fff3dc', 40, 140], interior: true };
}

// ------------------------------------------------------------------ pizza shop
export function pizzashop(seed) {
  const rng = new Rng(seed);
  const g = new THREE.Group();
  g.add(sky('#5ab4ff', '#d8f0ff', '#eef8ff'));
  // checkerboard floor
  const fl = new THREE.Group();
  for (let i = -8; i < 8; i++) for (let j = -7; j < 5; j++) fl.add(box(1, 0.05, 1, (i + j) & 1 ? '#f4f1ea' : '#c0392b', { x: i + 0.5, y: 0, z: j + 0.5, cast: false }));
  g.add(fl);
  g.add(box(16, 7, 0.3, '#f6d7a7', { base: true, z: -7 }));
  g.add(box(16, 2.2, 0.32, '#c0392b', { base: true, z: -6.98 }));                   // red wainscot
  for (const sx of [-1, 1]) g.add(box(0.3, 7, 12, '#f6d7a7', { base: true, x: sx * 8, z: -1 }));
  // brick oven with roaring fire
  const ov = new THREE.Group();
  for (let r = 0; r < 7; r++) for (let c = 0; c < 6; c++) ov.add(box(0.6, 0.3, 0.6, (r + c) & 1 ? '#b5523b' : '#a2452f', { x: -1.5 + c * 0.6 + (r & 1) * 0.3 - 0.15, y: 0.15 + r * 0.3, z: 0 }));
  ov.add(mesh(new THREE.SphereGeometry(1.9, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#a2452f'), { y: 2.1, s: [1, 0.8, 0.6] }));
  ov.add(mesh(new THREE.CircleGeometry(0.75, 16, 0, Math.PI), basic('#ffb02e'), { y: 1.3, z: 0.32 }));
  const fire = mesh(new THREE.ConeGeometry(0.35, 0.7, 6), basic('#ff6a1a'), { y: 1.6, z: 0.2 }); fire.userData.bob = 2; fire.userData.bobBase = 1.6; ov.add(fire);
  ov.add(box(0.5, 2.5, 0.5, '#8d3a26', { y: 4.2, z: -0.3 }));
  const fl1 = new THREE.PointLight('#ff8a2a', 18, 9, 2); fl1.position.set(0, 1.5, 1.2); ov.add(fl1);
  g.add(place(ov, -4.2, 0, -5.6));
  // back counter with pizzas
  g.add(box(7, 1.1, 1.0, '#8b5a2b', { base: true, x: 2.2, z: -4.2 }));
  g.add(box(7.2, 0.1, 1.1, '#e7e2d6', { x: 2.2, y: 1.15, z: -4.2 }));
  for (let i = 0; i < 4; i++) {
    const pz = new THREE.Group();
    pz.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 18), mat('#e9b25c'), { y: 0.03 }));
    pz.add(mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.07, 18), mat('#d8402a'), { y: 0.04 }));
    for (let k = 0; k < 5; k++) pz.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 8), mat('#8e1c1c'), { x: Math.cos(k * 1.3) * 0.2, y: 0.06, z: Math.sin(k * 1.3) * 0.2 }));
    g.add(place(pz, -0.2 + i * 1.6, 1.2, -4.2));
  }
  // menu board + sign
  g.add(place(textPlane(['PIZZA', 'MARGHERITA  5', 'PEPPERONI  6'], 4.6, 2.4, { bg: '#1f1f1f', fg: '#ffd23f', px: 120, border: '#c0392b' }), 2.6, 4.4, -6.82));
  // hanging lamps
  for (const x of [-2, 2, 6]) { g.add(box(0.03, 1.4, 0.03, '#333', { x, y: 6.3, z: -2 })); g.add(mesh(new THREE.ConeGeometry(0.45, 0.4, 10, 1, true), mat('#2e7d32', { side: THREE.DoubleSide }), { x, y: 5.5, z: -2 })); g.add(mesh(new THREE.SphereGeometry(0.16, 8, 6), basic('#fff3c4'), { x, y: 5.35, z: -2 })); }
  // flour sacks, basil plant, tomato cans
  for (let i = 0; i < 3; i++) g.add(box(0.6, 0.8, 0.4, '#f1ede1', { base: true, x: 6.6, z: -5.8 + i * 0.6, ry: rng.float(-0.3, 0.3) }));
  for (let i = 0; i < 5; i++) g.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 10), mat('#d8402a'), { x: 4.6 + i * 0.32, y: 1.35, z: -4.4 }));
  g.add(bush(rng, { x: -0.8, z: -4.3, s: 0.5 }).translateY(1.2));
  // small floury work table at centre stage (Max stands behind it)
  g.add(box(2.4, 1.0, 1.2, '#c79a63', { base: true, x: 0, z: -1.3 }));
  g.add(box(2.5, 0.06, 1.3, '#f4efe2', { x: 0, y: 1.03, z: -1.3 }));
  return { group: g, light: DAY({ sun: '#fff0d0', sunI: 2.0, hemiSky: '#fff1dc', hemiGround: '#c47a5a', hemiI: 1.6, dir: [6, 12, 10] }), fog: ['#ffe9cc', 30, 90], interior: true };
}

// ------------------------------------------------------------------ football stadium
export function stadium(seed) {
  const rng = new Rng(seed);
  const g = new THREE.Group();
  g.add(sky('#3d9bff', '#cfeaff', '#eef8ff'));
  clouds(g, rng, 6, { y: [40, 60], z: [-180, -90] });
  // striped pitch
  for (let i = 0; i < 14; i++) g.add(box(70, 0.04, 6, i & 1 ? '#3fae49' : '#4fc25a', { y: 0, z: 30 - i * 6, cast: false }));
  // lines: goal line, six-yard box, penalty spot
  const W = mat('#ffffff');
  g.add(box(60, 0.02, 0.15, W, { y: 0.04, z: -1.2, cast: false }));
  g.add(box(0.15, 0.02, 6, W, { x: -9, y: 0.04, z: 1.8, cast: false })); g.add(box(0.15, 0.02, 6, W, { x: 9, y: 0.04, z: 1.8, cast: false }));
  g.add(box(18, 0.02, 0.15, W, { y: 0.04, z: 4.8, cast: false }));
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 12), W, { y: 0.05, z: 11 }));
  // goal: posts + crossbar + net
  const goal = new THREE.Group();
  const post = mat('#ffffff', { roughness: 0.4 });
  goal.add(box(0.18, 3.0, 0.18, post, { base: true, x: -4.4 })); goal.add(box(0.18, 3.0, 0.18, post, { base: true, x: 4.4 }));
  goal.add(box(9.0, 0.18, 0.18, post, { y: 3.0 }));
  const net = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.45, side: THREE.DoubleSide, wireframe: true });
  goal.add(mesh(new THREE.PlaneGeometry(8.8, 3, 22, 8), net, { y: 1.5, z: -2.0, cast: false }));
  goal.add(mesh(new THREE.PlaneGeometry(8.8, 2.2, 22, 6), net, { y: 2.6, z: -1.0, rx: -Math.PI / 2 + 0.45, cast: false }));
  for (const sx of [-1, 1]) goal.add(mesh(new THREE.PlaneGeometry(2.0, 3, 5, 8), net, { x: sx * 4.4, y: 1.5, z: -1, ry: Math.PI / 2, cast: false }));
  g.add(place(goal, 0, 0, -1.3));
  // stands with a cheering crowd (behind the goal and both sides)
  const tiers = (cx, cz, ry, len, rows) => {
    const st = new THREE.Group();
    for (let r = 0; r < rows; r++) {
      st.add(box(len, 1.0, 1.6, r & 1 ? '#2d6cdf' : '#244fa8', { y: 0.5 + r * 1.0, z: -r * 1.6 }));
      // one instanced row of fans (bodies + heads + a few flags), bobbing together
      const n = Math.floor(len / 0.75);
      const row = new THREE.Group();
      const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(0.45, 0.55, 0.3), new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }), n);
      const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.32, 0.32, 0.3), new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }), n);
      const m4 = new THREE.Matrix4(), col = new THREE.Color();
      for (let k = 0; k < n; k++) {
        const fx = -len / 2 + 0.4 + k * 0.75, hide = rng.float() < 0.08 ? 0 : 1, dy = rng.float(-0.05, 0.12);
        m4.makeScale(hide, hide, hide).setPosition(fx, 0.28 + dy, 0); bodies.setMatrixAt(k, m4);
        bodies.setColorAt(k, col.set(rng.pick(['#e74c3c', '#ffffff', '#f1c40f', '#e74c3c', '#ff5fa2', '#2ecc71'])));
        m4.makeScale(hide, hide, hide).setPosition(fx, 0.72 + dy, 0); heads.setMatrixAt(k, m4);
        heads.setColorAt(k, col.set(rng.pick(['#f1c9a6', '#e3ae84', '#c98d62', '#8d5a3b'])));
      }
      bodies.castShadow = heads.castShadow = false;
      row.add(bodies, heads);
      row.position.set(0, 1.0 + r * 1.0, -r * 1.6 + 0.1);
      row.userData.bob = r * 1.3; row.userData.bobBase = row.position.y;
      st.add(row);
    }
    st.add(box(len, 1.2, 0.3, '#ffffff', { y: 0.6, z: 0.95 }));
    st.position.set(cx, 0, cz); st.rotation.y = ry;
    g.add(st);
  };
  tiers(0, -16, 0, 80, 12);
  tiers(-34, 10, Math.PI / 2, 70, 12);
  tiers(34, 10, -Math.PI / 2, 70, 12);
  // ad boards + scoreboard + floodlights
  for (let i = -5; i <= 5; i++) g.add(place(textPlane([i & 1 ? 'GOAL!' : 'PLAY'], 6, 0.9, { bg: i & 1 ? '#ffd23f' : '#ff3b5c', fg: '#1b1b1b', px: 400, emissive: true }), i * 6.2, 0.6, -6));
  g.add(place(textPlane(['HOME 2 - 2 AWAY', "89'"], 12, 4.5, { bg: '#151515', fg: '#ffcf33', px: 180, emissive: true }), -16, 22, -40));
  for (const [x, z] of [[-30, -22], [30, -22]]) {
    g.add(box(0.8, 30, 0.8, '#9aa3ad', { base: true, x, z }));
    g.add(box(6, 3, 0.6, '#d0d6de', { x, y: 31, z }));
    for (let i = 0; i < 6; i++) g.add(box(0.8, 0.8, 0.1, basic('#fffbe6'), { x: x - 2.2 + (i % 3) * 2.2, y: 31.6 - Math.floor(i / 3) * 1.2, z: z + 0.35 }));
  }
  return { group: g, light: DAY({ sunI: 3.0, hemiI: 1.3, dir: [14, 20, 18] }), fog: ['#dff0ff', 70, 240] };
}

// ------------------------------------------------------------------ zoo lion enclosure
export function zoo(seed) {
  const rng = new Rng(seed);
  const g = new THREE.Group();
  g.add(sky('#47a6ff', '#d6efff', '#f0f8ff'));
  clouds(g, rng, 7);
  g.add(ground('#d8b866', 240, seed, { flatRadius: 18, bumps: 0.15 }));             // dry savanna grass
  for (let i = 0; i < 60; i++) g.add(mesh(new THREE.ConeGeometry(0.12, 0.6, 4), mat(rng.pick(['#b89a4a', '#c9ab52', '#9e8a3e'])), { x: rng.float(-14, 14), y: 0.3, z: rng.float(-9, 6), cast: false }));
  // big lion rock behind the stage
  const rk = new THREE.Group();
  rk.add(mesh(new THREE.DodecahedronGeometry(3.2, 0), mat('#b08a63'), { y: 1.6, s: [1.6, 0.8, 1] }));
  rk.add(mesh(new THREE.DodecahedronGeometry(2.0, 0), mat('#a07a55'), { x: 2.6, y: 2.4, z: -0.6, s: [1.2, 0.9, 1] }));
  g.add(place(rk, -5, 0, -6));
  for (let i = 0; i < 6; i++) g.add(rock(rng, { x: rng.float(-12, 12), z: rng.float(-9, -3), s: rng.float(0.8, 1.6), color: '#b49270' }));
  // acacia trees
  for (const [x, z] of [[-9, -9], [-13, -3], [-5, -16]]) {
    const t = new THREE.Group();
    t.add(mesh(new THREE.CylinderGeometry(0.2, 0.3, 4, 6), mat('#7a5230'), { y: 2 }));
    t.add(mesh(new THREE.CylinderGeometry(2.6, 2.2, 0.8, 8), mat('#5f9d3a'), { y: 4.3 }));
    g.add(place(t, x, 0, z));
  }
  // water trough
  g.add(box(2.4, 0.5, 0.9, '#8a8f96', { base: true, x: 4, z: -2.5 }));
  g.add(box(2.2, 0.05, 0.7, glow('#4fb6ff', 0.25), { x: 4, y: 0.48, z: -2.5 }));
  // tall bars at the back with visitors staring in, and a LIONS sign
  for (let i = -16; i <= 16; i++) g.add(box(0.12, 5, 0.12, '#3b3f44', { base: true, x: i * 0.6, z: -11 }));
  g.add(box(20, 0.2, 0.2, '#3b3f44', { y: 5, z: -11 }));
  for (let i = 0; i < 9; i++) { const v = extra(rng); v.position.set(-7 + i * 1.7 + rng.float(-0.3, 0.3), 0, -12.5); g.add(v); }
  g.add(place(textPlane(['LIONS'], 3.6, 1.2, { bg: '#e8742a', fg: '#ffffff', px: 380, border: '#7a3a12' }), 0, 6, -10.8));
  for (let i = 0; i < 12; i++) g.add(tree(rng, { x: rng.float(-40, 40), z: rng.float(-40, -18), s: rng.float(1.2, 1.8), kind: 'round' }));
  return { group: g, light: DAY({ sun: '#fff0d0', sunI: 3.0, dir: [-10, 18, 12] }), fog: ['#f7ecd0', 50, 180] };
}

// ------------------------------------------------------------------ garden wedding
export function wedding(seed) {
  const rng = new Rng(seed);
  const g = new THREE.Group();
  g.add(sky('#5ab4ff', '#dcf2ff', '#f2faff'));
  clouds(g, rng, 6);
  g.add(ground('#7fd35e', 220, seed, { flatRadius: 25, bumps: 0.1 }));
  // flower arch at the altar (stage is just in front of it)
  const arch = new THREE.Group();
  const white = mat('#ffffff', { roughness: 0.5 });
  arch.add(box(0.25, 3.6, 0.25, white, { base: true, x: -1.9 })); arch.add(box(0.25, 3.6, 0.25, white, { base: true, x: 1.9 }));
  arch.add(mesh(new THREE.TorusGeometry(1.9, 0.14, 8, 24, Math.PI), white, { y: 3.6 }));
  for (let i = 0; i < 28; i++) {
    const a = (i / 27) * Math.PI;
    arch.add(mesh(new THREE.SphereGeometry(0.2, 8, 6), mat(rng.pick(['#ff7fb0', '#ffffff', '#ffd1e3', '#ff5f8f'])), { x: Math.cos(a) * 1.9, y: 3.6 + Math.sin(a) * 1.9, z: 0.1 }));
  }
  for (let i = 0; i < 10; i++) for (const sx of [-1, 1]) arch.add(mesh(new THREE.SphereGeometry(0.17, 8, 6), mat(rng.pick(['#ff7fb0', '#ffffff', '#9be27a'])), { x: sx * 1.9, y: 0.4 + i * 0.33, z: 0.12 }));
  g.add(place(arch, 0, 0, -1.6));
  // aisle carpet with petals
  g.add(box(1.8, 0.03, 16, '#f4f1ea', { y: 0.02, z: 7, cast: false }));
  for (let i = 0; i < 40; i++) g.add(box(0.08, 0.01, 0.08, rng.pick(['#ff7fb0', '#ff5f8f', '#ffffff']), { x: rng.float(-0.8, 0.8), y: 0.04, z: rng.float(0, 15), ry: rng.float(0, 3), cast: false }));
  // rows of white chairs with guests facing the altar (they face -z, toward the camera behind the couple)
  for (let r = 0; r < 6; r++) for (const side of [-1, 1]) for (let k = 0; k < 4; k++) {
    const x = side * (1.6 + k * 0.85), z = 2.6 + r * 1.6;
    const ch = new THREE.Group();
    ch.add(box(0.6, 0.06, 0.55, white, { y: 0.6 })); ch.add(box(0.6, 0.7, 0.06, white, { y: 1.0, z: 0.26 }));
    for (const [lx, lz] of [[-0.25, -0.22], [0.25, -0.22], [-0.25, 0.22], [0.25, 0.22]]) ch.add(box(0.05, 0.6, 0.05, white, { x: lx, y: 0.3, z: lz }));
    g.add(place(ch, x, 0, z));
    if (rng.float() < 0.85) {
      const p = extra(rng, { shirt: rng.pick(['#34495e', '#ff9ec4', '#7fb3ff', '#2c3e50', '#ffd27f', '#b48ef0']), h: 0.95 });
      p.position.set(x, 0.32, z - 0.02); p.rotation.y = Math.PI; p.scale.set(1, 0.82, 1);
      g.add(p);
    }
  }
  // hedges, flower pots, balloons, a white tent and the venue house
  for (let i = 0; i < 12; i++) g.add(bush(rng, { x: rng.pick([-1, 1]) * rng.float(6, 12), z: rng.float(-6, 14), s: rng.float(0.9, 1.4) }));
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) {
    const b = mesh(new THREE.SphereGeometry(0.35, 12, 10), mat(rng.pick(['#ff7fb0', '#ffffff', '#ffd23f']), { roughness: 0.4, flatShading: false }), { x: sx * (2.6 + i * 0.3), y: 3.4 + i * 0.4, z: -1.4 });
    b.userData.bob = i + sx; b.userData.bobBase = b.position.y; g.add(b);
  }
  const tent = new THREE.Group();
  tent.add(mesh(new THREE.ConeGeometry(5, 3, 4), mat('#ffffff'), { y: 5, ry: Math.PI / 4 }));
  for (const [x, z] of [[-3.4, -3.4], [3.4, -3.4], [-3.4, 3.4], [3.4, 3.4]]) tent.add(box(0.15, 3.5, 0.15, white, { base: true, x, z }));
  g.add(place(tent, -14, 0, -10));
  for (let i = 0; i < 14; i++) g.add(tree(rng, { x: rng.float(-50, 50), z: rng.float(-45, -16), s: rng.float(1.3, 2), kind: 'round' }));
  return { group: g, light: DAY({ sunI: 2.9, dir: [8, 18, -10] }), fog: ['#e6f5ff', 50, 190] };
}

// ------------------------------------------------------------------ downtown (day)
export function downtown(seed) {
  const rng = new Rng(seed);
  const g = new THREE.Group();
  g.add(sky('#3d9bff', '#cfeaff', '#eef8ff'));
  clouds(g, rng, 7);
  g.add(ground('#8e979e', 300, seed, { flatRadius: 100, bumps: 0, variation: 0.02 }));
  g.add(box(400, 0.03, 8, '#3d4247', { y: 0.02, z: -3, cast: false }));
  for (let i = -40; i <= 40; i++) g.add(box(1.8, 0.01, 0.2, '#ffd23f', { x: i * 4, y: 0.04, z: -3, cast: false }));
  g.add(box(400, 0.2, 4, '#d6d0c4', { y: 0.1, z: 3, cast: false }));
  g.add(box(400, 0.2, 4, '#d6d0c4', { y: 0.1, z: -9, cast: false }));
  // shop fronts on the far side of the road (colourful, awnings, signs)
  const shops = [['PIZZA', '#e74c3c'], ['TOYS', '#9b59b6'], ['GROCERY', '#27ae60'], ['BAKERY', '#e67e22'], ['BOOKS', '#2980b9'], ['ICE CREAM', '#ff5fa2'], ['CAFE', '#16a085'], ['PETS', '#f39c12']];
  let x = -60;
  for (let i = 0; x < 60; i++) {
    const [name, col] = shops[i % shops.length];
    const w = rng.float(5.5, 7.5), h = rng.float(7, 14);
    const b = new THREE.Group();
    b.add(box(w, h, 6, rng.pick(['#f6e3c7', '#ffd9b3', '#d9ecff', '#f2d1e6', '#e8f6d8', '#fff1b8']), { base: true }));
    b.add(box(w - 1.2, 2.3, 0.1, mat('#bfe6ff', { metalness: 0.2, roughness: 0.2 }), { y: 1.5, z: 3.02 }));
    b.add(box(w - 0.6, 0.15, 1.4, col, { y: 3.2, z: 3.6, rx: 0.35 }));
    for (let k = 0; k < Math.floor((w - 1) / 1.1); k++) b.add(box(0.5, 0.06, 1.4, '#ffffff', { x: -w / 2 + 0.9 + k * 1.1, y: 3.22, z: 3.62, rx: 0.35 }));
    b.add(place(textPlane([name], w - 1.0, 1.0, { bg: col, fg: '#ffffff', px: 360 }), 0, 4.3, 3.05));
    for (let r = 0; r < Math.floor((h - 5) / 2.4); r++) for (let c = 0; c < 3; c++) b.add(box(1.0, 1.3, 0.1, mat('#9fd8ff', { metalness: 0.2, roughness: 0.3 }), { x: -w / 2 + w * (c + 0.5) / 3, y: 6 + r * 2.4, z: 3.02 }));
    b.position.set(x + w / 2, 0, -14.2); g.add(b);
    x += w + 0.3;
  }
  // near-side trees, lamps and a fire hydrant (kept out of the road)
  for (let i = -6; i <= 6; i++) { if (i % 2 === 0) g.add(tree(rng, { x: i * 8 + 3, z: 4.5, s: 1.1, kind: 'round' })); else g.add(lamp({ x: i * 8, z: 4.6, h: 3.6 })); }
  for (let i = -6; i <= 6; i++) if (i % 3 === 0) g.add(tree(rng, { x: i * 8 + 1, z: -10.2, s: 1.0, kind: 'round' }));
  g.add(mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.7, 8), mat('#e23b3b'), { x: 6, y: 0.45, z: 1.6 }));
  // parked cars
  for (const [cx, col] of [[-22, '#3498db'], [16, '#f1c40f'], [34, '#2ecc71']]) {
    const c = new THREE.Group();
    c.add(box(3.6, 0.9, 1.7, col, { y: 0.75 })); c.add(box(2.0, 0.7, 1.6, col, { y: 1.5, x: -0.2 }));
    c.add(box(1.9, 0.55, 1.62, mat('#bfe6ff'), { y: 1.5, x: -0.2 }));
    for (const [wx, wz] of [[-1.2, 0.85], [1.2, 0.85], [-1.2, -0.85], [1.2, -0.85]]) c.add(mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12), mat('#222'), { x: wx, y: 0.35, z: wz, rx: Math.PI / 2 }));
    g.add(place(c, cx, 0, -6.4));
  }
  return { group: g, light: DAY({ sunI: 3.0, dir: [12, 20, 14] }), fog: ['#dfefff', 60, 220] };
}

// ------------------------------------------------------------------ cockpit
export function cockpit(seed) {
  const rng = new Rng(seed);
  const g = new THREE.Group();
  // the world outside tilts when the plane dives
  const outside = new THREE.Group();
  outside.add(sky('#2f8cff', '#cfeaff', '#ffffff', new THREE.Vector3(0.3, 0.25, -1)));
  const sea = new THREE.Group();
  for (let i = 0; i < 70; i++) sea.add(cloud(rng, { x: rng.float(-160, 160), y: rng.float(-30, -18), z: rng.float(-260, -20), s: rng.float(2.2, 4.2) }));
  for (let i = 0; i < 10; i++) sea.add(cloud(rng, { x: rng.float(-90, 90), y: rng.float(-2, 14), z: rng.float(-200, -60), s: rng.float(1.2, 2.2) }));
  outside.add(sea);
  outside.position.z = -2;
  g.add(outside);
  // cabin shell (open at the back, toward the camera)
  const shell = mat('#d9dee6');
  g.add(box(4.6, 0.1, 6, '#3b4048', { y: 0, z: 0.5 }));
  for (const sx of [-1, 1]) {
    g.add(box(0.15, 1.3, 6, shell, { base: true, x: sx * 2.3, z: 0.5 }));
    g.add(box(0.15, 1.8, 3.5, shell, { x: sx * 2.0, y: 2.2, z: 1.8, rz: sx * 0.3 }));
  }
  g.add(box(4.6, 0.15, 3.6, shell, { y: 3.05, z: 1.6 }));
  // windshield frame (two big panes)
  const frame = mat('#2b2f36');
  g.add(box(4.6, 0.25, 0.2, frame, { y: 1.35, z: -2.2 }));
  g.add(box(4.0, 0.25, 0.2, frame, { y: 3.0, z: -1.9, rx: 0.3 }));
  g.add(box(0.18, 1.8, 0.2, frame, { y: 2.2, z: -2.05, rx: 0.3 }));
  for (const sx of [-1, 1]) g.add(box(0.2, 1.8, 0.2, frame, { x: sx * 2.15, y: 2.2, z: -2.05, rx: 0.3 }));
  // dashboard with glowing screens and buttons
  const dash = new THREE.Group();
  dash.add(box(4.4, 0.9, 1.0, '#30353d', { y: 0.9 }));
  dash.add(box(4.4, 0.12, 1.3, '#23272e', { y: 1.38, z: -0.1 }));
  const screens = [];
  for (const sx of [-1.45, -0.5, 0.5, 1.45]) {
    const s = mesh(new THREE.PlaneGeometry(0.7, 0.5), glow(['#2a7bff', '#18c96b', '#2a7bff', '#18c96b'][screens.length], 0.9), { x: sx, y: 1.05, z: 0.52, rx: -0.25, cast: false });
    screens.push(s); dash.add(s);
  }
  const alarms = [];
  for (let i = 0; i < 18; i++) {
    const b = mesh(new THREE.BoxGeometry(0.1, 0.06, 0.1), glow(rng.pick(['#ffd23f', '#18c96b', '#ffffff']), 0.8), { x: -1.9 + (i % 9) * 0.47, y: 1.46, z: -0.1 + Math.floor(i / 9) * 0.3, cast: false });
    dash.add(b);
  }
  for (const sx of [-0.95, 0.95]) {
    const al = mesh(new THREE.BoxGeometry(0.32, 0.18, 0.06), mat('#550000', { emissive: '#ff1a1a', emissiveIntensity: 0.0 }), { x: sx, y: 1.6, z: -0.4, cast: false });
    alarms.push(al); dash.add(al);
  }
  dash.position.set(0, 0, -1.4);
  g.add(dash);
  // two pilot seats and control yokes
  for (const sx of [-1, 1]) {
    const seat = new THREE.Group();
    seat.add(box(0.9, 0.2, 0.9, '#4a4f58', { y: 0.65 }));
    seat.add(box(0.9, 1.3, 0.2, '#4a4f58', { y: 1.35, z: 0.45 }));
    seat.add(box(0.2, 0.65, 0.2, '#2b2f36', { y: 0.32 }));
    g.add(place(seat, sx * 0.95, 0, 0.6));
    const yoke = new THREE.Group();
    yoke.add(box(0.08, 0.08, 0.6, '#1d2026', { y: 1.15, z: 0.25 }));
    yoke.add(box(0.6, 0.08, 0.08, '#1d2026', { y: 1.15, z: 0.55 }));
    for (const hx of [-0.3, 0.3]) yoke.add(box(0.08, 0.22, 0.08, '#1d2026', { x: hx, y: 1.25, z: 0.55 }));
    g.add(place(yoke, sx * 0.95, 0, -0.9));
  }
  const alarmLight = new THREE.PointLight('#ff2020', 0, 8, 2); alarmLight.position.set(0, 2.4, 0.4); g.add(alarmLight);
  const fill = new THREE.PointLight('#e6f2ff', 14, 12, 2); fill.position.set(0, 2.6, -1.2); g.add(fill);
  function update(t, st) {
    const dive = st.dive || 0, alarm = st.alarm ? 1 : 0;
    // clouds stream past; diving tips the horizon up and shakes everything
    sea.position.z = (t * (18 + dive * 30)) % 60;
    outside.rotation.x = dive * 0.45 + Math.sin(t * 23) * 0.006 * dive;
    outside.rotation.z = Math.sin(t * 0.7) * 0.03 + dive * 0.12;
    const blink = alarm * (Math.sin(t * 14) > 0 ? 1 : 0.15);
    for (const a of alarms) a.material.emissiveIntensity = 2.5 * blink;
    alarmLight.intensity = 14 * blink;
    for (const s of screens) s.material.emissive.set(alarm ? (Math.sin(t * 14) > 0 ? '#ff2a2a' : '#5a0000') : s.material.color);
  }
  return { group: g, update, light: DAY({ sun: '#ffffff', sunI: 2.4, hemiSky: '#eef6ff', hemiGround: '#9aa3b0', hemiI: 2.0, dir: [4, 12, -10] }), fog: ['#eaf6ff', 120, 500], interior: true };
}

// ------------------------------------------------------------------ open sky (plane exterior)
export function skies(seed) {
  const rng = new Rng(seed);
  const g = new THREE.Group();
  g.add(sky('#2f8cff', '#cfeaff', '#ffffff', new THREE.Vector3(0.4, 0.35, -1)));
  const sea = new THREE.Group();
  for (let i = 0; i < 90; i++) sea.add(cloud(rng, { x: rng.float(-200, 200), y: rng.float(-40, -24), z: rng.float(-300, 60), s: rng.float(2.4, 4.6) }));
  for (let i = 0; i < 14; i++) sea.add(cloud(rng, { x: rng.float(-80, 80), y: rng.float(-10, 12), z: rng.float(-220, -30), s: rng.float(1.2, 2.4) }));
  g.add(sea);
  function update(t, st) { sea.position.x = -((t * (25 + (st.dive || 0) * 20)) % 80); }
  return { group: g, update, light: DAY({ sun: '#ffffff', sunI: 3.0, hemiSky: '#dff0ff', hemiGround: '#b8c6d8', hemiI: 1.4, dir: [10, 16, 12] }), fog: ['#eaf6ff', 150, 500] };
}
