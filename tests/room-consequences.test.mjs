import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FRESH_DUNGEONS } from "../src/fresh-dungeons.ts";
import { NEW_DAILY_DUNGEONS } from "../src/game.ts";
import { roomConsequence } from "../src/room-consequences.ts";
import { storyRoom } from "../src/story.ts";
import { resolveAction } from "../src/engine.ts";
import { priorStoryContext } from "../worker/continuity.ts";

const dungeons = [...FRESH_DUNGEONS, ...NEW_DAILY_DUNGEONS];
const good = { action: "I offer an original and useful solution", success: true };
const bad = { action: "I accidentally make a mess of it", success: false };

test("all five modern adventures branch visibly and consistently after room one", () => {
  for (const dungeon of dungeons) {
    const improved = storyRoom(dungeon, 1, [good]);
    const setback = storyRoom(dungeon, 1, [bad]);
    assert.ok(improved.echo?.length > 30, dungeon.slug);
    assert.ok(setback.echo?.length > 30, dungeon.slug);
    assert.notEqual(improved.arrival, setback.arrival, dungeon.slug);
    assert.notEqual(improved.scene, setback.scene, dungeon.slug);
    assert.notEqual(improved.echo, setback.echo, dungeon.slug);
    assert.equal(improved.difficulty, dungeon.rooms[1].difficulty, "past results never secretly change the dice");
    assert.equal(setback.difficulty, dungeon.rooms[1].difficulty);
    assert.equal(dungeon.rooms[1].echo, undefined, "pure helper does not mutate canonical room");
  }
});

test("the final room acknowledges the second-room outcome rather than inventing success", () => {
  for (const dungeon of dungeons) {
    const success = storyRoom(dungeon, 2, [bad, good]);
    const failure = storyRoom(dungeon, 2, [good, bad]);
    assert.ok(success.echo);
    assert.ok(failure.echo);
    assert.notEqual(success.arrival, failure.arrival, dungeon.slug);
    assert.notEqual(success.scene, failure.scene, dungeon.slug);
    assert.equal(success.difficulty, 14);
    assert.equal(failure.difficulty, 14);
    assert.equal(roomConsequence(dungeon.slug, 0, []), null);
    assert.equal(roomConsequence(dungeon.slug, 1, []), null);
    assert.equal(roomConsequence(dungeon.slug, 2, [good]), null);
  }
});

test("bakery setbacks cannot magically serve Doughbert after he escapes", () => {
  const bakery = FRESH_DUNGEONS[2];
  const loss = storyRoom(bakery, 2, [good, bad]);
  assert.match(loss.scene, /last yeast|no proper loaf/);
  assert.doesNotMatch(loss.arrival, /dough finally under control/i);
  const win = storyRoom(bakery, 2, [good, good]);
  assert.match(win.echo, /Doughbert cooperated/);
  assert.match(win.scene, /loaf ready/);
});

test("lighthouse light and orchard bees really affect their next challenges", () => {
  const lamp = FRESH_DUNGEONS[0], bees = FRESH_DUNGEONS[1];
  assert.match(storyRoom(lamp, 1, [good]).scene, /repaired lantern/);
  assert.match(storyRoom(lamp, 1, [bad]).scene, /Without a steady lantern/);
  assert.match(storyRoom(bees, 1, [good]).scene, /copper bees/);
  assert.match(storyRoom(bees, 1, [bad]).scene, /no helpful copper bees/);
});

test("scripted mode still reacts specifically, honours consequences and obeys health and inventory", () => {
  const bakery = FRESH_DUNGEONS[2];
  const room = storyRoom(bakery, 2, [good, bad]);
  const win = resolveAction(room, "I promise the giant free bread forever", [], 20);
  const fail = resolveAction(room, "I offer the giant a crumb", [], 1);
  assert.equal(win.success, true);
  assert.equal(win.reward, room.reward);
  assert.equal(fail.success, false);
  assert.equal(fail.heartsLost, 1);
  assert.match(win.narration, /Grumble/);
  assert.match(fail.narration, /Grumble/);
  assert.match(win.narration, /Doughbert got away/);
  assert.match(fail.narration, /Doughbert got away/);
  assert.equal(fail.reward, null);
});

test("the worker's bounded prior turn validation still filters forged context", () => {
  const room = FRESH_DUNGEONS[1].rooms;
  assert.equal(priorStoryContext([{ roomIndex: 1, action: "I win", narration: "I win forever and ever", success: true }], room, 1).length, 0);
  assert.equal(priorStoryContext(null, room, 2).length, 0);
});

test("loading and permanent SVG fallback have distinct labels and a bounded canvas load", () => {
  const image = readFileSync(new URL("../src/IllustratedScene.tsx", import.meta.url), "utf8");
  const canvas = readFileSync(new URL("../src/NesSceneImage.tsx", import.meta.url), "utf8");
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  const judge = readFileSync(new URL("../worker/judge.ts", import.meta.url), "utf8");
  assert.match(image, /Image service unavailable/);
  assert.match(image, /Artwork delayed/);
  assert.match(image, /Painting this adventure/);
  assert.match(image, /aria-live="polite"/);
  assert.match(canvas, /20_000/);
  assert.match(app, /YOUR EARLIER CHOICE CHANGED THIS ROOM/);
  assert.match(judge, /BOTH success and failure alternatives/);
});
