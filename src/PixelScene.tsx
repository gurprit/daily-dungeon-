import type { ReactNode } from "react";
import FreshPixelScene from "./FreshPixelScene";

/**
 * Always-on, hand-authored 16-bit scenes: zero inference charges, no remote image
 * dependency. Action illustrations are assembled from these SVG components.
 */
type PixelSceneProps = {
  dungeonSlug: string;
  roomIndex?: number;
  className?: string;
};
type Palette = {
  sky: string;
  deep: string;
  stone: string;
  mid: string;
  light: string;
  accent: string;
  accent2: string;
};

const palettes: Record<string, Palette> = {
  "goblins-toll": {
    sky: "#131a35", deep: "#0c1023", stone: "#353b52",
    mid: "#53576a", light: "#817a88", accent: "#f8bd68", accent2: "#83b883"
  },
  "wizard-complaint": {
    sky: "#201437", deep: "#130d25", stone: "#413b60",
    mid: "#5d4f79", light: "#9885a8", accent: "#b8a4ff", accent2: "#71d8d6"
  },
  "royal-pantry": {
    sky: "#251c2b", deep: "#15111c", stone: "#4b3a3d",
    mid: "#775451", light: "#bc8b6a", accent: "#f2c476", accent2: "#b1cc76"
  },
  "midnight-museum": {
    sky: "#181530", deep: "#101024", stone: "#39354f",
    mid: "#645774", light: "#c1a1a4", accent: "#f4c780", accent2: "#8cdbcb"
  },
  "bell-of-hollowmere": {
    sky: "#151b33", deep: "#0b1023", stone: "#37344f",
    mid: "#66516c", light: "#b69ba4", accent: "#f3bd6c", accent2: "#93b8b3"
  },
  "skywhale-express": {
    sky: "#153252", deep: "#132741", stone: "#354c73",
    mid: "#567fa3", light: "#b3bed8", accent: "#f2dca0", accent2: "#8bdce7"
  }
};

const stars = [
  [25, 21], [47, 38], [82, 14], [123, 27], [164, 17], [216, 32],
  [245, 14], [287, 24], [307, 48], [15, 69], [93, 50], [192, 56]
];

function PixelStars({ accent }: { accent: string }) {
  return <g fill={accent}>
    {stars.map(([x, y], i) => (
      <rect key={i} x={x} y={y} width={i % 3 === 0 ? 3 : 2} height={i % 3 === 0 ? 3 : 2}
        opacity={i % 3 === 0 ? 0.9 : 0.45}/>
    ))}
  </g>;
}

function StoneFloor({ p, from = 170 }: { p: Palette; from?: number }) {
  return <g>
    <rect x="0" y={from} width="320" height={220 - from} fill={p.stone}/>
    <rect x="0" y={from} width="320" height="5" fill={p.light}/>
    {Array.from({ length: 4 }, (_, row) => (
      <g key={row}>
        {Array.from({ length: 9 }, (_, col) => (
          <g key={col}>
            <rect x={col * 42 - (row % 2) * 21} y={from + 9 + row * 12} width="39" height="1.5" fill={p.deep} opacity=".55"/>
            <rect x={col * 42 - (row % 2) * 21} y={from + 9 + row * 12} width="1.5" height="12" fill={p.deep} opacity=".7"/>
          </g>
        ))}
      </g>
    ))}
  </g>;
}

function Torch({ x, y, p }: { x: number; y: number; p: Palette }) {
  return <g transform={"translate(" + x + " " + y + ")"}>
    <rect x="8" y="11" width="5" height="36" fill="#473139"/>
    <rect x="3" y="12" width="15" height="4" fill="#9b7670"/>
    <rect x="6" y="3" width="9" height="13" fill="#fa853f"/>
    <rect x="9" y="-7" width="4" height="14" fill={p.accent}/>
    <rect x="9" y="6" width="6" height="8" fill="#ffe4a4"/>
    <rect x="4" y="19" width="3" height="3" fill="#f5ab58" opacity=".65"/>
  </g>;
}

function Hero({ x = 229, y = 127 }: { x?: number; y?: number }) {
  return <g transform={"translate(" + x + " " + y + ")"}>
    <rect x="6" y="37" width="29" height="4" fill="#080b1a" opacity=".8"/>
    <rect x="13" y="27" width="7" height="12" fill="#26203b"/>
    <rect x="25" y="27" width="7" height="12" fill="#26203b"/>
    <rect x="8" y="11" width="28" height="24" fill="#3e3a86"/>
    <rect x="10" y="11" width="8" height="22" fill="#7775d2"/>
    <rect x="30" y="13" width="5" height="19" fill="#26264f"/>
    <rect x="5" y="15" width="6" height="20" fill="#af8bbc"/>
    <rect x="18" y="19" width="7" height="17" fill="#c6a1de"/>
    <rect x="11" y="5" width="22" height="15" fill="#5a4e86"/>
    <rect x="15" y="7" width="14" height="11" fill="#e9ba8b"/>
    <rect x="13" y="12" width="19" height="4" fill="#281d38"/>
    <rect x="16" y="12" width="3" height="3" fill="#f3e8c2"/>
    <rect x="25" y="12" width="3" height="3" fill="#f3e8c2"/>
    <rect x="9" y="2" width="27" height="7" fill="#6e5697"/>
    <rect x="14" y="-4" width="17" height="7" fill="#7e67b1"/>
    <rect x="20" y="-9" width="6" height="6" fill="#d7af70"/>
    <rect x="32" y="20" width="5" height="19" fill="#a88c62"/>
    <rect x="37" y="10" width="4" height="24" fill="#edf0f7"/>
    <rect x="35" y="18" width="8" height="3" fill="#e4b75b"/>
  </g>;
}

function Goblin({ x = 104, y = 117 }: { x?: number; y?: number }) {
  return <g transform={"translate(" + x + " " + y + ")"}>
    <rect x="4" y="46" width="39" height="4" fill="#080d19" opacity=".75"/>
    <rect x="14" y="34" width="8" height="13" fill="#4f403e"/>
    <rect x="29" y="34" width="8" height="13" fill="#4f403e"/>
    <rect x="9" y="19" width="34" height="21" fill="#69603b"/>
    <rect x="14" y="22" width="20" height="17" fill="#b19354"/>
    <rect x="13" y="9" width="26" height="20" fill="#7db46a"/>
    <rect x="7" y="13" width="9" height="8" fill="#6d9e60"/>
    <rect x="39" y="13" width="9" height="8" fill="#6d9e60"/>
    <rect x="8" y="5" width="32" height="8" fill="#8d544c"/>
    <rect x="14" y="-3" width="22" height="9" fill="#a36752"/>
    <rect x="22" y="-13" width="9" height="12" fill="#b9835e"/>
    <rect x="18" y="16" width="5" height="5" fill="#faf1ba"/>
    <rect x="30" y="16" width="5" height="5" fill="#faf1ba"/>
    <rect x="19" y="17" width="2" height="3" fill="#141c24"/>
    <rect x="31" y="17" width="2" height="3" fill="#141c24"/>
    <rect x="23" y="25" width="11" height="3" fill="#344433"/>
    <rect x="-1" y="24" width="12" height="5" fill="#73a664"/>
    <rect x="40" y="24" width="11" height="5" fill="#73a664"/>
    <rect x="-4" y="28" width="18" height="17" fill="#aa9272"/>
    <rect x="-1" y="31" width="12" height="2" fill="#dec29a"/>
    <rect x="2" y="36" width="7" height="3" fill="#615355"/>
  </g>;
}

function GiantBook({ x = 95, y = 93 }: { x?: number; y?: number }) {
  return <g transform={"translate(" + x + " " + y + ")"}>
    <rect x="5" y="20" width="68" height="62" fill="#301f41"/>
    <rect x="9" y="14" width="60" height="66" fill="#825475"/>
    <rect x="15" y="18" width="49" height="56" fill="#ac7f83"/>
    <rect x="20" y="23" width="38" height="47" fill="#d7aa9d"/>
    <rect x="28" y="35" width="8" height="7" fill="#f0e2ba"/>
    <rect x="47" y="35" width="8" height="7" fill="#f0e2ba"/>
    <rect x="31" y="37" width="4" height="4" fill="#282034"/>
    <rect x="50" y="37" width="4" height="4" fill="#282034"/>
    <rect x="34" y="55" width="21" height="4" fill="#602d47"/>
    <rect x="0" y="14" width="5" height="66" fill="#efca9a"/>
    <rect x="74" y="14" width="5" height="66" fill="#efca9a"/>
    <rect x="9" y="7" width="60" height="6" fill="#d8bbab"/>
    <rect x="10" y="80" width="60" height="5" fill="#f3d4a9"/>
  </g>;
}

function Dragon({ x = 74, y = 93 }: { x?: number; y?: number }) {
  return <g transform={"translate(" + x + " " + y + ")"}>
    <rect x="1" y="65" width="128" height="11" fill="#0e1120" opacity=".6"/>
    <rect x="35" y="35" width="85" height="34" fill="#587f71"/>
    <rect x="15" y="25" width="62" height="39" fill="#82ac86"/>
    <rect x="24" y="15" width="53" height="18" fill="#84bc95"/>
    <rect x="8" y="37" width="33" height="16" fill="#65917c"/>
    <rect x="0" y="50" width="37" height="14" fill="#557b6b"/>
    <rect x="21" y="28" width="7" height="7" fill="#fbd4a2"/>
    <rect x="23" y="29" width="3" height="4" fill="#292c39"/>
    <rect x="12" y="51" width="9" height="4" fill="#bbd1a1"/>
    <rect x="37" y="13" width="13" height="8" fill="#dcc6a0"/>
    <rect x="53" y="8" width="11" height="10" fill="#dcc6a0"/>
    <rect x="70" y="31" width="9" height="14" fill="#9ab7a3"/>
    <rect x="83" y="36" width="9" height="14" fill="#9ab7a3"/>
    <rect x="96" y="45" width="9" height="12" fill="#9ab7a3"/>
    <rect x="112" y="48" width="23" height="10" fill="#62907b"/>
    <rect x="133" y="41" width="16" height="9" fill="#669984"/>
    <rect x="140" y="33" width="10" height="10" fill="#83b69a"/>
    <rect x="49" y="65" width="16" height="8" fill="#344e53"/>
    <rect x="94" y="63" width="17" height="9" fill="#344e53"/>
    <rect x="19" y="43" width="5" height="4" fill="#d8e6c2"/>
  </g>;
}

function Wizard({ x = 102, y = 109 }: { x?: number; y?: number }) {
  return <g transform={"translate(" + x + " " + y + ")"}>
    <rect x="3" y="39" width="43" height="5" fill="#080b21" opacity=".65"/>
    <rect x="5" y="19" width="35" height="22" fill="#6b50a6"/>
    <rect x="14" y="6" width="21" height="16" fill="#f4c7a0"/>
    <rect x="10" y="5" width="29" height="6" fill="#a983e0"/>
    <rect x="17" y="-13" width="14" height="20" fill="#8861cd"/>
    <rect x="26" y="-22" width="8" height="13" fill="#a17ad4"/>
    <rect x="9" y="13" width="6" height="6" fill="#fff4d5"/>
    <rect x="24" y="13" width="6" height="6" fill="#fff4d5"/>
    <rect x="11" y="21" width="26" height="6" fill="#b4d4cd"/>
    <rect x="45" y="3" width="4" height="39" fill="#d6a66e"/>
    <rect x="40" y="-5" width="13" height="13" fill="#8cf0e6"/>
    <rect x="43" y="-9" width="7" height="6" fill="#dcfff0"/>
  </g>;
}

function Onion({ x = 104, y = 118 }: { x?: number; y?: number }) {
  return <g transform={"translate(" + x + " " + y + ")"}>
    <rect x="11" y="34" width="7" height="10" fill="#656b44"/>
    <rect x="31" y="34" width="7" height="10" fill="#656b44"/>
    <rect x="9" y="12" width="35" height="25" fill="#c39f83"/>
    <rect x="14" y="6" width="25" height="11" fill="#e4bf9b"/>
    <rect x="18" y="-2" width="18" height="12" fill="#f1d0a5"/>
    <rect x="23" y="-13" width="5" height="14" fill="#86b770"/>
    <rect x="30" y="-8" width="5" height="10" fill="#9dc580"/>
    <rect x="15" y="17" width="7" height="5" fill="#f8efc9"/>
    <rect x="31" y="17" width="7" height="5" fill="#f8efc9"/>
    <rect x="18" y="19" width="3" height="3" fill="#2e313d"/>
    <rect x="34" y="19" width="3" height="3" fill="#2e313d"/>
    <rect x="23" y="29" width="11" height="3" fill="#966565"/>
    <rect x="3" y="18" width="8" height="5" fill="#e1bf92"/>
    <rect x="42" y="18" width="8" height="5" fill="#e1bf92"/>
    <rect x="-2" y="23" width="54" height="5" fill="#9b5550"/>
  </g>;
}

function Cheese({ x = 107, y = 130 }: { x?: number; y?: number }) {
  return <g transform={"translate(" + x + " " + y + ")"}>
    <rect x="2" y="30" width="80" height="7" fill="#241b24"/>
    <rect x="8" y="9" width="70" height="25" fill="#d29d4a"/>
    <rect x="8" y="2" width="70" height="15" fill="#f7d478"/>
    <rect x="20" y="10" width="11" height="11" fill="#b8873e"/>
    <rect x="50" y="19" width="8" height="9" fill="#b8873e"/>
    <rect x="30" y="7" width="7" height="6" fill="#bd914a"/>
    <rect x="43" y="14" width="5" height="6" fill="#281e2b"/>
    <rect x="61" y="14" width="5" height="6" fill="#281e2b"/>
    <rect x="44" y="24" width="23" height="3" fill="#9d5c46"/>
    <rect x="33" y="-8" width="22" height="8" fill="#ffd78b"/>
    <rect x="42" y="-16" width="6" height="10" fill="#fff2c2"/>
  </g>;
}

function King({ x = 101, y = 108 }: { x?: number; y?: number }) {
  return <g transform={"translate(" + x + " " + y + ")"}>
    <rect x="3" y="15" width="65" height="49" fill="#5f3256"/>
    <rect x="12" y="15" width="46" height="50" fill="#b44e68"/>
    <rect x="19" y="-1" width="30" height="27" fill="#efbd95"/>
    <rect x="14" y="-12" width="44" height="14" fill="#ebbc5b"/>
    <rect x="19" y="-20" width="8" height="12" fill="#ecca77"/>
    <rect x="32" y="-23" width="8" height="15" fill="#f1d78b"/>
    <rect x="47" y="-20" width="8" height="12" fill="#ecca77"/>
    <rect x="20" y="-9" width="6" height="4" fill="#91a8c9"/>
    <rect x="34" y="-9" width="6" height="4" fill="#91a8c9"/>
    <rect x="48" y="-9" width="6" height="4" fill="#91a8c9"/>
    <rect x="24" y="12" width="6" height="6" fill="#331c2d"/>
    <rect x="42" y="12" width="6" height="6" fill="#331c2d"/>
    <rect x="30" y="24" width="19" height="8" fill="#f2deb7"/>
    <rect x="29" y="24" width="23" height="4" fill="#86534e"/>
    <rect x="22" y="40" width="25" height="18" fill="#f4cd84"/>
  </g>;
}

function GoblinBridge({ p }: { p: Palette }) {
  return <g>
    <rect x="0" y="55" width="320" height="165" fill="#192340"/>
    <path d="M0 136h20v-10h18v-11h20v14h13v-7h27v-23h15v19h22v16h16v-19h28v-17h15v20h23v-16h18v29h19v-15h26v33h22v-22h18v55H0Z" fill={p.deep}/>
    <rect x="0" y="158" width="320" height="62" fill="#0c1022"/>
    <rect x="16" y="163" width="285" height="11" fill="#625d69"/>
    <rect x="16" y="174" width="285" height="13" fill="#43475c"/>
    {Array.from({ length: 12 }, (_, i) => (
      <rect key={i} x={20 + i * 24} y="178" width="2" height="8" fill="#262d43"/>
    ))}
    <rect x="18" y="145" width="7" height="37" fill={p.mid}/>
    <rect x="292" y="145" width="7" height="37" fill={p.mid}/>
    <rect x="18" y="143" width="12" height="6" fill="#aaa0a0"/>
    <rect x="287" y="143" width="12" height="6" fill="#aaa0a0"/>
    <rect x="38" y="158" width="5" height="24" fill="#77717c"/>
    <rect x="275" y="158" width="5" height="24" fill="#77717c"/>
    <rect x="42" y="151" width="232" height="4" fill="#98909b"/>
    <rect x="42" y="155" width="232" height="3" fill="#424253"/>
    <rect x="134" y="55" width="55" height="90" fill={p.deep}/>
    <rect x="145" y="45" width="32" height="100" fill="#35364b"/>
    <rect x="140" y="42" width="43" height="9" fill="#4e4b5d"/>
    <rect x="154" y="17" width="15" height="29" fill="#44435a"/>
    <rect x="150" y="14" width="23" height="7" fill="#777181"/>
    <rect x="158" y="66" width="8" height="13" fill="#f9c675"/>
    <rect x="151" y="99" width="22" height="47" fill="#111529"/>
    <rect x="145" y="101" width="6" height="46" fill="#686176"/>
    <rect x="173" y="101" width="6" height="46" fill="#686176"/>
    <Torch x={33} y={120} p={p}/>
    <Torch x={267} y={120} p={p}/>
    <Goblin/>
    <Hero/>
    <rect x="60" y="141" width="22" height="4" fill="#b18b68"/>
    <rect x="67" y="125" width="4" height="16" fill="#927350"/>
    <rect x="56" y="121" width="28" height="14" fill="#8a6556"/>
    <rect x="60" y="125" width="20" height="2" fill="#d8ad76"/>
    <rect x="65" y="131" width="11" height="2" fill="#d8ad76"/>
  </g>;
}

function WizardTavern({ p }: { p: Palette }) {
  return <g>
    <rect x="0" y="70" width="320" height="150" fill="#211831"/>
    <rect x="31" y="78" width="258" height="97" fill="#5a425c"/>
    <rect x="39" y="87" width="241" height="77" fill="#382b4e"/>
    <rect x="24" y="76" width="273" height="10" fill="#7b5977"/>
    {Array.from({ length: 8 }, (_, i) => (
      <rect key={i} x={40 + i * 30} y={88 + (i % 2) * 7} width="23" height="4" fill="#74567a"/>
    ))}
    <rect x="20" y="126" width="280" height="5" fill="#aa7a74"/>
    <rect x="30" y="165" width="263" height="8" fill="#a77571"/>
    <rect x="63" y="97" width="24" height="26" fill="#a7ece0"/>
    <rect x="68" y="97" width="14" height="26" fill="#233954"/>
    <rect x="73" y="97" width="4" height="26" fill="#70a5aa"/>
    <rect x="240" y="97" width="24" height="26" fill="#a7ece0"/>
    <rect x="244" y="97" width="16" height="26" fill="#233954"/>
    <rect x="253" y="97" width="4" height="26" fill="#70a5aa"/>
    <rect x="48" y="25" width="19" height="26" fill="#805668"/>
    <rect x="52" y="29" width="11" height="18" fill="#edbf9b"/>
    <rect x="47" y="21" width="22" height="5" fill="#c78591"/>
    <rect x="247" y="31" width="30" height="11" fill="#cfb477"/>
    <rect x="242" y="27" width="38" height="5" fill="#89769d"/>
    <rect x="244" y="44" width="34" height="5" fill="#dec79b"/>
    <rect x="133" y="98" width="35" height="56" fill="#191427"/>
    <rect x="129" y="91" width="42" height="9" fill="#aa728b"/>
    <rect x="139" y="107" width="20" height="15" fill="#9a94d6"/>
    <StoneFloor p={p} from={173}/>
    <Torch x={26} y={107} p={p}/>
    <Wizard x={104} y={125}/>
    <Hero x={233} y={127}/>
    <rect x="185" y="143" width="31" height="6" fill="#c5a575"/>
    <rect x="195" y="136" width="14" height="7" fill="#d2cfb4"/>
    <rect x="193" y="133" width="18" height="4" fill="#aee5e3"/>
  </g>;
}

function RoyalKitchen({ p }: { p: Palette }) {
  return <g>
    <rect x="0" y="60" width="320" height="160" fill="#4a303e"/>
    <rect x="12" y="78" width="296" height="95" fill="#725051"/>
    <rect x="20" y="89" width="280" height="63" fill="#3d2739"/>
    <rect x="28" y="91" width="33" height="47" fill="#7b5c53"/>
    <rect x="34" y="105" width="20" height="25" fill="#ed9a57"/>
    <rect x="37" y="111" width="14" height="19" fill="#ffdb81"/>
    <rect x="41" y="120" width="6" height="10" fill="#f7f0a2"/>
    <rect x="268" y="92" width="33" height="43" fill="#705b53"/>
    <rect x="271" y="98" width="27" height="7" fill="#be9b69"/>
    <rect x="276" y="114" width="19" height="5" fill="#be9b69"/>
    <rect x="125" y="79" width="80" height="70" fill="#64464c"/>
    <rect x="137" y="70" width="58" height="17" fill="#9a6b5e"/>
    <rect x="142" y="97" width="49" height="42" fill="#241d31"/>
    <rect x="156" y="107" width="21" height="22" fill="#895a68"/>
    <rect x="162" y="115" width="10" height="9" fill="#e4b879"/>
    <StoneFloor p={p} from={171}/>
    <rect x="43" y="163" width="230" height="12" fill="#b07d56"/>
    <rect x="51" y="173" width="11" height="26" fill="#795647"/>
    <rect x="251" y="173" width="11" height="26" fill="#795647"/>
    <rect x="67" y="158" width="51" height="6" fill="#e5c68b"/>
    <rect x="77" y="150" width="14" height="8" fill="#c3bf66"/>
    <rect x="144" y="151" width="17" height="12" fill="#eedda0"/>
    <rect x="147" y="148" width="11" height="4" fill="#b0c468"/>
    <Torch x={12} y={97} p={p}/>
    <Onion x={101} y={116}/>
    <Hero x={233} y={128}/>
  </g>;
}

// Two brand-new hand-crafted 320x220 tilemap backgrounds for the refreshed
// daily adventures. Always rendered for free without any AI calls.
function MidnightMuseum({ p }: { p: Palette }) {
  return <g>
    <rect x="0" y="47" width="320" height="126" fill="#302741"/>
    <rect x="12" y="55" width="296" height="105" fill="#51405e"/>
    {Array.from({length: 9}, (_,i) =>
      <rect key={i} x={i * 39 + 8} y="58" width="6" height="110" fill="#76627b"/>)}
    <rect x="22" y="62" width="76" height="95" fill="#a78772"/>
    <rect x="27" y="67" width="66" height="85" fill="#30283f"/>
    <rect x="33" y="75" width="54" height="63" fill="#77739a"/>
    <rect x="38" y="84" width="42" height="55" fill="#ad8193"/>
    <rect x="47" y="99" width="23" height="31" fill="#d7b293"/>
    <rect x="50" y="96" width="18" height="6" fill="#e6cfaa"/>
    <rect x="53" y="108" width="4" height="4" fill="#30223b"/>
    <rect x="63" y="108" width="4" height="4" fill="#30223b"/>
    <rect x="55" y="122" width="10" height="3" fill="#834e64"/>
    <rect x="120" y="50" width="78" height="120" fill="#453754"/>
    <rect x="128" y="55" width="62" height="105" fill="#211c34"/>
    <rect x="140" y="84" width="35" height="79" fill="#6c5773"/>
    <rect x="150" y="91" width="15" height="65" fill="#b5a6ac"/>
    <rect x="148" y="86" width="19" height="8" fill="#ddba89"/>
    <rect x="213" y="65" width="85" height="85" fill="#b19178"/>
    <rect x="220" y="73" width="71" height="69" fill="#36324f"/>
    <rect x="229" y="84" width="52" height="45" fill="#6e6ca5"/>
    <rect x="238" y="92" width="34" height="28" fill="#d1a48a"/>
    <StoneFloor p={p} from={164}/>
    <Torch x={13} y={121} p={p}/>
    <Torch x={292} y={121} p={p}/>
    <Hero x={223} y={123}/>
    <rect x="36" y="159" width="81" height="6" fill="#ad8668"/>
    <rect x="43" y="155" width="67" height="4" fill="#ead0a0"/>
  </g>;
}

function SkywhaleDeck({ p }: { p: Palette }) {
  return <g>
    <rect x="0" y="46" width="320" height="174" fill={p.sky}/>
    {Array.from({length: 5}, (_,i) => <g key={i}>
      <rect x={i * 80 - 22} y={88 + (i%2)*24} width="86" height="19" fill="#698eaf"/>
      <rect x={i * 80 - 8} y={81 + (i%2)*24} width="55" height="15" fill="#a0b4c4"/>
    </g>)}
    <rect x="33" y="100" width="220" height="48" fill="#467a9e"/>
    <rect x="59" y="83" width="160" height="66" fill="#6bacc0"/>
    <rect x="83" y="76" width="105" height="60" fill="#7bc4d4"/>
    <rect x="58" y="128" width="189" height="23" fill="#386b8e"/>
    <rect x="22" y="116" width="55" height="23" fill="#6faab7"/>
    <rect x="10" y="129" width="58" height="15" fill="#568da7"/>
    <rect x="225" y="104" width="39" height="24" fill="#6da6bf"/>
    <rect x="246" y="118" width="34" height="14" fill="#5b93ad"/>
    <rect x="204" y="118" width="7" height="7" fill="#eef4d9"/>
    <rect x="206" y="120" width="3" height="3" fill="#26334b"/>
    <rect x="238" y="136" width="14" height="4" fill="#2b4e68"/>
    <rect x="47" y="151" width="252" height="11" fill="#6f5972"/>
    <rect x="47" y="162" width="252" height="8" fill="#a58d89"/>
    {Array.from({length: 11}, (_,i)=><rect key={i} x={49+i*23} y="166" width="3" height="33" fill="#443c56"/>)}
    <rect x="45" y="170" width="254" height="32" fill="#53445e"/>
    <rect x="0" y="203" width="320" height="17" fill="#26344e"/>
    <Hero x={232} y={147}/>
    <rect x="67" y="147" width="21" height="4" fill="#eadcae"/>
    <rect x="72" y="137" width="10" height="11" fill="#e1c27c"/>
  </g>;
}


/** Reusable SVG tilemap: no image generation, remote assets or inference. */
function HollowmereTower({ p }: { p: Palette }) {
  return <g>
    <rect x="0" y="63" width="320" height="115" fill="#1c1d39"/>
    <circle cx="253" cy="40" r="21" fill="#e5d0b5"/>
    <circle cx="263" cy="33" r="21" fill={p.sky}/>
    {Array.from({length:7},(_,i)=><g key={i}>
      <rect x={i*53-13} y={129+(i%3)*7} width="50" height="46" fill="#2b2b46"/>
      <path d={"M"+(i*53-13)+" 129 l25 -19 l25 19"} fill="#4b3e57"/>
      <rect x={i*53+4} y={145+(i%3)*7} width="7" height="10" fill="#d19d67"/>
    </g>)}
    <rect x="87" y="52" width="148" height="132" fill="#4b405c"/>
    <rect x="98" y="61" width="126" height="116" fill="#66516f"/>
    {Array.from({length:5},(_,row)=>Array.from({length:4},(_,col)=>
      <rect key={row+"-"+col} x={99+col*30} y={67+row*22} width="27" height="2" fill="#81718b" opacity=".8"/>))}
    <rect x="111" y="17" width="100" height="76" fill="#342c4f"/>
    <rect x="118" y="23" width="86" height="66" fill="#211d3e"/>
    <rect x="126" y="33" width="70" height="54" fill="#655171"/>
    <rect x="137" y="42" width="48" height="45" fill="#221d36"/>
    <rect x="150" y="62" width="24" height="19" fill="#bd9967"/>
    <rect x="143" y="59" width="39" height="6" fill="#e1bd87"/>
    <rect x="156" y="52" width="12" height="10" fill="#deb675"/>
    <rect x="158" y="43" width="3" height="10" fill="#ba8f6a"/>
    <rect x="165" y="43" width="3" height="10" fill="#ba8f6a"/>
    <path d="M107 17 l8 -15 h92 l9 15" fill="#75617b"/>
    <rect x="139" y="127" width="45" height="58" fill="#27243c"/>
    <rect x="146" y="135" width="31" height="49" fill="#1a182b"/>
    <rect x="154" y="160" width="5" height="6" fill="#edc17c"/>
    <StoneFloor p={p} from={175}/>
    <Torch x={48} y={127} p={p}/>
    <Hero x={229} y={144}/>
    <Goblin x={58} y={144}/>
  </g>;
}

function RoomOverlay({ slug, roomIndex }: { slug: string; roomIndex: number }) {
  if (roomIndex === 0) return null;
  if (slug === "bell-of-hollowmere") return roomIndex === 1 ? <g>
    <rect x="70" y="35" width="175" height="131" fill="#29243e"/>
    <rect x="80" y="45" width="155" height="112" fill="#51415f"/>
    {Array.from({length:7},(_,i)=><g key={i} transform={"translate("+(95+i*19)+" "+(88+(i%2)*13)+")"}>
      <rect x="0" y="0" width="15" height="18" fill="#c09b72"/>
      <rect x="3" y="4" width="9" height="2" fill="#614b5f"/>
      <rect x="3" y="10" width="7" height="2" fill="#614b5f"/>
    </g>)}
    <circle cx="167" cy="83" r="29" fill="#a88b71"/>
    <circle cx="167" cy="83" r="20" fill="#34273f"/>
    <rect x="163" y="55" width="7" height="55" fill="#ddbc79"/>
    <rect x="139" y="79" width="56" height="7" fill="#ddbc79"/>
  </g> : <g>
    <rect x="72" y="30" width="176" height="132" fill="#24203d"/>
    <rect x="82" y="39" width="156" height="113" fill="#3f3155"/>
    <rect x="125" y="50" width="85" height="7" fill="#bb966a"/>
    <rect x="137" y="58" width="62" height="13" fill="#ddbd83"/>
    <rect x="145" y="69" width="46" height="35" fill="#9f795f"/>
    <rect x="152" y="73" width="33" height="24" fill="#c7a475"/>
    <path d="M168 100 v38" stroke="#8dced0" strokeWidth="3" strokeDasharray="4 4"/>
    <rect x="152" y="118" width="34" height="32" fill="#88c1c9" opacity=".8"/>
    <rect x="157" y="107" width="25" height="17" fill="#c6e1d3"/>
    <rect x="151" y="127" width="9" height="20" fill="#9ccad2"/>
    <rect x="181" y="127" width="9" height="20" fill="#9ccad2"/>
    <rect x="161" y="114" width="4" height="4" fill="#28283f"/>
    <rect x="176" y="114" width="4" height="4" fill="#28283f"/>
  </g>;
  if (slug === "midnight-museum") return roomIndex === 1 ? <g>
    <rect x="125" y="121" width="15" height="40" fill="#ddd6c2"/>
    <rect x="148" y="129" width="15" height="32" fill="#ddd6c2"/>
    <rect x="124" y="97" width="49" height="20" fill="#e5d6b2"/>
    <rect x="136" y="112" width="29" height="9" fill="#e5d6b2"/>
    <rect x="149" y="90" width="18" height="15" fill="#e5d6b2"/>
    <rect x="153" y="94" width="4" height="3" fill="#242035"/>
    <rect x="162" y="94" width="4" height="3" fill="#242035"/>
  </g> : <g>
    <rect x="127" y="114" width="65" height="40" fill="#c9a563"/>
    <rect x="135" y="101" width="51" height="20" fill="#f4d384"/>
    <rect x="141" y="94" width="38" height="12" fill="#ecc277"/>
    <rect x="151" y="86" width="9" height="11" fill="#f7e1a1"/>
    <rect x="168" y="86" width="9" height="11" fill="#f7e1a1"/>
  </g>;
  if (slug === "skywhale-express") return roomIndex === 1 ? <g>
    <rect x="29" y="68" width="97" height="41" fill="#65708f"/>
    <rect x="45" y="52" width="76" height="38" fill="#8894ae"/>
    <rect x="62" y="89" width="61" height="25" fill="#526788"/>
    <rect x="65" y="73" width="5" height="5" fill="#26334b"/>
    <rect x="92" y="73" width="5" height="5" fill="#26334b"/>
    <path d="M80 115h17l-12 18h15l-34 29 8-26H61z" fill="#ffe6a1"/>
  </g> : <g>
    <rect x="112" y="62" width="81" height="74" fill="#dad8df"/>
    <rect x="121" y="70" width="64" height="65" fill="#8f86b3"/>
    <rect x="141" y="79" width="25" height="28" fill="#f7e6aa"/>
    <rect x="147" y="88" width="5" height="6" fill="#2b2a47"/>
    <rect x="160" y="88" width="5" height="6" fill="#2b2a47"/>
    <rect x="107" y="138" width="100" height="8" fill="#c7b2c4"/>
  </g>;
  if (slug === "goblins-toll") {
    return roomIndex === 1 ? <g>
      <rect x="36" y="88" width="130" height="65" fill="#24233b"/>
      <rect x="40" y="90" width="7" height="64" fill="#95718b"/>
      <rect x="55" y="92" width="7" height="61" fill="#9f7c5b"/>
      <rect x="75" y="92" width="9" height="61" fill="#986d79"/>
      <GiantBook/>
    </g> : <g><rect x="26" y="149" width="150" height="20" fill="#4b444d"/><Dragon/></g>;
  }
  if (slug === "wizard-complaint") {
    return roomIndex === 1 ? <g>
      <rect x="65" y="115" width="128" height="39" fill="#34314e"/>
      <rect x="89" y="105" width="59" height="24" fill="#bfa27e"/>
      <rect x="100" y="83" width="37" height="35" fill="#aa8b87"/>
      <rect x="94" y="75" width="42" height="10" fill="#e5c698"/>
      <rect x="111" y="89" width="8" height="7" fill="#e9e6c8"/>
    </g> : <Wizard x={141} y={108}/>;
  }
  return roomIndex === 1 ? <Cheese x={124} y={120}/> : <King x={125} y={105}/>;
}

export default function PixelScene({ dungeonSlug, roomIndex = 0, className }: PixelSceneProps) {
  if (dungeonSlug === "lighthouse-lost-dawn" || dungeonSlug === "clockwork-orchard" || dungeonSlug === "dragon-bakery") {
    return <FreshPixelScene dungeonSlug={dungeonSlug} roomIndex={roomIndex} className={className}/>;
  }
  const slug = palettes[dungeonSlug] ? dungeonSlug : "goblins-toll";
  const p = palettes[slug];
  const base: Record<string, ReactNode> = {
    "goblins-toll": <GoblinBridge p={p}/>,
    "wizard-complaint": <WizardTavern p={p}/>,
    "royal-pantry": <RoyalKitchen p={p}/>,
    "midnight-museum": <MidnightMuseum p={p}/>,
    "skywhale-express": <SkywhaleDeck p={p}/>,
    "bell-of-hollowmere": <HollowmereTower p={p}/>
  };
  return <svg className={className} viewBox="0 0 320 220" preserveAspectRatio="xMidYMid meet"
    xmlns="http://www.w3.org/2000/svg" role="img" aria-label={"16-bit fantasy pixel art from today's dungeon"}
    shapeRendering="crispEdges">
    <rect width="320" height="220" fill={p.sky}/>
    <PixelStars accent={p.accent}/>
    <rect x="0" y="0" width="320" height="3" fill={p.accent} opacity=".15"/>
    {base[slug]}
    <RoomOverlay slug={slug} roomIndex={roomIndex}/>
    <g fill={p.accent2} opacity=".9">
      <rect x="17" y="24" width="3" height="3"/>
      <rect x="13" y="27" width="11" height="2"/>
      <rect x="278" y="51" width="4" height="4"/>
    </g>
  </svg>;
}
