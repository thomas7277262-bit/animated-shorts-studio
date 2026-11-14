import * as THREE from 'three';
import { Rng } from '../rng.js';
import {
  mat, mesh, box, sky, ground, tree, rock, bush, cloud, mountains, house, fence, flag, lamp,
} from './common.js';

// Every environment returns:
//   group  – the THREE.Group with all scenery
//   light  – sun/ambient settings
//   fog    – [color, near, far]
// The "stage" (where characters act) is around the origin, x in [-4,4], z in [-2,3].
// Cameras look from +z towards -z, so scenery behind the stage sits at negative z.

function addClouds(g, rng, n = 6) {
  for (let i = 0; i < n; i++) g.add(cloud(rng, { x: rng.float(-70, 70), y: rng.float(22, 40), z: rng.float(-120, -60), s: rng.float(0.8, 1.6) }));
}

function tower(h, r, wallColor, roofColor) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(r, r * 1.08, h, 10), mat(wallColor), { y: h / 2 }));
  // battlement ring
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.add(box(r * 0.35, 0.5, r * 0.35, wallColor, { x: Math.sin(a) * r * 0.95, y: h + 0.25, z: Math.cos(a) * r * 0.95, ry: a }));
  }
  g.add(mesh(new THREE.ConeGeometry(r * 1.25, h * 0.45, 10), mat(roofColor), { y: h + h * 0.225 + 0.3 }));
  // slit windows
  for (let i = 0; i < 3; i++) g.add(box(0.18, 0.6, 0.1, '#2b2b2b', { y: h * (0.35 + i * 0.2), z: r * 1.02 }));
  return g;
}

function castle(seed) {
  const rng = new Rng(seed);
  const g = new THREE.Group();
  g.add(sky('#3d9bff', '#bfe6ff', '#e8f6ff'));
  g.add(ground('#6cc24a', 220, seed, { flatRadius: 10 }));
  g.add(mountains(rng));
  addClouds(g, rng);
  const stone = '#c9c2b4', stoneDark = '#a59d8f', roof = '#3b5fc0';
  const castleG = new THREE.Group();
  castleG.position.set(0, 0, -11);
  // main walls
  castleG.add(box(16, 6, 1.4, stone, { base: true }));
  for (let i = -7; i <= 7; i++) castleG.add(box(0.7, 0.7, 1.5, stone, { x: i * 1.1, y: 6.35 }));
  // gate
  castleG.add(box(3.2, 4.2, 0.3, '#3a2a1c', { base: true, z: 0.72 }));
  castleG.add(mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.31, 16, 1, false, -Math.PI / 2, Math.PI), mat('#3a2a1c'), { y: 4.2, z: 0.72, rx: Math.PI / 2 }));
  for (let i = -3; i <= 3; i++) castleG.add(box(0.08, 4.0, 0.1, '#222', { base: true, x: i * 0.42, z: 0.9 }));
  // towers
  for (const sx of [-1, 1]) {
    const t = tower(9, 1.7, stoneDark, roof); t.position.set(sx * 8.4, 0, 0.2); castleG.add(t);
    castleG.add(flag(sx > 0 ? '#e63946' : '#ffd166', { x: sx * 8.4, y: 13.4, pole: 2.5 }));
  }
  const keep = tower(14, 2.4, stone, '#c0392b'); keep.position.set(0, 0, -5); castleG.add(keep);
  castleG.add(flag('#7b3fe4', { x: 0, y: 20.5, pole: 3 }));
  for (const sx of [-1, 1]) { const t = tower(11, 1.4, stone, roof); t.position.set(sx * 4.5, 0, -4); castleG.add(t); }
  g.add(castleG);
  // banners on wall
  for (const sx of [-1, 1]) castleG.add(box(1.0, 2.4, 0.05, '#7b3fe4', { x: sx * 3.2, y: 4.4, z: 0.75 }));
  // path, torches, shrubs
  g.add(box(3.4, 0.04, 14, '#d8c39a', { x: 0, y: 0.02, z: -3, cast: false }));
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 4; i++) g.add(bush(rng, { x: sx * rng.float(3, 7), z: rng.float(-7, 1) }));
    g.add(tree(rng, { x: sx * rng.float(9, 12), z: rng.float(-6, 2), s: rng.float(1.1, 1.5) }));
    g.add(tree(rng, { x: sx * rng.float(13, 18), z: rng.float(-14, -4), s: rng.float(1.2, 1.8) }));
  }
  for (let i = 0; i < 8; i++) g.add(rock(rng, { x: rng.float(-10, 10), z: rng.float(2, 8), s: rng.float(0.3, 0.7) }));
  for (let i = 0; i < 30; i++) g.add(tree(rng, { x: rng.float(-60, 60), z: rng.float(-60, -25), s: rng.float(1.5, 2.5), kind: 'pine' }));
  return { group: g, light: { sun: '#fff4d6', sunI: 2.6, hemiSky: '#bfe3ff', hemiGround: '#6d8f4e', hemiI: 1.1, dir: [8, 14, 9] }, fog: ['#cfe9ff', 40, 160] };
}

function village(seed) {
  const rng = new Rng(seed);
  const g = new THREE.Group();
  g.add(sky('#5fb4ff', '#ffe8c4', '#fff4e0'));
  g.add(ground('#7ccb52', 220, seed, { flatRadius: 12 }));
  g.add(mountains(rng, { color: '#8aa0b8' }));
  addClouds(g, rng);
  g.add(box(4, 0.04, 30, '#d9c49c', { y: 0.02, z: -6, cast: false }));
  const spots = [[-5.5, -5], [5.5, -5.5], [-6.5, -11], [6.5, -12], [-2.5, -14], [3, -16], [-9, -2], [9, -1.5]];
  spots.forEach(([x, z], i) => g.add(house(rng, { x, z, ry: x < 0 ? 0.35 : -0.35, s: rng.float(1.0, 1.25), floors: i % 3 === 0 ? 2 : 1 })));
  // well
  const well = new THREE.Group();
  well.add(mesh(new THREE.CylinderGeometry(0.8, 0.85, 0.8, 10), mat('#a9a196'), { y: 0.4 }));
  well.add(mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.82, 10), mat('#2b4a6b'), { y: 0.42, cast: false }));
  for (const sx of [-1, 1]) well.add(box(0.1, 1.6, 0.1, '#6b4a2c', { x: sx * 0.75, y: 1.3 }));
  well.add(mesh(new THREE.ConeGeometry(1.2, 0.7, 4), mat('#b5452f'), { y: 2.4, ry: Math.PI / 4 }));
  well.position.set(3.4, 0, -2.5);
  g.add(well);
  g.add(fence([-9, 1.5], [-4, 1.5])); g.add(fence([4, 1.5], [9, 1.5]));
  // market stall
  const stall = new THREE.Group();
  stall.add(box(2.2, 0.9, 1, '#9b6b3d', { base: true }));
  for (const sx of [-1, 1]) stall.add(box(0.1, 2.2, 0.1, '#6b4a2c', { base: true, x: sx * 1.05, z: 0.45 }));
  const awn = mesh(new THREE.BoxGeometry(2.5, 0.08, 1.4), mat('#e94f4f'), { y: 2.25, z: 0.2, rx: 0.2 });
  stall.add(awn);
  for (let i = 0; i < 6; i++) stall.add(mesh(new THREE.SphereGeometry(0.12, 6, 5), mat(rng.pick(['#ff4d4d', '#ffb100', '#7ed957'])), { x: -0.8 + i * 0.32, y: 1.0, z: 0.1 }));
  stall.position.set(-3.6, 0, -2.2); stall.rotation.y = 0.3;
  g.add(stall);
  for (let i = 0; i < 14; i++) g.add(tree(rng, { x: rng.pick([-1, 1]) * rng.float(10, 22), z: rng.float(-25, 2), s: rng.float(1, 1.6) }));
  for (let i = 0; i < 8; i++) g.add(bush(rng, { x: rng.float(-9, 9), z: rng.float(-1, 4), s: 0.7 }).translateX(Math.abs(i) > 3 ? 0 : 0));
  // chickens? simple barrels and crates
  for (let i = 0; i < 4; i++) g.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 8), mat('#8b5a2b'), { x: -6 + i * 0.7, y: 0.3, z: -3.5 }));
  return { group: g, light: { sun: '#ffe7c2', sunI: 2.5, hemiSky: '#cde8ff', hemiGround: '#7a8f4e', hemiI: 1.1, dir: [-9, 12, 8] }, fog: ['#ffe9cf', 35, 150] };
}

function battlefield(seed) {
  const rng = new Rng(seed);
  const g = new THREE.Group();
  g.add(sky('#f08a4b', '#ffd59a', '#ffe7c2', new THREE.Vector3(-0.6, 0.15, -0.8)));
  g.add(ground('#9bab55', 220, seed, { flatRadius: 8, bumps: 0.35 }));
  g.add(mountains(rng, { color: '#8a6f63', snow: false }));
  addClouds(g, rng, 4);
  // two camps of tents with banners
  for (const sx of [-1, 1]) {
    const color = sx < 0 ? '#2d6cdf' : '#e63946';
    for (let i = 0; i < 4; i++) {
      const tent = mesh(new THREE.ConeGeometry(1.3, 2.0, 6), mat(i % 2 ? color : '#f1e6c8'), { x: sx * (8 + i * 2.4), y: 1.0, z: -8 - (i % 2) * 3 });
      g.add(tent);
    }
    for (let i = 0; i < 5; i++) g.add(flag(color, { x: sx * (4.5 + i * 1.8), z: -4 - i * 1.5, pole: 3.5 }));
  }
  // wooden barricades / spikes
  for (let i = -5; i <= 5; i++) {
    if (Math.abs(i) < 2) continue;
    g.add(mesh(new THREE.ConeGeometry(0.12, 1.6, 5), mat('#7a5230'), { x: i * 1.3, y: 0.6, z: -6, rx: -0.6 }));
  }
  // broken cart
  const cart = new THREE.Group();
  cart.add(box(1.8, 0.5, 1.0, '#8b5a2b', { y: 0.6 }));
  cart.add(mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.12, 10), mat('#5a3a1e'), { x: 0.6, y: 0.4, z: 0.55, rx: Math.PI / 2 }));
  cart.add(mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.12, 10), mat('#5a3a1e'), { x: -0.9, y: 0.25, z: 0.7, rx: Math.PI / 2 + 0.3, rz: 0.4 }));
  cart.position.set(-3.8, 0, -2.5); cart.rotation.set(0, 0.6, 0.15);
  g.add(cart);
  for (let i = 0; i < 18; i++) g.add(rock(rng, { x: rng.float(-14, 14), z: rng.float(-14, 5), s: rng.float(0.3, 1.0), color: '#8f8a80' }));
  // smoke columns (static low-poly puffs, animated by bob)
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 5; j++) {
      const puff = mesh(new THREE.IcosahedronGeometry(0.6 + j * 0.25, 0), mat('#5a5a5a', { transparent: true, opacity: 0.45 - j * 0.07 }), { x: -14 + i * 14 + j * 0.4, y: 1 + j * 1.4, z: -24, cast: false });
      puff.userData.bob = i + j; puff.userData.bobBase = puff.position.y;
      g.add(puff);
    }
  }
  for (let i = 0; i < 20; i++) g.add(tree(rng, { x: rng.float(-60, 60), z: rng.float(-50, -22), s: rng.float(1.2, 2), kind: 'pine' }));
  return { group: g, light: { sun: '#ffc48a', sunI: 2.4, hemiSky: '#ffd8a8', hemiGround: '#6b5a3a', hemiI: 1.0, dir: [-12, 8, 6] }, fog: ['#f3c99b', 30, 130] };
}

function school(seed) {
  const rng = new Rng(seed);
  const g = new THREE.Group();
  g.add(sky('#47a6ff', '#d6efff', '#f0f8ff'));
  g.add(ground('#71c653', 220, seed, { flatRadius: 14 }));
  addClouds(g, rng);
  // playground asphalt
  g.add(box(14, 0.04, 9, '#8d939b', { y: 0.02, z: -1, cast: false }));
  // lines (hopscotch)
  for (let i = 0; i < 5; i++) g.add(box(0.8, 0.01, 0.8, i % 2 ? '#ffd166' : '#ffffff', { x: 4 + (i % 2) * 0.0, y: 0.05, z: 1.5 - i * 0.9, cast: false }));
  // school building
  const b = new THREE.Group();
  b.add(box(18, 7, 6, '#e8735a', { base: true }));
  b.add(box(18.4, 0.5, 6.4, '#f6efe6', { y: 7.25 }));
  b.add(box(5, 9.5, 6.2, '#f2a65a', { base: true }));
  b.add(mesh(new THREE.ConeGeometry(3.4, 2.4, 4), mat('#5a6b7d'), { y: 10.7, ry: Math.PI / 4 }));
  // clock
  b.add(mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.15, 16), mat('#ffffff'), { y: 8, z: 3.15, rx: Math.PI / 2 }));
  b.add(box(0.08, 0.6, 0.05, '#222', { y: 8.25, z: 3.26 })); b.add(box(0.45, 0.08, 0.05, '#222', { x: 0.2, y: 8, z: 3.26 }));
  const glass = mat('#9fd8ff', { emissive: '#5ab8ff', emissiveIntensity: 0.15, metalness: 0.2, roughness: 0.3 });
  for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) {
    const x = -7.6 + c * 1.6 + (c > 2 ? 5.6 : 0);
    b.add(box(1.1, 1.3, 0.08, glass, { x, y: 1.9 + r * 2.8, z: 3.03 }));
  }
  b.add(box(2.2, 2.8, 0.1, '#3c6e9e', { base: true, z: 3.1 }));
  b.position.set(0, 0, -10);
  g.add(b);
  g.add(flag('#2d6cdf', { x: -6, z: -5.5, pole: 6 }));
  // basketball hoop
  const hoop = new THREE.Group();
  hoop.add(box(0.12, 3.2, 0.12, '#555', { base: true }));
  hoop.add(box(1.2, 0.8, 0.08, '#ffffff', { y: 3.2, z: 0.1 }));
  hoop.add(mesh(new THREE.TorusGeometry(0.25, 0.03, 6, 12), mat('#ff6b1a'), { y: 2.9, z: 0.4, rx: Math.PI / 2 }));
  hoop.position.set(-5.5, 0, -3.5);
  g.add(hoop);
  // yellow school bus
  const bus = new THREE.Group();
  bus.add(box(5.2, 2.0, 2.0, '#ffc21a', { y: 1.4 }));
  bus.add(box(1.1, 1.2, 1.9, '#ffc21a', { x: 3.0, y: 1.0 }));
  for (let i = 0; i < 5; i++) bus.add(box(0.7, 0.6, 2.04, '#9fd8ff', { x: -2 + i * 0.95, y: 1.9 }));
  for (const [x, z] of [[-1.6, 1], [1.8, 1], [-1.6, -1], [1.8, -1]]) bus.add(mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 12), mat('#222'), { x, y: 0.45, z, rx: Math.PI / 2 }));
  bus.position.set(9.5, 0, -4.5); bus.rotation.y = -0.4;
  g.add(bus);
  for (let i = 0; i < 10; i++) g.add(tree(rng, { x: rng.pick([-1, 1]) * rng.float(11, 20), z: rng.float(-20, 3), s: rng.float(1.1, 1.6), kind: 'round' }));
  return { group: g, light: { sun: '#fff6e0', sunI: 2.7, hemiSky: '#cfe8ff', hemiGround: '#7d8a6a', hemiI: 1.15, dir: [10, 14, 10] }, fog: ['#dff1ff', 40, 160] };
}

function houseInterior(seed) {
  const rng = new Rng(seed);
  const g = new THREE.Group();
  g.add(sky('#ffd9a8', '#ffeacc', '#ffeacc'));
  // floor + walls (open front)
  const floor = box(16, 0.2, 12, '#c98d5a', { y: -0.1, z: -2, cast: false });
  g.add(floor);
  for (let i = 0; i < 14; i++) g.add(box(0.03, 0.01, 12, '#a87047', { x: -7.5 + i * 1.15, y: 0.005, z: -2, cast: false }));
  g.add(box(16, 8, 0.3, '#9fd3c7', { base: true, z: -8 }));
  g.add(box(0.3, 8, 12, '#f7d6a0', { base: true, x: -8, z: -2 }));
  g.add(box(0.3, 8, 12, '#f7d6a0', { base: true, x: 8, z: -2 }));
  g.add(box(16, 0.4, 0.35, '#ffffff', { y: 0.2, z: -7.8 }));
  // window with daylight
  g.add(box(3.4, 2.6, 0.1, '#bfe9ff', { x: 3.5, y: 4.2, z: -7.82 }).add(new THREE.Object3D()));
  g.add(box(3.6, 0.2, 0.3, '#ffffff', { x: 3.5, y: 2.85, z: -7.75 }));
  g.add(box(0.12, 2.6, 0.12, '#ffffff', { x: 3.5, y: 4.2, z: -7.75 }));
  // sofa
  const sofa = new THREE.Group();
  sofa.add(box(4, 0.8, 1.4, '#e05d5d', { y: 0.55 }));
  sofa.add(box(4, 1.2, 0.4, '#d14d4d', { y: 1.2, z: -0.6 }));
  for (const sx of [-1, 1]) sofa.add(box(0.4, 1.0, 1.4, '#d14d4d', { x: sx * 2.0, y: 0.75 }));
  sofa.position.set(-2.5, 0, -5.8);
  g.add(sofa);
  // rug, table, lamp, TV, plant, picture frames
  g.add(mesh(new THREE.CylinderGeometry(3, 3, 0.03, 20), mat('#6a5acd'), { x: 0, y: 0.02, z: -2.5, cast: false }));
  const table = new THREE.Group();
  table.add(box(1.8, 0.1, 1.0, '#8b5a2b', { y: 0.7 }));
  for (const [x, z] of [[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]]) table.add(box(0.08, 0.7, 0.08, '#6b4a2c', { x, y: 0.35, z }));
  table.add(mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.2, 10), mat('#ffffff'), { x: 0.3, y: 0.85 }));
  table.position.set(-2.5, 0, -3.6);
  g.add(table);
  const tv = new THREE.Group();
  tv.add(box(2.2, 0.7, 0.7, '#4a3a2a', { base: true }));
  tv.add(box(2.0, 1.2, 0.1, '#111', { y: 1.35 }));
  tv.add(box(1.85, 1.05, 0.02, '#3b7cff', { y: 1.35, z: 0.06, cast: false }));
  tv.position.set(5.5, 0, -5); tv.rotation.y = -0.6;
  g.add(tv);
  g.add(lamp({ x: -6.3, z: -6.5, h: 2.4 }));
  const pot = mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.6, 8), mat('#c86b3c'), { x: 6.8, y: 0.3, z: -7 });
  g.add(pot); g.add(bush(rng, { x: 6.8, z: -7, s: 0.9 }).translateY(0.5));
  for (let i = 0; i < 3; i++) g.add(box(1.0, 0.8, 0.06, rng.pick(['#ffd166', '#06d6a0', '#ef476f']), { x: -5 + i * 1.5, y: 4.5 + (i % 2) * 0.5, z: -7.82 }));
  return { group: g, light: { sun: '#fff1d6', sunI: 2.0, hemiSky: '#fff2dc', hemiGround: '#b08a66', hemiI: 1.5, dir: [5, 10, 8] }, fog: ['#ffe9cc', 30, 80], interior: true };
}

function city(seed) {
  const rng = new Rng(seed);
  const g = new THREE.Group();
  g.add(sky('#ff7eb3', '#ffc58f', '#ffd9b0', new THREE.Vector3(0.2, 0.12, -1)));
  g.add(ground('#7f8c8d', 260, seed, { flatRadius: 60, bumps: 0, variation: 0.03 }));
  // road + sidewalks
  g.add(box(200, 0.03, 6, '#3d4247', { y: 0.02, z: -3, cast: false }));
  for (let i = -20; i <= 20; i++) g.add(box(1.6, 0.01, 0.18, '#ffffff', { x: i * 3.5, y: 0.04, z: -3, cast: false }));
  g.add(box(200, 0.18, 4, '#c9c3b8', { y: 0.09, z: 1.8, cast: false }));
  g.add(box(200, 0.18, 4, '#c9c3b8', { y: 0.09, z: -7.8, cast: false }));
  // buildings
  const palette = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1', '#9c755f', '#bab0ab'];
  const win = mat('#ffe7a3', { emissive: '#ffd36b', emissiveIntensity: 0.6 });
  const winDark = mat('#2e3b4e', { metalness: 0.3, roughness: 0.3 });
  for (const row of [{ z: -14, n: 12 }, { z: -26, n: 14 }]) {
    let x = -34;
    for (let i = 0; i < row.n; i++) {
      const w = rng.float(4, 7), h = rng.float(row.z < -20 ? 18 : 8, row.z < -20 ? 40 : 22), d = rng.float(5, 8);
      const bg = new THREE.Group();
      bg.add(box(w, h, d, rng.pick(palette), { base: true }));
      const cols = Math.floor(w / 1.2), rows = Math.floor(h / 1.8);
      for (let r = 1; r < rows; r++) for (let c = 0; c < cols; c++) {
        bg.add(box(0.6, 0.9, 0.06, rng.chance(0.55) ? win : winDark, { x: -w / 2 + 0.9 + c * ((w - 1.2) / Math.max(1, cols - 1)) - 0.3, y: r * 1.8, z: d / 2 + 0.03, cast: false, receive: false }));
      }
      if (rng.chance(0.4)) bg.add(box(w * 0.3, 1.5, d * 0.3, '#888', { y: h + 0.75 }));
      bg.position.set(x + w / 2, 0, row.z);
      g.add(bg);
      x += w + rng.float(0.3, 1.5);
    }
  }
  // street lamps, cars, trees in planters
  for (let i = -4; i <= 4; i++) g.add(lamp({ x: i * 6, z: 0.6 }));
  const carColors = ['#e63946', '#2d6cdf', '#ffd166', '#06d6a0', '#ffffff'];
  for (let i = 0; i < 5; i++) {
    const car = new THREE.Group();
    car.add(box(2.6, 0.7, 1.3, carColors[i], { y: 0.6 }));
    car.add(box(1.4, 0.6, 1.2, carColors[i], { x: -0.1, y: 1.2 }));
    car.add(box(1.3, 0.5, 1.22, '#9fd8ff', { x: -0.1, y: 1.2 }));
    for (const [x, z] of [[-0.85, 0.65], [0.85, 0.65], [-0.85, -0.65], [0.85, -0.65]]) car.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 10), mat('#1d1d1d'), { x, y: 0.3, z, rx: Math.PI / 2 }));
    const lane = i % 2 ? -4.5 : -1.6;
    car.position.set(0, 0, lane);
    if (i % 2) car.rotation.y = Math.PI;
    car.userData.drive = { speed: i % 2 ? -7 : 9, range: 90, offset: i * 23 };
    g.add(car);
  }
  for (let i = -3; i <= 3; i++) {
    g.add(box(1.2, 0.5, 1.2, '#8d6e63', { x: i * 6 + 3, y: 0.35, z: 2.6 }));
    g.add(tree(rng, { x: i * 6 + 3, z: 2.6, s: 0.8, kind: 'round' }).translateY(0.5));
  }
  return { group: g, light: { sun: '#ffd1a1', sunI: 2.3, hemiSky: '#ffd0e0', hemiGround: '#6b6b7a', hemiI: 1.2, dir: [6, 10, 12] }, fog: ['#ffc9a6', 40, 170] };
}

export const ENVIRONMENTS = { castle, village, battlefield, school, house: houseInterior, city };
export const ENVIRONMENT_LABELS = {
  castle: 'Medieval castle', village: 'Medieval village', battlefield: 'Battlefield',
  school: 'School', house: 'House (living room)', city: 'Modern city',
};

export function buildEnvironment(name, seed = 7) {
  const fn = ENVIRONMENTS[name];
  if (!fn) throw new Error(`Unknown environment "${name}"`);
  return fn(seed);
}
