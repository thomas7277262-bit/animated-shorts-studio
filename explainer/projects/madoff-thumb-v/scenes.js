// Vertical cover frame (1080x1920) for the Short.
import { C, text, circle, g } from '../../engine.js';
import { stick, stamp, ground } from '../../kit.js';
export const LAYOUT = { w: 1080, h: 1920, captions: false, camY: 0.5 };
export const OFFSET = 0;
export function build() {
  return { duration: 2, sfx: [], shakes: [], flashes: [], scenes: [{ start: 0, label: null, tr: 'cut', draw: () => {
    text('THE', 540, 330, { size: 170, wobble: false });
    g().save(); g().fillStyle = C.yellow; g().fillRect(60, 430, 960, 220); g().restore();
    text('$65 BILLION', 540, 545, { size: 170, color: C.red, wobble: false, maxW: 940 });
    text('LIE', 540, 790, { size: 230, wobble: false });
    for (let r = 0; r < 5; r++) for (let c = 0; c <= r; c++) circle(760 + (c - r / 2) * 70, 980 + r * 70, 28, { fill: C.skin, w: 4, seed: 10 + r * 7 + c });
    stamp(760, 1100, 'PONZI', 0.7, -0.18);
    ground(1500);
    stick(300, 1500, { hair: 'neat', hairColor: '#b9b4ab', tie: '#2b2b2b', tieW: 10, seed: 41, s: 1.25, pose: 'shrug', face: 'grin', bob: 0 });
    text('Bernie Madoff', 540, 1640, { size: 80, font: 'Patrick Hand', weight: 'normal', wobble: false });
  } }] };
}
export function captions() { return []; }
