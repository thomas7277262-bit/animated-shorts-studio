// Hand-directed films playable by FilmPlayer (src/engine/film.js).
import { createRunYourRace, DURATION as RYR_DURATION } from './run-your-race.js';

export const FILMS = {
  'run-your-race': createRunYourRace,
};

export const FILM_INFO = {
  'run-your-race': { title: 'Run Your Race', duration: RYR_DURATION },
};
