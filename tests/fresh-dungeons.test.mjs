import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FRESH_DUNGEONS, FRESH_DUNGEON_DATES, FRESH_PREVIEW_MODES, freshPreviewIndex } from "../src/fresh-dungeons.ts";
import { getDailyGame, getFreshPreviewGame } from "../src/game.ts";
import { validateSharedArt, sharedArtId, createSharedArtPrompt } from "../worker/shared-art.ts";
import worker from "../worker/index.ts";

const env = {
  AI_ENABLED: "false", ART_ENABLED: "false", PREVIEW_FRESH_ENABLED: "true",
  PREVIEW_TOMORROW_ENABLED: "true", PREVIEW_STORY_ENABLED: "true",
  ACTION_LIMITER: { async limit() { return { success: true }; } },
  ASSETS: { async fetch() { return new Response("fallback"); } }
};
const play = (index, overrides = {}) => worker.fetch(new Request("https://test.local/api/resolve", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    previewFresh: index, day: getFreshPreviewGame(index - 1).day,
    roomIndex: 0, action: "I offer to help with the first challenge",
    inventory: [...FRESH_DUNGEONS[index - 1].startingInventory],
    ...overrides
  })
}), env);

test("three new NES dungeons have distinct characters, objectives, scenes and starter inventories", () => {
  assert.equal(FRESH_DUNGEONS.length, 3);
  assert.equal(new Set(FRESH_DUNGEONS.map(d => d.slug)).size, 3);
  assert.equal(new Set(FRESH_DUNGEONS.map(d => d.title)).size, 3);
  assert.equal(new Set(FRESH_DUNGEONS.flatMap(d => d.startingInventory)).size, 9);
  for (let i = 0; i < 3; i++) {
    const dungeon = FRESH_DUNGEONS[i];
    assert.equal(dungeon.rooms.length, 3);
    assert.ok(dungeon.objective.length > 45);
    assert.equal(new Set(dungeon.rooms.map(r => r.character)).size, 3);
    assert.ok(dungeon.rooms[1].arrival && dungeon.rooms[2].arrival);
    assert.deepEqual(dungeon.rooms.map(r => r.difficulty), [10,12,14]);
    assert.equal(getFreshPreviewGame(i).dungeon.slug, dungeon.slug);
    assert.equal(getDailyGame(new Date(FRESH_DUNGEON_DATES[i] + "T18:00:00Z")).dungeon.slug, dungeon.slug);
    assert.equal(freshPreviewIndex(FRESH_PREVIEW_MODES[i]), i);
  }
});

test("existing public dungeons and Hollowmere are preserved", () => {
  assert.equal(getDailyGame(new Date("2026-10-24T12:00:00Z")).dungeon.slug, "midnight-museum");
  assert.equal(getDailyGame(new Date("2026-10-25T12:00:00Z")).dungeon.slug, "skywhale-express");
  assert.equal(getDailyGame(new Date("2026-10-26T12:00:00Z")).dungeon.slug, "bell-of-hollowmere");
});

test("clean playtest requires an explicit and authorized index", async () => {
  assert.equal((await play(1)).status, 200);
  assert.equal((await play(2)).status, 200);
  assert.equal((await play(3)).status, 200);
  assert.equal((await play(1,{ day: FRESH_DUNGEON_DATES[1] })).status, 409);
  assert.equal((await play(1,{ previewFresh: 4 })).status, 400);
  assert.equal((await play(1,{ previewTomorrow: true })).status, 400);
  const blocked = await worker.fetch(new Request("https://test.local/api/resolve", {
    method:"POST", headers:{"content-type":"application/json"},
    body: JSON.stringify({
      day:FRESH_DUNGEON_DATES[0], roomIndex:0, previewFresh:1,
      action:"I offer to help", inventory:[]
    })
  }), { ...env, PREVIEW_FRESH_ENABLED: "false" });
  assert.equal(blocked.status, 403);
});

test("shared illustration cache keys and validation isolate all three playtests", async () => {
  const ids=[];
  for (let i=0; i<3; i++) {
    const request = { day:FRESH_DUNGEON_DATES[i], kind:"room", roomIndex:0, preview:FRESH_PREVIEW_MODES[i] };
    const selection = validateSharedArt(request, env);
    assert.equal(selection?.dungeon.slug,FRESH_DUNGEONS[i].slug);
    assert.match(createSharedArtPrompt(selection.dungeon, request), /8-bit NES/);
    ids.push(await sharedArtId(request));
    assert.equal(validateSharedArt({...request, preview:FRESH_PREVIEW_MODES[(i+1)%3]},env),null);
    assert.equal(validateSharedArt(request,{ ...env, PREVIEW_FRESH_ENABLED:"false" }),null);
  }
  assert.equal(new Set(ids).size,3);
});

test("fresh browser saves never overwrite real or previous preview progress", () => {
  const app=readFileSync(new URL("../src/App.tsx",import.meta.url),"utf8");
  assert.match(app, /nes-clean-v1:/);
  assert.match(app, /FRESH_PREVIEW_MODES\[freshIndex/);
  assert.match(app, /"test-hollowmere:"/);
  assert.match(app, /"test-tomorrow:"/);
  assert.match(app, /previewFresh: freshIndex \+ 1/);
  const art=readFileSync(new URL("../src/IllustratedScene.tsx",import.meta.url),"utf8");
  assert.match(art, /"fresh-1"/);
  const pixel=readFileSync(new URL("../src/PixelScene.tsx",import.meta.url),"utf8");
  assert.match(pixel, /FreshPixelScene/);
});
