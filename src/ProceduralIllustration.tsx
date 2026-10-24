import { useId } from "react";
import PixelScene from "./PixelScene";
import ClueSketch from "./ClueSketch";
import ProceduralEffects from "./ProceduralEffects";
import ParticleCanvas from "./ParticleCanvas";
import { makeVisualRecipe, visualSeedPoints, type VisualInput, type VisualProp, type VisualRecipe } from "./illustration-recipe";

type Props = VisualInput & {
  className?: string;
  label?: string;
};

/** Every shape below is DOM SVG. No remote image, raster request, canvas or model. */
function HeroSprite({ pose = "stand" }: { pose?: "stand" | "dance" | "reach" | "sneak" | "fight" }) {
  const dancing = pose === "dance";
  const reaching = pose === "reach";
  return <g className={dancing ? "procedural-art__dancer" : ""}>
    <ellipse cx="48" cy="119" rx="43" ry="8" fill="#121327" opacity=".55"/>
    <path d={dancing ? "M30 93 L13 118 L33 119 L43 102 L53 120 L71 113 L60 90 Z"
      : "M31 91 L28 116 L44 119 L48 101 L57 119 L72 115 L64 92 Z"} fill="#29203e"/>
    <path d="M27 46 L18 102 Q44 122 78 103 L65 46Z" fill="#453766" stroke="#997db7" strokeWidth="3"/>
    <path d="M28 52 L25 95 Q35 109 40 106 L42 56Z" fill="#71629a"/>
    <path d="M65 53 L72 92 L63 106 L53 58Z" fill="#30294e"/>
    <path d="M28 49 L17 69 L12 94 L25 98 L37 64Z" fill="#71629a" stroke="#3b315a" strokeWidth="2"
      transform={dancing ? "rotate(-32 27 53)" : reaching ? "rotate(-22 27 53)" : undefined}/>
    <path d="M64 52 L78 74 L85 92 L71 98 L56 64Z" fill="#483966" stroke="#332b4e" strokeWidth="2"
      transform={dancing ? "rotate(35 65 54)" : pose === "fight" ? "rotate(-38 65 54)" : undefined}/>
    <path d="M28 31 Q32 6 46 8 Q72 6 74 39 L67 59 L26 58 Z" fill="#514276" stroke="#b29bc3" strokeWidth="2"/>
    <path d="M37 31 Q47 21 65 32 L62 54 L39 53Z" fill="#dfb39b"/>
    <path d="M36 30 Q47 10 67 31 L62 35 L49 30Z" fill="#2a2548"/>
    <rect x="42" y="41" width="5" height="3" fill="#322b42"/><rect x="56" y="41" width="5" height="3" fill="#322b42"/>
    <path d="M45 49 Q50 52 55 48" stroke="#8c5961" strokeWidth="2" fill="none"/>
    <path d="M46 58 L57 58 L58 82 L47 82 Z" fill="#e9c58c"/>
    <circle cx="53" cy="69" r="4" fill="#a7835c"/>
    <path d="M28 57 L19 101" stroke="#a58cbd" strokeWidth="2" opacity=".6"/>
  </g>;
}

function GoblinSprite({ mood }: { mood: "happy" | "worried" | "angry" }) {
  return <g>
    <ellipse cx="47" cy="123" rx="40" ry="8" fill="#111527" opacity=".5"/>
    <path d="M20 75 L15 110 L36 116 L58 115 L77 108 L67 70Z" fill="#8c7452" stroke="#c3a27a" strokeWidth="2"/>
    <path d="M31 100 L27 121 L41 121 L46 100 M51 100 L56 121 L68 121 L61 100" fill="#524244"/>
    <path d="M22 48 L7 36 L13 66 L25 64 M69 48 L87 35 L81 65 L68 63" fill="#739f75" stroke="#466b56" strokeWidth="2"/>
    <ellipse cx="46" cy="64" rx="30" ry="31" fill="#8cc184" stroke="#536d55" strokeWidth="3"/>
    <path d="M18 45 L25 16 Q47 6 72 17 L82 43Z" fill="#847178" stroke="#c8ad98" strokeWidth="3"/>
    <path d="M14 43 L78 43 L75 52 L18 52Z" fill="#bca48e"/>
    <rect x="28" y="62" width="10" height="8" fill="#252e36"/>
    <rect x="57" y="62" width="10" height="8" fill="#252e36"/>
    {mood === "happy" ? <path d="M37 80 Q47 91 60 79" stroke="#4b614b" strokeWidth="4" fill="none"/> :
      mood === "angry" ? <path d="M30 60 l12 7 M64 60 l-12 7 M37 84 H61" stroke="#4b614b" strokeWidth="4" fill="none"/> :
      <><ellipse cx="49" cy="85" rx="5" ry="7" fill="#51644f"/><path d="M27 55 l10 -4 M57 51 l10 5" stroke="#51644f" strokeWidth="3"/></>}
    <path d="M19 80 Q5 89 12 103 M72 82 Q88 94 83 109" stroke="#78a879" strokeWidth="11" fill="none"/>
  </g>;
}

function GhostSprite({ free }: { free: boolean }) {
  return <g className="procedural-art__ghost" opacity=".92">
    <path d="M18 90 Q7 38 33 19 Q51 1 70 21 Q87 41 77 82 L85 112 L68 105 L57 118 L46 106 L30 117 L19 105Z"
      fill="#c7dfee" stroke="#f0eee2" strokeWidth="3" opacity=".84"/>
    <ellipse cx="47" cy="47" rx="26" ry="30" fill="#d5e9e2"/>
    <path d="M22 36 Q18 12 49 12 Q84 12 74 49 L65 35 L48 39 L32 30 Z" fill="#91a4c1"/>
    <ellipse cx="38" cy="48" rx="4" ry="7" fill="#41516d"/>
    <ellipse cx="57" cy="48" rx="4" ry="7" fill="#41516d"/>
    <path d="M42 65 Q50 69 56 63" fill="none" stroke="#667895" strokeWidth="3"/>
    {!free && <g fill="none" stroke="#c7a075" strokeWidth="4">
      <path d="M10 83 L28 99 L50 91 L69 105 L95 91"/>
      <circle cx="29" cy="97" r="6"/><circle cx="68" cy="102" r="6"/>
    </g>}
  </g>;
}

function IconProp({ prop, color }: { prop: VisualProp; color: string }) {
  switch (prop) {
    case "key": return <g fill={color} stroke="#4d364b" strokeWidth="2">
      <circle cx="12" cy="15" r="11" fill="none" stroke={color} strokeWidth="7"/>
      <path d="M22 15 L65 15 L65 27 L55 27 L55 22 L45 22 L45 31 L36 31 L36 15Z"/>
    </g>;
    case "thimble": return <g><path d="M18 6 Q6 12 11 42 L13 51 H44 L47 16 Q43 4 30 5Z" fill={color} stroke="#5a4552" strokeWidth="4"/><path d="M12 37 H46 M21 16 H26 M33 22 H38 M21 29 H26" stroke="#fff0bf" strokeWidth="3"/></g>;
    case "apple": return <g><path d="M32 15 Q8 -2 7 29 Q5 56 30 56 Q51 56 57 28 Q58 2 35 14Z" fill="#db6674" stroke="#f1a5a4" strokeWidth="3"/><path d="M33 12 Q23 -2 30 -9 M34 11 Q52 -5 53 8 Q40 12 34 11" fill="#7ca57b" stroke="#456a62" strokeWidth="3"/></g>;
    case "scroll": return <g><path d="M6 7 L59 9 L55 54 L5 54Z" fill="#e5c896" stroke="#846b64" strokeWidth="3"/><path d="M14 20 H47 M14 31 H47 M14 42 H36" stroke="#a98c71" strokeWidth="4"/><circle cx="54" cy="49" r="8" fill="#b25f69"/></g>;
    case "sword": return <g><path d="M28 53 L37 11 L46 1 L48 16 L35 56Z" fill="#c9dfe3" stroke="#6b8994" strokeWidth="3"/><path d="M12 46 L52 59" stroke="#deb876" strokeWidth="7"/><path d="M28 53 L22 77" stroke="#66506c" strokeWidth="9"/></g>;
    case "gear": return <g><circle cx="34" cy="30" r="26" fill="#b8996b" stroke="#ecce96" strokeWidth="8" strokeDasharray="12 4"/><circle cx="34" cy="30" r="13" fill="#403549"/><circle cx="34" cy="30" r="4" fill="#f5daa6"/></g>;
    case "mirror": return <g><ellipse cx="30" cy="26" rx="24" ry="30" fill="#a5cad5" stroke="#e3bb80" strokeWidth="6"/><path d="M30 57 V76" stroke="#e3bb80" strokeWidth="8"/><path d="M19 25 L40 10" stroke="#f7fcf0" strokeWidth="5" opacity=".7"/></g>;
    case "wand": return <g><path d="M20 69 L57 12" stroke="#bb9975" strokeWidth="9"/><path d="M57 1 L62 13 L75 15 L63 23 L60 36 L53 23 L40 17 L54 11Z" fill={color}/></g>;
    case "heart": return <path d="M31 51 L8 29 Q-3 9 13 4 Q24 0 31 14 Q43 -1 56 5 Q71 17 53 35 Z" fill="#f39a9b" stroke="#e5c0a5" strokeWidth="3"/>;
    default: return <g><circle cx="30" cy="29" r="22" fill="none" stroke={color} strokeWidth="4" strokeDasharray="7 7"/><path d="M30 5 V55 M5 30 H55" stroke={color} strokeWidth="3"/></g>;
  }
}

function RoomShimmers({ recipe }: { recipe: VisualRecipe }) {
  const motes = visualSeedPoints(recipe.seed, 8);
  return <g>
    {motes.map((p, i) => <g key={i} className="procedural-art__spark" style={{ animationDelay: p.delay + "s" }}>
      <circle cx={p.x} cy={p.y} r={p.size} fill={recipe.accent} opacity={i%3===0?".72":".38"}/>
      {i % 5 === 0 && <path d={"M"+(p.x-5)+" "+p.y+" h10 M"+p.x+" "+(p.y-5)+" v10"} stroke="#ffeed2" strokeWidth="1.3"/>}
    </g>)}
  </g>;
}

/** Animated portrait freed from its frame: museum room one. */
function PaintingSprite() {
  return <g>
    <rect x="7" y="1" width="87" height="117" rx="3" fill="#9f7d62" stroke="#e5c58b" strokeWidth="6"/>
    <rect x="19" y="13" width="62" height="88" fill="#383253" stroke="#796589" strokeWidth="4"/>
    <g className="fx-living-painting">
      <path d="M26 78Q49 63 76 78L77 104H23Z" fill="#8b6aab"/>
      <ellipse cx="51" cy="57" rx="22" ry="26" fill="#e8b99b"/>
      <path d="M29 54Q34 22 52 29Q75 26 75 55L63 43L37 46Z" fill="#4a394d"/>
      <rect x="40" y="58" width="5" height="4" fill="#413444"/>
      <rect x="60" y="58" width="5" height="4" fill="#413444"/>
      <path d="M43 72Q53 79 63 71" fill="none" stroke="#965e6d" strokeWidth="3"/>
      <path d="M24 92Q14 104 16 118 M78 94Q91 105 88 116" stroke="#b99bd0" strokeWidth="6" fill="none"/>
    </g>
    <g className="fx-paint-drop" fill="#cda0c5">
      <path d="M14 16v14q-6 10 0 19q7-11 0-19" /><circle cx="94" cy="91" r="4"/>
    </g>
  </g>;
}
/** Clattering clockwork dinosaur skeleton, clearly not a generic goblin. */
function ClockworkSkeletonSprite() {
  return <g className="fx-bones">
    <ellipse cx="51" cy="127" rx="53" ry="9" fill="#151526" opacity=".56"/>
    <path d="M22 49L60 31L85 49L70 86L42 87Z" fill="#51475e" stroke="#c7ad8b" strokeWidth="5"/>
    <circle cx="51" cy="25" r="22" fill="#d7c3a2" stroke="#f4e4c7" strokeWidth="3"/>
    <rect x="39" y="18" width="9" height="12" fill="#3c3341"/>
    <rect x="58" y="18" width="9" height="12" fill="#3c3341"/>
    <path d="M39 37H67 M51 34v8" stroke="#786a63" strokeWidth="4"/>
    <path d="M19 60L49 78L77 58 M51 51V104" stroke="#d7c7a5" strokeWidth="10" fill="none"/>
    <path d="M48 100L31 119 M55 100L75 119" stroke="#d7c7a5" strokeWidth="9"/>
    <path d="M14 67L4 92 M81 66L96 90" stroke="#c5b296" strokeWidth="7"/>
    <circle cx="52" cy="81" r="15" stroke="#c8a374" strokeWidth="6" strokeDasharray="7 3" fill="#484057"/>
  </g>;
}
function ForbiddenExhibitSprite() {
  return <g>
    <rect x="10" y="101" width="97" height="22" rx="3" fill="#86708b" stroke="#d1b58c" strokeWidth="4"/>
    <path d="M25 100L18 53H99L92 100Z" fill="#453b56" stroke="#a28a9a" strokeWidth="3"/>
    <g className="fx-cursed">
      <path d="M28 40L18 13L44 24L55 7L69 26L94 13L84 41Z" fill="#d6b272" stroke="#f5d69b" strokeWidth="4"/>
      <rect x="28" y="40" width="56" height="14" rx="4" fill="#e1bd80" stroke="#f3d5a5" strokeWidth="3"/>
      <circle cx="54" cy="32" r="8" fill="#d779aa"/>
      <path d="M41 67L49 73M72 67L64 73" stroke="#ed98b1" strokeWidth="5"/>
      <path d="M45 89Q56 80 69 90" fill="none" stroke="#e6abc5" strokeWidth="4"/>
    </g>
  </g>;
}

function ActionComposition({ input, recipe }: { input: VisualInput; recipe: VisualRecipe }) {
  const isHollowmere = input.dungeonSlug === "bell-of-hollowmere";
  const ghost = isHollowmere && input.roomIndex === 2;
  const machine = isHollowmere && input.roomIndex === 1;
  const museum = input.dungeonSlug === "midnight-museum";
  const relevant = recipe.gesture === "dance" || recipe.gesture === "kiss" || recipe.gesture === "offer";
  return <g>
    <rect width="320" height="220" fill="#111128" opacity=".66"/>
    <path d="M0 157 Q90 144 152 172 Q225 146 320 151 V220 H0Z" fill="#261e37" opacity=".85"/>
    <ellipse cx="158" cy="141" rx="126" ry="70" fill={recipe.accent} opacity=".10"/>
    <g transform={"translate(" + (31 + recipe.variant * 3) + " 67) scale(1.04)"}><HeroSprite pose={recipe.gesture === "dance" ? "dance"
      : recipe.gesture === "sneak" ? "sneak" : recipe.gesture === "fight" ? "fight" : relevant || recipe.gesture === "unlock" ? "reach" : "stand"}/></g>
    {museum ? <g transform={"translate(" + (216-recipe.variant*2) + " 65) scale(.97)"}>
        {input.roomIndex === 0 ? <PaintingSprite/> : input.roomIndex === 1
          ? <ClockworkSkeletonSprite/> : <ForbiddenExhibitSprite/>}
      </g> : ghost ? <g transform="translate(222 70) scale(.9)"><GhostSprite free={recipe.mood === "triumph"}/></g>
      : machine ? <g transform="translate(217 131)">
          <circle r="45" fill="#59485d" stroke="#bfa279" strokeWidth="11" strokeDasharray="20 5"/>
          <circle r="23" fill="#241f3c" stroke="#e2be8b" strokeWidth="6"/>
          <path d="M-44 0 H44 M0 -44 V44" stroke="#c9a779" strokeWidth="5"/>
        </g>
        : <g transform="translate(223 65) scale(.95)">
          <GoblinSprite mood={input.success === false ? "angry" : recipe.gesture === "kiss" || recipe.gesture === "offer" ? "happy" : "worried"}/>
        </g>}
    <g transform={"translate("+(recipe.variant % 2 === 0 ? 149 : 172)+" "+(recipe.gesture === "dance" ? 33 : 67)+") scale(.72)"}
      className="procedural-art__item">
      <ellipse cx="30" cy="30" rx="45" ry="40" fill={recipe.accent} opacity=".17"/>
      <IconProp prop={recipe.prop} color={recipe.accent}/>
    </g>
    {recipe.gesture === "dance" && <g fill="none" stroke={recipe.accent} strokeWidth="4" strokeLinecap="round">
      <path d="M70 52 Q116 17 151 53 Q183 77 201 36" strokeDasharray="6 9"/>
      <path d="M142 29 v-14 l12 -4 v17 M201 27 V11 l13 -4 V24" fill="none"/>
      <circle cx="142" cy="29" r="5" fill={recipe.accent}/><circle cx="201" cy="27" r="5" fill={recipe.accent}/>
    </g>}
    {recipe.gesture === "kiss" && <g fill="#f7a3b5">
      <path d="M164 58 Q146 42 158 33 Q165 27 172 37 Q181 26 188 35 Q198 46 164 58Z"/>
      <path d="M193 91 Q184 83 190 77 Q194 74 197 79 Q203 74 206 78 Q214 84 193 91Z"/>
    </g>}
    {recipe.gesture === "unlock" && <g stroke={recipe.accent} fill="none" strokeWidth="3">
      <path d="M131 115 Q169 94 193 115" strokeDasharray="6 5"/>
      <path d="M192 98 v-14 a11 11 0 0 1 22 0 v14" />
      <rect x="186" y="97" width="34" height="26" rx="4" fill="#c5a678"/>
      <circle cx="203" cy="108" r="4" fill="#47394c"/>
    </g>}
    {recipe.gesture === "spell" && <g fill="none" stroke={recipe.accent} strokeWidth="3">
      <circle cx="160" cy="91" r="42" strokeDasharray="14 9"/>
      <circle cx="160" cy="91" r="28" strokeDasharray="3 8"/>
      <path d="M160 37 V145 M105 91 H215" opacity=".65"/>
    </g>}
    {input.success === false && <g stroke="#ec8886" strokeWidth="4">
      <path d="M156 123 l-10 15 15 7 -11 15" fill="none"/>
      <path d="M205 44 l-12 -10 m19 4 l12 -13" opacity=".8"/>
    </g>}
    <RoomShimmers recipe={recipe}/>
  </g>;
}

function EndingComposition({ recipe }: { recipe: VisualRecipe }) {
  const free = ["oath-remade", "borrowed-dawn", "keeper-unchained"].includes(recipe.ending);
  const dangerous = recipe.mood === "danger";
  const chained = recipe.ending === "silent-bargain";
  return <g>
    <rect width="320" height="220" fill={dangerous ? "#242139" : "#e1bc80"} opacity={dangerous ? ".30" : ".17"}/>
    <path d="M0 188 L92 143 L164 183 L270 130 L320 163 V220 H0Z" fill="#362c48" opacity=".95"/>
    <path d="M12 0 L154 150 L285 0" fill="none" stroke={recipe.accent} strokeWidth="3" opacity=".35"/>
    <circle cx="164" cy="49" r="56" fill={recipe.accent} opacity=".16"/>
    <g transform="translate(108 67) scale(1.06)"><GhostSprite free={free}/></g>
    <g transform="translate(24 95) scale(.68)"><HeroSprite pose="reach"/></g>
    <path d="M155 6 V32" stroke="#aa8759" strokeWidth="7"/>
    <path d="M133 30 Q149 14 175 27 L189 68 H119Z" fill="#d0a876" stroke="#f4d29a" strokeWidth="3"/>
    <path d="M125 71 H185" stroke="#f7dcaa" strokeWidth="9"/>
    {chained && <g stroke="#bb9572" strokeWidth="5" fill="none"><path d="M139 102 L123 139 L164 166 L193 190"/></g>}
    {dangerous && <g>
      <path d="M217 218 Q222 155 243 153 Q264 160 269 218Z" fill="#251b36"/>
      <ellipse cx="247" cy="171" rx="19" ry="10" fill="#d66b89" opacity=".4"/>
      <path d="M222 176 L238 168 M272 174 L258 166" stroke="#ed8899" strokeWidth="4"/>
    </g>}
    {recipe.ending === "oath-remade" && <g fill="#e8d18b">
      {Array.from({ length: 9 }, (_, i) => <g key={i}>
        <circle cx={16+i*34} cy={174-(i%3)*15} r={5+(i%3)} opacity=".9"/>
        <path d={"M"+(16+i*34)+" "+(169-(i%3)*15)+" v-14"} stroke="#e8d18b" strokeWidth="2"/>
      </g>)}
    </g>}
    <RoomShimmers recipe={recipe}/>
  </g>;
}

export default function ProceduralIllustration(input: Props) {
  const { kind, dungeonSlug, roomIndex, className = "", label, clueId } = input;
  const recipe = makeVisualRecipe(input);
  const id = useId().replace(/:/g, "");
  const classes = ["procedural-art", "procedural-art--" + kind, className].filter(Boolean).join(" ");
  return <div className={classes} role="img" aria-label={label ?? "Procedural fantasy illustration"}>
    {kind === "clue" ? <ClueSketch variant={clueId ?? "inscription"}/> :
      <PixelScene dungeonSlug={dungeonSlug} roomIndex={roomIndex} className="procedural-art__background"/>}
    <svg className="procedural-art__foreground" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid meet"
      aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={"glow"+id}><stop offset="0%" stopColor={recipe.accent} stopOpacity=".35"/>
          <stop offset="100%" stopColor={recipe.accent} stopOpacity="0"/></radialGradient>
      </defs>
      {kind === "action" && <ActionComposition input={input} recipe={recipe}/>}
      {kind === "ending" && <EndingComposition recipe={recipe}/>}
      {kind === "room" && <g>
        <ellipse cx="170" cy="110" rx="150" ry="100" fill={"url(#glow"+id+")"}/>
        <RoomShimmers recipe={recipe}/>
        <path d="M0 196 Q75 180 150 199 Q230 181 320 195" stroke="#b0a0bb" strokeWidth="3" fill="none" opacity=".24"/>
      </g>}
      {kind === "clue" && <g>
        <ellipse cx="160" cy="100" rx="96" ry="81" fill={"url(#glow"+id+")"}/>
        <RoomShimmers recipe={recipe}/>
      </g>}
      <ProceduralEffects input={input} recipe={recipe}/>
    </svg>
    <ParticleCanvas input={input} recipe={recipe}/>
  </div>;
}
