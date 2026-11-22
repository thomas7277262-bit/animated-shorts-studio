// YouTube thumbnail (1280x720) for "Bernie Madoff: The $65 Billion Lie".
import { C, text, rect, circle, at, g } from '../../engine.js';
import { stick, stamp } from '../../kit.js';
export const LAYOUT = { w: 1280, h: 720, captions: false, camY: 0.5 };
export const OFFSET = 0;
export function build() {
  return { duration: 2, sfx: [], shakes: [], flashes: [], scenes: [{ start: 0, label: null, tr: 'cut', draw: () => {
    // left: a towering pyramid of investors, cracking
    for (let r = 0; r < 5; r++) for (let c = 0; c <= r; c++) circle(250 + (c - r / 2) * 70, 90 + r * 68, 27, { fill: C.skin, w: 4, seed: 10 + r * 7 + c });
    stick(250, 700, { hair: 'neat', hairColor: '#b9b4ab', tie: '#2b2b2b', tieW: 10, seed: 41, s: 0.62, pose: 'shrug', face: 'grin', bob: 0 });
    stamp(250, 260, 'PONZI', 0.62, -0.18);
    // right: the title, three big lines
    g().save(); g().fillStyle = C.yellow; g().fillRect(520, 270, 720, 170); g().restore();
    text('THE', 880, 140, { size: 130, wobble: false });
    text('$65 BILLION', 880, 358, { size: 130, color: C.red, wobble: false, maxW: 700 });
    text('LIE', 880, 575, { size: 170, wobble: false });
  } }] };
}
export function captions() { return []; }
