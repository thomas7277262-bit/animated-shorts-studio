# Patch – narration audio

| File | What it is |
|---|---|
| `narration_adam-cross_250wpm_v2-smooth.mp3` | **v2 (current): smoother flow.** 96.0 s, 250 wpm overall, ~283 wpm while speaking. Pauses inside sentences cut to 0.07 s, 0.12 s between sentences, 0.28 s at the 7 emotional beats, then a gentle 0.91× pitch-preserving slow-down. Made with `smooth.py`. |
| `narration_adam-cross_250wpm.mp3` | v1: first version. Too many equal 0.22 s pauses, giving a stop-start feel. 96.0 s, 400 words, 250 wpm, -17.3 LUFS, 48 kHz, 192 kbps |
| `narration_adam-cross_raw_elevenlabs.mp3` | Unprocessed ElevenLabs output (106.9 s, 224 wpm) |
| `narration_text.txt` | Exact text sent to ElevenLabs (approved script, mood tags removed, two "!" as in Test B) |
| `trim_pauses.py` / `trim_info.json` | The processing step and its measurements |

**Generation:** ElevenLabs `eleven_multilingual_v2`, voice Adam Cross (`HdI8DDQNjJGf1UOh1gG0`),
speed 1.2, stability 0.35, similarity 0.80, style 0.40, speaker boost on. One take. 2,296 credits.

**Processing:** pause trimming only (Test B method). Pauses of 0.18 s or more are shortened to 0.221 s, and the 7 longest (emotional) pauses to 0.32 s, with 8 ms crossfades.
**No time-stretch was applied:** the take already reached 250 wpm after pause trimming (the required factor was 0.99×). Speech time is unchanged (73.53 s → 73.45 s).
