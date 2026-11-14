// 15-second demo for the blocky "game-style story" direction:
// a kid spots a giant creature, it smashes into the village, everyone runs,
// and the twist reveals something far bigger. Shots change about every 2 s.
const VILLAGE = { environment: 'village', envSeed: 11, envOptions: { clearRoad: true } };
const HOUSES = [
  { id: 'h1', type: 'house', at: [2.8, -15], ry: -0.3, scale: 1.25, wall: '#ffd36e', roof: '#e2453c' },
  { id: 'h2', type: 'house', at: [-3.2, -20], ry: 0.3, scale: 1.2, wall: '#9fe0ff', roof: '#3a6ea5' },
  { id: 'w1', type: 'windmill', at: [-7, -24], ry: 0.4 },
  { id: 'c1', type: 'cart', at: [-2.4, -6], ry: 0.6 },
];

export const DEMO_GIANT = {
  title: 'Something Is Coming',
  seed: 11,
  mood: 'suspense',
  narratorVoice: 'storyteller',
  targetDuration: 15,
  characters: ['noah', 'mia', 'rex', 'titan'],
  captionStyle: 'yellow',
  scenes: [
    {
      ...VILLAGE, lighting: 'day', ambience: 'birds', music: 'calm', props: HOUSES,
      cast: [{ id: 'noah', at: [-3.2, 1.6], face: 90 }, { id: 'mia', at: [2.2, -1.2], face: -30 }],
      beats: [{
        line: { speaker: 'narrator', text: 'It was a normal day in my village.' },
        camera: [
          { type: 'establish', target: [0, 1.5, -2], at: 0, end: 0.45, from: { dist: 22, height: 12, lookY: 1 }, to: { dist: 15, height: 6, lookY: 1.5 } },
          { type: 'track', target: 'noah', at: 0.45, end: 1 },
        ],
        actions: [
          { char: 'noah', action: 'walk', move: [0.2, 1.2], at: 0, end: 0.8, expr: 'happy' },
          { char: 'noah', action: 'wave', at: 0.8, end: 1, expr: 'happy', face: 'mia' },
          { char: 'mia', action: 'wave', at: 0.55, end: 1, expr: 'happy', face: 'noah' },
        ],
        fx: [{ type: 'fireflies', at: [0, 1.2, 0], when: 0 }],
      }],
    },
    {
      ...VILLAGE, transition: 'cut', lighting: 'day', ambience: 'wind', music: 'suspense', props: HOUSES,
      cast: [{ id: 'noah', at: [0.2, 1.2], face: 0 }, { id: 'mia', at: [2.2, -1.2], face: -30 }, { id: 'rex', at: [2, -40], face: 180 }],
      beats: [
        {
          line: { speaker: 'narrator', text: 'Until the ground started shaking.' },
          camera: [
            { type: 'faceClose', target: 'noah', at: 0, end: 0.45 },
            { type: 'groundLow', target: [0.4, 2.2, -5], at: 0.45, end: 1, from: { angle: -20, dist: 9.5, height: -1.6, lookY: 3.6, fov: 48 }, to: { angle: -16, dist: 9, height: -1.6, lookY: 4.2, fov: 46 }, scale: false },
          ],
          actions: [
            { char: 'noah', action: 'scared', at: 0.05, end: 0.45, expr: 'surprised', face: 'front' },
            { char: 'noah', action: 'idle', at: 0.45, end: 1, expr: 'scared', face: 'back' },
            { char: 'mia', action: 'scared', at: 0.1, end: 1, expr: 'scared', face: 'back' },
            { char: 'rex', action: 'walk', move: [1.5, -30], at: 0, end: 1, expr: 'angry' },
          ],
          emotes: [{ char: 'noah', icon: '!', when: 0.1, dur: 1 }],
          sfx: [{ name: 'rumble', when: 0 }],
          fx: [{ type: 'dust', at: 'noah', when: 0.05, shake: 0.6 }],
        },
        {
          line: { speaker: 'narrator', text: 'Something huge was walking into town.' },
          camera: [
            { type: 'groundLow', target: [1, 3, -14], at: 0, end: 0.64, from: { angle: -6, dist: 12, height: -2.6, lookY: 2.5, fov: 70 }, to: { angle: 4, dist: 11, height: -2.6, lookY: 3.0, fov: 70 }, scale: false },
            { type: 'medium', target: ['noah', 'mia'], at: 0.64, end: 1, from: { angle: 155, dist: 6, height: 0.4, lookY: 1.6 }, to: { angle: 165, dist: 5.6, height: 0.3, lookY: 1.9 } },
          ],
          actions: [
            { char: 'rex', action: 'walk', move: [1.0, -12], at: 0, end: 1, expr: 'angry' },
            { char: 'noah', action: 'scared', at: 0, end: 1, expr: 'scared', face: 'back' },
            { char: 'mia', action: 'scared', at: 0, end: 1, expr: 'scared', face: 'back' },
          ],
          destroy: [{ prop: 'h1', when: 0.3, dir: 1 }],
        },
        {
          line: { speaker: 'noah', text: 'Run! Everybody run!' },
          camera: [
            { type: 'frontTrack', target: 'noah', at: 0, end: 0.55 },
            { type: 'lowAngle', target: 'rex', at: 0.55, end: 1 },
          ],
          actions: [
            { char: 'noah', action: 'run', move: [-0.8, 5.5], at: 0, end: 0.9, expr: 'scared' },
            { char: 'mia', action: 'run', move: [1.2, 5.0], at: 0.05, end: 0.95, expr: 'scared' },
            { char: 'rex', action: 'roar', at: 0.1, end: 1, expr: 'angry' },
          ],
          fx: [{ type: 'bigdust', at: 'rex', when: 0.3, shake: 0.9 }],
        },
      ],
    },
    {
      ...VILLAGE, transition: 'flash', lighting: 'storm', weather: 'storm', ambience: 'storm', music: 'suspense', lightningStart: 0.35, props: HOUSES.map((p) => (p.id === 'h1' ? { ...p, collapseT: -10 } : p)),
      cast: [{ id: 'noah', at: [-0.8, 5.5], face: 180 }, { id: 'mia', at: [1.2, 5.0], face: 180 }, { id: 'rex', at: [1.0, -12], face: 0 }, { id: 'titan', at: [-7, -52], face: 10 }],
      beats: [{
        line: { speaker: 'narrator', text: "But it wasn't chasing us. It was running from that." },
        camera: [
          { type: 'closeup', target: 'rex', at: 0, end: 0.35, from: { angle: 30 }, to: { angle: 40 } },
          // over the kids' shoulders, tilting up to the giant on the horizon
          { type: 'reveal', target: [-5, 11, -48], at: 0.35, end: 0.68, from: { angle: 3, dist: 59, height: -9.2, lookY: -4, fov: 50 }, to: { angle: 4, dist: 61, height: -9.4, lookY: 0, fov: 56 }, scale: false },
          // then a slow push-in on its glowing eyes
          { type: 'groundLow', target: 'titan', at: 0.68, end: 1, from: { angle: 8, dist: 9, height: -2.2, lookY: 0.5, fov: 55 }, to: { angle: 4, dist: 7, height: -2.0, lookY: 0.6, fov: 52 } },
        ],
        actions: [
          { char: 'rex', action: 'lookBack', at: 0, end: 0.4, expr: 'scared' },
          { char: 'rex', action: 'scared', at: 0.4, end: 1, expr: 'scared' },
          { char: 'noah', action: 'scared', at: 0, end: 1, expr: 'surprised', face: 'back' },
          { char: 'mia', action: 'scared', at: 0, end: 1, expr: 'scared', face: 'back' },
          { char: 'titan', action: 'roar', at: 0.45, end: 1, expr: 'angry' },
        ],
        sfx: [{ name: 'sting', when: 0.35, gain: 1 }, { name: 'heartbeat', when: 0.05, gain: 0.7 }],
        emotes: [{ char: 'noah', icon: '!?', when: 0.4, dur: 1.4 }],
      }],
    },
  ],
};
