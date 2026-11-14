import * as THREE from 'three';
import { Character } from './character.js';
import { BlockCharacter } from './blocky.js';
import { Creature, evalCreatureAction, blendCreaturePose } from './creature.js';
import { Dog, evalDogAction, blendDogPose } from './dog.js';
import { applyLighting, Weather } from './atmosphere.js';
import { buildProp } from './environments/props.js';
import { evalAction, blendPose } from './poses.js';
import { buildEnvironment } from './environments/index.js';
import { animateEnvironment } from './environments/common.js';
import { ParticleSystem, SpriteLayer, TransitionOverlay } from './effects.js';
import { shotState, placeCamera } from './camera.js';
import { Rng, clamp, easeInOut, hashString } from './rng.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const BLEND = 0.25;
const FACE_BLEND = 0.3;
const DEG = Math.PI / 180;

function angleLerp(a, b, t) {
  let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return a + d * t;
}

/**
 * Plays a timeline (see src/story/timeline.js). renderFrame(t) is
 * deterministic: the same t always gives the same image, which lets the
 * cloud renderer capture frames one by one at any resolution.
 */
export class StoryPlayer {
  constructor(canvas, timeline, { width, height, pixelRatio = 1, preserveDrawingBuffer = false, bloom } = {}) {
    this.timeline = timeline;
    this.width = width || timeline.width;
    this.height = height || timeline.height;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.autoClear = false;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 900);

    this.hemi = new THREE.HemisphereLight('#ffffff', '#666666', 1);
    this.sun = new THREE.DirectionalLight('#ffffff', 2.5);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16; sc.near = 1; sc.far = 80;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.02;
    this.fill = new THREE.PointLight('#ffd9a0', 0, 30);
    this.fill.position.set(0, 5, 3);
    this.scene.add(this.hemi, this.sun, this.sun.target, this.fill);

    // bloom makes lamps, windows, eyes and magic glow (cinematic look)
    this.useBloom = bloom ?? timeline.bloom ?? true;
    if (this.useBloom) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.setPixelRatio(pixelRatio);
      this.composer.setSize(this.width, this.height);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloomPass = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 0.45, 0.5, 0.82);
      this.composer.addPass(this.bloomPass);
      this.composer.addPass(new OutputPass());
    }

    this.characters = {};
    for (const [id, spec] of Object.entries(timeline.characters)) {
      const c = spec.kind === 'creature' ? new Creature(spec) : spec.kind === 'animal' ? new Dog(spec) : spec.style === 'blocky' ? new BlockCharacter(spec) : new Character(spec);
      c.root.visible = false;
      this.characters[id] = c;
      this.scene.add(c.root);
    }
    this.envCache = new Map();
    this.activeEnv = null;
    this.particles = new ParticleSystem(this.scene);
    this.sprites = new SpriteLayer(this.scene);
    this.overlay = new TransitionOverlay();
    this.weather = new Weather(this.scene);
    this.propCache = new Map();
    this.activeProps = null;
    this.lightKey = '';
    this._fxPosCache = new Map();
    this.blinkTimes = {};
    for (const id of Object.keys(this.characters)) {
      const rng = new Rng(hashString(id) + (timeline.seed || 0));
      const times = [];
      for (let t = rng.float(0.5, 2); t < timeline.duration + 5; t += rng.float(2.2, 4.5)) times.push(t);
      this.blinkTimes[id] = times;
    }
  }

  setSize(w, h) {
    this.width = w; this.height = h;
    this.renderer.setSize(w, h, false);
    this.composer?.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  sceneAt(t) {
    const scenes = this.timeline.scenes;
    for (const s of scenes) if (t >= s.start && t < s.end) return s;
    return t < 0 ? scenes[0] : scenes[scenes.length - 1];
  }

  activateEnvironment(s) {
    const key = s.environment + ':' + (s.envSeed || 7) + ':' + JSON.stringify(s.envOptions || {});
    if (this.activeEnv && this.activeEnv.key === key) return this.activeEnv;
    if (this.activeEnv) this.activeEnv.group.visible = false;
    let env = this.envCache.get(key);
    if (!env) {
      env = buildEnvironment(s.environment, s.envSeed || 7, s.envOptions || {});
      env.key = key;
      this.envCache.set(key, env);
      this.scene.add(env.group);
    }
    env.group.visible = true;
    this.lightKey = '';
    const L = env.light;
    this.hemi.color.set(L.hemiSky); this.hemi.groundColor.set(L.hemiGround); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sun); this.sun.intensity = L.sunI;
    this.sun.position.set(...L.dir);
    this.sun.target.position.set(0, 0, -2);
    this.fill.intensity = env.interior ? 12 : 0;
    this.scene.fog = new THREE.Fog(env.fog[0], env.fog[1], env.fog[2]);
    this.activeEnv = env;
    return env;
  }

  // ---------------- character evaluation ----------------
  segments(s, id) { return (s.tracks && s.tracks[id]) || []; }

  castEntry(s, id) { return s.cast.find((c) => c.id === id); }

  /** Position (x,z) of a character at time t inside scene s. */
  positionAt(s, id, t) {
    const entry = this.castEntry(s, id);
    let x = entry?.start?.[0] ?? 0, z = entry?.start?.[1] ?? 0;
    for (const seg of this.segments(s, id)) {
      if (!seg.move) continue;
      if (t <= seg.t0) break;
      const u = seg.move.ease === 'linear' ? clamp((t - seg.t0) / (seg.t1 - seg.t0), 0, 1) : easeInOut((t - seg.t0) / (seg.t1 - seg.t0));
      const [tx, tz] = seg.move.to;
      if (t >= seg.t1) { x = tx; z = tz; continue; }
      return { x: x + (tx - x) * u, z: z + (tz - z) * u, moving: true, dir: Math.atan2(tx - x, tz - z) };
    }
    return { x, z, moving: false };
  }

  segFacing(s, id, i, t, pos) {
    const segs = this.segments(s, id);
    const seg = segs[i];
    const entry = this.castEntry(s, id);
    const def = (entry?.face ?? 0) * DEG;
    if (!seg) return def;
    if (seg.move && t >= seg.t0 && t < seg.t1) {
      const [tx, tz] = seg.move.to;
      const p = pos || this.positionAt(s, id, t);
      return Math.atan2(tx - p.x, tz - p.z);
    }
    const f = seg.face;
    if (f === undefined || f === null) {
      // keep facing of the previous move, else default
      if (seg.move) { const p0 = this.positionAt(s, id, seg.t0); return Math.atan2(seg.move.to[0] - p0.x, seg.move.to[1] - p0.z); }
      return i > 0 ? this.segFacing(s, id, i - 1, seg.t0) : def;
    }
    if (typeof f === 'number') return f * DEG;
    if (f === 'front' || f === 'camera') return 0;
    if (f === 'back') return Math.PI;
    if (f === 'left') return -Math.PI / 2;
    if (f === 'right') return Math.PI / 2;
    if (this.characters[f]) {
      const me = pos || this.positionAt(s, id, t);
      const other = this.positionAt(s, f, t);
      // blend toward camera a little so faces stay readable in portrait framing
      const a = Math.atan2(other.x - me.x, other.z - me.z);
      return angleLerp(a, 0, 0.3);
    }
    return def;
  }

  act(id, name, t, d, params) {
    const c = this.characters[id];
    if (c.kind === 'animal') return evalDogAction(name, t, d, params, c.spec);
    return c.kind === 'creature' ? evalCreatureAction(name, t, d, params) : evalAction(name, t, d, params);
  }
  blend(id, a, b, w) {
    const k = this.characters[id].kind;
    if (k === 'animal') return blendDogPose(a, b, w);
    return k === 'creature' ? blendCreaturePose(a, b, w) : blendPose(a, b, w);
  }

  evalCharacter(s, id, t) {
    const segs = this.segments(s, id);
    let idx = -1;
    for (let i = 0; i < segs.length; i++) if (segs[i].t0 <= t) idx = i;
    const pos = this.positionAt(s, id, t);
    let pose, expr = 'neutral', prop = null;
    if (idx < 0) {
      pose = this.act(id, 'idle', t - s.start, 0, {});
    } else {
      const seg = segs[idx];
      const action = seg.move && t < seg.t1 ? (seg.action === 'run' || seg.action === 'sneak' ? seg.action : 'walk') : seg.action;
      pose = this.act(id, action, t - seg.t0, seg.t1 - seg.t0, seg.params || {});
      // after a move finishes, fall back to idle-ish action if the segment action was walk
      if (seg.move && t >= seg.t1 && (seg.action === 'walk' || seg.action === 'run')) pose = this.act(id, 'idle', t, 0, {});
      expr = seg.expr || 'neutral';
      prop = seg.prop ?? null;
      if (idx > 0 && t - seg.t0 < BLEND) {
        const prev = segs[idx - 1];
        const prevAction = prev.move && seg.t0 < prev.t1 ? 'walk' : prev.action;
        const prevPose = this.act(id, prevAction, t - prev.t0, prev.t1 - prev.t0, prev.params || {});
        pose = this.blend(id, prevPose, pose, easeInOut((t - seg.t0) / BLEND));
        if (prop === null && prev.prop && t - seg.t0 < 0.1) prop = prev.prop;
      }
    }
    let facing = this.segFacing(s, id, idx, t, pos);
    if (idx > 0 && t - segs[idx].t0 < FACE_BLEND && !(segs[idx].move && t < segs[idx].t1)) {
      const prevF = this.segFacing(s, id, idx - 1, segs[idx].t0);
      facing = angleLerp(prevF, facing, easeInOut((t - segs[idx].t0) / FACE_BLEND));
    }
    // talking (lip sync from the narration audio envelope when available)
    let mouth = 0;
    for (const line of this.timeline.lines) {
      if (line.speaker !== id || t < line.start || t > line.end) continue;
      if (line.envelope && line.envelope.length) {
        const fps = line.envelopeFps || 30;
        const i = Math.floor((t - line.start) * fps);
        mouth = clamp((line.envelope[i] || 0) * 1.4, 0, 1);
      } else {
        const inWord = (line.words || []).some((w) => t >= w.start && t <= w.end);
        mouth = inWord ? 0.35 + 0.35 * Math.abs(Math.sin(t * 17)) : 0;
      }
    }
    // blink
    let blink = 0;
    for (const bt of this.blinkTimes[id]) {
      const d = t - bt;
      if (d >= 0 && d < 0.16) { blink = Math.sin((d / 0.16) * Math.PI); break; }
    }
    const glasses = idx >= 0 ? segs[idx].glasses !== false : true;
    return { pos, facing, pose, face: { expr, blink, mouth, lookX: 0, lookY: 0 }, prop, glasses };
  }

  headWorld(id) {
    const c = this.characters[id];
    const v = new THREE.Vector3();
    c.head.getWorldPosition(v);
    return v;
  }

  fxPosition(s, ev) {
    if (Array.isArray(ev.at)) return ev.at;
    const key = s.id + ':' + ev.t + ':' + ev.type + ':' + ev.at;
    if (this._fxPosCache.has(key)) return this._fxPosCache.get(key);
    const p = this.positionAt(s, ev.at, ev.t);
    const c = this.characters[ev.at];
    const h = ev.height === 'head' ? c.height - c.dims.headR : ev.height === 'hand' ? (c.kind === 'creature' ? c.height * 0.5 : 1.4) : ev.height ?? 0.1;
    const v = [p.x + (ev.dx || 0), h, p.z + (ev.dz || 0) + 0.2];
    this._fxPosCache.set(key, v);
    return v;
  }

  // ---------------- frame ----------------
  renderFrame(t) {
    const s = this.sceneAt(t);
    const env = this.activateEnvironment(s);
    animateEnvironment(env.group, t);
    const lk = env.key + '|' + (s.lighting || 'day');
    if (lk !== this.lightKey) { applyLighting(this, env, s.lighting || 'day'); this.lightKey = lk; }
    this.lightning(s, t);
    this.updateProps(s, t);

    const castIds = new Set(s.cast.map((c) => c.id));
    for (const [id, c] of Object.entries(this.characters)) {
      c.root.visible = castIds.has(id);
      if (!c.root.visible) continue;
      const st = this.evalCharacter(s, id, t);
      c.root.position.set(st.pos.x, 0, st.pos.z);
      c.root.rotation.y = st.facing;
      c.applyPose(st.pose, t);
      c.setFace(st.face);
      c.setProp(st.prop);
      c.setGlasses?.(st.glasses);
    }
    this.scene.updateMatrixWorld(true);

    // camera
    const shot = (s.shots || []).find((sh) => t >= sh.t0 && t < sh.t1) || (s.shots || [])[s.shots.length - 1] || { type: 'wide', t0: s.start, t1: s.end };
    const st = shotState(shot, t);
    const target = this.shotTarget(s, shot, t);
    const tIds = shot.target ? [].concat(shot.target) : [];
    const big = tIds.length === 1 && this.characters[tIds[0]]?.kind === 'creature' ? this.characters[tIds[0]].height / 2.2 : 1;
    if (big !== 1 && shot.scale !== false) { st.dist *= big * 0.75; st.height *= big * 0.6; st.lookY *= big * 0.6; }
    let shake = 0;
    for (const ev of s.fx || []) if (ev.shake && t >= ev.t && t < ev.t + 0.45) shake += ev.shake * (1 - (t - ev.t) / 0.45);
    placeCamera(this.camera, st, target, shake, t);

    // effects
    const fxEvents = (s.fx || []).map((ev, i) => ({ ...ev, pos: this.fxPosition(s, ev), seed: hashString(s.id + i) }));
    this.particles.update(fxEvents, t);
    const sprites = [];
    for (const e of s.emotes || []) {
      if (t < e.t0 || t > e.t1) continue;
      const hp = this.headWorld(e.char);
      sprites.push({ kind: 'emote', key: e.icon, pos: hp.add(new THREE.Vector3(0.45, 0.65, 0)), age: t - e.t0, life: e.t1 - e.t0, size: 0.6 });
    }
    for (const cm of s.comic || []) {
      if (t < cm.t0 || t > cm.t1) continue;
      let p;
      if (Array.isArray(cm.at)) p = new THREE.Vector3(...cm.at);
      else p = this.headWorld(cm.at).add(new THREE.Vector3(0, 1.0, 0.3));
      sprites.push({ kind: 'comic', key: cm.text, color: cm.color, pos: p, age: t - cm.t0, life: cm.t1 - cm.t0, size: cm.size || 1.1 });
    }
    this.sprites.update(sprites);
    this.weather.update(s.weather, t, this.camera);

    // draw
    this.renderer.clear();
    if (this.composer) {
      this.bloomPass.strength = s.lighting === 'night' || s.lighting === 'storm' || s.lighting === 'dusk' ? 0.75 : 0.35;
      this.composer.render();
    } else this.renderer.render(this.scene, this.camera);
    const tr = this.transitionAt(t);
    if (tr && this.overlay.set(tr.type, tr.p, this.width / this.height)) {
      this.renderer.clearDepth();
      this.renderer.render(this.overlay.scene, this.overlay.camera);
    }
  }

  updateProps(s, t) {
    if (this.activeProps && this.activeProps.sid !== s.id) { this.activeProps.group.visible = false; this.activeProps = null; }
    if (!s.props || !s.props.length) return;
    let entry = this.propCache.get(s.id);
    if (!entry) {
      const group = new THREE.Group();
      const items = s.props.map((p) => { const o = buildProp(p); group.add(o); return { spec: p, obj: o }; });
      entry = { sid: s.id, group, items };
      this.scene.add(group);
      this.propCache.set(s.id, entry);
    }
    entry.group.visible = true;
    this.activeProps = entry;
    animateEnvironment(entry.group, t);
    for (const { spec, obj } of entry.items) {
      if (spec.collapseT === undefined) continue;
      const u = clamp((t - spec.collapseT) / 1.1, 0, 1);
      const e = u * u;
      obj.userData.pivot.rotation.x = (spec.fallDir ?? -1) * e * 1.5;
      obj.userData.pivot.position.y = -e * 0.6;
      obj.userData.pivot.scale.y = 1 - e * 0.25;
    }
  }

  lightning(s, t) {
    let f = 0;
    for (const lt of s.lightningTimes || []) { const d = t - lt; if (d >= 0 && d < 0.35) f = Math.max(f, d < 0.06 ? 1 : d < 0.12 ? 0.3 : d < 0.18 ? 0.8 : (0.35 - d) / 0.17 * 0.5); }
    this.renderer.toneMappingExposure = (this.baseExposure || 1.05) * (1 + f * 1.8);
  }

  shotTarget(s, shot, t) {
    const ids = shot.target ? [].concat(shot.target) : s.cast.map((c) => c.id);
    if (ids.length && typeof ids[0] === 'number') return new THREE.Vector3(ids[0], ids[1], ids[2]);
    const v = new THREE.Vector3();
    let n = 0;
    for (const id of ids) {
      if (!this.characters[id]) continue;
      const p = this.positionAt(s, id, t);
      v.x += p.x; v.z += p.z; n++;
    }
    if (n) v.divideScalar(n);
    const one = ids.length === 1 ? this.characters[ids[0]] : null;
    if (one && one.kind === 'creature') {
      const hp = new THREE.Vector3();
      one.head.getWorldPosition(hp);
      v.set(hp.x, hp.y * 0.85, hp.z);
      if (shot.offset) { v.x += shot.offset[0]; v.y += shot.offset[1]; v.z += shot.offset[2]; }
      return v;
    }
    const focus = one ? (one.kind === 'creature' ? one.height * 0.62 : one.height - 0.45) : 1.25;
    v.y = focus;
    if (shot.offset) { v.x += shot.offset[0]; v.y += shot.offset[1]; v.z += shot.offset[2]; }
    return v;
  }

  transitionAt(t) {
    const scenes = this.timeline.scenes;
    for (let i = 1; i < scenes.length; i++) {
      const tr = scenes[i].transitionIn;
      if (!tr || tr.type === 'cut') continue;
      const T = scenes[i].start, half = (tr.dur || 0.5) / 2;
      if (t >= T - half && t < T) return { type: tr.type, p: easeInOut((t - (T - half)) / half) };
      if (t >= T && t < T + half) return { type: tr.type, p: 1 - easeInOut((t - T) / half) };
    }
    // fade in from black at the very start and out at the end
    if (t < 0.35) return { type: 'fade', p: 1 - t / 0.35 };
    const D = this.timeline.duration;
    if (t > D - 0.4) return { type: 'fade', p: clamp((t - (D - 0.4)) / 0.4, 0, 1) };
    return null;
  }

  /** Render every scene once so all shaders/textures compile before capture. */
  warmup() {
    for (const s of this.timeline.scenes) this.renderFrame((s.start + s.end) / 2);
  }

  dispose() { this.renderer.dispose(); }
}
