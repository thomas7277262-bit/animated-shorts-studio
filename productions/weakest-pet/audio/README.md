# The Weakest Pet in the World – narration

| File | Length | Pace |
|---|---|---|
| `narration_james_220wpm.mp3` | 97.9 s | 220 wpm (slowed 0.89×, pitch preserved) |
| `narration_james_240wpm.mp3` | 89.8 s | 240 wpm (0.97×, almost untouched) |
| `narration_james_raw_elevenlabs.mp3` | 108.4 s | unprocessed ElevenLabs output |

**Voice:** ElevenLabs "James – Conversational, Energetic, Punchy" (`QhpsGjDKZmM9qRYdMhBD`), chosen because its pitch (about 247 Hz) and expressiveness match the reference style.
**Model and settings:** `eleven_multilingual_v2`, speed 1.2, stability 0.35, similarity 0.75, style 0.30, speaker boost on. One take, 2,082 credits.
**Processing:** `smooth.py`. Graded pause trimming (0.07 s inside sentences, 0.12 s between sentences, 0.28 s at the 7 biggest beats), then a pitch-preserving tempo change to the target pace, then loudness matching.
**Text:** `narration_text.txt`, the 359-word script v2, word for word.
