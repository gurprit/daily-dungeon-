import test from "node:test";
import assert from "node:assert/strict";
import { DUNGEONS } from "../src/game.ts";
import { resolveAction } from "../src/engine.ts";
import {
  fallbackAchievement, achievementFromJudgment, cleanGeneratedAchievement
} from "../src/achievements.ts";

const bridge = DUNGEONS[0].rooms[0];

test("dancing past a goblin earns Lord of the Dance without a second AI call", () => {
  const action = "I launch into an elaborate interpretive dance before the goblin.";
  const outcome = resolveAction(bridge, action, [], 20);
  assert.equal(outcome.achievement?.title, "Lord of the Dance");
  assert.match(outcome.achievement?.description ?? "", /danced through danger/);
});

test("ordinary actions and failed rolls do not unlock awards", () => {
  assert.equal(resolveAction(bridge, "I ask nicely.", [], 20).achievement, null);
  assert.equal(resolveAction(bridge, "I dance all night", [], 1).achievement, null);
  assert.equal(achievementFromJudgment(bridge, "I dance", true, 2, {
    title: "Lord of the Dance", description: "The greatest jig ever danced."
  }), null);
});

test("AI-specific achievements are allowed for successful 4+ creativity", () => {
  const award = {
    title: "The Bridge Boogie",
    description: "You choreographed your way past the world's strictest goblin accountant."
  };
  assert.deepEqual(achievementFromJudgment(bridge, "I dance", true, 4, award), award);
  assert.equal(achievementFromJudgment(bridge, "I dance", false, 4, award), null);
});

test("missing high-creativity award gets a reasonable scripted fallback", () => {
  const recovered = fallbackAchievement("I dance to prove my point", bridge.title, true, 4);
  assert.equal(recovered?.title, "Lord of the Dance");
  const generic = achievementFromJudgment(bridge, "I invent a new mathematical theorem", true, 4, null);
  assert.equal(generic?.title, "Bridge of Questionable Genius");
});

test("reject broken or hostile achievement markup without discarding the game", () => {
  assert.equal(cleanGeneratedAchievement({ title: "<script>", description: "Something rather nasty indeed." }), null);
  assert.equal(cleanGeneratedAchievement({ title: "Take a look", description: "Visit https://example.org for rewards." }), null);
  assert.equal(cleanGeneratedAchievement({ title: "A", description: "Not long enough." }), null);
  const okay = cleanGeneratedAchievement({ title: "  Dancing Legend  ", description: "  Goblins will remember the performance forever.  " });
  assert.deepEqual(okay, { title: "Dancing Legend", description: "Goblins will remember the performance forever." });
});


test("Hollowmere badges use specific brief copy instead of repeated stock achievements", () => {
  const thimble = fallbackAchievement("I offer a kiss and the silver thimble", "The Frightened Guard", true, 4);
  const key = fallbackAchievement("I unlock the plate with Spoon's brass key", "The Whispering Stair", true, 4);
  const dance = fallbackAchievement("I dance the dance of promises", "The Bell and the Keeper", true, 4);
  assert.equal(thimble?.title, "Thimble Diplomacy");
  assert.equal(key?.title, "Namekeeper's Key");
  assert.notEqual(dance?.title, "Lord of the Dance");
  assert.ok(dance.description.split(/\s+/).length < 16);
  const generated = achievementFromJudgment({ ...bridge, title: "The Bell and the Keeper" },
    "I dance", true, 4, { title: "Lord of the Dance", description: "Dancing was somehow enough." });
  assert.notEqual(generated?.title, "Lord of the Dance");
});

test("AI achievement copy is trimmed to one brief line", () => {
  const award = cleanGeneratedAchievement({
    title: "Unexpected Heroics",
    description: "The goblin signed your ridiculous permit. He then went home and ate three pies as a reward."
  });
  assert.equal(award?.description, "The goblin signed your ridiculous permit.");
});
