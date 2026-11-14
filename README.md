# Animated Shorts Studio

An automated studio for **3D animated YouTube Shorts**: original stick-figure
cartoon characters with round white heads, set in colourful low-poly worlds,
with voice narration, music, sound effects and word-by-word subtitles. The output
is a vertical 9:16 MP4 at up to **2160 × 3840 (4K)**.

Everything runs in the cloud (GitHub Actions) and is controlled from a
phone-friendly web dashboard. No computer needed.

> **New here? Read [docs/SETUP.md](docs/SETUP.md).** It walks through setup on an Android phone.

## What it does

1. Takes your story idea, or makes up an original one (offline, free)
2. Turns it into a storyboard: scenes, dialogue, actions, camera shots
3. Uses 8 reusable characters that look the same in every scene
4. Builds 3D scenes in six worlds: castle, village, battlefield, school, house, city
5. Animates walking, running, jumping, sword fights, dancing, falling and more,
   with 14 facial expressions, blinking and lip-sync
6. Adds camera moves (dolly, orbit, crane, close-ups), transitions (fade, iris,
   wipe, flash), particles, emotes and comic "BONK!" text
7. Adds narration and character voices (eSpeak NG), procedural music and sound effects
8. Creates word-synchronized English subtitles
9. Renders a vertical MP4 (1080p / 1440p / 4K, 30 or 60 fps)
10. Publishes it as a downloadable file (GitHub Release)

## Status (prototype v0.1)

Tested in the cloud development environment:
- ✅ 15-second demo at 1080 × 1920 and 2160 × 3840 (4K), 30 fps, rendered and
  automatically verified: H.264 + AAC, correct size, fps, frame count and duration,
  decodes cleanly from start to finish, narration within 0 ms of the timeline
- ✅ Unit tests for the story generator, timeline, subtitles, audio and TTS timing
- ⏳ The GitHub Actions workflows are written but will only be proven once they run
  on GitHub (see docs/SETUP.md)

Known limitations: the eSpeak voices sound robotic (free and offline; a better
free neural voice such as Piper is the planned next step). Word timings are
estimated from per-word synthesis and snapped to pauses in the audio, so they are
close but not phoneme-perfect. The story generator uses templates, not an AI model.

## Commands (for the cloud environment)

```bash
npm install
npm test                         # unit tests
npm run demo                     # 15 s demo → output/demo.mp4 (1080p)
node render/cli.js --demo --res 4k --out output/demo-4k.mp4
node render/cli.js --idea "a wizard who sneezes magic" --duration 30
npm run dev                      # dashboard dev server
```

Requires `ffmpeg` and `espeak-ng` (the GitHub workflow installs them).

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how it works.

## Licence

MIT. Uses Three.js (MIT), React (MIT), eSpeak NG (GPL-3, run as a separate program),
FFmpeg (LGPL/GPL, separate program), Playwright/Chromium, and the Inter font
(SIL Open Font License, in `assets/fonts`).
