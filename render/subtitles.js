// Writes Advanced SubStation (.ass) subtitles with word-by-word highlighting,
// big bold "Shorts style" captions placed above the YouTube UI area.

function assTime(t) {
  t = Math.max(0, t);
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = Math.floor(t % 60), cs = Math.floor((t % 1) * 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

function assColor(hex) {
  const h = hex.replace('#', '');
  return `&H00${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}&`.toUpperCase();
}

const esc = (s) => s.replace(/[{}]/g, '').replace(/\\/g, '');

/** Group words into short chunks (max 3 words, break after punctuation). */
export function chunkWords(words, max = 3) {
  const chunks = [];
  let cur = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= max || /[.!?,;:]$/.test(w.w)) { chunks.push(cur); cur = []; }
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

export function buildAss(timeline, opts) {
  return (opts.style || timeline.captionStyle || 'yellow') === 'classic' ? buildAssClassic(timeline, opts) : buildAssYellow(timeline, opts);
}

/**
 * Story-channel style (matches the reference videos' caption rules, not their
 * content): ONE word on screen at a time, exactly while it is spoken; heavy
 * rounded font, bright yellow, black outline + soft shadow, lower-middle.
 */
export function buildAssYellow(timeline, { width, height, font = 'Fredoka' }) {
  const size = Math.round(height * 0.09);
  const outline = Math.max(3, Math.round(height * 0.0075));
  const shadow = Math.max(2, Math.round(height * 0.006));
  const marginV = Math.round(height * 0.255);
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,${font},${size},&H002EFFF2&,&H002EFFF2&,&H00000000&,&H80000000&,-1,0,0,0,100,100,0,0,1,${outline},${shadow},2,${Math.round(width * 0.05)},${Math.round(width * 0.05)},${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const events = [];
  for (const line of timeline.lines) {
    line.words.forEach((w, i) => {
      const next = line.words[i + 1];
      const end = next ? next.start : Math.min(line.end + 0.25, w.end + 0.45);
      const word = esc(w.w.toLowerCase().replace(/[^\p{L}\p{N}'’-]/gu, '')) || esc(w.w);
      events.push(`Dialogue: 0,${assTime(w.start)},${assTime(Math.max(end, w.start + 0.08))},Caption,,0,0,0,,{\\fscx88\\fscy88\\t(0,80,\\fscx100\\fscy100)}${word}`);
    });
  }
  return header + events.join('\n') + '\n';
}

export function buildAssClassic(timeline, { width, height, font = 'Inter ExtraBold' }) {
  const size = Math.round(height * 0.052);
  const outline = Math.max(2, Math.round(height * 0.0055));
  const marginV = Math.round(height * 0.19);
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,${font},${size},&H00FFFFFF&,&H00FFFFFF&,&H00141414&,&H96000000&,-1,0,0,0,100,100,1,0,1,${outline},${Math.round(outline * 0.6)},2,${Math.round(width * 0.08)},${Math.round(width * 0.08)},${marginV},1
Style: Speaker,${font},${Math.round(size * 0.55)},&H00FFFFFF&,&H00FFFFFF&,&H00141414&,&H96000000&,-1,0,0,0,100,100,1,0,1,${Math.round(outline * 0.8)},0,2,10,10,${marginV + Math.round(size * 1.25)},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const events = [];
  for (const line of timeline.lines) {
    const spec = timeline.characters[line.speaker];
    const hi = spec ? assColor(spec.accent) : assColor('#FFD60A');
    if (spec) events.push(`Dialogue: 1,${assTime(line.start)},${assTime(line.end + 0.15)},Speaker,,0,0,0,,{\\c${hi}}${esc(spec.name.toUpperCase())}`);
    const chunks = chunkWords(line.words);
    chunks.forEach((chunk, ci) => {
      const chunkEnd = ci < chunks.length - 1 ? chunks[ci + 1][0].start : line.end + 0.15;
      chunk.forEach((w, wi) => {
        const st = w.start;
        const en = wi < chunk.length - 1 ? chunk[wi + 1].start : chunkEnd;
        const text = chunk.map((x, xi) => {
          const word = esc(x.w.toUpperCase());
          return xi === wi ? `{\\c${hi}\\fscx112\\fscy112}${word}{\\c&H00FFFFFF&\\fscx100\\fscy100}` : word;
        }).join(' ');
        const pop = wi === 0 ? '{\\fad(60,0)}' : '';
        events.push(`Dialogue: 0,${assTime(st)},${assTime(en)},Caption,,0,0,0,,${pop}${text}`);
      });
    });
  }
  return header + events.join('\n') + '\n';
}
