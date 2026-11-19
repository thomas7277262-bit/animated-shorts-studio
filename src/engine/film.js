// FilmPlayer: plays a hand-directed "film" (a script module in src/films/)
// instead of a generated storyboard. It adds a cinematic finishing layer on
// top of the normal engine:
//   * real motion blur: each output frame averages several sub-frames
//     rendered across a 180° shutter (renderFrame(t) stays deterministic)
//   * sub-pixel jitter between sub-frames for extra anti-aliasing
//   * a crisp 2D overlay (HUD) for floating character labels and titles,
//     drawn after the blur so text stays sharp
//   * bloom, fades and flashes
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { TransitionOverlay } from './effects.js';
import { FILMS } from '../films/index.js';

const JITTER = [[0.25, -0.15], [-0.3, 0.3], [0.1, 0.4], [-0.15, -0.35], [0.4, 0.1], [-0.4, -0.05], [0.0, 0.0], [0.3, 0.35]];

const quadVS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

// ---------------- HUD (screen-space text) ----------------
function textCanvas(text, { size = 46, weight = 800, spacing = 0.32, color = '#ffffff', underline = null, shadow = 0.6, font = 'Inter, "Helvetica Neue", Arial, sans-serif' } = {}) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = `${weight} ${size}px ${font}`;
  const chars = [...text];
  const sp = size * spacing;
  const widths = chars.map((ch) => g.measureText(ch).width);
  const w = Math.ceil(widths.reduce((a, b) => a + b, 0) + sp * (chars.length - 1) + size * 1.2);
  const h = Math.ceil(size * (underline ? 2.1 : 1.8));
  c.width = w; c.height = h;
  g.font = `${weight} ${size}px ${font}`;
  g.textBaseline = 'middle';
  g.fillStyle = color;
  if (shadow) { g.shadowColor = `rgba(0,0,0,${shadow})`; g.shadowBlur = size * 0.35; g.shadowOffsetY = size * 0.05; }
  let x = size * 0.6;
  const y = size * 0.85;
  chars.forEach((ch, i) => { g.fillText(ch, x, y); x += widths[i] + sp; });
  if (underline) {
    g.shadowBlur = size * 0.25;
    g.fillStyle = underline;
    const lw = Math.max(3, size * 0.09);
    const len = Math.min(w - size * 1.2, size * 2.2);
    g.fillRect((w - len) / 2, size * 1.62, len, lw);
  }
  return c;
}

class Hud {
  constructor(aspect) {
    this.aspect = aspect;
    this.scene = new THREE.Scene();
    // x spans [-aspect, aspect], y spans [-1, 1]
    this.camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, -1, 1);
    this.cache = new Map();
    this.pool = [];
  }
  tex(key, make) {
    if (!this.cache.has(key)) {
      const c = make();
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.anisotropy = 4;
      this.cache.set(key, { t, w: c.width, h: c.height });
    }
    return this.cache.get(key);
  }
  /** items: [{text, style, x, y (NDC-ish: y -1..1, x -aspect..aspect), height (fraction of screen height), opacity, scale, rot}] */
  update(items) {
    while (this.pool.length < items.length) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
      this.scene.add(m); this.pool.push(m);
    }
    this.pool.forEach((m, i) => {
      const it = items[i];
      if (!it || it.opacity <= 0.002) { m.visible = false; return; }
      const { t, w, h } = this.tex(it.text + '|' + JSON.stringify(it.style || {}), () => textCanvas(it.text, it.style));
      if (m.material.map !== t) { m.material.map = t; m.material.needsUpdate = true; }
      // it.height = font size as a fraction of the screen height (screen = 2 units)
      const hh = it.height * 2 * (it.scale ?? 1) * (h / (it.style?.size ?? 46));
      m.scale.set(hh * (w / h), hh, 1);
      m.position.set(it.x, it.y, 0);
      m.rotation.z = it.rot || 0;
      m.material.opacity = it.opacity;
      m.visible = true;
    });
  }
}

export class FilmPlayer {
  constructor(canvas, timeline, { width, height, pixelRatio = 1, preserveDrawingBuffer = false, motionBlur } = {}) {
    this.timeline = timeline;
    this.width = width || timeline.width;
    this.height = height || timeline.height;
    this.fps = timeline.fps || 30;
    this.samples = Math.max(1, motionBlur ?? timeline.motionBlur ?? 1);
    this.shutter = timeline.shutter ?? 0.5; // fraction of a frame the shutter is open

    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer, powerPreference: 'high-performance' });
    r.setPixelRatio(pixelRatio);
    r.setSize(this.width, this.height, false);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.autoClear = false;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1200);

    const W = this.width * pixelRatio, H = this.height * pixelRatio;
    const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(r, rt);
    this.composer.setPixelRatio(pixelRatio);
    this.composer.setSize(this.width, this.height);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 0.6, 0.55, 0.78);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.composer.renderToScreen = false;

    // accumulation buffer for motion blur
    this.accum = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: false });
    this.quadScene = new THREE.Scene();
    this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quadMat = new THREE.ShaderMaterial({
      uniforms: { tex: { value: null }, weight: { value: 1 } },
      vertexShader: quadVS,
      fragmentShader: 'uniform sampler2D tex; uniform float weight; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tex, vUv).rgb * weight, weight); }',
      depthTest: false, depthWrite: false, blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    });
    this.copyMat = new THREE.ShaderMaterial({
      uniforms: { tex: { value: null }, vignette: { value: 0.35 }, grain: { value: 0.025 }, seed: { value: 0 }, aspect: { value: this.width / this.height } },
      vertexShader: quadVS,
      // final look: gentle vignette and film grain (output is already tone-mapped sRGB)
      fragmentShader: `uniform sampler2D tex; uniform float vignette; uniform float grain; uniform float seed; uniform float aspect; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }
        void main(){
          vec3 c = texture2D(tex, vUv).rgb;
          vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * 1.6;
          c *= 1.0 - vignette * smoothstep(0.35, 1.25, length(p));
          c += (h(vUv * 1000.0) - 0.5) * grain;
          gl_FragColor = vec4(c, 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.quadMat);
    this.quad.frustumCulled = false;
    this.quadScene.add(this.quad);

    this.hud = new Hud(this.width / this.height);
    this.overlay = new TransitionOverlay();

    const make = FILMS[timeline.film];
    if (!make) throw new Error(`Unknown film "${timeline.film}"`);
    this.film = make(this);
    this.duration = timeline.duration;
  }

  warmup() {
    // compile shaders for every scene up front so the first frames are not slow
    for (const t of this.film.warmTimes || [0]) { this.film.update(t, {}); this.renderer.compile(this.scene, this.camera); }
  }

  drawQuad(material, target, clear) {
    this.quad.material = material;
    this.renderer.setRenderTarget(target);
    if (clear) { this.renderer.setClearColor(0x000000, 0); this.renderer.clear(); }
    this.renderer.render(this.quadScene, this.quadCam);
  }

  renderFrame(t) {
    const r = this.renderer;
    const n = this.samples;
    const frameDur = 1 / this.fps;
    let state = null;
    for (let i = 0; i < n; i++) {
      // sub-frame times spread over the open shutter, centred on t
      const st = n === 1 ? t : t + ((i + 0.5) / n - 0.5) * this.shutter * frameDur;
      state = this.film.update(Math.max(0, st), { sub: i, center: t });
      if (n > 1) {
        const [jx, jy] = JITTER[i % JITTER.length];
        this.camera.setViewOffset(this.width, this.height, jx, jy, this.width, this.height);
      }
      this.composer.render();
      if (n > 1) this.camera.clearViewOffset();
      this.quadMat.uniforms.tex.value = this.composer.readBuffer.texture;
      this.quadMat.uniforms.weight.value = 1 / n;
      this.drawQuad(this.quadMat, this.accum, i === 0);
    }
    // the HUD and overlays use the centre time so text stays crisp
    const hudState = this.film.overlay(t);
    this.copyMat.uniforms.tex.value = this.accum.texture;
    this.copyMat.uniforms.seed.value = (Math.round(t * this.fps) % 97) * 0.731;
    r.setRenderTarget(null);
    r.setClearColor(0x000000, 1);
    r.clear();
    this.drawQuad(this.copyMat, null, false);
    this.hud.update(hudState.hud || []);
    r.render(this.hud.scene, this.hud.camera);
    for (const o of hudState.overlays || []) {
      if (this.overlay.set(o.type, o.amount, this.width / this.height)) r.render(this.overlay.scene, this.overlay.camera);
    }
    return state;
  }
}
