import React, { useEffect, useRef } from 'react';
import { CHARACTER_LIBRARY } from '../story/characters.js';
import { drawFace, createFaceCanvas } from '../engine/face.js';

const ACC = { crown: '👑', helmet: '⛑️', bow: '🎀', wizardHat: '🧙', glasses: '👓', cap: '🧢', horns: '🐉', none: '' };

function FaceThumb({ spec, expr }) {
  const ref = useRef();
  useEffect(() => {
    const src = createFaceCanvas();
    drawFace(src, spec, { expr, blink: 0, mouth: 0 });
    const c = ref.current, g = c.getContext('2d');
    const S = src.width / (Math.PI * 2), cx = src.width * 0.25, cy = src.height * 0.5, r = 0.62 * S;
    g.clearRect(0, 0, c.width, c.height);
    g.save();
    g.beginPath(); g.arc(c.width / 2, c.height / 2, c.width / 2 - 4, 0, Math.PI * 2); g.clip();
    g.drawImage(src, cx - r, cy - r, r * 2, r * 2, 0, 0, c.width, c.height);
    g.restore();
    g.lineWidth = 6; g.strokeStyle = spec.accent;
    g.beginPath(); g.arc(c.width / 2, c.height / 2, c.width / 2 - 4, 0, Math.PI * 2); g.stroke();
  }, [spec, expr]);
  return <canvas ref={ref} width={160} height={160} className="face" />;
}

export default function CharacterPicker({ selected, onChange, max = 3 }) {
  const toggle = (id) => {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else if (selected.length < max) onChange([...selected, id]);
  };
  return (
    <div className="chars">
      {Object.values(CHARACTER_LIBRARY).map((c) => {
        const on = selected.includes(c.id);
        return (
          <button key={c.id} className={'char' + (on ? ' on' : '')} onClick={() => toggle(c.id)} aria-pressed={on}>
            <FaceThumb spec={c} expr={on ? 'happy' : 'neutral'} />
            <span className="cname">{ACC[c.accessory]} {c.name}</span>
            <span className="crole">{c.personality}</span>
            {on && <span className="badge">{selected.indexOf(c.id) === 0 ? 'Hero' : `#${selected.indexOf(c.id) + 1}`}</span>}
          </button>
        );
      })}
    </div>
  );
}
