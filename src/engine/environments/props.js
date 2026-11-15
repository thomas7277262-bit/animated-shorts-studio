import * as THREE from 'three';
import { Rng } from '../rng.js';
import { house, tree, mat, box, mesh, lamp } from './common.js';

// Scene props that stories can place, and destroy (collapse) on cue.
// Every prop is wrapped in a pivot at its base so it can topple over.
export function buildProp(p) {
  const rng = new Rng(p.seed || Math.round((p.at[0] * 31 + p.at[1] * 17) * 100) || 3);
  const outer = new THREE.Group();
  const pivot = new THREE.Group();
  outer.add(pivot);
  let obj;
  switch (p.type) {
    case 'house': obj = house(rng, { wall: p.wall, roof: p.roof, floors: p.floors || 1 }); break;
    case 'tower': {
      obj = new THREE.Group();
      obj.add(mesh(new THREE.CylinderGeometry(1.2, 1.35, 7, 10), mat(p.wall || '#c9c2b4'), { y: 3.5 }));
      obj.add(mesh(new THREE.ConeGeometry(1.6, 2.6, 10), mat(p.roof || '#3b5fc0'), { y: 8.3 }));
      break;
    }
    case 'tree': obj = tree(rng, { s: p.scale || 1.3 }); break;
    case 'lamp': obj = lamp({}); break;
    case 'cart': {
      obj = new THREE.Group();
      obj.add(box(1.8, 0.5, 1.0, '#8b5a2b', { y: 0.65 }));
      for (const [x, z] of [[-0.6, 0.55], [0.6, 0.55], [-0.6, -0.55], [0.6, -0.55]]) obj.add(mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.1, 10), mat('#5a3a1e'), { x, y: 0.35, z, rx: Math.PI / 2 }));
      break;
    }
    case 'crates': {
      obj = new THREE.Group();
      for (let i = 0; i < 4; i++) obj.add(box(0.8, 0.8, 0.8, '#b07a3c', { x: (i % 2) * 0.85, y: 0.4 + Math.floor(i / 2) * 0.82, ry: rng.float(-0.2, 0.2) }));
      break;
    }
    case 'windmill': {
      obj = new THREE.Group();
      obj.add(mesh(new THREE.CylinderGeometry(1.0, 1.5, 6, 8), mat('#f1e3c6'), { y: 3 }));
      obj.add(mesh(new THREE.ConeGeometry(1.4, 1.8, 8), mat('#b5452f'), { y: 6.9 }));
      const blades = new THREE.Group();
      for (let i = 0; i < 4; i++) blades.add(box(0.35, 3.4, 0.06, '#e8dcc0', { y: 1.7, rz: 0 }).rotateZ(0));
      blades.children.forEach((b, i) => { b.position.set(Math.sin(i * Math.PI / 2) * 1.7, Math.cos(i * Math.PI / 2) * 1.7, 0); b.rotation.z = -i * Math.PI / 2; });
      blades.position.set(0, 5.6, 1.15);
      blades.userData.spinZ = 0.8;
      obj.add(blades);
      break;
    }
    case 'balloon': {
      obj = new THREE.Group();
      obj.add(mesh(new THREE.SphereGeometry(0.32, 20, 16), mat(p.color || '#ff3b5c', { roughness: 0.35, flatShading: false }), { y: 1.2, s: [1, 1.15, 1] }));
      obj.add(mesh(new THREE.ConeGeometry(0.05, 0.08, 8), mat(p.color || '#ff3b5c'), { y: 0.82, rx: Math.PI }));
      obj.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.8, 4), mat('#ffffff'), { y: 0.4 }));
      break;
    }
    case 'shoppingcart': {
      obj = new THREE.Group();
      const metal = mat('#c9d3dd', { metalness: 0.4, roughness: 0.35 });
      obj.add(box(1.1, 0.6, 0.7, '#9fb0c0', { y: 0.85 }));
      obj.add(box(1.0, 0.05, 0.62, '#7a8a99', { y: 0.56 }));
      obj.add(box(0.06, 0.06, 0.8, '#e23b3b', { x: -0.68, y: 1.25 }));
      for (const [x, z] of [[-0.45, 0.3], [0.45, 0.3], [-0.45, -0.3], [0.45, -0.3]]) {
        obj.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6), metal, { x, y: 0.3, z }));
        obj.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 10), mat('#222'), { x, y: 0.08, z, rx: Math.PI / 2 }));
      }
      break;
    }
    case 'groceries': {
      obj = new THREE.Group();
      obj.add(box(0.4, 0.45, 0.25, '#c8a06a', { y: 0.23 }));
      obj.add(mesh(new THREE.SphereGeometry(0.08, 10, 8), mat('#e23b3b'), { x: -0.08, y: 0.5 }));
      obj.add(box(0.07, 0.25, 0.07, '#ffffff', { x: 0.1, y: 0.55 }));
      obj.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6), mat('#3fae49'), { x: 0.02, y: 0.58, rz: 0.3 }));
      break;
    }
    case 'leaf': {
      obj = new THREE.Group();
      obj.add(mesh(new THREE.SphereGeometry(0.45, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), mat('#3fbf4a', { side: THREE.DoubleSide }), { y: 0.9, s: [1, 0.55, 1] }));
      obj.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 5), mat('#2e8a36'), { y: 0.45 }));
      break;
    }
    case 'boat': {
      // small fishing boat: red hull, white cabin, mast with a lamp (bobs and rocks)
      obj = new THREE.Group();
      const hull = new THREE.Shape(); hull.moveTo(-2.2, 0.6); hull.lineTo(2.6, 0.6); hull.lineTo(1.8, -0.4); hull.lineTo(-1.8, -0.4); hull.closePath();
      const hg = new THREE.ExtrudeGeometry(hull, { depth: 1.8, bevelEnabled: false }); hg.translate(0, 0, -0.9);
      obj.add(mesh(hg, mat('#c0392b')));
      obj.add(box(4.6, 0.12, 1.9, '#f2efe6', { y: 0.62 }));
      obj.add(box(1.4, 1.1, 1.3, '#f4f1ea', { x: -0.5, y: 1.2 }));
      obj.add(box(1.0, 0.4, 0.05, '#9fd8ff', { x: -0.5, y: 1.35, z: 0.66 }));
      obj.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), mat('#5d4037'), { x: 0.9, y: 1.9 }));
      obj.add(mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff3a0' }), { x: 0.9, y: 3.2 }));
      obj.userData.rock = 1; obj.userData.rockAmp = p.rockAmp ?? 0.12;
      obj.userData.bob = 1; obj.userData.bobBase = 0;
      break;
    }
    case 'seed': obj = mesh(new THREE.SphereGeometry(0.06, 10, 8), mat('#3b3027'), { y: 0.06, s: [0.6, 1, 1.3] }); break;
    case 'homework': obj = box(0.35, 0.03, 0.26, '#fffdf2', { y: 0.02 }); break;
    case 'dough': {
      obj = new THREE.Group();
      obj.add(mesh(new THREE.CylinderGeometry(0.55, 0.5, 0.06, 20), mat('#f3dfb4', { flatShading: false }), { y: 0.03 }));
      obj.add(mesh(new THREE.TorusGeometry(0.52, 0.05, 6, 20), mat('#e9c98c'), { y: 0.05, rx: Math.PI / 2 }));
      obj.userData.spinZ = 0; obj.userData.spin = 9;
      break;
    }
    case 'ball': {
      obj = new THREE.Group();
      obj.add(mesh(new THREE.IcosahedronGeometry(0.24, 1), mat('#ffffff'), { y: 0.24 }));
      for (let i = 0; i < 6; i++) { const a = i * 1.05; obj.add(mesh(new THREE.IcosahedronGeometry(0.075, 0), mat('#111111'), { x: Math.cos(a) * 0.2, y: 0.24 + Math.sin(a * 1.7) * 0.12, z: Math.sin(a) * 0.2 })); }
      obj.userData.spin = 14;
      break;
    }
    case 'meat': obj = mesh(new THREE.DodecahedronGeometry(0.2, 0), mat('#c2433a'), { y: 0.2, s: [1.4, 0.8, 1] }); break;
    case 'sandwich': {
      obj = new THREE.Group();
      obj.add(box(0.5, 0.08, 0.4, '#e8c07a', { y: 0.04 }));
      obj.add(box(0.52, 0.04, 0.42, '#5ab84a', { y: 0.1 }));
      obj.add(box(0.5, 0.05, 0.4, '#d8402a', { y: 0.14 }));
      for (let i = 0; i < 10; i++) obj.add(box(0.03, 0.02, 0.03, '#1b1b1b', { x: -0.2 + (i % 5) * 0.1, y: 0.175, z: -0.1 + Math.floor(i / 5) * 0.2 }));
      obj.add(box(0.5, 0.08, 0.4, '#e8c07a', { y: 0.21 }));
      break;
    }
    case 'pepper': {
      obj = new THREE.Group();
      obj.add(mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.32, 10), mat('#2b2b2b'), { y: 0.16 }));
      obj.add(mesh(new THREE.SphereGeometry(0.09, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat('#cfd6dd', { metalness: 0.5 }), { y: 0.32 }));
      break;
    }
    case 'firetruck': {
      // long red engine with an open side window so the driver is visible
      obj = new THREE.Group();
      const red = mat('#d7261e'), chrome = mat('#d9dee6', { metalness: 0.6, roughness: 0.3 });
      obj.add(box(6.2, 1.6, 2.3, red, { x: -1.2, y: 1.5 }));
      obj.add(box(2.2, 0.7, 2.3, red, { x: 2.9, y: 1.05 }));          // cab floor/bonnet
      obj.add(box(0.15, 0.7, 2.3, red, { x: 3.95, y: 1.75 }));         // cab front under windshield
      obj.add(box(2.2, 0.15, 2.3, red, { x: 2.9, y: 3.3 }));           // cab roof
      obj.add(box(0.06, 1.15, 2.1, mat('#bfe6ff', { transparent: true, opacity: 0.18 }), { x: 4.0, y: 2.7, cast: false }));
      obj.add(box(0.15, 1.7, 2.3, red, { x: 1.85, y: 2.45 }));         // cab back wall
      for (const z of [-1.1, 1.1]) obj.add(box(0.15, 1.9, 0.12, red, { x: 3.9, y: 2.4, z }));
      obj.add(box(6.0, 0.15, 2.36, chrome, { x: -1.2, y: 2.35 }));
      obj.add(box(1.0, 0.25, 2.2, '#2f6fd6', { x: 2.9, y: 3.5 }));
      obj.add(box(0.45, 0.22, 0.5, mat('#ff2020', { emissive: '#ff2020', emissiveIntensity: 1.5 }), { x: 2.9, y: 3.55, z: -0.6 }));
      obj.add(box(0.45, 0.22, 0.5, mat('#2050ff', { emissive: '#2050ff', emissiveIntensity: 1.5 }), { x: 2.9, y: 3.55, z: 0.6 }));
      // ladder on top
      for (const z of [-0.5, 0.5]) obj.add(box(5.6, 0.1, 0.1, chrome, { x: -1.4, y: 2.6, z }));
      for (let i = 0; i < 11; i++) obj.add(box(0.08, 0.08, 1.0, chrome, { x: -4 + i * 0.52, y: 2.6 }));
      // hose reels, wheels, bumper, lights
      for (const z of [-1.18, 1.18]) for (let i = 0; i < 3; i++) obj.add(box(1.4, 0.9, 0.06, i === 1 ? chrome : mat('#b81d17'), { x: -3.2 + i * 1.6, y: 1.5, z }));
      for (const [x, z] of [[2.9, 1.1], [2.9, -1.1], [-2.6, 1.1], [-2.6, -1.1], [-1.2, 1.1], [-1.2, -1.1]]) {
        obj.add(mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 14), mat('#1d1d1d'), { x, y: 0.55, z, rx: Math.PI / 2 }));
        obj.add(mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.42, 10), chrome, { x, y: 0.55, z, rx: Math.PI / 2 }));
      }
      obj.add(box(0.3, 0.3, 2.4, chrome, { x: 4.05, y: 0.75 }));
      for (const z of [-0.8, 0.8]) obj.add(box(0.06, 0.25, 0.35, mat('#fff7c2', { emissive: '#fff2a0', emissiveIntensity: 1.2 }), { x: 4.05, y: 1.2, z }));
      // steering wheel
      obj.add(mesh(new THREE.TorusGeometry(0.28, 0.04, 6, 16), mat('#1d1d1d'), { x: 3.45, y: 2.25, z: -0.5, ry: Math.PI / 2, rx: 0.5 }));
      break;
    }
    case 'plane': {
      // passenger jet, nose toward +x
      obj = new THREE.Group();
      const white = mat('#f5f7fa', { roughness: 0.5 }), blue = mat('#2f6fd6');
      obj.add(mesh(new THREE.CylinderGeometry(1.3, 1.3, 16, 16), white, { rz: Math.PI / 2 }));
      obj.add(mesh(new THREE.SphereGeometry(1.3, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), white, { x: 8, rz: -Math.PI / 2, s: [1, 1.6, 1] }));
      obj.add(mesh(new THREE.ConeGeometry(1.3, 4, 16), white, { x: -10, rz: Math.PI / 2 }));
      obj.add(box(16, 0.25, 2.65, blue, { y: -0.35 }));
      obj.add(box(1.2, 0.5, 1.6, mat('#1b2a3d'), { x: 9.3, y: 0.55 }));                 // cockpit windows
      for (let i = 0; i < 16; i++) for (const z of [-1.27, 1.27]) obj.add(box(0.35, 0.4, 0.05, mat('#1b2a3d'), { x: -6 + i * 0.85, y: 0.35, z }));
      for (const z of [-1, 1]) obj.add(box(4, 0.25, 9, white, { x: -0.5, y: -0.6, z: z * 5.5, ry: z * -0.35 }));
      for (const z of [-1, 1]) obj.add(mesh(new THREE.CylinderGeometry(0.6, 0.6, 2.6, 12), mat('#c9d1da'), { x: 0.6, y: -1.25, z: z * 4, rz: Math.PI / 2 }));
      obj.add(box(2.6, 4, 0.25, blue, { x: -10.6, y: 2.2, ry: 0, rz: -0.4 }));
      for (const z of [-1, 1]) obj.add(box(2, 0.2, 3.6, white, { x: -10.8, y: 0.4, z: z * 2 }));
      break;
    }
    default: obj = box(1, 1, 1, '#ff00ff', { y: 0.5 });
  }
  pivot.add(obj);
  outer.position.set(p.at[0], p.y || 0, p.at[1]);
  outer.rotation.set(p.rx || 0, p.ry || 0, p.rz || 0, 'YXZ');
  if (p.scale && p.type !== 'tree') outer.scale.setScalar(p.scale);
  outer.userData.pivot = pivot;
  return outer;
}
