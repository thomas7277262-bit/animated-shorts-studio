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
// "Patch, the Dog Nobody Picked" – original cast. Each spec is the single
// source of truth for that character's look in every shot.
export const PATCH_CAST = {
  patch: {
    id: 'patch', name: 'Patch', role: 'hero dog', kind: 'animal', model: 'dog', scale: 1,
    fur: '#f2e6cf', patches: 5, patchColor: '#8a5a34', patchSeed: 7, eyePatch: '#8a5a34',
    muzzle: '#f8f0e2', paws: '#f8f0e2', ears: 'oneFloppy', missingLeg: 'FL',
    collar: '#b8473b', tag: '#c9a227', eyeStyle: 'round', brows: 'normal', accent: '#b8473b',
    personality: 'scruffy, hopeful, brave; three legs, one floppy ear',
  },
  duchess: {
    id: 'duchess', name: 'Duchess', role: 'designer puppy', kind: 'animal', model: 'dog', scale: 0.62,
    fur: '#ffffff', fluffy: true, ears: 'floppy', bow: '#ff7eb6', collar: '#ff7eb6', tag: '#ffc21a',
    muzzle: '#ffffff', faceFur: '#ffffff', eyeStyle: 'lashes', brows: 'thin', accent: '#ff7eb6',
    personality: 'tiny, fluffy, pampered',
  },
  owen: {
    id: 'owen', name: 'Owen', role: 'hero kid', style: 'blocky', height: 0.86,
    skin: '#f2c8a4', freckles: true, hair: '#c2502a', hairStyle: 'messy',
    shirt: '#4caf50', shirtDetail: 'hoodie', shirtAccent: '#ffffff', sleeves: 'long', hood: true,
    pants: '#3b5b8c', shoes: '#e94b3c', collarProp: '#d93a3a', accent: '#4caf50',
    eyeStyle: 'round', brows: 'normal', cheeks: false, personality: 'quiet, kind, always picked last',
  },
  vivian: {
    id: 'vivian', name: 'Mrs. Vandermeer', role: 'rich mom', style: 'blocky', height: 1.05,
    skin: '#f5d3b8', hair: '#f3d27a', hairStyle: 'updo', sunglasses: true, pearls: true, handbag: '#d4af37',
    shirt: '#fbfbf7', shirtDetail: 'blouse', shirtAccent: '#d4af37', sleeves: 'long', pants: '#f2eee5', shoes: '#d4af37',
    accent: '#d4af37', eyeStyle: 'lashes', brows: 'thin', cheeks: false, personality: 'snobby, learns to be kind',
  },
  preston: {
    id: 'preston', name: 'Mr. Vandermeer', role: 'rich dad', style: 'blocky', height: 1.1,
    skin: '#e9c2a0', hair: '#2b2b2b', hairStyle: 'slick', sunglasses: true, watch: '#d4af37',
    shirt: '#f6f4ee', shirtDetail: 'suit', shirtAccent: '#d4af37', sleeves: 'long', pants: '#efece4', shoes: '#8b6b3a',
    accent: '#d4af37', eyeStyle: 'round', brows: 'thick', cheeks: false, personality: 'proud, mostly on his phone',
  },
  reyes: {
    id: 'reyes', name: 'Ms. Reyes', role: 'shelter worker', style: 'blocky', height: 1.0,
    skin: '#b07a52', hair: '#2a1a12', hairStyle: 'bun',
    shirt: '#2bb3a3', shirtDetail: 'paw', shirtAccent: '#ffffff', pants: '#3a4a5c', shoes: '#ffffff', lanyard: '#ff9f1c',
    accent: '#2bb3a3', eyeStyle: 'round', brows: 'normal', cheeks: true, personality: 'warm, patient, believes in every dog',
  },
};
Object.assign(CHARACTER_LIBRARY, PATCH_CAST);

// ---------------------------------------------------------------------------
// "The Weakest Pet in the World" – original cast.
export const WEAKEST_PET_CAST = {
  maxkid: {
    id: 'maxkid', name: 'Max', role: 'hero kid', style: 'blocky', height: 0.88,
    skin: '#f0c9a0', hair: '#2b1d14', hairStyle: 'spiky', cheeks: true,
    shirt: '#ff8c2a', shirtDetail: 'zip', shirtAccent: '#ffffff', sleeves: 'long', hood: true,
    pants: '#4a5b6e', shoes: '#2fd0c8', accent: '#ff8c2a', eyeStyle: 'round', brows: 'normal',
    personality: 'kind, stubborn, never gives up on Nugget',
  },
  brax: {
    id: 'brax', name: 'Brax', role: 'bully', style: 'blocky', height: 1.1,
    skin: '#e9b98f', hairStyle: 'cap', hatColor: '#d62828',
    shirt: '#26262e', shirtDetail: 'stripe', shirtAccent: '#d62828', sleeves: 'short',
    pants: '#2a2a33', shoes: '#111111', accent: '#d62828', eyeStyle: 'determined', brows: 'thick',
    personality: 'loud, proud, secretly scared',
  },
  nugget: {
    id: 'nugget', name: 'Nugget', role: 'hero hamster', kind: 'animal', model: 'dog', scale: 0.5,
    fur: '#eea95c', belly: '#fff1dc', muzzle: '#fff1dc', faceFur: '#f3b673', ears: 'round', earColor: '#f6b8b0',
    body: [1.35, 1.3, 0.75], round: true, legScale: 0.4, headScale: 1.25, tail: 'stub', snout: 'small',
    cheeks: true, eyeStyle: 'round', brows: 'normal', accent: '#eea95c', personality: 'tiny, brave, power level 0',
  },
  nuggetGold: {
    id: 'nuggetGold', name: 'Golden Nugget', role: 'giant form', kind: 'animal', model: 'dog', scale: 9,
    fur: '#ffc928', belly: '#fff3b0', muzzle: '#fff3b0', faceFur: '#ffd451', ears: 'round', earColor: '#ffe08a',
    body: [1.35, 1.3, 0.75], round: true, legScale: 0.4, headScale: 1.25, tail: 'stub', snout: 'small',
    cheeks: true, eyeStyle: 'determined', brows: 'thick', glow: 0.55, accent: '#ffc928', personality: 'power level 9,999,999,999',
  },
  tiger: {
    id: 'tiger', name: "Brax's tiger", role: 'bully pet', kind: 'animal', model: 'dog', scale: 1.35,
    fur: '#f08a24', stripes: '#2a1a10', belly: '#fff6ea', muzzle: '#fff6ea', faceFur: '#f39a3a',
    ears: 'round', earColor: '#e07a1c', earSize: 0.6, body: [1.3, 1.15, 1.1], legScale: 0.85, headScale: 1.2, round: true,
    tail: 'long', tailTip: '#2a1a10', eyeStyle: 'determined', brows: 'thick', accent: '#f08a24',
  },
  lion: {
    id: 'lion', name: 'Lion', role: 'pet', kind: 'animal', model: 'dog', scale: 1.4,
    fur: '#e3b04b', mane: '#a8652a', muzzle: '#f5deb3', faceFur: '#e8bb5d', ears: 'pointed', earColor: '#c98f3a',
    tail: 'long', tailTip: '#a8652a', eyeStyle: 'round', brows: 'normal', accent: '#e3b04b',
  },
  petdragon: {
    id: 'petdragon', name: 'Dragon', role: 'pet', kind: 'animal', model: 'dog', scale: 1.3,
    fur: '#4cc36a', belly: '#e9f7b0', muzzle: '#6fd486', faceFur: '#55c973', wings: '#2f9e57', horns: '#fff2c2',
    ears: 'pointed', earColor: '#2f9e57', tail: 'long', tailTip: '#2f9e57', eyeStyle: 'determined', brows: 'normal', accent: '#4cc36a',
  },
  shadowbeast: {
    id: 'shadowbeast', name: 'Shadow Monster', kind: 'creature', model: 'beast', scale: 3.4,
    color: '#2a1840', belly: '#3a2458', spikes: '#6c2bd9', glow: '#d14dff', accent: '#d14dff',
  },
};
// ids used in timelines
for (const [k, v] of Object.entries(WEAKEST_PET_CAST)) v.id = k;
Object.assign(CHARACTER_LIBRARY, WEAKEST_PET_CAST);
