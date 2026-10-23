import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.ts";
import { getDailyGame } from "../src/game.ts";

function makeEnv({ aiEnabled = true, budget = true, allowed = true, masterpiece = false } = {}) {
  let calls = 0;
  let reservations = 0;
  return {
    vars: {
      AI_ENABLED: aiEnabled ? "true" : "false",
      AI_DAILY_LIMIT: "36",
      AI: {
        async run() {
          calls++;
          return { response: JSON.stringify({
            creativity: masterpiece ? 5 : 3,
            ...(masterpiece ? { achievement: {
              title: "Lord of the Dance",
              description: "You danced an entire bridge toll out of existence."
            } } : {}),
            success: "Boggle studies your eccentric solution and stamps your imaginary permit. The bridge is yours.",
            failure: "Boggle consults a regulation written upside down and rejects your offer. You sneak past, chastened."
          }) };
        }
      },
      ACTION_LIMITER: { async limit() { return { success: allowed }; } },
      DAILY_BUDGET_DB: budget ? {
        prepare(sql) {
          assert.match(sql, /ai_daily_budget/);
          return { bind() {
            return { async first() {
              reservations++;
              return { calls: reservations };
            } };
          } };
        }
      } : undefined,
      ASSETS: { async fetch() { return new Response("game"); } }
    },
    count() { return { calls, reservations }; }
  };
}

function actionRequest() {
  return new Request("https://dungeon.test/api/resolve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      day: getDailyGame().day,
      roomIndex: 0,
      action: "I turn my potato into a tiny goblin crown and offer it to the bridge guard.",
      inventory: ["Potato", "String", "Rusty spoon"]
    })
  });
}

test("AI game accepts a player action without any playtest code", async () => {
  const env = makeEnv();
  const status = await worker.fetch(new Request("https://dungeon.test/api/health"), env.vars);
  assert.equal((await status.json()).narrator, "ai-ready");

  const result = await worker.fetch(actionRequest(), env.vars);
  assert.equal(result.status, 200);
  const body = await result.json();
  assert.equal(body.mode, "ai");
  assert.equal(body.creativity, 3);
  assert.deepEqual(env.count(), { calls: 1, reservations: 1 });
});

test("AI refuses to spend inference when D1 daily budget is unavailable", async () => {
  const env = makeEnv({ budget: false });
  const status = await worker.fetch(new Request("https://dungeon.test/api/health"), env.vars);
  assert.equal((await status.json()).narrator, "setup-required");

  const result = await worker.fetch(actionRequest(), env.vars);
  assert.equal(result.status, 503);
  assert.equal(env.count().calls, 0);
});

test("per-IP limiter still blocks excessive requests before AI", async () => {
  const env = makeEnv({ allowed: false });
  const result = await worker.fetch(actionRequest(), env.vars);
  assert.equal(result.status, 429);
  assert.deepEqual(env.count(), { calls: 0, reservations: 0 });
});

test("scripted mode remains accessible without a password or D1", async () => {
  const env = makeEnv({ aiEnabled: false, budget: false });
  const result = await worker.fetch(actionRequest(), env.vars);
  assert.equal(result.status, 200);
  assert.equal((await result.json()).mode, "scripted");
  assert.deepEqual(env.count(), { calls: 0, reservations: 0 });
});


test("high-creativity AI narration also returns a badge in the same request", async () => {
  const env = makeEnv({ masterpiece: true });
  const result = await worker.fetch(actionRequest(), env.vars);
  assert.equal(result.status, 200);
  const body = await result.json();
  assert.equal(body.mode, "ai");
  assert.equal(body.creativity, 5);
  assert.equal(body.success, true);
  assert.equal(body.achievement?.title, "Lord of the Dance");
  assert.deepEqual(env.count(), { calls: 1, reservations: 1 });
});
