// Music plan for "Drop The Excuses" (composed by src/audio/score.js).
// 120 BPM → 1 beat = 0.5 s, 1 bar = 2 s. The film's cues use this grid.
const Am = [45, [57, 60, 64]], F = [41, [53, 57, 60]], C = [48, [55, 60, 64]], G = [43, [55, 59, 62]];

export const SCORE = {
  bpm: 120,
  bars: 16,
  tail: 1.0,
  seed: 12,
  chords: [Am, F, C, G, Am, F, C, G, Am, F, C, G, Am, F, Am, Am],
  sections: { intro: [0, 4], build: [4, 8], breakAt: 15.0, drop: [8, 14], outro: [14, 16] },
  crashes: [8, 10, 12],
  lead: [
    [[0, 76, 1], [1, 74, 0.5], [1.5, 72, 0.5], [2, 74, 1], [3, 76, 1], [4, 77, 1], [5, 76, 0.5], [5.5, 74, 0.5], [6, 72, 1.5], [7.5, 71, 0.5]],
    [[0, 72, 1], [1, 74, 0.5], [1.5, 76, 0.5], [2, 79, 1.5], [3.5, 76, 0.5], [4, 74, 1], [5, 72, 0.5], [5.5, 71, 0.5], [6, 74, 2]],
    [[0, 76, 1], [1, 74, 0.5], [1.5, 72, 0.5], [2, 74, 1], [3, 76, 1], [4, 77, 1], [5, 79, 0.5], [5.5, 81, 0.5], [6, 81, 2]],
  ],
};
export const SCORE_DURATION = SCORE.bars * 2 + SCORE.tail;
