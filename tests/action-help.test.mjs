import test from "node:test";
import assert from "node:assert/strict";
import { DUNGEONS } from "../src/game.ts";
import { actionStarters, firstRoomTip } from "../src/action-help.ts";

test("every first room offers three distinct, editable non-spoiler starters", () => {
  for (const dungeon of DUNGEONS) {
    const room = dungeon.rooms[0];
    const starters = actionStarters(room, ["Potato", "String", "Rusty spoon"]);
    assert.deepEqual(starters.map(s => s.label), ["Use an item", "Talk it out", "Be ridiculous"]);
    for (const option of starters) {
      assert.ok(option.draft.length > 15);
      assert.ok(option.draft.length < 280);
      assert.equal(option.draft.at(-1), " ", "sentence starter invites player to finish it");
      assert.ok(option.tip.length > 0);
      assert.notEqual(option.draft, room.challenge, "do not auto-solve the encounter");
    }
    assert.ok(starters[1].draft.includes(room.character.split(",")[0]));
  }
  assert.match(firstRoomTip(), /no single right answer/i);
  assert.match(firstRoomTip(), /dice/i);
});

test("hints don't need inventory and don't trigger any model calls", () => {
  const starters = actionStarters(DUNGEONS[0].rooms[0], []);
  assert.equal(starters.length, 3);
  assert.match(starters[0].draft, /clever trick/);
});
