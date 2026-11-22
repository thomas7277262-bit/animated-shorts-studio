// "Never Sell" — full-length vertical (9:16) version in the style of the 90-second Short:
// cream paper, green chalkboards, peach-headed stick figures with lip-sync, red stamps,
// and big word-by-word captions. Timed to the ElevenLabs narration beats.
import { C, text, line, path, rect, circle, at, pop, prog, easeOut, easeInOut, lerp, hash, scribbleCircle, arrow, g } from '../../engine.js';
import { stick, money, board, chartLine, bubble, stamp, ground, cloud, bolt } from '../../kit.js';
import { certificate, priceTag, briefcase, padlock, key, domino, newspaper, tv, goldBar, dollar, chain, thermometer, barrel, car, dial, coin, photoFrame, letter, ledger, factory } from '../../kit2.js';

export const LAYOUT = { w: 1080, h: 1920, captions: true, headerY: 168, camY: 0.42 };
export const OFFSET = 0;
const W = 1080, GY = 1250;

const NARRATOR = { glasses: true, tie: C.green, hair: 'messy', seed: 3, s: 1.2 };
const WALT = { sideburns: true, tie: C.blue, tieW: 14, hair: 'neat', hairColor: '#3b2a1e', seed: 5, s: 1.2 };
const WALT_OLD = { ...WALT, hairColor: '#b5b0a6' };
const RUTH = { hair: 'bun', hairColor: '#9a968e', seed: 9 };
const BOSS = { hat: 'top', mustache: true, tie: C.red, hair: 'neat', seed: 7, s: 1.1 };

const SPX_YE = { 1973: 97.55, 1974: 68.56, 1975: 90.19, 1976: 107.46, 1977: 95.10, 1978: 96.11, 1979: 107.94, 1980: 135.76, 1981: 122.55, 1982: 140.64, 1983: 164.93, 1984: 167.24, 1985: 211.28 };
const TR = { 1973: -14.66, 1974: -26.47, 1975: 37.20, 1976: 23.84, 1977: -7.18, 1978: 6.56, 1979: 18.44, 1980: 32.42, 1981: -4.91, 1982: 21.55, 1983: 22.56, 1984: 6.27, 1985: 31.73 };
const CPI = { 1973: 8.7, 1974: 12.3, 1975: 6.9, 1976: 4.9, 1977: 6.7, 1978: 9.0, 1979: 13.3, 1980: 12.5, 1981: 8.9, 1982: 3.8, 1983: 3.8, 1984: 3.9, 1985: 3.8 };
const PEAK = 120.24, YE1972 = 118.05;
const CRASH = [120.24, 116.0, 111.7, 111.5, 106.97, 104.95, 104.26, 108.22, 104.25, 108.43, 108.29, 95.96, 97.55, 96.57, 96.22, 93.98, 90.31, 87.28, 86.0, 79.31, 72.15, 63.54, 62.28];
function recoverySeries() {
  const price = [[1973.03, 100]], nom = [[1973.03, 100]], real = [[1973.03, 100]];
  let n = YE1972 / PEAK * 100, r = n;
  for (let y = 1973; y <= 1985; y++) { n *= 1 + TR[y] / 100; r *= (1 + TR[y] / 100) / (1 + CPI[y] / 100); price.push([y + 1, SPX_YE[y] / PEAK * 100]); nom.push([y + 1, n]); real.push([y + 1, r]); }
  return { price, nom, real };
}
const note = (s, y = 1222) => text(s, W / 2, y, { size: 22, font: 'Patrick Hand', weight: 'normal', color: '#7a6a4a', wobble: false, maxW: 1000 });

export function build(words, beats) {
  const B = Object.fromEntries(beats.map((b) => [b.id, b]));
  const ts = (id) => B[id].s, te = (id) => B[id].e;
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const SPOKEN = { '90': 'ninety', '15': 'fifteen', '19': 'nineteen', '12': 'twelve', '48': 'forty-eight', '24': 'twenty-four', '38': 'thirty-eight' };
  const wt = (id, w, nth = 1) => {
    const b = B[id]; let n = 0;
    for (const x of words) { if (x.s < b.s - 0.25 || x.s > b.e + 0.25) continue; if (norm(x.w).startsWith(norm(w)) && ++n === nth) return x.s; }
    const needle = (SPOKEN[w] || w).toLowerCase(); let i = -1;
    for (let k = 0; k < nth; k++) { i = b.text.toLowerCase().indexOf(needle, i + 1); if (i < 0) break; }
    return i < 0 ? b.s : b.s + (b.e - b.s) * (i / b.text.length);
  };
  const DURATION = Math.ceil((te('B46') + 6.2) * 10) / 10;
  const sfx = []; const cue = (t, name, gain = 0.3) => sfx.push({ t, name, gain });
  const shakes = []; const flashes = [];
  const scenes = [];
  const S = (start, label, draw, tr = 'slide') => scenes.push({ start, label, draw, tr });

  // ================= COLD OPEN =================
  const L0 = 'THE CRASH NOBODY REMEMBERS';
  S(0, L0, (lt, t) => {
    const lockT = wt('B01', 'never'), keyT = te('B01') - 0.6;
    briefcase(540, 820, 1.35, { open: 1 - prog(t, lockT - 0.9, 0.5), locked: t > lockT, shackle: 1 - prog(t, lockT, 0.25) });
    if (t < lockT) { const k = easeOut(prog(t, 0.2, lockT - 0.4)); padlock(lerp(1000, 540, k), lerp(380, 739, k), 1.08); }
    if (t > keyT) { const k = prog(t, keyT, 0.9); key(540 + k * 520, 690 - Math.sin(k * Math.PI) * 260 - k * 100, 0.9, k * 6); }
    text('1972', 540, 360, { size: 90, color: '#9a968e' });
    ground(GY);
  }, 'cut');
  cue(wt('B01', 'never'), 'stomp', 0.3);

  S(ts('B02') - 0.3, L0, (lt, t) => {
    const drain = easeInOut(prog(t, wt('B02', '90') - 0.2, 1.4));
    certificate(540, 760, 2.2, { fill: 1 - 0.9 * drain, name: t > wt('B02', 'polaroid') - 0.1 ? 'Polaroid' : '' });
    stamp(760, 470, '-90%', pop(t, wt('B02', '90') + 0.6, 0.3) * (1.5 - 0.5 * prog(t, wt('B02', '90') + 0.6, 0.3)), -0.15);
    if (t > wt('B02', 'penny') - 0.1 && t < wt('B02', 'polaroid')) at(540, 1080, pop(t, wt('B02', 'penny') - 0.1), () => { circle(0, 0, 70, { fill: '#c98a4b', w: 5 }); text('1¢', 0, 2, { size: 52 }); line(-95, -95, 95, 95, { w: 10, color: C.red }); });
    text('1974', 540, 360, { size: 90, color: '#9a968e' });
    ground(GY);
  }, 'cut');
  cue(wt('B02', '90') + 0.6, 'stomp', 0.45); shakes.push({ t: wt('B02', '90') + 0.6, amp: 14, dur: 0.5 });

  S(ts('B03') - 0.2, L0, (lt, t) => {
    ground(GY);
    stick(400, GY, { ...WALT, s: 1.5, pose: 'stand', face: 'smile', look: 0.4 });
    at(760, 560, pop(t, wt('B03', 'walt') + 0.1), () => { bubble(-230, -90, 460, 170, -200, 140); text('WALT', 0, -30, { size: 84 }); text('pension fund manager', 0, 36, { size: 34, font: 'Patrick Hand', weight: 'normal' }); });
    if (t > wt('B03', 'real')) at(760, 860, pop(t, wt('B03', 'real')), () => text('(fictional composite)', 0, 0, { size: 40, color: C.red }), -0.05);
  });

  S(ts('B04') - 0.2, L0, (lt, t) => {
    ledger(540, 560, 0.9, [['R. Kowalski', '31 yrs'], ['M. Alvarez', '27 yrs'], ['D. Brooks', '33 yrs'], ['J. Novak', '29 yrs'], ['E. Washington', '35 yrs'], ['H. Lindqvist', '30 yrs'], ['P. O\'Neill', '26 yrs']], prog(t, ts('B04'), 2.2));
    ['IBM', 'Coca-Cola', 'Polaroid'].forEach((n, i) => certificate(220 + i * 320, 1020, 0.78 * pop(t, wt('B04', 'admired') + i * 0.25), { name: n, rot: (i - 1) * 0.05 }));
    if (t > wt('B04', 'admired') - 0.4) arrow(540, 820, 540, 900, { p: prog(t, wt('B04', 'admired') - 0.4, 0.4), color: C.ink, head: 26 });
    if (t > wt('B04', 'never')) stamp(800, 340, 'NEVER SELL', pop(t, wt('B04', 'never'), 0.3) * 0.7, -0.1);
  });
  cue(wt('B04', 'never'), 'stomp', 0.3);

  S(ts('B05') - 0.2, L0, (lt, t) => {
    ground(GY);
    briefcase(420, 960, 1.0, { locked: true });
    const glow = prog(t, wt('B05', 'number') - 0.2, 0.5);
    priceTag(760, 700, 1.3, '?', { glow: glow > 0 ? 0.9 + 0.1 * Math.sin(t * 4) : 0, rot: 0.2 + Math.sin(t * 2) * 0.05 });
    line(560, 800, 660, 740, { w: 4, color: '#9a968e' });
    const tt = te('B05') + 0.1;
    if (t > tt) {
      g().save(); g().fillStyle = `rgba(251,247,238,${0.95 * prog(t, tt, 0.4)})`; g().fillRect(0, 0, 1080, 1920); g().restore();
      at(540, 640, pop(t, tt, 0.5), () => { text('NEVER', 0, -90, { size: 190 }); text('SELL', 0, 90, { size: 190 }); });
      path([[260, 840], [540, 830], [820, 842]], { w: 10, color: C.red, p: prog(t, tt + 0.4, 0.5) });
      text('The Nifty Fifty and', 540, 930, { size: 56, font: 'Patrick Hand', weight: 'normal', alpha: prog(t, tt + 0.6, 0.5) });
      text('the Crash of 1973', 540, 1000, { size: 56, font: 'Patrick Hand', weight: 'normal', alpha: prog(t, tt + 0.6, 0.5) });
    }
  });
  cue(te('B05') + 0.1, 'thud', 0.5);

  // ================= PART 1 =================
  const L1 = 'PART 1 · ONE DECISION';
  S(ts('B06') - 0.5, L1, (lt, t) => {
    const k = easeOut(prog(t, ts('B06') + 1.0, Math.max(1, wt('B06', 'thousand') - ts('B06') - 0.6)));
    const b = board(70, 260, 940, 560);
    text('DOW JONES', 540, b.y + 50, { size: 54, color: C.chalk });
    text('INDUSTRIAL AVERAGE', 540, b.y + 110, { size: 44, color: C.chalk });
    const v = lerp(984.12, 1003.16, k);
    text(v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 540, b.y + 270, { size: 150, color: k >= 1 ? C.yellow : C.chalk, wobble: false });
    text('NOV 14, 1972', 540, b.y + 410, { size: 44, color: C.chalk });
    ground(GY);
    for (let i = 0; i < 7; i++) {
      const jump = k >= 1 ? Math.max(0, Math.sin(lt * 7 + i * 1.3)) * 26 : 0;
      stick(110 + i * 143, GY - jump, { s: 0.62, pose: k >= 1 ? 'cheer' : 'stand', face: k >= 1 ? 'grin' : 'smile', seed: 30 + i, hat: i === 3 ? null : null, wave: k >= 1 ? 1 : 0 });
    }
    if (k >= 1) for (let i = 0; i < 18; i++) money(hash(i, 1) * 1080, -80 + ((lt * (240 + hash(i, 2) * 160) + hash(i, 3) * 1300) % 1300), 0.8, Math.sin(lt * 3 + i) * 0.6);
    note('Source: S&P Dow Jones Indices', 845);
  }, 'slide');
  cue(wt('B06', 'thousand'), 'party', 0.25);

  S(ts('B07') - 0.3, L1, (lt, t) => {
    ground(GY);
    rect(90, 300, 380, 80, { fill: '#fff', w: 5 }); text('PENSION FUND', 280, 340, { size: 44 });
    stick(270, GY, { ...WALT, s: 1.35, pose: 'pointL', flip: true, face: 'smile' });
    const zoom = easeInOut(prog(t, wt('B07', 'ruth') - 0.3, 0.9));
    at(lerp(760, 720, zoom), lerp(800, 720, zoom), lerp(1.0, 1.5, zoom), () => photoFrame(0, 0, 1, (cx, cy) => stick(cx, cy + 40, { ...RUTH, s: 0.42, face: 'smile', bob: 0 })));
    if (zoom > 0.6) text('Ruth — 31 years on the line', 720, 1060, { size: 40, font: 'Patrick Hand', weight: 'normal', alpha: prog(t, wt('B07', 'ruth') + 0.6, 0.4) });
    if (zoom > 0.6) text('(also fictional)', 720, 1110, { size: 30, font: 'Patrick Hand', weight: 'normal', color: '#9a968e', alpha: prog(t, wt('B07', 'ruth') + 0.9, 0.4) });
  });

  S(ts('B08') - 0.3, L1, (lt, t) => {
    const b = board(70, 260, 940, 520);
    text('1960s "go-go" stocks', b.x + 20, b.y + 34, { size: 46, align: 'left', color: C.chalk });
    const vals = []; for (let i = 0; i <= 40; i++) { const f = i / 40; vals.push(f < 0.55 ? 0.15 + f * 1.4 + Math.sin(i * 1.7) * 0.05 : 0.92 - (f - 0.55) * 1.7 + Math.sin(i * 2.1) * 0.04); }
    chartLine({ x: b.x + 10, y: b.y + 80, w: b.w - 20, h: b.h - 110 }, vals, { lo: 0, hi: 1, p: prog(t, ts('B08') + 0.2, 3.2), color: '#ff7b7b', w: 8 });
    text('crash of 1969–70', b.x + b.w - 20, b.y + b.h - 30, { size: 34, align: 'right', color: C.chalk, font: 'Patrick Hand', weight: 'normal', alpha: prog(t, ts('B08') + 2.4, 0.5) });
    const ot = wt('B08', 'opposite');
    ['BIG', 'FAMOUS', 'DEPENDABLE'].forEach((w, i) => certificate(200 + i * 340, 1030, 0.82 * pop(t, ot + 0.5 + i * 0.5), { name: w, rot: (i - 1) * 0.05 }));
    ground(GY + 40);
  });

  S(ts('B09') - 0.3, L1, (lt, t) => {
    [['Bank trust', 'departments', 'bank'], ['Pension', 'funds', 'pension'], ['Mutual', 'funds', 'mutual']].forEach(([a, b2, w], i) => {
      const y = 380 + i * 230, s = pop(t, wt('B09', w));
      at(300, y, s, () => { rect(-200, -80, 400, 160, { fill: '#fff', w: 5, seed: 40 + i }); text(a, 0, -24, { size: 46 }); text(b2, 0, 34, { size: 46 }); });
      if (s > 0.9) arrow(510, y, 760, 820, { p: prog(t, wt('B09', w) + 0.3, 0.6), color: C.ink, head: 26 });
    });
    const ct = wt('B09', 'same');
    for (let i = 0; i < 5; i++) certificate(820 + (i % 2) * 30, 880 + i * 40, 0.55 * pop(t, ct + i * 0.12), { rot: (i - 2) * 0.06 });
    for (let i = 0; i < 10; i++) money(760 + hash(i, 5) * 260, 300 + ((lt * 200 + hash(i, 6) * 600) % 600), 0.6, Math.sin(lt * 2 + i) * 0.5);
    if (t > ct) text('the same few dozen names', 540, 1190, { size: 46, alpha: prog(t, ct + 0.5, 0.4) });
  });

  S(ts('B10') - 0.3, L1, (lt, t) => {
    text('No official list', 540, 320, { size: 60, color: '#9a968e', alpha: prog(t, ts('B10'), 0.5) });
    const names = [['IBM', 'ibm'], ['Coca-Cola', 'coca'], ["McDonald's", 'mcdonald'], ['Disney', 'disney'], ['Xerox', 'xerox'], ['Avon', 'avon'], ['Philip Morris', 'philip']];
    const pol = wt('B10', 'polaroid');
    const shrink = easeInOut(prog(t, pol - 0.2, 0.6));
    names.forEach(([n, w], i) => {
      const s = pop(t, wt('B10', w) - 0.05);
      const x = 290 + (i % 2) * 500, y = 480 + Math.floor(i / 2) * 200;
      const x2 = 100 + (i % 4) * 290, y2 = 1080 + Math.floor(i / 4) * 130;
      certificate(lerp(x, x2, shrink), lerp(y, y2, shrink), lerp(0.95, 0.5, shrink) * s, { name: n, rot: ((i % 3) - 1) * 0.04 });
    });
    if (t > pol - 0.2) {
      certificate(300, 560, 1.0 * pop(t, pol), { name: 'Polaroid', rot: -0.04 });
      const ej = prog(t, wt('B10', 'sx') + 0.2, 1.2), dev = prog(t, wt('B10', 'developed'), 2.0);
      at(760, 520, pop(t, wt('B10', 'sx') - 0.2) * 0.9, () => {
        rect(-170, -110, 340, 200, { fill: '#e8e2d2', w: 5 }); circle(-40, -10, 60, { fill: '#333', w: 5 }); circle(-40, -10, 28, { fill: '#666', w: 3 });
        rect(80, -90, 60, 40, { fill: '#999', w: 3 }); text('SX-70', 110, 60, { size: 30, font: 'Patrick Hand', weight: 'normal' });
        if (ej > 0) { const y = 90 + ej * 150; rect(-110, y - 60, 220, 250, { fill: '#fff', w: 4 }); g().fillStyle = `rgba(60,55,50,${1 - dev})`; g().fillRect(-90, y - 40, 180, 170); if (dev > 0.2) { const c = g(); c.save(); c.globalAlpha *= dev; stick(0, y + 150, { ...WALT, s: 0.32, face: 'grin', bob: 0 }); c.restore(); } }
      });
    }
  });
  ['ibm', 'coca', 'mcdonald', 'disney', 'xerox', 'avon', 'philip', 'polaroid'].forEach((w) => cue(wt('B10', w), 'pop', 0.3));

  S(ts('B11') - 0.3, L1, (lt, t, X) => {
    ground(GY);
    stick(260, GY, { ...WALT, pose: 'mega', prop: 'mega', face: X.talk(t) > 0.15 ? 'shout' : 'smile' });
    at(560, 420, pop(t, ts('B11') + 0.2), () => { bubble(-430, -140, 860, 230, -280, 330); text('Buy these stocks.', 0, -78, { size: 50, font: 'Patrick Hand', weight: 'normal' }); text('ONE-DECISION', 0, 2, { size: 92, color: C.red }); });
    at(760, 930, pop(t, wt('B11', 'buy') - 0.2, 0.45), () => {
      rect(-220, -200, 440, 400, { fill: '#fff3a8', w: 5 }); text('THE RULE:', 0, -130, { size: 60 });
      text('1. Buy', -170, -20, { size: 74, align: 'left' });
      text('2. NEVER sell', -170, 100, { size: 70, align: 'left', color: C.red, alpha: prog(t, wt('B11', 'never') - 0.3, 0.2) });
    }, 0.04);
  });
  cue(wt('B11', 'buy'), 'pop', 0.35);

  S(ts('B12') - 0.3, L1, (lt, t) => {
    const b = board(70, 260, 940, 520);
    const vals = []; for (let i = 0; i <= 30; i++) vals.push(0.15 + (i / 30) * 0.7 + Math.sin(i * 1.9) * 0.03);
    chartLine({ x: b.x + 10, y: b.y + 40, w: b.w - 20, h: b.h - 80 }, vals, { lo: 0, hi: 1, p: prog(t, wt('B12', 'while') - 0.5, 2.4), color: C.chalk, w: 7 });
    text('illustrative', b.x + b.w - 10, b.y + b.h - 20, { size: 26, align: 'right', color: C.chalk, font: 'Patrick Hand', weight: 'normal' });
    ground(GY);
    stick(540, GY, { ...WALT, s: 1.25, pose: 'cheer', face: 'grin', wave: 1 });
  });

  // ================= PART 2 =================
  const L2 = 'PART 2 · THE PRICE';
  S(ts('B13') - 0.6, L2, (lt, t, X) => {
    const b = board(70, 260, 940, 560);
    text('P/E', 540, b.y + 200, { size: 220, color: C.chalk, alpha: prog(t, wt('B13', 'price') - 0.3, 0.5) });
    text('Price ÷ Earnings', 540, b.y + 400, { size: 80, color: C.chalk, alpha: prog(t, wt('B13', 'ratio'), 0.5) });
    ground(GY);
    stick(300, GY, { ...NARRATOR, pose: 'point', face: 'smile', talk: X.talk(t), look: 1 });
    if (t > wt('B13', 'hope')) at(760, 1000, pop(t, wt('B13', 'hope')), () => text('= how much hope', 0, 0, { size: 50, color: C.red }), -0.05);
  });

  S(ts('B14') - 0.3, L2, (lt, t) => {
    at(300, 480, pop(t, wt('B14', 'earns')), () => { rect(-200, -130, 400, 260, { fill: '#fff', w: 5 }); text('COMPANY', 0, -70, { size: 48 }); coin(0, 30, 54, '$1'); text('profit per year', 0, 160, { size: 34, font: 'Patrick Hand', weight: 'normal' }); });
    priceTag(700, 470, 1.3 * pop(t, wt('B14', 'costs')), '$15');
    if (t > wt('B14', '15', 2) - 0.2) text('$15 ÷ $1 = 15', 540, 820, { size: 120, alpha: prog(t, wt('B14', '15', 2) - 0.2, 0.4) });
    const ct = wt('B14', 'paying');
    if (t > ct) { const n = Math.min(15, Math.floor(prog(t, ct, 2.4) * 15) + 1); for (let i = 0; i < n; i++) coin(260 + (i % 5) * 140, 1180 - Math.floor(i / 5) * 90, 44); text(`${n} × $1`, 540, 940, { size: 60, color: C.red }); }
  });

  const peT0 = ts('B15') - 0.3;
  const bars = [
    { name: 'S&P 500', v: 19, lab: '19×', t: wt('B15', '19'), col: '#a7c4a0' },
    { name: "McDonald's", v: 86, lab: '86×', t: wt('B16', 'mcdonald'), col: C.bar },
    { name: 'Polaroid', v: 91, lab: '90+×', t: wt('B16', 'polaroid'), col: C.bar },
    { name: 'Nifty avg.', v: 42, lab: '42×', t: wt('B17', 'average'), col: '#c99a5b' },
  ];
  S(peT0, L2, (lt, t) => {
    rect(50, 240, 980, 1020, { fill: C.beige, w: 5, seed: 51 });
    text('Price ÷ Earnings, end of 1972', 540, 320, { size: 58 });
    const base = 1080, top = 440;
    line(110, base, 990, base, { w: 6 }); line(110, base, 110, top - 20, { w: 6 });
    [25, 50, 75, 100].forEach((v) => { const y = base - (v / 100) * (base - top); line(100, y, 120, y, { w: 4 }); text(String(v), 92, y, { size: 26, align: 'right', font: 'Patrick Hand', weight: 'normal' }); });
    bars.forEach((b, i) => {
      const cx = 235 + i * 215, k = easeOut(prog(t, b.t, 0.8)), h = (b.v / 100) * (base - top) * k;
      if (k > 0) rect(cx - 72, base - h, 144, h, { fill: b.col, w: 5, seed: 54 + i });
      if (k > 0.6) text(b.lab, cx, base - h - 40, { size: 56, alpha: (k - 0.6) / 0.4 });
      text(b.name, cx, base + 42, { size: 34, font: 'Patrick Hand', weight: 'normal', maxW: 200 });
    });
    const dt = wt('B17', 'double');
    if (t > dt - 0.2) { scribbleCircle(772, 900, 230, 290, prog(t, dt - 0.2, 0.6), { seed: 57 }); at(760, 500, pop(t, dt + 0.3), () => text('about 2× pricier', 0, 0, { size: 58, color: C.red }), -0.08); }
    note('Sources: Siegel (1998); Fesenmaier & Smith (2002). Polaroid: 94.8 on estimated, 90.7 on trailing earnings', 1232);
  });
  cue(wt('B15', '19'), 'swoosh', 0.3); cue(wt('B16', 'mcdonald'), 'swoosh', 0.3); cue(wt('B16', 'polaroid'), 'swoosh', 0.3); cue(wt('B17', 'average'), 'swoosh', 0.3); cue(wt('B17', 'double'), 'ding', 0.35);

  S(ts('B18') - 0.3, L2, (lt, t) => {
    text('Polaroid at 90+ times earnings', 540, 320, { size: 56 });
    const p = prog(t, ts('B18') + 0.5, Math.max(2, wt('B18', 'price', 2) - ts('B18') - 0.4));
    const n = 92, cols = 10, cw = 86, x0 = 540 - (cols * cw) / 2, y0 = 400;
    const shown = Math.floor(p * n);
    for (let i = 0; i < shown; i++) { const x = x0 + (i % cols) * cw, y = y0 + Math.floor(i / cols) * 70; rect(x, y, cw - 12, 56, { fill: i === 0 ? C.yellow : '#fff', w: 3, seed: 500 + i }); }
    if (shown > 0) text(`${1972 + shown}`, 540, 1100, { size: 70, color: shown > 60 ? C.red : C.ink, wobble: false });
    text('one box = one year of 1972 profits', 540, 1180, { size: 38, font: 'Patrick Hand', weight: 'normal', alpha: prog(t, ts('B18') + 1.5, 0.5) });
    const dt = wt('B18', 'decades');
    if (t > dt - 0.4) stamp(540, 760, 'NO STUMBLES', pop(t, dt - 0.2, 0.3) * 0.7, -0.08);
  });

  S(ts('B19') - 0.3, L2, (lt, t) => {
    ground(GY);
    const d = t > wt('B19', 'decided');
    stick(330, GY, { ...WALT, s: 1.35, pose: d ? 'shrug' : 'think', face: d ? 'smile' : 'flat', look: 1 });
    if (d) at(720, 620, pop(t, wt('B19', 'quality')), () => { rect(-280, -120, 560, 240, { fill: '#fff3a8', w: 5 }); text('Quality is worth', 0, -34, { size: 56, font: 'Patrick Hand', weight: 'normal' }); text('ANY price.', 0, 50, { size: 64, color: C.red }); }, -0.04);
  });

  S(ts('B20') - 0.3, L2, (lt, t) => {
    text('"Two-tier market"', 540, 330, { size: 74, alpha: prog(t, wt('B20', 'two') - 0.3, 0.5) });
    rect(80, 420, 920, 330, { fill: '#fff', w: 5 }); rect(80, 790, 920, 330, { fill: '#ece7dc', w: 5, color: '#9a968e' });
    text('Favorites · P/E 40 to 90+', 540, 480, { size: 50, alpha: prog(t, wt('B20', 'club'), 0.5) });
    for (let i = 0; i < 4; i++) certificate(200 + i * 230, 620, 0.5 * pop(t, wt('B20', 'club') + i * 0.1), { rot: (i - 1.5) * 0.05 });
    text('Everything else · P/E around 19', 540, 850, { size: 46, color: '#7a756c', alpha: prog(t, wt('B20', 'everything'), 0.5) });
    for (let i = 0; i < 7; i++) rect(130 + i * 120, 960, 96, 80, { fill: '#e2ddd2', w: 3, color: '#9a968e', alpha: prog(t, wt('B20', 'everything') + i * 0.05, 0.3) });
    if (t > wt('B20', 'wrong') - 0.4) domino(900, 1230, 1.0, null, prog(t, te('B20') + 0.2, 0.6));
    note('Term in use by 1973 (Fortune, June 1973; U.S. Senate hearings, July 1973)');
  });
  cue(te('B20') + 0.5, 'thud', 0.35);

  // ================= PART 3 =================
  const L3 = 'PART 3 · THE DOMINOES';
  const DOM = [['GOLD', 'B21'], ['PRICES', 'B22'], ['OIL', 'B23'], ['RATES', 'B24'], ['SLUMP', 'B26'], ['NIXON', 'B26', 'watergate']];
  const domFall = (i) => { const [, id, w] = DOM[i]; return w ? wt(id, w) : ts(id) + 0.4; };
  DOM.forEach((d, i) => cue(domFall(i) + 0.1, 'thud', 0.22));
  const part3 = (start, draw) => S(start, L3, (lt, t, X) => { DOM.forEach(([lab], i) => domino(100 + i * 165, 400, 0.55, lab, prog(t, domFall(i), 0.6), { seed: i })); draw(lt, t, X); });

  part3(ts('B21') - 0.8, (lt, t) => {
    tv(540, 700, 0.85, (cx, cy) => { rect(cx - 70, cy + 20, 140, 140, { fill: '#8b6a4a', w: 4 }); circle(cx, cy + 80, 28, { fill: '#e8d9a8', w: 3 }); circle(cx, cy - 40, 40, { fill: '#555', w: 0 }); rect(cx - 50, cy - 5, 100, 40, { fill: '#555', w: 0 }); });
    text('AUG 15, 1971', 540, 500, { size: 54 });
    const br = prog(t, wt('B21', 'gold'), 0.5);
    goldBar(270 - br * 40, 1000, 1.0, -br * 0.2); dollar(810 + br * 40, 1000, 0.95, br * 0.2); chain(370, 1000, 700, 1000, br);
    if (t > wt('B21', 'early')) text('1973: fixed exchange rates collapse', 540, 1140, { size: 44, color: C.red, alpha: prog(t, wt('B21', 'early'), 0.5) });
    note('Source: Federal Reserve History');
  });
  cue(wt('B21', 'gold'), 'crash', 0.25);

  part3(ts('B22') - 0.3, (lt, t) => {
    thermometer(250, 900, 1.0, lerp(0.2, 0.55, easeInOut(prog(t, ts('B22'), te('B22') - ts('B22')))));
    text('INFLATION', 250, 520, { size: 52, color: C.red });
    [['Loose money', 'loose'], ['Food prices', 'food'], ['End of price', 'controls', 'controls']].forEach(([lab, w, w2], i) => {
      const key2 = w2 || w;
      at(720, 640 + i * 190, pop(t, wt('B22', key2 === 'controls' ? 'controls' : w) - 0.1), () => { rect(-220, -70, 440, 140, { fill: '#fff', w: 4 }); text(lab, 0, w2 ? -22 : 4, { size: 48 }); if (w2) text('controls', 0, 34, { size: 48 }); });
    });
  });

  part3(ts('B23') - 0.3, (lt, t) => {
    const lt2 = wt('B23', 'lines');
    if (t < lt2 - 0.2) {
      const msg = 'OCT 1973 — ARAB OIL EMBARGO ON U.S.';
      const n = Math.floor(prog(t, ts('B23') + 0.3, 2.0) * msg.length);
      rect(60, 520, 960, 80, { fill: '#fffdf2', w: 4 }); text(msg.slice(0, n), 90, 562, { size: 40, align: 'left', font: 'Patrick Hand', weight: 'normal', wobble: false });
      barrel(300, 900, 1.3);
      const q = wt('B23', 'quadrupled'), k = easeInOut(prog(t, q - 0.2, 1.2));
      priceTag(680, 800, 1.2, k < 0.5 ? '$2.90' : '$11.65', { color: k < 0.5 ? C.ink : C.red });
      text('per barrel', 760, 920, { size: 38, font: 'Patrick Hand', weight: 'normal' });
      if (k > 0.5) stamp(760, 1100, '×4', pop(t, q + 0.2, 0.3) * 0.9, 0.12);
    } else {
      ground(GY);
      for (let i = 0; i < 4; i++) car(150 + i * 230, GY - 22, 0.9, i);
      at(960, GY, 1, () => { line(0, 0, 0, -330, { w: 8 }); rect(-110, -520, 220, 190, { fill: '#fff', w: 5 }); text('SORRY', 0, -460, { size: 46, color: C.red }); text('NO GAS', 0, -390, { size: 46 }); });
    }
    note('Source: Federal Reserve History ($2.90 before the embargo, $11.65 in Jan 1974)');
  });
  cue(wt('B23', 'quadrupled') + 0.2, 'stomp', 0.4);

  part3(ts('B24') - 0.3, (lt, t) => {
    thermometer(250, 900, 1.0, lerp(0.55, 0.95, easeInOut(prog(t, ts('B24'), 3))));
    text('INFLATION', 250, 520, { size: 52, color: C.red });
    at(250, 1180, pop(t, wt('B24', '12')), () => text('+12.3% (Dec 1974)', 0, 0, { size: 44, color: C.red }));
    const ft = wt('B24', 'federal');
    dial(760, 820, 1.15, lerp(0.35, 0.92, easeInOut(prog(t, ft + 0.3, 1.4))), 'INTEREST RATES');
    text('FEDERAL RESERVE', 760, 610, { size: 42, alpha: prog(t, ft, 0.4) });
    note('Sources: Economic Report of the President (CPI-U); Federal Reserve (FRED)');
  });

  part3(ts('B25') - 0.3, (lt, t) => {
    const r = easeInOut(prog(t, wt('B25', 'rise'), 1.4));
    if (t < wt('B25', 'higher') - 0.6) {
      text('Future profits, worth today:', 540, 540, { size: 52 });
      [0, 10, 20, 30].forEach((y, i) => { const rad = 80 * Math.pow(lerp(0.93, 0.86, r), y); const x = 290 + (i % 2) * 500, yy = 720 + Math.floor(i / 2) * 270; coin(x, yy, Math.max(12, rad), i === 0 ? '$1' : ''); text(y === 0 ? 'today' : `in ${y} years`, x, yy + 120, { size: 38, font: 'Patrick Hand', weight: 'normal' }); });
      text(r > 0.5 ? 'with HIGHER interest rates' : 'with lower interest rates', 540, 1220, { size: 44, color: r > 0.5 ? C.red : '#7a756c' });
    } else {
      const k = prog(t, wt('B25', 'higher') - 0.6, 0.8), base = 1180;
      [['P/E 19', 0.25, 330, '#a7c4a0'], ['P/E 90+', 0.85, 750, C.bar]].forEach(([lab, hgt, x, col], i) => { const h = 620 * hgt * easeOut(k); rect(x - 110, base - h, 220, h, { fill: col, w: 5 }); text(lab, x, base + 44, { size: 46 }); });
      line(160, base, 920, base, { w: 6 });
      if (t > wt('B25', 'further')) { arrow(960, base - 520, 960, base - 20, { p: prog(t, wt('B25', 'further') - 0.1, 0.5), w: 8 }); text('further to fall', 760, 520, { size: 56, color: C.red, alpha: prog(t, wt('B25', 'further'), 0.4) }); }
    }
  });

  part3(ts('B26') - 0.3, (lt, t) => {
    const wg = wt('B26', 'watergate');
    if (t < wg - 0.3) { factory(540, 1000, 1.5, 1 - prog(t, ts('B26') + 1.5, 1.5)); stamp(540, 640, 'RECESSION', pop(t, ts('B26') + 1.2, 0.3) * 0.75, -0.08); text('began Nov 1973', 540, 1180, { size: 44, font: 'Patrick Hand', weight: 'normal' }); note('Source: NBER business cycle dates'); }
    else { newspaper(540, 860, 1.25 * pop(t, wg - 0.3, 0.45), 'THE DAILY LEDGER', 'FRIDAY, AUGUST 9, 1974', 'NIXON\nRESIGNS', { rot: (1 - easeOut(prog(t, wg - 0.3, 0.6))) * Math.PI * 3 - 0.02 }); note('fictional masthead'); }
  });
  cue(wt('B26', 'watergate') - 0.2, 'swoosh', 0.35);

  part3(ts('B27') - 0.3, (lt, t) => {
    letter(600, 880, 0.95, ['Dear Walt,', '', 'Is my pension safe?', '', '        Ruth'], { reveal: prog(t, ts('B27') + 0.6, 3), rot: -0.03 });
    at(220, 760, 1, () => photoFrame(0, 0, 0.75, (cx, cy) => stick(cx, cy + 40, { ...RUTH, s: 0.42, face: 'worried', bob: 0 })));
  });

  // ================= PART 4 =================
  const L4 = 'PART 4 · THE FALL';
  S(ts('B28') - 0.8, L4, (lt, t, X) => {
    const b = board(70, 250, 940, 640);
    text('S&P 500', b.x + 20, b.y + 34, { size: 52, align: 'left', color: C.chalk });
    const box = { x: b.x + 20, y: b.y + 90, w: b.w - 40, h: b.h - 160 };
    const p = prog(t, wt('B28', 'january') - 0.3, wt('B28', 'october') - wt('B28', 'january') + 0.6);
    const pts = chartLine(box, CRASH, { lo: 55, hi: 125, p, color: '#ff7b7b', w: 8 });
    text('Jan 1973', box.x, b.y + b.h - 26, { size: 32, align: 'left', color: C.chalk, font: 'Patrick Hand', weight: 'normal' });
    text('Oct 1974', box.x + box.w, b.y + b.h - 26, { size: 32, align: 'right', color: C.chalk, font: 'Patrick Hand', weight: 'normal' });
    if (p > 0.02) text('120.24', pts[0][0] + 10, pts[0][1] - 30, { size: 38, align: 'left', color: C.chalk });
    if (p >= 1) { const lp = pts[pts.length - 1]; text('62.28', lp[0] - 10, lp[1] - 40, { size: 38, align: 'right', color: C.chalk }); at(700, 450, pop(t, wt('B28', '48') - 0.1), () => text('-48%', 0, 0, { size: 120, color: C.yellow })); }
    ground(GY);
    stick(540, GY, { ...NARRATOR, pose: 'panic', face: 'shock', talk: X.talk(t) * 0.6 });
    if (t > wt('B28', 'worst')) at(830, 1000, pop(t, wt('B28', 'worst')), () => text('worst since', 0, -30, { size: 40, color: C.red }) || text('the 1930s', 0, 20, { size: 40, color: C.red }), -0.06);
    note('Source: S&P Dow Jones Indices (peak and low exact; path approximate)', 925);
  }, 'cut');
  cue(wt('B28', '48'), 'crash', 0.5); shakes.push({ t: wt('B28', '48'), amp: 22, dur: 0.7 });

  S(ts('B29') - 0.3, L4, (lt, t) => {
    text('Each from its own peak', 540, 320, { size: 56, color: '#7a756c' });
    [['Xerox', 0.71, 'xerox'], ['Avon', 0.86, 'avon'], ['Polaroid', 0.91, 'polaroid']].forEach(([n, l, w], i) => {
      const y = 520 + i * 290, d = easeInOut(prog(t, wt('B29', w) + 0.1, 1.2));
      certificate(370, y, 1.0, { fill: 1 - l * d, name: n, seed: 700 + i, rot: (i - 1) * 0.02 });
      if (d > 0.6) at(820, y, pop(t, wt('B29', w) + 0.8), () => text(`-${Math.round(l * 100)}%`, 0, 0, { size: 100, color: C.red, font: 'Permanent Marker', weight: 'normal' }));
    });
    note('Peak-to-trough falls as commonly cited');
  });
  ['xerox', 'avon', 'polaroid'].forEach((w) => cue(wt('B29', w) + 0.3, 'thud', 0.35));

  S(ts('B30') - 0.3, L4, (lt, t) => {
    line(80, 760, 1000, 760, { w: 4, color: '#9a968e' });
    text('The business', 540, 330, { size: 56 });
    rect(380, 420, 320, 180, { fill: '#fff', w: 5 }); text('OPEN', 540, 470, { size: 50 });
    for (let i = 0; i < 4; i++) stick(330 + i * 140, 730, { s: 0.42, seed: 60 + i, face: 'smile', bob: 0.5 });
    text('The price', 540, 830, { size: 56 });
    const k = easeInOut(prog(t, wt('B30', 'collapsed') - 0.2, 1.6));
    priceTag(500, 1040, lerp(1.6, 0.55, k), '$$$', { color: k > 0.5 ? C.red : C.ink, rot: 0.12 + k * 0.3 });
  });

  S(ts('B31') - 0.3, L4, (lt, t) => {
    g().save(); g().fillStyle = 'rgba(60,50,40,0.10)'; g().fillRect(0, 0, 1080, 1920); g().restore();
    text('OCTOBER 1974', 540, 300, { size: 70 });
    ground(GY);
    stick(240, GY, { ...WALT, s: 1.25, pose: 'stand', face: 'worried', look: 1 });
    const bt = wt('B31', 'boss');
    if (t > bt - 0.3) { stick(860, GY, { ...BOSS, pose: 'pointL', face: 'shout' }); at(820, 560, pop(t, bt), () => { bubble(-140, -70, 280, 140, 40, 120); text('SELL!', 0, 4, { size: 64, color: C.red }); }); }
    briefcase(540, 1060, 0.55, { locked: true });
    const kt = wt('B31', 'key');
    if (t > kt - 0.3) key(540, 880 - Math.sin(t * 2) * 8, 0.8 * pop(t, kt - 0.3), -0.3);
    if (t > wt('B31', 'sell', 1) - 0.2) {
      at(330, 460, pop(t, wt('B31', 'sell', 1) - 0.2), () => { rect(-130, -55, 260, 110, { fill: '#fff', w: 5 }); text('SELL', 0, 4, { size: 60 }); });
      at(750, 460, pop(t, wt('B31', 'hold') - 0.2), () => { rect(-130, -55, 260, 110, { fill: '#fff', w: 5 }); text('HOLD', 0, 4, { size: 60 }); });
    }
    if (t > wt('B31', 'what')) at(540, 770, pop(t, wt('B31', 'what')), () => text('What would YOU do?', 0, 0, { size: 72, color: C.red }));
  });
  cue(wt('B31', 'what'), 'heartbeat', 0.35);

  const rec = recoverySeries();
  S(ts('B32') - 0.3, L4, (lt, t) => {
    const b = board(50, 250, 980, 820);
    const box = { x: b.x + 70, y: b.y + 60, w: b.w - 120, h: b.h - 150 }, y0v = 40, y1v = 340;
    const X = (yr) => box.x + ((yr - 1973) / 13) * box.w, Y = (v) => box.y + box.h - ((v - y0v) / (y1v - y0v)) * box.h;
    line(box.x, box.y + box.h, box.x + box.w, box.y + box.h, { w: 4, color: C.chalk }); line(box.x, box.y, box.x, box.y + box.h, { w: 4, color: C.chalk });
    [1973, 1980, 1985].forEach((yr) => text(String(yr), X(yr), box.y + box.h + 34, { size: 30, color: C.chalk, font: 'Patrick Hand', weight: 'normal' }));
    path([[X(1973), Y(100)], [X(1986), Y(100)]], { w: 3, color: '#9fb8a5' });
    text('1973 peak', X(1973) + 10, Y(100) - 22, { size: 26, align: 'left', color: '#cfe0d2', font: 'Patrick Hand', weight: 'normal' });
    const series = [
      { d: rec.price, col: C.chalk, lab: 'price', t: wt('B32', 'price'), mark: [1980.55, 'Jul 1980'] },
      { d: rec.nom, col: C.yellow, lab: '+ dividends', t: wt('B32', 'dividends'), mark: [1976.5, '~1976'] },
      { d: rec.real, col: '#ff7b7b', lab: 'after inflation', t: wt('B32', 'inflation'), mark: [1985.0, '~1985'] },
    ];
    series.forEach((s, i) => {
      const pts = s.d.map(([yr, v]) => [X(yr), Y(v)]), p = prog(t, s.t - 0.2, 2.0);
      path(pts, { w: i === 2 ? 8 : 6, color: s.col, p, amp: 0.6 });
      if (p >= 1) { const last = pts[pts.length - 1]; text(s.lab, last[0] - 6, last[1] - 26, { size: 30, color: s.col, align: 'right' }); circle(X(s.mark[0]), Y(100), 10, { fill: s.col, w: 0 }); text(s.mark[1], X(s.mark[0]), Y(100) + (i === 1 ? -36 : 40), { size: 30, color: s.col }); }
    });
    if (t > wt('B32', '12')) stamp(540, 1170, '~12 YEARS', pop(t, wt('B32', '12'), 0.3) * 0.8, -0.06);
    note('S&P 500 annual price & total-return data, CPI-U; approximate', 1240);
  });
  cue(wt('B32', '12'), 'stomp', 0.4);

  // ================= PART 5 =================
  const L5 = 'PART 5 · THE ARGUMENT';
  S(ts('B33') - 0.8, L5, (lt, t, X) => {
    text('Were the Nifty Fifty', 540, 350, { size: 74, alpha: prog(t, ts('B33'), 0.5) });
    text('a terrible investment?', 540, 440, { size: 74, alpha: prog(t, ts('B33') + 0.4, 0.5) });
    const et = wt('B33', 'economists');
    [['Siegel', '1998', 300], ['Fesenmaier', '& Smith 2002', 780]].forEach(([n, y, x], i) => at(x, 650, pop(t, et + i * 0.3), () => { rect(-210, -90, 420, 180, { fill: C.beige, w: 5 }); text(n, 0, -20, { size: 52 }); text(y, 0, 44, { size: 36, font: 'Patrick Hand', weight: 'normal' }); }, i ? 0.04 : -0.04));
    ground(GY);
    stick(540, GY, { ...NARRATOR, pose: 'shrug', face: 'smile', talk: X.talk(t) });
  });

  S(ts('B34') - 0.3, L5, (lt, t) => {
    text('Jeremy Siegel, 1998', 540, 330, { size: 66 });
    text('bought at the 1972 top, held to Aug 1998', 540, 410, { size: 38, font: 'Patrick Hand', weight: 'normal', color: '#7a756c' });
    [['Nifty Fifty', 12.2, wt('B34', '12', 1), C.bar], ['S&P 500', 12.7, wt('B34', '12', 2), '#a7c4a0']].forEach(([n, v, t0, col], i) => {
      const k = easeOut(prog(t, t0 - 0.2, 1.0)), y = 600 + i * 240, w = (v / 14) * 800 * k;
      text(n, 120, y - 80, { size: 48, align: 'left' });
      rect(120, y - 40, w, 110, { fill: col, w: 5 });
      if (k > 0.8) text(`${v}%/yr`, 140 + w, y + 16, { size: 52, align: 'left' });
    });
    if (t > wt('B34', 'close')) stamp(540, 1110, 'STILL BEHIND', pop(t, wt('B34', 'close'), 0.3) * 0.7, -0.06);
    note('Siegel, "Valuing Growth Stocks: Revisiting the Nifty Fifty" (1998), as reported');
  });

  S(ts('B35') - 0.3, L5, (lt, t) => {
    certificate(400, 700, 1.3, { name: 'Philip Morris', rot: -0.03 });
    priceTag(700, 420, 1.1 * pop(t, wt('B35', '24') - 0.2), 'P/E 24', { glow: 1, size: 48 });
    if (t > wt('B35', 'cheaper')) text('one of the cheaper names', 540, 960, { size: 46, alpha: prog(t, wt('B35', 'cheaper'), 0.4) });
    if (t > wt('B35', 'best')) { arrow(260, 1200, 900, 880, { p: prog(t, wt('B35', 'best') - 0.2, 0.8), color: C.green, w: 9, head: 40 }); text('a big winner', 760, 1170, { size: 50, color: C.green, alpha: prog(t, wt('B35', 'best') + 0.4, 0.4) }); }
  });

  S(ts('B36') - 0.3, L5, (lt, t) => {
    text('Fesenmaier & Smith, 2002', 540, 330, { size: 60 });
    if (t < wt('B36', 'roughly') - 0.8) {
      const lt0 = wt('B36', 'two');
      [[360, 'List A'], [720, 'List B']].forEach(([x, lab], i) => at(x, 760, pop(t, lt0 - 0.2 + i * 0.25), () => { rect(-200, -300, 400, 600, { fill: '#fff', w: 5, alpha: 0.95 }); text(lab + ' (1972)', 0, -250, { size: 40 }); for (let r = 0; r < 9; r++) line(-160, -170 + r * 56, 160, -170 + r * 56, { w: 3, color: '#9a968e' }); }, i ? 0.04 : -0.04));
      if (t > wt('B36', 'core') - 0.5) { g().save(); g().fillStyle = 'rgba(255,224,102,0.55)'; g().fillRect(450, 480, 180, 560); g().restore(); text('24 on both', 540, 1130, { size: 54, alpha: prog(t, wt('B36', 'core') - 0.5, 0.4) }); }
    } else {
      text('Wealth by 2001 (S&P 500 = 100)', 540, 420, { size: 42, font: 'Patrick Hand', weight: 'normal' });
      const k = easeOut(prog(t, wt('B36', 'roughly') - 0.6, 1.0));
      [['S&P 500', 100, '#a7c4a0'], ['The 24 favorites', 50, '#f08a8a']].forEach(([n, v, col], i) => {
        const y = 640 + i * 260, w = (v / 100) * 820 * (i ? k : 1);
        text(n, 120, y - 80, { size: 48, align: 'left' }); rect(120, y - 40, w, 120, { fill: col, w: 5 });
        if (!i || k > 0.8) text(i ? '~half' : '100', 140 + w, y + 20, { size: 56, align: 'left', color: i ? C.red : C.ink });
      });
    }
    note('Fesenmaier & Smith, "The Nifty-Fifty Re-Revisited", Journal of Investing (2002), as reported');
  });

  S(ts('B37') - 0.3, L5, (lt, t) => {
    const k = prog(t, ts('B37') + 0.5, 2.5);
    certificate(540, 760, 1.9, { alpha: 1 - 0.5 * k, name: 'Polaroid', rot: -0.03 });
    stamp(540, 900, 'BANKRUPT 2001', pop(t, wt('B37', 'bankruptcy') - 0.2, 0.3) * 0.8, -0.12);
  });
  cue(wt('B37', 'bankruptcy'), 'stomp', 0.45);

  S(ts('B38') - 0.3, L5, (lt, t) => {
    const ox = 200, oy = 1100, w = 760, h = 640;
    line(ox, oy, ox + w, oy, { w: 6 }); line(ox, oy, ox, oy - h, { w: 6 });
    text('price paid (P/E) →', ox + w, oy + 50, { size: 40, align: 'right' });
    text('return later →', ox - 40, oy - h / 2, { size: 40, rot: -Math.PI / 2 });
    const p = prog(t, wt('B38', 'more') - 0.3, 1.6);
    path([[ox + 70, oy - h + 70], [ox + w - 60, oy - 80]], { w: 10, color: C.red, p });
    text('Both studies agree:', 540, 330, { size: 60, alpha: prog(t, wt('B38', 'agree'), 0.5) });
    text('pay more, earn less', 540, 410, { size: 60, color: C.red, alpha: prog(t, wt('B38', 'more'), 0.5) });
    note('schematic, not data', 1180);
  });

  // ================= PART 6 =================
  const L6 = 'PART 6 · TODAY';
  S(ts('B39') - 0.8, L6, (lt, t) => {
    text('S&P 500: share held by', 540, 330, { size: 58 });
    text('the 10 largest companies', 540, 400, { size: 58 });
    const k = easeOut(prog(t, wt('B39', '38') - 0.5, 1.2)), x0 = 120, ww = 840;
    text('Today', x0, 520, { size: 48, align: 'left' });
    rect(x0, 560, ww, 130, { fill: '#fff', w: 5 }); g().save(); g().fillStyle = C.yellow; g().fillRect(x0 + 4, 564, (ww - 8) * 0.378 * k, 122); g().restore();
    if (k > 0.9) text('~38%', x0 + ww * 0.378 + 20, 628, { size: 60, align: 'left' });
    text('S&P Dow Jones Indices, Sep 2026', x0 + ww, 730, { size: 28, font: 'Patrick Hand', weight: 'normal', color: '#7a756c', align: 'right' });
    const t2 = wt('B40', 'estimates');
    if (t > t2 - 0.3) {
      const a = prog(t, t2 - 0.3, 0.5);
      text('Early 1970s', x0, 830, { size: 48, align: 'left', alpha: a });
      rect(x0, 870, ww, 130, { fill: '#fff', w: 5, alpha: a });
      g().save(); g().globalAlpha = a * 0.55; g().fillStyle = '#9a968e'; g().fillRect(x0 + 4, 874, (ww - 8) * 0.22, 122); g().globalAlpha = a * 0.25; g().fillRect(x0 + 4 + (ww - 8) * 0.22, 874, (ww - 8) * 0.08, 122); g().restore();
      text('~22–30%', x0 + ww * 0.30 + 20, 938, { size: 56, align: 'left', alpha: a });
      text('estimates vary', x0 + ww, 1040, { size: 28, font: 'Patrick Hand', weight: 'normal', color: '#7a756c', align: 'right', alpha: a });
    }
    if (t > wt('B40', 'heavy') - 0.2) stamp(540, 1160, 'MORE TOP-HEAVY', pop(t, wt('B40', 'heavy') - 0.2, 0.3) * 0.65, -0.05);
  });

  S(ts('B41') - 0.3, L6, (lt, t) => {
    ground(GY);
    text("Today's giants", 540, 330, { size: 60 });
    for (let i = 0; i < 10; i++) { const h = 360 + hash(i, 4) * 300, k = pop(t, ts('B41') + i * 0.06); rect(110 + i * 88, GY - h * k, 70, h * k, { fill: '#fff', w: 4, seed: 910 + i }); }
    const so = wt('B41', 'so');
    if (t > so - 0.2) { text('1972', 540, 430, { size: 50, color: '#9a968e', alpha: prog(t, so - 0.2, 0.5) }); for (let i = 0; i < 4; i++) certificate(200 + i * 230, 560, 0.45, { alpha: prog(t, so - 0.2, 0.6) * 0.85, rot: (i - 1.5) * 0.05 }); }
  });

  S(ts('B42') - 0.3, L6, (lt, t, X) => {
    stamp(540, 400, 'NOT A PREDICTION', pop(t, ts('B42') + 0.1, 0.3) * 0.6, -0.04);
    const qt = wt('B42', 'question');
    if (t > qt - 0.3) priceTag(560, 720, 1.2 * pop(t, qt - 0.3), '?', { glow: 0.9 + 0.1 * Math.sin(t * 3) });
    ground(GY);
    stick(270, GY, { ...NARRATOR, pose: 'think', face: 'flat', talk: X.talk(t), look: 1 });
  });

  // ================= EPILOGUE =================
  const LE = 'EPILOGUE · 1985';
  S(ts('B43') - 1.0, LE, (lt, t) => {
    ground(GY);
    stick(250, GY, { ...WALT_OLD, s: 1.3, pose: 'stand', face: 'flat', look: 1 });
    letter(700, 800, 0.85, ['Dear Ruth,', '', 'I know now what went', 'wrong in 1972.', '', '        Walt'], { reveal: prog(t, ts('B43') + 0.4, 4), rot: 0.02 });
  }, 'cut');

  S(ts('B44') - 0.3, LE, (lt, t) => {
    ground(GY);
    briefcase(540, 1040, 0.95, { locked: false, open: 0.9 });
    text('ONE-DECISION STOCKS', 540, 330, { size: 60, color: '#7a756c' });
    const bt = wt('B44', 'buy'), st = wt('B44', 'sell');
    if (t > bt - 0.2) { text('BUY', 330, 470, { size: 100 }); line(220, 474, 440, 466, { w: 9, color: C.red, p: prog(t, bt + 0.4, 0.3) }); }
    if (t > st - 0.2) { text('SELL', 750, 470, { size: 100 }); line(620, 474, 880, 466, { w: 9, color: C.red, p: prog(t, st + 0.4, 0.3) }); }
    const pt = wt('B44', 'how');
    if (t > pt - 0.2) priceTag(500, 700, 1.6 * pop(t, pt - 0.2), 'P/E', { glow: prog(t, wt('B44', 'pay') - 0.3, 0.6), rot: 0.1 + Math.sin(t * 2) * 0.05 });
  });
  cue(wt('B44', 'pay'), 'ding', 0.4);

  S(ts('B45') - 0.3, 'THE ONE QUESTION', (lt, t) => {
    text('Before you buy', 540, 420, { size: 70, alpha: prog(t, ts('B45') + 0.1, 0.4) });
    text('a "sure thing", ask:', 540, 510, { size: 70, alpha: prog(t, ts('B45') + 0.3, 0.4) });
    const sw = prog(t, wt('B45', 'paying') - 0.3, 0.8);
    g().save(); g().fillStyle = C.yellow; g().globalAlpha = 0.9; g().fillRect(90, 630, 900 * sw, 300); g().restore();
    text('What am I paying', 540, 710, { size: 84 }); text('for each $1', 540, 800, { size: 84 }); text('it earns?', 540, 890, { size: 84 });
  });

  S(ts('B46') - 0.3, null, (lt, t) => {
    text('Market history,', 540, 520, { size: 90, alpha: prog(t, ts('B46'), 0.5) });
    text('drawn by hand.', 540, 620, { size: 90, alpha: prog(t, ts('B46') + 0.2, 0.5) });
    at(540, 800, pop(t, ts('B46') + 1.2), () => { rect(-230, -65, 460, 130, { fill: C.red, w: 5 }); text('SUBSCRIBE', 0, 4, { size: 66, color: '#fff' }); });
    text('Walt and Ruth are fictional composites.', 540, 1180, { size: 32, font: 'Patrick Hand', weight: 'normal', color: '#7a756c', alpha: prog(t, ts('B46') + 2, 0.5) });
    text('Sources in the description. Not financial advice.', 540, 1230, { size: 32, font: 'Patrick Hand', weight: 'normal', color: '#7a756c', alpha: prog(t, ts('B46') + 2.2, 0.5) });
  }, 'fade');

  scenes.sort((a, b) => a.start - b.start);

  const srt = []; let n = 1;
  const fmt = (x) => { const ms = Math.round(x * 1000); return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
  for (const b of beats) {
    const parts = b.text.replace(/P E/g, 'P/E').replace(/S and P/g, 'S&P').match(/[^.?!]+[.?!]?/g).map((x) => x.trim()).filter(Boolean);
    const total = parts.reduce((a, p) => a + p.length, 0); let cur = b.s;
    for (const p of parts) { const d = (b.e - b.s) * (p.length / total); srt.push(`${n++}\n${fmt(cur)} --> ${fmt(cur + d)}\n${p}\n`); cur += d; }
  }
  return { scenes, sfx, shakes, flashes, duration: DURATION, subtitles: srt.join('\n') };
}

/** Word-by-word caption groups (2–3 words), with Whisper's split tokens re-joined. */
export function captions(words) {
  const toks = [];
  for (const w of words) {
    const s = w.w;
    if (toks.length && /^[-&%.,]/.test(s) && !/^[.,]$/.test(s)) { const p = toks[toks.length - 1]; p.w += s; p.e = w.e; continue; }
    toks.push({ ...w });
  }
  for (const t of toks) t.w = t.w.replace(/^P\.E\.,?$/, 'P/E').replace(/^PE\.?$/, 'P/E').replace('S&P', 'S&P');
  const groups = []; let cur = [];
  for (const t of toks) {
    cur.push(t);
    const len = cur.map((x) => x.w).join(' ').length;
    if (/[.,?!]$/.test(t.w) || cur.length >= 3 || len > 15) { groups.push(cur); cur = []; }
  }
  if (cur.length) groups.push(cur);
  return groups.map((gp) => ({ s: gp[0].s, e: gp[gp.length - 1].e, words: gp.map((x) => ({ w: x.w.replace(/[.,]$/, ''), s: x.s, e: x.e })) }));
}
