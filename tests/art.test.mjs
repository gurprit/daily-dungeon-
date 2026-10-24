import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import worker from "../worker/index.ts";
import { getDailyGame } from "../src/game.ts";

const fixture = () => ({
  AI_ENABLED: "false",
  ACTION_LIMITER: { async limit() { return { success: true }; } },
  ASSETS: { async fetch() { return new Response("ok"); } }
});

test("image API endpoints no longer exist and cannot start inference", async () => {
  for (const endpoint of ["/api/shared-art", "/api/generate-room-art", "/api/art-status/123", "/api/art/123"]) {
    const response = await worker.fetch(new Request("https://dungeon.test" + endpoint, {
      method: endpoint === "/api/shared-art" ? "POST" : "GET",
      headers: { "content-type": "application/json" },
      body: endpoint === "/api/shared-art" ? "{}" : undefined
    }), fixture());
    assert.equal(response.status, 404, endpoint + " must remain removed");
  }
});

test("scripted gameplay contains no image generation ticket or dependency", async () => {
  const response = await worker.fetch(new Request("https://dungeon.test/api/resolve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ day: getDailyGame().day, roomIndex: 0, action: "I offer a goblin an apple", inventory: [] })
  }), fixture());
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(typeof body.narration, "string");
  assert.equal(Object.hasOwn(body, "artTicket"), false);
});

test("health declares local SVG illustration mode and does not require image services", async () => {
  const response = await worker.fetch(new Request("https://dungeon.test/api/health"), fixture());
  const health = await response.json();
  assert.equal(health.illustrations, "client-side-svg");
  assert.equal(health.narrator, "scripted");
  assert.equal(Object.hasOwn(health, "art"), false);
});

test("worker has no image-model configuration or model invocation paths", () => {
  const workerSource = readFileSync(new URL("../worker/index.ts", import.meta.url), "utf8");
  const config = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  const engine = readFileSync(new URL("../src/engine.ts", import.meta.url), "utf8");
  assert.doesNotMatch(workerSource, /makeArtTicket|handleArtRoute|handleSharedArtRoute|flux|generate-room-art/i);
  assert.doesNotMatch(config, /ART_ENABLED|ART_DAILY_LIMIT|ART_BUCKET|r2_buckets/);
  assert.doesNotMatch(app, /generate-room-art|shared-art|art-status|artTicket|<img\b/i);
  assert.doesNotMatch(engine, /artTicket/i);
  assert.match(app, /ProceduralIllustration/);
});
