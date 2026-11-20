// "Mindset." #3 – four mini-stories in the monochrome compilation format.
//   1. SLEEPER vs EARLY RISER  – snoozing vs jumping jacks as the sun rises
//   2. COPIER vs CREATOR       – blank grey canvas vs a painting that lights up
//   3. EXCUSES vs ACTION       – a bar never lifted vs plates added every rep
//   4. DREAMER vs ACHIEVER     – staring at the star vs climbing to the flag
import { GRID, BEAT, LX, RX, GOLD, basic, add, boxG, stage, setSpot, spotlight, floorPlane, createMonoFilm, cheerUp, slump, sitFloor, climbStep, P, breathe, walk, clamp, lerp, smoothstep, easeOutBack, THREE } from './mono-kit.js';

const { sin, cos, PI, abs, max, min, floor } = Math;
export const DURATION = GRID.end;

function zzz() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const g = c.getContext('2d'); g.fillStyle = '#cfcfcf'; g.font = '900 72px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('z', 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false });
}
const paintPose = (t, k = 1) => P({ ...breathe(t), headNod: 6, armR: { raise: 30, fwd: 70 + sin(t * 7) * 15 * k, elbow: 40 + sin(t * 9) * 20 * k }, armL: { raise: 15, fwd: 20, elbow: 60 } });

export function createMindset3(player) {
  const scenes = [
    // ---------------- 1. SLEEPER vs EARLY RISER ----------------
    {
      start: 0, header: 'WIN THE MORNING. WIN THE DAY.', labels: ['SLEEPER', 'EARLY RISER'],
      setup(g) {
        const spots = stage(g);
        const sun = add(g, new THREE.CircleGeometry(0.75, 40), basic('#ff8a3d', { toneMapped: false }), { x: RX, y: 0, z: -3 });
        add(g, boxG(1.9, 0.18, 0.8), '#3a3a3a', { x: LX + 0.1, y: 0.09, z: 0.1 });
        const blanket = add(g, boxG(1.1, 0.12, 0.84), '#555555', { x: LX + 0.35, y: 0.3, z: 0.1 });
        const zm = zzz();
        const zs = [0, 1, 2].map(() => add(g, new THREE.PlaneGeometry(0.3, 0.3), zm));
        return { spots, sun, blanket, zs };
      },
      update(st, lt, t, k) {
        const { L, R } = k;
        // sleeper lies on his side on the mattress
        k.place(L, LX - 0.75, 0.37, 0.1, 0);
        L.root.rotation.set(0, 0, -PI / 2);
        L.applyPose(P({ headTurn: 0, headNod: 10, armL: { raise: 10, fwd: 20 }, armR: { raise: 10, fwd: 30, elbow: 40 }, legL: { fwd: 25, knee: 40 }, legR: { fwd: 20, knee: 35 }, bodyY: sin(t * 1.6) * 0.01 }), t);
        st.zs.forEach((z, i) => { const u = ((t * 0.5 + i / 3) % 1); z.position.set(LX - 0.9 + u * 0.4, 0.9 + u * 1.2, 0.3); z.scale.setScalar(0.6 + u); z.material.opacity = sin(u * PI); });
        // riser: jumping jacks on every beat; the sun comes up on the hit
        const up = t >= GRID.hit1;
        const ph = (lt / BEAT) % 1, j = sin(ph * PI);
        k.place(R, RX, 0, 0.1, 0);
        R.applyPose(up ? cheerUp(t - GRID.hit1) : P({ bodyY: j * 0.12, armL: { raise: 10 + 150 * j, elbow: 10 }, armR: { raise: 10 + 150 * j, elbow: 10 }, legL: { out: 3 + 16 * j }, legR: { out: 3 + 16 * j }, headNod: -4 }), t);
        const rise = smoothstep(clamp((t - GRID.hit1 + 1.5) / 2.0, 0, 1));
        st.sun.position.y = lerp(-0.8, 2.6, rise);
        setSpot(st.spots[0], 0.35); setSpot(st.spots[1], 0.8 + (up ? 0.6 : 0));
        k.ev.push({ t: GRID.hit1, type: 'sparkle', pos: [RX, 2.4, 0.3], seed: 1 });
        k.cam([0, 2.0, 11.5], [0, 1.8, 0], 32);
        return ['REPS  0', `REPS  ${up ? 'DONE' : floor(lt / BEAT)}`];
      },
    },
    // ---------------- 2. COPIER vs CREATOR ----------------
    {
      start: GRID.s2, header: 'BE THE ORIGINAL.', labels: ['COPIER', 'CREATOR'],
      setup(g) {
        const spots = stage(g);
        const easel = (x) => {
          const e = new THREE.Group();
          for (const dx of [-0.35, 0.35]) add(e, boxG(0.05, 2.1, 0.05), '#6a6a6a', { x: dx, y: 1.05, rz: dx > 0 ? -0.12 : 0.12 });
          add(e, boxG(1.0, 0.75, 0.04), '#e8e8e8', { y: 1.55, z: 0.05 });
          e.position.set(x, 0, 0); g.add(e); return e;
        };
        easel(LX + 0.6); easel(RX - 0.6);
        const cols = ['#ff6b6b', '#ffd166', '#06d6a0', '#4dabf7', '#b388ff', '#ff9f43', '#2ec4b6', '#f72585'];
        const patchesR = cols.map((c, i) => add(g, new THREE.CircleGeometry(0.11 + (i % 3) * 0.03, 18), basic(c, { toneMapped: false }), { x: RX - 0.6 - 0.35 + (i % 4) * 0.23, y: 1.38 + floor(i / 4) * 0.3, z: 0.08 }));
        const patchesL = [0, 1, 2].map((i) => add(g, new THREE.CircleGeometry(0.1, 18), '#9a9a9a', { x: LX + 0.6 - 0.25 + i * 0.25, y: 1.5, z: 0.08 }));
        const frame = add(g, boxG(1.12, 0.87, 0.02), basic(GOLD, { toneMapped: false }), { x: RX - 0.6, y: 1.55, z: 0.02 });
        return { spots, patchesR, patchesL, frame };
      },
      update(st, lt, t, k) {
        const { L, R } = k;
        const lit = t >= GRID.hit2;
        k.place(R, RX + 0.15, 0, 0.35, -PI / 2 - 0.4);
        R.applyPose(lit ? cheerUp(t - GRID.hit2) : paintPose(t), t);
        k.place(L, LX - 0.15, 0, 0.35, PI / 2 + 0.4);
        // copier keeps looking over at the creator's canvas
        const look = 0.5 + 0.5 * sin(t * 2.2);
        const lp = paintPose(t, 0.3); lp.headTurn = 60 * look; lp.headNod = 0;
        L.applyPose(lit ? slump(t) : lp, t);
        const nR = min(8, floor(lt / BEAT));
        st.patchesR.forEach((p, i) => { p.visible = i < nR; p.scale.setScalar(easeOutBack(clamp((lt - i * BEAT) / 0.25, 0, 1)) + 0.001); });
        st.patchesL.forEach((p, i) => { p.visible = lt > 2.5 + i * 1.8; });
        st.frame.visible = lit;
        setSpot(st.spots[0], lit ? 0.35 : 0.7); setSpot(st.spots[1], lit ? 1.5 : 0.8);
        k.ev.push({ t: GRID.hit2, type: 'sparkle', pos: [RX - 0.6, 1.6, 0.3], seed: 2 }, { t: GRID.hit2, type: 'confetti', pos: [RX - 0.6, 2.4, 0.3], seed: 3 });
        k.cam([0, 1.9, 11.0], [0, 1.6, 0], 32);
        return ['IDEAS  0', `IDEAS  ${nR}`];
      },
    },
    // ---------------- 3. EXCUSES vs ACTION ----------------
    {
      start: GRID.s3, header: 'STRENGTH IS BUILT, NOT GIVEN.', labels: ['EXCUSES', 'ACTION'],
      setup(g) {
        const spots = stage(g);
        const bar = (x) => { const b = new THREE.Group(); add(b, new THREE.CylinderGeometry(0.025, 0.025, 1.7, 8), '#cfcfcf', { rz: PI / 2 }); b.position.set(x, 0.2, 0.3); g.add(b); return b; };
        const bL = bar(LX), bR = bar(RX);
        for (const sx of [-0.6, 0.6]) add(bL, new THREE.CylinderGeometry(0.16, 0.16, 0.06, 20), '#5a5a5a', { x: sx, rz: PI / 2 });
        const plates = [];
        for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) plates.push(add(bR, new THREE.CylinderGeometry(0.2 + i * 0.02, 0.2 + i * 0.02, 0.06, 22), i === 4 ? basic(GOLD, { toneMapped: false }) : '#6a6a6a', { x: sx * (0.55 + i * 0.07), rz: PI / 2 }));
        return { spots, bL, bR, plates };
      },
      update(st, lt, t, k) {
        const { L, R } = k;
        const per = 2 * BEAT, big = t >= GRID.hit3;
        // action: lift cycle (grip → stand → press → down); a plate pair added each rep
        const rep = floor(lt / per), u = (lt % per) / per;
        const grip = sin(clamp(u < 0.2 ? 1 - u / 0.2 : u > 0.8 ? (u - 0.8) / 0.2 : 0, 0, 1) * PI / 2);
        const press = smoothstep(clamp((u - 0.35) / 0.2, 0, 1)) * (1 - smoothstep(clamp((u - 0.65) / 0.15, 0, 1)));
        const hold = big ? 1 : press;
        k.place(R, RX, 0, 0.0, 0);
        R.applyPose(P({ hipDrop: -0.42 * (big ? 0 : grip), lean: 30 * (big ? 0 : grip), headNod: 10 * grip - 8 * hold, armL: { raise: lerp(lerp(12, 15, grip), 165, hold), fwd: 10, elbow: 10 }, armR: { raise: lerp(lerp(12, 15, grip), 165, hold), fwd: 10, elbow: 10 }, legL: { fwd: 40 * grip, knee: 80 * grip, out: 10 }, legR: { fwd: 40 * grip, knee: 80 * grip, out: 10 } }), t);
        const hp = k.hands(R); st.bR.position.set(RX, max(0.2, hp.y), 0.3);
        const nPlates = big ? 10 : min(8, (rep + 1) * 2);
        st.plates.forEach((p, i) => { p.visible = i < nPlates; });
        // excuses: tries once, gives up, sits next to the bar
        k.place(L, LX, 0, 0.0, 0);
        const tryU = clamp((lt - 0.8) / 1.6, 0, 1);
        if (lt < 0.8) L.applyPose(slump(t), t);
        else if (tryU < 1) { L.applyPose(P({ hipDrop: -0.42, lean: 32, headNod: 10, sway: sin(t * 25) * 2 * tryU, armL: { raise: 15, elbow: 10 }, armR: { raise: 15, elbow: 10 }, legL: { fwd: 40, knee: 80, out: 10 }, legR: { fwd: 40, knee: 80, out: 10 } }), t); }
        else { k.place(L, LX - 0.4, 0, 0.0, 0.3); L.applyPose(sitFloor(t, 30), t); }
        st.bL.position.set(LX, 0.2 + (tryU > 0 && tryU < 1 ? abs(sin(t * 25)) * 0.02 : 0), 0.3);
        setSpot(st.spots[0], 0.55); setSpot(st.spots[1], big ? 1.5 : 0.85);
        k.ev.push({ t: GRID.hit3, type: 'sparkle', pos: [RX, 2.9, 0.3], seed: 4 }, { t: GRID.hit3, type: 'dust', pos: [RX, 0.05, 0.3], seed: 5 });
        k.cam([0, 2.0, 11.5], [0, 1.8, 0], 32);
        return ['KG  0', `KG  ${big ? 100 : nPlates * 10}`];
      },
    },
    // ---------------- 4. DREAMER vs ACHIEVER ----------------
    {
      start: GRID.s4, header: "DREAMS DON'T WORK UNLESS YOU DO.", labels: ['DREAMER', 'ACHIEVER'],
      setup(g) {
        g.add(floorPlane());
        const sL = spotlight(LX, 6.3, 6.5, 1.3); g.add(sL);
        const N = 9;
        for (let i = 0; i < N; i++) add(g, boxG(0.42, 0.24 * (i + 1), 0.9), i % 2 ? '#2e2e2e' : '#262626', { x: -0.1 + i * 0.3, y: 0.12 * (i + 1), z: -0.1 });
        const flag = new THREE.Group();
        add(flag, boxG(0.04, 1.0, 0.04), '#bdbdbd', { y: 0.5 });
        const cloth = add(flag, boxG(0.5, 0.32, 0.01), '#777777', { x: 0.27, y: 0.82 });
        flag.position.set(-0.1 + (N - 1) * 0.3 + 0.05, 0.24 * N, -0.1); g.add(flag);
        const star = add(g, new THREE.OctahedronGeometry(0.16, 0), basic(GOLD, { toneMapped: false }), { x: LX, y: 3.3 });
        const dots = [0, 1, 2].map((i) => add(g, new THREE.CircleGeometry(0.05 + i * 0.03, 12), '#bdbdbd', { x: LX + 0.15, y: 2.35 + i * 0.28, z: 0.2 }));
        return { sL, cloth, star, dots, N };
      },
      update(st, lt, t, k) {
        const { L, R } = k;
        const top = t >= GRID.hit4, go = t >= GRID.hit5;
        // achiever climbs one step per beat to the flag
        const i = clamp(floor((lt - 0.3) / BEAT), -1, st.N - 1), u = clamp(((lt - 0.3) / BEAT) % 1, 0, 1);
        const sx = (n) => -0.1 + n * 0.3, sy = (n) => 0.24 * (n + 1);
        let x, y;
        if (top || i >= st.N - 1) { x = sx(st.N - 1); y = sy(st.N - 1); }
        else if (i < 0) { x = sx(0) - 0.6; y = 0; }
        else { const x0 = i === 0 ? sx(0) - 0.6 : sx(i - 1), y0 = i === 0 ? 0 : sy(i - 1); x = lerp(x0, sx(i), smoothstep(u)); y = lerp(y0, sy(i), smoothstep(u)) + sin(u * PI) * 0.08; }
        k.place(R, x, y, -0.1, PI / 2);
        R.applyPose(top ? (lt % 1 > 0 && t < GRID.hit4 + 0.6 ? P({ ...breathe(t), armR: { raise: 150, elbow: 20 } }) : cheerUp(t - GRID.hit4)) : climbStep(u, i % 2 ? 'L' : 'R'), t);
        st.cloth.material.color.set(top ? GOLD : '#777777');
        st.cloth.rotation.y = sin(t * 5) * 0.25;
        // dreamer sits gazing at the star; on the last hit he stands and walks to the stairs
        k.place(L, go ? LX + (t - GRID.hit5) * 0.7 : LX, 0, 0.2, go ? PI / 2 : 0.3);
        L.applyPose(go ? walk(t - GRID.hit5, 1.0, 0.8) : sitFloor(t, -30), t);
        st.star.rotation.y = t * 1.5; st.star.visible = !go;
        st.dots.forEach((d) => { d.visible = !go; });
        setSpot(st.sL, 0.7);
        k.ev.push({ t: GRID.hit4, type: 'confetti', pos: [sx(st.N - 1), sy(st.N - 1) + 1.2, 0.2], seed: 6 }, { t: GRID.hit5, type: 'sparkle', pos: [LX, 1.6, 0.3], seed: 7 });
        k.cam([0, 2.6, 12.5], [0.2, 2.5, 0], 32);
        return [`STEPS  ${go ? 1 : 0}`, `STEPS  ${top ? st.N : max(0, i + 1)}`];
      },
    },
  ];
  return createMonoFilm(player, { scenes, flashes: [GRID.s3] });
}
