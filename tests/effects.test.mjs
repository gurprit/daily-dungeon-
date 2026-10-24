import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { makeVisualRecipe } from "../src/illustration-recipe.ts";
import { makeEffectPlan, roomFxTheme } from "../src/effect-presets.ts";

const planFor = (input) => makeEffectPlan(input, makeVisualRecipe(input));

test("every museum room has its own ambience instead of one repeated particle set", () => {
  const themes = [0, 1, 2].map(roomIndex => roomFxTheme("midnight-museum", roomIndex));
  assert.deepEqual(themes, ["museum-painting", "museum-bones", "museum-cursed"]);
  const p = themes.map((_, roomIndex) => planFor({ dungeonSlug:"midnight-museum", roomIndex, kind:"room" }));
  assert.ok(p[0].ambient.includes("paint"));
  assert.ok(p[1].ambient.includes("bones") && p[1].ambient.includes("gears"));
  assert.ok(p[2].ambient.includes("curse"));
  assert.equal(new Set(p.map(v => v.seed)).size, 3);
});

test("Hollowmere has moonlit gate, animated clockwork and spectral bell presets", () => {
  assert.equal(roomFxTheme("bell-of-hollowmere", 0), "bell-gate");
  assert.equal(roomFxTheme("bell-of-hollowmere", 1), "bell-gears");
  assert.equal(roomFxTheme("bell-of-hollowmere", 2), "bell-ghost");
  assert.ok(planFor({ dungeonSlug:"bell-of-hollowmere", roomIndex:0, kind:"room" }).ambient.includes("fire"));
  assert.ok(planFor({ dungeonSlug:"bell-of-hollowmere", roomIndex:1, kind:"room" }).ambient.includes("gears"));
  assert.ok(planFor({ dungeonSlug:"bell-of-hollowmere", roomIndex:2, kind:"room" }).ambient.includes("bell"));
});

test("action-specific effects follow the hero's actual input and not generic ambience", () => {
  const base={ dungeonSlug:"midnight-museum", roomIndex:0, kind:"action", success:true };
  assert.deepEqual(planFor({...base,action:"I dance to seduce the painting"}).action,["notes"]);
  assert.deepEqual(planFor({...base,action:"I kiss the painting"}).action,["hearts"]);
  assert.deepEqual(planFor({...base,action:"I cast a rune spell"}).action,["runes"]);
  assert.deepEqual(planFor({...base,action:"I use a key to unlock the door"}).action,["sparks"]);
  assert.deepEqual(planFor({...base,action:"I shout then blow my whistle"}).action,["sound"]);
  assert.deepEqual(planFor({...base,action:"I yell and dance wildly"}).action,["sound","notes"]);
  assert.deepEqual(planFor({...base,action:"I sneak past the skeleton"}).action,["shadow"]);
});

test("failure crackles and success glows differ while preserving stable seeded motion", () => {
  const input={ dungeonSlug:"midnight-museum", roomIndex:1, kind:"action", action:"I put the bones back", success:true };
  const win=planFor(input);
  const lose=planFor({...input,success:false});
  assert.deepEqual(win.result,["triumph"]);
  assert.deepEqual(lose.result,["failure"]);
  assert.deepEqual(win, planFor({...input}));
  assert.notEqual(win.seed,lose.seed);
  assert.ok(win.ambient.length <= 3);
  assert.ok(win.action.length <= 2);
});

test("FX implementation contains only local SVG and CSS with reduced motion support", () => {
  const component=readFileSync(new URL("../src/ProceduralEffects.tsx",import.meta.url),"utf8");
  const art=readFileSync(new URL("../src/ProceduralIllustration.tsx",import.meta.url),"utf8");
  const css=readFileSync(new URL("../src/styles.scss",import.meta.url),"utf8");
  assert.match(art, /<ProceduralEffects input=\{input\} recipe=\{recipe\}/);
  assert.match(art, /<PaintingSprite\/>|<ClockworkSkeletonSprite\/>/);
  assert.match(component, /fx-flame|fx-bell-ring|fx-runes|fx-music-trail/);
  assert.doesNotMatch(component, /\b(fetch|Image|WebGL|canvas)\s*\(/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /fx-flame-flicker|fx-bell-pulse|fx-sound-pulse/);
});
