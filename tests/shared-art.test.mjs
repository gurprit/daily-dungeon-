import test from "node:test";
import assert from "node:assert/strict";
import { getDailyGame } from "../src/game.ts";
import { handleSharedArtRoute, validateSharedArt, createSharedArtPrompt, sharedArtId } from "../worker/shared-art.ts";
import { handleArtRoute } from "../worker/art.ts";

function envMock() {
  const jobs = new Map();
  const objects = new Map();
  let reservations = 0;
  let generations = 0;
  const env = {
    ART_ENABLED: "true",
    ART_SIGNING_KEY: "this-is-a-fairly-long-secret-for-test-only",
    ART_DAILY_LIMIT: "600",
    PREVIEW_STORY_ENABLED: "true",
    PREVIEW_TOMORROW_ENABLED: "true",
    ACTION_LIMITER: { async limit() { return { success: true }; } },
    DAILY_BUDGET_DB: {
      prepare(sql) {
        return {
          bind(...values) {
            return {
              async first() {
                if (sql.startsWith("INSERT OR IGNORE INTO art_jobs")) {
                  const [id, day, room] = values;
                  if (jobs.has(id)) return null;
                  jobs.set(id, { status: "pending", object_key: null, day, room_index: room });
                  return { id };
                }
                if (sql.startsWith("SELECT status, object_key")) return jobs.get(values[0]) ?? null;
                if (sql.startsWith("INSERT INTO art_daily_budget")) {
                  reservations++;
                  return { calls: reservations };
                }
                if (sql.startsWith("UPDATE art_jobs")) {
                  const [status, object_key, id] = values;
                  jobs.set(id, { ...jobs.get(id), status, object_key });
                  return null;
                }
                throw new Error("Unexpected D1 query: " + sql);
              }
            };
          }
        };
      }
    },
    ART_BUCKET: {
      async put(key, data) { objects.set(key, data); },
      async get(key) {
        const value = objects.get(key);
        return value ? { body: new Response(value).body, httpMetadata: { contentType: "image/png" } } : null;
      }
    },
    AI: {
      async run(name, request) {
        generations++;
        assert.equal(name, "@cf/black-forest-labs/flux-2-klein-4b");
        const form = await new Response(request.multipart.body, {
          headers: { "content-type": request.multipart.contentType }
        }).formData();
        assert.match(form.get("prompt"), /storybook/);
        assert.equal(form.get("width"), "768");
        assert.equal(form.get("height"), "512");
        return { image: Buffer.alloc(512, 8).toString("base64") };
      }
    }
  };
  return { env, jobs, counts: () => ({ reservations, generations }) };
}
const request = (payload) => new Request("https://example.test/api/shared-art", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(payload)
});

test("shared art only accepts currently available authored scenes", () => {
  const mock = envMock();
  const day = getDailyGame().day;
  assert.ok(validateSharedArt({ day, roomIndex: 0, kind: "room", preview: "today" }, mock.env));
  assert.equal(validateSharedArt({ day: "2025-01-01", roomIndex: 0, kind: "room", preview: "today" }, mock.env), null);
  assert.equal(validateSharedArt({ day, roomIndex: 0, kind: "room", preview: "today", variant: "arbitrary" }, mock.env), null);
  assert.equal(validateSharedArt({ day, roomIndex: 1, kind: "clue", preview: "today", variant: "spoon" }, mock.env), null);
  assert.equal(validateSharedArt({ day, roomIndex: 3, kind: "room", preview: "today" }, mock.env), null);
  assert.equal(validateSharedArt({ day, roomIndex: 0, kind: "room", preview: "invalid" }, mock.env), null);
  const storyDay = "2026-10-26";
  assert.ok(validateSharedArt({ day: storyDay, roomIndex: 0, kind: "clue", variant: "spoon", preview: "hollowmere" }, mock.env));
  assert.equal(validateSharedArt({ day: storyDay, roomIndex: 1, kind: "clue", variant: "spoon", preview: "hollowmere" }, mock.env), null);
  assert.equal(validateSharedArt({ day: storyDay, roomIndex: 2, kind: "ending", variant: "unknown", preview: "hollowmere" }, mock.env), null);
  assert.equal(validateSharedArt({ day: storyDay, roomIndex: 2, kind: "ending", variant: "victory", preview: "hollowmere" }, mock.env), null);
  assert.equal(validateSharedArt({ day: storyDay, roomIndex: 2, kind: "ending", variant: "oath-remade", preview: "hollowmere" }, { ...mock.env, PREVIEW_STORY_ENABLED: "false" }), null);
});

test("fixed scenes have stable IDs while clue and ending variants get distinct images", async () => {
  const basic = { day: "2026-10-26", roomIndex: 0, kind: "room", preview: "hollowmere" };
  const first = await sharedArtId(basic);
  assert.equal(first, await sharedArtId({ ...basic }));
  assert.match(first, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
  assert.notEqual(first, await sharedArtId({ ...basic, kind: "clue", variant: "spoon" }));
  assert.notEqual(await sharedArtId({ ...basic, kind: "clue", variant: "spoon" }),
    await sharedArtId({ ...basic, kind: "clue", variant: "note" }));
  assert.match(createSharedArtPrompt(getDailyGame(new Date("2026-10-26T12:00:00Z")).dungeon, basic), /bell tower/i);
});

test("shared artwork is generated once and retrieved from R2 by all later requests", async () => {
  const mock = envMock();
  const payload = { day: getDailyGame().day, roomIndex: 0, kind: "room", preview: "today" };
  const scheduled = [];
  const context = { waitUntil(task) { scheduled.push(task); } };
  const first = await handleSharedArtRoute(request(payload), mock.env, context);
  assert.equal(first.status, 202);
  const firstBody = await first.json();
  assert.equal(firstBody.status, "pending");
  const second = await handleSharedArtRoute(request(payload), mock.env, context);
  assert.equal(second.status, 202);
  assert.equal((await second.json()).id, firstBody.id);
  await Promise.all(scheduled);
  const ready = await handleSharedArtRoute(request(payload), mock.env, context);
  assert.equal(ready.status, 200);
  assert.equal((await ready.json()).url, "/api/art/" + firstBody.id);
  assert.deepEqual(mock.counts(), { reservations: 1, generations: 1 });
  const image = await handleArtRoute(new Request("https://example.test/api/art/" + firstBody.id), mock.env);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/png");
});

test("disabled art cannot start a job and does not spend the image budget", async () => {
  const mock = envMock();
  mock.env.ART_ENABLED = "false";
  const result = await handleSharedArtRoute(request({
    day: getDailyGame().day, roomIndex: 0, kind: "room", preview: "today"
  }), mock.env);
  assert.equal(result.status, 503);
  assert.deepEqual(mock.counts(), { reservations: 0, generations: 0 });
});
