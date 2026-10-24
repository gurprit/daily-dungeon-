import { visualSeedPoints, type VisualRecipe, type VisualInput } from "./illustration-recipe";
import { makeEffectPlan, type FxTag } from "./effect-presets";

function Motes({ seed, color, count, styleName }: {
  seed: number; color: string; count: number; styleName: string
}) {
  return <g fill={color} className={styleName}>
    {visualSeedPoints(seed, count).map((p, i) =>
      <circle key={i} cx={p.x} cy={p.y} r={Math.min(2.8, p.size)}
        className="fx-mote" style={{ animationDelay: "-" + (p.delay * 2).toFixed(2) + "s" }}/>)}
  </g>;
}
function Flame({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  return <g transform={"translate(" + x + " " + y + ")"}>
    <ellipse rx="17" ry="23" cy="-8" fill="#f8b66d" opacity=".13"/>
    <g className="fx-flame" style={{ animationDelay: "-" + delay + "s" }}>
      <path d="M0 10 C-15 5 -11 -10 -4 -21 C-3 -9 5 -13 3 -28 C15 -9 15 4 6 10Z" fill="#ed9759"/>
      <path d="M0 6 Q-7 -2 3 -15 Q8 -2 4 7Z" fill="#fff2c5"/>
    </g>
  </g>;
}
function AmbientFx({ kind, seed, color }: { kind: FxTag; seed: number; color: string }) {
  switch(kind) {
    case "dust": return <Motes seed={seed} count={10} color="#e9d1b1" styleName="fx-dust"/>;
    case "fire": return <g><Flame x={46} y={137}/><Flame x={274} y={137} delay={.4}/>
      <Motes seed={seed+3} count={8} color="#ffd090" styleName="fx-embers"/></g>;
    case "mist": return <g className="fx-mist" fill="none">
      <path d="M-50 163 Q42 139 126 159 T360 160" stroke="#a9c3d0" strokeWidth="19" opacity=".15"/>
      <path d="M-50 197 Q40 179 141 195 T367 193" stroke={color} strokeWidth="15" opacity=".12"/>
    </g>;
    case "moon": return <g className="fx-moon">
      <circle cx="263" cy="39" r="32" fill="#b8cde1" opacity=".13"/>
      <path d="M253 0H297L217 220H162Z" fill="#a8bdd0" opacity=".045"/>
    </g>;
    case "paint": return <g>
      <g fill="none" strokeLinecap="round" className="fx-paint">
        <path d="M56 16 Q62 35 55 55 T56 91" stroke="#c58fb9" strokeWidth="5"/>
        <path d="M263 11 Q254 31 260 46 T255 76" stroke="#77bbbd" strokeWidth="4"/>
      </g>
      <g fill="#c9a0c7" className="fx-paint-drop"><circle cx="59" cy="106" r="4"/>
        <circle cx="256" cy="92" r="3"/><circle cx="93" cy="174" r="3"/></g>
    </g>;
    case "bones": return <g className="fx-bones" stroke="#e5d3b7" strokeWidth="6" strokeLinecap="round">
      <path d="M119 48L136 67 M130 63L146 45 M184 140L203 157"/>
      <circle cx="117" cy="49" r="5" fill="#e9d6bd" stroke="none"/>
    </g>;
    case "gears": return <g>
      <g transform="translate(164 79)"><g className="fx-gear">
        <circle r="31" fill="none" stroke="#cfad78" strokeWidth="8" strokeDasharray="12 5"/>
        <circle r="16" fill="none" stroke="#e6c18a" strokeWidth="4"/>
        <path d="M-30 0H30 M0 -30V30" stroke="#be9b6f" strokeWidth="3"/>
      </g></g>
      <g transform="translate(221 117)"><g className="fx-gear fx-gear--reverse">
        <circle r="15" fill="none" stroke="#c7a37b" strokeWidth="6" strokeDasharray="7 4"/>
        <circle r="5" fill="#f3d49f"/>
      </g></g>
    </g>;
    case "curse": return <g transform="translate(164 85)"><g className="fx-cursed" fill="none">
      <circle r="57" stroke="#e4a4c6" strokeWidth="2" strokeDasharray="4 8"/>
      <circle r="44" stroke="#b3a1dc" strokeWidth="2"/>
      {Array.from({length:8}, (_,i)=>{
        const a=Math.PI*i/4,x=Math.cos(a)*50,y=Math.sin(a)*50;
        return <path key={i} d={"M"+(x-4)+" "+(y-4)+"l8 8m-9 0l10 -8"}
          stroke="#e5b8d8" strokeWidth="2"/>;
      })}
    </g></g>;
    case "ghost": return <g><Motes seed={seed+13} count={10} color="#bce8e7" styleName="fx-ghost-motes"/>
      <path className="fx-ghost-trail" d="M-20 202 Q93 173 165 204 T342 189"
        fill="none" stroke="#bbdce7" strokeWidth="10" opacity=".17"/></g>;
    case "bell": return <g transform="translate(162 63)" fill="none" stroke="#eed0a1" strokeWidth="2">
      {[30,52,76].map((r,i)=><circle key={i} r={r} className="fx-bell-ring"
        style={{animationDelay: "-" + (i*1.5) + "s"}}/>)}
    </g>;
    case "sparks": return <Motes seed={seed+11} count={10} color="#fbd9a3" styleName="fx-embers"/>;
    default: return null;
  }
}
function ActionFx({ kind, recipe }: { kind: FxTag; recipe: VisualRecipe }) {
  switch(kind) {
    case "notes": return <g fill="#f5d58b" stroke="#f5d58b" strokeWidth="2">
      <path d="M88 59Q147 7 218 53" fill="none" strokeDasharray="7 8" className="fx-music-trail"/>
      {[[119,42],[159,20],[202,48]].map(([x,y],i)=>
        <g transform={"translate("+x+" "+y+")"} key={i}>
          <g className="fx-note" style={{animationDelay:"-"+(i*.55)+"s"}}>
            <ellipse cx="0" cy="9" rx="6" ry="4" transform="rotate(-22 0 9)"/>
            <path d="M5 7V-11L18 -15V4" fill="none"/>
          </g>
        </g>)}
    </g>;
    case "hearts": return <g fill="#ffb1c0">
      {[[151,55],[177,78],[198,39]].map(([x,y],i)=>
        <g key={i} transform={"translate("+x+" "+y+") scale(" + (.52+i*.12)+")"}>
          <path className="fx-heart" style={{animationDelay:"-"+(i*.6)+"s"}}
            d="M0 12Q-31 -9 -17 -22Q-5 -31 0 -16Q14 -31 23 -21Q33 -8 0 12Z"/>
        </g>)}
    </g>;
    case "runes": return <g transform="translate(158 98)" stroke={recipe.accent} fill="none">
      <g className="fx-runes">
        <circle r="52" strokeDasharray="7 8" strokeWidth="3"/>
        <circle r="41" stroke="#c7e8e0" strokeWidth="1.5"/>
        {Array.from({length:8},(_,i)=>{
          const a=i*Math.PI/4,x=Math.cos(a)*47,y=Math.sin(a)*47;
          return <path key={i} d={"M"+(x-4)+" "+(y-5)+"l8 10"} strokeWidth="2"/>;
        })}
      </g>
      <g className="fx-runes fx-runes--reverse">
        <circle r="25" strokeDasharray="5 8" stroke="#d2c6ec" strokeWidth="2"/>
        <path d="M-20 0H20 M0 -20V20" stroke="#bfe9e2" strokeWidth="2"/>
      </g>
    </g>;
    case "sparks": return <g className="fx-sparks" stroke="#ffe5b0" strokeWidth="3.4" strokeLinecap="round">
      <path d="M185 76L178 62 M205 73L212 58 M221 97L237 98 M190 121L183 137"/>
      <circle cx="202" cy="100" r="6" stroke="none" fill="#f6d68a" opacity=".5"/>
    </g>;
    case "impact": return <g className="fx-sparks" fill="none" stroke="#faacb5" strokeWidth="4">
      <path d="M118 72Q163 24 220 79" strokeDasharray="8 7"/>
      <path d="M173 61l16 -18M197 113l18 11M148 117l-13 17"/>
    </g>;
    case "shadow": return <g className="fx-shadow">
      <ellipse cx="106" cy="170" rx="78" ry="13" fill="#171629" opacity=".7"/>
      <path d="M16 177Q99 138 180 177" stroke="#7a80ab" strokeWidth="4" opacity=".26" fill="none"/>
    </g>;
    case "sound": return <g transform="translate(180 96)" fill="none" stroke="#e1caf7" strokeWidth="3">
      {[19,39,59].map((r,i)=><circle key={r} r={r} className="fx-sound-wave"
        style={{animationDelay:"-"+(i*.4)+"s"}}/>)}
    </g>;
    case "dust": return <Motes seed={recipe.seed+7} color="#eddcb7" count={5} styleName="fx-dust"/>;
    default: return null;
  }
}
function ResultFx({ kind }: { kind: FxTag }) {
  if (kind==="triumph") return <g>
    {/* Outlined halo rather than an animated filled disc; CSS must never overwrite
        a filled circle's SVG opacity and cover the characters. */}
    <g className="fx-win-halo" fill="none" stroke="#f5d79d">
      <circle cx="159" cy="105" r="54" strokeWidth="2" opacity=".16"/>
      <circle cx="159" cy="105" r="73" strokeWidth="1.5" opacity=".09"/>
    </g>
    <g fill="none" stroke="#f5d79d" strokeWidth="3" className="fx-win-sparkles">
      <path d="M55 48V29M46 39H64 M270 71V54M261 63H279 M205 167V148M196 157H214"/>
    </g>
  </g>;
  if (kind==="failure") return <g>
    <rect width="320" height="220" fill="#a84c65" opacity=".09" className="fx-failure-flash"/>
    <g className="fx-failure-crackle" stroke="#fa9ead" strokeWidth="4" strokeLinecap="round" fill="none">
      <path d="M145 19l-14 21 17 9 -18 20 M225 80l13 -18 -11 -12 13 -18 M96 147l-12 12 11 9 -9 14"/>
    </g>
  </g>;
  return null;
}

/** Bounded, seeded, animated SVG. No image inference, external requests or timers. */
export default function ProceduralEffects({ input, recipe }: { input: VisualInput; recipe: VisualRecipe }) {
  const plan = makeEffectPlan(input, recipe);
  return <g className={"procedural-fx procedural-fx--"+plan.theme} pointerEvents="none">
    {plan.ambient.map((tag,i)=><AmbientFx key={"ambient-"+tag+"-"+i} kind={tag}
      seed={plan.seed + i*317} color={recipe.accent}/>)}
    {plan.action.map((tag,i)=><ActionFx key={"action-"+tag+"-"+i} kind={tag} recipe={recipe}/>)}
    {plan.result.map((tag,i)=><ResultFx key={"result-"+tag+"-"+i} kind={tag}/>)}
  </g>;
}
