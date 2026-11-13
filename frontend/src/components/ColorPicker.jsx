import { useEffect, useRef, useState } from "react";
import { Check, Pipette } from "lucide-react";
import { PRESET_COLORS, isPreset, normalizeHex } from "../lib/colors";
import { hexToHsv, hsvToHex } from "../lib/hsv";

const RAINBOW = "conic-gradient(#F87171, #FBBF24, #A3E635, #34D399, #38BDF8, #818CF8, #E879F9, #F87171)";
const HUE_TRACK = "linear-gradient(to right, #F00, #FF0, #0F0, #0FF, #00F, #F0F, #F00)";

/** Preset swatches, plus "Custom": a saturation/brightness square, a hue slider and a hex code field. */
export default function ColorPicker({ value, onChange }) {
  const [open, setOpen] = useState(() => !isPreset(value));
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const [hexText, setHexText] = useState(value);
  const square = useRef(null);

  // Keep the custom controls in step when the colour changes from outside (a preset, editing another class).
  useEffect(() => {
    setHexText(value);
    if (hsvToHex(hsv.h, hsv.s, hsv.v) !== value.toUpperCase()) setHsv(hexToHsv(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const setFromHsv = (next) => {
    setHsv(next);
    onChange(hsvToHex(next.h, next.s, next.v));
  };

  const pickAt = (e) => {
    const r = square.current.getBoundingClientRect();
    const s = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const v = 1 - Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    setFromHsv({ ...hsv, s, v });
  };

  const onSquareKey = (e) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (!moves[e.key]) return;
    e.preventDefault();
    const [ds, dv] = moves[e.key];
    setFromHsv({ ...hsv, s: Math.min(1, Math.max(0, hsv.s + ds)), v: Math.min(1, Math.max(0, hsv.v + dv)) });
  };

  const hexValid = normalizeHex(hexText);
  const custom = !isPreset(value);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Class colour">
        {PRESET_COLORS.map((c) => {
          const on = value.toUpperCase() === c.hex;
          return (
            <button key={c.hex} type="button" title={c.name} aria-label={`${c.name} colour`} aria-pressed={on}
              onClick={() => onChange(c.hex)}
              className={`w-8 h-8 rounded-full border-2 transition flex items-center justify-center ${on ? "border-espresso scale-110" : "border-white/70"}`}
              style={{ backgroundColor: c.hex }}>
              {on && <Check size={14} className="text-espresso" aria-hidden="true" />}
            </button>
          );
        })}
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Pick your own colour" title="Your own colour"
          className={`w-8 h-8 rounded-full border-2 transition flex items-center justify-center ${custom ? "border-espresso scale-110" : "border-white/70"}`}
          style={{ background: custom ? value : RAINBOW }}>
          <Pipette size={14} className="text-espresso" aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="bg-canvas border border-border rounded-2xl p-3 space-y-3">
          <div
            ref={square}
            role="slider"
            tabIndex={0}
            aria-label="Colour saturation and brightness"
            aria-valuetext={value}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pickAt(e); }}
            onPointerMove={(e) => { if (e.buttons) pickAt(e); }}
            onKeyDown={onSquareKey}
            className="relative w-full h-36 rounded-xl cursor-crosshair touch-none focus:outline-none focus:ring-2 focus:ring-sage/60"
            style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #FFF, hsl(${hsv.h} 100% 50%))` }}
          >
            <span aria-hidden="true" className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full border-2 border-white shadow pointer-events-none"
              style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, backgroundColor: value }} />
          </div>

          <input type="range" min={0} max={359} value={Math.round(hsv.h)} aria-label="Hue"
            onChange={(e) => setFromHsv({ ...hsv, h: +e.target.value, s: hsv.s || 0.6, v: hsv.v || 0.9 })}
            className="hue-slider w-full h-3 rounded-full appearance-none cursor-pointer"
            style={{ background: HUE_TRACK }} />

          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="w-9 h-9 rounded-xl border border-border shrink-0" style={{ backgroundColor: hexValid || value }} />
            <label className="sr-only" htmlFor="class-hex">Hex code</label>
            <input id="class-hex" value={hexText} maxLength={7} spellCheck={false} autoCapitalize="characters"
              onChange={(e) => {
                setHexText(e.target.value);
                const hex = normalizeHex(e.target.value);
                if (hex && e.target.value.replace("#", "").length === 6) onChange(hex);
              }}
              onBlur={() => { const hex = normalizeHex(hexText); if (hex) onChange(hex); else setHexText(value); }}
              placeholder="#A2C997"
              className={`flex-1 bg-white border rounded-2xl px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sage/50 ${hexValid ? "border-border" : "border-red-300"}`} />
          </div>
          {!hexValid && <p className="text-xs text-red-500">Use a hex code like #A2C997.</p>}
        </div>
      )}
    </div>
  );
}
