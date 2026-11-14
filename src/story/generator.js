// Offline story generator: turns a short idea (or nothing) into a complete
// storyboard. It is template based (no paid AI API), seeded so the same
// idea + seed always gives the same story, and it builds a classic short
// comedy arc: intro -> goal -> problem -> attempts -> twist -> punchline.
import { Rng, hashString } from '../engine/rng.js';
import { CHARACTER_LIBRARY } from './characters.js';

const SETTING_KEYWORDS = {
  castle: ['castle', 'king', 'queen', 'prince', 'princess', 'throne', 'royal', 'crown', 'kingdom'],
  village: ['village', 'farm', 'market', 'chicken', 'cow', 'baker', 'wizard', 'magic', 'potion', 'spell'],
  battlefield: ['battle', 'war', 'army', 'fight', 'duel', 'dragon', 'sword', 'knight', 'enemy', 'attack'],
  school: ['school', 'class', 'teacher', 'exam', 'test', 'homework', 'student', 'lesson', 'math'],
  house: ['home', 'house', 'mom', 'dad', 'kitchen', 'cook', 'dinner', 'sofa', 'pet', 'dog', 'cat', 'tv'],
  city: ['city', 'car', 'phone', 'office', 'job', 'traffic', 'street', 'pizza', 'selfie', 'internet', 'robot'],
};

const DEFAULT_CAST = {
  castle: ['king', 'knight', 'bob'], village: ['bob', 'lily', 'wizard'], battlefield: ['knight', 'dragon', 'bob'],
  school: ['teacher', 'max', 'lily'], house: ['bob', 'max', 'lily'], city: ['bob', 'lily', 'max'],
  forest: ['noah', 'mia', 'pete'], mountains: ['noah', 'rook', 'mia'], factory: ['zed', 'noah', 'mayor'],
};

const SECOND_SETTING = { castle: 'village', village: 'castle', battlefield: 'castle', school: 'house', house: 'city', city: 'house', forest: 'village', mountains: 'forest', factory: 'city' };

const MOOD = { castle: 'medieval', village: 'medieval', battlefield: 'adventure', school: 'comedy', house: 'comedy', city: 'city', forest: 'adventure', mountains: 'adventure', factory: 'city' };

const POOLS = {
  medieval: {
    goal: ['the shiniest crown in the land', 'to become a famous hero', 'the last golden apple', 'to win the royal talent show', 'to tame a wild dragon'],
    problem: ['a dragon stole all the cheese', 'the castle gate got stuck', 'the wizard turned the king into a frog', 'a giant chicken attacked', 'someone ate the royal cake'],
    attempt: ['a heroic jump', 'a very dramatic sword swing', 'a magic spell nobody understood', 'asking politely', 'a sneaky disguise'],
    fail: ['It did not go well.', 'That was a terrible idea.', 'Everyone heard the crash.', 'The plan exploded. Literally.'],
    twist: ['the dragon was lactose intolerant', 'the gate said pull, not push', 'the frog liked being a frog', 'the chicken only wanted a friend', 'the cake was hidden in the helmet'],
    punch: ["So... is this a bad time to ask for a raise?", 'I meant to do that!', 'Can we pretend this never happened?', 'Next time, we just order pizza.', 'Ten out of ten. Would panic again.'],
    ending: ['And everyone lived snack-ily ever after.', 'And that is how the kingdom got a new hero.', 'The end. Probably.', 'And nobody ever spoke of it again.'],
  },
  comedy: {
    goal: ['to get the best grade in class', 'to finish homework before lunch', 'the last slice of pizza', 'to win the science fair', 'to be the coolest kid in school'],
    problem: ['the dog ate the homework', 'the exam was today', 'the science project came alive', 'the fridge was completely empty', 'the TV remote vanished'],
    attempt: ['the fastest run ever', 'a brilliant excuse', 'pretending to be sick', 'a secret plan', 'asking the smartest friend'],
    fail: ['The teacher was not impressed.', 'Nobody believed it.', 'It went wrong very quickly.', 'That plan lasted three seconds.'],
    twist: ['the dog got an A plus', 'the exam was actually tomorrow', 'the project just wanted a hug', 'they ate everything while sleepwalking', 'the remote was in the fridge'],
    punch: ['I studied for the wrong subject!', 'Best. Day. Ever.', 'Please do not tell my mom.', 'I am never doing homework again!', 'Worth it.'],
    ending: ['And that is why we always check the calendar.', 'The end. Class dismissed!', 'Lesson learned. Sort of.', 'And they all laughed about it later.'],
  },
  city: {
    goal: ['the perfect selfie', 'to get to work on time', 'the last pizza in the city', 'a million followers', 'a brand new phone'],
    problem: ['the phone battery died', 'every car in the city stopped', 'a pigeon stole the pizza', 'the internet went down', 'the elevator got stuck'],
    attempt: ['running through traffic', 'a very dramatic dance', 'asking strangers for help', 'jumping over everything', 'a genius life hack'],
    fail: ['People stared.', 'That went viral for all the wrong reasons.', 'It did not work.', 'Even the pigeon laughed.'],
    twist: ['the phone was charging the whole time', 'everyone stopped to watch a cat cross the road', 'the pigeon wanted a selfie too', 'the cat unplugged the router', 'they pressed the wrong button'],
    punch: ['Like and subscribe, I guess!', 'Okay, that was actually fun.', 'Please stop filming me.', 'I need a vacation.'],
    ending: ['And that is life in the big city.', 'The end. Do not forget to charge your phone.', 'And the pigeon became famous.'],
  },
  adventure: null,
};
POOLS.adventure = POOLS.medieval;
POOLS.calm = POOLS.comedy; POOLS.tense = POOLS.medieval;

function detectSetting(idea, rng) {
  const t = idea.toLowerCase();
  let best = null, score = 0;
  for (const [s, kws] of Object.entries(SETTING_KEYWORDS)) {
    const n = kws.filter((k) => t.includes(k)).length;
    if (n > score) { best = s; score = n; }
  }
  return best || rng.pick(Object.keys(SETTING_KEYWORDS));
}

function detectCast(idea, setting, chosen) {
  if (chosen && chosen.length) return chosen.filter((c) => CHARACTER_LIBRARY[c]).slice(0, 3);
  const t = idea.toLowerCase();
  const fromIdea = Object.values(CHARACTER_LIBRARY).filter((c) => t.includes(c.role) || t.includes(c.name.toLowerCase().split(' ').pop())).map((c) => c.id);
  const cast = [...new Set([...fromIdea, ...DEFAULT_CAST[setting]])];
  return cast.slice(0, 3);
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const short = (c) => CHARACTER_LIBRARY[c].name.replace(/^(Sir|King|Ms\.|Old) /, '');

function premiseFrom(idea) {
  let s = idea.trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, '');
  if (!s) return null;
  s = s.replace(/^(a story about|story about|about|make a video about|video about)\s+/i, '');
  if (s.split(' ').length > 14) s = s.split(' ').slice(0, 14).join(' ');
  return s;
}

const SPOTS = { left: [-1.4, 0.4], right: [1.4, 0.2], center: [0, 0.6], farLeft: [-3.2, 0.8], farRight: [3.3, 0.8] };

/**
 * idea: free text (optional). characters: ids (optional). duration: seconds.
 */
export function generateStory({ idea = '', characters, duration = 30, seed, environment, mood, narratorVoice = 'storyteller' } = {}) {
  seed = seed ?? hashString(idea || String(Date.now()));
  const rng = new Rng(seed);
  const setting = environment || detectSetting(idea, rng);
  const cast = detectCast(idea, setting, characters);
  const hero = cast[0], friend = cast[1] || cast[0], third = cast[2];
  const pools = POOLS[mood || MOOD[setting]] || POOLS.medieval;
  const pk = rng.int(0, pools.problem.length - 1);
  const goal = rng.pick(pools.goal), problem = pools.problem[pk], twist = pools.twist[pk % pools.twist.length];
  const premise = premiseFrom(idea);
  const H = short(hero), F = short(friend);

  // ---- beats (each about 3 seconds) ----
  const B = [];
  B.push({
    kind: 'intro', line: { speaker: 'narrator', text: premise ? `This is ${H}. ${cap(premise)}.` : `This is ${H}, who wanted ${goal}.` },
    camera: [{ type: 'establish', target: hero, at: 0, end: 0.5 }, { type: 'medium', target: hero, at: 0.5, end: 1 }],
    actions: [{ char: hero, action: 'walk', move: SPOTS.left, at: 0, end: 0.5, expr: 'happy' }, { char: hero, action: 'wave', at: 0.5, end: 1, expr: 'happy', face: 'front' }],
  });
  B.push({
    kind: 'problem', line: { speaker: 'narrator', text: `But one day, ${problem}!` },
    camera: [{ type: 'dollyIn', target: hero, at: 0, end: 1 }],
    actions: [{ char: hero, action: 'scared', at: 0.2, end: 1, expr: 'surprised', face: 'front' }, ...(friend !== hero ? [{ char: friend, action: 'scared', at: 0.25, end: 1, expr: 'scared', face: 'front' }] : [])],
    emotes: [{ char: hero, icon: '!', when: 0.25 }], fx: [{ type: 'smoke', at: [2.5, 0.3, -2], when: 0.15 }],
  });
  const middle = [];
  if (friend !== hero) {
    middle.push({
      kind: 'panic', line: { speaker: friend, text: rng.pick(['Oh no! What do we do now?', 'This is a disaster!', 'We are doomed! Totally doomed!']) },
      camera: [{ type: 'closeup', target: friend, at: 0, end: 1 }],
      actions: [{ char: friend, action: 'talk', at: 0, end: 1, expr: 'scared', face: hero }],
    });
    middle.push({
      kind: 'plan', line: { speaker: hero, text: rng.pick(["Don't worry. I have a brilliant plan.", 'Relax. I am a professional.', 'Leave it to me!']) },
      camera: [{ type: 'lowAngle', target: hero, at: 0, end: 1 }],
      actions: [{ char: hero, action: 'talk', at: 0, end: 1, expr: 'smug', face: friend }], emotes: [{ char: hero, icon: 'idea', when: 0.1 }],
    });
  }
  const attempts = rng.shuffle(pools.attempt);
  const attemptActs = ['jump', 'swordSwing', 'cast', 'run', 'dance'];
  let ai = 0;
  const attemptBeat = () => {
    const att = attempts[ai % attempts.length];
    const act = att.includes('sword') ? 'swordSwing' : att.includes('spell') || att.includes('magic') ? 'cast' : att.includes('jump') ? 'jump' : att.includes('run') ? 'run' : att.includes('dance') ? 'dance' : attemptActs[ai % attemptActs.length];
    ai++;
    const move = act === 'run' ? { move: SPOTS.farRight } : {};
    return [{
      kind: 'attempt', line: { speaker: 'narrator', text: `${H} tried ${att}.` },
      camera: [{ type: rng.pick(['orbit', 'medium', 'wide']), target: hero, at: 0, end: 1 }],
      actions: [{ char: hero, action: act, at: 0.1, end: 1, expr: 'determined', face: 'front', prop: act === 'swordSwing' ? 'sword' : act === 'cast' ? 'wand' : null, ...move }],
      fx: act === 'cast' ? [{ type: 'magic', at: hero, height: 'hand', when: 0.3 }] : act === 'jump' ? [{ type: 'dust', at: hero, when: 0.85 }] : [{ type: 'sparkle', at: hero, height: 'hand', when: 0.4 }],
    }, {
      kind: 'fail', line: { speaker: 'narrator', text: rng.pick(pools.fail) },
      camera: [{ type: 'medium', target: hero, at: 0, end: 1 }],
      actions: [{ char: hero, action: 'fall', at: 0.1, end: 1, expr: 'dizzy' }, ...(friend !== hero ? [{ char: friend, action: 'facepalm', at: 0.3, end: 1, expr: 'sad', face: hero }] : [])],
      fx: [{ type: 'stars', at: hero, height: 0.6, when: 0.35, shake: 0.8 }, { type: 'dust', at: hero, when: 0.3 }],
      comic: [{ text: rng.pick(['BONK!', 'CRASH!', 'OOF!', 'SPLAT!']), at: hero, when: 0.3 }],
    }];
  };
  // fill the middle to reach the requested length
  const targetBeats = Math.max(4, Math.round(duration / 3.1));
  const fixed = duration > 16 ? 5 : 4; // intro, problem, (twist), punchline, ending
  middle.push(...attemptBeat());
  while (middle.length + fixed < targetBeats) {
    if (friend !== hero && rng.chance(0.4)) {
      middle.push({
        kind: 'argue', line: { speaker: friend, text: rng.pick([`${H}, that was the worst plan ever!`, 'Maybe try something smarter?', 'I cannot watch this.']) },
        camera: [{ type: 'overShoulder', target: friend, at: 0, end: 1 }],
        actions: [{ char: friend, action: 'angry', at: 0, end: 1, expr: 'angry', face: hero }, { char: hero, action: 'idle', at: 0, end: 1, expr: 'sad', face: friend }],
        emotes: [{ char: friend, icon: 'anger', when: 0.2 }],
      });
    } else middle.push(...attemptBeat());
  }
  while (middle.length + fixed > targetBeats && middle.length > 2) middle.pop();
  if (duration <= 16) middle.splice(0, middle.length, ...attemptBeat().slice(0, 1));
  B.push(...middle);
  const revealer = third || friend;
  if (duration > 16) B.push({
    kind: 'twist', line: { speaker: 'narrator', text: `Then they found out ${twist}.` },
    camera: [{ type: 'dollyIn', target: [hero, revealer], at: 0, end: 1 }],
    actions: [{ char: hero, action: 'idle', at: 0, end: 1, expr: 'surprised', face: 'front' }, ...(revealer !== hero ? [{ char: revealer, action: 'shrug', at: 0.2, end: 1, expr: 'confused', face: hero }] : [])],
    emotes: [{ char: hero, icon: '?', when: 0.3 }],
  });
  B.push({
    kind: 'punch', line: { speaker: revealer, text: rng.pick(pools.punch) },
    camera: [{ type: 'closeup', target: revealer, at: 0, end: 1 }],
    actions: [{ char: revealer, action: 'laugh', at: 0, end: 1, expr: 'laugh', face: 'front' }],
  });
  B.push({
    kind: 'ending', line: { speaker: 'narrator', text: rng.pick(pools.ending) },
    camera: [{ type: 'orbit', at: 0, end: 1 }],
    actions: cast.map((c, i) => ({ char: c, action: i % 2 ? 'dance' : 'cheer', at: 0, end: 1, expr: 'happy', face: 'front' })),
    fx: [{ type: 'confetti', at: [0, 3.5, 0.5], when: 0.05 }],
  });

  // ---- group beats into scenes (change scenery every 1-3 beats) ----
  const envs = [setting, SECOND_SETTING[setting]];
  const transitions = ['fade', 'iris', 'wipe', 'flash'];
  const scenes = [];
  let i = 0, si = 0;
  while (i < B.length) {
    const left = B.length - i;
    const n = left <= 2 ? left : Math.min(left - 1, rng.int(1, 3));
    const beats = B.slice(i, i + n);
    const used = new Set(beats.flatMap((b) => (b.actions || []).map((a) => a.char)));
    const env = beats.some((b) => b.kind === 'ending') ? setting : envs[si % 3 === 2 ? 1 : 0];
    const ids = cast.filter((c) => used.has(c) || beats[0].kind === 'ending');
    if (!ids.length) ids.push(hero);
    const order = [hero, friend, third].filter((c, k, a) => c && a.indexOf(c) === k && ids.includes(c));
    const spots = order.length === 1 ? [SPOTS.center] : order.length === 2 ? [SPOTS.left, SPOTS.right] : [SPOTS.left, SPOTS.center, SPOTS.right];
    const sceneCast = order.map((c, k) => ({ id: c, at: (k === 0 && beats[0].kind === 'intro') ? SPOTS.farLeft : spots[k], face: k === 0 ? 30 : -30 }));
    scenes.push({ environment: env, transition: si === 0 ? undefined : transitions[si % transitions.length], cast: sceneCast, beats: beats.map(({ kind, ...b }) => b) });
    i += n; si++;
  }
  // characters that appear in actions but not in cast of their scene: add them
  for (const sc of scenes) {
    for (const b of sc.beats) for (const a of b.actions || []) {
      if (!sc.cast.find((c) => c.id === a.char)) sc.cast.push({ id: a.char, at: SPOTS.right, face: -30 });
    }
  }
  const title = premise ? cap(premise) : `${H} and ${cap(problem.split(' ').slice(0, 4).join(' '))}`;
  return {
    title, seed, mood: mood || MOOD[setting], narratorVoice, targetDuration: duration,
    characters: cast, generator: { idea, setting, version: 1 }, scenes,
  };
}
