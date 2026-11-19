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

// ---------------------------------------------------------------------------
// Blocky (game-avatar style) cast. Original designs: every character has a
// fixed outfit, hair and voice so they look identical in every scene.
export const BLOCKY_CHARACTERS = {
  noah: {
    id: 'noah', name: 'Noah', role: 'hero', style: 'blocky', height: 1.0,
    skin: '#eab48b', shirt: '#2f80ed', shirtDetail: 'stripe', shirtAccent: '#ffffff', pants: '#26334d', shoes: '#f2f2f2',
    hair: '#5a3311', hairStyle: 'spiky', accent: '#2f80ed', eyeStyle: 'round', brows: 'normal', cheeks: false,
    voice: { espeak: 'en-us+m7', pitch: 62, speed: 170 }, personality: 'curious, brave when it counts',
  },
  mia: {
    id: 'mia', name: 'Mia', role: 'friend', style: 'blocky', height: 0.96,
    skin: '#c68a5e', shirt: '#ff5fa2', shirtDetail: 'star', shirtAccent: '#ffe14a', pants: '#3d2e6b', shoes: '#ffffff',
    hair: '#1d1209', hairStyle: 'long', accent: '#ff5fa2', eyeStyle: 'lashes', brows: 'thin', cheeks: true,
    voice: { espeak: 'en-us+f3', pitch: 72, speed: 172 }, personality: 'quick thinker, sarcastic',
  },
  pete: {
    id: 'pete', name: 'Old Pete', role: 'elder', style: 'blocky', height: 0.98,
    skin: '#f1c7a0', shirt: '#c97b3c', shirtDetail: 'overalls', shirtAccent: '#3a5fa0', pants: '#3a5fa0', shoes: '#4a2e18',
    hair: '#e8e8e8', hairStyle: 'default', accent: '#c97b3c', eyeStyle: 'sleepy', brows: 'bushy', cheeks: false,
    voice: { espeak: 'en-gb+m1', pitch: 30, speed: 145 }, personality: 'farmer who has seen everything',
  },
  rook: {
    id: 'rook', name: 'Captain Rook', role: 'guard', style: 'blocky', height: 1.08,
    skin: '#d9a679', shirt: '#7d8794', shirtDetail: 'armor', shirtAccent: '#c0392b', pants: '#4a4f57', shoes: '#2b2b2b',
    hairStyle: 'helmet', accent: '#c0392b', eyeStyle: 'determined', brows: 'thick', cheeks: false,
    voice: { espeak: 'en-gb+m4', pitch: 38, speed: 158 }, personality: 'loud, brave, bad at plans',
  },
  mayor: {
    id: 'mayor', name: 'Mayor Bricks', role: 'mayor', style: 'blocky', height: 1.02,
    skin: '#f0c296', shirt: '#2d2d3a', shirtDetail: 'tie', shirtAccent: '#e74c3c', pants: '#2d2d3a', shoes: '#111',
    hair: '#9a9a9a', hairStyle: 'crown', accent: '#ffc21a', eyeStyle: 'round', brows: 'thick', cheeks: true,
    voice: { espeak: 'en-us+m1', pitch: 35, speed: 150 }, personality: 'proud and easily panicked',
  },
  zed: {
    id: 'zed', name: 'Zed', role: 'prankster', style: 'blocky', height: 0.9,
    skin: '#8d5a3b', shirt: '#27ae60', shirtDetail: 'zip', shirtAccent: '#1e8449', pants: '#1f2a36', shoes: '#e74c3c',
    hairStyle: 'cap', hatColor: '#e74c3c', accent: '#27ae60', eyeStyle: 'round', brows: 'normal', cheeks: false,
    voice: { espeak: 'en-us+m3', pitch: 70, speed: 180 }, personality: 'mischievous, always filming',
  },
};

// Giant creatures (original designs). scale 1 is about 3.5x a character's height.
export const CREATURE_LIBRARY = {
  rex: { id: 'rex', name: 'Gronk', kind: 'creature', model: 'beast', scale: 1, color: '#5f9e3a', belly: '#e8c66a', spikes: '#e2622b', accent: '#5f9e3a', personality: 'huge, loud, secretly a coward' },
  titan: { id: 'titan', name: 'The Shadow Titan', kind: 'creature', model: 'beast', scale: 3.2, color: '#1e1b29', belly: '#2c2838', spikes: '#3a3150', glow: '#ff2a2a', accent: '#ff2a2a', personality: 'unknown' },
};

Object.assign(CHARACTER_LIBRARY, BLOCKY_CHARACTERS, CREATURE_LIBRARY);

// ---------------------------------------------------------------------------
// "Captain Hush" cast (original): a bossy toddler and her four baby brothers.
// Small heights give the big-headed toddler/baby proportions.
export const FAMILY_CHARACTERS = {
  daisy: {
    id: 'daisy', name: 'Daisy', role: 'toddler',
    accessory: 'bow', accent: '#9b5cff', height: 0.66,
    eyeStyle: 'lashes', brows: 'thick', cheeks: true,
    voice: { espeak: 'en-us+f5', pitch: 92, speed: 165 },
    personality: 'two years old and absolutely in charge',
  },
  ike: { id: 'ike', name: 'Ike', role: 'baby', accessory: 'none', accent: '#2fb8ff', height: 0.5, eyeStyle: 'round', brows: 'thin', cheeks: true, voice: { espeak: 'en-us+m7', pitch: 99, speed: 180 }, personality: 'giggles at everything' },
  ollie: { id: 'ollie', name: 'Ollie', role: 'baby', accessory: 'cap', accent: '#ffb000', height: 0.5, eyeStyle: 'round', brows: 'thin', cheeks: true, voice: { espeak: 'en-us+m7', pitch: 95, speed: 180 }, personality: 'loudest laugh in the house' },
  ben: { id: 'ben', name: 'Ben', role: 'baby', accessory: 'none', accent: '#3dbb3d', height: 0.5, eyeStyle: 'round', brows: 'thin', cheeks: true, voice: { espeak: 'en-us+m7', pitch: 97, speed: 180 }, personality: 'copies whatever Ollie does' },
  gus: { id: 'gus', name: 'Gus', role: 'baby', accessory: 'none', accent: '#ff5a36', height: 0.5, eyeStyle: 'sleepy', brows: 'thin', cheeks: true, voice: { espeak: 'en-us+m7', pitch: 93, speed: 180 }, personality: 'always sleepy' },
};

Object.assign(CHARACTER_LIBRARY, FAMILY_CHARACTERS);
