// YouTube thumbnail (1280x720) for "Never Sell: The Nifty Fifty and the Crash of 1973" (16:9 cut).
import { text, line, g } from '../../engine.js';
import { P, briefcase, key, certificate, stick } from '../../kit2.js';
export const LAYOUT = { w: 1280, h: 720, captions: false, camY: 0.5 };
export const OFFSET = 0;
export function build() {
  return { duration: 2, sfx: [], shakes: [], flashes: [], paperAt: () => P.sepia, scenes: [{ start: 0, label: null, tr: 'cut', draw: () => {
    // left: the locked briefcase, the key flying away
    briefcase(330, 470, 1.05, { locked: true });
    key(560, 210, 0.9, -0.6);
    // the drained Polaroid certificate behind the title
    certificate(1000, 590, 0.95, { name: 'Polaroid', fill: 0.09, rot: -0.06 });
    text('-91%', 1010, 415, { size: 120, color: P.red, font: 'Permanent Marker', weight: 'normal', rot: -0.1, wobble: false });
    // title
    text('NEVER', 900, 120, { size: 150, wobble: false });
    g().save(); g().fillStyle = P.yellow; g().fillRect(660, 205, 500, 130); g().restore();
    text('SELL', 900, 275, { size: 150, wobble: false });
    text('1973', 120, 80, { size: 64, color: P.grey, align: 'left', wobble: false });
  } }] };
}
export function captions() { return []; }
