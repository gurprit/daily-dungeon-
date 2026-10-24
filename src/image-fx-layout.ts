import { roomFxTheme, type FxTheme } from "./effect-presets.ts";
import type { VisualInput } from "./illustration-recipe.ts";

/** Model framing and overlay anchors must agree; no image recognition required. */
export type SpriteFxLayout = {
  theme: FxTheme;
  focal: { x: number; y: number };
  hero: { x: number; y: number };
  torches: ReadonlyArray<{ x: number; y: number }>;
  magicAllowed: boolean;
  caption: string;
};

/** All coordinates are in the 320 x 220 scene viewBox. */
export function generatedFxLayout(input: VisualInput): SpriteFxLayout {
  const theme = roomFxTheme(input.dungeonSlug, input.roomIndex);
  // Standard NES composition: hero left, challenge/NPC on right; keep central
  // faces free from unrelated overlays. Endings centre their meaningful event.
  const focal = input.kind === "ending" ? { x: 205, y: 135 } :
    input.kind === "clue" ? { x: 205, y: 105 } : { x: 224, y: 149 };
  const hero = { x: 84, y: 104 };
  const torches = theme === "bell-gate" || theme === "tavern" || theme === "bridge"
    ? [{ x: 40, y: 136 }, { x: 282, y: 136 }] : [];
  const magicAllowed = theme === "bell-gears" || theme === "bell-ghost" ||
    theme === "museum-cursed" || theme === "museum-painting" ||
    input.kind === "ending";
  const caption = [
    "SCREEN LAYOUT: static 2D side-view. Tiny purple-hooded player in LEFT THIRD",
    "around x=25%; main creature or interactive object on RIGHT THIRD",
    "around x=70%, around half the image height. Keep both instantly readable.",
    "Leave clear space around the central face; never put graphics over eyes.",
    torches.length ? "Show TWO small wall-mounted burning torches at x=12% and x=88%, y=62%, matching animated ember positions." : "Do not add invented wall torches.",
    magicAllowed ? "The magic, if any, originates from the right-hand objective rather than filling the frame." : "Keep scene-specific ambient effects restrained."
  ].join(" ");
  return { theme, focal, hero, torches, magicAllowed, caption };
}

/** Image-aware particle positions. These avoid painting fire over the hero or
 * a random character's face and do not make unsupported assumptions about
 * the precise imagery supplied by a generative model. */
export function generatedEffectAnchors(input: VisualInput) {
  const layout = generatedFxLayout(input);
  return {
    ...layout,
    ambientDust: { x: 160, y: 43 },
    accent: { x: Math.min(layout.focal.x + 5, 300), y: layout.focal.y + 5 }
  };
}
