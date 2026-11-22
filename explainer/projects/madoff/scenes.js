// "Bernie Madoff: The $65 Billion Lie" — vertical Short in the house style
// (cream paper, chalkboards, stick figures, stamps, word-by-word captions).
import { C, text, line, path, rect, circle, ellipse, at, pop, prog, easeOut, easeInOut, lerp, hash, scribbleCircle, arrow, g } from '../../engine.js';
import { stick, money, board, chartLine, bubble, stamp, ground } from '../../kit.js';
import { priceTag, newspaper, coin, padlock } from '../../kit2.js';

export const LAYOUT = { w: 1080, h: 1920, captions: true, headerY: 168, camY: 0.42 };
export const OFFSET = 0;
const W = 1080, GY = 1250;

const NARRATOR = { glasses: true, tie: C.green, hair: 'messy', seed: 3, s: 1.2 };
const MADOFF = { hair: 'neat', hairColor: '#b9b4ab', tie: '#2b2b2b', tieW: 10, seed: 41, s: 1.2 };
const note = (s, y = 1222) => text(s, W / 2, y, { size: 22, font: 'Patrick Hand', weight: 'normal', color: '#7a6a4a', wobble: false, maxW: 1000 });

export function build(words, beats) {
  const B = Object.fromEntries(beats.map((b) => [b.id, b]));
  const ts = (id) => B[id].s, te = (id) => B[id].e;
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const SPOKEN = { '65': 'sixty-five', '1': 'one', '150': 'one hundred fifty', '17': 'seventeen', '15': 'fifteen' };
  const wt = (id, w, nth = 1) => {
    const b = B[id]; let n = 0;
    for (const x of words) { if (x.s < b.s - 0.25 || x.s > b.e + 0.25) continue; if (norm(x.w).startsWith(norm(w)) && ++n === nth) return x.s; }
    const needle = (SPOKEN[w] || w).toLowerCase(); let i = -1;
    for (let k = 0; k < nth; k++) { i = b.text.toLowerCase().indexOf(needle, i + 1); if (i < 0) break; }
    return i < 0 ? b.s : b.s + (b.e - b.s) * (i / b.text.length);
  };
  const DURATION = Math.ceil((te('B13') + 3.2) * 10) / 10;
  const sfx = []; const cue = (t, name, gain = 0.3) => sfx.push({ t, name, gain });
  const shakes = []; const flashes = [];
  const scenes = [];
  const L = 'THE $65 BILLION LIE';
  const S = (start, draw, tr = 'slide', label = L) => scenes.push({ start, label, draw, tr });

  // ---- 1. the statement ----
  S(0, (lt, t) => {
    const k = easeOut(prog(t, 0.2, Math.max(1, wt('B01', 'billion') - 0.2)));
    const fake = prog(t, wt('B01', 'almost') - 0.1, 0.8);
    at(540, 720, 1, () => {
      rect(-400, -380, 800, 760, { fill: '#fff', w: 5 });
      text('ACCOUNT STATEMENTS', 0, -320, { size: 44 });
      text('all Madoff clients, Nov 2008', 0, -268, { size: 30, font: 'Patrick Hand', weight: 'normal', color: '#7a756c' });
      for (let i = 0; i < 6; i++) { line(-340, -190 + i * 60, 120, -190 + i * 60, { w: 3, color: '#c9c4ba' }); text('$' + (Math.round(hash(i, 3) * 900 + 100)) + ',000,000', 340, -192 + i * 60, { size: 30, align: 'right', font: 'Patrick Hand', weight: 'normal', alpha: 1 - fake * 0.8 }); }
      line(-340, 200, 340, 200, { w: 5 });
      text('TOTAL', -340, 270, { size: 50, align: 'left' });
      const v = Math.round(lerp(0, 65, k));
      text(`$${v},000,000,000`, 340, 270, { size: 58, align: 'right', color: k >= 1 ? C.ink : C.ink, alpha: 1 - fake * 0.55 });
    });
    if (fake > 0) stamp(560, 820, 'NOT REAL', pop(t, wt('B01', 'almost') + 0.2, 0.3) * (1.5 - 0.5 * prog(t, wt('B01', 'almost') + 0.2, 0.3)), -0.18);
    note('Illustration. Statements showed about $65 billion in total.', 1150);
  }, 'cut', null);
  cue(wt('B01', 'almost') + 0.2, 'stomp', 0.45); shakes.push({ t: wt('B01', 'almost') + 0.2, amp: 14, dur: 0.5 });

  // ---- 2. title ----
  S(ts('B02') - 0.2, (lt, t) => {
    at(540, 560, pop(t, ts('B02') + 0.1), () => { text('THE $65', 0, -90, { size: 150 }); text('BILLION LIE', 0, 70, { size: 150, color: C.red }); });
    text('Bernie Madoff', 540, 820, { size: 70, font: 'Patrick Hand', weight: 'normal', alpha: prog(t, wt('B02', 'madoff') - 0.2, 0.4) });
    // a pyramid of stick heads
    const rows = 5; const k = prog(t, wt('B02', 'ponzi') - 0.3, 1.0);
    for (let r = 0; r < rows; r++) for (let c = 0; c <= r; c++) { const i = r * (r + 1) / 2 + c; if (i / 15 > k) continue; circle(540 + (c - r / 2) * 90, 930 + r * 62, 24, { fill: C.skin, w: 3, seed: 600 + i }); }
  });
  cue(ts('B02') + 0.1, 'thud', 0.45);

  // ---- 3. the insider ----
  S(ts('B03') - 0.3, (lt, t) => {
    const b = board(70, 260, 940, 380);
    text('NASDAQ', 540, b.y + 110, { size: 120, color: C.chalk });
    text('stock market', 540, b.y + 230, { size: 48, color: C.chalk, font: 'Patrick Hand', weight: 'normal' });
    ground(GY);
    stick(380, GY, { ...MADOFF, pose: 'stand', face: 'smile', look: 0.5 });
    rect(560, 960, 380, 230, { fill: '#8b6a4a', w: 5 }); text('CHAIRMAN', 750, 1050, { size: 50, color: '#fff3d6' });
    text('(three one-year terms)', 750, 1120, { size: 30, font: 'Patrick Hand', weight: 'normal', color: '#fff3d6' });
    if (t > wt('B03', 'insider') - 0.2) at(760, 780, pop(t, wt('B03', 'insider') - 0.2), () => { bubble(-230, -80, 460, 150, -230, 160); text('Wall Street insider', 0, -4, { size: 44 }); });
  });

  // ---- 4. too smooth ----
  const smooth = [], bumpy = [];
  for (let i = 0; i <= 40; i++) { smooth.push(0.12 + i * 0.019); bumpy.push(0.15 + i * 0.016 + Math.sin(i * 0.9) * 0.08 + (hash(i, 9) - 0.5) * 0.12 - (i > 26 && i < 31 ? 0.12 : 0)); }
  S(ts('B04') - 0.3, (lt, t) => {
    const b = board(70, 260, 940, 640);
    const box = { x: b.x + 20, y: b.y + 90, w: b.w - 40, h: b.h - 150 };
    chartLine(box, bumpy, { lo: 0, hi: 1, p: prog(t, ts('B04') + 0.2, 2.0), color: '#c9c4ba', w: 5 });
    chartLine(box, smooth, { lo: 0, hi: 1, p: prog(t, wt('B04', 'percent') - 0.4, 2.2), color: C.yellow, w: 9 });
    text('a normal market', b.x + 30, b.y + 40, { size: 36, align: 'left', color: '#c9c4ba', font: 'Patrick Hand', weight: 'normal' });
    text("Madoff's reported returns", b.x + 30, b.y + 84, { size: 38, align: 'left', color: C.yellow, alpha: prog(t, wt('B04', 'percent') - 0.4, 0.5) });
    text('illustrative', b.x + b.w - 20, b.y + b.h - 22, { size: 26, align: 'right', color: C.chalk, font: 'Patrick Hand', weight: 'normal' });
    if (t > wt('B04', 'percent')) at(540, 1040, pop(t, wt('B04', 'percent')), () => text('~1% a month', 0, 0, { size: 90 }));
    if (t > wt('B04', 'losing')) text('almost never a losing month', 540, 1150, { size: 46, color: C.red, alpha: prog(t, wt('B04', 'losing'), 0.4) });
  });

  S(ts('B05') - 0.2, (lt, t, X) => {
    ground(GY);
    stick(300, GY, { ...NARRATOR, pose: 'point', face: 'smile', talk: X.talk(t), look: 1 });
    padlock(760, 640, 1.6);
    stamp(720, 1000, 'LOOKS SAFE', pop(t, wt('B05', 'safe') - 0.2, 0.3) * 0.7, -0.08);
  });
  cue(wt('B05', 'safe'), 'stomp', 0.35);

  // ---- 5. how a Ponzi works ----
  S(ts('B06') - 0.3, (lt, t) => {
    text('How it really worked', 540, 300, { size: 64 });
    const claimT = wt('B06', 'trading'), noT = wt('B06', 'wasn'), oldT = wt('B06', 'old'), ponziT = wt('B06', 'ponzi');
    if (t < oldT - 0.3) {
      at(540, 520, pop(t, claimT - 0.4), () => { rect(-330, -80, 660, 160, { fill: '#fff', w: 5 }); text('Claimed: stock & option trades', 0, 4, { size: 44 }); });
      if (t > noT) { line(230, 520, 850, 520, { w: 9, color: C.red, p: prog(t, noT, 0.4) }); at(540, 700, pop(t, noT + 0.2), () => text('No real trades', 0, 0, { size: 80, color: C.red })); }
      stick(540, GY, { ...MADOFF, pose: 'shrug', face: 'smile' });
    } else {
      // the money loop: new investors -> Madoff -> old investors
      at(540, 760, 1, () => { rect(-140, -110, 280, 220, { fill: '#6b4a2e', w: 5 }); text('MADOFF', 0, -4, { size: 50, color: '#fff3d6' }); });
      for (let i = 0; i < 3; i++) stick(840 + (i % 2) * 90, 1240 - i * 10, { s: 0.55, seed: 70 + i, face: 'grin', bob: 0.6 });
      text('NEW investors', 870, 960, { size: 40, color: C.green });
      for (let i = 0; i < 3; i++) stick(170 + (i % 2) * 90, 1240 - i * 10, { s: 0.55, seed: 80 + i, face: 'grin', bob: 0.6 });
      text('OLD investors', 220, 960, { size: 40 });
      arrow(800, 900, 680, 800, { color: C.green, p: prog(t, oldT, 0.5), w: 8 });
      arrow(400, 800, 280, 900, { color: C.ink, p: prog(t, oldT + 0.6, 0.5), w: 8 });
      const flow = prog(t, oldT + 0.3, 30);
      for (let i = 0; i < 6; i++) { const f = ((lt * 0.6 + i / 6) % 1); const pIn = f < 0.5; const x = pIn ? lerp(850, 600, f * 2) : lerp(480, 230, (f - 0.5) * 2); const y = pIn ? lerp(1000, 780, f * 2) : lerp(780, 1000, (f - 0.5) * 2); if (flow > 0) coin(x, y, 22, '$'); }
      if (t > ponziT - 0.2) stamp(540, 470, 'PONZI SCHEME', pop(t, ponziT - 0.2, 0.3) * 0.8, -0.06);
    }
  });
  cue(wt('B06', 'wasn'), 'thud', 0.35); cue(wt('B06', 'ponzi') - 0.2, 'stomp', 0.45);

  // ---- 6. why the rich trusted him ----
  S(ts('B07') - 0.3, (lt, t) => {
    const fT = wt('B07', 'funds');
    ground(GY);
    if (t < fT - 0.3) {
      text('Why did smart money trust him?', 540, 300, { size: 54 });
      // velvet rope and an invitation-only sign
      for (const x of [300, 780]) { line(x, GY, x, GY - 200, { w: 10, color: '#c9a227' }); circle(x, GY - 210, 18, { fill: '#c9a227', w: 3 }); }
      path([[300, GY - 180], [420, GY - 120], [540, GY - 110], [660, GY - 120], [780, GY - 180]], { w: 12, color: '#a3122a' });
      at(540, 640, pop(t, wt('B07', 'invest') - 0.2), () => { rect(-280, -110, 560, 220, { fill: '#fff8e6', w: 6 }); text('BY INVITATION', 0, -30, { size: 64 }); text('ONLY', 0, 50, { size: 64, color: C.red }); });
      for (let i = 0; i < 4; i++) stick(160 + i * 260 + (i > 1 ? 120 : -60), GY, { s: 0.6, seed: 90 + i, pose: i === 1 ? 'hold' : 'stand', face: t > wt('B07', 'turned') ? 'worried' : 'smile' });
      if (t > wt('B07', 'club')) text('country clubs · charity boards', 540, 860, { size: 44, color: '#7a756c', alpha: prog(t, wt('B07', 'club'), 0.4) });
    } else {
      text('Feeder funds', 540, 320, { size: 70 });
      [[250, 'Fund A'], [540, 'Fund B'], [830, 'Fund C']].forEach(([x, lab], i) => at(x, 520, pop(t, fT - 0.2 + i * 0.15), () => { path([[-120, -70], [120, -70], [30, 70], [-30, 70]], { close: true, fill: '#fff', w: 5 }); text(lab, 0, -24, { size: 36 }); }));
      for (let i = 0; i < 3; i++) arrow(250 + i * 290, 620, 540, 880, { p: prog(t, fT + 0.3, 0.6), color: C.green, w: 7 });
      at(540, 980, 1, () => { rect(-140, -90, 280, 180, { fill: '#6b4a2e', w: 5 }); text('MADOFF', 0, -4, { size: 48, color: '#fff3d6' }); });
      if (t > wt('B07', 'fees')) for (let i = 0; i < 3; i++) priceTag(250 + i * 290, 420, 0.6 * pop(t, wt('B07', 'fees') + i * 0.1), 'fees', { rot: -0.2 });
    }
  });

  // ---- 7. the warnings ----
  S(ts('B08') - 0.3, (lt, t) => {
    const audT = wt('B08', 'auditor'), missT = wt('B08', 'missed');
    ground(GY);
    if (t < audT - 0.3) {
      stick(260, GY, { glasses: false, hair: 'messy', hairColor: '#5a3b22', tie: C.green, seed: 51, s: 1.1, pose: 'hold', face: 'worried' });
      text('Harry Markopolos', 260, 640, { size: 46 });
      at(780, 760, 1, () => { rect(-200, -220, 400, 440, { fill: '#fff', w: 5 }); text('SEC', 0, -140, { size: 90 }); for (let i = 0; i < 3; i++) rect(-150 + i * 105, -50, 80, 230, { fill: '#ece7dc', w: 3 }); });
      const n = Math.floor(prog(t, wt('B08', 'markopolos'), 3.0) * 6);
      for (let i = 0; i < n; i++) at(540 + i * 6, 1160 - i * 26, 1, () => rect(-80, -14, 160, 28, { fill: '#fff', w: 3, seed: 700 + i }));
      if (t > wt('B08', 'impossible') - 0.3) at(540, 400, pop(t, wt('B08', 'impossible') - 0.3), () => { rect(-330, -90, 660, 180, { fill: '#fff3a8', w: 5 }); text('"The World\'s Largest', 0, -30, { size: 44 }); text('Hedge Fund is a Fraud"', 0, 34, { size: 44 }); }, -0.03);
      note('Markopolos memo to the SEC, 2005', 1290);
    } else {
      // the strip-mall auditor
      rect(120, 640, 840, 420, { fill: '#efe8da', w: 5 });
      for (let i = 0; i < 4; i++) rect(150 + i * 205, 760, 180, 260, { fill: i === 2 ? '#fff' : '#d9d2c4', w: 4, seed: 720 + i });
      text('PIZZA', 240, 720, { size: 32 }); text('NAILS', 445, 720, { size: 32 }); text('AUDITOR', 650, 720, { size: 32, color: C.red }); text('DRY CLEAN', 855, 720, { size: 30 });
      stick(650, 1010, { s: 0.42, seed: 61, face: 'flat', bob: 0.3 });
      text("Madoff's auditor: a tiny firm", 540, 400, { size: 52, alpha: prog(t, audT - 0.3, 0.4) });
      text('in a suburban strip mall', 540, 470, { size: 52, alpha: prog(t, audT, 0.4) });
      if (t > missT - 0.2) stamp(540, 1160, 'SEC MISSED IT', pop(t, missT - 0.2, 0.3) * 0.7, -0.07);
    }
  });
  cue(wt('B08', 'missed'), 'stomp', 0.4);

  // ---- 8. the collapse ----
  const crash08 = [1.0, 0.98, 0.97, 0.95, 0.96, 0.93, 0.9, 0.86, 0.88, 0.8, 0.7, 0.62, 0.66, 0.58];
  S(ts('B09') - 0.3, (lt, t) => {
    const b = board(70, 260, 940, 520);
    text('2008', b.x + 20, b.y + 34, { size: 56, align: 'left', color: C.chalk });
    chartLine({ x: b.x + 20, y: b.y + 80, w: b.w - 40, h: b.h - 120 }, crash08, { lo: 0.5, hi: 1.02, p: prog(t, ts('B09') + 0.2, 1.8), color: '#ff7b7b', w: 8 });
    text('financial crisis', b.x + b.w - 20, b.y + 40, { size: 34, align: 'right', color: C.chalk, font: 'Patrick Hand', weight: 'normal' });
    ground(GY);
    const rT = wt('B09', 'rushed');
    for (let i = 0; i < 6; i++) stick(140 + i * 160 + Math.sin(lt * 5 + i) * 6, GY, { s: 0.6, seed: 100 + i, pose: t > rT ? 'cheer' : 'stand', face: t > rT ? 'shout' : 'worried' });
    if (t > rT) at(540, 880, pop(t, rT), () => { bubble(-260, -70, 520, 140, 0, 130); text('WE WANT OUR MONEY', 0, 4, { size: 44 }); });
    if (t > wt('B09', 'nothing') - 0.2) stamp(540, 1040, 'EMPTY', pop(t, wt('B09', 'nothing') - 0.2, 0.3) * 0.8, -0.1);
  });
  cue(wt('B09', 'nothing'), 'crash', 0.4);

  S(ts('B10') - 0.3, (lt, t) => {
    const arrT = wt('B10', 'next');
    ground(GY);
    if (t < arrT - 0.3) {
      text('December 10, 2008', 540, 320, { size: 64 });
      stick(300, GY, { ...MADOFF, pose: 'sad', face: 'sad' });
      stick(700, GY, { s: 1.0, seed: 111, hair: 'neat', hairColor: '#3b2a1e', tie: '#555', face: t > wt('B10', 'lie') ? 'shock' : 'flat' });
      stick(880, GY, { s: 0.95, seed: 112, hair: 'messy', hairColor: '#3b2a1e', tie: '#777', face: t > wt('B10', 'lie') ? 'shock' : 'flat' });
      text('his sons', 790, 760, { size: 40, color: '#7a756c' });
      if (t > wt('B10', 'all') - 0.3) at(420, 560, pop(t, wt('B10', 'all') - 0.3), () => { bubble(-280, -90, 560, 180, -80, 200); text('"one big lie"', 0, 4, { size: 66, color: C.red }); });
      note('Quoted words from the U.S. Attorney\'s complaint, Dec 2008', 1290);
    } else {
      newspaper(540, 760, 1.25 * pop(t, arrT - 0.3, 0.45), 'THE DAILY LEDGER', 'DECEMBER 12, 2008', 'MADOFF\nARRESTED', { rot: (1 - easeOut(prog(t, arrT - 0.3, 0.6))) * Math.PI * 3 - 0.02 });
      note('fictional masthead · arrested by the FBI on Dec 11, 2008', 1290);
    }
  });
  cue(wt('B10', 'lie'), 'sting', 0.35); cue(wt('B10', 'next') - 0.2, 'swoosh', 0.35);

  // ---- 9. the real loss ----
  S(ts('B11') - 0.3, (lt, t) => {
    text('What was really lost', 540, 300, { size: 66 });
    const base = 1140, top = 500, H = base - top, sc = (v) => (v / 65) * H;
    const pT = wt('B11', 'paper'), cT = wt('B11', 'cash'), rT = wt('B11', 'recovered');
    // $65B on paper: dashed, mostly empty
    const k1 = easeOut(prog(t, wt('B11', '65') - 0.3, 0.9));
    if (k1 > 0) { g().save(); g().setLineDash([18, 14]); g().strokeStyle = C.ink; g().lineWidth = 5; g().strokeRect(150, base - sc(65) * k1, 220, sc(65) * k1); g().restore(); text('$65B', 260, base - sc(65) * k1 - 40, { size: 60 }); }
    text('on paper', 260, base + 44, { size: 40 });
    if (t > pT) text('mostly fake profits', 260, 640, { size: 34, color: '#7a756c', alpha: prog(t, pT, 0.4), maxW: 220 });
    const k2 = easeOut(prog(t, cT - 0.2, 0.9));
    if (k2 > 0) { rect(430, base - sc(17.5) * k2, 220, sc(17.5) * k2, { fill: '#f08a8a', w: 5 }); text('$17.5B', 540, base - sc(17.5) * k2 - 40, { size: 60, color: C.red }); }
    text('cash lost', 540, base + 44, { size: 40 });
    const k3 = easeOut(prog(t, rT - 0.2, 1.0));
    if (k3 > 0) { rect(710, base - sc(15.3) * k3, 220, sc(15.3) * k3, { fill: '#a7c4a0', w: 5 }); text('$15B+', 820, base - sc(15.3) * k3 - 40, { size: 60, color: C.green }); }
    text('recovered', 820, base + 44, { size: 40 });
    line(110, base, 970, base, { w: 6 });
    note('Source: SIPA Trustee for Madoff Securities (recoveries through Dec 31, 2025)', 1232);
  });

  // ---- 10. ending ----
  S(ts('B12') - 0.3, (lt, t) => {
    ground(GY);
    stick(540, GY, { ...MADOFF, pose: 'sad', face: 'sad' });
    for (let i = 0; i < 8; i++) line(160 + i * 110, 300, 160 + i * 110, GY, { w: 12, color: '#6f6a64' });
    line(140, 300, 940, 300, { w: 14, color: '#6f6a64' });
    stamp(540, 560, '150 YEARS', pop(t, wt('B12', '150') - 0.1, 0.3) * 0.85, -0.08);
    if (t > wt('B12', 'died')) text('died in prison, 2021', 540, 1180, { size: 50, alpha: prog(t, wt('B12', 'died'), 0.4) });
  });
  cue(wt('B12', '150'), 'stomp', 0.45);

  S(ts('B13') - 0.3, (lt, t, X) => {
    const b = board(70, 260, 940, 460);
    chartLine({ x: b.x + 30, y: b.y + 60, w: b.w - 60, h: b.h - 120 }, smooth, { lo: 0, hi: 1, color: C.yellow, w: 9 });
    text('too smooth?', b.x + 30, b.y + 40, { size: 46, align: 'left', color: C.yellow });
    ground(GY);
    stick(300, GY, { ...NARRATOR, pose: 'think', face: 'flat', talk: X.talk(t), look: 1 });
    if (t > wt('B13', 'ask') - 0.2) at(700, 1060, pop(t, wt('B13', 'ask') - 0.2), () => { rect(-290, -120, 580, 240, { fill: '#fff3a8', w: 5 }); text('Who is checking', 0, -36, { size: 56 }); text('the books?', 0, 44, { size: 56, color: C.red }); }, -0.04);
    if (t > te('B13') + 0.3) at(540, 880, pop(t, te('B13') + 0.3), () => { rect(-210, -60, 420, 120, { fill: C.red, w: 5 }); text('FOLLOW', 0, 4, { size: 60, color: '#fff' }); });
  });

  scenes.sort((a, b) => a.start - b.start);
  return { scenes, sfx, shakes, flashes, duration: DURATION };
}

export function captions(words) {
  const toks = [];
  for (const w of words) {
    const s = w.w;
    if (toks.length && /^[-&%.,]/.test(s) && !/^[.,]$/.test(s)) { const p = toks[toks.length - 1]; p.w += s; p.e = w.e; continue; }
    toks.push({ ...w });
  }
  const groups = []; let cur = [];
  for (const t of toks) { cur.push(t); const len = cur.map((x) => x.w).join(' ').length; if (/[.,?!]$/.test(t.w) || cur.length >= 3 || len > 15) { groups.push(cur); cur = []; } }
  if (cur.length) groups.push(cur);
  return groups.map((gp) => ({ s: gp[0].s, e: gp[gp.length - 1].e, words: gp.map((x) => ({ w: x.w.replace(/[.,]$/, ''), s: x.s, e: x.e })) }));
}
