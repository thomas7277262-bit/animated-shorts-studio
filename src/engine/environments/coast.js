import * as THREE from 'three';
import { Rng } from '../rng.js';
import { mat, mesh, box, sky, rock } from './common.js';

// "Lights Out at 9" sets: a small harbour town by the sea with a lighthouse on
// the rocks, the inside of the lighthouse (a spiral stair) and the lamp room.
//
// Each set returns update(t, state) so a scene can switch things over time:
//   state.power  true/false  – house windows and street lamps on or off
//   state.beam   'on' | 'off' | 'flicker' – the lighthouse light
//   state.sea    wave height (0.15 calm … 1.0 storm)
//   state.lamp   'off' | 'on' – the oil lamp in the lamp room
//
// Town layout (camera looks towards -z): the acting street runs along x at
// z = 0..3; a row of cosy houses stands at z = -9 (low, so the sea and the
// lighthouse show above the roofs); the sea starts at z = -16. The lighthouse
// stands on a rocky point at LIGHTHOUSE. The harbour pier starts at HARBOUR.
export const LIGHTHOUSE = [22, -46];
export const HARBOUR = [-34, -14];

const smooth = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0, ...o });

function seaMesh(w, d, segX, segZ, color) {
  const geo = new THREE.PlaneGeometry(w, d, segX, segZ);
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, smooth(color, { roughness: 0.35, metalness: 0.1, flatShading: true }));
  m.receiveShadow = true;
  m.userData.sea = { base: geo.attributes.position.array.slice() };
  return m;
}
function animateSea(m, t, amp) {
  const { base } = m.userData.sea, arr = m.geometry.attributes.position.array;
  for (let i = 0; i < arr.length; i += 3) {
    const x = base[i] + m.position.x, z = base[i + 2] + m.position.z;
    arr[i + 1] = base[i + 1] + amp * (Math.sin(x * 0.35 + t * 1.6) * 0.6 + Math.sin(z * 0.5 - t * 2.1) * 0.5 + Math.sin((x + z) * 0.9 + t * 3.3) * 0.25);
  }
  m.geometry.attributes.position.needsUpdate = true;
  m.geometry.computeVertexNormals();
}

// additive light-beam cone that fades out along its length (apex at the origin, pointing down -y before rotation)
function fadingBeamGeometry(radius, length) {
  const geo = new THREE.ConeGeometry(radius, length, 24, 8, true); geo.translate(0, -length / 2, 0);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) { const u = Math.min(1, -pos.getY(i) / length), k = Math.pow(1 - u, 1.6); col[i * 3] = k; col[i * 3 + 1] = k * 0.95; col[i * 3 + 2] = k * 0.8; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}
const beamMaterial = (op) => new THREE.MeshBasicMaterial({ color: '#ffffff', vertexColors: true, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });

function cosyHouse(rng, x, z, ry = 0) {
  const g = new THREE.Group();
  const w = rng.float(3.2, 4.2), d = rng.float(3, 3.6), h = rng.pick([2.4, 2.6, 3.8]);
  g.add(box(w, h, d, smooth(rng.pick(['#d9cbb0', '#c9b79a', '#b9c7cf', '#d8b9a0', '#a9b8a0', '#e0d6c2'])), { base: true }));
  const roof = new THREE.Shape(); roof.moveTo(-w / 2 - 0.25, 0); roof.lineTo(w / 2 + 0.25, 0); roof.lineTo(0, 1.4); roof.closePath();
  const rg = new THREE.ExtrudeGeometry(roof, { depth: d + 0.5, bevelEnabled: false }); rg.translate(0, 0, -(d + 0.5) / 2);
  g.add(mesh(rg, smooth(rng.pick(['#5a3b2e', '#3d4a5c', '#6b2f2a', '#4a4a4a']), { flatShading: true }), { y: h }));
  g.add(box(0.8, 1.4, 0.08, smooth('#4a2e1e'), { base: true, z: d / 2 + 0.03 }));
  const nWin = h > 3 ? 2 : 1;
  for (let f = 0; f < nWin; f++) for (const sx of [-1, 1]) {
    const win = box(0.7, 0.7, 0.08, smooth('#ffd27a', { emissive: '#ffb347', emissiveIntensity: 1.2 }), { x: sx * w * 0.28, y: 1.1 + f * 1.3, z: d / 2 + 0.03 });
    win.material = win.material.clone(); win.material.userData.powered = 1.2; // its own material so it can switch off
    if (rng.chance(0.15)) win.material.userData.powered = 0; // a few dark windows
    g.add(win);
    g.add(box(0.82, 0.08, 0.12, smooth('#f2efe6'), { x: sx * w * 0.28, y: 0.72 + f * 1.3, z: d / 2 + 0.05 }));
  }
  if (rng.chance(0.7)) g.add(box(0.4, 1.0, 0.4, smooth('#6d6d6d'), { x: w * 0.25, y: h + 0.9, z: -d * 0.1 }));
  g.position.set(x, 0, z); g.rotation.y = ry;
  return g;
}

function streetLamp(x, z) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.4, 6), smooth('#2b2f36', { metalness: 0.4 }), { y: 1.7 }));
  const bulb = mesh(new THREE.BoxGeometry(0.32, 0.36, 0.32), smooth('#fff1c4', { emissive: '#ffcf6b', emissiveIntensity: 1.4 }), { y: 3.5 });
  bulb.material = bulb.material.clone(); bulb.material.userData.powered = 1.4;
  g.add(bulb);
  g.position.set(x, 0, z);
  return g;
}

/** The lighthouse tower (built at the origin; ~17 units tall). */
export function lighthouseTower() {
  const g = new THREE.Group();
  const H = 14, r0 = 2.1, r1 = 1.5, bands = 5;
  for (let i = 0; i < bands; i++) {
    const a = i / bands, b = (i + 1) / bands;
    g.add(mesh(new THREE.CylinderGeometry(r0 + (r1 - r0) * b, r0 + (r1 - r0) * a, H / bands, 20), smooth(i % 2 ? '#c8302c' : '#f4f1ea'), { y: H * (a + b) / 2 }));
  }
  g.add(box(1.0, 2.0, 0.2, smooth('#3b2a1e'), { base: true, z: r0 - 0.05 }));                      // door
  for (let i = 1; i < 4; i++) g.add(box(0.35, 0.6, 0.12, smooth('#ffe3a0', { emissive: '#ffb347', emissiveIntensity: 0.4 }), { y: i * 3.4, z: r0 + (r1 - r0) * (i * 3.4 / H) - 0.02 }));
  g.add(mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.3, 20), smooth('#2b2b2b'), { y: H + 0.15 }));     // gallery
  for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; g.add(box(0.05, 0.7, 0.05, smooth('#2b2b2b'), { x: Math.sin(a) * 2.2, y: H + 0.6, z: Math.cos(a) * 2.2 })); }
  g.add(mesh(new THREE.TorusGeometry(2.2, 0.04, 4, 30), smooth('#2b2b2b'), { y: H + 0.95, rx: Math.PI / 2 }));
  const glass = mesh(new THREE.CylinderGeometry(1.3, 1.3, 1.8, 12, 1, true), new THREE.MeshStandardMaterial({ color: '#c9e6ff', transparent: true, opacity: 0.35, roughness: 0.1, side: THREE.DoubleSide }), { y: H + 1.2 });
  g.add(glass);
  const lamp = mesh(new THREE.SphereGeometry(0.55, 16, 12), new THREE.MeshBasicMaterial({ color: '#fff4c8' }), { y: H + 1.2 });
  lamp.userData.lighthouseLamp = true; g.add(lamp);
  g.add(mesh(new THREE.ConeGeometry(1.6, 1.1, 12), smooth('#c8302c'), { y: H + 2.65 }));
  g.add(mesh(new THREE.SphereGeometry(0.18, 8, 6), smooth('#2b2b2b'), { y: H + 3.3 }));
  // two light beams (additive cones) that sweep round
  const beams = new THREE.Group(); beams.position.y = H + 1.2; beams.userData.beams = true;
  const beamMat = beamMaterial(0.32);
  for (const dir of [1, -1]) {
    const geo = fadingBeamGeometry(9, 120); geo.rotateZ(dir * Math.PI / 2);
    beams.add(new THREE.Mesh(geo, beamMat));
  }
  g.add(beams);
  return g;
}

export function harbortown(seed, opts = {}) {
  const rng = new Rng(seed);
  const g = new THREE.Group();
  g.add(sky('#14306e', '#3d5a9a', '#24345e', new THREE.Vector3(0, -1, 0)));
  // land (street level) and a cobbled street
  g.add(box(220, 0.4, 60, smooth('#4f6b45'), { y: -0.2, z: 14, cast: false }));
  g.add(box(220, 0.42, 10, smooth('#596673'), { y: -0.19, z: -11, cast: false }));                 // seafront promenade
  g.add(box(220, 0.03, 4.4, smooth('#6e6a66'), { y: 0.02, z: 1.2, cast: false }));                  // the street
  for (let i = -40; i < 40; i++) g.add(box(0.9, 0.031, 0.06, smooth('#8a857d'), { x: i * 1.3, y: 0.03, z: 3.4, cast: false }));
  // sea + a low sea wall
  const sea = seaMesh(400, 300, 120, 80, '#1d3a5c'); sea.position.set(0, -0.6, -166); g.add(sea);
  g.add(box(220, 0.8, 0.6, smooth('#7d838a'), { y: 0.0, z: -16, cast: false }));
  // houses along the seafront (gap around the lighthouse view)
  for (let i = -9; i <= 9; i++) {
    const x = i * 5.2 + rng.float(-0.4, 0.4);
    if (x > 12 && x < 30) continue;
    g.add(cosyHouse(rng, x, -8.5));
  }
  // houses behind the camera side of the street (seen in reverse shots)
  for (let i = -9; i <= 9; i++) g.add(cosyHouse(rng, i * 5.4 + 2, 17, Math.PI));
  for (let i = -6; i <= 6; i++) { const x = i * 8 + 4; if (Math.abs(x) > 5) g.add(streetLamp(x, -0.9)); }
  // rocky point with the lighthouse
  const [lx, lz] = LIGHTHOUSE;
  for (let i = 0; i < 26; i++) {
    const a = rng.float(0, Math.PI * 2), r = rng.float(0, 9);
    const rk = rock(rng, { x: lx + Math.cos(a) * r, z: lz + Math.sin(a) * r, s: rng.float(1.6, 3.4), color: rng.pick(['#4b4f57', '#5b6068', '#3f434a']) });
    rk.position.y = -0.8; g.add(rk);
  }
  g.add(mesh(new THREE.CylinderGeometry(5.5, 7, 2.2, 10), smooth('#4b4f57', { flatShading: true }), { x: lx, y: 0.3, z: lz }));
  // path of flat stones from the promenade to the rocks
  for (let i = 0; i < 16; i++) { const u = i / 15; g.add(box(1.6, 0.5, 1.6, smooth('#5c6168'), { x: 18 + (lx - 18) * u, y: -0.1 + u * 1.1, z: -16 + (lz + 5 - -16) * u, ry: rng.float(-0.3, 0.3) })); }
  const tower = lighthouseTower(); tower.position.set(lx, 1.4, lz); g.add(tower);
  // jagged rocks in the sea where a boat could wreck
  for (let i = 0; i < 9; i++) { const rk = rock(rng, { x: lx - 14 + i * 2.6 + rng.float(-1, 1), z: lz - 16 + rng.float(-3, 3), s: rng.float(1.5, 3), color: '#30343a' }); rk.position.y = -0.7; g.add(rk); }
  // harbour pier with posts and a little harbour light
  const [hx, hz] = HARBOUR;
  g.add(box(3, 0.3, 22, smooth('#6b4a2e'), { x: hx, y: 0.1, z: hz - 10, cast: false }));
  for (let i = 0; i < 12; i++) for (const sx of [-1, 1]) g.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.2, 6), smooth('#4a3220'), { x: hx + sx * 1.4, y: -0.7, z: hz - i * 2 }));
  // distant headlands
  for (let i = 0; i < 5; i++) g.add(mesh(new THREE.ConeGeometry(rng.float(18, 30), rng.float(10, 18), 6), smooth('#18223a', { flatShading: true }), { x: -160 + i * 80, y: 2, z: -290, cast: false }));

  const lampMats = [];
  g.traverse((o) => { if (o.material && o.material.userData && o.material.userData.powered !== undefined) lampMats.push(o.material); });
  const beams = []; const lampBalls = [];
  g.traverse((o) => { if (o.userData.beams) beams.push(o); if (o.userData.lighthouseLamp) lampBalls.push(o); });
  function update(t, st) {
    const on = st.power !== false;
    for (const m of lampMats) { m.emissiveIntensity = on ? m.userData.powered : 0; m.color.set(on && m.userData.powered ? '#ffd27a' : '#2a2f3a'); }
    const bs = st.beam || 'on';
    const lit = bs === 'on' || (bs === 'flicker' && (Math.sin(t * 37) + Math.sin(t * 23.7)) > 0.3);
    for (const b of beams) { b.visible = lit; b.rotation.y = t * 0.9; }
    for (const l of lampBalls) l.material.color.set(lit ? '#fff4c8' : '#2a2e36');
    animateSea(sea, t, st.sea ?? 0.18);
  }
  return { group: g, update, light: { sun: '#c9d6ff', sunI: 1.5, hemiSky: '#8aa0e0', hemiGround: '#2a3352', hemiI: 1.25, dir: [-8, 18, 14] }, fog: ['#1e2c52', 50, 280] };
}

/** Inside the lighthouse: a spiral stair round a central column (camera inside the drum). */
export function lighthouseStairs(seed) {
  const g = new THREE.Group();
  const R = 4.4, H = 16;
  const wall = mesh(new THREE.CylinderGeometry(R, R, H, 28, 1, true), smooth('#e6dccb', { side: THREE.BackSide }), { y: H / 2 });
  g.add(wall);
  g.add(mesh(new THREE.CylinderGeometry(R, R, 0.2, 28), smooth('#5b5148'), { y: -0.1 }));
  g.add(mesh(new THREE.CylinderGeometry(0.6, 0.6, H, 12), smooth('#9a948a'), { y: H / 2 }));
  const stepMat = smooth('#6b5a48'), railMat = smooth('#2d2d2d', { metalness: 0.5 });
  const N = 60;
  for (let i = 0; i < N; i++) {
    const a = i * 0.32, y = 0.25 + i * 0.26;
    const s = box(R - 0.6, 0.12, 0.9, stepMat, { y });
    s.position.set(Math.sin(a) * (R / 2 + 0.1), y, Math.cos(a) * (R / 2 + 0.1)); s.rotation.y = a + Math.PI / 2;
    if (i === 17) { s.rotation.z = 0.08; s.material = smooth('#5a4a3a'); }   // the cracked step
    g.add(s);
    const post = mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 5), railMat, { x: Math.sin(a) * (R - 0.35), y: y + 0.5, z: Math.cos(a) * (R - 0.35) });
    g.add(post);
  }
  // hand rail as a helix tube
  const pts = []; for (let i = 0; i <= N * 4; i++) { const k = i / 4, a = k * 0.32; pts.push(new THREE.Vector3(Math.sin(a) * (R - 0.35), 1.0 + k * 0.26, Math.cos(a) * (R - 0.35))); }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.04, 6), railMat));
  // small window slits with storm light
  for (let i = 0; i < 4; i++) { const a = i * 1.7 + 0.6; g.add(box(0.25, 0.9, 0.1, smooth('#5d7bbd', { emissive: '#3a5aa8', emissiveIntensity: 0.6 }), { x: Math.sin(a) * (R - 0.05), y: 2.5 + i * 3.5, z: Math.cos(a) * (R - 0.05), ry: a })); }
  // shelf with the matchbox near the top
  const shelfA = 0.32 * 50, shelfY = 0.25 + 50 * 0.26 + 0.9;
  for (let k = 0; k < 3; k++) g.add(box(1.0, 0.06, 0.3, smooth('#7a5a3a'), { x: Math.sin(shelfA) * (R - 0.2), y: shelfY + k * 0.35, z: Math.cos(shelfA) * (R - 0.2), ry: shelfA }));
  g.add(box(0.18, 0.06, 0.12, smooth('#d63a2a'), { x: Math.sin(shelfA + 0.12) * (R - 0.25), y: shelfY + 0.7 + 0.06, z: Math.cos(shelfA + 0.12) * (R - 0.25), ry: shelfA }));
  for (let k = 0; k < 5; k++) { const pl = new THREE.PointLight('#7f9cf0', 9, 12, 1.4); const a = k * 1.7 + 0.6; pl.position.set(Math.sin(a) * (R - 0.6), 2.5 + k * 3.2, Math.cos(a) * (R - 0.6)); g.add(pl); }
  return { group: g, light: { sun: '#9fb2ff', sunI: 0.7, hemiSky: '#7c8bc0', hemiGround: '#262a3c', hemiI: 1.25, dir: [2, 10, 4] }, fog: ['#141a2c', 12, 44] };
}

/** The lamp room at the top: the big glass lens, the old oil lamp, storm outside. */
export function lampRoom(seed) {
  const rng = new Rng(seed);
  const g = new THREE.Group();
  g.add(sky('#0d1838', '#2a3d6e', '#0f1830', new THREE.Vector3(0, -1, 0)));
  g.add(mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.3, 24), smooth('#3a3530'), { y: -0.15 }));
  // glass walls with iron frames
  g.add(mesh(new THREE.CylinderGeometry(3.2, 3.2, 3.2, 12, 1, true), new THREE.MeshStandardMaterial({ color: '#9fc4ff', transparent: true, opacity: 0.12, side: THREE.DoubleSide, roughness: 0.1 }), { y: 1.6 }));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.add(box(0.08, 3.2, 0.08, smooth('#222'), { x: Math.sin(a) * 3.2, y: 1.6, z: Math.cos(a) * 3.2 })); }
  g.add(mesh(new THREE.ConeGeometry(3.6, 1.4, 12), smooth('#7a2422'), { y: 3.9 }));
  // the big faceted lens (centre) – rings of glass
  const lens = new THREE.Group(); lens.position.set(0, 0, -0.8);
  const lensMat = new THREE.MeshStandardMaterial({ color: '#d8f0ff', transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.2, emissive: '#ffe6a0', emissiveIntensity: 0.0, flatShading: true });
  lensMat.userData.lens = true;
  lens.add(mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.2, 10), lensMat, { y: 1.5 }));
  for (let k = 0; k < 6; k++) lens.add(mesh(new THREE.TorusGeometry(0.98, 0.07, 4, 10), lensMat, { y: 0.55 + k * 0.38, rx: Math.PI / 2 }));
  lens.add(mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.4, 10), smooth('#b08a3a', { metalness: 0.6, roughness: 0.3 }), { y: 0.2 }));
  g.add(lens);
  // the old brass oil lamp on a small table
  g.add(box(0.8, 0.9, 0.6, smooth('#5a3e28'), { base: true, x: 1.6, z: 0.6 }));
  const oil = new THREE.Group(); oil.position.set(1.6, 0.9, 0.6);
  oil.add(mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.3, 12), smooth('#b8862f', { metalness: 0.7, roughness: 0.3 }), { y: 0.15 }));
  oil.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.32, 12, 1, true), new THREE.MeshStandardMaterial({ color: '#fff', transparent: true, opacity: 0.3, side: THREE.DoubleSide }), { y: 0.46 }));
  const flame = mesh(new THREE.ConeGeometry(0.06, 0.2, 8), new THREE.MeshBasicMaterial({ color: '#ffb52e' }), { y: 0.45 }); flame.userData.flame = true; oil.add(flame);
  g.add(oil);
  const glow = new THREE.PointLight('#ffc060', 0, 14, 1.6); glow.position.set(0.6, 1.6, 0.2); g.add(glow);
  const front = new THREE.PointLight('#ffb050', 0, 10, 1.5); front.position.set(1.5, 2.2, 3.2); g.add(front);
  const moon = new THREE.PointLight('#8fa8ff', 7, 12, 1.4); moon.position.set(2.0, 2.8, 2.6); g.add(moon);
  // rain-dark sea far below
  const sea = seaMesh(300, 300, 60, 60, '#14294a'); sea.position.set(0, -20, -60); g.add(sea);
  const bgeo = fadingBeamGeometry(5, 80); bgeo.rotateX(Math.PI / 2);
  const beam = new THREE.Mesh(bgeo, beamMaterial(0.4)); beam.position.set(0, 1.5, -0.8); g.add(beam);
  function update(t, st) {
    const on = st.lamp === 'on';
    flame.visible = on; flame.scale.setScalar(on ? 1 + Math.sin(t * 31) * 0.12 : 1);
    glow.intensity = on ? 9 : 0; front.intensity = on ? 7 : 0;
    lensMat.emissiveIntensity = on ? 1.4 : 0;
    beam.visible = on; beam.rotation.y = t * 0.9 - 0.8;
    animateSea(sea, t, st.sea ?? 0.9);
  }
  return { group: g, update, light: { sun: '#a9bbff', sunI: 0.9, hemiSky: '#7385c4', hemiGround: '#1c2236', hemiI: 1.3, dir: [-6, 10, 10] }, fog: ['#0f1830', 30, 220] };
}
