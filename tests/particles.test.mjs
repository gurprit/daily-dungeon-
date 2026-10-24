import test from "node:test";
import assert from "node:assert/strict";
import { makeVisualRecipe } from "../src/illustration-recipe.ts";
import { makeEffectPlan } from "../src/effect-presets.ts";
import { createParticleWorld, emittersForScene, advanceParticles } from "../src/particle-engine.ts";
import { readFileSync } from "node:fs";

const setup = (input) => {
  const recipe = makeVisualRecipe(input);
  const plan = makeEffectPlan(input, recipe);
  return emittersForScene(plan, input);
};

test("Hollowmere torches spawn visible JS fire and embers", () => {
  const emitters = setup({ kind: "room", dungeonSlug: "bell-of-hollowmere", roomIndex: 0 });
  assert.equal(emitters.filter(e => e.kind === "flame").length, 2);
  assert.equal(emitters.filter(e => e.kind === "ember").length, 2);
  assert.ok(emitters.some(e => e.x === 46));
  assert.ok(emitters.some(e => e.x === 274));
});

test("spellcasting produces magic particles and fighting produces impact particles", () => {
  const magic = setup({ kind: "action", dungeonSlug: "bell-of-hollowmere",
    roomIndex: 2, action: "I cast a protective spell", success: true });
  assert.ok(magic.some(e => e.kind === "magic"));
  const fight = setup({ kind: "action", dungeonSlug: "midnight-museum",
    roomIndex: 2, action: "I strike the evil crown", success: false });
  assert.ok(fight.some(e => e.kind === "impact"));
});

test("particle counts are capped for mobile and clue illustrations avoid extra animation", () => {
  const actions = ["I dance and sing", "I fight with my sword", "I cast a spell and scream"];
  for (const action of actions) {
    const effects = setup({ kind: "action", dungeonSlug: "bell-of-hollowmere", roomIndex: 0, action, success: true });
    assert.ok(effects.reduce((sum,e) => sum + e.count, 0) <= 62);
  }
  assert.deepEqual(setup({ kind: "clue", dungeonSlug: "bell-of-hollowmere", roomIndex: 0, clueId: "spoon" }), []);
});

test("simulation is seeded, loops indefinitely, and never accumulates particles", () => {
  const emitters = setup({ kind: "room", dungeonSlug: "bell-of-hollowmere", roomIndex: 0 });
  const world1 = createParticleWorld(emitters, 12345);
  const world2 = createParticleWorld(emitters, 12345);
  assert.deepEqual(world1, world2);
  const count = world1.particles.length;
  assert.ok(count > 0);
  for (let i = 0; i < 1000; i++) {
    advanceParticles(world1, 1/30);
    advanceParticles(world2, 1/30);
  }
  assert.equal(world1.particles.length, count);
  assert.deepEqual(world1, world2);
  assert.ok(world1.particles.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)));
});

test("huge background-tab delays are clamped for stable resumption", () => {
  const world = createParticleWorld([{ kind: "flame", x: 46, y: 130, count: 3, spread: 10, color: "#ffaa44" }], 89);
  advanceParticles(world, 100);
  assert.ok(world.elapsed <= .045 + Number.EPSILON);
});

test("victory effect cannot obscure the whole scene again", () => {
  const source = readFileSync(new URL("../src/ProceduralEffects.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/styles.scss", import.meta.url), "utf8");
  assert.doesNotMatch(source, /fill="#eecb86" className="fx-win-glow"/);
  assert.match(source, /fx-win-halo/);
  assert.match(css, /fx-safe-halo/);
  assert.match(css, /prefers-reduced-motion/);
  const component = readFileSync(new URL("../src/ParticleCanvas.tsx", import.meta.url), "utf8");
  assert.match(component, /requestAnimationFrame/);
  assert.match(component, /IntersectionObserver/);
  assert.match(component, /visibilitychange/);
});
