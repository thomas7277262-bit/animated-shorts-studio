import * as THREE from 'three';
import { Rng, clamp, easeOutBack } from './rng.js';

// ---------- Particles (stateless: positions are computed from time) ----------
const FX_TYPES = {
  dust:     { count: 18, life: 0.9, speed: [0.6, 1.6], up: [0.3, 1.0], gravity: -0.6, size: [0.08, 0.18], colors: ['#d8c8a8', '#c9b48e', '#e6dcc6'], shape: 'ico', spread: 1, fadeGrow: 1.8 },
  stars:    { count: 10, life: 1.0, speed: [1.5, 2.5], up: [1, 2.5], gravity: -3, size: [0.1, 0.16], colors: ['#ffe24a', '#ffffff', '#ffd000'], shape: 'octa', spread: 1 },
  sparkle:  { count: 28, life: 1.3, speed: [0.4, 1.5], up: [0.2, 1.6], gravity: -0.3, size: [0.04, 0.1], colors: ['#fff6a8', '#a8f0ff', '#ffffff', '#ffb6f2'], shape: 'octa', spread: 1, emissive: true },
  magic:    { count: 40, life: 1.4, speed: [0.8, 2.4], up: [0.5, 2.0], gravity: 0.2, size: [0.05, 0.12], colors: ['#b388ff', '#7c4dff', '#80d8ff', '#ff80ab'], shape: 'octa', spread: 1, emissive: true },
  confetti: { count: 70, life: 2.2, speed: [1.5, 3.5], up: [3, 6], gravity: -4.5, size: [0.06, 0.1], colors: ['#ff4d6d', '#ffd166', '#06d6a0', '#118ab2', '#b388ff'], shape: 'box', spread: 1, spin: true },
  smoke:    { count: 16, life: 1.6, speed: [0.3, 0.9], up: [0.6, 1.4], gravity: 0.3, size: [0.25, 0.45], colors: ['#9e9e9e', '#bdbdbd', '#8a8a8a'], shape: 'ico', spread: 1, fadeGrow: 2.2 },
  impact:   { count: 14, life: 0.5, speed: [2.5, 4.5], up: [0.5, 2], gravity: -2, size: [0.07, 0.12], colors: ['#ffffff', '#ffe082'], shape: 'octa', spread: 1, emissive: true },
  hearts:   { count: 10, life: 1.6, speed: [0.2, 0.6], up: [0.8, 1.4], gravity: 0.1, size: [0.1, 0.16], colors: ['#ff4d6d', '#ff85a1'], shape: 'octa', spread: 0.6 },
  debris:   { count: 46, life: 1.6, speed: [2, 5], up: [3, 7], gravity: -9, size: [0.12, 0.32], colors: ['#8b5a2b', '#c0392b', '#a8a29a', '#6b4a2c', '#e8dcc0'], shape: 'box', spread: 1, spin: true },
  bigdust:  { count: 30, life: 2.2, speed: [1.5, 3.5], up: [0.5, 1.8], gravity: -0.4, size: [0.5, 0.9], colors: ['#cbb89a', '#b8a888', '#ddd0b8'], shape: 'ico', spread: 1, fadeGrow: 2.5 },
  fireflies:{ count: 60, life: 5.0, speed: [0.1, 0.5], up: [0.05, 0.4], gravity: 0.02, size: [0.03, 0.07], colors: ['#fff3a0', '#ffd84a', '#fffbe0'], shape: 'octa', spread: 4, emissive: true },
  embers:   { count: 50, life: 2.5, speed: [0.3, 1.2], up: [0.8, 2.0], gravity: 0.3, size: [0.03, 0.07], colors: ['#ffb347', '#ff6b00', '#ffe082'], shape: 'octa', spread: 2, emissive: true },
  fire:     { count: 30, life: 0.8, speed: [0.8, 1.6], up: [0.1, 0.5], gravity: 1.5, size: [0.1, 0.22], colors: ['#ff6b00', '#ffb300', '#ff3d00', '#ffe082'], shape: 'ico', spread: 0.4, emissive: true, fadeGrow: 0.4, directional: true },
};

const MAX = 900;

export class ParticleSystem {
  constructor(scene) {
    const mkMat = () => new THREE.MeshStandardMaterial({ roughness: 0.6, flatShading: true, transparent: true });
    this.meshes = {
      ico: new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), mkMat(), MAX),
      octa: new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ transparent: true }), MAX),
      box: new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.15, 1.4), mkMat(), MAX),
    };
    for (const m of Object.values(this.meshes)) {
      m.frustumCulled = false;
      m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3);
      scene.add(m);
    }
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler();
    this._c = new THREE.Color();
  }

  /** events: [{t, type, pos:[x,y,z], dir?:[x,y,z], seed}] */
  update(events, time) {
    const counts = { ico: 0, octa: 0, box: 0 };
    for (const ev of events) {
      const cfg = FX_TYPES[ev.type];
      if (!cfg) continue;
      const dt = time - ev.t;
      if (dt < 0 || dt > cfg.life) continue;
      const rng = new Rng(ev.seed || 1);
      const mesh = this.meshes[cfg.shape];
      const k = dt / cfg.life;
      for (let i = 0; i < cfg.count; i++) {
        const a = rng.float(0, Math.PI * 2);
        const sp = rng.float(...cfg.speed) * cfg.spread;
        let vx = Math.cos(a) * sp, vz = Math.sin(a) * sp * 0.6;
        let vy = rng.float(...cfg.up);
        if (cfg.directional && ev.dir) { vx = ev.dir[0] * sp * 3 + vx * 0.3; vy = ev.dir[1] * sp * 3 + vy * 0.3; vz = ev.dir[2] * sp * 3 + vz * 0.3; }
        const size = rng.float(...cfg.size);
        const color = rng.pick(cfg.colors);
        const delay = rng.float(0, cfg.life * 0.15);
        const lt = dt - delay;
        if (lt < 0) continue;
        const x = ev.pos[0] + vx * lt;
        const y = ev.pos[1] + vy * lt + 0.5 * cfg.gravity * lt * lt;
        const z = ev.pos[2] + vz * lt;
        let s = size * (cfg.fadeGrow ? 1 + k * cfg.fadeGrow : 1) * (cfg.life > 3 ? Math.min(1, (1 - k) * 4, k * 8) : 1 - Math.pow(k, 3));
        if (y < 0.02 && cfg.gravity < 0) s *= 0.5;
        const idx = counts[cfg.shape]++;
        if (idx >= MAX) continue;
        this._e.set(cfg.spin ? lt * 8 + i : a, cfg.spin ? lt * 5 : a, cfg.spin ? lt * 6 : 0);
        this._q.setFromEuler(this._e);
        this._m.compose(new THREE.Vector3(x, Math.max(0.02, y), z), this._q, new THREE.Vector3(s, s, s));
        mesh.setMatrixAt(idx, this._m);
        this._c.set(color);
        mesh.instanceColor.setXYZ(idx, this._c.r, this._c.g, this._c.b);
      }
    }
    for (const [shape, mesh] of Object.entries(this.meshes)) {
      mesh.count = Math.min(MAX, counts[shape]);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor.needsUpdate = true;
    }
  }
}

// ---------- Sprites: emotes above heads and comic-book text ----------
function canvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
}

function drawEmote(icon) {
  const c = canvas(256, 256), g = c.getContext('2d');
  g.lineJoin = 'round'; g.lineCap = 'round';
  const bubble = () => {
    g.fillStyle = '#ffffff'; g.strokeStyle = '#151515'; g.lineWidth = 10;
    g.beginPath(); g.arc(128, 118, 95, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(100, 205); g.lineTo(128, 250); g.lineTo(150, 205); g.fill(); g.stroke();
  };
  const text = (t, color, size = 150) => {
    g.font = `900 ${size}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 12; g.strokeStyle = '#151515'; g.strokeText(t, 128, 125);
    g.fillStyle = color; g.fillText(t, 128, 125);
  };
  switch (icon) {
    case '!': text('!', '#ff3b30', 210); break;
    case '?': text('?', '#2d6cdf', 190); break;
    case '!?': text('!?', '#ff9500', 150); break;
    case 'heart': {
      g.fillStyle = '#ff2d55'; g.strokeStyle = '#151515'; g.lineWidth = 10;
      g.beginPath(); g.moveTo(128, 210);
      g.bezierCurveTo(10, 130, 50, 30, 128, 80); g.bezierCurveTo(206, 30, 246, 130, 128, 210);
      g.fill(); g.stroke(); break;
    }
    case 'anger': {
      g.strokeStyle = '#ff2d2d'; g.lineWidth = 26;
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        g.beginPath(); g.arc(128 + sx * 55, 128 + sy * 55, 40, 0, Math.PI * 2); g.stroke();
      }
      g.fillStyle = 'rgba(0,0,0,0)'; break;
    }
    case 'sweat': {
      g.fillStyle = '#5ab8ff'; g.strokeStyle = '#151515'; g.lineWidth = 9;
      g.beginPath(); g.moveTo(128, 30); g.quadraticCurveTo(210, 150, 128, 220); g.quadraticCurveTo(46, 150, 128, 30); g.fill(); g.stroke(); break;
    }
    case 'zzz': text('Zz', '#7c4dff', 140); break;
    case 'idea': {
      g.fillStyle = '#ffe24a'; g.strokeStyle = '#151515'; g.lineWidth = 10;
      g.beginPath(); g.arc(128, 105, 70, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = '#9e9e9e'; g.fillRect(98, 170, 60, 40); g.strokeRect(98, 170, 60, 40);
      g.strokeStyle = '#ffb300'; g.lineWidth = 12;
      for (let i = 0; i < 5; i++) { const a = -Math.PI * (0.1 + i * 0.2); g.beginPath(); g.moveTo(128 + Math.cos(a) * 88, 105 + Math.sin(a) * 88); g.lineTo(128 + Math.cos(a) * 118, 105 + Math.sin(a) * 118); g.stroke(); }
      break;
    }
    case 'note': bubble(); text('♪', '#151515', 150); break;
    case 'skull': bubble(); text('☠', '#151515', 140); break;
    default: bubble(); text(icon, '#151515', 110);
  }
  return c;
}

function drawComic(text, color) {
  const c = canvas(1024, 384), g = c.getContext('2d');
  // starburst
  g.fillStyle = '#ffe24a'; g.strokeStyle = '#151515'; g.lineWidth = 12;
  g.beginPath();
  const n = 18;
  for (let i = 0; i <= n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const r = i % 2 ? 150 : 190;
    const x = 512 + Math.cos(a) * r * 2.4, y = 192 + Math.sin(a) * r * 0.95;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath(); g.fill(); g.stroke();
  g.font = '900 170px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 22; g.strokeStyle = '#151515'; g.strokeText(text, 512, 200);
  g.fillStyle = color || '#ff3b30'; g.fillText(text, 512, 200);
  return c;
}

// Floating power-level tag above a pet (glowing pill with a big number).
function drawLabel(text, color) {
  const c = canvas(512, 160), g = c.getContext('2d');
  let fs = 104; g.font = `900 ${fs}px sans-serif`;
  while (g.measureText(text).width > 440 && fs > 40) { fs -= 4; g.font = `900 ${fs}px sans-serif`; }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const w = Math.min(500, g.measureText(text).width + 70);
  g.fillStyle = 'rgba(10,10,30,0.72)';
  g.beginPath(); g.roundRect((512 - w) / 2, 14, w, 132, 60); g.fill();
  g.lineWidth = 6; g.strokeStyle = color; g.stroke();
  g.lineWidth = 14; g.strokeStyle = '#000'; g.strokeText(text, 256, 84);
  g.shadowColor = color; g.shadowBlur = 24; g.fillStyle = color; g.fillText(text, 256, 84);
  return c;
}
// Big pop-up number / word in the middle of the action (sample-video style).
function drawPop(text, color) {
  const c = canvas(1024, 320), g = c.getContext('2d');
  let size = 230; g.font = `900 ${size}px sans-serif`;
  while (g.measureText(text).width > 980 && size > 60) { size -= 10; g.font = `900 ${size}px sans-serif`; }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = size * 0.16; g.lineJoin = 'round'; g.strokeStyle = '#111'; g.strokeText(text, 512, 170);
  g.fillStyle = color || '#ffe14a'; g.fillText(text, 512, 170);
  return c;
}

export class SpriteLayer {
  constructor(scene) {
    this.scene = scene;
    this.cache = new Map();
    this.pool = [];
  }
  texture(key, draw) {
    if (!this.cache.has(key)) {
      const t = new THREE.CanvasTexture(draw());
      t.colorSpace = THREE.SRGBColorSpace;
      this.cache.set(key, t);
    }
    return this.cache.get(key);
  }
  /** items: [{kind:'emote'|'comic', key, pos:Vector3, age, life, size}] */
  update(items) {
    while (this.pool.length < items.length) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: true }));
      s.renderOrder = 5;
      this.scene.add(s); this.pool.push(s);
    }
    this.pool.forEach((s, i) => {
      const it = items[i];
      if (!it) { s.visible = false; return; }
      s.visible = true;
      const tex = it.kind === 'emote' ? this.texture('e:' + it.key, () => drawEmote(it.key))
        : it.kind === 'label' ? this.texture('l:' + it.key + it.color, () => drawLabel(it.key, it.color))
        : it.kind === 'pop' ? this.texture('p:' + it.key + it.color, () => drawPop(it.key, it.color))
        : this.texture('c:' + it.key + it.color, () => drawComic(it.key, it.color));
      if (s.material.map !== tex) { s.material.map = tex; s.material.needsUpdate = true; }
      const pop = it.kind === 'label' ? 1 : easeOutBack(clamp(it.age / 0.25, 0, 1));
      const out = it.kind === 'label' ? 1 : clamp((it.life - it.age) / 0.2, 0, 1);
      const sc = it.size * pop * out;
      const aspect = it.kind === 'comic' ? 1024 / 384 : it.kind === 'label' ? 512 / 160 : it.kind === 'pop' ? 1024 / 320 : 1;
      s.scale.set(sc * aspect, sc, 1);
      s.position.copy(it.pos);
      s.position.y += Math.sin(it.age * 5) * 0.03;
      s.material.rotation = it.kind === 'comic' ? -0.12 + Math.sin(it.age * 20) * 0.02 * out : it.kind === 'label' || it.kind === 'pop' ? 0 : Math.sin(it.age * 6) * 0.08;
      s.material.depthTest = !(it.kind === 'pop' || it.kind === 'label');
    });
  }
}

// ---------- Full-screen transitions (fade, flash, iris, wipe) ----------
export class TransitionOverlay {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.uniforms = {
      progress: { value: 0 }, mode: { value: 0 }, color: { value: new THREE.Color('#000') }, aspect: { value: 9 / 16 },
    };
    const m = new THREE.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false, uniforms: this.uniforms,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `uniform float progress; uniform int mode; uniform vec3 color; uniform float aspect; varying vec2 vUv;
        void main(){
          float a = 0.0;
          if (mode == 0) a = progress;
          else if (mode == 1) a = progress;
          else if (mode == 2) { vec2 p = (vUv - 0.5) * vec2(aspect, 1.0); float r = (1.0 - progress) * 1.25; a = smoothstep(r - 0.01, r + 0.01, length(p)); }
          else if (mode == 3) { float d = vUv.x * 0.6 + vUv.y * 0.4; a = step(d, progress * 1.1); }
          gl_FragColor = vec4(color, a);
          #include <colorspace_fragment>
        }`,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m);
    quad.frustumCulled = false;
    this.scene.add(quad);
  }
  /** returns true when something needs drawing */
  set(type, progress, aspect) {
    const modes = { fade: 0, flash: 1, iris: 2, wipe: 3 };
    this.uniforms.mode.value = modes[type] ?? 0;
    this.uniforms.color.value.set(type === 'flash' ? '#ffffff' : type === 'wipe' ? '#ffd166' : '#000000');
    this.uniforms.progress.value = progress;
    this.uniforms.aspect.value = aspect;
    return progress > 0.001;
  }
}
