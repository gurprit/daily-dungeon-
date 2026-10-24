import test from "node:test";
import assert from "node:assert/strict";
import { getDailyGame } from "../src/game.ts";
import { HOLLOWMERE_DUNGEON, storyRoom, storyClues, inferFinaleChoice, storyEnding, storyGuidance } from "../src/story.ts";
import worker from "../worker/index.ts";

const dungeon = HOLLOWMERE_DUNGEON;
const diplomatic = [{ action: "I persuade Spoon to trust me and promise not to wake anything.", success: true }];
const violent = [{ action: "I attack the goblin with my sword.", success: true }];
const failed = [{ action: "I try to jump over Spoon.", success: false }];

test("Hollowmere has three linked rooms and is scheduled for 26 October", () => {
  assert.equal(dungeon.rooms.length, 3);
  assert.match(dungeon.objective, /Stop the bell/);
  assert.equal(getDailyGame(new Date("2026-10-26T08:00:00Z")).dungeon.slug, dungeon.slug);
  assert.notEqual(getDailyGame(new Date("2026-10-25T08:00:00Z")).dungeon.slug, dungeon.slug);
});

test("social and hostile guard approaches alter the second-room scene", () => {
  assert.match(storyRoom(dungeon, 1, diplomatic).arrival, /Spoon unlocks/);
  assert.match(storyRoom(dungeon, 1, violent).arrival, /vanishes/);
  assert.match(storyRoom(dungeon, 1, failed).arrival, /vanishes/);
  assert.match(storyClues(dungeon.slug, diplomatic)[0].text, /Keep the sleeper dreaming/);
  assert.match(storyClues(dungeon.slug, violent)[0].text, /Do not let the sleeper wake/);
  assert.equal(storyClues("unrelated", diplomatic).length, 0);
});

test("both success and failure yield essential clues, but only success gives the full inscription", () => {
  const successes = [...diplomatic, { action: "I decode the gears.", success: true }];
  const failures = [...failed, { action: "I kick the broken gear.", success: false }];
  assert.match(storyRoom(dungeon, 2, successes).arrival, /inscription/);
  assert.match(storyRoom(dungeon, 2, failures).arrival, /partial warning/);
  assert.match(storyClues(dungeon.slug, successes)[1].text, /willing promise/);
  assert.match(storyClues(dungeon.slug, failures)[1].text, /memories/);
  assert.match(storyGuidance(dungeon.slug, 2), /Elowen/);
});

test("three choices give distinct meaningful endings, and discovered clues matter", () => {
  const full = [...diplomatic, { action: "I read the inscription.", success: true }];
  const renew = storyEnding(dungeon.slug, "I restore the ward", true, 3, full);
  const release = storyEnding(dungeon.slug, "I free the ghost", true, 3, full);
  const reconcile = storyEnding(dungeon.slug, "I ask everyone to promise freely", true, 3, full);
  assert.equal(renew.id, "silent-bargain");
  assert.equal(release.id, "keeper-unchained");
  assert.equal(reconcile.id, "oath-remade");
  assert.match(renew.consequence, /remains bound/);
  assert.match(release.consequence, /stir/);
  assert.match(reconcile.consequence, /Elowen walks free/);
  const withoutInscription = [...diplomatic, { action: "I fell.", success: false }];
  assert.equal(storyEnding(dungeon.slug, "I make a bargain", true, 2, withoutInscription).id, "borrowed-dawn");
});

test("failed rolls, death, and unconnected dungeons cannot claim a perfect ending", () => {
  assert.equal(storyEnding(dungeon.slug, "I free the ghost", false, 1, diplomatic).id, "another-name-lost");
  assert.equal(storyEnding(dungeon.slug, "I free the ghost", true, 0, diplomatic).id, "last-toll");
  assert.equal(storyEnding("goblins-toll", "anything", true, 3, diplomatic), null);
  assert.equal(inferFinaleChoice("I shatter the bell"), "release");
  assert.equal(inferFinaleChoice("I repair the bell"), "renew");
  assert.equal(inferFinaleChoice("I bargain with the ghost"), "reconcile");
});

test("the story preview is gated and returns a canonical outcome without an image-AI dependency", async () => {
  const day = getDailyGame(new Date("2026-10-26T12:00:00Z")).day;
  const env = {
    AI_ENABLED: "false",
    PREVIEW_STORY_ENABLED: "true",
    ACTION_LIMITER: { async limit() { return { success: true }; } },
    ASSETS: { async fetch() { return new Response("ok"); } }
  };
  const request = () => new Request("https://dungeon.test/api/resolve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      day, previewHollowmere: true, roomIndex: 2,
      action: "I smash the bell and free Elowen",
      inventory: ["Apple"], priorTurns: [
        { roomIndex: 0, action: "I persuade Spoon", narration: "Spoon opens the gate.", success: true },
        { roomIndex: 1, action: "I decode the gears", narration: "I read the inscription.", success: true }
      ]
    })
  });
  const blocked = await worker.fetch(request(), { ...env, PREVIEW_STORY_ENABLED: "false" });
  assert.equal(blocked.status, 403);
  const result = await worker.fetch(request(), env);
  assert.equal(result.status, 200);
  const response = await result.json();
  assert.ok(response.storyEnding);
  assert.ok(["keeper-unchained", "another-name-lost", "last-toll"].includes(response.storyEnding.id));
});
