// The fixed 15-second demonstration story used to prove the whole pipeline.
export const DEMO_STORYBOARD = {
  title: 'Sir Clank and the Dragon',
  seed: 42,
  mood: 'adventure',
  narratorVoice: 'storyteller',
  targetDuration: 15,
  characters: ['knight', 'dragon', 'bob', 'lily'],
  scenes: [
    {
      environment: 'castle',
      cast: [{ id: 'knight', at: [-2.6, 0.5], face: 90 }],
      beats: [{
        line: { speaker: 'narrator', text: 'Sir Clank was the bravest knight in the kingdom.' },
        camera: [{ type: 'establish', target: 'knight', at: 0, end: 0.45 }, { type: 'medium', target: 'knight', at: 0.45, end: 1, from: { angle: -20, dist: 5.5 }, to: { angle: 15, dist: 4.6 } }],
        actions: [
          { char: 'knight', action: 'walk', move: [0, 0.8], at: 0, end: 0.4, expr: 'determined', prop: 'sword' },
          { char: 'knight', action: 'cheer', at: 0.42, end: 0.62, expr: 'happy', face: 'front', prop: 'sword' },
          { char: 'knight', action: 'swordSwing', at: 0.62, end: 1, expr: 'determined', face: 'front', prop: 'sword' },
        ],
        fx: [{ type: 'sparkle', at: 'knight', when: 0.45, height: 'hand' }],
      }],
    },
    {
      environment: 'village',
      transition: 'iris',
      cast: [{ id: 'bob', at: [3.2, 0.6], face: -90 }, { id: 'lily', at: [-1.2, -0.4], face: 30 }],
      beats: [{
        line: { speaker: 'narrator', text: 'Until a dragon attacked the village!' },
        camera: [{ type: 'wide', at: 0, end: 1, from: { angle: -12, dist: 9 }, to: { angle: 8, dist: 7.5 } }],
        actions: [
          { char: 'bob', action: 'run', move: [-3.4, 1.2], at: 0, end: 0.7, expr: 'scared' },
          { char: 'bob', action: 'scared', at: 0.7, end: 1, expr: 'scared', face: 'front' },
          { char: 'lily', action: 'scared', at: 0.1, end: 1, expr: 'surprised', face: 'front' },
        ],
        fx: [{ type: 'smoke', at: [1.5, 0.5, -2.5], when: 0.05 }, { type: 'fire', at: [3.5, 1.5, -3], dir: [-0.6, 0.1, 0.3], when: 0.15, sfx: 'fire' }, { type: 'dust', at: 'bob', when: 0.7 }],
        emotes: [{ char: 'lily', icon: '!', when: 0.15, dur: 1.2 }],
      }],
    },
    {
      environment: 'battlefield',
      transition: 'flash',
      cast: [{ id: 'knight', at: [-1.3, 0.6], face: 60 }, { id: 'dragon', at: [1.4, 0.2], face: -60 }],
      beats: [
        {
          line: { speaker: 'knight', text: 'Fear not! I shall defeat you!' },
          camera: [{ type: 'lowAngle', target: 'knight', at: 0, end: 1 }],
          actions: [
            { char: 'knight', action: 'swordSwing', at: 0, end: 1, expr: 'angry', face: 'dragon', prop: 'sword' },
            { char: 'dragon', action: 'idle', at: 0, end: 1, expr: 'neutral', face: 'knight' },
          ],
          comic: [{ text: 'CLANK!', at: [0.1, 3.6, 0.3], when: 0.55, dur: 0.9 }],
          fx: [{ type: 'impact', at: [0.1, 1.6, 0.5], when: 0.55, shake: 1 }],
        },
        {
          line: { speaker: 'dragon', text: 'Wait! I just wanted a hug.' },
          camera: [{ type: 'closeup', target: 'dragon', at: 0, end: 1, from: { angle: -25 }, to: { angle: -18 } }],
          actions: [
            { char: 'dragon', action: 'shrug', at: 0, end: 0.5, expr: 'sad', face: 'knight' },
            { char: 'dragon', action: 'talk', at: 0.5, end: 1, expr: 'love', face: 'knight' },
            { char: 'knight', action: 'idle', at: 0, end: 1, expr: 'surprised', face: 'dragon' },
          ],
          emotes: [{ char: 'dragon', icon: 'heart', when: 0.55, dur: 1.2 }],
          fx: [{ type: 'hearts', at: 'dragon', height: 'head', when: 0.6 }],
        },
      ],
    },
    {
      environment: 'village',
      transition: 'wipe',
      cast: [{ id: 'knight', at: [-1.5, 0.4], face: 20 }, { id: 'dragon', at: [0.2, 0.0], face: 0 }, { id: 'bob', at: [1.8, 0.6], face: -20 }],
      beats: [{
        line: { speaker: 'narrator', text: "And that's how the kingdom got a pet dragon." },
        camera: [{ type: 'orbit', at: 0, end: 1, from: { angle: -30, dist: 8 }, to: { angle: 25, dist: 7 } }],
        actions: [
          { char: 'knight', action: 'dance', at: 0, end: 1, expr: 'laugh' },
          { char: 'dragon', action: 'cheer', at: 0, end: 1, expr: 'happy' },
          { char: 'bob', action: 'dance', at: 0.1, end: 1, expr: 'happy' },
        ],
        fx: [{ type: 'confetti', at: [0, 3.5, 0.5], when: 0.05 }, { type: 'confetti', at: [0, 3.8, 0], when: 0.5 }],
      }],
    },
  ],
};
