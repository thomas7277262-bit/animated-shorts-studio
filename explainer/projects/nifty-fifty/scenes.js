// "The 1973 Crash Nobody Remembers" — 90 s vertical explainer.
// Scenes are timed to the narrator's words (words.json, word-level timestamps).
import { C, W, path, line, circle, rect, text, at, pop, prog, easeOut, easeInOut, scribbleCircle, arrow, lerp, hash, g } from '../../engine.js';
import { stick, money, board, chartLine, pointAt, bubble, certificate, newspaper, stamp, ground, cloud, bolt, goldBar, barrel, calendar, trophy, priceTag, thermometer, pie, megaphone } from '../../kit.js';

export const DURATION = 90;
export const OFFSET = 0.5; // voice starts 0.5 s into the video
const GY = 1250; // ground line

const NARRATOR = { glasses: true, tie: C.green, hair: 'messy', seed: 3, s: 1.2 };
const BANKER = { hat: 'top', mustache: true, tie: C.red, hair: 'neat', seed: 7, s: 1.15 };
const MODERN = { hat: 'cap', capColor: C.blue, hair: 'messy', seed: 11, s: 1.15 };

export function build(words) {
  const T = (i) => words[i].s + OFFSET;
  const find = (w, from = 0) => {
    for (let i = from; i < words.length; i++) if (words[i].w.toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(w.toLowerCase())) return i;
    throw new Error('cue word not found: ' + w);
  };
  const tf = (w, from) => T(find(w, from));
  const sfx = [];
  const cue = (t, name, gain = 0.4) => { sfx.push({ t, name, gain }); return t; };
  const shakes = [];
  const shake = (t, amp, dur = 0.5) => shakes.push({ t, amp, dur });
  const flashes = [];

  // ---- key times ----
  const t90 = tf('90');
  const tNobody = T(13);
  const tNifty = T(18);
  const tCards = [24, 26, 27, 28, 29].map(T);
  const tWall = T(30), tOne = tf('one', 30), tRule = T(37), tBuy = T(41), tNever = tf('never', 41);
  const tEveryone = T(46), tPrices = T(49), tPol = tf('polaroid', 49), tMcd = T(63), tAvg = tf('average', 63), tRest = tf('rest', 66), tDouble = tf('double', 66);
  const tWorld = T(80), t1971 = T(84), tNixon = T(86), tGold = tf('gold', 86), tInfl = T(93), t1973 = T(96), tQuad = tf('quadrupled', 96), tWater = T(104);
  const tCrack = T(107), tSafe = T(110), tLate = T(117), tHalf = tf('half', 117), tAvon = T(130), tPol2 = T(135);
  const tGreat = T(138), tWorth = T(142), tInvest = T(148), tWaited = tf('waited', 148), tToday = T(163), tFew = T(167), tThird = tf('third', 167);
  const tAgain = T(182), tSay = T(185), tMaybe = T(191), tBut = T(197), tToo = T(200);
  const tVoiceEnd = words[words.length - 1].e + OFFSET;
  const tEnd = tVoiceEnd + 1.6;

  cue(t90, 'stomp', 0.55); shake(t90, 18);
  tCards.forEach((t) => cue(t, 'pop', 0.4));
  cue(tOne, 'boing', 0.25); cue(tBuy, 'pop', 0.35); cue(tNever, 'stomp', 0.4); shake(tNever, 8);
  cue(tEveryone, 'party', 0.25);
  cue(tPol, 'swoosh', 0.3); cue(tMcd, 'swoosh', 0.3); cue(tAvg + 0.6, 'swoosh', 0.3); cue(tRest, 'swoosh', 0.3); cue(tDouble, 'ding', 0.35);
  cue(tWorld + 0.2, 'thunder', 0.5); flashes.push(tWorld + 0.9); shake(tWorld + 0.9, 10);
  cue(t1971, 'swoosh', 0.35); cue(tGold, 'crash', 0.3);
  cue(tInfl, 'magic', 0.25); cue(tQuad, 'stomp', 0.45); shake(tQuad, 10); cue(tWater, 'swoosh', 0.4); cue(tWater + 0.6, 'bonk', 0.35);
  cue(tCrack + 0.15, 'crash', 0.6); shake(tCrack + 0.15, 26, 0.8); cue(tCrack + 0.2, 'rumble', 0.4);
  cue(tHalf, 'sting', 0.3); cue(tAvon, 'thud', 0.4); cue(tPol2, 'thud', 0.45);
  cue(tGreat, 'sparkle', 0.3); cue(tWorth, 'pop', 0.35); cue(tWaited, 'heartbeat', 0.15);
  cue(tFew, 'swoosh', 0.3); cue(tSay, 'pop', 0.3); cue(tBut, 'swoosh', 0.35); cue(tToo, 'pop', 0.35); cue(tEnd, 'ding', 0.3);

  const scenes = [];
  const S = (start, label, draw, tr = 'slide') => scenes.push({ start, label, draw, tr });

  // ============ 1. HOOK ============
  const hookSeries = (() => {
    const v = []; let x = 0.12;
    for (let i = 0; i < 60; i++) { x += 0.012 + (hash(i, 9) - 0.45) * 0.03; v.push(x); }
    const peak = v[v.length - 1];
    for (let i = 1; i <= 22; i++) v.push(peak - (peak - 0.06) * easeOut(i / 22) + (hash(i, 8) - 0.5) * 0.03);
    return v;
  })();
  S(0, 'THE CRASH NOBODY REMEMBERS', (lt, t, X) => {
    const b = board(70, 250, 940, 640);
    text('1973', b.x + 20, b.y + 34, { size: 56, align: 'left', color: C.chalk });
    const p = prog(t, 0.35, t90 - 0.35);
    const lo = 0, hi = 0.95;
    const up = hookSeries.slice(0, 61);
    const down = hookSeries.slice(60);
    const box = { x: b.x + 10, y: b.y + 80, w: b.w - 20, h: b.h - 110 };
    const upBox = { ...box, w: box.w * (60 / (hookSeries.length - 1)) };
    const dnBox = { x: upBox.x + upBox.w, y: box.y, w: box.w - upBox.w, h: box.h };
    chartLine(upBox, up, { lo, hi, p: Math.min(1, p / 0.72), seed: 21 });
    if (p > 0.72) chartLine(dnBox, down, { lo, hi, p: (p - 0.72) / 0.28, color: '#ff6b6b', w: 8, seed: 22 });
    text("America's \"safest\" stocks", b.x + b.w - 20, b.y + 36, { size: 36, align: 'right', color: C.chalk, font: 'Patrick Hand', weight: 'normal' });
    stamp(760, 640, '-90%', pop(t, t90, 0.3) * (1.6 - 0.6 * prog(t, t90, 0.3)), -0.16);
    ground(GY);
    const shrug = t > tNobody;
    stick(260, GY, { ...NARRATOR, pose: shrug ? 'shrug' : 'point', face: shrug ? 'worried' : 'smile', talk: X.talk(t), look: shrug ? 0 : 1 });
    if (shrug) for (let i = 0; i < 3; i++) at(560 + i * 110, 1010 - (i % 2) * 60, pop(t, tNobody + 0.3 + i * 0.25), () => text('?', 0, 0, { size: 110, color: C.red }));
  }, 'cut');

  // ============ 2. THE NIFTY FIFTY ============
  const names = ['Coca-Cola', "McDonald's", 'Xerox', 'Polaroid', 'Disney'];
  const spots = [[300, 640, -0.06], [790, 640, 0.05], [300, 900, 0.04], [790, 900, -0.05], [545, 1150, 0.02]];
  S(tNifty - 0.15, 'WALL STREET, 1972', (lt, t) => {
    at(540, 330, pop(t, tNifty + 0.1), () => text('The Nifty Fifty', 0, 0, { size: 128 }));
    path([[230, 410], [540, 400], [850, 412]], { w: 7, color: C.red, p: prog(t, tNifty + 0.6, 0.5), seed: 31 });
    text("50 \"can't-lose\" superstar stocks", 540, 470, { size: 44, font: 'Patrick Hand', weight: 'normal', alpha: prog(t, tNifty + 1.0, 0.4) });
    names.forEach((n, i) => {
      const [x, y, r] = spots[i];
      certificate(x, y + (1 - pop(t, tCards[i], 0.45)) * 40, n, 1.12 * pop(t, tCards[i], 0.45), { rot: r });
    });
  });

  // ============ 3. ONE-DECISION STOCKS ============
  S(tWall - 0.1, 'THE "SAFE" STRATEGY', (lt, t, X) => {
    ground(GY);
    stick(250, GY, { ...BANKER, pose: 'mega', prop: 'mega', face: X.talk(t) > 0.15 ? 'shout' : 'smile', talk: 0 });
    const bs = pop(t, tWall + 0.2);
    at(540, 400, bs, () => {
      bubble(-430, -150, 860, 230, -230, 330);
      text('Buy these stocks.', 0, -88, { size: 50, font: 'Patrick Hand', weight: 'normal' });
      text('ONE-DECISION', 0, -10, { size: 92, color: t > tOne ? C.red : C.ink });
    });
    if (t > tOne) for (let k = 0; k < 3; k++) line(410 + k * 6, 860 - k * 40, 450 + k * 22, 840 - k * 46, { w: 5, p: prog(t, tOne + k * 0.1, 0.2) });
    // the rule card
    const cs = pop(t, tRule, 0.45);
    at(760, 930, cs, () => {
      rect(-220, -230, 440, 460, { fill: '#fff3a8', w: 5, seed: 41 });
      text('THE RULE:', 0, -160, { size: 64 });
      text('1. Buy', -170, -40, { size: 78, align: 'left', alpha: prog(t, tBuy, 0.2) });
      text('2. NEVER sell', -170, 90, { size: 74, align: 'left', alpha: prog(t, tNever, 0.15), color: C.red });
      path([[-170, 140], [20, 135], [190, 142]], { w: 7, color: C.red, p: prog(t, tNever + 0.25, 0.4), seed: 42 });
    }, 0.04);
  });

  // ============ 4a. EVERYONE BOUGHT ============
  S(tEveryone - 0.1, '1972: THE HYPE', (lt, t, X) => {
    ground(GY);
    const crowd = [[140, 0.85, 'cap'], [330, 0.95, null], [540, 1.05, 'top'], [750, 0.95, null], [940, 0.85, 'cap']];
    crowd.forEach(([x, s, hat], i) => {
      const jump = Math.max(0, Math.sin(lt * 7 + i * 1.3)) * 24;
      stick(x, GY - jump, { s, pose: 'cheer', face: 'grin', hat, seed: 20 + i, capColor: [C.red, C.green, C.blue][i % 3], wave: 1, tie: i === 2 ? C.red : null, mustache: i === 2 });
    });
    for (let i = 0; i < 26; i++) {
      const x = hash(i, 1) * 1080, sp = 260 + hash(i, 2) * 200;
      const y = -100 + ((lt * sp + hash(i, 3) * 1400) % 1400);
      money(x + Math.sin(lt * 2 + i) * 30, y, 0.9, Math.sin(lt * 3 + i) * 0.6);
    }
    at(540, 360, pop(t, tEveryone + 0.1), () => text('BUY! BUY! BUY!', 0, 0, { size: 120, color: C.green, stroke: '#fff', sw: 14 }));
  });

  // ============ 4b. P/E CHART ============
  const bars = [
    { name: 'Polaroid', v: 95, t: tPol, label: '95×' },
    { name: "McDonald's", v: 86, t: tMcd, label: '86×' },
    { name: 'Avg. Nifty\nFifty stock', v: 42, t: tAvg + 0.6, label: '42×' },
    { name: 'S&P 500\naverage', v: 19, t: tRest, label: '19×' },
  ];
  S(tPrices - 0.1, 'THE BUBBLE', (lt, t) => {
    rect(50, 230, 980, 1060, { fill: C.beige, w: 5, seed: 51 });
    text('Price ÷ Earnings, 1972', 540, 310, { size: 64 });
    text('= years of profit you pay for the stock', 540, 370, { size: 36, font: 'Patrick Hand', weight: 'normal', color: '#6b5a3a' });
    const base = 1120, top = 450, maxV = 100;
    line(110, base, 990, base, { w: 6, seed: 52 });
    line(110, base, 110, top - 20, { w: 6, seed: 53 });
    for (const v of [25, 50, 75, 100]) { const y = base - (v / maxV) * (base - top); line(100, y, 120, y, { w: 4 }); text(String(v), 92, y, { size: 26, align: 'right', font: 'Patrick Hand', weight: 'normal' }); }
    bars.forEach((b, i) => {
      const cx = 235 + i * 215;
      const k = easeOut(prog(t, b.t, 0.8));
      const h = (b.v / maxV) * (base - top) * k;
      if (k > 0) rect(cx - 72, base - h, 144, h, { fill: i < 2 ? C.bar : i === 2 ? '#c99a5b' : '#a7c4a0', w: 5, seed: 54 + i });
      if (k > 0.6) text(b.label, cx, base - h - 40, { size: 58, alpha: (k - 0.6) / 0.4 });
      b.name.split('\n').forEach((l, j) => text(l, cx, base + 42 + j * 36, { size: 34, font: 'Patrick Hand', weight: 'normal' }));
    });
    const cp = prog(t, tDouble, 0.6);
    if (cp > 0) {
      scribbleCircle(772, 900, 230, 290, cp, { seed: 57 });
      at(780, 520, pop(t, tDouble + 0.4), () => text('2× pricier!', 0, 0, { size: 62, color: C.red }), -0.08);
    }
    text('Source: J. Siegel, "Valuing Growth Stocks" (1998); P/Es at end of 1972', 540, 1255, { size: 22, font: 'Patrick Hand', weight: 'normal', color: '#7a6a4a' });
  });

  // ============ 5a. THE WORLD CHANGED ============
  S(tWorld - 0.1, 'THE SHOCKS', (lt, t, X) => {
    const dark = prog(t, tWorld + 0.2, 0.8);
    g().fillStyle = `rgba(60,55,60,${0.28 * dark})`; g().fillRect(0, 0, 1080, 1920);
    ground(GY);
    stick(540, GY, { ...NARRATOR, pose: t > tWorld + 0.9 ? 'panic' : 'stand', face: t > tWorld + 0.9 ? 'shock' : 'worried', talk: X.talk(t) });
    for (let i = 0; i < 3; i++) cloud(lerp(-300 + i * 200, 200 + i * 340, easeOut(dark)), 380 + (i % 2) * 90, 1.3, true);
    if (t > tWorld + 0.9 && t < tWorld + 1.6) bolt(600, 470, 1.6);
  }, 'cut');

  // ============ 5b. NIXON & GOLD ============
  S(t1971 - 0.15, 'SHOCK #1: 1971', (lt, t) => {
    const s = pop(t, t1971, 0.5);
    newspaper(540, 640, 1.38 * s, 'DOLLAR CUT\nLOOSE FROM GOLD', 'President Nixon "closes the gold window"', {
      date: 'AUGUST 16, 1971', rot: -0.03,
      picture: (cx, cy) => {
        rect(cx - 70, cy + 10, 140, 120, { fill: '#8b6a4a', w: 4, seed: 61 });
        circle(cx, cy + 60, 22, { fill: '#e8d9a8', w: 3 });
        stick(cx, cy + 20, { s: 0.42, pose: 'stand', face: 'flat', hair: 'neat', tie: C.blue, seed: 62, bob: 0 });
        line(cx - 30, cy + 10, cx - 20, cy - 60, { w: 4 });
      },
    });
    const gp = prog(t, tGold - 0.3, 0.6);
    if (gp > 0) {
      const split = prog(t, tGold, 0.6);
      at(330, 1130, easeOut(gp), () => {
        goldBar(-60 - split * 80, 0, 1.2, -split * 0.3);
        text('$', 160 + split * 80, 0, { size: 150, color: C.green, rot: split * 0.3 });
        path([[-10, -10], [30, 10], [70, -10]], { w: 9, color: '#777', alpha: 1 - split });
        if (split > 0.1) { line(10, -40, 30, -70, { w: 5, color: C.red }); line(40, -40, 70, -60, { w: 5, color: C.red }); }
      });
    }
  });

  // ============ 5c. INFLATION ============
  S(tInfl - 0.1, 'SHOCK #2: INFLATION', (lt, t) => {
    const lvl = 0.15 + 0.8 * easeInOut(prog(t, tInfl + 0.2, 1.3));
    thermometer(330, 780, 1.45, lvl, '1974: 12%', '1972: 3%');
    text('INFLATION', 330, 330, { size: 80, color: C.red });
    ground(GY);
    stick(790, GY, { seed: 30, pose: 'panic', face: 'shock', hair: 'bun', hairColor: '#6b3f1d' });
    for (let i = 0; i < 4; i++) {
      const k = prog(t, tInfl + 0.3 + i * 0.2, 1.4);
      if (k > 0) priceTag(700 + i * 60, 900 - k * 600 - i * 40, 0.65, '$' + (1 + i) + '.' + (20 + i * 15), -0.3 + i * 0.2);
    }
    text('US consumer prices, yearly change', 540, 1295, { size: 28, font: 'Patrick Hand', weight: 'normal', color: '#7a6a4a' });
  });

  // ============ 5d. OIL ============
  S(t1973 - 0.15, 'SHOCK #3: 1973 OIL EMBARGO', (lt, t) => {
    barrel(300, 760, 2, 'OIL');
    const q = t > tQuad;
    priceTag(560, 560, 1.15 * (q ? pop(t, tQuad, 0.3) : pop(t, t1973 + 0.4)), q ? '$12' : '$3', 0.12);
    text('per barrel', 690, 680, { size: 40, font: 'Patrick Hand', weight: 'normal', alpha: prog(t, t1973 + 0.6, 0.3) });
    stamp(760, 860, '×4', pop(t, tQuad, 0.3) * (1.5 - 0.5 * prog(t, tQuad, 0.3)), 0.14);
    ground(GY);
    at(800, GY, pop(t, t1973 + 0.6), () => {
      line(0, 0, 0, -200, { w: 9 });
      rect(-170, -360, 340, 170, { fill: '#fff', w: 6, seed: 71 });
      text('SORRY', 0, -310, { size: 52, color: C.red });
      text('NO GAS TODAY', 0, -240, { size: 46 });
    });
  });

  // ============ 5e. WATERGATE ============
  S(tWater - 0.15, 'SHOCK #4: WATERGATE', (lt, t) => {
    const k = easeOut(prog(t, tWater, 0.7));
    newspaper(540, 700, 1.4 * k, 'WATERGATE', 'Scandal engulfs the White House', { date: '1973 – 1974', rot: (1 - k) * Math.PI * 4 - 0.02, masthead: 'THE EVENING POST' ,
      picture: (cx, cy) => { rect(cx - 90, cy - 30, 180, 120, { fill: '#fff', w: 4 }); for (let i = 0; i < 4; i++) line(cx - 70, cy - 10 + i * 24, cx + 70, cy - 10 + i * 24, { w: 3, color: '#999' }); text('TOP SECRET', cx, cy - 55, { size: 26, color: C.red }); } });
  });

  // ============ 6a. THE CRASH ============
  const spx = [116, 111, 111, 106, 104, 104, 108, 104, 108, 108, 96, 97, 96, 96, 94, 90, 87, 86, 79, 72, 63, 73, 69, 68];
  S(tCrack - 0.1, 'THE CRASH: 1973 – 1974', (lt, t, X) => {
    const b = board(70, 250, 940, 660);
    text('S&P 500', b.x + 20, b.y + 34, { size: 52, align: 'left', color: C.chalk });
    const box = { x: b.x + 20, y: b.y + 90, w: b.w - 40, h: b.h - 160 };
    const pts = chartLine(box, spx, { lo: 55, hi: 120, p: prog(t, tCrack, tHalf - tCrack), color: '#ff7b7b', w: 8 });
    text('Jan 1973', box.x, b.y + b.h - 26, { size: 32, align: 'left', color: C.chalk, font: 'Patrick Hand', weight: 'normal' });
    text('Oct 1974', box.x + box.w, b.y + b.h - 26, { size: 32, align: 'right', color: C.chalk, font: 'Patrick Hand', weight: 'normal' });
    const hp = pop(t, tHalf, 0.4);
    if (hp > 0) { const low = pts[20]; at(low[0] - 40, low[1] - 120, hp, () => text('-48%', 0, 0, { size: 110, color: C.yellow })); }
    // crack across the screen
    const cp = prog(t, tCrack + 0.12, 0.25);
    const ca = 1 - prog(t, tCrack + 2.2, 0.6);
    if (cp > 0 && ca > 0) {
      const crack = [[0, 560], [180, 610], [260, 540], [430, 660], [520, 600], [700, 720], [820, 650], [1080, 760]];
      path(crack, { w: 12, color: '#fff', p: cp, amp: 0, seed: 81, alpha: ca });
      path(crack, { w: 5, color: C.ink, p: cp, amp: 0, seed: 81, alpha: ca });
    }
    ground(GY);
    stick(540, GY, { ...NARRATOR, pose: 'panic', face: 'shock', talk: X.talk(t) * 0.6 });
    if (t > tSafe) at(200, 1060, pop(t, tSafe + 0.3), () => text('"Safe"?', 0, 0, { size: 80, color: C.red }), -0.12);
  }, 'cut');

  // ============ 6b. AVON & POLAROID ============
  S(tAvon - 0.15, 'THE "SAFE" STOCKS', (lt, t) => {
    text('From peak to bottom', 540, 330, { size: 64 });
    const cols = [{ n: 'Avon', left: 14, t: tAvon, lab: '-86%' }, { n: 'Polaroid', left: 9, t: tPol2, lab: '-91%' }];
    const base = 1150, full = 640;
    cols.forEach((c, i) => {
      const cx = 320 + i * 440;
      const k = easeInOut(prog(t, c.t + 0.2, 1.1));
      const h = full * lerp(1, c.left / 100, k);
      rect(cx - 110, base - full, 220, full, { w: 4, color: '#bbb', seed: 91 + i, alpha: 0.9 });
      rect(cx - 110, base - h, 220, h, { fill: t >= c.t ? '#f08a8a' : C.bar, w: 5, seed: 93 + i });
      text(c.n, cx, base + 50, { size: 54 });
      text('1972 peak', cx, base - full - 30, { size: 30, font: 'Patrick Hand', weight: 'normal', color: '#777' });
      if (k > 0.5) at(cx, base - h - 80, pop(t, c.t + 0.9), () => text(c.lab, 0, 0, { size: 96, color: C.red }));
    });
    line(80, base, 1000, base, { w: 6 });
  });

  // ============ 7a. GREAT COMPANIES, TERRIBLE PRICES ============
  S(tGreat - 0.1, 'THE LESSON', (lt, t, X) => {
    ground(GY);
    at(640, 760, pop(t, tGreat + 0.1), () => { trophy(0, 0, 2.2); text('GREAT COMPANY', 0, 270, { size: 58 }); });
    if (t > tWorth) {
      line(760, 520, 870, 470, { w: 4, p: prog(t, tWorth, 0.2) });
      priceTag(890, 430, pop(t, tWorth + 0.1) * 1.1, '$$$$$', 0.35 + Math.sin(lt * 3) * 0.05);
    }
    stick(210, GY, { ...NARRATOR, pose: t > tWorth ? 'shrug' : 'pointL', flip: true, face: 'smile', talk: X.talk(t) });
    if (t > tWorth + 0.6) at(560, 1160, pop(t, tWorth + 0.6), () => text('Great business ≠ great investment', 0, 0, { size: 50, color: C.red, maxW: 900 }));
  });

  // ============ 7b. WAITING ============
  S(tInvest - 0.1, 'THE LONG WAIT', (lt, t) => {
    ground(GY);
    const wp = prog(t, tWaited, tToday - tWaited - 0.3);
    // bench
    line(240, GY - 110, 600, GY - 110, { w: 12, color: C.wood });
    line(270, GY - 110, 270, GY, { w: 8, color: C.wood }); line(570, GY - 110, 570, GY, { w: 8, color: C.wood });
    stick(400, GY + 15, { seed: 40, pose: 'sit', face: wp > 0.5 ? 'sad' : 'flat', beard: wp, hair: 'neat', hairColor: wp > 0.6 ? '#9a948c' : C.ink, bob: 0.4 });
    certificate(400, GY - 450, 'Polaroid', 0.55 * pop(t, tInvest + 0.2), { rot: -0.1 });
    const year = 1973 + Math.floor(wp * 8.99);
    calendar(800, 560, 1.5, String(year), 'YEAR');
    // cobwebs and dust grow over time
    if (wp > 0.4) { const a = (wp - 0.4) / 0.6; path([[240, GY - 110], [300, GY - 170], [360, GY - 110]], { w: 3, color: '#999', alpha: a }); path([[262, GY - 110], [300, GY - 145], [338, GY - 110]], { w: 2, color: '#999', alpha: a }); }
    text('Waiting to break even…', 540, 330, { size: 60, alpha: prog(t, tWaited, 0.5) });
    // little clock
    at(800, 900, 1, () => { circle(0, 0, 70, { fill: '#fff', w: 5 }); const a = lt * 6; line(0, 0, Math.sin(a) * 50, -Math.cos(a) * 50, { w: 5 }); line(0, 0, Math.sin(a / 12) * 32, -Math.cos(a / 12) * 32, { w: 7 }); });
  });

  // ============ 8a. TODAY ============
  S(tToday - 0.1, 'TODAY', (lt, t) => {
    text("Today's S&P 500", 540, 320, { size: 84 });
    const pp = easeInOut(prog(t, tFew, 1.6));
    pie(540, 760, 320, 0.33, pp, { slice: '#7aa7d9', rest: C.beige });
    if (pp > 0.6) {
      at(880, 470, pop(t, tFew + 1.2), () => { text('≈ 1/3', 0, 0, { size: 96, color: C.blue }); });
      text('A handful of giant', 540, 1150, { size: 50, alpha: prog(t, tFew + 1.4, 0.4) });
      text('tech stocks', 540, 1205, { size: 50, alpha: prog(t, tFew + 1.4, 0.4) });
    }
    if (t > tThird) arrow(950, 1020, 800, 800, { p: prog(t, tThird + 0.3, 0.5), bend: 40 });
  });

  // ============ 8b. ONCE AGAIN ============
  S(tAgain - 0.1, 'SOUND FAMILIAR?', (lt, t, X) => {
    ground(GY);
    stick(250, GY, { ...MODERN, pose: 'mega', prop: 'mega', face: 'shout' });
    at(600, 560, pop(t, tSay), () => { bubble(-430, -170, 860, 260, -250, 260); text("THESE CAN'T", 0, -82, { size: 92 }); text('GO DOWN!', 0, 10, { size: 92, color: C.red }); });
    [[700, 0.8], [850, 0.75], [990, 0.7]].forEach(([x, s], i) => stick(x, GY, { s, seed: 50 + i, pose: i === 1 ? 'cheer' : 'stand', face: 'grin', hat: i === 2 ? 'cap' : null, capColor: C.red, wave: 0.5, look: -1 }));
  });

  // ============ 9a. THIS TIME IS DIFFERENT ============
  S(tMaybe - 0.1, 'THE BIG QUESTION', (lt, t, X) => {
    ground(GY);
    stick(540, GY, { ...NARRATOR, pose: 'think', face: 'flat', talk: X.talk(t), look: 1 });
    for (let i = 0; i < 3; i++) circle(620 + i * 40, 760 - i * 60, 10 + i * 6, { w: 4, fill: '#fff', alpha: prog(t, tMaybe + 0.2 + i * 0.15, 0.2) });
    at(600, 480, pop(t, tMaybe + 0.6), () => { rect(-330, -110, 660, 220, { fill: '#fff', w: 5 }); text('"This time is', 0, -36, { size: 64 }); text('different."', 0, 40, { size: 64 }); });
  });

  // ============ 9b. 1972 vs TODAY ============
  S(tBut - 0.15, 'HISTORY RHYMES', (lt, t) => {
    const panel = (y, h, tint, year, who, appear) => {
      const s = easeOut(prog(t, appear, 0.45));
      if (s <= 0) return;
      at(0, (1 - s) * 400, 1, () => {
        rect(40, y, 1000, h, { fill: tint, w: 6, seed: y });
        text(year, 100, y + 60, { size: 64, align: 'left', color: C.red });
        g().save(); g().beginPath(); g().rect(40, y, 1000, h); g().clip();
        stick(230, y + h - 30, { ...who, s: 0.8, pose: 'mega', prop: 'mega', face: 'shout' });
        g().restore();
        bubble(400, y + 70, 600, 190, 380, y + 280, { seed: y + 3 });
        text("THESE CAN'T", 700, y + 130, { size: 62 });
        text('GO DOWN!', 700, y + 200, { size: 62, color: C.red });
      }, 0, s);
    };
    panel(230, 500, '#efdcb5', '1972', BANKER, tBut);
    panel(770, 500, '#dbe8f5', 'TODAY', MODERN, tToo - 0.1);
  });

  // ============ END CARD ============
  S(tEnd - 0.2, 'THE 1973 CRASH', (lt, t) => {
    at(540, 520, pop(t, tEnd), () => { text('History doesn\'t', 0, -70, { size: 96 }); text('repeat itself…', 0, 30, { size: 96 }); });
    at(540, 800, pop(t, tEnd + 0.9), () => { text('…but it often', 0, -50, { size: 96, color: C.red }); text('RHYMES.', 0, 60, { size: 130, color: C.red }); });
    certificate(540, 1100, 'Nifty Fifty', 1.1 * pop(t, tEnd + 1.6), { rot: -0.05, badge: '1973' });
    text('Educational only. Not financial advice.', 540, 1290, { size: 30, font: 'Patrick Hand', weight: 'normal', color: '#777', alpha: prog(t, tEnd + 1.8, 0.5) });
  }, 'fade');

  scenes.sort((a, b) => a.start - b.start);
  return { scenes, sfx, shakes, flashes, voiceEnd: tVoiceEnd };
}

/** Caption groups (2–4 words), with the script's proper spelling restored. */
export function captions(words) {
  const toks = [];
  for (const w of words) {
    const s = w.w;
    if (toks.length && /^[-&%]/.test(s)) { const p = toks[toks.length - 1]; p.w += s; p.e = w.e; continue; }
    toks.push({ ...w });
  }
  const FIX = { never: 'NEVER', any: 'ANY', '90%': '90%' };
  for (const t of toks) {
    const bare = t.w.toLowerCase().replace(/[^a-z%0-9]/g, '');
    if (FIX[bare] && bare !== '90%') t.w = t.w.replace(/[A-Za-z]+/, FIX[bare]);
    t.w = t.w.replace('S&P', 'S&P').replace(/^(\d+)\s?%/, '$1%');
  }
  const groups = [];
  let cur = [];
  for (const t of toks) {
    cur.push(t);
    const len = cur.map((x) => x.w).join(' ').length;
    if (/[.,?!]$/.test(t.w) || cur.length >= 3 || len > 15) { groups.push(cur); cur = []; }
  }
  if (cur.length) groups.push(cur);
  return groups.map((gp) => ({ s: gp[0].s + OFFSET, e: gp[gp.length - 1].e + OFFSET, words: gp.map((x) => ({ w: x.w.replace(/[.,]$/, ''), s: x.s + OFFSET, e: x.e + OFFSET })) }));
}
