// "Mindset." #2 – four mini-stories in the monochrome compilation format.
//   1. TALKER vs DOER            – speech bubbles pile up vs climbing to the star
//   2. COMPLAINER vs LEARNER     – the same rain grows the garden
//   3. PERFECTIONIST vs FINISHER – crumpled pages vs a finished book
//   4. NERVOUS vs BRAVE          – the plank over the gap
import { GRID, BEAT, LX, RX, GOLD, basic, add, boxG, stage, setSpot, spotlight, floorPlane, createMonoFilm, cheerUp, slump, sitFloor, climbStep, P, breathe, walk, clamp, lerp, smoothstep, easeOutBack, THREE } from './mono-kit.js';

const { sin, cos, PI, abs, max, min, floor } = Math;
export const DURATION = GRID.end;

function textPlane(text, { w = 1.3, h = 0.4, bg = '#ffffff', fg = '#111111', size = 64 } = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w);
  const g = c.getContext('2d');
  const r = c.height * 0.45;
  g.fillStyle = bg; g.beginPath(); g.moveTo(r, 0); g.arcTo(c.width, 0, c.width, c.height, r); g.arcTo(c.width, c.height, 0, c.height, r); g.arcTo(0, c.height, 0, 0, r); g.arcTo(0, 0, c.width, 0, r); g.fill();
  g.fillStyle = fg; g.font = `800 ${size}px Inter, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, c.width / 2, c.height / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
}
const writePose = (t) => P({ lean: 16, headNod: 26, armL: { raise: 14, fwd: 58, elbow: 75 }, armR: { raise: 14, fwd: 62 + sin(t * 14) * 4, elbow: 70 + sin(t * 11) * 6 } });
const talkPose = (t) => P({ ...breathe(t), headNod: -8 + sin(t * 5) * 4, armR: { raise: 30 + sin(t * 3.1) * 15, fwd: 40 + sin(t * 2.3) * 20, elbow: 70 + sin(t * 3.1) * 20 }, armL: { raise: 20, fwd: 30 + sin(t * 2.7) * 15, elbow: 60 } });

export function createMindset2(player) {
  const scenes = [
    // ---------------- 1. TALKER vs DOER ----------------
    {
      start: 0, header: 'STOP ANNOUNCING. START BUILDING.', labels: ['TALKER', 'DOER'],
      setup(g) {
        const spots = stage(g);
        const words = ['I WILL START…', 'NEXT MONDAY', 'SOON', 'TOMORROW', 'ONE DAY…'];
        const bubbles = words.map((w) => { const b = textPlane(w); g.add(b); return b; });
        const lad = new THREE.Group();
        for (const sx of [-0.32, 0.32]) add(lad, boxG(0.06, 4.0, 0.06), '#bdbdbd', { x: sx, y: 2.0 });
        for (let i = 0; i < 12; i++) add(lad, boxG(0.64, 0.05, 0.05), '#9a9a9a', { y: 0.3 + i * 0.32 });
        lad.position.set(RX + 0.2, 0, -0.25); g.add(lad);
        const star = add(g, new THREE.OctahedronGeometry(0.22, 0), basic(GOLD, { toneMapped: false }), { x: RX + 0.2, y: 4.35 });
        return { spots, bubbles, star };
      },
      update(st, lt, t, k) {
        const { L, R } = k;
        k.place(L, LX, 0, 0.1, 0.35);
        const popped = t >= GRID.hit1;
        L.applyPose(popped ? slump(t) : talkPose(t), t);
        let shown = 0;
        st.bubbles.forEach((b, i) => {
          const a = clamp((lt - 0.5 - i * 2 * BEAT) / 0.2, 0, 1);
          const gone = clamp((t - GRID.hit1 - i * 0.05) / 0.15, 0, 1);
          b.visible = a > 0 && gone < 1; if (a > 0) shown++;
          b.scale.setScalar(easeOutBack(a) * (1 - gone) + 0.001);
          b.position.set(LX + (i % 2 ? 0.25 : -0.25), 2.75 + i * 0.5, 0.3);
        });
        if (popped) for (let i = 0; i < 5; i++) k.ev.push({ t: GRID.hit1 + i * 0.05, type: 'smoke', pos: [LX + (i % 2 ? 0.25 : -0.25), 2.75 + i * 0.5, 0.3], seed: 10 + i });
        // doer climbs one rung per beat to the star
        const rung = clamp(floor((lt - 0.4) / BEAT), 0, 11);
        const u = clamp(((lt - 0.4) / BEAT) % 1, 0, 1);
        const top = t >= GRID.hit1;
        const y = top ? 11 * 0.32 * 0.86 : (rung + smoothstep(u)) * 0.32 * 0.86;
        k.place(R, RX + 0.2, min(y, 3.03), 0.05, PI);
        R.applyPose(top ? P({ ...breathe(t), armL: { raise: 160, elbow: 10 }, armR: { raise: 40, fwd: 40, elbow: 40 } }) : climbStep(u, rung % 2 ? 'L' : 'R'), t);
        st.star.rotation.y = t * 2; st.star.scale.setScalar(top ? 1.4 : 1);
        setSpot(st.spots[0], popped ? 0.3 : 0.8); setSpot(st.spots[1], top ? 1.4 : 0.8);
        k.ev.push({ t: GRID.hit1, type: 'sparkle', pos: [RX + 0.2, 4.3, 0.2], seed: 3 });
        k.cam([0, 2.3, 12.5], [0, 2.15, 0], 32);
        return [`PLANS  ${shown}`, `DONE  ${top ? 12 : rung}`];
      },
    },
    // ---------------- 2. COMPLAINER vs LEARNER ----------------
    {
      start: GRID.s2, header: 'THE SAME RAIN GROWS THE GARDEN.', labels: ['COMPLAINER', 'LEARNER'],
      setup(g) {
        const spots = stage(g);
        const cloudMat = basic('#3a3a3a');
        for (const cx of [LX, RX]) for (let i = 0; i < 6; i++) add(g, new THREE.SphereGeometry(0.32 + (i % 3) * 0.08, 14, 10), cloudMat, { x: cx - 0.7 + i * 0.28, y: 4.2 + (i % 2) * 0.12, z: -0.3, s: [1, 0.7, 0.6] });
        const N = 260, rain = new THREE.InstancedMesh(boxG(0.008, 0.3, 0.008), basic('#8a8a8a', { transparent: true, opacity: 0.6 }), N);
        rain.frustumCulled = false; g.add(rain);
        const drops = Array.from({ length: N }, (_, i) => ({ x: (i % 2 ? RX : LX) + ((i * 37) % 100) / 100 * 1.6 - 0.8, ph: ((i * 53) % 100) / 100, side: i % 2 }));
        add(g, new THREE.CylinderGeometry(0.22, 0.17, 0.3, 12), '#5a4a3a', { x: RX + 0.7, y: 0.15 });
        const stem = add(g, new THREE.CylinderGeometry(0.03, 0.04, 1, 6), '#cfcfcf', { x: RX + 0.7 });
        const leaves = [0, 1, 2, 3].map((i) => add(g, new THREE.SphereGeometry(0.11, 10, 6), '#bdbdbd', { s: [1.6, 0.4, 0.8] }));
        const flower = new THREE.Group();
        for (let i = 0; i < 6; i++) add(flower, new THREE.SphereGeometry(0.11, 10, 6), basic(GOLD, { toneMapped: false }), { x: cos(i / 6 * PI * 2) * 0.13, y: sin(i / 6 * PI * 2) * 0.13, s: [1, 1, 0.4] });
        add(flower, new THREE.SphereGeometry(0.08, 10, 6), '#ffffff');
        g.add(flower);
        return { spots, rain, drops, stem, leaves, flower };
      },
      update(st, lt, t, k) {
        const { L, R } = k;
        const bloom = smoothstep(clamp((t - GRID.hit2) / 0.4, 0, 1));
        const m4 = new THREE.Matrix4();
        st.drops.forEach((d, i) => {
          const stop = d.side === 1 && bloom > 0.5;
          const y = 4.0 - ((d.ph + t * 1.5) % 1) * 4.1;
          m4.makeScale(stop ? 0 : 1, stop ? 0 : 1, 1).setPosition(d.x, y, 0.2);
          st.rain.setMatrixAt(i, m4);
        });
        st.rain.instanceMatrix.needsUpdate = true;
        k.place(L, LX, 0, 0.1, 0.2);
        L.applyPose(lt < 1.2 ? slump(t) : sitFloor(t, 34), t);
        // learner plants, then the plant grows with every beat of rain
        const plant = lt < 1.6;
        k.place(R, RX - 0.05, 0, 0.1, 0.9);
        R.applyPose(plant ? P({ hipDrop: -0.45, lean: 40, headNod: 30, armL: { raise: 12, fwd: 80, elbow: 10 }, armR: { raise: 12, fwd: 75, elbow: 20 + sin(t * 10) * 15 }, legL: { fwd: 60, knee: 100 }, legR: { fwd: -10, knee: 90 } }) : t >= GRID.hit2 ? cheerUp(t - GRID.hit2) : P({ ...breathe(t), headNod: -20 + sin(t) * 4 }), t);
        const h = clamp((lt - 1.4) / (GRID.hit2 - GRID.s2 - 1.4), 0, 1) * 2.0 + 0.05;
        st.stem.scale.y = h; st.stem.position.y = 0.3 + h / 2;
        st.leaves.forEach((l, i) => { const y = 0.3 + (i + 1) * 0.42; l.visible = h > y - 0.25; l.position.set(RX + 0.7 + (i % 2 ? 0.13 : -0.13), y, 0); l.rotation.z = i % 2 ? -0.4 : 0.4; });
        st.flower.position.set(RX + 0.7, 0.3 + h + 0.05, 0.05);
        st.flower.scale.setScalar(0.001 + easeOutBack(bloom));
        setSpot(st.spots[0], 0.5); setSpot(st.spots[1], 0.6 + bloom * 0.9);
        k.ev.push({ t: GRID.hit2, type: 'sparkle', pos: [RX + 0.7, 2.4, 0.2], seed: 4 });
        k.cam([0, 2.1, 12.0], [0, 1.95, 0], 32);
        return [`COMPLAINTS  ${min(9, floor(lt / 0.75) + 1)}`, `GROWTH  ${floor(clamp((lt - 1.4) / (GRID.hit2 - GRID.s2 - 1.4), 0, 1) * 100)}%`];
      },
    },
    // ---------------- 3. PERFECTIONIST vs FINISHER ----------------
    {
      start: GRID.s3, header: 'DONE IS BETTER THAN PERFECT.', labels: ['PERFECTIONIST', 'FINISHER'],
      setup(g) {
        const spots = stage(g);
        for (const x of [LX + 0.55, RX - 0.55]) { add(g, boxG(1.1, 0.06, 0.6), '#3a3a3a', { x, y: 0.95, z: 0.1 }); for (const dx of [-0.48, 0.48]) add(g, boxG(0.05, 0.95, 0.5), '#2a2a2a', { x: x + dx, y: 0.475, z: 0.1 }); }
        const balls = Array.from({ length: 10 }, () => add(g, new THREE.IcosahedronGeometry(0.09, 0), '#e6e6e6'));
        const pages = Array.from({ length: 14 }, () => add(g, boxG(0.5, 0.035, 0.36), '#f2f2f2'));
        const book = add(g, boxG(0.56, 0.5, 0.42), basic(GOLD, { toneMapped: false }), { x: RX - 0.55, y: 1.23, z: 0.1 });
        const sheet = add(g, boxG(0.5, 0.01, 0.36), '#ffffff', { x: LX + 0.55, y: 0.99, z: 0.1 });
        return { spots, balls, pages, book, sheet };
      },
      update(st, lt, t, k) {
        const { L, R } = k;
        const per = 2 * BEAT, done = t >= GRID.hit3;
        const cyc = (lt % per) / per, n = floor(lt / per);
        // perfectionist writes, crumples, throws – every page
        k.place(L, LX - 0.15, 0, 0.0, PI / 2 - 0.3);
        const crumple = cyc > 0.65;
        L.applyPose(crumple ? P({ ...breathe(t), headNod: 10, armR: { raise: 60 + 90 * smoothstep((cyc - 0.65) / 0.35), fwd: -20, elbow: 30 }, armL: { raise: 20, fwd: 40, elbow: 60 } }) : writePose(t), t);
        st.sheet.visible = !crumple;
        st.balls.forEach((b, i) => {
          const land = i * per + per * 0.95;
          b.visible = lt > per * (i + 0.8);
          const u = clamp((lt - per * (i + 0.8)) / (per * 0.25), 0, 1);
          b.position.set(LX - 0.6 - u * 0.6 - (i % 3) * 0.18, lerp(1.6, 0.09, u * u) + (u >= 1 ? (i > 6 ? 0.15 : 0) : 0), 0.3 - (i % 2) * 0.25);
        });
        // finisher writes and the pile of finished pages grows every beat
        k.place(R, RX + 0.15, 0, 0.0, -PI / 2 + 0.3);
        R.applyPose(done ? P({ ...breathe(t), armL: { raise: 150, elbow: 20 }, armR: { raise: 150, elbow: 20 }, headNod: -16 }) : writePose(t + 1), t);
        const pg = min(14, floor(lt / BEAT));
        st.pages.forEach((p, i) => { p.visible = i < pg && !done; p.position.set(RX - 0.55 + (i % 2 ? 0.01 : -0.01), 1.0 + i * 0.036, 0.1); });
        st.book.visible = done;
        if (done) { const hp = k.hands(R); st.book.position.copy(hp).add(new THREE.Vector3(0, 0.25, 0)); st.book.rotation.z = sin(t * 3) * 0.1; }
        setSpot(st.spots[0], 0.7); setSpot(st.spots[1], done ? 1.5 : 0.8);
        k.ev.push({ t: GRID.hit3, type: 'confetti', pos: [RX, 2.6, 0.3], seed: 5 }, { t: GRID.hit3, type: 'sparkle', pos: [RX, 2.4, 0.3], seed: 6 });
        k.cam([0, 1.9, 11.0], [0, 1.6, 0], 32);
        return ['PAGES  0', `PAGES  ${pg}`];
      },
    },
    // ---------------- 4. NERVOUS vs BRAVE ----------------
    {
      start: GRID.s4, header: 'FEAR IS A LIAR.', labels: ['NERVOUS', 'BRAVE'],
      setup(g) {
        add(g, boxG(2.9, 3, 3), '#151515', { x: -1.95, y: -1.5, z: -0.5 });
        add(g, boxG(2.4, 3, 3), '#151515', { x: 2.3, y: -1.5, z: -0.5 });
        add(g, boxG(1.7, 0.06, 0.22), '#8a8a8a', { x: 0.25, y: -0.03, z: 0.4 });
        const sL = spotlight(LX); const sR = spotlight(RX + 0.25); g.add(sL, sR);
        const goal = add(g, new THREE.CircleGeometry(0.9, 32), basic(GOLD, { transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), { x: RX + 0.25, y: 0.01, rx: -PI / 2, z: 0.4 });
        return { sL, sR, goal };
      },
      update(st, lt, t, k) {
        const { L, R } = k;
        const arrive = smoothstep(clamp((t - GRID.hit4) / 0.4, 0, 1));
        // brave: walks up past nervous and across the plank, arriving on the hit
        const bx = lt < 0.6 ? -2.6 : lerp(-2.6, RX + 0.25, smoothstep(clamp((lt - 0.6) / (GRID.hit4 - GRID.s4 - 0.6), 0, 1)));
        k.place(R, bx, 0, 0.4, PI / 2);
        R.applyPose(t >= GRID.hit4 ? cheerUp(t - GRID.hit4) : addSteady(walk(lt, 0.9, 0.8), lt), t);
        // nervous: trembles at the edge, then takes the first step on the second hit
        const step = smoothstep(clamp((t - GRID.hit5) / 0.8, 0, 1));
        k.place(L, -0.75 + step * 0.45, 0, 0.0, t >= GRID.hit5 ? PI / 2 : 0.4);
        L.applyPose(t >= GRID.hit5 ? walk(t - GRID.hit5, 0.7, 0.6) : P({ headNod: 34, lean: -10, sway: sin(t * 22) * 2.5, armL: { raise: 25, fwd: 60, elbow: 120 }, armR: { raise: 25, fwd: 60, elbow: 120 }, legL: { knee: 18 }, legR: { knee: 18 } }), t);
        setSpot(st.sL, 0.7); setSpot(st.sR, 0.3 + arrive * 1.2);
        st.goal.material.opacity = arrive * 0.35;
        k.ev.push({ t: GRID.hit4, type: 'sparkle', pos: [RX + 0.6, 2.2, 0.4], seed: 7 });
        k.cam([0, 2.0, 11.5], [0, 1.6, 0], 32);
        const steps = floor(clamp((lt - 0.6) / (GRID.hit4 - GRID.s4 - 0.6), 0, 1) * 9);
        return [`STEPS  ${t >= GRID.hit5 ? 1 : 0}`, `STEPS  ${steps}`];
      },
    },
  ];
  return createMonoFilm(player, { scenes, flashes: [GRID.s3] });
}
// arms out for balance while crossing
function addSteady(p, t) { return { ...p, armL: { ...p.armL, raise: 70 + sin(t * 2) * 8 }, armR: { ...p.armR, raise: 70 - sin(t * 2) * 8 } }; }
