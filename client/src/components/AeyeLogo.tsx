const BLUE = "#0ea5e9";
const BLUE_LIGHT = "#7dd3fc";

export function AeyeLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 52"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AEYE"
    >
      {/* A — left and right legs */}
      <path
        d="M5 50 L27 4 L49 50"
        stroke={BLUE}
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* A — crossbar */}
      <line x1="15" y1="36" x2="39" y2="36" stroke={BLUE} strokeWidth="5" strokeLinecap="round" />

      {/* Eye — blue fill so the white iris is always visible */}
      <ellipse cx="27" cy="23" rx="9.5" ry="6" fill={BLUE} stroke={BLUE} strokeWidth="1.5" />
      {/* Iris */}
      <circle cx="27" cy="23" r="3.2" fill="black" />

      {/* Scan lines */}
      <path d="M36 19 C 70 16, 130 16, 218 17" stroke={BLUE_LIGHT} strokeWidth="1.2" opacity="0.7" />
      <path d="M36 23 C 70 23, 130 23, 218 23" stroke={BLUE_LIGHT} strokeWidth="1.2" opacity="0.7" />
      <path d="M36 27 C 70 30, 130 30, 218 29" stroke={BLUE_LIGHT} strokeWidth="1.2" opacity="0.7" />

      {/* EYE */}
      <text
        x="59"
        y="49"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
        fontWeight="900"
        fontSize="46"
        fill={BLUE}
        letterSpacing="-2"
      >
        EYE
      </text>
    </svg>
  );
}
