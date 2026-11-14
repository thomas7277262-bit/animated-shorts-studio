# Architecture

```
 Phone (browser)                         GitHub Actions (cloud computer)
 ┌──────────────────────────┐            ┌─────────────────────────────────────────┐
 │ React dashboard (Pages)  │  dispatch  │ render/cli.js                           │
 │  idea → generateStory()  │ ─────────► │  1. storyboard (JSON)                   │
 │  live 3D preview         │ storyboard │  2. eSpeak NG voices + word timings     │
 │  (same Three.js engine)  │            │  3. buildTimeline()  ← single clock     │
 │  music/SFX preview       │ ◄───────── │  4. music + SFX + voice mix (WAV)       │
 │  Download MP4            │  Release   │  5. .ass word-highlight subtitles       │
 └──────────────────────────┘            │  6. headless Chromium + Three.js frames │
                                         │     (4 parallel workers) → H.264        │
                                         │  7. FFmpeg: burn subs + AAC audio → MP4 │
                                         │  8. verify (ffprobe, decode, A/V sync)  │
                                         │  9. GitHub Release with the MP4         │
                                         └─────────────────────────────────────────┘
```

## Folders

| Path | What it is |
|---|---|
| `src/engine/` | 3D engine: characters (`character.js`, `face.js`), animation library (`poses.js`), six low-poly worlds (`environments/`), camera moves (`camera.js`), particles, emotes, comic text, transitions (`effects.js`), and the `StoryPlayer` (`player.js`) |
| `src/story/` | Character library, offline story generator, demo story, storyboard → timeline |
| `src/audio/synth.js` | Procedural music (6 moods), 16 synthesized sound effects, mixer with ducking, WAV encoder |
| `src/dashboard/` | React mobile dashboard |
| `src/render-page/` | Page that headless Chromium opens to render frames |
| `render/` | Node pipeline: TTS, subtitles, frame capture, final encode, verification |
| `.github/workflows/` | `render.yml` (cloud render), `ci.yml` (tests + demo render on every push), `pages.yml` (dashboard) |

## Key ideas

- **One timeline drives everything.** Picture, voice, sound effects and subtitles
  all read the same absolute times, so they stay in sync by construction. The
  verifier then checks the final MP4 by cross-correlating each voice clip with
  the file's audio.
- **Deterministic frames.** `StoryPlayer.renderFrame(t)` depends only on `t`. There is
  no physics state, so frames can be rendered in any order and in parallel, at any
  resolution.
- **Audio-first timing.** The real voice is synthesized first. Scenes stretch to fit
  the narration, and the voice speeds up a little if a story is too long for the
  chosen duration.
- **Consistent characters.** Each character is a fixed spec (accessory, accent-colour
  scarf, height, eye style, voice) in `src/story/characters.js` and is built from it
  for every scene.

## Storyboard format (what the generator writes and the renderer reads)

```jsonc
{
  "title": "…", "seed": 42, "mood": "adventure", "narratorVoice": "storyteller", "targetDuration": 15,
  "scenes": [{
    "environment": "castle", "transition": "iris",
    "cast": [{ "id": "knight", "at": [-2.6, 0.5], "face": 90 }],
    "beats": [{
      "line": { "speaker": "narrator", "text": "Sir Clank was the bravest knight." },
      "camera": [{ "type": "establish", "target": "knight", "at": 0, "end": 0.5 }],
      "actions": [{ "char": "knight", "action": "walk", "move": [0, 0.8], "at": 0, "end": 0.4, "expr": "determined", "prop": "sword" }],
      "fx": [{ "type": "sparkle", "at": "knight", "when": 0.45 }],
      "emotes": [{ "char": "knight", "icon": "!", "when": 0.2 }],
      "comic": [{ "text": "CLANK!", "at": [0, 3.5, 0], "when": 0.5 }]
    }]
  }]
}
```
`at`, `end` and `when` are fractions (0–1) of the beat. A beat lasts as long as its
spoken line plus padding, then stretches to reach the target duration.

Building blocks:
- **Actions:** idle, talk, walk, run, sneak, jump, wave, cheer, point, scared, angry, laugh, facepalm, shrug, think, bow, fall, swordSwing, cast, sit, dance, dizzy
- **Expressions:** neutral, happy, laugh, sad, angry, surprised, scared, smug, confused, determined, dizzy, sleepy, love, cry
- **Shots:** wide, establish, medium, closeup, dollyIn, dollyOut, orbit, crane, lowAngle, overShoulder, follow
- **Effects:** dust, stars, sparkle, magic, confetti, smoke, impact (+ camera shake), hearts, fire
- **Transitions:** fade, flash, iris, wipe, cut
