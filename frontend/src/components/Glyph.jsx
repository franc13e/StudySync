// Soft tinted icon chip — the friendly stand-in for decorative emoji.
// Each tone pairs a pale chip background with a deepened icon colour that reads on it.
const TONES = {
  sunset: { chip: "bg-sunset/35", text: "text-[#A65A1F]" },
  sage: { chip: "bg-sage/30", text: "text-[#4A7340]" },
  lavender: { chip: "bg-lavender/50", text: "text-[#46518F]" },
  petal: { chip: "bg-petal/60", text: "text-[#A8455A]" },
  butter: { chip: "bg-border", text: "text-espresso" },
};

const SIZES = {
  sm: { box: "w-8 h-8", icon: 16 },
  md: { box: "w-10 h-10", icon: 20 },
  lg: { box: "w-12 h-12", icon: 24 },
  xl: { box: "w-16 h-16", icon: 30 },
};

export default function Glyph({ icon: Icon, tone = "sage", size = "md", shape = "circle", className = "" }) {
  const t = TONES[tone] || TONES.sage;
  const s = SIZES[size] || SIZES.md;
  const radius = shape === "squircle" ? "rounded-2xl" : "rounded-full";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center flex-shrink-0 ${s.box} ${radius} ${t.chip} ${t.text} ${className}`}
    >
      <Icon size={s.icon} strokeWidth={2.25} />
    </span>
  );
}

// Small chip-less icon that sits at the end of a line of copy, sized to the text.
export function InlineGlyph({ icon: Icon, tone, className = "" }) {
  const color = tone ? (TONES[tone] || TONES.sage).text : "";
  return (
    <Icon
      aria-hidden="true"
      size="1em"
      strokeWidth={2.25}
      className={`inline-block align-middle -mt-0.5 ${color} ${className}`}
    />
  );
}
