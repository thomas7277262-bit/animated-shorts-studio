# Builds STORYBOARD.md from the shot list below. Timings are ESTIMATES from the
# script (words / 3 per second + emotional pauses); the real ElevenLabs narration
# will re-time every shot in the render phase. Shots split their line's time
# by the given weights.
import re, json
script = open('productions/patch/SCRIPT.md').read()
LINES = {int(n): re.sub(r'\[[^\]]*\]\s*', '', t).strip() for n, t in re.findall(r'^\| L(\d+) \| (.*) \|$', script, re.M)}
WPS = 3.2
PAUSE = {4: .4, 9: .4, 12: .3, 18: .6, 20: .3, 22: .3, 27: .6, 32: .3, 33: .8}

# (line, weight, shot type, location, characters, action / expression, sfx)
S = [
 (1, 1, 'Aerial establishing, slow push', 'Maple Street (day)', '–', 'Pastel houses, bubble trees, sunny morning; cars and kids moving below', 'birds, light street ambience'),
 (1, 1, 'Street-level wide', 'Shelter exterior', 'Families, extras', '"ADOPTION DAY" banner; families walk in; loose fence board visible at right', 'door chime'),
 (2, 1, 'Interior wide, eye level', 'Shelter kennels', 'Dogs (extras)', 'Row of kennels, dogs wagging and jumping at the bars', 'happy barks'),
 (2, 1.3, 'Slow dolly down the row', 'Shelter kennels', 'Patch', 'Camera glides to the last cage in the corner, a small shape inside', 'music drops to soft piano'),
 (3, 1, 'Face close-up (reveal)', 'Patch cage', 'Patch', 'Patch lifts his head, tilts it, one ear flops', 'soft "boop" accent'),
 (4, 1, 'Insert, side medium', 'Patch cage', 'Patch', 'Floppy ear flicks; patchwork coat shown as he turns', '–'),
 (4, 1.2, 'Low wide', 'Patch cage', 'Patch', 'Patch stands and hops forward on three legs, tail wagging hopefully', 'paw taps'),
 (5, 1, 'Medium tracking', 'Shelter kennels', 'Family A, Family B', 'Families stroll in smiling, pointing at dogs', 'chatter'),
 (6, 1, 'POV through bars (from inside the cage)', 'Patch cage', 'Family A, Patch', 'Family stops, glances in… and walks on; Patch\'s tail slows and stops', 'footsteps fading'),
 (7, 1, 'Medium close-up, slight low angle', 'Shelter kennels', 'Dad extra', '"Too scruffy" – scoffs, shakes head', '–'),
 (7, 1, 'Medium close-up', 'Shelter kennels', 'Grandma extra', '"Too slow" – frowns, waves hand', '–'),
 (8, 1, 'Medium, eye level', 'Patch cage', 'Ms. Reyes, Patch', 'Ms. Reyes kneels and slides a treat through the bars', 'treat bag rustle'),
 (8, 1, 'Face close-up', 'Patch cage', 'Ms. Reyes', 'Warm whisper "Your family is coming, buddy"; Patch\'s ears lift', '–'),
 (9, 1, 'Wide, static', 'Shelter kennels (closing time)', 'Patch', 'Lights click off row by row; every cage empty except Patch\'s', 'light switch clicks'),
 (10, 1, 'Medium, door backlight', 'Shelter entrance', 'Owen', 'Door opens; Owen steps in, hands in hoodie pocket', 'door creak'),
 (11, 1, 'Wide, park (cutaway)', 'Maple Park', 'Owen, kids (extras)', 'Kids picking teams; Owen left standing alone', 'kids laughing, distant'),
 (11, 1, 'Face close-up', 'Maple Park', 'Owen', 'Sad, looks at his shoes', '–'),
 (12, 1, 'Medium, eye level', 'Patch cage', 'Owen, Patch', 'Owen sits cross-legged by the cage; Patch presses his nose to the bars', '–'),
 (12, 1, 'Two-shot through bars', 'Patch cage', 'Owen, Patch', 'Both smile; Owen\'s finger and Patch\'s nose touch', 'music: gentle lift'),
 (13, 1, 'Street-level low angle', 'Shelter exterior', 'Vandermeers', 'Shiny white car rolls up; white shoes step out', 'car door, music: snooty pizzicato'),
 (14, 1, 'Low-angle power shot', 'Shelter entrance', 'Mr & Mrs Vandermeer, Sloane', 'All three in white, sunglasses on, chins up', 'sparkle "ding"'),
 (15, 1, 'Medium', 'Shelter kennels', 'Sloane, Mrs Vandermeer', 'Sloane points demandingly along the cages', '–'),
 (16, 1, 'Over-shoulder (Mrs V → Patch)', 'Patch cage', 'Mrs Vandermeer, Patch', 'She lowers her sunglasses; Patch wags and hops toward her', '–'),
 (16, 1.3, 'Face close-up, low angle', 'Patch cage', 'Mrs Vandermeer', 'Laughs, nose wrinkled: "Ew. That one\'s broken."', 'record-scratch-light sting'),
 (17, 1, 'Close-up insert', 'Shelter kennels', 'Duchess', 'Tiny fluffy white puppy with a pink bow – sparkles', 'twinkle'),
 (17, 1.2, 'Wide from doorway', 'Shelter exterior', 'Vandermeers, Duchess, Owen, Ms. Reyes', 'The family carries Duchess to the car and drives off; Owen and Ms. Reyes watch', 'car drives away'),
 (18, 1, 'Medium, top-down slightly', 'Patch cage', 'Patch', 'Patch lies down; his tail stops', 'music fades to one piano note'),
 (18, 1.2, 'Face close-up', 'Patch cage', 'Patch', 'Sad droopy eyes, a single tear', '–'),
 (19, 1, 'Night establishing, wide', 'Maple Street (storm)', '–', 'Dark navy sky, lightning flash over the houses, heavy rain', 'thunder, rain bed; music: storm drums'),
 (19, 1, 'Medium through window', 'Shelter kennels (night)', 'Patch', 'Rain streaks the window; Patch lifts his head at the thunder', 'rain on glass'),
 (20, 1, 'Wide, static', 'Maple Street (storm)', '–', 'Streetlights and windows go dark one after another', 'power-down hum'),
 (21, 1, 'Low-angle wide', 'Vandermeer mansion (night)', '–', 'White-and-gold mansion lit by lightning', 'thunder'),
 (21, 1.2, 'Close-up insert', 'Vandermeer gate (night)', '–', 'Golden gate latch snaps; the gate swings open in the wind', 'metal creak + bang'),
 (22, 1, 'Face close-up, lit by flashlight', 'Mansion doorway (night)', 'Mrs Vandermeer', 'Shocked: Duchess\'s bed is empty', 'gasp'),
 (23, 1, 'High aerial', 'Flooded street (storm)', 'Duchess', 'Water rushing down the gutter toward a storm drain; tiny white dot in it', 'rushing water'),
 (23, 1.3, 'Low close-up at water level', 'Storm drain', 'Duchess', 'Duchess clinging to the drain grate, terrified, water splashing', 'whimpers under rain'),
 (24, 1, 'Wide, static', 'Maple Street (storm)', '–', 'Dark houses, nobody outside, only rain', 'rain loud'),
 (24, 1, 'Face close-up', 'Shelter kennels (night)', 'Patch', 'Ears snap up; determined eyes', 'music hits: urgent strings'),
 (25, 1, 'Medium low angle', 'Shelter fence (night)', 'Patch', 'Patch shoves through the loose fence board', 'wood clatter'),
 (25, 1.4, 'Low tracking shot alongside', 'Flooded street (storm)', 'Patch', 'Patch runs through the rain on three legs, full speed, splashing puddles', 'splashes, panting'),
 (26, 1, 'Close-up', 'Storm drain', 'Patch, Duchess', 'Patch grabs Duchess by the collar', 'water surge'),
 (26, 1.2, 'Medium wide', 'Flooded street (storm)', 'Patch, Duchess', 'He pulls her up onto the sidewalk; both collapse, safe', 'thud, relieved whimper'),
 (27, 1, 'Low-angle hero shot', 'Sidewalk (storm)', 'Patch, Duchess', 'Patch barks again and again; lightning behind him', 'barks ×3'),
 (27, 1.3, 'Wide', 'Maple Street (storm)', 'Neighbours, Vandermeers, Owen, Ms. Reyes', 'Porch lights snap on one by one; neighbours run out with umbrellas and flashlights', 'doors opening, voices'),
 (28, 1, 'Wide, sunny morning', 'Maple Street (morning)', 'Crowd, Patch', 'Puddles shining, rainbow, crowd gathered around Patch', 'birds return; music: warm theme'),
 (29, 1, 'Medium', 'Maple Street (morning)', 'Mrs Vandermeer, Duchess, Patch', 'Mrs V kneels holding Duchess; Duchess licks Patch\'s nose', '–'),
 (29, 1.2, 'Face close-up', 'Maple Street (morning)', 'Mrs Vandermeer', 'Tears in her eyes: "I was wrong about you."', '–'),
 (30, 1, 'Face close-up', 'Maple Street (morning)', 'Ms. Reyes', 'Big smile: "Patch, somebody\'s here for you."', '–'),
 (31, 1, 'Medium, crowd parts', 'Maple Street (morning)', 'Owen, Patch', 'Owen steps forward holding a brand new red collar', 'crowd "aww"'),
 (31, 1, 'Close-up insert', 'Maple Street (morning)', 'Owen, Patch', 'The new collar with a gold tag that says "PATCH"', 'tag jingle'),
 (32, 1, 'Medium close-up', 'Maple Street (morning)', 'Owen, Patch', 'Owen hugs Patch; Patch\'s tail wags like crazy', 'happy bark'),
 (32, 1, 'Wide, tracking behind', 'Maple Street (morning)', 'Owen, Patch', 'They walk home together down the pastel street, Patch hopping happily', 'music swells'),
 (33, 2.2, 'LONG HOLD – slow pull-out', 'Owen\'s porch (sunset)', 'Owen, Patch', 'Porch swing at sunset; Owen and Patch asleep side by side', 'music resolves, final soft chord'),
]

t = 0.3
rows = []
for ln in sorted(LINES):
    words = len(LINES[ln].split())
    dur = words / WPS + PAUSE.get(ln, 0.15)
    shots = [s for s in S if s[0] == ln]
    tw = sum(s[1] for s in shots)
    for s in shots:
        d = dur * s[1] / tw
        rows.append((t, d) + s)
        t += d
total = t + 0.4
long_ = [r for r in rows if r[1] > 2.4]
print(f"{len(rows)} shots, est total {total:.1f}s, median {sorted(r[1] for r in rows)[len(rows)//2]:.2f}s, within 1.2–2.2s: {sum(1.15<=r[1]<=2.25 for r in rows)}, long holds: {[(i+1, round(r[1],1)) for i,r in enumerate(rows) if r[1]>2.4]}")
out = ["# \"Patch, the Dog Nobody Picked\" – Storyboard v1", "",
       f"**{len(rows)} shots · estimated {total:.0f} s.** Timings are estimates from the script; the final ElevenLabs narration will re-time every shot. Captions: one white lowercase word at a time, centred at 58% height.", "",
       "| # | Time | Dur | Narration (line) | Shot | Location | Characters | Action / expression | SFX / music |", "|---|---|---|---|---|---|---|---|---|"]
for i, (st, d, ln, w, shot, loc, ch, act, sfx) in enumerate(rows, 1):
    out.append(f"| {i} | {int(st//60)}:{st%60:05.2f} | {d:.1f}s | L{ln}: {LINES[ln][:60]}{'…' if len(LINES[ln])>60 else ''} | {shot} | {loc} | {ch} | {act} | {sfx} |")
open('productions/patch/STORYBOARD.md', 'w').write('\n'.join(out) + '\n')
