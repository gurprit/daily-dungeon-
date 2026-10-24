import { makeEffectPlan } from "./effect-presets.ts";
import { generatedEffectAnchors } from "./image-fx-layout.ts";
import type { VisualInput, VisualRecipe } from "./illustration-recipe.ts";

/**
 * Effects over generated artwork must follow the composition agreed in the
 * image prompt. Unlike the procedural fallback, NEVER draw giant gears,
 * characters, floating torches or a central opaque success disc over a painting.
 */
export default function GeneratedEffects({ input, recipe }: { input: VisualInput; recipe: VisualRecipe }) {
  if (input.kind === "clue") return null;
  const layout = generatedEffectAnchors(input);
  const plan = makeEffectPlan(input, recipe);
  const { x, y } = layout.focal;
  const { x: hx, y: hy } = layout.hero;
  const magical = layout.magicAllowed || plan.action.includes("runes");
  const sound = plan.action.includes("sound");
  const notes = plan.action.includes("notes");
  const hearts = plan.action.includes("hearts");
  return <g className="generated-fx" pointerEvents="none">
    {layout.torches.map((torch, i) => <g key={i} transform={"translate("+torch.x+" "+torch.y+")"}
      className="generated-fx__flame">
      <path d="M0 3 Q-7 -4 -2 -12 Q3 -22 3 -8 Q11 -3 3 4Z" fill="#efa84e" opacity=".55"/>
      <path d="M0 1 Q-3 -5 1 -10 Q5 -3 3 1Z" fill="#ffeca0" opacity=".8"/>
    </g>)}
    {magical && input.kind !== "room" && <g transform={"translate("+x+" "+y+")"}
      className="generated-fx__rune" fill="none" stroke={recipe.accent} opacity=".43">
      <circle r="22" strokeWidth="1.5" strokeDasharray="5 11"/>
      <path d="M-18 0H-11 M11 0H18 M0 -18V-11 M0 11V18" strokeWidth="1.5"/>
    </g>}
    {magical && input.kind === "room" && <g fill={recipe.accent} opacity=".56">
      <circle cx={x-12} cy={y+20} r="1.8" className="generated-fx__twinkle"/>
      <circle cx={x+23} cy={y-15} r="1.3" className="generated-fx__twinkle"/>
    </g>}
    {notes && <g stroke="#fce1a0" fill="none" opacity=".84" strokeWidth="2">
      <path d={"M"+(hx-13)+" "+(hy-25)+"v-15 l10 -3 v15 M"+(hx+22)+" "+(hy-35)+"v-18 l9 -3 v18"}/>
      <circle cx={x-13} cy={y-25} r="4" fill="#fce1a0"/>
      <circle cx={x+22} cy={y-35} r="4" fill="#fce1a0"/>
    </g>}
    {hearts && <g transform={"translate("+(hx+17)+" "+(hy-29)+")"}
      className="generated-fx__float" opacity=".86">
      <path d="M0 10 L-10 0 Q-13 -9 -4 -10 Q0 -10 2 -4 Q10 -13 15 -7 Q20 0 0 10Z" fill="#f3a2bb"/>
    </g>}
    {sound && <g transform={"translate("+hx+" "+hy+")"} fill="none" stroke="#f4daaa"
      strokeWidth="1.7" opacity=".5">
      <path d="M4 -11 Q18 0 4 11 M11 -18 Q34 0 11 18" className="generated-fx__sound"/>
    </g>}
    {plan.result.includes("triumph") && input.kind === "action" &&
      <g fill="#ffe1a0" className="generated-fx__twinkle">
        <path d={"M"+(x+30)+" "+(y+22)+"v-10 m-5 5 h10 M"+(x-31)+" "+(y-13)+"v-8 m-4 4 h8"}
          fill="none" stroke="#ffe1a0" strokeWidth="1.5"/>
      </g>}
    {plan.result.includes("failure") && input.kind === "action" &&
      <g stroke="#e99a9a" fill="none" opacity=".6" strokeWidth="2">
        <path d={"M"+(x+20)+" "+(y+17)+"l6 -7 -5 -4 6 -10"}/>
      </g>}
  </g>;
}
