import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getDailyGame, getDailyChoices, getDailyGameForSlot } from "../src/game.ts";
import { validateSharedArt, sharedArtId } from "../worker/shared-art.ts";
import { createPixelArtPrompt, makeArtTicket, verifyArtTicket } from "../worker/art.ts";
import worker from "../worker/index.ts";

const date = "2026-10-25";
const dateAsUTC = day => new Date(day + "T12:00:00Z");

test("each UTC day offers exactly three different three-room adventures", () => {
  for (let offset = 0; offset < 60; offset++) {
    const now = new Date(Date.UTC(2026, 9, 23 + offset, 12));
    const choices = getDailyChoices(now);
    assert.equal(choices.length, 3);
    assert.equal(new Set(choices.map(c => c.dungeon.slug)).size, 3);
    assert.ok(choices.every(c => c.day === choices[0].day));
    assert.ok(choices.every(c => c.dungeon.rooms.length === 3));
    assert.equal(choices[0].dungeon.slug, getDailyGame(now).dungeon.slug, "legacy featured quest remains slot 0");
    for (const index of [0,1,2]) {
      assert.equal(getDailyGameForSlot(index, now).dungeon.slug, choices[index].dungeon.slug);
    }
  }
});

test("three-choice daily menu rotates rather than showing an identical slate each day", () => {
  let prior = null;
  for (let offset=0; offset<40; offset++) {
    const now = new Date(Date.UTC(2026,9,23+offset,12));
    const current = getDailyChoices(now).map(c => c.dungeon.slug).join("|");
    if (prior) assert.notEqual(current,prior,now.toISOString());
    prior=current;
  }
  assert.equal(getDailyChoices(dateAsUTC(date))[0].dungeon.slug, "skywhale-express");
});

test("the normal API selects the right quest, checks numeric slots and protects preview modes", async () => {
  const now = getDailyGame();
  const env = {
    AI_ENABLED:"false", ART_ENABLED:"false",
    ACTION_LIMITER:{async limit() {return {success:true};}},
    ASSETS:{async fetch(){return new Response("ok");}}
  };
  const play = (updates={}) => worker.fetch(new Request("https://daily.test/api/resolve",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({
      day:now.day, roomIndex:0,
      action:"I offer a helpful and highly unusual solution",
      inventory:[], ...updates
    })
  }),env);
  for (const dailySlot of [0,1,2]) {
    const response=await play({dailySlot});
    assert.equal(response.status,200, "daily slot "+dailySlot);
    const body=await response.json();
    assert.equal(typeof body.success,"boolean");
    assert.equal(body.mode,"scripted");
  }
  assert.equal((await play({dailySlot:3})).status,400);
  assert.equal((await play({dailySlot:"1"})).status,400);
  assert.equal((await play({dailySlot:-1})).status,400);
  assert.equal((await play({dailySlot:1,previewTomorrow:true})).status,400);
  assert.equal((await play({dailySlot:2,previewHollowmere:true})).status,400);
});

test("shared artwork verifies each daily slot and avoids cross-quest cache collisions", async () => {
  const now = dateAsUTC(date);
  const env={ART_ENABLED:"true"};
  const ids=[];
  for (const dailySlot of [0,1,2]) {
    const payload={day:date,roomIndex:0,kind:"room",preview:"today",dailySlot};
    const valid=validateSharedArt(payload,env,now);
    assert.equal(valid?.dungeon.slug,getDailyChoices(now)[dailySlot].dungeon.slug);
    ids.push(await sharedArtId(payload));
    assert.equal(validateSharedArt({...payload,preview:"tomorrow"},env,now),null);
    assert.equal(validateSharedArt({...payload,day:"2026-10-24"},env,now),null);
  }
  assert.equal(new Set(ids).size,3);
  assert.equal(await sharedArtId({day:date,roomIndex:0,kind:"room",preview:"today"}),
    await sharedArtId({day:date,roomIndex:0,kind:"room",preview:"today",dailySlot:0}));
  assert.equal(validateSharedArt({day:date,roomIndex:0,kind:"room",preview:"today",dailySlot:3},env,now),null);
});

test("signed personalised image prompts use the selected daily dungeon, not slot zero", async () => {
  const env={
    ART_ENABLED:"true",
    ART_SIGNING_KEY:"this-is-a-secret-longer-than-32-characters",
    ART_BUCKET:{}, DAILY_BUDGET_DB:{}, AI:{}
  };
  const day=date;
  const choices=getDailyChoices(dateAsUTC(day));
  const ticket=await makeArtTicket(env,0,"I befriend the stranger","The character smiles at me.",true,day,choices[2].dungeon.slug);
  assert.ok(ticket);
  const decoded=await verifyArtTicket(env,ticket);
  assert.equal(decoded?.dungeonSlug,choices[2].dungeon.slug);
  assert.ok(createPixelArtPrompt(decoded).includes(choices[2].dungeon.rooms[0].title));
});

test("the browser renders a daily roster and keeps its three saves separate", () => {
  const app=readFileSync(new URL("../src/App.tsx",import.meta.url),"utf8");
  const art=readFileSync(new URL("../src/IllustratedScene.tsx",import.meta.url),"utf8");
  const styles=readFileSync(new URL("../src/styles.scss",import.meta.url),"utf8");
  assert.match(app,/getDailyChoices\(/);
  assert.match(app,/daily-quests__grid/);
  assert.match(app,/href=\{index \? "\?quest=" \+ index/);
  assert.match(app,/daily-choice-/);
  assert.match(app,/dailySlot=\{dailySlot\}/);
  assert.match(app,/previewFresh: freshIndex \+ 1/);
  assert.match(art,/preview, dailySlot, kind, roomIndex/);
  assert.match(art,/\{ day, roomIndex, kind, variant, preview, dailySlot \}/);
  assert.match(styles,/@media \(max-width: 690px\)/);
});
