/** Hand-drawn, instant SVG clue illustration. Rendered locally without model inference. */
export default function ClueSketch({ variant }: { variant: string }) {
  const note = variant === "note";
  const goblin = variant === "spoon";
  const gear = variant === "broken-gear";
  return (
    <svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg" role="img"
      aria-label="Hand-drawn fantasy discovery illustration">
      <rect width="180" height="120" rx="8" fill="#342c3d"/>
      <rect x="10" y="10" width="160" height="100" rx="4" fill="#57475a"/>
      <path d="M15 94 Q80 110 165 94" fill="none" stroke="#a68a70" strokeWidth="2"/>
      {goblin ? <g>
        <path d="M90 24 L50 38 L61 78 L90 95 L119 78 L130 38 Z" fill="#86a372"/>
        <path d="M64 48 L48 33 L54 66 L65 63 M116 48 L132 33 L126 66 L115 63" fill="#749668"/>
        <path d="M58 43 L64 22 L114 22 L122 43" fill="#99856b" stroke="#c6aa82" strokeWidth="3"/>
        <rect x="72" y="56" width="10" height="8" fill="#2c2b38"/>
        <rect x="99" y="56" width="10" height="8" fill="#2c2b38"/>
        <path d="M79 78 Q91 83 103 78" fill="none" stroke="#34402f" strokeWidth="3"/>
      </g> : note ? <g>
        <path d="M45 18 L130 23 L135 96 L51 92 Z" fill="#dbbd8f" stroke="#98734b" strokeWidth="3"/>
        <path d="M64 44 H118 M65 56 H108 M65 69 H115" stroke="#8e6558" strokeWidth="4"/>
        <circle cx="125" cy="88" r="11" fill="#a54e50" opacity=".85"/>
      </g> : <g>
        <circle cx="90" cy="61" r="37" fill={gear?"#a17861":"#b99b74"} stroke="#dfbd82" strokeWidth="7"
          strokeDasharray={gear?"10 5 20 6":"none"}/>
        <circle cx="90" cy="61" r="22" fill="#554158"/>
        <circle cx="90" cy="61" r="9" fill="#d8b77a"/>
        <path d="M90 27 V95 M56 61 H124" stroke="#d8b77a" strokeWidth="6"/>
        {gear && <path d="M109 36 L90 61 L117 79" fill="none" stroke="#342c3d" strokeWidth="6"/>}
        {!gear && <g stroke="#e7d19d" strokeWidth="2">
          <path d="M32 44 l6 -6 M143 34 l6 6 M146 83 l7 -6"/>
        </g>}
      </g>}
      <path d="M18 18 l7 2 2 7 -7 -2 Z M159 99 l-7 -2 -2 -7 7 2 Z" fill="#e6c17e" opacity=".7"/>
    </svg>
  );
}
