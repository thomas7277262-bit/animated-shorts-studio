// "The trend is me" sets: sunny trend town (suburb + clock-tower town hall + bus stop),
// a summer-game basketball court with bleachers and a crowd, and a full-frame
// phone "feed" screen (view counter, comment wall, copycat grid).
// Same contract as the other sets: { group, light, fog, update?(t, state) }.
import * as THREE from 'three';
import { Rng } from '../rng.js';
import { mat, mesh, box, sky, cloud } from './common.js';
import { suburb } from './suburb.js';

const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o });
const FONT = '"Fredoka", "Arial Black", sans-serif';

function canvasTex(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { c, g: c.getContext('2d'), tex };
}

function bunting(g, rng, x0, x1, y, z, sag = 0.6) {
  const cols = ['#ff5252', '#ffd740', '#40c4ff', '#69f0ae', '#e040fb', '#ff9100'];
  const n = Math.round(Math.abs(x1 - x0) / 0.7);
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = x0 + (x1 - x0) * u, yy = y - Math.sin(u * Math.PI) * sag;
    const f = mesh(new THREE.ConeGeometry(0.22, 0.45, 3), mat(cols[i % cols.length]), { x, y: yy - 0.22, z, rx: Math.PI });
    g.add(f);
  }
  const pts = []; for (let i = 0; i <= 20; i++) { const u = i / 20; pts.push(new THREE.Vector3(x0 + (x1 - x0) * u, y - Math.sin(u * Math.PI) * sag, z)); }
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#555555' })));
}

function townHall(rng) {
  const g = new THREE.Group();
  const brick = mat('#c8553d'), white = mat('#ffffff'), roof = mat('#2e3a4f');
  g.add(box(14, 6, 7, brick, { base: true }));
  g.add(box(14.4, 0.4, 7.4, white, { y: 6.2 }));
  for (let i = 0; i < 6; i++) g.add(mesh(new THREE.CylinderGeometry(0.32, 0.32, 5.4, 12), white, { x: -5 + i * 2, y: 2.9, z: 3.9 }));
  const ped = new THREE.Shape(); ped.moveTo(-6, 0); ped.lineTo(6, 0); ped.lineTo(0, 2); ped.closePath();
  const pg = new THREE.ExtrudeGeometry(ped, { depth: 0.6, bevelEnabled: false });
  g.add(mesh(pg, white, { y: 6.4, z: 3.6 }));
  for (let i = 0; i < 5; i++) g.add(box(1, 1.6, 0.1, mat('#8fd3ff', { roughness: 0.2 }), { x: -4 + i * 2, y: 3.6, z: 3.55 }));
  g.add(box(1.6, 2.6, 0.1, mat('#5d3a1a'), { base: true, z: 3.56 }));
  // clock tower
  g.add(box(3.2, 5, 3.2, white, { base: true, y: 6.6 }));
  const clock = canvasTex(256, 256);
  const cg = clock.g; cg.fillStyle = '#ffffff'; cg.fillRect(0, 0, 256, 256);
  cg.strokeStyle = '#1b2333'; cg.lineWidth = 14; cg.beginPath(); cg.arc(128, 128, 110, 0, 7); cg.stroke();
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; cg.fillStyle = '#1b2333'; cg.fillRect(128 + Math.cos(a) * 88 - 6, 128 + Math.sin(a) * 88 - 6, 12, 12); }
  cg.lineWidth = 12; cg.beginPath(); cg.moveTo(128, 128); cg.lineTo(128, 52); cg.moveTo(128, 128); cg.lineTo(178, 128); cg.stroke();
  g.add(mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshStandardMaterial({ map: clock.tex, roughness: 0.6 }), { y: 9.4, z: 1.62 }));
  g.add(mesh(new THREE.ConeGeometry(2.6, 3, 4), roof, { y: 13.1, ry: Math.PI / 4 }));
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6), mat('#333333'), { y: 15.2 }));
  g.add(mesh(new THREE.PlaneGeometry(1.0, 0.6), mat('#e53935', { side: THREE.DoubleSide }), { x: 0.5, y: 15.6 }));
  return g;
}

function busStop() {
  const g = new THREE.Group();
  const frame = mat('#37474f', { metalness: 0.3, roughness: 0.4 });
  for (const x of [-1.3, 1.3]) g.add(box(0.1, 2.4, 0.1, frame, { base: true, x, z: -0.5 }));
  g.add(box(2.9, 0.12, 1.3, mat('#1e88e5'), { y: 2.45, z: -0.1 }));
  g.add(box(2.7, 1.8, 0.05, new THREE.MeshStandardMaterial({ color: '#bfe6ff', transparent: true, opacity: 0.45, roughness: 0.1 }), { y: 1.4, z: -0.55 }));
  g.add(box(2.2, 0.1, 0.45, mat('#8d6e63'), { y: 0.55, z: -0.3 }));
  g.add(box(0.08, 2.6, 0.08, frame, { base: true, x: 1.8, z: 0.2 }));
  g.add(mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 20), mat('#1e88e5'), { x: 1.8, y: 2.6, z: 0.2, rx: Math.PI / 2 }));
  return g;
}

// ------------------------------------------------------------------ trend town (day)
export function trendtown(seed = 5) {
  const base = suburb(seed);
  const g = base.group;
  const rng = new Rng(seed + 3);
  const hall = townHall(rng); hall.position.set(0, 0.6, -34); g.add(hall);
  const stop = busStop(); stop.position.set(-8.5, 0.16, -0.4); g.add(stop);
  bunting(g, rng, -9, 9, 3.6, -1.1, 0.5);
  return { ...base, group: g };
}

// ------------------------------------------------------------------ summer game court
// Court centred on the origin (long axis along x), bleachers behind it at z -7..-11
// facing +z, scoreboard above. state: { score: 'HOME 48 - GUEST 68', cheer: bool, wave: 0..1 }
export function trendcourt(seed = 6) {
  const rng = new Rng(seed);
  const g = new THREE.Group();
  g.add(sky('#5fb6ff', '#d9f0ff', '#e9f6ff', new THREE.Vector3(0.3, 0.6, 0.4)));
  g.add(mesh(new THREE.PlaneGeometry(400, 400), mat('#5cd13d', { roughness: 0.9 }), { rx: -Math.PI / 2, cast: false }));
  g.add(box(30, 0.08, 18, mat('#2f6fd6', { roughness: 0.6 }), { y: 0.04, z: 1, cast: false }));
  g.add(box(26, 0.02, 14, mat('#3d86ef', { roughness: 0.5 }), { y: 0.09, z: 1, cast: false }));
  const W = mat('#ffffff');
  const line = (w, d, x, z) => g.add(box(w, 0.02, d, W, { x, y: 0.11, z, cast: false }));
  line(26, 0.12, 0, -6); line(26, 0.12, 0, 8); line(0.12, 14, -13, 1); line(0.12, 14, 13, 1); line(0.12, 14, 0, 1);
  g.add(mesh(new THREE.RingGeometry(1.7, 1.85, 40), W, { y: 0.115, z: 1, rx: -Math.PI / 2, cast: false }));
  for (const sx of [-1, 1]) {
    g.add(box(5.5, 0.02, 4.8, mat('#ff9800'), { x: sx * 10.25, y: 0.1, z: 1, cast: false }));
    const hoop = new THREE.Group();
    hoop.add(box(0.2, 3.4, 0.2, mat('#37474f'), { base: true }));
    hoop.add(box(0.1, 1.1, 1.8, mat('#ffffff'), { x: -0.25 * sx * -1, y: 3.6 }));
    hoop.add(mesh(new THREE.TorusGeometry(0.28, 0.03, 8, 20), mat('#ff5722'), { x: sx * -0.6, y: 3.2, rx: Math.PI / 2 }));
    hoop.position.set(sx * 13.6, 0, 1); g.add(hoop);
  }
  // bleachers: 6 rows, each 0.5 high and 0.8 deep, front edge at z = -7
  const crowd = [];
  const seats = mat('#cfd8dc'), riser = mat('#90a4ae');
  for (let r = 0; r < 6; r++) {
    const z = -7.4 - r * 0.8, y = 0.5 + r * 0.5;
    g.add(box(22, 0.12, 0.8, seats, { y, z }));
    g.add(box(22, y, 0.8, riser, { base: true, z: z - 0.05 }));
  }
  const cols = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#ff7f50', '#1abc9c', '#ff5fa2', '#ffffff'];
  const skins = ['#f1c9a6', '#e3ae84', '#c98d62', '#8d5a3b', '#f6d5b8'];
  for (let r = 0; r < 6; r++) for (let i = 0; i < 18; i++) {
    if (rng.chance(0.18)) continue;
    const x = -10 + i * 1.18 + rng.float(-0.15, 0.15);
    if (Math.abs(x + 0.4) < 0.9 && r <= 2) continue; // aisle where the hero climbs/stands
    if (Math.abs(x - 3) < 0.8 && r === 0) continue;   // seat for the first kid who yells back
    const p = new THREE.Group();
    p.add(box(0.5, 0.7, 0.3, cols[(r * 7 + i) % cols.length], { y: 0.45 }));
    p.add(box(0.44, 0.44, 0.42, rng.pick(skins), { y: 1.05 }));
    p.add(box(0.46, 0.14, 0.44, rng.pick(['#2b1a10', '#5a3311', '#e0b050', '#111111']), { y: 1.32 }));
    const eye = basic('#111111');
    for (const sx of [-1, 1]) p.add(box(0.06, 0.09, 0.02, eye, { x: sx * 0.1, y: 1.08, z: 0.22, cast: false }));
    const arms = new THREE.Group();
    for (const sx of [-1, 1]) arms.add(box(0.14, 0.5, 0.16, cols[(r * 7 + i) % cols.length], { x: sx * 0.33, y: 0.5 }));
    p.add(arms);
    p.position.set(x, 0.56 + r * 0.5, -7.4 - r * 0.8);
    p.userData = { arms, phase: rng.float(0, 6.28), baseY: p.position.y };
    g.add(p); crowd.push(p);
  }
  // scoreboard
  const sbt = canvasTex(1024, 384);
  const score = mesh(new THREE.PlaneGeometry(6, 2.25), basic('#ffffff', { map: sbt.tex }), { y: 7.4, z: -12.4, cast: false });
  g.add(box(6.4, 2.6, 0.3, mat('#263238'), { y: 7.4, z: -12.6 }));
  g.add(box(0.25, 6.2, 0.25, mat('#263238'), { base: true, x: -2.5, z: -12.7 })); g.add(box(0.25, 6.2, 0.25, mat('#263238'), { base: true, x: 2.5, z: -12.7 }));
  g.add(score);
  let lastScore = null;
  const drawScore = (s) => {
    const c = sbt.g; c.fillStyle = '#10161f'; c.fillRect(0, 0, 1024, 384);
    const [home, guest] = String(s).split('-').map((v) => v.trim());
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `700 70px ${FONT}`; c.fillStyle = '#ffffff'; c.fillText('HOME', 256, 80); c.fillText('GUEST', 768, 80);
    c.font = `900 200px ${FONT}`; c.fillStyle = '#ffd21f'; c.fillText(home, 256, 240); c.fillStyle = '#ff5252'; c.fillText(guest, 768, 240);
    sbt.tex.needsUpdate = true;
  };
  // banner
  const ban = canvasTex(1024, 160);
  ban.g.fillStyle = '#ffd21f'; ban.g.fillRect(0, 0, 1024, 160); ban.g.fillStyle = '#e53935';
  ban.g.font = `900 110px ${FONT}`; ban.g.textAlign = 'center'; ban.g.textBaseline = 'middle'; ban.g.fillText('SUMMER GAME', 512, 84);
  ban.tex.needsUpdate = true;
  g.add(mesh(new THREE.PlaneGeometry(9, 1.4), new THREE.MeshStandardMaterial({ map: ban.tex, roughness: 0.8 }), { y: 4.4, z: -12.0 }));
  bunting(g, rng, -11, 11, 6.0, -6.6, 0.7);
  bunting(g, rng, -14, 14, 4.5, 9.6, 0.6);
  // backdrop houses and trees
  const walls = ['#ffd23f', '#b9a3e3', '#ffab6b', '#a7dfa0', '#9dd3ff', '#f8bbd0'];
  for (let i = -5; i <= 5; i++) {
    const h = new THREE.Group();
    h.add(box(4, 3.4, 4, mat(walls[(i + 6) % walls.length]), { base: true }));
    const rf = mesh(new THREE.ConeGeometry(3.1, 1.8, 4), mat(i % 2 ? '#e53935' : '#1e63d6', { flatShading: true }), { y: 4.3, ry: Math.PI / 4 });
    h.add(rf);
    h.position.set(i * 6.5 + rng.float(-0.6, 0.6), 0, -22 - rng.float(0, 3)); g.add(h);
    const t = new THREE.Group();
    t.add(mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.4, 6), mat('#8d5a32'), { y: 0.7 }));
    t.add(mesh(new THREE.IcosahedronGeometry(1.1, 0), mat('#43c74a', { flatShading: true }), { y: 2.1 }));
    t.position.set(i * 6.5 + 3.2, 0, -17.5); g.add(t);
  }
  const cw = basic('#ffffff', { fog: false }); cw.userData.skyTint = true;
  for (let i = 0; i < 7; i++) { const c = cloud(rng, { x: rng.float(-80, 80), y: rng.float(34, 55), z: rng.float(-150, -90), s: rng.float(1.2, 2) }); c.traverse((o) => { if (o.isMesh) o.material = cw; }); g.add(c); }
  const update = (t, st) => {
    const s = st.score ?? '48 - 68';
    if (s !== lastScore) { drawScore(s); lastScore = s; }
    const cheer = !!st.cheer, quiet = !!st.quiet;
    for (const p of crowd) {
      const u = p.userData;
      const amp = cheer ? 0.22 : quiet ? 0 : 0.04;
      const sp = cheer ? 9 : 3;
      p.position.y = u.baseY + Math.max(0, Math.sin(t * sp + u.phase)) * amp;
      u.arms.position.y = cheer ? 0.45 + Math.max(0, Math.sin(t * sp + u.phase)) * 0.15 : 0;
      u.arms.scale.y = cheer ? -1 : 1;           // arms flip up while cheering
      u.arms.position.y += cheer ? 1.0 : 0;
    }
  };
  update(0, {});
  return { group: g, update, light: { sun: '#fff8ec', sunI: 2.6, hemiSky: '#d8eeff', hemiGround: '#7fcf5a', hemiI: 1.35, dir: [12, 18, 14] }, fog: ['#e3f3ff', 60, 260] };
}

// ------------------------------------------------------------------ phone feed screen
// A full-frame phone UI plane facing +z at the origin (9 x 16 units, camera ~13.9 away
// with fov 60 fills it). state: { screen: 'views'|'comments'|'grid'|'post', views: number,
// t0: absolute time the counter starts rolling, t1: time it ends, from: start count }
const fmt = (n) => n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'K' : String(Math.round(n));
const NAMES = ['mia.jumps', 'bigtony_22', 'grandma_rosa', 'skatekid', 'lil.dee', 'mailman_mike', 'the_mayor', 'coach_k', 'pizzaqueen', 'zoey.zoom', 'dj_benny', 'noah4real'];

export function trendfeed(seed = 4) {
  const g = new THREE.Group();
  g.add(sky('#101018', '#101018', '#101018'));
  const scr = canvasTex(1080, 1920);
  const plane = mesh(new THREE.PlaneGeometry(9, 16), basic('#ffffff', { map: scr.tex, toneMapped: false }), { y: 0, cast: false, receive: false });
  g.add(plane);
  let key = null;
  const draw = (st, t) => {
    const c = scr.g, mode = st.screen || 'views';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if (mode === 'views' || mode === 'post') {
      const from = st.from ?? 0, to = st.views ?? 12;
      const u = st.t1 > st.t0 ? Math.min(1, Math.max(0, (t - st.t0) / (st.t1 - st.t0))) : 1;
      const n = from + (to - from) * (1 - Math.pow(1 - u, 3));
      const big = to >= 1e5;
      const grd = c.createLinearGradient(0, 0, 0, 1920);
      grd.addColorStop(0, big ? '#ff3d6e' : '#3a3f55'); grd.addColorStop(1, big ? '#7b2ff7' : '#1b1e2b');
      c.fillStyle = grd; c.fillRect(0, 0, 1080, 1920);
      // video card
      c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.roundRect(140, 300, 800, 900, 50); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(470, 640); c.lineTo(470, 860); c.lineTo(640, 750); c.closePath(); c.fill();
      c.font = `900 150px ${FONT}`; c.fillStyle = '#ff2b2b'; c.lineWidth = 16; c.strokeStyle = '#000000';
      c.strokeText('HUSS!', 540, 470); c.fillText('HUSS!', 540, 470);
      c.font = `900 ${big ? 230 : 200}px ${FONT}`; c.fillStyle = '#ffffff';
      c.strokeText(fmt(n), 540, 1400); c.fillText(fmt(n), 540, 1400);
      c.font = `700 90px ${FONT}`; c.fillText('views', 540, 1570);
      // side icons (generic, no brand)
      const heart = (x, y, s) => { c.beginPath(); c.moveTo(x, y + s * 0.3); c.bezierCurveTo(x, y - s * 0.3, x - s, y - s * 0.3, x - s, y + s * 0.15); c.bezierCurveTo(x - s, y + s * 0.6, x, y + s * 0.9, x, y + s); c.bezierCurveTo(x, y + s * 0.9, x + s, y + s * 0.6, x + s, y + s * 0.15); c.bezierCurveTo(x + s, y - s * 0.3, x, y - s * 0.3, x, y + s * 0.3); c.fill(); };
      c.fillStyle = big ? '#ff2b55' : '#ffffff'; heart(990, 1120, 46);
      c.font = `700 44px ${FONT}`; c.fillStyle = '#ffffff'; c.fillText(fmt(n * 0.18), 990, 1210);
      c.fillText('@huss.kid', 300, 1760);
    } else if (mode === 'comments') {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, 1080, 1920);
      c.fillStyle = '#111111'; c.font = `900 80px ${FONT}`; c.fillText(`${fmt(st.views ?? 40000)} comments`, 540, 150);
      const shown = Math.max(1, Math.min(NAMES.length, Math.floor(((t - (st.t0 ?? t)) / 0.22) + 1)));
      const cols = ['#ff5252', '#40c4ff', '#ffd740', '#69f0ae', '#e040fb', '#ff9100'];
      for (let i = 0; i < shown; i++) {
        const y = 300 + i * 135;
        c.fillStyle = cols[i % cols.length]; c.beginPath(); c.arc(110, y + 10, 46, 0, 7); c.fill();
        c.textAlign = 'left'; c.fillStyle = '#8a8a8a'; c.font = `600 40px ${FONT}`; c.fillText(NAMES[i], 185, y - 22);
        c.fillStyle = '#111111'; c.font = `900 60px ${FONT}`; c.fillText(i % 3 === 2 ? 'HUSS! HUSS! HUSS!!!' : 'HUSS! HUSS! HUSS!', 185, y + 34);
        c.textAlign = 'center';
      }
    } else if (mode === 'grid') {
      const cols = ['#ff8a65', '#4fc3f7', '#f06292', '#aed581', '#ffd54f', '#9575cd'];
      const shown = Math.floor(((t - (st.t0 ?? t)) / 0.12) + 1);
      c.fillStyle = '#000000'; c.fillRect(0, 0, 1080, 1920);
      for (let i = 0; i < 12; i++) {
        const x = (i % 3) * 360, y = Math.floor(i / 3) * 480;
        if (i >= shown) continue;
        c.fillStyle = cols[(i * 5) % cols.length]; c.fillRect(x + 6, y + 6, 348, 468);
        c.fillStyle = '#ffffff'; c.font = `900 96px ${FONT}`; c.lineWidth = 10; c.strokeStyle = '#000000';
        c.strokeText('HUSS', x + 180, y + 200); c.fillText('HUSS', x + 180, y + 200);
        c.font = `700 52px ${FONT}`; c.fillText(`▶ ${fmt(1.1e6 + i * 370000)}`, x + 180, y + 400);
      }
    }
    scr.tex.needsUpdate = true;
  };
  const update = (t, st) => {
    const k = JSON.stringify(st) + (st.screen === 'views' || st.screen === 'post' || st.screen === 'comments' || st.screen === 'grid' ? Math.floor(t * 30) : '');
    if (k !== key) { draw(st, t); key = k; }
  };
  update(0, {});
  return { group: g, update, light: { sun: '#ffffff', sunI: 0.5, hemiSky: '#ffffff', hemiGround: '#ffffff', hemiI: 1, dir: [0, 5, 10] }, fog: ['#101018', 200, 400], interior: true };
}
