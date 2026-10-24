import test from "node:test";
import assert from "node:assert/strict";
import { chooseEpilogue, writeEpilogue } from "../src/epilogue.ts";

test("saved adventures get a theatrical setting-specific conclusion, not a statistics recap", () => {
  const ending = writeEpilogue({
    dungeon: "The Skywhale Express", room: "The Moon Station",
    cleared: 2, visited: 3, hearts: 2, lastHonour: "Brave Kazoo Conductor",
    moments: [
      { room: "A Whale with Stage Fright", success: true },
      { room: "The Thundercloud Tollbooth", success: false },
      { room: "The Moon Station", success: true }
    ]
  });
  assert.match(ending, /nervous flying whale/i);
  assert.match(ending, /transport authority/i);
  assert.match(ending, /Brave Kazoo Conductor/);
  assert.match(ending, /reputation slightly dented/);
  assert.doesNotMatch(ending, /2 of 3|2 hearts|trials cleared|Dungeon Master records/i);
});

test("perfect and imperfect wins have genuinely different closing banter", () => {
  const hero = { dungeon: "The Royal Pantry", room: "The Hungry King", cleared: 3, visited: 3, hearts: 3 };
  const perfect = writeEpilogue({ ...hero, moments: [{ room: hero.room, success: true }] });
  const messy = writeEpilogue({ ...hero, hearts: 1, moments: [{ room: hero.room, success: false }] });
  assert.match(perfect, /dignity largely unaccounted for/);
  assert.match(messy, /reputation slightly dented/);
  assert.match(perfect, /onions/i);
  assert.notEqual(perfect, messy);
});

test("an early demise gets mockery without a claim the player escaped", () => {
  const ending = writeEpilogue({
    dungeon: "The Wizard's Complaint", room: "The Sphinx's Day Off",
    cleared: 0, visited: 2, hearts: 0
  });
  assert.match(ending, /Sphinx's Day Off/);
  assert.match(ending, /final shred of luck packed a suitcase/);
  assert.match(ending, /We did warn them/);
  assert.doesNotMatch(ending, /you escaped|you emerged|0 of 2/);
});

test("an authentic AI closing monologue wins over the fallback for newly completed games", () => {
  const fallback = { dungeon: "The Museum After Midnight", room: "The Forbidden Exhibit", cleared: 2, visited: 3, hearts: 2 };
  const ai = "I watched you silence an enchanted crown with a kazoo, and now three different museums want to ban musical instruments. The curator insists you saved the day, though I'm fairly certain he was hiding under a table. Take your bow, you walking health-and-safety violation.";
  assert.equal(chooseEpilogue(ai, fallback), ai);
  assert.match(chooseEpilogue("Too short", fallback), /gift shop/i);
  assert.match(chooseEpilogue(undefined, fallback), /gift shop/i);
});
