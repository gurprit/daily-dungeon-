import type { ReactNode } from "react";
import { generatedSceneTheme, generatedArtSeed, type GeneratedSceneTheme } from "./generated-art-direction";

type Props = {
  dungeonSlug: string;
  roomIndex: number;
  storyTitle?: string;
  roomTitle?: string;
  sceneText?: string;
  className?: string;
  parallaxDepth?: number;
};
type Palette = { sky:string; deep:string; mid:string; bright:string; gold:string; ground:string };
const palettes: Record<GeneratedSceneTheme,Palette> = {
  market: {sky:"#223f62",deep:"#243650",mid:"#596c86",bright:"#a8e3cf",gold:"#ffca78",ground:"#6b536c"},
  magic: {sky:"#241b4f",deep:"#17143a",mid:"#7b579a",bright:"#b49df0",gold:"#f2be75",ground:"#4c4169"},
  weather: {sky:"#254a78",deep:"#1d3358",mid:"#6c9cc7",bright:"#d9eff5",gold:"#ffda87",ground:"#526d8b"},
  clockwork: {sky:"#302641",deep:"#201d37",mid:"#746478",bright:"#c1b4a8",gold:"#eec77a",ground:"#575161"},
  forest: {sky:"#183e44",deep:"#123438",mid:"#3c7770",bright:"#94caae",gold:"#f4d291",ground:"#456458"},
  sea: {sky:"#1c4576",deep:"#17365f",mid:"#4d93b2",bright:"#a1e4df",gold:"#edc580",ground:"#316e89"},
  library: {sky:"#302341",deep:"#21192f",mid:"#745372",bright:"#c69fa5",gold:"#f2cc87",ground:"#5a405c"},
  kitchen: {sky:"#433047",deep:"#291f36",mid:"#987275",bright:"#e2bd9e",gold:"#f5c579",ground:"#735262"},
  ghost: {sky:"#232c50",deep:"#161c37",mid:"#66648a",bright:"#d5d9e9",gold:"#b5d4cc",ground:"#4b4668"},
  crystal: {sky:"#2c3159",deep:"#1b2243",mid:"#726c96",bright:"#b3bddb",gold:"#e6c789",ground:"#5a537a"}
};

function Hero() {
  return <g transform="translate(249 136)">
    <rect x="7" y="33" width="37" height="5" fill="#161528"/>
    <rect x="13" y="24" width="10" height="12" fill="#292144"/>
    <rect x="30" y="24" width="9" height="12" fill="#292144"/>
    <rect x="7" y="11" width="37" height="24" fill="#6b53a5"/>
    <rect x="14" y="16" width="26" height="19" fill="#43336e"/>
    <rect x="15" y="3" width="24" height="20" fill="#e3af86"/>
    <rect x="10" y="5" width="36" height="10" fill="#7461bb"/>
    <rect x="18" y="-5" width="23" height="13" fill="#6650a6"/>
    <rect x="23" y="-13" width="12" height="11" fill="#806ac5"/>
    <rect x="20" y="14" width="5" height="4" fill="#2b2946"/>
    <rect x="33" y="14" width="5" height="4" fill="#2b2946"/>
    <rect x="39" y="19" width="7" height="17" fill="#f0c879"/>
  </g>;
}

function ThemeObjects({ theme, p, variant, roomIndex }: {
  theme:GeneratedSceneTheme; p:Palette; variant:number; roomIndex:number
}) {
  const offset = (variant%3)*9 - 9;
  const towers = Array.from({length:5},(_,i)=><g key={i}>
    <rect x={i*72+3} y={90+(i%3)*12} width="46" height={80-(i%3)*12} fill={p.deep}/>
    <rect x={i*72+19} y={110+(i%3)*10} width="8" height="16" fill={p.gold} opacity=".75"/>
  </g>);
  const market = <g>
    {[-2,96,197].map((x,i)=><g key={x} transform={"translate("+(x+offset)+" "+(103+(i%2)*9)+")"}>
      <rect x="6" y="28" width="88" height="51" fill={i===0?"#6d516d":i===1?"#567d77":"#896979"}/>
      <path d="M0 25 L15 0 H80 L100 25Z" fill={i===0?"#e2ac8b":i===1?"#a4d1b1":"#d0a4b8"}/>
      <path d="M16 2 L25 25 H39 L30 2 M54 2 L63 25 H77 L67 2" fill="#f7dbb0"/>
      <rect x="2" y="64" width="96" height="10" fill="#d3a77a"/>
      <rect x="12" y="58" width="15" height="9" fill="#fac977"/>
      <rect x="34" y="53" width="19" height="14" fill="#add1a8"/>
    </g>)}
    <g transform="translate(134 63)"><rect x="9" y="7" width="54" height="33" fill="#8eb8a5"/><rect x="21" y="0" width="30" height="12" fill="#e4cf95"/><rect x="15" y="16" width="8" height="8" fill="#284758"/><rect x="45" y="16" width="8" height="8" fill="#284758"/><rect x="30" y="27" width="17" height="5" fill="#476268"/><rect x="22" y="43" width="8" height="7" fill="#accdc2"/></g>
    <g transform="translate(148 39)"><path d="M0 10 L27 -8 L54 10 L27 27Z" fill="#b6d5df"/><rect x="23" y="8" width="8" height="9" fill="#e5ca90"/></g>
  </g>;
  const magic = <g>
    <rect x="39" y="54" width="92" height="112" fill="#504272"/>
    {Array.from({length:4},(_,i)=><g key={i}><rect x="49" y={64+i*25} width="73" height="5" fill="#aa84a4"/>{Array.from({length:4},(_,j)=><rect key={j} x={54+j*17} y={48+i*25} width="11" height="15" fill={(i+j)%2?"#93dbc8":"#e8a8d0"}/>)}</g>)}
    <ellipse cx="170" cy="168" rx="59" ry="13" fill="#282140"/>
    <path d="M122 121 H218 L207 166 H136Z" fill="#775b92" stroke="#d0a9a9" strokeWidth="5"/>
    <ellipse cx="170" cy="124" rx="47" ry="13" fill="#b7e1cb"/>
    <ellipse cx="170" cy="120" rx="32" ry="8" fill="#78b9ce"/>
    {Array.from({length:4},(_,i)=><rect key={i} x={140+i*18} y={69-((i+variant)%3)*17} width="6" height="16" fill={i%2?"#f1c286":"#a8e2db"}/>)}
    <path d="M140 185 L150 163 H191 L200 185" stroke="#f4bb78" strokeWidth="6" fill="none"/>
  </g>;
  const weather = <g>
    <path d="M4 153 Q48 107 103 145 Q160 93 205 142 Q256 105 322 156 V210 H0Z" fill="#5273a0"/>
    <path d="M0 174 Q57 140 106 158 Q154 113 201 156 Q260 131 320 173 V220 H0Z" fill="#89a7c6"/>
    <g transform={"translate("+(54+offset)+" 49)"}><rect x="-8" y="18" width="116" height="24" fill="#e8f4f3"/><rect x="9" y="5" width="77" height="31" fill="#e8f4f3"/><rect x="25" y="-3" width="47" height="33" fill="#e8f4f3"/></g>
    <circle cx={202+offset} cy={57+roomIndex*7} r="25" fill="#ffdb85"/>
    {Array.from({length:8},(_,i)=><rect key={i} x={192+Math.cos(i*Math.PI/4)*37+offset} y={48+Math.sin(i*Math.PI/4)*37} width="9" height="7" fill="#f6cd7d"/>)}
    <path d="M91 165 L123 125 L166 165Z" fill="#a3d0d5"/>
    <g transform="translate(145 121)"><path d="M0 55 L11 16 L29 32 L40 12 L58 56Z" fill="#9de0ce"/><rect x="18" y="6" width="20" height="27" fill="#ebc7a9"/><rect x="17" y="3" width="22" height="7" fill="#f2d67e"/><rect x="23" y="18" width="4" height="4" fill="#314a67"/><rect x="32" y="18" width="4" height="4" fill="#314a67"/></g>
  </g>;
  const clockwork = <g>
    {[[102,99,51],[206,120,40]].map(([x,y,r],i)=><g key={i}>
      <circle cx={x} cy={y} r={r} fill="#ad886c" stroke="#e4c389" strokeWidth="10" strokeDasharray="16 6"/>
      <circle cx={x} cy={y} r={r-13} fill="#51465d" stroke="#d8b38b" strokeWidth="4"/>
      <circle cx={x} cy={y} r="8" fill="#ead6ac"/>
      <path d={"M"+x+" "+y+" v-"+(r-20)+" m0 "+(r-20)+" l"+(r-17)+" 6"} stroke="#f3d7a8" strokeWidth="6" fill="none"/>
    </g>)}
    <rect x="126" y="32" width="46" height="18" fill="#b7958b"/>
    <rect x="138" y="17" width="24" height="18" fill="#d1b9a3"/>
    <rect x="144" y="8" width="12" height="11" fill="#eee0b5"/>
  </g>;
  const forest=<g>
    {Array.from({length:6},(_,i)=><g key={i} transform={"translate("+(i*60+offset-7)+" 0)"}>
      <rect x="20" y={68+(i%3)*15} width="18" height="113" fill="#654c58"/>
      <rect x="-8" y={62+(i%3)*15} width="77" height="35" fill={i%2?"#387a73":"#55957d"}/>
      <rect x="4" y={42+(i%3)*15} width="51" height="32" fill="#629d87"/>
      <rect x="20" y={33+(i%3)*15} width="25" height="25" fill="#78ad8e"/>
    </g>)}
    <g transform="translate(111 136)"><rect x="18" y="10" width="13" height="33" fill="#f3e0b9"/><path d="M0 17 L24 -13 L51 17Z" fill="#cf7398"/><rect x="16" y="3" width="7" height="4" fill="#ffdc8f"/><rect x="32" y="6" width="7" height="4" fill="#ffdc8f"/></g>
  </g>;
  const sea = <g>
    {Array.from({length:6},(_,i)=><path key={i} d={"M0 "+(117+i*17)+" Q80 "+(102+i*17)+" 160 "+(117+i*17)+" T320 "+(117+i*17)+" V220 H0Z"} fill={i%2?"#397d9c":"#4c9bb1"} opacity={i%2?".78":".94"}/>)}
    <path d="M53 139 L97 70 L150 139Z" fill="#d9ceb9"/>
    <rect x="93" y="67" width="7" height="108" fill="#6e5665"/>
    <path d="M29 157 L180 157 L156 179 L49 179Z" fill="#876981"/>
    {Array.from({length:5},(_,i)=><g key={i}><rect x={206+i*13} y={146-(i%2)*19} width="9" height="28" fill="#75b9aa"/><rect x={204+i*13} y={142-(i%2)*19} width="13" height="10" fill="#c78ca8"/></g>)}
  </g>;
  const library = <g>
    {Array.from({length:4},(_,i)=><g key={i} transform={"translate("+(12+i*81)+" 0)"}>
      <rect x="3" y="61" width="73" height="105" fill="#4e3b5b"/>
      {Array.from({length:3},(_,j)=><g key={j}><rect x="8" y={82+j*27} width="63" height="5" fill="#c9a378"/>
        {Array.from({length:5},(_,k)=><rect key={k} x={12+k*11} y={64+j*27} width="9" height="18" fill={(i+j+k)%2?"#ce8b92":"#93b2c3"}/>)}</g>)}
    </g>)}
    <g transform="translate(124 89)"><rect x="0" y="28" width="72" height="62" fill="#d2b88e"/><rect x="13" y="20" width="48" height="56" fill="#e8ce9c"/><rect x="25" y="39" width="5" height="6" fill="#453951"/><rect x="44" y="39" width="5" height="6" fill="#453951"/><rect x="33" y="57" width="14" height="4" fill="#905c68"/></g>
  </g>;
  const kitchen = <g>
    <rect x="23" y="59" width="273" height="111" fill="#5e445a"/>
    <rect x="42" y="83" width="92" height="64" fill="#32253e"/>
    <rect x="49" y="91" width="78" height="53" fill="#bf745a"/>
    <rect x="63" y="100" width="48" height="38" fill="#f3ac64"/>
    <rect x="76" y="110" width="24" height="27" fill="#ffd58d"/>
    <rect x="176" y="73" width="92" height="64" fill="#82718e"/>
    {Array.from({length:4},(_,i)=><g key={i}><rect x={189+i*19} y="87" width="14" height="36" fill="#ddbaa4"/><rect x={193+i*19} y="78" width="7" height="12" fill="#f4e1bb"/></g>)}
    <rect x="35" y="148" width="262" height="16" fill="#dfb48d"/>
    {Array.from({length:4},(_,i)=><g key={i}><ellipse cx={76+i*51} cy={146+(i%2)*3} rx="20" ry="8" fill="#ecc477"/><rect x={62+i*51} y={139+(i%2)*3} width="28" height="8" fill="#bf7b65"/></g>)}
  </g>;
  const ghost = <g>
    {towers}
    {Array.from({length:5},(_,i)=><rect key={i} x={29+i*61} y={139-(i%2)*16} width="33" height={44+(i%2)*16} fill="#69708a"/>)}
    <g transform="translate(133 84)" opacity=".88">
      <path d="M6 77 L0 33 Q2 0 33 -3 Q67 0 67 33 L61 79 L48 67 L37 82 L26 67 L14 83Z" fill="#c4dce3"/>
      <rect x="17" y="28" width="10" height="13" fill="#52647a"/><rect x="42" y="28" width="10" height="13" fill="#52647a"/>
      <rect x="29" y="53" width="12" height="6" fill="#7c8097"/>
    </g>
  </g>;
  const crystal = <g>
    {towers}
    {Array.from({length:6},(_,i)=><path key={i} d={"M"+(33+i*51+offset)+" 165 l"+(7+i%2*9)+" -"+(58+(i*11)%61)+" l22 "+(34+i%3*11)+" l-7 "+(62+(i*11)%61)+"Z"} fill={i%2?p.bright:p.mid} stroke={p.gold} strokeWidth="2"/>)}
  </g>;
  const art: Record<GeneratedSceneTheme,ReactNode> = {market,magic,weather,clockwork,forest,sea,library,kitchen,ghost,crystal};
  return <>{art[theme]}</>;
}

/**
 * A distinctive, title/room-sensitive scene that renders instantly if Workers
 * AI is slow, unavailable, exhausted, or disabled. No fake goblin bridge art.
 */
export default function GeneratedPixelScene({
  dungeonSlug,roomIndex,storyTitle="",roomTitle="",sceneText="",className,parallaxDepth
}:Props){
  const seed=generatedArtSeed(dungeonSlug,roomIndex);
  const theme=generatedSceneTheme(storyTitle,roomTitle,sceneText);
  const p=palettes[theme];
  return <svg className={className} data-parallax-depth={parallaxDepth}
    data-parallax-scale={parallaxDepth?1.13:undefined}
    viewBox="0 0 320 220" preserveAspectRatio="xMidYMid meet"
    shapeRendering="crispEdges" role="img"
    aria-label={theme+" themed pixel art for "+(roomTitle||storyTitle||"today's adventure")}
    xmlns="http://www.w3.org/2000/svg">
    <rect width="320" height="220" fill={p.sky}/>
    <g fill={p.bright}>
      {Array.from({length:26},(_,i)=><rect key={i}
        x={(seed%97+i*83)%318} y={(Math.floor(seed/29)+i*41)%115}
        width={i%5===0?3:2} height={i%5===0?3:2} opacity={i%3===0?".8":".35"}/>)}
    </g>
    <path d="M0 101 l41 -18 25 15 37 -24 37 22 46 -27 37 29 42 -18 55 19 V220H0Z" fill={p.deep} opacity=".76"/>
    <ThemeObjects theme={theme} p={p} variant={seed%9} roomIndex={roomIndex}/>
    <rect x="0" y="182" width="320" height="38" fill={p.ground}/>
    <rect x="0" y="180" width="320" height="5" fill={p.gold} opacity=".63"/>
    {Array.from({length:9},(_,i)=><rect key={i} x={i*42-12} y={190+(i%2)*12} width="33" height="2" fill={p.deep} opacity=".6"/>)}
    <Hero/>
    <rect x="0" y="0" width="320" height="3" fill={p.gold} opacity=".32"/>
  </svg>;
}
