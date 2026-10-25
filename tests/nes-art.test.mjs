import test from "node:test";
import assert from "node:assert/strict";
import { NES_WIDTH, NES_HEIGHT, NES_PALETTE, quantiseNesPixels, closestNesColour } from "../src/nes-palette.ts";
import { generatedFxLayout } from "../src/image-fx-layout.ts";
import { makeEffectPlan } from "../src/effect-presets.ts";
import { makeVisualRecipe } from "../src/illustration-recipe.ts";
import { emittersForScene } from "../src/particle-engine.ts";
import { readFileSync } from "node:fs";

test("NES palette and virtual resolution are strict and deterministic", () => {
  assert.equal(NES_WIDTH, 192);
  assert.equal(NES_HEIGHT, 128);
  assert.ok(NES_PALETTE.length <= 32);
  assert.equal(new Set(NES_PALETTE.map(c => c.join(","))).size, NES_PALETTE.length);
  const pixels = new Uint8ClampedArray([111,77,100,255, 10, 210, 179,255, 99,99,99,0]);
  quantiseNesPixels(pixels);
  for (let i=0;i<8;i+=4) {
    assert.ok(NES_PALETTE.some(c => c[0]===pixels[i] && c[1]===pixels[i+1] && c[2]===pixels[i+2]));
  }
  assert.deepEqual(Array.from(pixels.slice(8,12)), [99,99,99,0]);
  const once = Array.from(pixels);
  quantiseNesPixels(pixels);
  assert.deepEqual(Array.from(pixels), once);
  assert.deepEqual(closestNesColour(...NES_PALETTE[0]), NES_PALETTE[0]);
});

test("rendering style is shared and uses a new cache version", async () => {
  const { ILLUSTRATION_STYLE, createPixelArtPrompt } = await import("../worker/art.ts");
  const { sharedArtId, createSharedArtPrompt } = await import("../worker/shared-art.ts");
  const { getDailyGame } = await import("../src/game.ts");
  const game = getDailyGame(new Date("2026-10-26T12:00:00Z"));
  assert.match(ILLUSTRATION_STYLE, /8-bit NES/);
  assert.match(ILLUSTRATION_STYLE, /NOT a SNES/);
  assert.doesNotMatch(ILLUSTRATION_STYLE, /storybook gouache/);
  const day = game.day;
  const a = await sharedArtId({ day, preview: "hollowmere", roomIndex: 0, kind: "room" });
  assert.equal(a, await sharedArtId({ day, preview: "hollowmere", roomIndex: 0, kind: "room" }));
  assert.match(createSharedArtPrompt(game.dungeon, { day, roomIndex: 0, kind:"room", preview:"hollowmere" }), /LEFT THIRD/);
  assert.match(createPixelArtPrompt({ id:"test", day, roomIndex:0, issuedAt:Date.now(), action:"I dance", narration:"The goblin smiles", success:true }), /small readable pixel sprites/);
  const source = readFileSync(new URL("../worker/shared-art.ts", import.meta.url), "utf8");
  assert.match(source, /v5-nes8/);
});

test("generated art emits flames ONLY in scenes with torches", () => {
  const museum = { dungeonSlug:"midnight-museum", roomIndex:0, kind:"action", action:"I sing", success:true };
  const station = { dungeonSlug:"skywhale-express", roomIndex:2, kind:"action", action:"I shout", success:true };
  const gate = { dungeonSlug:"bell-of-hollowmere", roomIndex:0, kind:"room" };
  for (const input of [museum,station]) {
    const recipe=makeVisualRecipe(input), plan=makeEffectPlan(input,recipe);
    assert.deepEqual(generatedFxLayout(input).torches, []);
    assert.equal(emittersForScene(plan,input,true).filter(e=>e.kind==="flame").length,0);
  }
  const recipe=makeVisualRecipe(gate);
  const flame=emittersForScene(makeEffectPlan(gate,recipe),gate,true).filter(e=>e.kind==="flame");
  assert.deepEqual(flame.map(e=>e.x), [40,282]);
});

test("magical particles sit beside the right-side objective, not in the hero's face", () => {
  const scene={ kind:"action", dungeonSlug:"bell-of-hollowmere", roomIndex:1, action:"I cast a spell with my key", success:true };
  const recipe=makeVisualRecipe(scene);
  const emitters=emittersForScene(makeEffectPlan(scene,recipe),scene,true);
  assert.ok(emitters.some(e=>e.kind==="magic" && e.x>=200));
  assert.ok(emitters.reduce((n,e)=>n+e.count,0)<=40);
  const layout=generatedFxLayout(scene);
  assert.equal(layout.focal.x,224);
  assert.match(layout.caption,/RIGHT THIRD/);
});
