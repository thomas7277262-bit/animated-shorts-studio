import * as THREE from 'three';
import { easeInOut, lerp } from './rng.js';

// Cameras are described in orbit coordinates around a target point:
//   angle  – degrees around the target (0 = in front, looking towards -z)
//   dist   – distance from the target
//   height – camera height above the target point
//   lookY  – vertical offset of the look-at point (positive = frame lower)
// A shot interpolates "from" -> "to" over its duration with easing.

export const SHOT_PRESETS = {
  wide:      { from: { angle: -6, dist: 10, height: 1.8, lookY: 1.4, fov: 50 }, to: { angle: 6, dist: 9, height: 1.6, lookY: 1.3, fov: 50 } },
  establish: { from: { angle: 0, dist: 18, height: 9, lookY: 4, fov: 50 }, to: { angle: 0, dist: 12, height: 2.5, lookY: 2, fov: 50 } },
  medium:    { from: { angle: -10, dist: 7.5, height: 0.6, lookY: 0.4, fov: 45 }, to: { angle: 10, dist: 7, height: 0.6, lookY: 0.4, fov: 45 } },
  closeup:   { from: { angle: 0, dist: 3.4, height: 0.15, lookY: 0.05, fov: 38 }, to: { angle: 0, dist: 2.8, height: 0.1, lookY: 0.05, fov: 38 } },
  dollyIn:   { from: { angle: 0, dist: 9, height: 0.8, lookY: 0.4, fov: 45 }, to: { angle: 0, dist: 4.2, height: 0.3, lookY: 0.2, fov: 42 } },
  dollyOut:  { from: { angle: 0, dist: 3.5, height: 0.2, lookY: 0.1, fov: 42 }, to: { angle: 0, dist: 11, height: 2, lookY: 1.2, fov: 48 } },
  orbit:     { from: { angle: -40, dist: 7, height: 1.2, lookY: 0.5, fov: 45 }, to: { angle: 40, dist: 7, height: 1.0, lookY: 0.5, fov: 45 } },
  crane:     { from: { angle: 0, dist: 8, height: 7, lookY: 0.5, fov: 48 }, to: { angle: 0, dist: 8, height: 0.8, lookY: 0.5, fov: 48 } },
  lowAngle:  { from: { angle: -15, dist: 6.2, height: -1.0, lookY: 0.3, fov: 50 }, to: { angle: 15, dist: 5.6, height: -0.9, lookY: 0.3, fov: 50 } },
  overShoulder: { from: { angle: 150, dist: 4.5, height: 0.6, lookY: 0.2, fov: 42 }, to: { angle: 160, dist: 4.0, height: 0.6, lookY: 0.2, fov: 42 } },
  track:     { from: { angle: 75, dist: 6.5, height: 0.4, lookY: 0.3, fov: 55 }, to: { angle: 65, dist: 6, height: 0.4, lookY: 0.3, fov: 55 } },
  frontTrack:{ from: { angle: 0, dist: 4.8, height: 0.2, lookY: 0.2, fov: 62 }, to: { angle: 8, dist: 4.4, height: 0.25, lookY: 0.2, fov: 62 } },
  groundLow: { from: { angle: -8, dist: 6, height: -1.15, lookY: 1.6, fov: 74 }, to: { angle: 6, dist: 5.2, height: -1.15, lookY: 1.8, fov: 74 } },
  faceClose: { from: { angle: 0, dist: 2.3, height: 0.05, lookY: 0.0, fov: 45 }, to: { angle: 0, dist: 1.9, height: 0.05, lookY: 0.0, fov: 45 } },
  reveal:    { from: { angle: 0, dist: 6, height: 0.6, lookY: 0.8, fov: 55 }, to: { angle: 0, dist: 14, height: 3.5, lookY: 5, fov: 62 } },
  follow:    { from: { angle: 25, dist: 7, height: 1.0, lookY: 0.4, fov: 45 }, to: { angle: 25, dist: 7, height: 1.0, lookY: 0.4, fov: 45 } },
};

export function shotState(shot, t) {
  const preset = SHOT_PRESETS[shot.type] || SHOT_PRESETS.medium;
  const from = { ...preset.from, ...(shot.from || {}) };
  const to = { ...preset.to, ...(shot.to || {}) };
  const u = easeInOut((t - shot.t0) / Math.max(0.001, shot.t1 - shot.t0));
  const o = {};
  for (const k of Object.keys(from)) o[k] = lerp(from[k], to[k] ?? from[k], u);
  return o;
}

const _target = new THREE.Vector3();

/**
 * Place the camera. `targetPoint` is a world position (Vector3) for the subject
 * (usually between characters at chest height). `baseAngle` lets a shot
 * be relative to the subject's facing.
 */
export function placeCamera(camera, st, targetPoint, shake = 0, t = 0) {
  const a = THREE.MathUtils.degToRad(st.angle);
  _target.copy(targetPoint);
  const cx = _target.x + Math.sin(a) * st.dist;
  const cz = _target.z + Math.cos(a) * st.dist;
  const cy = _target.y + st.height;
  camera.position.set(cx, Math.max(0.3, cy), cz);
  const look = _target.clone();
  look.y += st.lookY;
  if (shake > 0) {
    camera.position.x += Math.sin(t * 61) * shake * 0.12;
    camera.position.y += Math.cos(t * 47) * shake * 0.1;
    look.x += Math.sin(t * 53) * shake * 0.05;
  }
  camera.lookAt(look);
  if (camera.fov !== st.fov) { camera.fov = st.fov; camera.updateProjectionMatrix(); }
}
