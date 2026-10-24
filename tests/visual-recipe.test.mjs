import test from "node:test";
import assert from "node:assert/strict";
import { illustrationHash, makeVisualRecipe, visualSeedPoints } from "../src/illustration-recipe.ts";

const hollowmere = { dungeonSlug: "bell-of-hollowmere", roomIndex: 0 };

test("procedural art produces stable character and effect choices across reloads", () => {
  const input = { ...hollowmere, kind: "action", action: "I hand Spoon a silver thimble and kiss him", success: true };
  const a = makeVisualRecipe(input);
  const b = makeVisualRecipe({ ...input });
  assert.deepEqual(a, b);
  assert.equal(a.gesture, "kiss");
  assert.equal(a.prop, "thimble");
  assert.equal(a.mood, "triumph");
  assert.equal(a.variant, b.variant);
  assert.deepEqual(visualSeedPoints(a.seed, 20), visualSeedPoints(b.seed, 20));
});

test("free-form player actions drive distinct compositions without images or AI", () => {
  const examples = [
    ["I unlock the door with my key", "unlock", "key"],
    ["I dance to impress the goblin", "dance", "none"],
    ["I cast a spell with my wand", "spell", "wand"],
    ["I threaten the guard with a sword", "fight", "sword"],
    ["I look into the mirror", "inspect", "mirror"],
    ["I offer the ghost an apple", "offer", "apple"],
    ["I read a scroll", "inspect", "scroll"]
  ];
  for (const [action, gesture, prop] of examples) {
    const result = makeVisualRecipe({ ...hollowmere, kind: "action", action, success: true });
    assert.equal(result.gesture, gesture, action);
    assert.equal(result.prop, prop, action);
  }
  const a = makeVisualRecipe({ ...hollowmere, kind: "action", action: "I dance", success: true });
  const b = makeVisualRecipe({ ...hollowmere, kind: "action", action: "I use a brass key", success: true });
  assert.notEqual(a.seed, b.seed);
  assert.notDeepEqual(visualSeedPoints(a.seed, 10), visualSeedPoints(b.seed, 10));
});

test("success, failure, discoveries, and room number all affect visual state", () => {
  const base = { ...hollowmere, kind: "action", action: "I shout BOO!" };
  const win = makeVisualRecipe({ ...base, success: true });
  const fail = makeVisualRecipe({ ...base, success: false });
  assert.equal(win.mood, "triumph");
  assert.equal(fail.mood, "setback");
  assert.notEqual(win.seed, fail.seed);
  const room1 = makeVisualRecipe({ ...hollowmere, kind: "room" });
  const room2 = makeVisualRecipe({ ...hollowmere, kind: "room", roomIndex: 1 });
  assert.notEqual(room1.seed, room2.seed);
  const clueA = makeVisualRecipe({ ...hollowmere, kind: "clue", clueId: "spoon" });
  const clueB = makeVisualRecipe({ ...hollowmere, kind: "clue", clueId: "note" });
  assert.notEqual(clueA.seed, clueB.seed);
});

test("Hollowmere endings have distinct palettes and canonical outcomes", () => {
  const endings = ["oath-remade", "silent-bargain", "keeper-unchained", "borrowed-dawn", "last-toll"];
  const recipes = endings.map(endingId => makeVisualRecipe({ ...hollowmere, roomIndex: 2, kind: "ending", endingId }));
  assert.equal(new Set(recipes.map(r => r.seed)).size, endings.length);
  assert.equal(recipes[0].mood, "hope");
  assert.equal(recipes[1].mood, "melancholy");
  assert.equal(recipes[2].mood, "danger");
  assert.equal(recipes[4].mood, "danger");
});

test("the deterministic visual hash stays inside unsigned 32-bit limits", () => {
  const hash = illustrationHash("Your hero did something spectacularly unreasonable.");
  assert.equal(hash, illustrationHash("Your hero did something spectacularly unreasonable."));
  assert.ok(Number.isInteger(hash) && hash >= 0 && hash <= 0xffffffff);
  const all = visualSeedPoints(hash, 50);
  assert.ok(all.every(p => p.x >= 15 && p.x <= 305 && p.y >= 14 && p.y <= 187));
});
