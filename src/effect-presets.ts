import { illustrationHash, type VisualInput, type VisualRecipe } from "./illustration-recipe.ts";

export type FxTheme =
  | "museum-painting" | "museum-bones" | "museum-cursed"
  | "bell-gate" | "bell-gears" | "bell-ghost"
  | "tavern" | "kitchen" | "sky" | "bridge" | "lighthouse" | "orchard" | "bakery" | "generic";
export type FxTag =
  | "dust" | "fire" | "mist" | "moon" | "paint" | "bones" | "gears"
  | "curse" | "bell" | "ghost" | "notes" | "hearts" | "runes"
  | "sparks" | "impact" | "shadow" | "sound" | "triumph" | "failure";
export type EffectPlan = {
  theme: FxTheme;
  ambient: readonly FxTag[];
  action: readonly FxTag[];
  result: readonly FxTag[];
  seed: number;
  intensity: 1 | 2 | 3;
};

export function roomFxTheme(slug: string, index: number): FxTheme {
  if (slug === "midnight-museum") return (["museum-painting", "museum-bones", "museum-cursed"] as const)[index] ?? "museum-cursed";
  if (slug === "bell-of-hollowmere") return (["bell-gate", "bell-gears", "bell-ghost"] as const)[index] ?? "bell-ghost";
  if (slug === "wizard-complaint") return "tavern";
  if (slug === "royal-pantry") return "kitchen";
  if (slug === "skywhale-express") return "sky";
  if (slug === "lighthouse-lost-dawn") return "lighthouse";
  if (slug === "clockwork-orchard") return "orchard";
  if (slug === "dragon-bakery") return "bakery";
  if (slug === "goblins-toll") return "bridge";
  return "generic";
}

export function makeEffectPlan(input: VisualInput, recipe: VisualRecipe): EffectPlan {
  const theme = roomFxTheme(input.dungeonSlug, input.roomIndex);
  const ambient: Record<FxTheme, FxTag[]> = {
    "museum-painting": ["paint", "dust"],
    "museum-bones": ["bones", "gears", "dust"],
    "museum-cursed": ["curse", "mist"],
    "bell-gate": ["moon", "mist", "fire"],
    "bell-gears": ["gears", "sparks", "dust"],
    "bell-ghost": ["ghost", "bell", "mist"],
    tavern: ["fire", "dust"],
    kitchen: ["fire", "dust"],
    sky: ["moon", "mist"],
    bridge: ["fire", "mist"],
    lighthouse: ["moon", "mist"],
    orchard: ["gears", "dust"],
    bakery: ["fire", "dust"],
    generic: ["dust", "fire"]
  };
  const action: FxTag[] = [];
  const words = (input.action ?? "").toLowerCase();
  if (input.kind === "action") {
    if (/\b(shout|scream|yell|whistl\w*|sing\w*|roar|blast|shriek|loud\w*)\b/.test(words)) action.push("sound");
    switch (recipe.gesture) {
      case "dance": action.push("notes"); break;
      case "kiss": action.push("hearts"); break;
      case "spell": action.push("runes"); break;
      case "unlock": action.push("sparks"); break;
      case "fight": action.push("impact"); break;
      case "sneak": action.push("shadow"); break;
      case "offer": action.push("hearts"); break;
      case "inspect": action.push("runes"); break;
      case "talk": action.push("dust"); break;
      default: if (!action.length) action.push("dust");
    }
  }
  const result: FxTag[] = input.kind === "action"
    ? [input.success === false ? "failure" : "triumph"]
    : input.kind === "ending" ? [recipe.mood === "danger" || recipe.mood === "melancholy" ? "failure" : "triumph"]
    : [];
  const intensity: 1 | 2 | 3 = input.kind === "clue" ? 1 : input.kind === "action" ? 3 : 2;
  return {
    theme, ambient: ambient[theme].slice(0, input.kind === "clue" ? 1 : 3),
    action: [...new Set(action)].slice(0, 2), result, intensity,
    seed: illustrationHash(recipe.seed + "|" + theme + "|" + input.kind)
  };
}
