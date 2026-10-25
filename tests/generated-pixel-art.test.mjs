import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { generatedArtSeed, generatedSceneTheme } from "../src/generated-art-direction.ts";

test("three real daily-story settings make three distinct offline artworks, not a goblin bridge",()=>{
  const stories=[
    ["Floating Menagerie","The Animal Bazaar","A floating market run by animals, with strange stalls and flying traders.","market"],
    ["Mystic Mayhem","Apprentice Sorcerer's Workshop","An apprentice sorcerer's experiment has spilled potions and magical mixtures everywhere.","magic"],
    ["Weather Accord","The Sunny Sirens' Sanctuary","A bright airy cave filled with singing Sunny Sirens, Solara and warm sunlight.","weather"]
  ];
  for(const [storyTitle,roomTitle,scene,expected] of stories)
    assert.equal(generatedSceneTheme(storyTitle,roomTitle,scene),expected);
  assert.notEqual(generatedArtSeed("daily-ai-2026-10-25-0",0),generatedArtSeed("daily-ai-2026-10-25-1",0));
  assert.notEqual(generatedArtSeed("daily-ai-2026-10-25-0",0),generatedArtSeed("daily-ai-2026-10-25-0",1));
});
test("fallback uses exact story/room context, and model image requests use the same trusted identity",()=>{
 const px=readFileSync(new URL("../src/PixelScene.tsx",import.meta.url),"utf8");
 const art=readFileSync(new URL("../src/GeneratedPixelScene.tsx",import.meta.url),"utf8");
 const app=readFileSync(new URL("../src/App.tsx",import.meta.url),"utf8");
 const img=readFileSync(new URL("../src/IllustratedScene.tsx",import.meta.url),"utf8");
 const worker=readFileSync(new URL("../worker/shared-art.ts",import.meta.url),"utf8");
 assert.match(px,/dungeonSlug\.startsWith\("daily-ai-"\)/);
 assert.match(px,/<GeneratedPixelScene/);
 assert.match(art,/generatedSceneTheme\(storyTitle,roomTitle,sceneText\)/);
 assert.match(app,/storyTitle=\{dungeon\.title\}/);
 assert.match(app,/roomTitle=\{room\.title\} sceneText=\{room\.scene\}/);
 assert.match(img,/dailySource, dailySlot, dungeonSlug, kind, roomIndex/);
 assert.match(img,/dailySource, dungeonSlug/);
 assert.match(worker,/dungeonSlug:dungeon\.slug/);
 assert.match(worker,/dailyRequest\.dungeonSlug===dungeon\.slug/);
 assert.match(worker,/v5-nes8/);
});
