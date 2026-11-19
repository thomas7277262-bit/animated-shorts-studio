// Hand-directed films playable by FilmPlayer (src/engine/film.js).
// `score` (optional) is a plan for src/audio/score.js: the film's own
// royalty-free music, used when no --music file is given.
import { createRunYourRace, DURATION as RYR_DURATION } from './run-your-race.js';
import { createDropTheExcuses, DURATION as DTE_DURATION, SCORE as DTE_SCORE } from './drop-the-excuses.js';

export const FILMS = {
  'run-your-race': createRunYourRace,
  'drop-the-excuses': createDropTheExcuses,
};

export const FILM_INFO = {
  'run-your-race': { title: 'Run Your Race', duration: RYR_DURATION },
  'drop-the-excuses': { title: 'Drop The Excuses', duration: DTE_DURATION, score: DTE_SCORE },
};
