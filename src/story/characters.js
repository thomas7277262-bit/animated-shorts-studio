// The character library. Every character shares the house style:
// a round white head, black stick limbs and an expressive cartoon face.
// What makes each one recognisable (and keeps them consistent across every
// scene of a story) is this fixed spec: accessory, accent colour, height,
// face style and voice.

export const CHARACTER_LIBRARY = {
  bob: {
    id: 'bob', name: 'Bob', role: 'hero',
    accessory: 'none', accent: '#ff5a36', height: 1.0,
    eyeStyle: 'round', brows: 'normal', cheeks: true,
    voice: { espeak: 'en-us+m3', pitch: 50, speed: 165 },
    personality: 'cheerful and a bit clumsy',
  },
  king: {
    id: 'king', name: 'King Bartholomew', role: 'king',
    accessory: 'crown', accent: '#7b3fe4', height: 1.05,
    eyeStyle: 'sleepy', brows: 'thick', cheeks: false, beard: true,
    voice: { espeak: 'en-gb+m1', pitch: 30, speed: 150 },
    personality: 'pompous but kind-hearted',
  },
  knight: {
    id: 'knight', name: 'Sir Clank', role: 'knight',
    accessory: 'helmet', accent: '#9aa4b1', height: 1.1,
    eyeStyle: 'determined', brows: 'thick', cheeks: false,
    voice: { espeak: 'en-gb+m4', pitch: 40, speed: 160 },
    personality: 'brave, loud and not very smart',
  },
  lily: {
    id: 'lily', name: 'Lily', role: 'friend',
    accessory: 'bow', accent: '#ff4fa3', height: 0.92,
    eyeStyle: 'lashes', brows: 'thin', cheeks: true,
    voice: { espeak: 'en-us+f3', pitch: 70, speed: 170 },
    personality: 'smart and sarcastic',
  },
  wizard: {
    id: 'wizard', name: 'Old Zib', role: 'wizard',
    accessory: 'wizardHat', accent: '#2d6cdf', height: 0.98,
    eyeStyle: 'round', brows: 'bushy', cheeks: false, beard: true,
    voice: { espeak: 'en-gb-x-rp+m2', pitch: 25, speed: 145 },
    personality: 'wise, forgetful, sneezes magic',
  },
  teacher: {
    id: 'teacher', name: 'Ms. Pickles', role: 'teacher',
    accessory: 'glasses', accent: '#1fa37a', height: 1.02,
    eyeStyle: 'round', brows: 'thin', cheeks: false,
    voice: { espeak: 'en-us+f2', pitch: 60, speed: 160 },
    personality: 'strict but secretly funny',
  },
  max: {
    id: 'max', name: 'Max', role: 'kid',
    accessory: 'cap', accent: '#ffb000', height: 0.85,
    eyeStyle: 'round', brows: 'normal', cheeks: true,
    voice: { espeak: 'en-us+m7', pitch: 75, speed: 175 },
    personality: 'mischievous prankster',
  },
  dragon: {
    id: 'dragon', name: 'Sparky', role: 'creature',
    accessory: 'horns', accent: '#3dbb3d', height: 1.15, creature: true,
    eyeStyle: 'determined', brows: 'thick', cheeks: true,
    voice: { espeak: 'en-us+m5', pitch: 20, speed: 140 },
    personality: 'a tiny dragon who thinks he is huge',
  },
};

export const NARRATOR_VOICES = {
  storyteller: { espeak: 'en-us+m3', pitch: 45, speed: 160, label: 'Storyteller (male)' },
  storytellerF: { espeak: 'en-us+f4', pitch: 55, speed: 160, label: 'Storyteller (female)' },
  british: { espeak: 'en-gb-x-rp+m3', pitch: 40, speed: 155, label: 'British narrator' },
  energetic: { espeak: 'en-us+m7', pitch: 60, speed: 180, label: 'Energetic' },
};

export function getCharacter(id) {
  const c = CHARACTER_LIBRARY[id];
  if (!c) throw new Error(`Unknown character "${id}"`);
  return c;
}
