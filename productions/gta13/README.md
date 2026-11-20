# Why Did GTA 6 Take 13 Years? (90-second Short)

Original motion-graphics documentary, 1080×1920, 30 fps, about 93 seconds.
Every visual is drawn in code (canvas), and the music and sound effects are synthesized
in `audio.py`. No Rockstar footage, logos or music are used, so the video has nothing
in it for Content ID to match.

| File | What it is |
| --- | --- |
| `main.js` | All scenes; `renderAt(t)` draws one frame for time `t` |
| `index.html` | Page loaded by the renderer (open `index.html?play` in a browser to preview) |
| `render.mjs` | Headless Chromium → H.264 frames (`--snap` for stills, `--video` for the full render) |
| `audio.py` | Synthwave score + sound effects, ducked under the narration, loudness −14 LUFS |
| `assets/words.json` | Word timings of the narration (from the transcript) that drive subtitles and scene timing |
| `assets/states.json` | U.S. state outlines from the public-domain Census boundaries (via `us-atlas`) |
| `assets/*.woff2` | Anton and Bebas Neue fonts (SIL Open Font License, see the `-OFL.txt` files) |

## Rebuild

The narration (`output/gta13/narration.mp3`) was generated with ElevenLabs and isn't committed.

```bash
node productions/gta13/render.mjs --video output/gta13/video_silent.mp4 --fps 30 --workers 4
python3 productions/gta13/audio.py output/gta13/narration.mp3 productions/gta13/assets/words.json output/gta13/mix.wav
ffmpeg -i output/gta13/video_silent.mp4 -i output/gta13/mix.wav -c:v copy -c:a aac -b:a 320k -shortest -movflags +faststart output/gta13/gta6-13-years.mp4
```

If you re-record the narration, re-transcribe it and replace `assets/words.json`; the scene
start times in `main.js` (`SCENES`) and the effect times in `audio.py` follow the script's sentences.

Facts on screen come from the fact-check list in the production package doc. Statements
that are only reported (the ~2014 start date) are labelled as such on screen.
