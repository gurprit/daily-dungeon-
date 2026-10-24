import test from "node:test";
import assert from "node:assert/strict";
import { writeEpilogue } from "../src/epilogue.ts";

test("victory epilogue reflects the actual dungeon, score, hearts and newest honour", () => {
  const ending = writeEpilogue({
    dungeon: "The Royal Pantry", room: "The Hungry King",
    cleared: 3, visited: 3, hearts: 2, lastHonour: "The Baked Bard"
  });
  assert.match(ending, /The Royal Pantry/);
  assert.match(ending, /3 of 3 trials/);
  assert.match(ending, /2 hearts remaining/);
  assert.match(ending, /The Baked Bard/);
});

test("one remaining heart and no honours use natural, truthful wording", () => {
  const ending = writeEpilogue({
    dungeon: "The Museum After Midnight", room: "The Forbidden Exhibit",
    cleared: 1, visited: 3, hearts: 1
  });
  assert.match(ending, /1 heart remaining/);
  assert.doesNotMatch(ending, /1 hearts/);
  assert.match(ending, /archives/);
});

test("a hero who loses all hearts gets an appropriate final chapter", () => {
  const ending = writeEpilogue({
    dungeon: "The Wizard's Complaint", room: "The Sphinx's Day Off",
    cleared: 0, visited: 2, hearts: 0
  });
  assert.match(ending, /Sphinx's Day Off/);
  assert.match(ending, /0 of 2 trials/);
  assert.match(ending, /final heart gave out/);
  assert.doesNotMatch(ending, /emerged/);
});
