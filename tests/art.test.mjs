import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.ts";
import { getDailyGame } from "../src/game.ts";
import { artEnabled, artServiceStatus, makeArtTicket, verifyArtTicket, handleArtRoute, createPixelArtPrompt } from "../worker/art.ts";

function mockArt() {
  const jobs = new Map();
  const counts = new Map();
  const objects = new Map();
  const stats = { imageCalls: 0, reserved: 0 };
  const tinyImage = Buffer.alloc(512, 12).toString("base64");

  const database = {
    prepare(sql) {
      return {
        bind(...params) {
          return {
            async first() {
              if (sql.startsWith("INSERT OR IGNORE INTO art_jobs")) {
                const [id, day, index] = params;
                if (jobs.has(id)) return null;
                jobs.set(id, { id, day, room_index: index, status: "pending", object_key: null });
                return { id };
              }
              if (sql.startsWith("SELECT status, object_key")) {
                return jobs.get(params[0]) ?? null;
              }
              if (sql.startsWith("INSERT INTO art_daily_budget")) {
                const day = params[0];
                const count = counts.get(day) ?? 0;
                if (count >= params[1]) return null;
                counts.set(day, count + 1);
                stats.reserved++;
                return { calls: count + 1 };
              }
              if (sql.startsWith("UPDATE art_jobs")) {
                const [status, key, id] = params;
                const row = jobs.get(id);
                if (row) jobs.set(id, { ...row, status, object_key: key });
                return null;
              }
              throw Error("Unexpected SQL: " + sql);
            }
          };
        }
      };
    }
  };
  const imageBucket = {
    async get(key) {
      const bytes = objects.get(key);
      return bytes ? { body: new Response(bytes).body, httpMetadata: { contentType: "image/png" } } : null;
    },
    async put(key, data) { objects.set(key, data); }
  };
  const env = {
    AI_ENABLED: "false",
    ART_ENABLED: "true",
    ART_DAILY_LIMIT: "1",
    ART_SIGNING_KEY: "eac35f01-67f4-491a-af67-secret-very-long",
    ART_BUCKET: imageBucket,
    DAILY_BUDGET_DB: database,
    AI: {
      async run(name, input) {
        assert.equal(name, "@cf/black-forest-labs/flux-2-klein-4b");
        assert.ok(input.multipart.body);
        stats.imageCalls++;
        return { image: tinyImage };
      }
    },
    ACTION_LIMITER: { async limit() { return { success: true }; } },
    ASSETS: { async fetch() { return new Response("ok"); } }
  };
  return { env, stats, jobs, objects };
}

const makeRequest = (token) => new Request("https://dungeon.test/api/generate-room-art", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ token })
});

test("art disabled by default and existing game stays playable", async () => {
  const mock = mockArt();
  mock.env.ART_ENABLED = "false";
  assert.equal(artEnabled(mock.env), false);
  const result = await worker.fetch(new Request("https://dungeon.test/api/resolve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ day: getDailyGame().day, roomIndex: 0, action: "I dance with goblins", inventory: [] })
  }), mock.env);
  const payload = await result.json();
  assert.equal(result.status, 200);
  assert.equal(payload.artTicket, undefined);
  assert.equal(mock.stats.imageCalls, 0);
});

test("trusted result ticket is signed; arbitrary and altered inputs are rejected", async () => {
  const mock = mockArt();
  const ticket = await makeArtTicket(mock.env, 0, "I perform a glorious potato dance", "The goblin waves me through.", true);
  assert.ok(ticket);
  const valid = await verifyArtTicket(mock.env, ticket);
  assert.equal(valid.roomIndex, 0);
  assert.match(createPixelArtPrompt(valid), /1990s console fantasy RPG/);
  assert.equal(await verifyArtTicket(mock.env, ticket.slice(0, -5) + "hello"), null);
  const rejection = await handleArtRoute(makeRequest("unsigned-invented-ticket"), mock.env);
  assert.equal(rejection.status, 403);
  assert.equal(mock.stats.imageCalls, 0);
});

test("one ticket gets one image generation and one budget slot, including duplicate requests", async () => {
  const mock = mockArt();
  const token = await makeArtTicket(mock.env, 0, "I dance", "The goblin waves me through.", true);
  const queue = [];
  const context = { waitUntil(promise) { queue.push(promise); } };
  const first = await handleArtRoute(makeRequest(token), mock.env, context);
  assert.equal(first.status, 202);
  const firstBody = await first.json();
  assert.ok(firstBody.id);
  await Promise.all(queue);
  const duplicate = await handleArtRoute(makeRequest(token), mock.env, context);
  const duplicateBody = await duplicate.json();
  assert.equal(duplicate.status, 200);
  assert.equal(duplicateBody.url, "/api/art/" + firstBody.id);
  assert.equal(mock.stats.imageCalls, 1);
  assert.equal(mock.stats.reserved, 1);
  const status = await handleArtRoute(new Request("https://dungeon.test/api/art-status/" + firstBody.id), mock.env);
  assert.equal((await status.json()).status, "ready");
  const image = await handleArtRoute(new Request("https://dungeon.test/api/art/" + firstBody.id), mock.env);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/png");
});

test("second unique ticket hits the separate art budget, without making a model call", async () => {
  const mock = mockArt();
  const context = { waitUntil() {} };
  const first = await makeArtTicket(mock.env, 0, "I sing", "It works.", true);
  const second = await makeArtTicket(mock.env, 1, "I dance", "It works again.", true);
  assert.equal((await handleArtRoute(makeRequest(first), mock.env, context)).status, 202);
  const secondResponse = await handleArtRoute(makeRequest(second), mock.env, context);
  assert.equal(secondResponse.status, 429);
  assert.equal(mock.stats.reserved, 1);
});

test("health exposes disabled and missing art setup without disclosing secrets", async () => {
  const mock = mockArt();
  mock.env.ART_ENABLED = "false";
  let response = await worker.fetch(new Request("https://dungeon.test/api/health"), mock.env);
  assert.deepEqual((await response.json()).art, { status: "disabled" });
  mock.env.ART_ENABLED = "true";
  mock.env.ART_SIGNING_KEY = "short";
  response = await worker.fetch(new Request("https://dungeon.test/api/health"), mock.env);
  const missing = (await response.json()).art;
  assert.equal(missing.status, "setup-required");
  assert.ok(missing.missing.includes("ART_SIGNING_KEY (32+ characters)"));
  assert.equal(JSON.stringify(missing).includes("short"), false);
  assert.deepEqual(artServiceStatus({ ...mock.env, ART_SIGNING_KEY: "a".repeat(42) }), { status: "ready" });
});

test("real resolved rooms issue signed art tickets when bindings are ready", async () => {
  const mock = mockArt();
  const result = await worker.fetch(new Request("https://dungeon.test/api/resolve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      day: getDailyGame().day, roomIndex: 0,
      action: "I swing a potato over my head and perform an opera.", inventory: ["Potato"]
    })
  }), mock.env);
  assert.equal(result.status, 200);
  const outcome = await result.json();
  assert.equal(typeof outcome.artTicket, "string");
  assert.equal((await verifyArtTicket(mock.env, outcome.artTicket)).roomIndex, 0);
  assert.equal(mock.stats.imageCalls, 0, "no image call until /api/generate-room-art");
});
