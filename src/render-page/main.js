// Headless render page. The Node renderer (render/frames.js) opens this page
// in Chromium, loads a timeline and asks for frames one at a time.
// A timeline with a `film` field is played by the FilmPlayer instead.
import { StoryPlayer } from '../engine/player.js';
import { FilmPlayer } from '../engine/film.js';

let player = null;

window.__studio = {
  ready: true,
  load(timeline, width, height) {
    const canvas = document.getElementById('c');
    canvas.width = width; canvas.height = height;
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    const Player = timeline.film ? FilmPlayer : StoryPlayer;
    player = new Player(canvas, timeline, { width, height, preserveDrawingBuffer: true });
    player.warmup();
    return { ok: true, scenes: timeline.scenes?.length ?? 0 };
  },
  frame(t, quality = 0.92) {
    player.renderFrame(t);
    return player.renderer.domElement.toDataURL('image/jpeg', quality);
  },
  // Draw a frame without encoding (used to measure pure render time)
  draw(t) { player.renderFrame(t); return true; },
};
