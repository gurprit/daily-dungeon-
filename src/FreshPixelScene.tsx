/** Distinct 8-bit fallback scenes for the fresh NES test dungeons.
 * Shown instantly during image inference, not downloaded or AI-generated. */
export default function FreshPixelScene({ dungeonSlug, roomIndex = 0, className }: {
  dungeonSlug: string; roomIndex?: number; className?: string
}) {
  const lighthouse = dungeonSlug === "lighthouse-lost-dawn";
  const orchard = dungeonSlug === "clockwork-orchard";
  const bakery = dungeonSlug === "dragon-bakery";
  const colors = lighthouse
    ? { sky: "#162f50", wall: "#d4a97c", floor: "#20415d", bright: "#8bdce7" }
    : orchard ? { sky: "#273747", wall: "#8a624c", floor: "#425e38", bright: "#e6bd67" }
      : { sky: "#3f2b46", wall: "#876057", floor: "#5e393d", bright: "#f7bc69" };
  return <svg className={className} viewBox="0 0 320 220" role="img"
      aria-label={lighthouse ? "Pixel art of a haunted lighthouse" :
        orchard ? "Pixel art of a clockwork orchard" : "Pixel art of a dragon's bakery"}
      xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
    <rect width="320" height="220" fill={colors.sky}/>
    {Array.from({length:15},(_,i)=><rect key={i} x={(i*43+17)%315} y={(i*29+15)%104}
      width={i%3===0?3:2} height={2} fill="#f4d59b" opacity=".62"/>)}
    {lighthouse && <g>
      <path d="M0 158 H320 V220 H0" fill="#20415d"/>
      {Array.from({length:7},(_,i)=><path key={i} d={"M"+(i*52-11)+" 179 h31 m-18 13h42"}
        fill="none" stroke="#719aaa" strokeWidth="3"/>)}
      <path d="M167 174 L186 63 H238 L259 174Z" fill="#e5d0a5" stroke="#876f7a" strokeWidth="6"/>
      <path d="M187 70 L190 46 L234 46 L238 70Z" fill="#a4c1c7"/>
      <path d="M180 43 L214 20 L247 43Z" fill="#70516f"/>
      <rect x="205" y="49" width="22" height="21" fill="#f4d087"/>
      <path d="M214 59 L300 37 L300 84Z" fill="#f5e8ab" opacity=".19"/>
      <rect x="196" y="111" width="18" height="26" fill="#50768b"/>
      <rect x="222" y="111" width="18" height="26" fill="#50768b"/>
      {roomIndex === 0 && <g transform="translate(251 143)">
        <ellipse cx="12" cy="15" rx="14" ry="17" fill="#8d7d75"/>
        <rect x="1" y="24" width="22" height="21" fill="#e0ba66"/>
        <circle cx="7" cy="13" r="3" fill="#1c2639"/><circle cx="17" cy="13" r="3" fill="#1c2639"/>
        <path d="M7 3L6-5H19L21 3" fill="#e0ba66"/>
      </g>}
      {roomIndex === 1 && <g transform="translate(205 106)">
        <ellipse cx="12" cy="22" rx="43" ry="21" fill="#d5a4d1"/>
        <ellipse cx="16" cy="29" rx="31" ry="15" fill="#f2c1d9"/>
        <rect x="8" y="13" width="16" height="38" fill="#7c658f"/>
        <circle cx="13" cy="18" r="2" fill="#222237"/>
        <path d="M16 13L8 1 M21 13L28 1" stroke="#fae4bd" strokeWidth="2"/>
      </g>}
      {roomIndex === 2 && <g>
        <circle cx="215" cy="95" r="27" fill="#e8b865" stroke="#f9e3a3" strokeWidth="7"/>
        <circle cx="215" cy="95" r="13" fill="#f7e4b2"/>
        <rect x="210" y="90" width="4" height="4" fill="#66445a"/>
        <rect x="222" y="90" width="4" height="4" fill="#66445a"/>
      </g>}
    </g>}
    {orchard && <g>
      <rect x="0" y="173" width="320" height="47" fill="#425e38"/>
      {Array.from({length:6},(_,i)=><g key={i} transform={"translate("+((i*52+7)%320)+" "+(64+i%3*16)+")"}>
        <rect x="19" y="41" width="15" height="73" fill="#876052"/>
        <rect x="0" y="14" width="50" height="40" rx="7" fill="#548253"/>
        <rect x="9" y="0" width="35" height="24" fill="#76a16a"/>
        <rect x="25" y="31" width="9" height="9" fill="#f6c769"/>
      </g>)}
      {roomIndex===0 && <g transform="translate(210 107)">
        <rect width="38" height="45" fill="#a7b1af" stroke="#d4bf9a" strokeWidth="4"/>
        <rect x="8" y="10" width="7" height="7" fill="#233747"/>
        <rect x="23" y="10" width="7" height="7" fill="#233747"/>
        <rect x="7" y="50" width="10" height="12" fill="#987e60"/>
        <rect x="25" y="50" width="10" height="12" fill="#987e60"/>
        <path d="M17 -2v-11" stroke="#d4bf9a" strokeWidth="4"/>
      </g>}
      {roomIndex===1 && <g>
        <circle cx="225" cy="139" r="32" fill="#c5645b" stroke="#e8a66a" strokeWidth="6"/>
        <path d="M218 105l5-15 12 0" fill="none" stroke="#5c8953" strokeWidth="6"/>
        <circle cx="213" cy="136" r="5" fill="#3c3148"/>
        <circle cx="233" cy="136" r="5" fill="#3c3148"/>
      </g>}
      {roomIndex===2 && <g>
        <circle cx="222" cy="113" r="33" fill="#d1a85e" stroke="#f0ca79" strokeWidth="7" strokeDasharray="13 7"/>
        <circle cx="222" cy="113" r="16" fill="#594359"/>
        <rect x="210" y="154" width="24" height="31" fill="#b7a17d"/>
      </g>}
    </g>}
    {bakery && <g>
      <rect x="0" y="173" width="320" height="47" fill="#5e393d"/>
      <rect x="182" y="53" width="101" height="123" fill="#ad8570" stroke="#d6ad85" strokeWidth="5"/>
      {Array.from({length:4},(_,i)=><g key={i}>
        <path d={"M186 "+(69+i*24)+"h94"} stroke="#795e62" strokeWidth="3"/>
        <path d={"M"+(194+(i%2)*23)+" "+(69+i*24)+"v24 M"+(240+(i%2)*23)+" "+(69+i*24)+"v24"}
          stroke="#795e62" strokeWidth="3"/>
      </g>)}
      <path d="M209 177 V127 Q209 90 235 90 Q265 90 265 127 V177Z" fill="#392d3e" stroke="#e7bd83" strokeWidth="6"/>
      {roomIndex===0 && <g transform="translate(263 143)">
        <path d="M-38 35Q-48 5-30 -11L-19 1L-10 -16L7 2Q17 18 8 35Z" fill="#e5a455"/>
        <path d="M-29 31Q-31 14-18 11Q-1 18-6 31Z" fill="#fff0a8"/>
      </g>}
      {roomIndex===1 && <g>
        <ellipse cx="228" cy="160" rx="39" ry="22" fill="#e5c287"/>
        <rect x="211" y="148" width="5" height="5" fill="#665367"/>
        <rect x="240" y="148" width="5" height="5" fill="#665367"/>
        <path d="M219 160q9 7 18 0" stroke="#916658" strokeWidth="3" fill="none"/>
      </g>}
      {roomIndex===2 && <g>
        <circle cx="245" cy="78" r="35" fill="#c0a19c" stroke="#e0c1a2" strokeWidth="4"/>
        <rect x="208" y="113" width="76" height="67" fill="#78646c"/>
        <circle cx="231" cy="75" r="4" fill="#312c42"/>
        <circle cx="256" cy="75" r="4" fill="#312c42"/>
        <path d="M236 93q10 5 18 0" stroke="#584252" strokeWidth="4" fill="none"/>
      </g>}
    </g>}
    {/* Same identifiable small purple-hooded adventurer on the left. */}
    <g transform="translate(50 115)">
      <ellipse cx="29" cy="68" rx="32" ry="7" fill="#1b2137"/>
      <path d="M17 18 L6 61L29 71L53 61L43 18Z" fill="#544172" stroke="#a18cba" strokeWidth="3"/>
      <rect x="15" y="15" width="28" height="26" fill="#e5b88f"/>
      <path d="M11 18Q10-12 28-13Q47-11 49 17L42 28L43 8L17 8L15 31Z" fill="#604c85"/>
      <rect x="21" y="22" width="4" height="4" fill="#302f42"/>
      <rect x="35" y="22" width="4" height="4" fill="#302f42"/>
      <path d="M24 33Q30 38 36 33" fill="none" stroke="#77545d" strokeWidth="2"/>
      <rect x="22" y="47" width="17" height="7" fill="#edc981"/>
    </g>
  </svg>;
}
