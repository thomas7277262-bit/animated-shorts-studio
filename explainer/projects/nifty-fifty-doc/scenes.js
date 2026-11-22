// "Never Sell: The Nifty Fifty and the Crash of 1973" — long-form 16:9 documentary.
// Every scene is timed to the narration beats (beats.json) and words (words.json).
import { text, line, path, rect, circle, ellipse, at, pop, prog, easeOut, easeInOut, lerp, hash, scribbleCircle, arrow, g, measure } from '../../engine.js';
import { P, pen, tipOf, certificate, priceTag, briefcase, padlock, key, domino, newspaper, tv, goldBar, dollar, chain, thermometer, barrel, car, dial, coin, photoFrame, letter, ledger, factory, stick, dateRibbon, source } from '../../kit2.js';

export const LAYOUT = { w: 1920, h: 1080, captions: false, headerX: 56, headerY: 62, camY: 0.5 };
export const OFFSET = 0; // beats.json already includes the lead-in
const W = 1920, H = 1080, GY = 900;

const WALT = { sideburns: true, tie: P.grey, tieW: 16, hair: 'neat', hairColor: '#3b2a1e', skin: P.head, seed: 5 };
const WALT_OLD = { ...WALT, hairColor: '#b5b0a6' };
const RUTH = { hair: 'bun', hairColor: P.grey, skin: P.head, seed: 9 };

// Annual S&P 500 data (approximate): price index year-ends and total returns, CPI-U Dec/Dec.
const SPX_YE = { 1973: 97.55, 1974: 68.56, 1975: 90.19, 1976: 107.46, 1977: 95.10, 1978: 96.11, 1979: 107.94, 1980: 135.76, 1981: 122.55, 1982: 140.64, 1983: 164.93, 1984: 167.24, 1985: 211.28 };
const TR = { 1973: -14.66, 1974: -26.47, 1975: 37.20, 1976: 23.84, 1977: -7.18, 1978: 6.56, 1979: 18.44, 1980: 32.42, 1981: -4.91, 1982: 21.55, 1983: 22.56, 1984: 6.27, 1985: 31.73 };
const CPI = { 1973: 8.7, 1974: 12.3, 1975: 6.9, 1976: 4.9, 1977: 6.7, 1978: 9.0, 1979: 13.3, 1980: 12.5, 1981: 8.9, 1982: 3.8, 1983: 3.8, 1984: 3.9, 1985: 3.8 };
const PEAK = 120.24, YE1972 = 118.05;
function recoverySeries() {
  const price = [[1973.03, 100]], nom = [[1973.03, 100]], real = [[1973.03, 100]];
  let n = YE1972 / PEAK * 100, r = n;
  for (let y = 1973; y <= 1985; y++) {
    n *= 1 + TR[y] / 100; r *= (1 + TR[y] / 100) / (1 + CPI[y] / 100);
    price.push([y + 1, SPX_YE[y] / PEAK * 100]); nom.push([y + 1, n]); real.push([y + 1, r]);
  }
  return { price, nom, real };
}
// S&P 500, Jan 1973 – Oct 1974: approximate monthly path; peak and low are exact closes.
const CRASH = [120.24, 116.0, 111.7, 111.5, 106.97, 104.95, 104.26, 108.22, 104.25, 108.43, 108.29, 95.96, 97.55, 96.57, 96.22, 93.98, 90.31, 87.28, 86.0, 79.31, 72.15, 63.54, 62.28];

export function build(words, beats) {
  const B = Object.fromEntries(beats.map((b) => [b.id, b]));
  const ts = (id) => B[id].s, te = (id) => B[id].e;
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  /** Time of the nth occurrence of a word inside a beat (falls back to its position in the text). */
  const wt = (id, w, nth = 1) => {
    const b = B[id]; let n = 0;
    for (const x of words) {
      if (x.s < b.s - 0.25 || x.s > b.e + 0.25) continue;
      if (norm(x.w).startsWith(norm(w)) && ++n === nth) return x.s;
    }
    const SPOKEN = { '90': 'ninety', '15': 'fifteen', '19': 'nineteen', '12': 'twelve', '48': 'forty-eight', '24': 'twenty-four', '38': 'thirty-eight' };
    const needle = (SPOKEN[w] || w).toLowerCase(); let i = -1;
    for (let k = 0; k < nth; k++) { i = b.text.toLowerCase().indexOf(needle, i + 1); if (i < 0) break; }
    if (typeof console !== 'undefined') console.warn('cue fallback', id, w);
    return i < 0 ? b.s : b.s + (b.e - b.s) * (i / b.text.length);
  };
  const DURATION = Math.ceil((te('B46') + 6.2) * 10) / 10;

  const sfx = []; const cue = (t, name, gain = 0.3) => sfx.push({ t, name, gain });
  const shakes = []; const flashes = [];
  const scenes = [];
  const S = (start, label, year, draw, tr = 'fade') => scenes.push({ start, label, year, draw, tr });

  // ================= COLD OPEN =================
  S(0, null, 1972, (lt, t) => {
    const lockT = wt('B01', 'never'), keyT = te('B01') - 0.6;
    briefcase(960, 600, 1.35, { open: 1 - prog(t, lockT - 0.9, 0.5), locked: t > lockT, shackle: 1 - prog(t, lockT, 0.25) });
    // Walt's hand bringing the padlock in
    if (t < lockT) { const k = easeOut(prog(t, 0.2, lockT - 0.4)); padlock(lerp(1500, 960, k), lerp(260, 519, k), 1.08); }
    // the key flies away
    if (t > keyT) { const k = prog(t, keyT, 0.9); key(960 + k * 700, 470 - Math.sin(k * Math.PI) * 260 - k * 120, 0.9, k * 6); }
    text('1972', 120, 160, { size: 64, color: P.grey, align: 'left' });
  }, 'cut');
  cue(wt('B01', 'never'), 'stomp', 0.25);

  S(ts('B02') - 0.3, null, 1974, (lt, t) => {
    const drain = easeInOut(prog(t, wt('B02', '90') - 0.2, 1.4));
    const nameShown = t > wt('B02', 'polaroid') - 0.1;
    certificate(960, 520, 1.9, { fill: 1 - 0.9 * drain, name: nameShown ? 'Polaroid' : '' });
    if (drain > 0.6) at(1560, 240, pop(t, wt('B02', '90') + 1.0), () => text('≈ −90%', 0, 0, { size: 96, color: P.red, font: 'Permanent Marker', weight: 'normal' }), -0.1);
    if (t > wt('B02', 'penny') - 0.1 && t < wt('B02', 'polaroid')) {
      at(420, 820, pop(t, wt('B02', 'penny') - 0.1), () => { circle(0, 0, 60, { fill: '#c98a4b', w: 5 }); text('1¢', 0, 2, { size: 44 }); line(-80, -80, 80, 80, { w: 9, color: P.red }); });
    }
    text('1974', 120, 160, { size: 64, color: P.grey, align: 'left' });
  }, 'cut');
  cue(wt('B02', '90'), 'sting', 0.3);
  cue(wt('B02', 'polaroid'), 'thud', 0.3);

  S(ts('B03') - 0.2, null, 1972, (lt, t) => {
    stick(820, GY, { ...WALT, s: 1.55, pose: 'stand', face: 'smile', look: 0.3 });
    // name tag with a leader line
    at(1180, 380, pop(t, wt('B03', 'walt') + 0.1), () => {
      path([[-170, 60], [-80, 0]], { w: 4, color: P.grey });
      text('WALT', 0, 0, { size: 84, align: 'left' });
      text('pension fund manager', 4, 64, { size: 36, font: 'Patrick Hand', weight: 'normal', align: 'left', color: P.grey });
    });
    if (t > wt('B03', 'real')) text('Walt is a fictional composite.', W / 2, 990, { size: 32, font: 'Patrick Hand', weight: 'normal', color: P.grey, alpha: prog(t, wt('B03', 'real'), 0.5), wobble: false });
    line(80, GY, W - 80, GY, { w: 5, color: P.grey, seed: 3 });
  });

  S(ts('B04') - 0.2, null, 1972, (lt, t) => {
    ledger(560, 520, 1.0, [['R. Kowalski', '31 yrs'], ['M. Alvarez', '27 yrs'], ['D. Brooks', '33 yrs'], ['J. Novak', '29 yrs'], ['E. Washington', '35 yrs'], ['H. Lindqvist', '30 yrs'], ['P. O\'Neill', '26 yrs']], prog(t, ts('B04'), 2.2));
    const names = ['IBM', 'Coca-Cola', 'Polaroid'];
    names.forEach((n, i) => certificate(1420, 280 + i * 250, 0.75 * pop(t, wt('B04', 'admired') + i * 0.25), { rot: (i - 1) * 0.04 }));
    names.forEach((n, i) => { if (pop(t, wt('B04', 'admired') + i * 0.25) > 0.9) text(n, 1420, 276 + i * 250, { size: 40, color: P.ink }); });
    if (t > wt('B04', 'admired') - 0.3) arrow(900, 520, 1180, 520, { p: prog(t, wt('B04', 'admired') - 0.3, 0.6), color: P.ink });
    if (t > wt('B04', 'never')) at(1700, 820, pop(t, wt('B04', 'never')), () => padlock(0, 0, 0.9));
    text('Walt is a fictional composite.', W / 2, 1000, { size: 26, font: 'Patrick Hand', weight: 'normal', color: P.grey, alpha: 0.7, wobble: false });
  });
  cue(wt('B04', 'never'), 'stomp', 0.2);

  S(ts('B05') - 0.2, null, 1972, (lt, t) => {
    briefcase(760, 600, 1.2, { locked: true, shackle: 0 });
    const glow = prog(t, wt('B05', 'number') - 0.2, 0.5);
    priceTag(1240, 400, 1.3, '?', { glow: glow > 0 ? 0.9 + 0.1 * Math.sin(t * 4) : 0, rot: 0.18 + Math.sin(t * 2) * 0.04 });
    line(990, 470, 1140, 410, { w: 4, color: P.grey });
    // title draws on after the line ends
    const tt = te('B05') + 0.1;
    if (t > tt) {
      g().save(); g().fillStyle = `rgba(247,243,234,${0.92 * prog(t, tt, 0.4)})`; g().fillRect(0, 0, W, H); g().restore();
      at(W / 2, 470, pop(t, tt, 0.5), () => text('NEVER SELL', 0, 0, { size: 190, font: 'Kalam' }));
      path([[560, 590], [960, 580], [1360, 592]], { w: 9, color: P.red, p: prog(t, tt + 0.4, 0.5) });
      text('The Nifty Fifty and the Crash of 1973', W / 2, 670, { size: 56, font: 'Patrick Hand', weight: 'normal', alpha: prog(t, tt + 0.6, 0.5) });
    }
  });
  cue(te('B05') + 0.1, 'thud', 0.45);

  // ================= PART 1 =================
  const L1 = 'PART 1 · ONE DECISION';
  S(ts('B06') - 0.5, L1, 1972, (lt, t) => {
    const k = easeOut(prog(t, ts('B06') + 1.0, wt('B06', 'thousand') - ts('B06') - 0.6));
    rect(460, 220, 1000, 360, { fill: P.board, w: 8, color: '#5a3d25', seed: 301 });
    text('DOW JONES INDUSTRIAL AVERAGE', 960, 290, { size: 44, color: '#f2efe4', wobble: false });
    const v = lerp(984.12, 1003.16, k);
    text(v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 960, 430, { size: 150, color: k >= 1 ? P.yellow : '#f2efe4', font: 'Kalam', wobble: false });
    text('NOV 14, 1972 · FIRST CLOSE ABOVE 1,000', 960, 530, { size: 32, color: '#cfcab9', font: 'Patrick Hand', weight: 'normal', wobble: false });
    // crowd of heads
    for (let i = 0; i < 14; i++) {
      const x = 180 + i * 120, jump = k >= 1 ? Math.max(0, Math.sin(lt * 6 + i)) * 18 : 0;
      circle(x, 860 - jump - (i % 2) * 30, 42, { fill: P.head, w: 4, color: P.grey, seed: 310 + i });
      if (k >= 1) line(x - 30, 900 - jump, x - 60, 800 - jump, { w: 4, color: P.grey });
    }
    if (k >= 1) for (let i = 0; i < 22; i++) { const x = hash(i, 1) * W, y = ((lt - 3) * (180 + hash(i, 2) * 120) + hash(i, 3) * 700) % 900; path([[x, y], [x + 12, y + 30], [x - 6, y + 60]], { w: 3, color: P.grey }); }
    source(W, H, 'Source: S&P Dow Jones Indices');
  }, 'wipe');
  cue(wt('B06', 'thousand'), 'ding', 0.3);

  S(ts('B07') - 0.3, L1, 1972, (lt, t) => {
    rect(140, 120, 400, 70, { fill: '#fff', w: 4, seed: 321 }); text('PENSION FUND', 340, 156, { size: 40 });
    line(80, 780, W - 80, 780, { w: 6, color: '#6b4a2e', seed: 322 });
    stick(700, 980, { ...WALT, s: 1.3, pose: 'stand', face: 'smile', look: 1 });
    const zoom = easeInOut(prog(t, wt('B07', 'ruth') - 0.3, 1.0));
    at(lerp(1300, 1250, zoom), lerp(640, 560, zoom), lerp(0.9, 1.6, zoom), () => {
      photoFrame(0, 0, 1, (cx, cy) => stick(cx, cy + 40, { ...RUTH, s: 0.42, pose: 'stand', face: 'smile', bob: 0 }));
    });
    if (zoom > 0.6) text('Ruth — 31 years on the line', 1250, 860, { size: 44, font: 'Patrick Hand', weight: 'normal', alpha: prog(t, wt('B07', 'ruth') + 0.6, 0.4) });
    text('Ruth is fictional too.', W / 2, 1000, { size: 24, font: 'Patrick Hand', weight: 'normal', color: P.grey, alpha: 0.7 * prog(t, wt('B07', 'ruth') + 0.8, 0.5), wobble: false });
  });

  S(ts('B08') - 0.3, L1, 1970, (lt, t) => {
    // a falling "go-go" chart (illustrative), then three solid certificates
    const box = { x: 160, y: 220, w: 760, h: 560 };
    line(box.x, box.y + box.h, box.x + box.w, box.y + box.h, { w: 5 }); line(box.x, box.y, box.x, box.y + box.h, { w: 5 });
    const pts = []; for (let i = 0; i <= 40; i++) { const f = i / 40; const v = f < 0.55 ? 0.15 + f * 1.4 + Math.sin(i * 1.7) * 0.05 : 0.92 - (f - 0.55) * 1.7 + Math.sin(i * 2.1) * 0.04; pts.push([box.x + f * box.w, box.y + box.h - v * box.h]); }
    const p = prog(t, ts('B08') + 0.2, 3.2);
    path(pts, { w: 7, color: P.red, p, amp: 1 });
    if (p > 0 && p < 1) pen(...tipOf(pts, p));
    text('1960s "go-go" stocks', box.x + 20, box.y + 30, { size: 40, align: 'left' });
    text('illustrative', box.x + box.w - 10, box.y + box.h + 36, { size: 24, font: 'Patrick Hand', weight: 'normal', color: P.grey, align: 'right', wobble: false });
    const ot = wt('B08', 'opposite');
    ['BIG', 'FAMOUS', 'DEPENDABLE'].forEach((w, i) => {
      const s = pop(t, ot + 0.6 + i * 0.55);
      certificate(1420, 280 + i * 250, 0.72 * s, { rot: (i - 1) * 0.03, seal: P.yellow });
      if (s > 0.9) text(w, 1420, 276 + i * 250, { size: 52, color: P.ink });
    });
  });

  S(ts('B09') - 0.3, L1, 1972, (lt, t) => {
    const src = [['Bank trust departments', 260, 'bank'], ['Pension funds', 540, 'pension'], ['Mutual funds', 820, 'mutual']];
    src.forEach(([lab, y, w], i) => {
      const a = pop(t, wt('B09', w));
      at(380, y, a, () => { rect(-240, -60, 480, 120, { fill: '#fff', w: 5, seed: 340 + i }); text(lab, 0, 4, { size: 40 }); });
      if (a > 0.9) { const pts = [[630, y], [900, y], [1200, 540]]; const p = prog(t, wt('B09', w) + 0.3, 0.9); path(pts, { w: 6, p, color: P.ink }); if (p > 0 && p < 1) pen(...tipOf(pts, p), 0.9); }
    });
    const ct = wt('B09', 'same');
    for (let i = 0; i < 5; i++) certificate(1470 + (i % 2) * 40, 400 + i * 50, 0.6 * pop(t, ct + i * 0.12), { rot: (i - 2) * 0.05 });
    if (t > ct) text('the same few dozen names', 1500, 860, { size: 40, font: 'Patrick Hand', weight: 'normal', alpha: prog(t, ct + 0.6, 0.4) });
  });

  S(ts('B10') - 0.3, L1, 1972, (lt, t) => {
    text('No official list', 960, 150, { size: 48, color: P.grey, alpha: prog(t, ts('B10'), 0.5) });
    const names = [['IBM', 'ibm'], ['Coca-Cola', 'coca'], ["McDonald's", 'mcdonald'], ['Disney', 'disney'], ['Xerox', 'xerox'], ['Avon', 'avon'], ['Philip Morris', 'philip']];
    const pol = wt('B10', 'polaroid');
    const shrink = easeInOut(prog(t, pol - 0.2, 0.6));
    names.forEach(([n, w], i) => {
      const s = pop(t, wt('B10', w) - 0.05);
      const x = 260 + (i % 4) * 460, y = 330 + Math.floor(i / 4) * 280;
      certificate(lerp(x, 180 + i * 260, shrink), lerp(y, 920, shrink), lerp(0.85, 0.5, shrink) * s, { rot: ((i % 3) - 1) * 0.03 });
      if (s > 0.9) text(n, lerp(x, 180 + i * 260, shrink), lerp(y, 920, shrink) - 4, { size: lerp(48, 30, shrink), maxW: lerp(290, 170, shrink) });
    });
    if (t > pol - 0.2) {
      certificate(700, 460, 1.0 * pop(t, pol), { rot: -0.03 });
      if (pop(t, pol) > 0.9) text('Polaroid', 700, 456, { size: 58 });
      // the SX-70 ejects a print that develops
      const ej = prog(t, wt('B10', 'sx') + 0.2, 1.2), dev = prog(t, wt('B10', 'developed'), 2.0);
      at(1300, 360, pop(t, wt('B10', 'sx') - 0.2), () => {
        rect(-170, -110, 340, 200, { fill: '#e8e2d2', w: 5, seed: 351 }); circle(-40, -10, 60, { fill: '#333', w: 5 }); circle(-40, -10, 28, { fill: '#666', w: 3 });
        rect(80, -90, 60, 40, { fill: '#999', w: 3 }); text('SX-70', 110, 60, { size: 28, font: 'Patrick Hand', weight: 'normal' });
        if (ej > 0) {
          const y = 90 + ej * 150;
          rect(-110, y - 60, 220, 250, { fill: '#fff', w: 4, seed: 352 });
          g().fillStyle = `rgba(60,55,50,${1 - dev})`; g().fillRect(-90, y - 40, 180, 170);
          if (dev > 0.2) { const c = g(); c.save(); c.globalAlpha *= dev; stick(0, y + 150, { ...WALT, s: 0.32, face: 'grin', bob: 0 }); c.restore(); }
        }
      });
    }
  });
  names10Cues();
  function names10Cues() { ['ibm', 'coca', 'mcdonald', 'disney', 'xerox', 'avon', 'philip', 'polaroid'].forEach((w) => cue(wt('B10', w), 'pop', 0.18)); }

  S(ts('B11') - 0.3, L1, 1972, (lt, t) => {
    const swipe = prog(t, ts('B11') + 0.3, 0.6);
    g().save(); g().fillStyle = P.yellow; g().globalAlpha = 0.85; g().fillRect(500, 270, 920 * swipe, 110); g().restore();
    text('ONE-DECISION STOCKS', 960, 330, { size: 92 });
    at(760, 620, pop(t, wt('B11', 'buy')), () => { rect(-40, -40, 80, 80, { fill: '#fff', w: 5 }); path([[-24, 0], [-6, 22], [30, -30]], { w: 9, color: P.ink, p: prog(t, wt('B11', 'buy') + 0.2, 0.3) }); text('Buy', 80, 4, { size: 72, align: 'left' }); });
    at(760, 780, pop(t, wt('B11', 'never') - 0.2), () => { rect(-40, -40, 80, 80, { fill: '#f0ece3', w: 5, color: P.grey }); text('Sell', 80, 4, { size: 72, align: 'left', color: P.grey }); line(70, 6, 260, 6, { w: 6, color: P.grey, p: prog(t, wt('B11', 'never'), 0.4) }); text('never', 300, 4, { size: 48, align: 'left', color: P.grey, font: 'Patrick Hand', weight: 'normal' }); });
    briefcase(1450, 690, 0.8, { locked: true });
  });
  cue(wt('B11', 'buy'), 'pop', 0.25);

  S(ts('B12') - 0.3, L1, 1972, (lt, t) => {
    stick(470, GY, { ...WALT, s: 1.35, pose: 'stand', face: 'grin' });
    briefcase(700, GY - 70, 0.42, { locked: true });
    const box = { x: 960, y: 260, w: 800, h: 520 };
    line(box.x, box.y + box.h, box.x + box.w, box.y + box.h, { w: 5 });
    const pts = []; for (let i = 0; i <= 30; i++) { const f = i / 30; pts.push([box.x + f * box.w, box.y + box.h - (0.15 + f * 0.7 + Math.sin(i * 1.9) * 0.03) * box.h]); }
    const p = prog(t, wt('B12', 'while') - 0.5, 2.4);
    path(pts, { w: 7, p }); if (p > 0 && p < 1) pen(...tipOf(pts, p));
    text('illustrative', box.x + box.w, box.y + box.h + 34, { size: 24, font: 'Patrick Hand', weight: 'normal', color: P.grey, align: 'right', wobble: false });
  });

  // ================= PART 2 =================
  const L2 = 'PART 2 · THE PRICE';
  S(ts('B13') - 0.6, L2, 1972, (lt, t) => {
    const p = prog(t, wt('B13', 'price') - 0.4, 1.0);
    text('P/E', 960, 420, { size: 260, alpha: Math.min(1, p * 2) });
    if (p > 0 && p < 0.6) pen(860 + p * 340, 470);
    text('Price ÷ Earnings', 960, 640, { size: 80, font: 'Patrick Hand', weight: 'normal', alpha: prog(t, wt('B13', 'ratio'), 0.5) });
    text('how much hope is built into a price', 960, 760, { size: 40, color: P.grey, font: 'Patrick Hand', weight: 'normal', alpha: prog(t, wt('B13', 'hope'), 0.6) });
  }, 'wipe');

  S(ts('B14') - 0.3, L2, 1972, (lt, t) => {
    at(420, 420, pop(t, wt('B14', 'earns')), () => { rect(-160, -110, 320, 220, { fill: '#fff', w: 5 }); text('COMPANY', 0, -60, { size: 40 }); coin(0, 30, 50, '$1'); text('profit / year', 0, 140, { size: 30, font: 'Patrick Hand', weight: 'normal' }); });
    priceTag(1060, 400, 1.2 * pop(t, wt('B14', 'costs')), '$15');
    if (t > wt('B14', '15', 2) - 0.2) text('$15 ÷ $1 = 15', 960, 700, { size: 110, alpha: prog(t, wt('B14', '15', 2) - 0.2, 0.4) });
    const ct = wt('B14', 'paying');
    if (t > ct) { const n = Math.min(15, Math.floor(prog(t, ct, 2.4) * 15) + 1); for (let i = 0; i < n; i++) coin(1450 + (i % 5) * 70, 900 - Math.floor(i / 5) * 60, 30); text(`${n} × $1`, 1620, 720, { size: 48 }); }
  });

  const peT0 = ts('B15') - 0.3;
  const bars = [
    { name: 'S&P 500', v: 19, lab: '≈19×', t: wt('B15', '19'), col: P.light },
    { name: "McDonald's", v: 86, lab: '≈86×', t: wt('B16', 'mcdonald'), col: '#d8bf8c' },
    { name: 'Polaroid', v: 91, lab: '90+×', t: wt('B16', 'polaroid'), col: '#d8bf8c' },
    { name: 'Nifty Fifty avg.', v: 42, lab: '≈42×', t: wt('B17', 'average'), col: P.yellow },
  ];
  const peChart = (lt, t, extra) => {
    const base = 860, top = 250, x0 = 360;
    text('P/E ratio, end of 1972', 960, 150, { size: 60 });
    const ax = prog(t, peT0, 0.8);
    line(x0 - 40, base, lerp(x0 - 40, 1700, ax), base, { w: 5 }); line(x0 - 40, base, x0 - 40, lerp(base, top - 20, ax), { w: 5 });
    [25, 50, 75, 100].forEach((v) => { const y = base - (v / 100) * (base - top); line(x0 - 52, y, x0 - 28, y, { w: 3 }); text(String(v), x0 - 62, y, { size: 26, align: 'right', font: 'Patrick Hand', weight: 'normal', alpha: ax }); });
    bars.forEach((b, i) => {
      const k = easeOut(prog(t, b.t, 0.9)); if (k <= 0) return;
      const cx = x0 + 110 + i * 330, h = (b.v / 100) * (base - top) * k;
      rect(cx - 100, base - h, 200, h, { fill: b.col, w: 5, seed: 400 + i });
      if (k < 1) pen(cx + 100, base - h);
      if (k > 0.7) text(b.lab, cx, base - h - 44, { size: 56, alpha: (k - 0.7) / 0.3 });
      text(b.name, cx, base + 44, { size: 36, font: 'Patrick Hand', weight: 'normal' });
    });
    extra?.(t);
    source(W, H, 'Sources: J. Siegel (1998); Fesenmaier & Smith (2002). Polaroid: 94.8 on estimated earnings, 90.7 on trailing earnings.');
  };
  S(peT0, L2, 1972, (lt, t) => peChart(lt, t, (t) => {
    const dt = wt('B17', 'double');
    if (t > dt - 0.2) { const x0 = 470, x1 = 1460, y = 280; path([[x0, 700], [x0, y], [x1, y], [x1, 650]], { w: 5, color: P.ink, p: prog(t, dt - 0.2, 0.6) }); at(965, y - 40, pop(t, dt + 0.3), () => text('about double', 0, 0, { size: 52, color: P.ink })); }
  }));
  cue(wt('B15', '19'), 'pop', 0.18); cue(wt('B16', 'mcdonald'), 'pop', 0.18); cue(wt('B16', 'polaroid'), 'pop', 0.22); cue(wt('B17', 'average'), 'pop', 0.2); cue(wt('B17', 'double'), 'ding', 0.25);

  S(ts('B18') - 0.3, L2, 1972, (lt, t) => {
    text('Polaroid at 90+ times earnings', 960, 170, { size: 60 });
    const p = prog(t, ts('B18') + 0.5, (wt('B18', 'price', 2) - ts('B18')) - 0.4);
    const n = 92, cols = 23, cw = 66, ch = 66, x0 = 960 - (cols * cw) / 2, y0 = 300;
    const shown = Math.floor(p * n);
    for (let i = 0; i < shown; i++) {
      const x = x0 + (i % cols) * cw, y = y0 + Math.floor(i / cols) * (ch + 22);
      rect(x, y, cw - 8, ch - 8, { fill: i === 0 ? P.yellow : '#fff', w: 3, seed: 500 + i });
      if (i % cols === 0 || i === shown - 1) text(String(1973 + i), x + (cw - 8) / 2, y + ch + 4, { size: 18, font: 'Patrick Hand', weight: 'normal', color: P.grey, wobble: false });
    }
    if (p > 0 && p < 1) { const i = shown; pen(x0 + (i % cols) * cw + 20, y0 + Math.floor(i / cols) * (ch + 22) + 30, 0.9); }
    text('each box = one year of 1972 profits', 960, 760, { size: 40, font: 'Patrick Hand', weight: 'normal', alpha: prog(t, ts('B18') + 1.5, 0.5) });
    const dt = wt('B18', 'decades');
    if (t > dt - 0.4) text('only works if profits grow fast, for decades, without stumbling', 960, 860, { size: 44, color: P.red, alpha: prog(t, dt - 0.4, 0.5) });
  });

  S(ts('B19') - 0.3, L2, 1972, (lt, t) => {
    line(80, 760, W - 80, 760, { w: 6, color: '#6b4a2e', seed: 531 });
    stick(560, 980, { ...WALT, s: 1.3, pose: t > wt('B19', 'decided') ? 'shrug' : 'think', face: t > wt('B19', 'decided') ? 'smile' : 'flat', look: 1 });
    const slide = easeInOut(prog(t, wt('B19', 'decided') - 0.2, 0.6));
    at(lerp(1100, 1700, slide), 640, 0.6, () => peChart(0, t + 100), lerp(0, 0.3, slide), 1 - slide * 0.7);
    if (t > wt('B19', 'decided')) {
      at(1050, 420, pop(t, wt('B19', 'quality')), () => { rect(-300, -90, 600, 180, { fill: '#fff8c4', w: 5, seed: 532 }); text('Quality is worth', 0, -24, { size: 50, font: 'Patrick Hand', weight: 'normal' }); text('any price.', 0, 40, { size: 50, font: 'Patrick Hand', weight: 'normal' }); }, -0.04);
    }
  });

  S(ts('B20') - 0.3, L2, 1973, (lt, t) => {
    const k = easeInOut(prog(t, wt('B20', 'two') - 0.3, 0.8));
    rect(360, 220, 1200, 280, { fill: '#fff', w: 5, seed: 541 }); rect(360, 560, 1200, 280, { fill: '#f0ece3', w: 5, color: P.grey, seed: 542 });
    text('"Two-tier market"', 960, 160, { size: 60, alpha: k });
    text('The favorites · P/E 40, 60, 90+', 960, 300, { size: 52, alpha: prog(t, wt('B20', 'club'), 0.5) });
    for (let i = 0; i < 6; i++) certificate(520 + i * 180, 420, 0.32 * pop(t, wt('B20', 'club') + i * 0.08));
    text('Everything else · P/E around 19', 960, 640, { size: 52, color: P.grey, alpha: prog(t, wt('B20', 'everything'), 0.5) });
    for (let i = 0; i < 9; i++) rect(470 + i * 115, 720, 90, 70, { fill: '#e6e1d6', w: 3, color: P.grey, seed: 543 + i, alpha: prog(t, wt('B20', 'everything') + i * 0.05, 0.3) });
    const wr = wt('B20', 'wrong');
    if (t > wr - 0.4) domino(1700, 560, 1.4, null, prog(t, te('B20') + 0.3, 0.6));
    source(W, H, 'Term used in the press by 1973 (e.g. Fortune, June 1973; U.S. Senate hearings, July 1973)');
  });
  cue(te('B20') + 0.5, 'thud', 0.3);

  // ================= PART 3 =================
  const L3 = 'PART 3 · THE DOMINOES';
  const DOM = [['GOLD', 'B21'], ['INFLATION', 'B22'], ['OIL', 'B23'], ['RATES', 'B24'], ['RECESSION', 'B26'], ['WATERGATE', 'B26', 'watergate']];
  const domFall = (i) => { const [, id, w] = DOM[i]; const t0 = w ? wt(id, w) : ts(id) + 0.4; return t0; };
  DOM.forEach((d, i) => cue(domFall(i) + 0.1, 'thud', 0.18));
  const dominoRow = (t) => {
    DOM.forEach(([lab], i) => domino(330 + i * 230, 250, 0.7, lab, prog(t, domFall(i), 0.6), { seed: i }));
  };
  const part3 = (start, year, draw, tr = 'fade') => S(start, L3, year, (lt, t) => { dominoRow(t); draw(lt, t); }, tr);

  part3(ts('B21') - 0.8, 1971, (lt, t) => {
    tv(560, 650, 0.95, (cx, cy) => {
      rect(cx - 70, cy + 20, 140, 140, { fill: '#8b6a4a', w: 4 }); circle(cx, cy + 80, 28, { fill: '#e8d9a8', w: 3 }); text('★', cx, cy + 82, { size: 28, color: '#8b6a4a', wobble: false });
      circle(cx, cy - 40, 40, { fill: '#555', w: 0 }); rect(cx - 50, cy - 5, 100, 40, { fill: '#555', w: 0 });
      text('PRESIDENTIAL ADDRESS', cx, cy + 190, { size: 22, font: 'Patrick Hand', weight: 'normal', wobble: false });
    });
    text('AUG 15, 1971', 560, 400, { size: 44 });
    const gt = wt('B21', 'gold');
    const br = prog(t, gt, 0.5);
    goldBar(1180 - br * 60, 600, 1.1, -br * 0.2); dollar(1640 + br * 60, 600, 1.0, br * 0.2);
    chain(1280, 600, 1540, 600, br);
    text('dollar no longer convertible to gold for foreign governments', 1410, 720, { size: 30, font: 'Patrick Hand', weight: 'normal', alpha: prog(t, gt + 0.4, 0.5), maxW: 760 });
    const et = wt('B21', 'early');
    if (t > et) text('Early 1973: fixed exchange rates collapse', 1410, 820, { size: 42, color: P.red, alpha: prog(t, et, 0.5) });
    source(W, H, 'Source: Federal Reserve History');
  }, 'wipe');
  cue(wt('B21', 'gold'), 'crash', 0.18);

  part3(ts('B22') - 0.3, 1973, (lt, t) => {
    thermometer(560, 720, 1.05, lerp(0.2, 0.55, easeInOut(prog(t, ts('B22'), te('B22') - ts('B22')))));
    text('INFLATION', 560, 360, { size: 54, color: P.red });
    [['Loose money', 'loose'], ['Global food prices', 'food'], ['End of wage & price controls', 'controls']].forEach(([lab, w], i) => {
      at(1250, 470 + i * 140, pop(t, wt('B22', w) - 0.1), () => { rect(-330, -50, 660, 100, { fill: '#fff', w: 4, seed: 600 + i }); text(lab, 0, 4, { size: 44 }); });
      if (t > wt('B22', w)) arrow(910, 470 + i * 140, 680, 600, { p: prog(t, wt('B22', w), 0.4), head: 22, w: 5 });
    });
  });

  part3(ts('B23') - 0.3, 1973, (lt, t) => {
    const lt2 = wt('B23', 'lines');
    if (t < lt2 - 0.2) {
      // teletype strip
      const msg = 'OCT 1973 — ARAB OIL PRODUCERS ANNOUNCE EMBARGO ON U.S.';
      const n = Math.floor(prog(t, ts('B23') + 0.3, 2.4) * msg.length);
      rect(160, 410, 1600, 80, { fill: '#fffdf2', w: 4, seed: 611 });
      text(msg.slice(0, n), 190, 452, { size: 38, align: 'left', font: 'Patrick Hand', weight: 'normal', wobble: false });
      barrel(560, 760, 1.15);
      const q = wt('B23', 'quadrupled');
      const k = easeInOut(prog(t, q - 0.2, 1.2));
      priceTag(900, 690, 1.15, k < 0.5 ? '$2.90' : '$11.65', { color: k < 0.5 ? P.ink : P.red });
      text('per barrel', 1000, 790, { size: 34, font: 'Patrick Hand', weight: 'normal' });
      if (k > 0.5) for (let i = 0; i < 3; i++) barrel(1350 + i * 170, 780, 0.75 * pop(t, q + 0.3 + i * 0.15));
      if (k > 0.5) text('≈ ×4 by Jan 1974', 1520, 600, { size: 46, color: P.red, alpha: prog(t, q + 0.8, 0.4) });
    } else {
      line(80, GY, W - 80, GY, { w: 5, color: P.grey });
      for (let i = 0; i < 7; i++) car(300 + i * 250 - easeOut(prog(t, lt2, 3)) * 40, GY - 22, 0.95, i);
      at(1720, GY, 1, () => { line(0, 0, 0, -260, { w: 8 }); rect(-150, -420, 300, 160, { fill: '#fff', w: 5 }); text('SORRY', 0, -370, { size: 46, color: P.red }); text('NO GAS', 0, -310, { size: 46 }); });
    }
    source(W, H, 'Source: Federal Reserve History ($2.90 before the embargo, $11.65 in Jan 1974)');
  });

  part3(ts('B24') - 0.3, 1974, (lt, t) => {
    thermometer(560, 720, 1.05, lerp(0.55, 0.95, easeInOut(prog(t, ts('B24'), 3))));
    text('INFLATION', 560, 360, { size: 54, color: P.red });
    at(780, 420, pop(t, wt('B24', '12')), () => text('+12.3% (Dec 1974)', 0, 0, { size: 50, color: P.red, align: 'left' }));
    const ft = wt('B24', 'federal');
    dial(1400, 640, 1.2, lerp(0.35, 0.92, easeInOut(prog(t, ft + 0.3, 1.4))), 'INTEREST RATES');
    text('FEDERAL RESERVE', 1400, 430, { size: 40, alpha: prog(t, ft, 0.4) });
    source(W, H, 'Sources: Economic Report of the President (CPI-U); Federal Reserve (FRED)');
  });
  cue(wt('B24', 'federal') + 0.3, 'swoosh', 0.2);

  part3(ts('B25') - 0.3, 1974, (lt, t) => {
    const r = easeInOut(prog(t, wt('B25', 'rise'), 1.4));
    const yrs = [0, 10, 20, 30];
    if (t < wt('B25', 'higher') - 0.6) {
      text('What future profits are worth today', 960, 380, { size: 50 });
      yrs.forEach((y, i) => {
        const rad = 70 * Math.pow(lerp(0.93, 0.86, r), y);
        coin(380 + i * 400, 620, Math.max(10, rad), i === 0 ? '$1' : '');
        text(y === 0 ? 'today' : `in ${y} yrs`, 380 + i * 400, 760, { size: 36, font: 'Patrick Hand', weight: 'normal' });
      });
      text(r > 0.5 ? 'higher interest rates' : 'lower interest rates', 960, 860, { size: 40, color: r > 0.5 ? P.red : P.grey });
    } else {
      const k = prog(t, wt('B25', 'higher') - 0.6, 0.8);
      const base = 860;
      [['P/E 19', 0.28, 700], ['P/E 90+', 0.9, 1220]].forEach(([lab, hgt, x], i) => {
        const h = 560 * hgt * easeOut(k);
        rect(x - 110, base - h, 220, h, { fill: i ? '#d8bf8c' : P.light, w: 5, seed: 640 + i });
        text(lab, x, base + 44, { size: 44 });
        if (k > 0.8) { path([[x + 140, base - h], [x + 140, base]], { w: 5, color: P.red, p: prog(t, wt('B25', 'further') - 0.2, 0.6) }); }
      });
      line(500, base, 1420, base, { w: 5 });
      if (t > wt('B25', 'further')) text('further to fall', 1520, 520, { size: 52, color: P.red, align: 'left', alpha: prog(t, wt('B25', 'further'), 0.4) });
    }
  });

  part3(ts('B26') - 0.3, 1974, (lt, t) => {
    const wg = wt('B26', 'watergate');
    if (t < wg - 0.3) {
      factory(700, 820, 1.4, 1 - prog(t, ts('B26') + 1.5, 1.5));
      at(1300, 640, pop(t, ts('B26') + 1.2), () => { rect(-200, -60, 400, 120, { fill: '#fff', w: 5 }); text('CLOSED', 0, 4, { size: 64, color: P.red }); }, 0.05);
      text('Recession begins, Nov 1973', 960, 960, { size: 40, font: 'Patrick Hand', weight: 'normal' });
    } else {
      newspaper(960, 640, 0.95 * pop(t, wg - 0.3, 0.45), 'THE DAILY LEDGER', 'FRIDAY, AUGUST 9, 1974', 'NIXON RESIGNS', { rot: -0.02 });
      text('fictional masthead', 1340, 960, { size: 22, font: 'Patrick Hand', weight: 'normal', color: P.grey, wobble: false });
    }
    source(W, H, 'Source: NBER business cycle dates');
  });
  cue(wt('B26', 'watergate') - 0.2, 'slap', 0.25);

  part3(ts('B27') - 0.3, 1974, (lt, t) => {
    line(80, 900, W - 80, 900, { w: 6, color: '#6b4a2e' });
    letter(1000, 610, 0.92, ['Dear Walt,', '', 'Is my pension safe?', '', '        Ruth'], { reveal: prog(t, ts('B27') + 0.6, 3), rot: -0.03 });
    at(420, 640, 1, () => photoFrame(0, 0, 0.8, (cx, cy) => stick(cx, cy + 40, { ...RUTH, s: 0.42, face: 'worried', bob: 0 })));
    text('Ruth is fictional.', W / 2, 1000, { size: 22, font: 'Patrick Hand', weight: 'normal', color: P.grey, alpha: 0.6, wobble: false });
  });

  // ================= PART 4 =================
  const L4 = 'PART 4 · THE FALL';
  S(ts('B28') - 0.8, L4, 1974, (lt, t) => {
    const box = { x: 240, y: 230, w: 1440, h: 560 }, lo = 55, hi = 125;
    line(box.x, box.y + box.h, box.x + box.w, box.y + box.h, { w: 5 }); line(box.x, box.y, box.x, box.y + box.h, { w: 5 });
    [60, 80, 100, 120].forEach((v) => { const y = box.y + box.h - ((v - lo) / (hi - lo)) * box.h; line(box.x - 14, y, box.x, y, { w: 3 }); text(String(v), box.x - 24, y, { size: 26, align: 'right', font: 'Patrick Hand', weight: 'normal' }); });
    const pts = CRASH.map((v, i) => [box.x + (i / (CRASH.length - 1)) * box.w, box.y + box.h - ((v - lo) / (hi - lo)) * box.h]);
    const p = prog(t, wt('B28', 'january') - 0.3, wt('B28', 'october') - wt('B28', 'january') + 0.6);
    path(pts, { w: 8, color: P.red, p, amp: 0.8 });
    if (p > 0 && p < 1) pen(...tipOf(pts, p));
    text('S&P 500', box.x + 20, box.y - 30, { size: 48, align: 'left' });
    text('Jan 1973', box.x, box.y + box.h + 40, { size: 30, font: 'Patrick Hand', weight: 'normal', align: 'left' });
    text('Oct 1974', box.x + box.w, box.y + box.h + 40, { size: 30, font: 'Patrick Hand', weight: 'normal', align: 'right' });
    if (p > 0.02) text('120.24 · Jan 11, 1973', pts[0][0] + 20, pts[0][1] - 30, { size: 34, align: 'left' });
    if (p >= 1) {
      const lp = pts[pts.length - 1];
      text('62.28 · Oct 3, 1974', lp[0] - 10, lp[1] + 46, { size: 34, align: 'right' });
      at(1150, 330, pop(t, wt('B28', '48') - 0.1), () => text('−48%', 0, 0, { size: 130, color: P.red, font: 'Permanent Marker', weight: 'normal' }), -0.06);
    }
    if (t > wt('B28', 'worst')) text('worst bear market since the 1930s', 960, 960, { size: 40, alpha: prog(t, wt('B28', 'worst'), 0.4) });
    source(W, H, 'Source: S&P Dow Jones Indices (peak and low exact; monthly path approximate)');
  }, 'wipe');
  cue(wt('B28', '48'), 'sting', 0.3); shakes.push({ t: wt('B28', '48'), amp: 8, dur: 0.5 });

  S(ts('B29') - 0.3, L4, 1974, (lt, t) => {
    text('Each from its own peak', 960, 160, { size: 52, color: P.grey });
    [['Xerox', 0.71, 'xerox'], ['Avon', 0.86, 'avon'], ['Polaroid', 0.91, 'polaroid']].forEach(([n, l, w], i) => {
      const x = 400 + i * 560, d = easeInOut(prog(t, wt('B29', w) + 0.1, 1.3));
      certificate(x, 520, 1.05, { fill: 1 - l * d, seed: 700 + i, rot: (i - 1) * 0.02 });
      text(n, x, 516, { size: 56 });
      if (d > 0.6) at(x, 800, pop(t, wt('B29', w) + 0.9), () => text(`−${Math.round(l * 100)}%`, 0, 0, { size: 92, color: P.red, font: 'Permanent Marker', weight: 'normal' }));
    });
    source(W, H, 'Peak-to-trough falls as commonly cited; each stock measured from its own high');
  });
  ['xerox', 'avon', 'polaroid'].forEach((w) => cue(wt('B29', w) + 0.3, 'thud', 0.22));

  S(ts('B30') - 0.3, L4, 1974, (lt, t) => {
    line(960, 180, 960, 920, { w: 4, color: P.grey });
    text('The business', 480, 220, { size: 56 });
    rect(300, 420, 360, 220, { fill: '#fff', w: 5 }); text('OPEN', 480, 470, { size: 48 });
    for (let i = 0; i < 4; i++) circle(330 + i * 90, 720 + Math.sin(lt * 3 + i) * 4, 34, { fill: P.head, w: 4, color: P.grey });
    text('still selling', 480, 860, { size: 40, font: 'Patrick Hand', weight: 'normal' });
    text('The price', 1440, 220, { size: 56 });
    const k = easeInOut(prog(t, wt('B30', 'collapsed') - 0.2, 1.6));
    priceTag(1400, 560, lerp(1.6, 0.6, k), '$$$', { color: k > 0.5 ? P.red : P.ink, rot: 0.12 + k * 0.3 });
    text('what investors would pay', 1440, 860, { size: 40, font: 'Patrick Hand', weight: 'normal', alpha: prog(t, wt('B30', 'willing'), 0.5) });
  });

  S(ts('B31') - 0.3, L4, 1974, (lt, t) => {
    g().save(); g().fillStyle = 'rgba(60,50,40,0.10)'; g().fillRect(0, 0, W, H); g().restore();
    text('OCTOBER 1974', 160, 170, { size: 56, align: 'left' });
    line(80, 780, W - 80, 780, { w: 6, color: '#6b4a2e' });
    stick(520, 1000, { ...WALT, s: 1.3, pose: 'stand', face: 'worried', look: 1 });
    // the boss at the door, grey
    const bt = wt('B31', 'boss');
    if (t > bt - 0.3) { stick(1700, 1000, { s: 1.25, pose: 'pointL', face: 'angry', color: P.grey, hair: 'neat', hairColor: P.grey, skin: P.head, seed: 21 }); at(1560, 300, pop(t, bt), () => { rect(-110, -50, 220, 100, { fill: '#fff', w: 4, color: P.grey }); text('SELL!', 0, 4, { size: 54, color: P.grey }); }); }
    briefcase(1000, 690, 0.6, { locked: true });
    const kt = wt('B31', 'key');
    if (t > kt - 0.3) key(1000, 520 - Math.sin(t * 2) * 6, 0.8 * pop(t, kt - 0.3), -0.3);
    const q = wt('B31', 'what');
    if (t > wt('B31', 'sell', 1) - 0.2) {
      at(820, 900, pop(t, wt('B31', 'sell', 1) - 0.2), () => { rect(-130, -50, 260, 100, { fill: '#fff', w: 5 }); text('SELL', 0, 4, { size: 56 }); });
      at(1180, 900, pop(t, wt('B31', 'hold') - 0.2), () => { rect(-130, -50, 260, 100, { fill: '#fff', w: 5 }); text('HOLD', 0, 4, { size: 56 }); });
    }
    if (t > q) text('What would you do?', 960, 300, { size: 80, alpha: prog(t, q, 0.5) });
  });
  cue(wt('B31', 'what'), 'heartbeat', 0.25);

  const rec = recoverySeries();
  S(ts('B32') - 0.3, L4, 1980, (lt, t) => {
    const box = { x: 220, y: 200, w: 1380, h: 620 }, y0v = 40, y1v = 340, x0y = 1973, x1y = 1986;
    const X = (yr) => box.x + ((yr - x0y) / (x1y - x0y)) * box.w, Y = (v) => box.y + box.h - ((Math.min(v, y1v) - y0v) / (y1v - y0v)) * box.h;
    line(box.x, box.y + box.h, box.x + box.w, box.y + box.h, { w: 5 }); line(box.x, box.y, box.x, box.y + box.h, { w: 5 });
    [1973, 1976, 1980, 1985].forEach((yr) => text(String(yr), X(yr), box.y + box.h + 36, { size: 28, font: 'Patrick Hand', weight: 'normal' }));
    [50, 100, 200, 300].forEach((v) => text(String(v), box.x - 20, Y(v), { size: 24, align: 'right', font: 'Patrick Hand', weight: 'normal', color: P.grey }));
    path([[X(1973), Y(100)], [X(1986), Y(100)]], { w: 3, color: P.grey });
    text('Jan 1973 peak = 100', X(1973) + 12, Y(100) - 22, { size: 26, align: 'left', font: 'Patrick Hand', weight: 'normal', color: P.grey });
    const series = [
      { d: rec.price, col: P.ink, lab: 'Price only', t: wt('B32', 'price'), mark: [1980.55, 'Jul 1980'] },
      { d: rec.nom, col: P.grey, lab: 'With dividends', t: wt('B32', 'dividends'), mark: [1976.5, '≈1976'] },
      { d: rec.real, col: P.red, lab: 'After inflation', t: wt('B32', 'inflation'), mark: [1985.0, '≈1985'] },
    ];
    series.forEach((s, i) => {
      const pts = s.d.map(([yr, v]) => [X(yr), Y(v)]);
      const p = prog(t, s.t - 0.2, 2.0);
      path(pts, { w: i === 2 ? 8 : 6, color: s.col, p, amp: 0.6 });
      if (p > 0 && p < 1) pen(...tipOf(pts, p));
      if (p >= 1) {
        const last = pts[pts.length - 1]; text(s.lab, last[0] + 16, last[1] + (i === 1 ? 0 : i === 0 ? -6 : 22), { size: 30, color: s.col, align: 'left' });
        const mx = X(s.mark[0]), my = Y(100);
        circle(mx, my, 12, { fill: s.col, w: 0 }); text(s.mark[1], mx, my + (i === 1 ? -40 : 44) , { size: 30, color: s.col });
      }
    });
    if (t > wt('B32', '12')) at(1300, 300, pop(t, wt('B32', '12')), () => text('≈ 12 years', 0, 0, { size: 92, color: P.red, font: 'Permanent Marker', weight: 'normal' }), -0.05);
    source(W, H, 'S&P 500 annual price and total-return data, CPI-U (Dec to Dec); approximate, year-end points');
  }, 'wipe');

  // ================= PART 5 =================
  const L5 = 'PART 5 · THE ARGUMENT';
  S(ts('B33') - 0.8, L5, 1998, (lt, t) => {
    text('Were the Nifty Fifty', 960, 340, { size: 90, alpha: prog(t, ts('B33'), 0.6) });
    text('a terrible investment?', 960, 450, { size: 90, alpha: prog(t, ts('B33') + 0.5, 0.6) });
    const et = wt('B33', 'economists');
    [['Siegel', '1998', 620], ['Fesenmaier & Smith', '2002', 1300]].forEach(([n, y, x], i) => at(x, 720, pop(t, et + i * 0.3), () => { rect(-280, -90, 560, 180, { fill: '#f1e4c6', w: 5, seed: 800 + i }); text(n, 0, -16, { size: 50 }); text(y, 0, 46, { size: 36, font: 'Patrick Hand', weight: 'normal' }); }, (i ? 0.03 : -0.03)));
  }, 'wipe');

  S(ts('B34') - 0.3, L5, 1998, (lt, t) => {
    text('Jeremy Siegel (Wharton), 1998', 960, 150, { size: 56 });
    text('Bought at the end of 1972, held through August 1998', 960, 220, { size: 36, font: 'Patrick Hand', weight: 'normal', color: P.grey });
    const rows = [['Nifty Fifty', 12.2, wt('B34', '12', 1), '#d8bf8c'], ['S&P 500', 12.7, wt('B34', '12', 2), P.light]];
    rows.forEach(([n, v, t0, col], i) => {
      const k = easeOut(prog(t, t0 - 0.2, 1.0)), y = 420 + i * 200, w = (v / 14) * 1100 * k;
      text(n, 440, y, { size: 46, align: 'right' });
      rect(480, y - 55, w, 110, { fill: col, w: 5, seed: 810 + i });
      if (k < 1 && k > 0) pen(480 + w, y - 55);
      if (k > 0.8) text(`${v}% a year`, 500 + w, y, { size: 50, align: 'left' });
    });
    if (t > wt('B34', 'close')) text('Close, but still behind.', 960, 860, { size: 64, alpha: prog(t, wt('B34', 'close'), 0.4) });
    source(W, H, 'Siegel, "Valuing Growth Stocks: Revisiting the Nifty Fifty" (1998), as reported');
  });

  S(ts('B35') - 0.3, L5, 1998, (lt, t) => {
    certificate(700, 520, 1.3, { rot: -0.02 }); text('Philip Morris', 700, 516, { size: 60 });
    priceTag(1150, 300, 1.1 * pop(t, wt('B35', '24') - 0.2), 'P/E ≈24', { glow: 1, size: 44 });
    if (t > wt('B35', 'best')) { arrow(1100, 820, 1600, 420, { p: prog(t, wt('B35', 'best') - 0.2, 0.8), color: P.ink, w: 8, head: 36 }); text('one of the best stocks of the era', 1380, 900, { size: 42, alpha: prog(t, wt('B35', 'best') + 0.4, 0.4) }); }
    text('one of the cheaper names', 1150, 420, { size: 34, font: 'Patrick Hand', weight: 'normal', alpha: prog(t, wt('B35', 'cheaper'), 0.4) });
    source(W, H, 'Siegel (1998), as reported');
  });

  S(ts('B36') - 0.3, L5, 2001, (lt, t) => {
    text('Fesenmaier & Smith, 2002', 960, 150, { size: 56 });
    const lt0 = wt('B36', 'two');
    if (t < wt('B36', 'roughly') - 0.8) {
      // two lists, overlap highlighted
      [[660, 'List A (1972)'], [1120, 'List B (1972)']].forEach(([x, lab], i) => at(x, 560, pop(t, lt0 - 0.2 + i * 0.25), () => {
        rect(-260, -280, 520, 560, { fill: '#fff', w: 5, seed: 820 + i, alpha: 0.95 });
        text(lab, 0, -230, { size: 40 });
        for (let r = 0; r < 9; r++) line(-200, -160 + r * 50, 200, -160 + r * 50, { w: 3, color: P.grey });
      }, (i ? 0.03 : -0.03)));
      if (t > wt('B36', 'core') - 0.5) { g().save(); g().fillStyle = 'rgba(245,197,24,0.45)'; g().fillRect(860, 330, 200, 460); g().restore(); text('24 stocks on both', 960, 860, { size: 46, alpha: prog(t, wt('B36', 'core') - 0.5, 0.4) }); }
    } else {
      text('Wealth at the end of 2001 (S&P 500 = 100)', 960, 260, { size: 42, font: 'Patrick Hand', weight: 'normal' });
      const k = easeOut(prog(t, wt('B36', 'roughly') - 0.6, 1.0));
      [['S&P 500', 100, P.light], ['The 24 "core" favorites', 50, P.red]].forEach(([n, v, col], i) => {
        const y = 460 + i * 220, w = (v / 100) * 1000 * (i ? k : 1);
        text(n, 560, y, { size: 44, align: 'right' }); rect(600, y - 60, w, 120, { fill: col, w: 5, seed: 830 + i, alpha: i ? 0.85 : 1 });
        if (i && k < 1) pen(600 + w, y - 60);
        if (!i || k > 0.8) text(i ? '≈ half' : '100', 620 + w, y, { size: 54, align: 'left', color: i ? P.red : P.ink });
      });
    }
    source(W, H, 'Fesenmaier & Smith, "The Nifty-Fifty Re-Revisited", Journal of Investing (2002), as reported');
  });

  S(ts('B37') - 0.3, L5, 2001, (lt, t) => {
    const k = prog(t, ts('B37') + 0.5, 2.5);
    certificate(960, 500, 1.6, { alpha: 1 - 0.55 * k, rot: -0.02 }); text('Polaroid', 960, 496, { size: 80, alpha: 1 - 0.55 * k });
    at(980, 640, pop(t, wt('B37', 'bankruptcy') - 0.2), () => { rect(-330, -70, 660, 140, { w: 9, color: P.red }); text('BANKRUPTCY · 2001', 0, 6, { size: 66, color: P.red, font: 'Permanent Marker', weight: 'normal' }); }, -0.1);
  });
  cue(wt('B37', 'bankruptcy'), 'thud', 0.3);

  S(ts('B38') - 0.3, L5, 2001, (lt, t) => {
    const ox = 520, oy = 820, w = 900, h = 520;
    line(ox, oy, ox + w, oy, { w: 5 }); line(ox, oy, ox, oy - h, { w: 5 });
    text('P/E paid in 1972 →', ox + w, oy + 50, { size: 38, align: 'right' });
    text('Return afterward →', ox - 30, oy - h / 2, { size: 38, rot: -Math.PI / 2 });
    const p = prog(t, wt('B38', 'more') - 0.3, 1.6);
    const pts = [[ox + 80, oy - h + 80], [ox + w - 60, oy - 90]];
    path(pts, { w: 8, color: P.red, p }); if (p > 0 && p < 1) pen(...tipOf(pts, p));
    text('the direction both studies agree on', ox + w / 2, oy - h - 40, { size: 40, alpha: prog(t, wt('B38', 'agree'), 0.5) });
    text('schematic, not data', ox + w, oy + 92, { size: 24, font: 'Patrick Hand', weight: 'normal', color: P.grey, align: 'right', wobble: false });
  });

  // ================= PART 6 =================
  const L6 = 'PART 6 · TODAY';
  S(ts('B39') - 0.8, L6, 2026, (lt, t) => {
    text('S&P 500: share held by the 10 largest companies', 960, 170, { size: 52 });
    const k = easeOut(prog(t, wt('B39', '38') - 0.5, 1.2));
    const x0 = 520, ww = 1200;
    text('Today', x0 - 30, 420, { size: 46, align: 'right' });
    rect(x0, 360, ww, 120, { fill: '#fff', w: 5, seed: 900 });
    g().save(); g().fillStyle = P.yellow; g().fillRect(x0 + 4, 364, (ww - 8) * 0.378 * k, 112); g().restore();
    if (k > 0.9) text('≈ 38%', x0 + ww * 0.378 + 20, 420, { size: 56, align: 'left' });
    text('(S&P Dow Jones Indices, Sep 2026)', x0 + ww, 520, { size: 26, font: 'Patrick Hand', weight: 'normal', color: P.grey, align: 'right', wobble: false });
    const t2 = wt('B40', 'estimates');
    if (t > t2 - 0.3) {
      const a = prog(t, t2 - 0.3, 0.5);
      text('Early 1970s', x0 - 30, 680, { size: 46, align: 'right', alpha: a });
      rect(x0, 620, ww, 120, { fill: '#fff', w: 5, seed: 901, alpha: a });
      g().save(); g().globalAlpha = a * 0.55; g().fillStyle = P.grey; g().fillRect(x0 + 4, 624, (ww - 8) * 0.22, 112); g().globalAlpha = a * 0.25; g().fillRect(x0 + 4 + (ww - 8) * 0.22, 624, (ww - 8) * 0.08, 112); g().restore();
      text('≈ 22–30% (estimates vary)', x0 + ww * 0.30 + 20, 680, { size: 44, align: 'left', alpha: a });
    }
    if (t > wt('B40', 'heavy') - 0.2) text('more top-heavy now', 960, 880, { size: 60, color: P.ink, alpha: prog(t, wt('B40', 'heavy') - 0.2, 0.4) });
    source(W, H, 'Sources: S&P Dow Jones Indices (Sep 2026); historical estimates for 1972–73 vary by method');
  }, 'wipe');

  S(ts('B41') - 0.3, L6, 2026, (lt, t) => {
    for (let i = 0; i < 10; i++) { const h = 300 + hash(i, 4) * 260; rect(980 + i * 82, 860 - h * pop(t, ts('B41') + i * 0.06), 64, h * pop(t, ts('B41') + i * 0.06), { fill: '#fff', w: 4, seed: 910 + i }); }
    text("Today's giants", 1390, 220, { size: 48 });
    const so = wt('B41', 'so');
    for (let i = 0; i < 5; i++) certificate(300 + (i % 3) * 170, 420 + Math.floor(i / 3) * 230, 0.42, { alpha: prog(t, so - 0.2, 0.6) * 0.8, rot: (i - 2) * 0.04 });
    text('1972', 470, 220, { size: 48, color: P.grey, alpha: prog(t, so - 0.2, 0.6) });
    line(80, 860, W - 80, 860, { w: 4, color: P.grey });
  });

  S(ts('B42') - 0.3, L6, 2026, (lt, t) => {
    text('Not a prediction.', 960, 300, { size: 84, alpha: prog(t, ts('B42'), 0.5) });
    text('Nobody can time a market turn.', 960, 420, { size: 48, font: 'Patrick Hand', weight: 'normal', alpha: prog(t, wt('B42', 'nobody'), 0.5) });
    const qt = wt('B42', 'question');
    if (t > qt - 0.3) { priceTag(960, 680, 1.2 * pop(t, qt - 0.3), '?', { glow: 0.9 + 0.1 * Math.sin(t * 3) }); }
  });

  // ================= ENDING =================
  S(ts('B43') - 1.0, 'EPILOGUE', 1985, (lt, t) => {
    text('1985', 160, 170, { size: 64, color: P.grey, align: 'left' });
    line(80, 780, W - 80, 780, { w: 6, color: '#6b4a2e' });
    stick(520, 1000, { ...WALT_OLD, s: 1.3, pose: 'stand', face: 'flat', look: 1 });
    letter(1150, 520, 0.8, ['Dear Ruth,', '', 'I know now what went', 'wrong in 1972.', '', '        Walt'], { reveal: prog(t, ts('B43') + 0.4, 4), rot: 0.02 });
  }, 'wipe');

  S(ts('B44') - 0.3, 'EPILOGUE', 1985, (lt, t) => {
    briefcase(560, 640, 1.05, { locked: false, open: 0.9 });
    text('ONE-DECISION STOCKS', 560, 260, { size: 56, color: P.grey });
    const bt = wt('B44', 'buy'), st = wt('B44', 'sell');
    if (t > bt - 0.2) { text('BUY', 1180, 380, { size: 90 }); line(1090, 384, 1270, 376, { w: 8, color: P.grey, p: prog(t, bt + 0.4, 0.3) }); }
    if (t > st - 0.2) { text('SELL', 1500, 380, { size: 90 }); line(1400, 384, 1600, 376, { w: 8, color: P.grey, p: prog(t, st + 0.4, 0.3) }); }
    const pt = wt('B44', 'how');
    if (t > pt - 0.2) priceTag(1310, 680, 1.6 * pop(t, pt - 0.2), 'P/E', { glow: prog(t, wt('B44', 'pay') - 0.3, 0.6), rot: 0.1 + Math.sin(t * 2) * 0.05 });
  });
  cue(wt('B44', 'pay'), 'ding', 0.3);

  S(ts('B45') - 0.3, 'EPILOGUE', 2026, (lt, t) => {
    const p = prog(t, ts('B45') + 0.2, 2.6);
    text('Before you buy a "sure thing", ask:', 960, 360, { size: 60, alpha: Math.min(1, p * 2) });
    g().save(); g().fillStyle = P.yellow; g().globalAlpha = 0.85; g().fillRect(300, 470, 1320 * prog(t, wt('B45', 'paying') - 0.3, 0.8), 120); g().restore();
    text('What am I paying for each $1 it earns?', 960, 530, { size: 72 });
  });

  S(ts('B46') - 0.3, null, 2026, (lt, t) => {
    text('Market history, drawn by hand.', 960, 380, { size: 90, alpha: prog(t, ts('B46'), 0.5) });
    at(960, 560, pop(t, ts('B46') + 1.4), () => { rect(-200, -55, 400, 110, { fill: P.red, w: 5 }); text('SUBSCRIBE', 0, 4, { size: 56, color: '#fff' }); });
    text('Walt and Ruth are fictional composites. Sources are listed in the description.', 960, 820, { size: 32, font: 'Patrick Hand', weight: 'normal', color: P.grey, alpha: prog(t, ts('B46') + 2, 0.5), wobble: false });
    text('Education only. Not financial advice.', 960, 870, { size: 32, font: 'Patrick Hand', weight: 'normal', color: P.grey, alpha: prog(t, ts('B46') + 2.2, 0.5), wobble: false });
  });

  scenes.sort((a, b) => a.start - b.start);
  const sceneAt = (t) => { let i = 0; while (i + 1 < scenes.length && t >= scenes[i + 1].start) i++; return scenes[i]; };
  const SEPIA_END = ts('B33') - 0.8, EPI_START = ts('B43') - 1.0, EPI_END = ts('B45') - 0.3;
  const mixHex = (a, b, k) => { const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16)); return '#' + pa.map((v, i) => Math.round(lerp(v, pb[i], k)).toString(16).padStart(2, '0')).join(''); };
  const paperAt = (t) => {
    let k = 1; // 1 = sepia
    if (t > SEPIA_END) k = 1 - prog(t, SEPIA_END, 1.0);
    if (t > EPI_START) k = prog(t, EPI_START, 1.0);
    if (t > EPI_END) k = 1 - prog(t, EPI_END, 1.0);
    return mixHex(P.paper, P.sepia, k);
  };
  let yr = 1972;
  const overlay = (t) => {
    const s = sceneAt(t);
    const target = s.year;
    yr = target; // marker jumps with the story; eased by drawing a short tween
    const show = s.label ? 1 : 0;
    dateRibbon(W, H, target, show * 0.9);
  };

  // subtitles (.srt) from beats, split into sentences, timed by character share
  const srt = []; let n = 1;
  const fmt = (x) => { const ms = Math.round(x * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s2 = Math.floor(ms / 1000) % 60, r = ms % 1000; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s2).padStart(2, '0')},${String(r).padStart(3, '0')}`; };
  for (const b of beats) {
    const parts = b.text.replace(/P E/g, 'P/E').replace(/S and P/g, 'S&P').match(/[^.?!]+[.?!]?/g).map((x) => x.trim()).filter(Boolean);
    const total = parts.reduce((a, p) => a + p.length, 0); let cur = b.s;
    for (const p of parts) { const d = (b.e - b.s) * (p.length / total); srt.push(`${n++}\n${fmt(cur)} --> ${fmt(cur + d)}\n${p}\n`); cur += d; }
  }

  return { scenes, sfx, shakes, flashes, duration: DURATION, overlay, paperAt, subtitles: srt.join('\n') };
}

export function captions() { return []; }
