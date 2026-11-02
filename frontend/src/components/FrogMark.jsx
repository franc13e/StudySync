// StudySync's frog mascot — flat inline SVG so it matches the palette everywhere.
export default function FrogMark({ size = 48, className = "" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      className={`flex-shrink-0 ${className}`}
    >
      {/* Eye bumps + body */}
      <circle cx="20" cy="21" r="11" fill="#A2C997" />
      <circle cx="44" cy="21" r="11" fill="#A2C997" />
      <ellipse cx="32" cy="40" rx="26" ry="19" fill="#A2C997" />
      {/* Eyes */}
      <circle cx="20" cy="21" r="7" fill="#FFF8E7" />
      <circle cx="44" cy="21" r="7" fill="#FFF8E7" />
      <circle cx="21" cy="22" r="3.5" fill="#3D271D" />
      <circle cx="43" cy="22" r="3.5" fill="#3D271D" />
      <circle cx="22.3" cy="20.6" r="1.1" fill="#FFF8E7" />
      <circle cx="44.3" cy="20.6" r="1.1" fill="#FFF8E7" />
      {/* Blush */}
      <ellipse cx="14" cy="42" rx="4.5" ry="2.8" fill="#FFD2D7" />
      <ellipse cx="50" cy="42" rx="4.5" ry="2.8" fill="#FFD2D7" />
      {/* Smile */}
      <path d="M24 42 Q32 49 40 42" fill="none" stroke="#3D271D" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
