import * as THREE from 'three';
import { Rng } from './rng.js';

// Time-of-day and weather presets that can be applied to ANY environment.
export const LIGHTING = {
  day: null, // the environment's own lighting
  sunset: { sky: ['#3d4c99', '#ff9a5a', '#ffc59a'], sun: '#ffaa66', sunI: 2.2, dir: [-12, 6, 4], hemi: ['#ffb38a', '#5a4a6a', 0.95], fog: ['#f2a27c', 35, 150], exposure: 1.05 },
  night: { sky: ['#050a1d', '#1a2850', '#1a2850'], sun: '#9db4ff', sunI: 0.9, dir: [6, 14, -6], hemi: ['#3a4a85', '#121225', 0.55], fog: ['#141c38', 25, 120], exposure: 1.15 },
  storm: { sky: ['#272c35', '#4e5764', '#59626e'], sun: '#c3cbdb', sunI: 0.9, dir: [5, 14, 6], hemi: ['#7c8696', '#2c3036', 0.85], fog: ['#535b67', 25, 190], exposure: 1.0 },
  purple: { sky: ['#14042b', '#5b1a8c', '#8a35c9'], sun: '#c9a2ff', sunI: 1.1, dir: [6, 12, 8], hemi: ['#8a5ad0', '#1a0a2a', 0.85], fog: ['#3a1660', 30, 220], exposure: 1.12 },
  dusk: { sky: ['#2a1f4f', '#c4527a', '#e88a6a'], sun: '#ff7a5c', sunI: 1.4, dir: [-10, 4, -2], hemi: ['#a36a9a', '#2a2040', 0.8], fog: ['#7a4a6a', 25, 140], exposure: 1.1 },
};

function findSky(env) {
  if (env.sky === undefined) {
    env.sky = env.group.children.find((o) => o.material && o.material.uniforms && o.material.uniforms.top) || null;
    if (env.sky) env.skyBase = ['top', 'horizon', 'bottom'].map((k) => env.sky.material.uniforms[k].value.clone());
  }
  return env.sky;
}

export function applyLighting(player, env, preset) {
  const p = LIGHTING[preset];
  const sky = findSky(env);
  const L = env.light;
  if (!p) {
    player.hemi.color.set(L.hemiSky); player.hemi.groundColor.set(L.hemiGround); player.hemi.intensity = L.hemiI;
    player.sun.color.set(L.sun); player.sun.intensity = L.sunI; player.sun.position.set(...L.dir);
    player.scene.fog = new THREE.Fog(env.fog[0], env.fog[1], env.fog[2]);
    if (sky) ['top', 'horizon', 'bottom'].forEach((k, i) => sky.material.uniforms[k].value.copy(env.skyBase[i]));
    player.baseExposure = player.brightStyle ? 1.0 : 1.05;
  } else {
    player.hemi.color.set(p.hemi[0]); player.hemi.groundColor.set(p.hemi[1]); player.hemi.intensity = p.hemi[2];
    player.sun.color.set(p.sun); player.sun.intensity = p.sunI; player.sun.position.set(...p.dir);
    player.scene.fog = new THREE.Fog(p.fog[0], p.fog[1], p.fog[2]);
    if (sky) ['top', 'horizon', 'bottom'].forEach((k, i) => sky.material.uniforms[k].value.set(p.sky[i]));
    player.baseExposure = p.exposure;
  }
  player.renderer.toneMappingExposure = player.baseExposure;
  // lit windows/lamps glow more at night
  const glow = preset === 'night' || preset === 'storm' || preset === 'dusk' || preset === 'purple';
  env.group.traverse((o) => {
    if (o.material && o.material.emissive && o.material.emissiveIntensity > 0 && !o.material.userData.baseEI) o.material.userData.baseEI = o.material.emissiveIntensity;
    if (o.material && o.material.userData.baseEI) o.material.emissiveIntensity = o.material.userData.baseEI * (glow ? 3 : 1);
  });
}

/** Deterministic rain that follows the camera. */
export class Weather {
  constructor(scene) {
    this.count = 1600;
    const geo = new THREE.BoxGeometry(0.018, 0.55, 0.018);
    this.rain = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: '#cfe3ff', transparent: true, opacity: 0.55, fog: false }), this.count);
    this.rain.frustumCulled = false;
    this.rain.visible = false;
    scene.add(this.rain);
    const rng = new Rng(77);
    this.seeds = Array.from({ length: this.count }, () => [rng.float(-14, 14), rng.float(-6, 22), rng.float(0, 16), rng.float(0.85, 1.15)]);
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.12));
    this._s = new THREE.Vector3(1, 1, 1);
    this._p = new THREE.Vector3();
  }
  update(weather, t, camera) {
    const on = weather === 'rain' || weather === 'storm';
    this.rain.visible = on;
    if (!on) return;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const cx = camera.position.x + dir.x * 8, cz = camera.position.z + dir.z * 8;
    for (let i = 0; i < this.count; i++) {
      const [x, z, y0, sp] = this.seeds[i];
      const y = ((y0 - t * 16 * sp) % 16 + 16) % 16;
      this._p.set(cx + x, y + camera.position.y - 6, cz + z - 8);
      this._m.compose(this._p, this._q, this._s);
      this.rain.setMatrixAt(i, this._m);
    }
    this.rain.instanceMatrix.needsUpdate = true;
  }
}
