import * as THREE from 'three';
import { Rng } from '../rng.js';

const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: true, ...opts }));
  }
  return matCache.get(key);
}

export function mesh(geo, material, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  if (typeof s === 'number') m.scale.setScalar(s); else m.scale.set(...s);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

export function box(w, h, d, color, o = {}) {
  const g = new THREE.BoxGeometry(w, h, d);
  return mesh(g, typeof color === 'object' ? color : mat(color), { ...o, y: (o.y || 0) + (o.base ? h / 2 : 0) });
}

/** Gradient sky dome with an optional sun disc. */
export function sky(top = '#4aa8ff', horizon = '#cdeeff', bottom = '#e9f6ff', sunDir = new THREE.Vector3(0.4, 0.5, -0.6)) {
  const geo = new THREE.SphereGeometry(400, 32, 16);
  const matl = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: { value: new THREE.Color(top) }, horizon: { value: new THREE.Color(horizon) },
      bottom: { value: new THREE.Color(bottom) }, sunDir: { value: sunDir.clone().normalize() },
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; uniform vec3 sunDir; varying vec3 vDir;
      void main(){
        float h = vDir.y;
        vec3 c = h > 0.0 ? mix(horizon, top, pow(clamp(h,0.0,1.0), 0.6)) : mix(horizon, bottom, clamp(-h*4.0,0.0,1.0));
        float s = max(dot(normalize(vDir), sunDir), 0.0);
        c += vec3(1.0,0.95,0.8) * (pow(s, 600.0) * 1.5 + pow(s, 12.0) * 0.18);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(geo, matl);
  m.renderOrder = -10;
  m.frustumCulled = false;
  return m;
}

/** Low-poly ground with gently varied heights and colours (flat-shaded facets). */
export function ground(color = '#6cc24a', size = 160, seed = 1, { bumps = 0.25, flatRadius = 9, variation = 0.08 } = {}) {
  const rng = new Rng(seed);
  const g = new THREE.PlaneGeometry(size, size, 64, 64);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  const base = new THREE.Color(color);
  const colors = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const r = Math.hypot(x, z);
    const k = THREE.MathUtils.smoothstep(r, flatRadius, flatRadius + 12);
    pos.setY(i, (rng.float(-1, 1) * bumps + Math.sin(x * 0.15) * Math.cos(z * 0.13) * 1.5 * k) * k + k * k * (r > 40 ? (r - 40) * 0.08 : 0));
  }
  const ng = g.toNonIndexed();
  const p2 = ng.attributes.position;
  for (let i = 0; i < p2.count; i += 3) {
    const c = base.clone().offsetHSL(0, 0, rng.float(-variation, variation));
    for (let j = 0; j < 3; j++) colors.push(c.r, c.g, c.b);
  }
  ng.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  ng.computeVertexNormals();
  return mesh(ng, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }), { cast: false });
}

export function tree(rng, { x = 0, z = 0, s = 1, kind } = {}) {
  const g = new THREE.Group();
  kind = kind || rng.pick(['round', 'pine', 'round']);
  const trunk = mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.2, 6), mat('#7a4a26'), { y: 0.6 });
  g.add(trunk);
  const greens = ['#3fa34d', '#4cbb53', '#2f8f45', '#5cc95a'];
  if (kind === 'pine') {
    for (let i = 0; i < 3; i++) {
      g.add(mesh(new THREE.ConeGeometry(1.0 - i * 0.25, 1.3, 7), mat(rng.pick(['#2f7d3d', '#2a6e3a', '#378a45'])), { y: 1.4 + i * 0.7 }));
    }
  } else {
    const c = mat(rng.pick(greens));
    g.add(mesh(new THREE.IcosahedronGeometry(1.0, 0), c, { y: 2.0, ry: rng.float(0, 3) }));
    g.add(mesh(new THREE.IcosahedronGeometry(0.7, 0), c, { x: 0.5, y: 1.7, z: 0.2, ry: rng.float(0, 3) }));
    g.add(mesh(new THREE.IcosahedronGeometry(0.65, 0), c, { x: -0.45, y: 1.8, z: -0.2 }));
  }
  g.position.set(x, 0, z);
  g.scale.setScalar(s);
  g.rotation.y = rng.float(0, Math.PI * 2);
  return g;
}

export function rock(rng, { x = 0, z = 0, s = 1, color = '#9aa0a6' } = {}) {
  return mesh(new THREE.DodecahedronGeometry(0.5, 0), mat(color), { x, y: 0.2 * s, z, s: [s * rng.float(0.8, 1.4), s * rng.float(0.5, 0.9), s], ry: rng.float(0, 6) });
}

export function bush(rng, { x = 0, z = 0, s = 1 } = {}) {
  const g = new THREE.Group();
  const c = mat(rng.pick(['#3f9e46', '#4fb34e', '#5cbf55']));
  g.add(mesh(new THREE.IcosahedronGeometry(0.5, 0), c, { y: 0.35 }));
  g.add(mesh(new THREE.IcosahedronGeometry(0.38, 0), c, { x: 0.4, y: 0.3 }));
  g.add(mesh(new THREE.IcosahedronGeometry(0.35, 0), c, { x: -0.38, y: 0.28, z: 0.1 }));
  g.position.set(x, 0, z); g.scale.setScalar(s);
  return g;
}

export function cloud(rng, { x = 0, y = 25, z = -60, s = 1 } = {}) {
  const g = new THREE.Group();
  const m = mat('#ffffff', { roughness: 1, emissive: '#ffffff', emissiveIntensity: 0.25 });
  const n = rng.int(3, 5);
  for (let i = 0; i < n; i++) {
    g.add(mesh(new THREE.IcosahedronGeometry(rng.float(1.5, 2.6), 0), m, { x: i * 2 - n, y: rng.float(-0.4, 0.6), z: rng.float(-0.5, 0.5), cast: false, receive: false }));
  }
  g.position.set(x, y, z); g.scale.setScalar(s);
  return g;
}

export function mountains(rng, { count = 9, radius = 90, color = '#7d8fa8', snow = true } = {}) {
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const a = -Math.PI * 0.9 + (i / (count - 1)) * Math.PI * 0.8 - Math.PI * 0.05;
    const h = rng.float(18, 34);
    const r = rng.float(12, 20);
    const x = Math.cos(a) * radius, z = Math.sin(a) * radius;
    g.add(mesh(new THREE.ConeGeometry(r, h, 5), mat(color), { x, y: h / 2 - 2, z, ry: rng.float(0, 3), cast: false }));
    if (snow) g.add(mesh(new THREE.ConeGeometry(r * 0.32, h * 0.32, 5), mat('#f4f8ff'), { x, y: h - 2 - h * 0.16 + 0.05, z, cast: false }));
  }
  return g;
}

export function house(rng, { x = 0, z = 0, ry = 0, s = 1, wall, roof, floors = 1 } = {}) {
  const g = new THREE.Group();
  wall = wall || rng.pick(['#f3e3c3', '#f7d9a8', '#e8c9a0', '#fbefd8', '#d9e4ec']);
  roof = roof || rng.pick(['#c0392b', '#a8432a', '#8e5b3a', '#3a6ea5', '#b4462f']);
  const w = rng.float(2.6, 3.4), d = rng.float(2.4, 3), h = 2.2 * floors;
  g.add(box(w, h, d, wall, { base: true }));
  // timber frame beams
  const beam = mat('#5a3a22');
  for (const sx of [-1, 1]) g.add(box(0.12, h, 0.12, beam, { base: true, x: sx * (w / 2 - 0.02), z: d / 2 }));
  g.add(box(w, 0.12, 0.12, beam, { y: h - 0.06, z: d / 2 + 0.01 }));
  // roof (triangular prism)
  const roofGeo = new THREE.CylinderGeometry(0.01, (w / 2) * 1.25, 1.6, 4, 1);
  roofGeo.rotateY(Math.PI / 4);
  const r = mesh(roofGeo, mat(roof), { y: h + 0.8, s: [1, 1, d / w * 1.1] });
  g.add(r);
  // door + windows
  g.add(box(0.7, 1.2, 0.08, '#6b3f1f', { base: true, z: d / 2 + 0.03 }));
  const win = mat('#ffe9a8', { emissive: '#ffcf5a', emissiveIntensity: 0.25 });
  for (const sx of [-1, 1]) g.add(box(0.55, 0.55, 0.06, win, { x: sx * w * 0.3, y: h * 0.62, z: d / 2 + 0.03 }));
  // chimney
  if (rng.chance(0.6)) g.add(box(0.35, 1.2, 0.35, '#8a8a8a', { x: w * 0.25, y: h + 1.2, z: -d * 0.15 }));
  g.position.set(x, 0, z); g.rotation.y = ry; g.scale.setScalar(s);
  return g;
}

export function fence(from, to, color = '#9b6b3d') {
  const g = new THREE.Group();
  const a = new THREE.Vector3(from[0], 0, from[1]), b = new THREE.Vector3(to[0], 0, to[1]);
  const len = a.distanceTo(b);
  const n = Math.max(2, Math.round(len / 1.2));
  const m = mat(color);
  for (let i = 0; i <= n; i++) {
    const p = a.clone().lerp(b, i / n);
    g.add(box(0.12, 0.9, 0.12, m, { x: p.x, y: 0.45, z: p.z }));
  }
  const mid = a.clone().lerp(b, 0.5);
  const ang = Math.atan2(b.x - a.x, b.z - a.z);
  for (const y of [0.35, 0.7]) g.add(box(0.06, 0.1, len, m, { x: mid.x, y, z: mid.z, ry: ang }));
  return g;
}

export function flag(color = '#e74c3c', { x = 0, y = 0, z = 0, pole = 3 } = {}) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, pole, 6), mat('#5d4037'), { y: pole / 2 }));
  const cloth = mesh(new THREE.PlaneGeometry(0.9, 0.55, 6, 1), mat(color, { side: THREE.DoubleSide }), { x: 0.47, y: pole - 0.32 });
  cloth.userData.wave = true;
  g.add(cloth);
  g.position.set(x, y, z);
  return g;
}

export function lamp({ x = 0, z = 0, h = 3.2 } = {}) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.09, h, 6), mat('#30363d', { metalness: 0.4 }), { y: h / 2 }));
  g.add(mesh(new THREE.BoxGeometry(0.3, 0.35, 0.3), mat('#fff3c4', { emissive: '#ffd36b', emissiveIntensity: 0.9 }), { y: h + 0.1 }));
  g.position.set(x, 0, z);
  return g;
}

/** Animate flags, flames etc. each frame (deterministic in time). */
export function animateEnvironment(group, t) {
  group.traverse((o) => {
    if (o.userData.wave && o.geometry) {
      if (!o.userData.base) o.userData.base = o.geometry.attributes.position.array.slice();
      const base = o.userData.base, arr = o.geometry.attributes.position.array;
      for (let i = 0; i < arr.length; i += 3) {
        const x = base[i] + 0.45;
        arr[i + 2] = base[i + 2] + Math.sin(t * 6 + x * 5) * 0.08 * x;
      }
      o.geometry.attributes.position.needsUpdate = true;
    }
    if (o.userData.spin) o.rotation.y = t * o.userData.spin;
    if (o.userData.bob) o.position.y = o.userData.bobBase + Math.sin(t * 2 + o.userData.bob) * 0.1;
    if (o.userData.drive) {
      const d = o.userData.drive;
      o.position.x = ((d.offset + t * d.speed) % d.range) - d.range / 2;
    }
  });
}
