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
    skin: '#f3cfa8', hair: '#4a2c17', hairStyle: 'swept', cheeks: true,
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
    id: 'nuggetGold', name: 'Golden Nugget', role: 'giant form', kind: 'animal', model: 'dog', scale: 14,
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
    id: 'shadowbeast', name: 'Shadow Monster', kind: 'creature', model: 'beast', scale: 3.0,
    color: '#4a2d78', belly: '#6b45a0', spikes: '#9a4dff', glow: '#e070ff', accent: '#d14dff',
  },
  // supporting cast
  kitten: {
    id: 'kitten', name: 'Kitten', kind: 'animal', model: 'dog', scale: 0.42,
    fur: '#9aa3ad', belly: '#f4f4f4', muzzle: '#f4f4f4', faceFur: '#a7b0ba', ears: 'pointed', earColor: '#f6b8b0',
    tail: 'long', snout: 'small', headScale: 1.3, legScale: 0.8, eyeStyle: 'round', brows: 'thin', cheeks: true, accent: '#9aa3ad',
  },
  pigeon: {
    id: 'pigeon', name: 'Pigeon', kind: 'animal', model: 'dog', scale: 0.36,
    fur: '#8e97a6', belly: '#b9c1cc', muzzle: '#f2b33d', faceFur: '#6d7f99', ears: 'round', earColor: '#8e97a6', earSize: 0.2,
    body: [1.0, 1.1, 1.1], round: true, legScale: 0.45, headScale: 1.0, wings: '#6f7887', tail: 'stub', snout: 'small',
    eyeStyle: 'round', brows: 'thin', accent: '#8e97a6',
  },
  puppy: {
    id: 'puppy', name: 'Puppy', kind: 'animal', model: 'dog', scale: 0.55,
    fur: '#d9a066', muzzle: '#fbe7cc', faceFur: '#e0aa70', ears: 'floppy', earColor: '#a86b34', collar: '#2f80ed', tag: '#ffc21a',
    headScale: 1.2, eyeStyle: 'round', brows: 'normal', cheeks: true, accent: '#d9a066',
  },
  policedog: {
    id: 'policedog', name: 'Police dog', kind: 'animal', model: 'dog', scale: 1.15,
    fur: '#7a5230', faceFur: '#2b2118', muzzle: '#2b2118', ears: 'pointed', earColor: '#2b2118', collar: '#1d4ed8', tag: '#ffd34d',
    tail: 'long', eyeStyle: 'determined', brows: 'thick', accent: '#1d4ed8',
  },
  firedragon: {
    id: 'firedragon', name: 'Fire dragon', kind: 'animal', model: 'dog', scale: 1.4,
    fur: '#e2462f', belly: '#ffd28a', muzzle: '#ef6a48', faceFur: '#e65438', wings: '#a92a1c', horns: '#fff2c2',
    ears: 'pointed', earColor: '#a92a1c', tail: 'long', tailTip: '#ffb02e', eyeStyle: 'determined', brows: 'thick', accent: '#e2462f',
  },
  eagle: {
    id: 'eagle', name: "The mayor's giant eagle", kind: 'animal', model: 'dog', scale: 2.4,
    fur: '#6b4423', belly: '#7d5530', muzzle: '#f2b33d', faceFur: '#ffffff', ears: 'round', earColor: '#ffffff', earSize: 0.2,
    body: [1.1, 1.1, 1.2], round: true, legScale: 0.6, headScale: 1.05, wings: '#4e311a', tail: 'stub', snout: 'small',
    eyeStyle: 'determined', brows: 'thick', accent: '#6b4423',
  },
  grandma: {
    id: 'grandma', name: 'Grandma', role: 'neighbour', style: 'blocky', height: 0.95,
    skin: '#f1c9a6', hair: '#e6e6e6', hairStyle: 'bun', pearls: true,
    shirt: '#b56fc2', shirtDetail: 'blouse', shirtAccent: '#ffffff', sleeves: 'long', pants: '#5b4a6e', shoes: '#6b4a2e',
    accent: '#b56fc2', eyeStyle: 'sleepy', brows: 'thin', cheeks: true, personality: 'sweet, slow, lots of groceries',
  },
  tot: {
    id: 'tot', name: 'Little kid', role: 'kid', style: 'blocky', height: 0.68,
    skin: '#c98d62', hair: '#1d1209', hairStyle: 'pigtails',
    shirt: '#ffd23f', shirtDetail: 'star', shirtAccent: '#ff5fa2', pants: '#5b8def', shoes: '#ff5fa2',
    accent: '#ffd23f', eyeStyle: 'lashes', brows: 'thin', cheeks: true, personality: 'tiny, loves her balloon',
  },
};
// ids used in timelines
for (const [k, v] of Object.entries(WEAKEST_PET_CAST)) v.id = k;
Object.assign(CHARACTER_LIBRARY, WEAKEST_PET_CAST);

// ---------------------------------------------------------------------------
// "The Town Where the Lights Go Out at 9" – original cast.
export const LIGHTS_CAST = {
  leo: {
    name: 'Leo', role: 'hero kid', style: 'blocky', height: 0.86,
    skin: '#e8b48a', hair: '#3b2416', hairStyle: 'messy', cheeks: true,
    shirt: '#2f6fd6', shirtDetail: 'hoodie', shirtAccent: '#ffd23f', sleeves: 'long', hood: true,
    pants: '#7a6a55', shoes: '#e94b3c', accent: '#2f6fd6', eyeStyle: 'round', brows: 'normal',
    personality: 'counts everything out loud; calm, brave, a bit shy',
  },
  grandpa: {
    name: 'Grandpa', role: 'lighthouse keeper', style: 'blocky', height: 0.98,
    skin: '#efc6a2', hairStyle: 'cap', hatColor: '#1f2f4f', beard: '#f1f1f1',
    shirt: '#2a3d63', shirtDetail: 'zip', shirtAccent: '#c9a227', sleeves: 'long', pants: '#3b3b44', shoes: '#4a2e18',
    accent: '#c9a227', eyeStyle: 'sleepy', brows: 'bushy', cheeks: true, personality: 'gentle, proud, losing his sight',
  },
  dad: {
    name: 'Dad', role: 'fisherman', style: 'blocky', height: 1.08,
    skin: '#e3ae84', hair: '#3b2416', hairStyle: 'cap', hatColor: '#f6c026',
    shirt: '#f6c026', shirtDetail: 'zip', shirtAccent: '#d9a400', sleeves: 'long', pants: '#2c3e50', shoes: '#222222',
    accent: '#f6c026', eyeStyle: 'round', brows: 'thick', cheeks: false, personality: 'warm, tired, always home before nine',
  },
  mum: {
    name: 'Mum', role: 'mum', style: 'blocky', height: 1.0,
    skin: '#e8b48a', hair: '#5a3311', hairStyle: 'long',
    shirt: '#b0553f', shirtDetail: 'blouse', shirtAccent: '#ffffff', sleeves: 'long', pants: '#3d4a5c', shoes: '#6b4a2e',
    accent: '#b0553f', eyeStyle: 'lashes', brows: 'thin', cheeks: true, personality: 'worried, strong',
  },
};
for (const [k, v] of Object.entries(LIGHTS_CAST)) v.id = k;
Object.assign(CHARACTER_LIBRARY, LIGHTS_CAST);

// "Every Time I Sneeze, I Swap Places With a Stranger" cast
export const SNEEZE_CAST = {
  max: {
    name: 'Max', role: 'hero kid', style: 'blocky', height: 0.86,
    skin: '#f0c19a', hair: '#7a4a22', hairStyle: 'spiky', cheeks: true,
    shirt: '#2fbf71', shirtDetail: 'hoodie', shirtAccent: '#ffffff', sleeves: 'long', hood: true,
    pants: '#2c3e70', shoes: '#ff8a1a', accent: '#2fbf71', eyeStyle: 'round', brows: 'normal',
    personality: 'allergic to everything, quick, panics then improvises',
  },
  teacher: {
    name: 'Ms Park', role: 'maths teacher', style: 'blocky', height: 1.0,
    skin: '#e8b48a', hair: '#1d1209', hairStyle: 'bun', accessory: 'glasses',
    shirt: '#7e57c2', shirtDetail: 'blouse', shirtAccent: '#ffffff', sleeves: 'long', pants: '#3d3d55', shoes: '#4a2e18',
    accent: '#7e57c2', eyeStyle: 'lashes', brows: 'thin', cheeks: true, personality: 'strict, secretly delighted',
  },
  chef: {
    name: 'Chef Tony', role: 'pizza chef', style: 'blocky', height: 1.05,
    skin: '#e3ae84', hair: '#2b1a10', hairStyle: 'chef', beard: '#2b1a10',
    shirt: '#ffffff', shirtDetail: 'zip', shirtAccent: '#d8402a', sleeves: 'long', pants: '#2f2f2f', shoes: '#1d1d1d',
    accent: '#d8402a', eyeStyle: 'round', brows: 'thick', cheeks: true, personality: 'loud, confused, good at maths',
  },
  zookeeper: {
    name: 'Zookeeper', role: 'zookeeper', style: 'blocky', height: 1.02,
    skin: '#c98d62', hair: '#1d1209', hairStyle: 'cap', hatColor: '#8a7a4a',
    shirt: '#b5a46a', shirtDetail: 'zip', shirtAccent: '#6b5d33', sleeves: 'short', pants: '#6b5d33', shoes: '#4a2e18',
    accent: '#8a7a4a', eyeStyle: 'round', brows: 'normal', cheeks: false, personality: 'calm with lions, panics at fractions',
  },
  bride: {
    name: 'Bride', role: 'bride', style: 'blocky', height: 1.0,
    skin: '#f1c9a6', hair: '#c98a3a', hairStyle: 'veil',
    shirt: '#ffffff', shirtDetail: 'dress', shirtAccent: '#ffd1e3', sleeves: 'short', pants: '#ffffff', shoes: '#ffffff',
    accent: '#ffd1e3', eyeStyle: 'lashes', brows: 'thin', cheeks: true, personality: 'very confused',
  },
  firefighter: {
    name: 'Firefighter', role: 'fire truck driver', style: 'blocky', height: 1.08,
    skin: '#8d5a3b', hair: '#111111', hairStyle: 'firehat',
    shirt: '#3a3a3a', shirtDetail: 'stripe', shirtAccent: '#ffd23f', sleeves: 'long', pants: '#3a3a3a', shoes: '#111111',
    accent: '#ffd23f', eyeStyle: 'round', brows: 'thick', cheeks: false, personality: 'brave',
  },
  pilot: {
    name: 'Captain', role: 'airline pilot', style: 'blocky', height: 1.06,
    skin: '#f1c9a6', hair: '#6b6b6b', hairStyle: 'cap', hatColor: '#1f2f4f',
    shirt: '#1f2f4f', shirtDetail: 'tie', shirtAccent: '#ffc21a', sleeves: 'long', pants: '#1f2f4f', shoes: '#111111',
    accent: '#ffc21a', eyeStyle: 'round', brows: 'bushy', cheeks: false, personality: 'calm, loves pepper sandwiches',
  },
  doctor: {
    name: 'Doctor', role: 'doctor', style: 'blocky', height: 1.02,
    skin: '#c98d62', hair: '#1d1209', hairStyle: 'slick', accessory: 'glasses',
    shirt: '#ffffff', shirtDetail: 'suit', shirtAccent: '#4fb6ff', sleeves: 'long', pants: '#4f6d8a', shoes: '#1d1d1d',
    accent: '#4fb6ff', eyeStyle: 'round', brows: 'normal', cheeks: false, personality: 'kind',
  },
  goalie: {
    name: 'Goalkeeper', role: 'goalkeeper', style: 'blocky', height: 1.06,
    skin: '#e3ae84', hair: '#c98a3a', hairStyle: 'swept',
    shirt: '#ffd23f', shirtDetail: 'stripe', shirtAccent: '#1b1b1b', sleeves: 'long', pants: '#1b1b1b', shoes: '#2fbf71',
    accent: '#ffd23f', eyeStyle: 'determined', brows: 'thick', cheeks: false, personality: 'never misses a save',
  },
  lion: {
    name: 'Lion', kind: 'animal', model: 'dog', scale: 1.5,
    fur: '#e0a743', belly: '#f3d08a', muzzle: '#f6dfa6', faceFur: '#e7b452', mane: '#a8561c', ears: 'round', earColor: '#b8701f', earSize: 0.22,
    tail: 'long', tailTip: '#7a3a12', headScale: 1.15, eyeStyle: 'determined', brows: 'thick', accent: '#e0a743',
  },
};
for (const [k, v] of Object.entries(SNEEZE_CAST)) v.id = k;
Object.assign(CHARACTER_LIBRARY, SNEEZE_CAST);
