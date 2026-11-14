# Builds STORYBOARD.md from the shot list below. Timings are ESTIMATES from the
# script (words / 3 per second + emotional pauses); the real ElevenLabs narration
# will re-time every shot in the render phase. Shots split their line's time
# by the given weights.
import re, json
script = open('productions/patch/SCRIPT.md').read()
LINES = {int(n): re.sub(r'\[[^\]]*\]\s*', '', t).strip() for n, t in re.findall(r'^\| L(\d+) \| (.*) \|$', script, re.M)}
WPS = 250 / 60          # target speaking pace: 250 words per minute
# short pauses only at emotional turns (seconds after the line)
PAUSE = {9: .35, 11: .35, 12: .25, 22: .3, 24: .3, 31: .4, 44: .6}

# (line, weight, shot type, location, characters, action / expression, sfx)
S = [
 (1, 1, 'Aerial establishing, slow push', 'Maple Street (day)', '–', 'Pastel houses, bubble trees, sunny Saturday', 'birds, street ambience; music: light, curious'),
 (1, 1, 'Street-level wide', 'Shelter exterior', 'Families (extras)', '"ADOPTION DAY" banner and balloons; families walking in', 'door chime'),
 (2, 1, 'Interior wide, eye level', 'Shelter kennels', 'Shelter dogs (extras)', 'Row of kennels, dogs wagging at the bars', 'happy barks'),
 (2, 1.2, 'Slow dolly down the row', 'Shelter kennels', 'Patch', 'Camera glides to the very last cage in the corner', 'music softens'),
 (3, 1, 'Face close-up (reveal)', 'Patch\'s cage', 'Patch', 'Patch lifts his head and tilts it; floppy ear drops', 'soft accent'),
 (4, 1, 'Insert, side medium', 'Patch\'s cage', 'Patch', 'Floppy ear flicks; patchy brown coat as he turns', '–'),
 (4, 1.1, 'Low wide', 'Patch\'s cage', 'Patch', 'Stands and hops forward on three legs, tail hopeful', 'paw taps'),
 (5, 1, 'Medium tracking', 'Shelter kennels', 'Families (extras)', 'Families stroll in smiling, pointing', 'chatter'),
 (6, 1, 'POV through bars (from inside the cage)', 'Patch\'s cage', 'Family (extras), Patch', 'A family glances in… and walks on', 'footsteps fading'),
 (7, 1, 'Medium close-up, slight low angle', 'Shelter kennels', 'Dad (extra)', '"Too scruffy" – scoffs, shakes head', '–'),
 (7, 1, 'Medium close-up', 'Shelter kennels', 'Grandma (extra)', '"Too slow" – frowns, waves hand', '–'),
 (8, 1, 'Wide, quick montage feel', 'Shelter entrance', 'Families, dogs (extras)', 'Dog after dog leaves through the door with a new family', 'door chime ×3'),
 (9, 1, 'Wide, static, held', 'Shelter kennels', 'Patch', 'Every cage empty except Patch\'s', 'silence beat'),
 (10, 1, 'Face close-up', 'Patch\'s cage', 'Ms. Reyes, Patch', 'Ms. Reyes kneels and whispers warmly; Patch\'s ears lift', '–'),
 (11, 1, 'Wide, static', 'Shelter kennels (closing time)', 'Patch', 'Lights click off row by row; Patch alone', 'light switch clicks; music: one piano note'),
 (12, 1, 'Medium, door backlight', 'Shelter entrance', 'Owen', 'The door opens; Owen steps in, hands in hoodie pocket', 'door creak; music: gentle'),
 (13, 1, 'Wide (cutaway)', 'Maple Park', 'Owen, kids (extras)', 'Kids pick teams; Owen left standing alone', 'distant laughter'),
 (13, 1, 'Face close-up', 'Maple Park', 'Owen', 'Sad, looks down at his shoes', '–'),
 (14, 1, 'Medium, eye level', 'Patch\'s cage', 'Owen, Patch', 'Owen sits cross-legged by the last cage, talking', '–'),
 (14, 1, 'Two-shot through bars', 'Patch\'s cage', 'Owen, Patch', 'Owen tells his story with big hand gestures; Patch listens, head tilted', '–'),
 (15, 1, 'Close-up', 'Patch\'s cage', 'Patch', 'Patch wags so hard his whole body wiggles', 'happy yips'),
 (16, 1, 'Two-shot, warm light', 'Patch\'s cage', 'Owen, Patch', 'Owen\'s finger and Patch\'s nose touch through the bars; both smile', 'music: warm lift'),
 (17, 1, 'Medium, top-down slightly', 'Owen\'s house (living room)', 'Owen', 'Owen shakes an almost-empty piggy bank; two coins fall out', 'coin clink'),
 (18, 1, 'Street-level low angle', 'Shelter exterior', 'Mr & Mrs Vandermeer', 'A shiny white car rolls up; white shoes step out', 'car door; music: snooty pizzicato'),
 (19, 1, 'Low-angle power shot', 'Shelter entrance', 'Mr & Mrs Vandermeer', 'Both in white, sunglasses on, chins up', 'sparkle ding'),
 (20, 1, 'Insert', 'Shelter kennels', 'Mrs Vandermeer', 'A gold clipboard: "THE PERFECT PUPPY" checklist', 'pen click'),
 (20, 1, 'Medium', 'Shelter kennels', 'Mr Vandermeer', 'Mr V checks his gold watch, bored', '–'),
 (21, 1, 'Over-shoulder (Mrs V → Patch)', 'Patch\'s cage', 'Mrs Vandermeer, Patch', 'She lowers her sunglasses; Patch hops toward her, wagging', '–'),
 (21, 1.2, 'Face close-up, low angle', 'Patch\'s cage', 'Mrs Vandermeer', 'Laughs, nose wrinkled: "Ew. That one\'s broken."', 'comic sting'),
 (22, 1, 'Insert close-up', 'Patch\'s cage', 'Patch', 'His tail slows… and stops', 'music drops out'),
 (23, 1, 'Close-up insert', 'Shelter kennels', 'Duchess', 'Fluffy white puppy with a pink bow, sparkles', 'twinkle'),
 (23, 1.1, 'Wide from the doorway', 'Shelter exterior', 'Vandermeers, Duchess, Owen, Ms. Reyes', 'They drive off; Owen and Ms. Reyes watch from the door', 'car drives away'),
 (24, 1, 'Face close-up', 'Patch\'s cage (night)', 'Patch', 'Lying beside a full food bowl, sad eyes, one tear', 'soft piano'),
 (25, 1, 'Night establishing, wide', 'Maple Street (storm)', '–', 'Lightning over the houses, heavy rain', 'thunder; music: storm drums'),
 (26, 1, 'Wide, static', 'Maple Street (storm)', '–', 'Thunder flash, then streetlights and windows go dark one after another', 'thunder crack, power-down hum'),
 (27, 1, 'Low-angle wide', 'Vandermeer mansion (night)', '–', 'White-and-gold mansion lit by lightning', 'thunder'),
 (27, 1, 'Close-up insert', 'Vandermeer gate (night)', '–', 'The golden gate bursts open in the wind', 'metal clang'),
 (28, 1, 'Low tracking', 'Vandermeer gate (night)', 'Duchess', 'Duchess scampers through the open gate into the rain', 'tiny paw splashes'),
 (29, 1, 'High aerial', 'Flooded street (storm)', 'Duchess', 'Water rushing down the street; a tiny white dot swept along', 'rushing water'),
 (29, 1, 'Water-level medium', 'Storm drain', 'Duchess', 'Duchess tumbles toward the storm drain', 'water surge'),
 (30, 1, 'Low close-up', 'Storm drain', 'Duchess', 'Clinging to the grate, crying', 'whimpers under rain'),
 (30, 1, 'Wide, static', 'Maple Street (storm)', '–', 'Dark houses, nobody outside', 'rain loud'),
 (31, 1, 'Face close-up', 'Shelter kennels (night)', 'Patch', 'Ears snap up; determined eyes', 'music hits: urgent strings'),
 (32, 1, 'Medium, flashlight light', 'Shelter kennels (night)', 'Ms. Reyes', 'Ms. Reyes checks the kennels with a flashlight', 'flashlight click'),
 (32, 1, 'Low medium', 'Shelter kennels (night)', 'Patch, Ms. Reyes', 'Patch bolts past her legs', 'whoosh'),
 (32, 1, 'Wide from outside', 'Shelter exterior (storm)', 'Patch', 'He bursts out the door into the rain', 'door bang, rain'),
 (33, 1, 'Low tracking alongside', 'Flooded street (storm)', 'Patch', 'Three legs, full speed, through the rain', 'splashes, panting'),
 (34, 1, 'Low medium, slow-motion feel', 'Flooded street (storm)', 'Patch', 'He splashes through the freezing water', 'big splash'),
 (34, 1, 'Close-up', 'Storm drain', 'Patch, Duchess', 'He grabs Duchess by the collar and pulls', 'strain, water surge'),
 (35, 1, 'Medium wide', 'Sidewalk (storm)', 'Patch, Duchess', 'He drags her onto the sidewalk; both collapse, safe', 'thud, relieved whimper'),
 (36, 1, 'Low-angle hero shot', 'Sidewalk (storm)', 'Patch, Duchess', 'Patch barks and barks; lightning behind him', 'barks ×3'),
 (36, 1, 'Wide', 'Maple Street (storm)', 'Neighbours, Vandermeers, Owen, Ms. Reyes', 'Porch lights flick on; neighbours run out with umbrellas', 'doors opening, voices'),
 (37, 1, 'Wide, sunny morning', 'Maple Street (morning)', 'Crowd, Patch', 'Puddles shining, a rainbow, the crowd around Patch', 'birds; music: warm theme'),
 (38, 1, 'Medium', 'Maple Street (morning)', 'Mrs Vandermeer, Duchess, Patch', 'She kneels, no sunglasses, tears in her eyes', '–'),
 (39, 1, 'Face close-up', 'Maple Street (morning)', 'Mrs Vandermeer', '"I called you broken… you were the bravest one of all."', '–'),
 (39, 1, 'Close-up', 'Maple Street (morning)', 'Duchess, Patch', 'Duchess licks Patch\'s nose; his tail starts wagging again', 'happy yip'),
 (40, 1, 'Medium', 'Shelter exterior (morning)', 'Mr Vandermeer, Ms. Reyes', 'Mr V hands Ms. Reyes a giant gold check', 'cash-register ding'),
 (40, 1, 'Wide', 'Shelter exterior (morning)', 'Families, dogs (extras)', 'Banner "ALL ADOPTIONS FREE TODAY"; dogs leave with happy families', 'cheering'),
 (41, 1, 'Face close-up', 'Shelter exterior (morning)', 'Ms. Reyes', 'Big smile: "Patch, somebody\'s here for you."', '–'),
 (42, 1, 'Medium, slow push to the collar', 'Shelter exterior (morning)', 'Owen, Patch', 'The crowd parts; Owen steps forward holding a new red collar with a gold "PATCH" tag', 'crowd "aww", tag jingle'),
 (43, 1, 'Medium close-up', 'Shelter exterior (morning)', 'Owen, Patch', 'Patch hops into Owen\'s arms; tail wagging like crazy', 'happy bark; music swells'),
 (43, 1, 'Wide, tracking behind', 'Maple Street (morning)', 'Owen, Patch', 'They walk home together, Patch hopping happily', '–'),
 (44, 1, 'LONG HOLD – slow pull-out', 'Owen\'s porch (sunset)', 'Owen, Patch', 'Porch swing at sunset, Owen and Patch asleep side by side', 'music resolves'),
]

t = 0.3
rows = []
for ln in sorted(LINES):
    words = len(LINES[ln].split())
    dur = words / WPS + PAUSE.get(ln, 0.04)
    shots = [s for s in S if s[0] == ln]
    tw = sum(s[1] for s in shots)
    for s in shots:
        d = dur * s[1] / tw
        rows.append((t, d) + s)
        t += d
total = t + 0.5
long_ = [r for r in rows if r[1] > 2.4]
print(f"{len(rows)} shots, est total {total:.1f}s, median {sorted(r[1] for r in rows)[len(rows)//2]:.2f}s, within 1.2–2.2s: {sum(1.15<=r[1]<=2.25 for r in rows)}, long holds: {[(i+1, round(r[1],1)) for i,r in enumerate(rows) if r[1]>2.4]}")
out = ["# \"Patch, the Dog Nobody Picked\" – Storyboard v2 (250 wpm)", "",
       f"**{len(rows)} shots · estimated {total:.0f} s.** Timings are estimates at 250 wpm; the final narration's real word timings will re-time every shot and caption. Captions: one white lowercase word at a time, centred at 58% height.", "",
       "| # | Time | Dur | Narration (line) | Shot | Location | Characters | Action / expression | SFX / music |", "|---|---|---|---|---|---|---|---|---|"]
for i, (st, d, ln, w, shot, loc, ch, act, sfx) in enumerate(rows, 1):
    out.append(f"| {i} | {int(st//60)}:{st%60:05.2f} | {d:.1f}s | L{ln}: {LINES[ln][:60]}{'…' if len(LINES[ln])>60 else ''} | {shot} | {loc} | {ch} | {act} | {sfx} |")
open('productions/patch/STORYBOARD.md', 'w').write('\n'.join(out) + '\n')
