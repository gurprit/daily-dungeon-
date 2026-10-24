import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.ts";
import { getDailyGame, NEW_DAILY_DUNGEONS } from "../src/game.ts";
import { startingItems, itemsUsed, unavailableItems, itemCatalog, inventoryAfterTurn } from "../src/inventory.ts";
import { resolveAction } from "../src/engine.ts";

test("new dungeons start with three unique items and do not include potatoes", () => {
  for (const dungeon of NEW_DAILY_DUNGEONS) {
    const items = startingItems(dungeon);
    assert.equal(items.length, 3);
    assert.equal(items.includes("Potato"), false);
    assert.equal(new Set(items).size, items.length);
  }
});

test("using a single-use prop consumes it on success, failure and masterstrokes", () => {
  const dungeon = NEW_DAILY_DUNGEONS[0], room = dungeon.rooms[0];
  const initial = startingItems(dungeon);
  const action = "I hold up my pocket mirror to show Lady Varnish her finest portrait.";
  for (const roll of [1, 20]) {
    const outcome = resolveAction(room, action, initial, roll);
    assert.deepEqual(outcome.usedItems, ["Pocket mirror"]);
    const next = inventoryAfterTurn(initial, outcome.usedItems, outcome.reward);
    assert.equal(next.includes("Pocket mirror"), false);
    assert.equal(next.includes("Tin whistle"), true);
    assert.equal(next.includes(room.reward), outcome.success);
    assert.equal(itemsUsed(action, next).length, 0);
  }
  const master = resolveAction(room, action, initial, 1, 5);
  assert.equal(master.success, true);
  assert.equal(master.usedItems[0], "Pocket mirror");
  assert.equal(inventoryAfterTurn(initial, master.usedItems, master.reward).includes("Pocket mirror"), false);
});

test("two equipped props in one attempt are each consumed once, even if the roll fails", () => {
  const dungeon = NEW_DAILY_DUNGEONS[1], items = startingItems(dungeon);
  const action = "I tie my feather umbrella to my copper kazoo and play a tune for Nimbus.";
  const used = itemsUsed(action, items);
  assert.deepEqual(used, ["Feather umbrella", "Copper kazoo"]);
  const remaining = inventoryAfterTurn(items, used, null);
  assert.deepEqual(remaining, ["Bottle of bubbles"]);
  assert.deepEqual(unavailableItems(action, remaining, itemCatalog(dungeon)), used);
});

test("a reward can be carried forward and is consumed the next time it is used", () => {
  const dungeon = NEW_DAILY_DUNGEONS[1], first = startingItems(dungeon);
  const next = inventoryAfterTurn(first, ["Feather umbrella"], dungeon.rooms[0].reward);
  assert.ok(next.includes("Skywhale ticket"));
  const final = inventoryAfterTurn(next, itemsUsed("I offer my skywhale ticket to the storm inspector.", next), null);
  assert.equal(final.includes("Skywhale ticket"), false);
});

test("item matching requires whole names rather than substrings", () => {
  assert.deepEqual(itemsUsed("I inspect the mirrored hallway.", ["Pocket mirror"]), []);
  assert.deepEqual(itemsUsed("My copper kazoo starts playing.", ["Copper kazoo"]), ["Copper kazoo"]);
  assert.deepEqual(unavailableItems("I offer a potato.", ["String"], ["String", "Potato"]), ["Potato"]);
});

test("server rejects a previously consumed known item before any AI calls", async () => {
  let modelCalls = 0;
  const dungeon = getDailyGame().dungeon;
  const initial = startingItems(dungeon);
  const missing = initial[0];
  const env = {
    AI_ENABLED: "true",
    DAILY_BUDGET_DB: { prepare() { throw Error("D1 should never be invoked for an unavailable prop"); } },
    AI: { async run() { modelCalls++; return {}; } },
    ACTION_LIMITER: { async limit() { return { success: true }; } }
  };
  const response = await worker.fetch(new Request("https://example.com/api/resolve", {
    method: "POST", headers: {"content-type":"application/json"},
    body: JSON.stringify({
      day: getDailyGame().day,
      roomIndex: 1,
      action: "I reuse my " + missing + " after it was consumed in the previous room.",
      inventory: initial.slice(1)
    })
  }), env);
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /no longer in your inventory/);
  assert.equal(modelCalls, 0);
});
