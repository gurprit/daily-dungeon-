import test from "node:test";
import assert from "node:assert/strict";
import { DUNGEONS, getDailyGame, STARTING_INVENTORY } from "../src/game.ts";
import { resolveAction } from "../src/engine.ts";

test("each prototype dungeon has exactly three rooms", () => {
  assert.equal(DUNGEONS.length, 3);
  for (const dungeon of DUNGEONS) {
    assert.equal(dungeon.rooms.length, 3);
    assert.ok(dungeon.rooms.every(room => room.difficulty >= 1 && room.reward));
  }
});

test("everyone gets the same UTC daily dungeon", () => {
  const morning = getDailyGame(new Date("2026-10-23T00:01:00Z"));
  const evening = getDailyGame(new Date("2026-10-23T23:59:00Z"));
  assert.equal(morning.day, "2026-10-23");
  assert.equal(morning.number, 1);
  assert.equal(morning.dungeon.slug, "goblins-toll");
  assert.equal(evening.dungeon.slug, morning.dungeon.slug);
  assert.equal(getDailyGame(new Date("2026-10-24T00:00:00Z")).dungeon.slug, "wizard-complaint");
});

test("dice mechanics cannot grant extra health or inventory on failure", () => {
  const room = DUNGEONS[0].rooms[0];
  const outcome = resolveAction(room, "I politely ask to cross.", STARTING_INVENTORY, 1);
  assert.equal(outcome.success, false);
  assert.equal(outcome.heartsLost, 1);
  assert.equal(outcome.reward, null);
  assert.equal(outcome.mode, "scripted");
});

test("item use and originality give bounded bonuses", () => {
  const room = DUNGEONS[0].rooms[0];
  const action = "I carve the potato into an elaborate miniature statue, then proudly offer it as a rare royal artifact.";
  const outcome = resolveAction(room, action, STARTING_INVENTORY, 6, 3);
  assert.equal(outcome.bonus, 5);
  assert.equal(outcome.creativity, 3);
  assert.equal(outcome.success, true);
  assert.equal(outcome.reward, room.reward);
  assert.equal(outcome.heartsLost, 0);
});

test("creativity modifier is clamped to 0..5 and masterstrokes succeed", () => {
  const room = DUNGEONS[0].rooms[2];
  const outcome = resolveAction(room, "I negotiate calmly.", [], 1, 999);
  assert.equal(outcome.creativity, 5);
  assert.equal(outcome.bonus, 5);
  assert.equal(outcome.masterstroke, true);
  assert.equal(outcome.success, true);
  assert.ok(outcome.narration.length > 0);
});
