// Style test: minimal monochrome look (black void, flat white faceless figures, rain).
import * as THREE from 'three';
import { Character } from '../engine/character.js';
import { mesh } from '../engine/environments/common.js';
import { Rng } from '../engine/rng.js';
import { P, breathe } from './kit.js';

export const DURATION = 4;
export function createStyleTest(player) {
  const scene = player.scene, camera = player.camera;
  scene.background = new THREE.Color('#050505');
  const rng = new Rng(3);
  const white = new THREE.MeshBasicMaterial({ color: '#f2f2f2' });
  const grey = new THREE.MeshBasicMaterial({ color: '#9a9a9a' });
  const mk = (mat) => {
    const c = new Character({ id: 'x', style: 'toon', body: '#ffffff', accent: '#ffffff', accessory: 'bald' });
    c.root.traverse((o) => { if (o.isMesh && !o.userData.noOutline) { o.material = mat; o.castShadow = false; } });
    scene.add(c.root); return c;
  };
  const a = mk(white), b = mk(grey);
  // wet floor with reflections faked by a dark glossy plane
  scene.add(mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: '#0d0d0d' }), { rx: -Math.PI / 2, cast: false }));
  // cloud band
  const cloudMat = new THREE.MeshBasicMaterial({ color: '#2a2a2a' });
  for (let i = 0; i < 18; i++) scene.add(mesh(new THREE.SphereGeometry(rng.float(0.8, 1.4), 16, 10), cloudMat, { x: -6 + i * 0.7, y: 6.2 + rng.float(-0.2, 0.2), z: -3, s: [1, 0.6, 0.5], cast: false }));
  // umbrellas: one upside down (collecting rain), one normal
  const umb = (flip, mat) => {
    const g = new THREE.Group();
    const canopy = mesh(new THREE.SphereGeometry(0.9, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), mat, { y: flip ? 1.5 : 0, s: [1, flip ? -0.45 : 0.45, 1], cast: false });
    canopy.material = mat.clone(); canopy.material.side = THREE.DoubleSide;
    const pole = mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 6), white, { y: flip ? 0.7 : -0.7, cast: false });
    g.add(canopy, pole); return g;
  };
  const u1 = umb(true, new THREE.MeshBasicMaterial({ color: '#dcdcdc' })), u2 = umb(false, new THREE.MeshBasicMaterial({ color: '#7a7a7a' }));
  scene.add(u1, u2);
  // rain
  const N = 500, rain = new THREE.InstancedMesh(new THREE.BoxGeometry(0.008, 0.35, 0.008), new THREE.MeshBasicMaterial({ color: '#8a8a8a', transparent: true, opacity: 0.6 }), N);
  const drops = Array.from({ length: N }, () => ({ x: rng.float(-5, 5), z: rng.float(-3, 3), ph: rng.float(0, 1), sp: rng.float(0.8, 1.2) }));
  rain.frustumCulled = false; scene.add(rain);
  const ringMat = new THREE.MeshBasicMaterial({ color: '#555', transparent: true });
  const rings = Array.from({ length: 40 }, () => { const r = mesh(new THREE.RingGeometry(0.06, 0.075, 20), ringMat.clone(), { rx: -Math.PI / 2, y: 0.01, cast: false }); scene.add(r); r.userData = { x: rng.float(-3, 3), z: rng.float(-2, 2.5), ph: rng.float(0, 1) }; return r; });
  const m4 = new THREE.Matrix4();
  return {
    update(t) {
      a.root.position.set(-1.0, 0, 0); a.root.rotation.y = 0.35;
      b.root.position.set(1.0, 0, 0); b.root.rotation.y = -0.35;
      a.applyPose(P({ ...breathe(t), headNod: 12, armR: { raise: 35, fwd: 30, elbow: 95 }, armL: { raise: 10 } }), t);
      b.applyPose(P({ ...breathe(t), headNod: -4, armL: { raise: 35, fwd: 30, elbow: 95 }, armR: { raise: 10 } }), t);
      a.root.updateMatrixWorld(true); b.root.updateMatrixWorld(true);
      a.arms.R.hand.getWorldPosition(u1.position); u1.position.y += 0.05;
      b.arms.L.hand.getWorldPosition(u2.position); u2.position.y += 1.4;
      for (const c of [a, b]) c.setFace({ expr: 'neutral', blink: 0, mouth: 0, lookX: 0, lookY: 0 });
      drops.forEach((d, i) => { const y = 6 - (((d.ph + t * 1.6 * d.sp) % 1) * 6.2); m4.makeTranslation(d.x, y, d.z); rain.setMatrixAt(i, m4); });
      rain.instanceMatrix.needsUpdate = true;
      rings.forEach((r) => { const u = (r.userData.ph + t * 1.3) % 1; r.position.set(r.userData.x, 0.01, r.userData.z); r.scale.setScalar(0.5 + u * 3); r.material.opacity = (1 - u) * 0.7; });
      camera.position.set(0, 1.9, 7.8); camera.lookAt(0, 2.0, 0); camera.fov = 45; camera.updateProjectionMatrix();
      player.bloom.strength = 0.15;
      return {};
    },
    overlay(t) { this.update(t); return { hud: [
      { text: "IT WON'T RAIN FOREVER.", style: { size: 52, weight: 700, spacing: 0.22, color: '#ffffff', shadow: 0, font: '"Courier New", monospace' }, x: 0, y: 0.7, height: 0.02, opacity: 1 },
      { text: 'Mentality.', style: { size: 60, weight: 600, spacing: 0, color: '#ffffff', shadow: 0.4 }, x: 0, y: 0.06, height: 0.03, opacity: 1 },
    ], overlays: [] }; },
  };
}
