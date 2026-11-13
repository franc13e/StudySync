// ─── Class colours: presets, hex checks and readable text on a colour ──

/** Preset colours a class can be tagged with (stored as hex on the class). */
export const PRESET_COLORS = [
  { name: "Sunset", hex: "#FFC285" },
  { name: "Sage", hex: "#A2C997" },
  { name: "Petal", hex: "#FFD2D7" },
  { name: "Lavender", hex: "#C2C9EC" },
  { name: "Cocoa", hex: "#C9B3A6" },
  { name: "Butter", hex: "#F7DC6F" },
  { name: "Mint", hex: "#9FDDC8" },
  { name: "Sky", hex: "#9CCBEF" },
  { name: "Coral", hex: "#F59C8B" },
  { name: "Rose", hex: "#E58FB1" },
  { name: "Lilac", hex: "#B8A1E3" },
  { name: "Slate", hex: "#9AA5B1" },
];

/** "#abc", "abc", " #AABBCC " → "#AABBCC"; null when it isn't a hex colour. */
export function normalizeHex(input) {
  let s = String(input || "").trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(s)) s = s.split("").map((c) => c + c).join("");
  return /^[0-9a-f]{6}$/i.test(s) ? `#${s.toUpperCase()}` : null;
}

export const isPreset = (hex) => PRESET_COLORS.some((c) => c.hex.toUpperCase() === String(hex).toUpperCase());
