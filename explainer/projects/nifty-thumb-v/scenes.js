// Vertical cover (1080x1920) for the full-length vertical cut, in the Short's style.
import { C, text, g } from '../../engine.js';
import { stick, stamp, ground } from '../../kit.js';
import { briefcase, key, certificate } from '../../kit2.js';
export const LAYOUT = { w: 1080, h: 1920, captions: false, camY: 0.5 };
export const OFFSET = 0;
export function build() {
  return { duration: 2, sfx: [], shakes: [], flashes: [], scenes: [{ start: 0, label: null, tr: 'cut', draw: () => {
    text('THEY SAID', 540, 250, { size: 110, wobble: false });
    text('NEVER', 540, 430, { size: 200, wobble: false });
    g().save(); g().fillStyle = C.yellow; g().fillRect(170, 520, 740, 200); g().restore();
    text('SELL', 540, 625, { size: 200, color: C.red, wobble: false });
    certificate(700, 930, 1.15, { name: 'Polaroid', fill: 0.09, rot: 0.05 });
    stamp(720, 1110, '-91%', 1.0, -0.14);
    ground(1500);
    stick(260, 1500, { sideburns: true, tie: C.blue, tieW: 14, hair: 'neat', hairColor: '#3b2a1e', seed: 5, s: 1.15, pose: 'panic', face: 'shock', bob: 0 });
    briefcase(560, 1420, 0.55, { locked: true });
    key(820, 1330, 0.7, -0.5);
    text('The 1973 crash nobody remembers', 540, 1650, { size: 52, font: 'Patrick Hand', weight: 'normal', wobble: false });
  } }] };
}
export function captions() { return []; }
