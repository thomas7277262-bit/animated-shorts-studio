// Hand-directed films playable by FilmPlayer (src/engine/film.js).
// `score` (optional) is a plan for src/audio/score.js: the film's own
// royalty-free music, used when no --music file is given.
import { createRunYourRace, DURATION as RYR_DURATION } from './run-your-race.js';
import { createDropTheExcuses, DURATION as DTE_DURATION, SCORE as DTE_SCORE } from './drop-the-excuses.js';
import { createFiveMoreMinutes, DURATION as FMM_DURATION } from './five-more-minutes.js';
import { createStyleTest, DURATION as ST_DURATION } from './style-test.js';
import { createMindset1, DURATION as M1_DURATION } from './mindset-1.js';

export const FILMS = {
  'run-your-race': createRunYourRace,
  'drop-the-excuses': createDropTheExcuses,
  'five-more-minutes': createFiveMoreMinutes,
  'style-test': createStyleTest,
  'mindset-1': createMindset1,
};

export const FILM_INFO = {
  'run-your-race': { title: 'Run Your Race', duration: RYR_DURATION },
  'drop-the-excuses': { title: 'Drop The Excuses', duration: DTE_DURATION, score: DTE_SCORE },
  'five-more-minutes': { title: '5 More Minutes', duration: FMM_DURATION },
  'style-test': { title: 'Style Test', duration: ST_DURATION },
  'mindset-1': { title: 'Mindset #1', duration: M1_DURATION },
};
