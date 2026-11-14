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
    case 'seed': obj = mesh(new THREE.SphereGeometry(0.06, 10, 8), mat('#3b3027'), { y: 0.06, s: [0.6, 1, 1.3] }); break;
    case 'homework': obj = box(0.35, 0.03, 0.26, '#fffdf2', { y: 0.02 }); break;
    default: obj = box(1, 1, 1, '#ff00ff', { y: 0.5 });
  }
  pivot.add(obj);
  outer.position.set(p.at[0], p.y || 0, p.at[1]);
  outer.rotation.y = p.ry || 0;
  if (p.scale && p.type !== 'tree') outer.scale.setScalar(p.scale);
  outer.userData.pivot = pivot;
  return outer;
}
