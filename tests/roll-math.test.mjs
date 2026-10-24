import test from "node:test";
import assert from "node:assert/strict";
import { DUNGEONS } from "../src/game.ts";
import { resolveAction } from "../src/engine.ts";
import { rollBreakdown } from "../src/roll-math.ts";

const room = DUNGEONS[0].rooms[0];

test("D20 breakdown shows actual die + creativity + item bonus = total versus DC", () => {
  const outcome = resolveAction(room, "I wield the potato like a sceptre.", ["Potato"], 7, 4);
  const roll = rollBreakdown(outcome);
  assert.deepEqual(roll, {
    die: 7, creativity: 4, itemBonus: 2,
    total: 13, target: 10, automaticSuccess: false, success: true
  });
});

test("failed rolls are represented truthfully", () => {
  const outcome = resolveAction(room, "I wave politely.", [], 2, 1);
  const roll = rollBreakdown(outcome);
  assert.equal(roll.die, 2);
  assert.equal(roll.creativity, 1);
  assert.equal(roll.itemBonus, 0);
  assert.equal(roll.total, 3);
  assert.equal(roll.success, false);
  assert.equal(roll.automaticSuccess, false);
});

test("a 5/5 masterstroke automatically succeeds even below the difficulty class", () => {
  const hardRoom = DUNGEONS[0].rooms[2];
  const outcome = resolveAction(hardRoom, "I astonish the dragon.", [], 1, 5);
  const roll = rollBreakdown(outcome);
  assert.equal(roll.die, 1);
  assert.equal(roll.total, 6);
  assert.equal(roll.target, 14);
  assert.equal(roll.success, true);
  assert.equal(roll.automaticSuccess, true);
});
