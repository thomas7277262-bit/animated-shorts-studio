import * as THREE from 'three';
import { Rng } from '../rng.js';
import { mat, mesh, box, sky, cloud } from './common.js';

// Bright, saturated "game town" suburb: colourful gabled houses, picket fences,
// flower planters, a wide road with yellow dashes, white sidewalks, a blue-glass
// downtown and snowy low-poly mountains. The acting area is the near sidewalk
// and lawn around the origin (|x| < 5, z 0..3); the camera looks towards -z.

const smooth = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0, ...o });
const sm = new Map();
const S = (c, o) => { const k = c + JSON.stringify(o || {}); if (!sm.has(k)) sm.set(k, smooth(c, o)); return sm.get(k); };

function gableRoof(w, d, h, color, overhang = 0.25) {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 - overhang, 0); shape.lineTo(w / 2 + overhang, 0); shape.lineTo(0, h); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d + overhang * 2, bevelEnabled: false });
  geo.translate(0, 0, -(d + overhang * 2) / 2);
  const m = new THREE.Mesh(geo, S(color, { flatShading: true, roughness: 0.55 }));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function windowBlock(w, h) {
  const g = new THREE.Group();
  g.add(box(w + 0.12, h + 0.12, 0.06, S('#ffffff'), {}));
  g.add(box(w, h, 0.08, S('#8fd3ff', { roughness: 0.15, metalness: 0.1, emissive: '#3aa0ff', emissiveIntensity: 0.12 }), { z: 0.01 }));
  g.add(box(0.05, h, 0.1, S('#ffffff'), { z: 0.02 }));
  return g;
}

function house(rng, { x, z, ry = 0, wall, roof, floors = 2 }) {
  const g = new THREE.Group();
  const w = rng.float(3.6, 4.4), d = rng.float(3.2, 3.8), h = 1.5 * floors + 0.6;
  g.add(box(w, h, d, S(wall), { base: true }));
  g.add(box(w + 0.1, 0.3, d + 0.1, S('#ffffff'), { y: 0.15 }));            // base trim
  const r = gableRoof(w, d, 1.6, roof); r.position.y = h; g.add(r);
  // front door + steps
  const doorColor = rng.pick(['#e53935', '#f57c00', '#8e24aa', '#1e88e5', '#43a047']);
  g.add(box(0.9, 1.5, 0.08, S('#ffffff'), { base: true, x: 0, z: d / 2 + 0.02 }));
  g.add(box(0.75, 1.4, 0.1, S(doorColor), { base: true, x: 0, z: d / 2 + 0.04 }));
  g.add(box(1.3, 0.12, 0.5, S('#d7dde2'), { y: 0.06, z: d / 2 + 0.3 }));
  const awn = gableRoof(1.2, 0.5, 0.35, doorColor, 0.05); awn.position.set(0, 1.6, d / 2 + 0.25); g.add(awn);
  // windows
  for (let f = 0; f < floors; f++) {
    for (const sx of [-1, 1]) {
      if (f === 0 && Math.abs(sx) < 1) continue;
      const win = windowBlock(0.8, 0.8); win.position.set(sx * w * 0.3, 0.95 + f * 1.5 + (f === 0 ? 0 : 0.1), d / 2 + 0.03); g.add(win);
    }
    if (f > 0) { const win = windowBlock(0.7, 0.7); win.position.set(0, 1.05 + f * 1.5, d / 2 + 0.03); g.add(win); }
  }
  // chimney
  if (rng.chance(0.7)) g.add(box(0.4, 1.2, 0.4, S('#b5653a'), { x: w * 0.28, y: h + 1.0, z: -d * 0.15 }));
  g.position.set(x, 0, z); g.rotation.y = ry;
  return g;
}

function picketFence(x0, x1, z) {
  const g = new THREE.Group();
  const white = S('#ffffff');
  for (let x = x0; x <= x1 + 0.01; x += 0.32) {
    g.add(box(0.1, 0.62, 0.06, white, { x, y: 0.31, z }));
    g.add(mesh(new THREE.ConeGeometry(0.075, 0.12, 4), white, { x, y: 0.68, z, ry: Math.PI / 4 }));
  }
  for (const y of [0.2, 0.45]) g.add(box(x1 - x0 + 0.1, 0.07, 0.04, white, { x: (x0 + x1) / 2, y, z: z - 0.04 }));
  return g;
}

function planter(rng, x, z, len = 1.6) {
  const g = new THREE.Group();
  g.add(box(len, 0.32, 0.55, S('#6d4c41'), { y: 0.16 }));
  g.add(box(len - 0.12, 0.04, 0.43, S('#4e342e'), { y: 0.33 }));
  const cols = ['#ff5c8a', '#ffd54f', '#7c4dff', '#4fc3f7', '#ff7043', '#ffffff'];
  for (let i = 0; i < Math.round(len * 4); i++) {
    const fx = -len / 2 + 0.15 + (i / (len * 4)) * (len - 0.3);
    g.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 4), S('#43a047'), { x: fx, y: 0.42, z: rng.float(-0.12, 0.12) }));
    g.add(mesh(new THREE.IcosahedronGeometry(0.075, 0), S(rng.pick(cols)), { x: fx, y: 0.53, z: rng.float(-0.12, 0.12) }));
  }
  g.position.set(x, 0, z);
  return g;
}

function roundTree(rng, x, z, s = 1) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.3, 6), S('#8d5a32'), { y: 0.65 }));
  const leaf = S(rng.pick(['#43c74a', '#5bd14e', '#38b44a']), { flatShading: true, roughness: 0.7 });
  g.add(mesh(new THREE.IcosahedronGeometry(0.85, 0), leaf, { y: 1.9 }));
  g.add(mesh(new THREE.IcosahedronGeometry(0.6, 0), leaf, { x: 0.45, y: 1.7, z: 0.2 }));
  g.add(mesh(new THREE.IcosahedronGeometry(0.55, 0), leaf, { x: -0.4, y: 1.75, z: -0.15 }));
  g.position.set(x, 0, z); g.scale.setScalar(s);
  return g;
}

function streetLamp(x, z, facing = 1) {
  const g = new THREE.Group();
  const dark = S('#263238', { metalness: 0.3, roughness: 0.4 });
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.07, 3.4, 8), dark, { y: 1.7 }));
  g.add(box(0.9, 0.06, 0.08, dark, { x: facing * 0.4, y: 3.4 }));
  g.add(box(0.35, 0.12, 0.2, S('#fffbe0', { emissive: '#fff3b0', emissiveIntensity: 0.6 }), { x: facing * 0.8, y: 3.33 }));
  g.position.set(x, 0, z);
  return g;
}

function mailbox(x, z, color) {
  const g = new THREE.Group();
  g.add(box(0.07, 0.8, 0.07, S('#6d4c41'), { y: 0.4 }));
  g.add(box(0.22, 0.2, 0.36, S(color), { y: 0.88 }));
  g.position.set(x, 0, z);
  return g;
}

function glassTowerTexture(rng, base, line) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 128, 256);
  for (let y = 4; y < 256; y += 16) for (let x = 4; x < 128; x += 16) {
    g.fillStyle = rng.chance(0.15) ? '#e8f6ff' : line;
    g.fillRect(x, y, 11, 11);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function suburb(seed = 5, opts = {}) {
  const rng = new Rng(seed);
  const g = new THREE.Group();
  g.add(sky('#5fb6ff', '#d9f0ff', '#e9f6ff', new THREE.Vector3(0.3, 0.6, 0.4)));
  // ground: bright lawn
  g.add(mesh(new THREE.PlaneGeometry(400, 400), S('#5cd13d', { roughness: 0.9 }), { rx: -Math.PI / 2, cast: false }));
  // road (along x) with yellow dashes, curbs and white sidewalks
  g.add(box(220, 0.04, 7.2, S('#4b5157', { roughness: 0.85 }), { y: 0.02, z: -4.6, cast: false }));
  for (let x = -100; x <= 100; x += 4) g.add(box(1.8, 0.01, 0.22, S('#ffd21f'), { x, y: 0.05, z: -4.6, cast: false }));
  for (const [z, d] of [[-0.25, 2.4], [-9.15, 1.9]]) {
    g.add(box(220, 0.16, d, S('#eef2f5', { roughness: 0.8 }), { y: 0.08, z, cast: false }));
    g.add(box(220, 0.2, 0.18, S('#c9d1d8'), { y: 0.1, z: z + (z < -5 ? d / 2 : -d / 2), cast: false }));
  }
  // far-side houses with fenced front yards
  const walls = ['#ffd23f', '#f9e7b0', '#b9a3e3', '#ffab6b', '#a7dfa0', '#9dd3ff', '#ffe082', '#f8bbd0'];
  const roofs = ['#e53935', '#1e63d6', '#7a5136', '#e53935', '#1e63d6'];
  for (let i = -6; i <= 6; i++) {
    const x = i * 6.2 + rng.float(-0.3, 0.3);
    g.add(house(rng, { x, z: -14.6, wall: walls[(i + 8) % walls.length], roof: roofs[(i + 7) % roofs.length], floors: rng.chance(0.75) ? 2 : 1 }));
    g.add(picketFence(x - 2.8, x - 0.8, -10.6)); g.add(picketFence(x + 0.8, x + 2.8, -10.6));
    if (rng.chance(0.6)) g.add(planter(rng, x - 1.9, -11.2));
    if (rng.chance(0.5)) g.add(roundTree(rng, x + 3.0, -12.2, rng.float(0.9, 1.2)));
    if (rng.chance(0.5)) g.add(mailbox(x + 1.2, -10.3, rng.pick(['#e53935', '#1e88e5', '#8e24aa'])));
  }
  // second row of houses up the slope
  for (let i = -6; i <= 6; i++) {
    const hh = house(rng, { x: i * 6.4 + 3, z: -26, wall: walls[(i + 11) % walls.length], roof: roofs[(i + 9) % roofs.length], floors: 2 });
    hh.position.y = 0.6; g.add(hh);
    if (rng.chance(0.5)) g.add(roundTree(rng, i * 6.4 + 0.2, -22.5, 1.1));
  }
  // near side: lawn with planters and lamp posts, kept clear around the acting area
  for (let i = -5; i <= 5; i++) {
    const x = i * 7;
    if (opts.clearStage !== false && Math.abs(x) < 6) continue;
    g.add(streetLamp(x, -1.15, -1));
    g.add(planter(rng, x + 2.5, 1.8, 1.8));
    g.add(picketFence(x - 3, x + 3, 2.6));
  }
  for (let i = -5; i <= 5; i++) { const x = i * 7 + 3.5; if (Math.abs(x) > 6) g.add(streetLamp(x, -8.3, 1)); }
  // downtown: blue glass towers
  const towerMat = (b, l) => new THREE.MeshStandardMaterial({ map: glassTowerTexture(rng, b, l), roughness: 0.3, metalness: 0.15 });
  for (let i = 0; i < 14; i++) {
    const w = rng.float(6, 9), h = rng.float(18, 34), d = rng.float(6, 9);
    const m = towerMat(rng.pick(['#4aa3f0', '#62b5f5', '#3d8fe0']), rng.pick(['#9fd4ff', '#b7e1ff']));
    m.map.repeat.set(w / 6, h / 10);
    const t = mesh(new THREE.BoxGeometry(w, h, d), m, { x: -70 + i * 10.5 + rng.float(-1.5, 1.5), y: h / 2, z: -95 - rng.float(0, 16), cast: false });
    g.add(t);
    g.add(box(w * 0.4, 1.2, d * 0.4, S('#cfd8dc'), { x: t.position.x, y: h + 0.6, z: t.position.z }));
  }
  // snowy low-poly mountains
  for (let i = 0; i < 6; i++) {
    const x = -110 + i * 44 + rng.float(-6, 6), z = -150 - rng.float(0, 20), h = rng.float(55, 80), r = rng.float(28, 40);
    g.add(mesh(new THREE.ConeGeometry(r, h, 5), S('#8ea7c8', { flatShading: true }), { x, y: h / 2 - 2, z, ry: rng.float(0, 3), cast: false }));
    g.add(mesh(new THREE.ConeGeometry(r * 0.45, h * 0.45, 5), S('#ffffff', { flatShading: true }), { x, y: h - 2 - h * 0.225 + 0.2, z, cast: false }));
  }
  // green hills between downtown and mountains
  for (let i = 0; i < 8; i++) g.add(mesh(new THREE.SphereGeometry(rng.float(10, 16), 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), S('#4fc04a', { flatShading: true }), { x: -90 + i * 26, y: -1, z: -120, cast: false }));
  const cloudWhite = new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false }); // pure white, unaffected by the green bounce light
  for (let i = 0; i < 8; i++) {
    const c = cloud(rng, { x: rng.float(-80, 80), y: rng.float(38, 60), z: rng.float(-150, -90), s: rng.float(1.2, 2) });
    c.traverse((o) => { if (o.isMesh) o.material = cloudWhite; });
    g.add(c);
  }
  return { group: g, light: { sun: '#fff8ec', sunI: 2.6, hemiSky: '#d8eeff', hemiGround: '#7fcf5a', hemiI: 1.35, dir: [12, 18, 14] }, fog: ['#e3f3ff', 90, 330] };
}
