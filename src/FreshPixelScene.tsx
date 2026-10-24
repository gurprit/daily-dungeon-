import { useScrollParallax } from "./useScrollParallax";

type Props = { dungeonSlug: string; roomIndex?: number; className?: string };
type LayerProps = { depth: number; children: React.ReactNode; name: string };

/** Parallax motion belongs on outer SVG groups. Nested idle animations can then
 * move independently without transform attributes fighting CSS keyframes. */
function Layer({ depth, children, name }: LayerProps) {
  return <g data-parallax-depth={depth} data-layer={name}>{children}</g>;
}

function Hero() {
  return <g transform="translate(50 115)" className="fresh-scene__hero">
    <ellipse cx="29" cy="68" rx="32" ry="7" fill="#1b2137"/>
    <path d="M17 18 L6 61L29 71L53 61L43 18Z" fill="#544172" stroke="#a18cba" strokeWidth="3"/>
    <rect x="15" y="15" width="28" height="26" fill="#e5b88f"/>
    <path d="M11 18Q10-12 28-13Q47-11 49 17L42 28L43 8L17 8L15 31Z" fill="#604c85"/>
    <rect x="21" y="22" width="4" height="4" fill="#302f42"/>
    <rect x="35" y="22" width="4" height="4" fill="#302f42"/>
    <path d="M24 33Q30 38 36 33" fill="none" stroke="#77545d" strokeWidth="2"/>
    <rect x="22" y="47" width="17" height="7" fill="#edc981"/>
  </g>;
}

function Lighthouse({ roomIndex }: { roomIndex: number }) {
  return <>
    <Layer name="distant-sea" depth={0.2}>
      <circle cx="62" cy="48" r="22" fill="#dec9b2"/>
      <path d="M0 155 H320 V232 H0" fill="#2b506a"/>
      <path d="M20 110 Q65 97 100 109 M11 119 Q49 112 96 118" stroke="#b0a2b5" strokeWidth="2" fill="none" opacity=".48"/>
      <path d="M16 151 l14 -12 l22 12 M278 152 l20 -17 l24 17" fill="#28364f"/>
    </Layer>
    <Layer name="lighthouse-architecture" depth={0.48}>
      <path d="M167 182 L186 63 H238 L259 182Z" fill="#e5d0a5" stroke="#876f7a" strokeWidth="6"/>
      {Array.from({ length: 4 },(_,i)=><path key={i} d={"M"+(183-i*4)+" "+(91+i*22)+" H"+(240+i*4)} stroke="#c3a98e" strokeWidth="3"/>)}
      <path d="M187 70 L190 46 L234 46 L238 70Z" fill="#a4c1c7"/>
      <path d="M180 43 L214 20 L247 43Z" fill="#70516f"/>
      <rect x="205" y="49" width="22" height="21" fill="#f4d087"/>
      <path className="fresh-scene__beam" d="M216 59 L326 23 L331 107Z" fill="#ffe6ac" opacity=".24"/>
      <rect x="196" y="111" width="18" height="26" fill="#50768b"/>
      <rect x="222" y="111" width="18" height="26" fill="#50768b"/>
      <rect x="210" y="153" width="24" height="29" fill="#394660"/>
    </Layer>
    <Layer name="lighthouse-characters" depth={0.75}>
      {roomIndex === 0 && <g transform="translate(251 143)" className="fresh-scene__character">
        <ellipse cx="12" cy="15" rx="14" ry="17" fill="#8d7d75"/>
        <rect x="1" y="24" width="22" height="21" fill="#e0ba66"/>
        <circle cx="7" cy="13" r="3" fill="#1c2639"/><circle cx="17" cy="13" r="3" fill="#1c2639"/>
        <path d="M7 3L6-5H19L21 3" fill="#e0ba66"/>
      </g>}
      {roomIndex === 1 && <g transform="translate(205 106)" className="fresh-scene__moth">
        <ellipse cx="12" cy="22" rx="43" ry="21" fill="#d5a4d1"/>
        <ellipse cx="16" cy="29" rx="31" ry="15" fill="#f2c1d9"/>
        <rect x="8" y="13" width="16" height="38" fill="#7c658f"/>
        <circle cx="13" cy="18" r="2" fill="#222237"/>
        <path d="M16 13L8 1 M21 13L28 1" stroke="#fae4bd" strokeWidth="2"/>
      </g>}
      {roomIndex === 2 && <g className="fresh-scene__sun">
        <circle cx="215" cy="95" r="27" fill="#e8b865" stroke="#f9e3a3" strokeWidth="7"/>
        <circle cx="215" cy="95" r="13" fill="#f7e4b2"/>
        <rect x="210" y="90" width="4" height="4" fill="#66445a"/>
        <rect x="222" y="90" width="4" height="4" fill="#66445a"/>
      </g>}
    </Layer>
    <Layer name="lighthouse-front-waves" depth={0.95}>
      <path d="M-16 204 Q33 188 77 204 T165 204 T258 204 T354 204 V235 H-16Z" fill="#20415d"/>
      <g className="fresh-scene__waves" stroke="#719aaa" strokeWidth="3" fill="none">
        {Array.from({length:6},(_,i)=><path key={i} d={"M"+(i*60-13)+" 212 h31 m-18 10h42"}/>)}
      </g>
      <path className="fresh-scene__mist" d="M-10 172 Q45 154 85 175 T180 174 T320 166" stroke="#d3ccd9" strokeWidth="9" opacity=".12" fill="none"/>
    </Layer>
  </>;
}

function Orchard({ roomIndex }: { roomIndex: number }) {
  return <>
    <Layer name="orchard-far-trees" depth={0.23}>
      <path d="M-15 180V135Q58 99 102 140Q171 92 230 144Q290 111 337 140V239H-15" fill="#314d42"/>
      {Array.from({length:4},(_,i)=><g key={i} transform={"translate("+((i*92-27))+" "+(45+(i%2)*14)+")"}>
        <rect x="23" y="72" width="11" height="85" fill="#4a4d45"/>
        <rect x="-7" y="27" width="69" height="52" fill="#456f54"/>
        <rect x="8" y="6" width="43" height="29" fill="#61815a"/>
      </g>)}
    </Layer>
    <Layer name="orchard-main-trees" depth={0.47}>
      <rect x="0" y="170" width="320" height="66" fill="#425e38"/>
      {Array.from({length:5},(_,i)=><g key={i} transform={"translate("+((i*68+12)%345-15)+" "+(64+i%3*13)+")"}>
        <rect x="19" y="41" width="15" height="84" fill="#876052"/>
        <rect x="0" y="14" width="50" height="40" rx="7" fill="#548253"/>
        <rect x="9" y="0" width="35" height="24" fill="#76a16a"/>
        <rect x="25" y="31" width="9" height="9" fill="#f6c769"/>
      </g>)}
    </Layer>
    <Layer name="orchard-clockwork" depth={0.65}>
      {roomIndex === 0 && <g transform="translate(210 107)" className="fresh-scene__character">
        <rect width="38" height="45" fill="#a7b1af" stroke="#d4bf9a" strokeWidth="4"/>
        <rect x="8" y="10" width="7" height="7" fill="#233747"/>
        <rect x="23" y="10" width="7" height="7" fill="#233747"/>
        <rect x="7" y="50" width="10" height="12" fill="#987e60"/>
        <rect x="25" y="50" width="10" height="12" fill="#987e60"/>
        <path d="M17 -2v-11" stroke="#d4bf9a" strokeWidth="4"/>
      </g>}
      {roomIndex === 1 && <g>
        <g className="fresh-scene__gear" transform="translate(225 139)">
          <circle r="38" fill="#b18a63" stroke="#e6b96c" strokeWidth="7" strokeDasharray="13 6"/>
          <circle r="18" fill="#5b4651"/>
        </g>
        <circle cx="225" cy="139" r="32" fill="#c5645b" stroke="#e8a66a" strokeWidth="6"/>
        <path d="M218 105l5-15 12 0" fill="none" stroke="#5c8953" strokeWidth="6"/>
        <rect x="211" y="134" width="5" height="5" fill="#3c3148"/>
        <rect x="231" y="134" width="5" height="5" fill="#3c3148"/>
      </g>}
      {roomIndex === 2 && <g>
        <g className="fresh-scene__gear" transform="translate(222 113)">
          <circle r="36" fill="#d1a85e" stroke="#f0ca79" strokeWidth="9" strokeDasharray="13 7"/>
          <circle r="16" fill="#594359"/>
          <path d="M-13 0H13 M0-13V13" stroke="#e7c77f" strokeWidth="3"/>
        </g>
        <rect x="210" y="154" width="24" height="31" fill="#b7a17d"/>
      </g>}
      {roomIndex !== 2 && <g className="fresh-scene__bees" fill="#e6bd67">
        <rect x="160" y="80" width="10" height="7"/><rect x="164" y="75" width="3" height="4" fill="#e0e3da"/>
        <rect x="281" y="116" width="10" height="7"/><rect x="284" y="111" width="3" height="4" fill="#e0e3da"/>
      </g>}
    </Layer>
    <Layer name="orchard-near-plants" depth={0.94}>
      <path d="M-20 208 Q40 196 92 208 T213 208 T345 209 V240H-20Z" fill="#354e31"/>
      {Array.from({length:8},(_,i)=><g key={i} transform={"translate("+(i*46+6)+" "+(195+(i%3)*5)+")"}>
        <path d="M0 20 v-23" stroke="#72a369" strokeWidth="3"/>
        <path d="M0 9 l-7-8 M0 3 l6-8" stroke="#72a369" strokeWidth="2"/>
      </g>)}
      <g className="fresh-scene__pollen" fill="#f2d994">
        <rect x="57" y="186" width="3" height="3"/><rect x="134" y="170" width="2" height="2"/>
        <rect x="299" y="192" width="2" height="2"/>
      </g>
    </Layer>
  </>;
}

function Bakery({ roomIndex }: { roomIndex: number }) {
  return <>
    <Layer name="bakery-rear-wall" depth={0.2}>
      <rect x="0" y="117" width="320" height="120" fill="#63424a"/>
      {Array.from({length:8},(_,i)=><g key={i} stroke="#92716a" strokeWidth="2" opacity=".45">
        <path d={"M0 "+(33+i*24)+"h320"}/>
        <path d={"M"+((i%2)*27+42)+" "+(31+i*24)+"v24 M"+((i%2)*27+186)+" "+(31+i*24)+"v24"}/>
      </g>)}
      <rect x="14" y="72" width="103" height="8" fill="#b08a70"/>
      <rect x="21" y="55" width="28" height="17" fill="#d1a987"/>
      <rect x="58" y="44" width="25" height="28" fill="#d3b392"/>
      <rect x="90" y="61" width="18" height="11" fill="#e6c6a1"/>
    </Layer>
    <Layer name="bakery-oven" depth={0.46}>
      <rect x="0" y="175" width="320" height="62" fill="#5e393d"/>
      <rect x="182" y="53" width="101" height="126" fill="#ad8570" stroke="#d6ad85" strokeWidth="5"/>
      {Array.from({length:4},(_,i)=><g key={i} stroke="#795e62" strokeWidth="3">
        <path d={"M186 "+(69+i*24)+"h94"}/>
        <path d={"M"+(194+(i%2)*23)+" "+(69+i*24)+"v24 M"+(240+(i%2)*23)+" "+(69+i*24)+"v24"}/>
      </g>)}
      <path d="M209 180 V127 Q209 90 235 90 Q265 90 265 127 V180Z" fill="#392d3e" stroke="#e7bd83" strokeWidth="6"/>
      {roomIndex === 0 && <g className="fresh-scene__oven-glow">
        <path d="M224 173Q215 151 228 137Q228 151 235 124Q251 146 250 174Z" fill="#e69a4d"/>
        <path d="M230 173Q227 153 235 143Q244 158 241 173Z" fill="#ffe2a1"/>
      </g>}
      {roomIndex === 1 && <path d="M219 167Q236 150 249 166V179H219Z" fill="#cfa46d"/>}
    </Layer>
    <Layer name="bakery-characters" depth={0.72}>
      {roomIndex === 0 && <g transform="translate(264 142)" className="fresh-scene__dragon">
        <path d="M-18 20L-37-6L-27-27L-8-5L2-23L23-1L14 30Z" fill="#e8a052" stroke="#b96a52" strokeWidth="3"/>
        <path d="M-25-19L-15-32L-1-19" fill="#fff0c5"/>
        <rect x="-7" y="-2" width="5" height="5" fill="#3c3046"/>
        <rect x="9" y="-2" width="5" height="5" fill="#3c3046"/>
      </g>}
      {roomIndex === 1 && <g className="fresh-scene__dough">
        <ellipse cx="228" cy="160" rx="39" ry="22" fill="#e5c287"/>
        <rect x="211" y="148" width="5" height="5" fill="#665367"/>
        <rect x="240" y="148" width="5" height="5" fill="#665367"/>
        <path d="M219 160q9 7 18 0" stroke="#916658" strokeWidth="3" fill="none"/>
      </g>}
      {roomIndex === 2 && <g className="fresh-scene__giant">
        <circle cx="245" cy="78" r="35" fill="#c0a19c" stroke="#e0c1a2" strokeWidth="4"/>
        <rect x="208" y="113" width="76" height="67" fill="#78646c"/>
        <circle cx="231" cy="75" r="4" fill="#312c42"/>
        <circle cx="256" cy="75" r="4" fill="#312c42"/>
        <path d="M236 93q10 5 18 0" stroke="#584252" strokeWidth="4" fill="none"/>
      </g>}
    </Layer>
    <Layer name="bakery-flour-front" depth={0.95}>
      <path d="M-20 209Q65 193 151 210T350 204V240H-20Z" fill="#4b303c" opacity=".6"/>
      {Array.from({ length: 9 },(_,i)=><rect key={i} className="fresh-scene__flour"
        style={{ animationDelay: ((i%5)*-.7)+"s" }}
        x={(i*45+35)%320} y={(i*23+96)%188} width={i%3===0?3:2} height={2} fill="#f0dabb" opacity=".48"/>)}
      {roomIndex === 0 && <g className="fresh-scene__heat" fill="none" stroke="#edb16c" strokeWidth="2" opacity=".35">
        <path d="M218 135Q207 124 219 113 M239 132Q250 121 238 112 M253 136Q243 121 255 109"/>
      </g>}
    </Layer>
  </>;
}

export default function FreshPixelScene({ dungeonSlug, roomIndex = 0, className }: Props) {
  const ref = useScrollParallax();
  const lighthouse = dungeonSlug === "lighthouse-lost-dawn";
  const orchard = dungeonSlug === "clockwork-orchard";
  const bakery = dungeonSlug === "dragon-bakery";
  const sky = lighthouse ? "#162f50" : orchard ? "#273747" : "#3f2b46";
  return <svg ref={ref} className={"fresh-scene " + (className ?? "")} viewBox="0 0 320 220"
    preserveAspectRatio="xMidYMid meet" role="img"
    aria-label={lighthouse ? "Parallax pixel art: moonlit lighthouse" :
      orchard ? "Parallax pixel art: clockwork orchard" : "Parallax pixel art: dragon bakery"}
    xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
    <rect x="-20" y="-20" width="360" height="260" fill={sky}/>
    <Layer name="far-stars" depth={0.08}>
      {Array.from({length:15},(_,i)=><rect key={i} className="fresh-scene__star"
        style={{ animationDelay: ((i%6)*-.47)+"s" }}
        x={(i*43+17)%315} y={(i*29+15)%104} width={i%3===0?3:2} height="2"
        fill="#f4d59b" opacity=".62"/>)}
    </Layer>
    {lighthouse && <Lighthouse roomIndex={roomIndex}/>}
    {orchard && <Orchard roomIndex={roomIndex}/>}
    {bakery && <Bakery roomIndex={roomIndex}/>}
    <Layer name="hero" depth={0.82}><Hero/></Layer>
  </svg>;
}
