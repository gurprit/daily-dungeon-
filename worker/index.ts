import { getDailyGame, STARTING_INVENTORY } from "../src/game.ts";
import { resolveAction } from "../src/engine.ts";
import { judgeWithAI } from "./judge.ts";

type Env = {
  AI_ENABLED?: string;
  AI_DAILY_LIMIT?: string;
  PLAYTEST_CODE?: string;
  DAILY_BUDGET_DB?: {
    prepare: (sql: string) => {
      bind: (...values: unknown[]) => {
        first: () => Promise<{ calls: number } | null>;
      };
    };
  };
  ACTION_LIMITER: { limit: (options: { key: string }) => Promise<{ success: boolean }> };
  AI: { run: (model: string, input: Record<string, unknown>) => Promise<unknown> };
  ASSETS: { fetch: (request: Request) => Promise<Response> };
};

type ActionRequest = {
  day?: unknown;
  roomIndex?: unknown;
  action?: unknown;
  inventory?: unknown;
};

const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });

function normaliseInventory(value: unknown): string[] {
  const allowed = new Set<string>(STARTING_INVENTORY);
  const daily = getDailyGame();
  for (const room of daily.dungeon.rooms) allowed.add(room.reward);
  if (!Array.isArray(value)) return [...STARTING_INVENTORY];
  return value.filter((item): item is string => typeof item === "string" && allowed.has(item)).slice(0, 6);
}

async function reserveDailyBudget(env: Env, day: string): Promise<boolean> {
  if (!env.DAILY_BUDGET_DB) throw new Error("AI daily budget database is not configured");
  const setting = Number(env.AI_DAILY_LIMIT ?? "36");
  const max = Number.isInteger(setting) ? Math.max(1, Math.min(100, setting)) : 36;
  // One atomic SQL write; strict across Cloudflare locations. Reserve BEFORE inference.
  // Failed or malformed model responses still consume a slot, preventing repeated costly retries.
  const row = await env.DAILY_BUDGET_DB.prepare(
    "INSERT INTO ai_daily_budget (day, calls) VALUES (?, 1) " +
    "ON CONFLICT(day) DO UPDATE SET calls = calls + 1 WHERE calls < ? RETURNING calls"
  ).bind(day, max).first();
  return !!row;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const aiRequested = env.AI_ENABLED === "true";
    const aiConfigured = !!env.PLAYTEST_CODE && !!env.DAILY_BUDGET_DB && !!env.AI;
    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        narrator: aiRequested ? (aiConfigured ? "playtest-locked" : "setup-required") : "scripted",
        day: getDailyGame().day
      });
    }

    if (url.pathname === "/api/resolve") {
      if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
      if ((Number(request.headers.get("content-length")) || 0) > 6000) {
        return json({ error: "Request too large." }, 413);
      }
      const key = request.headers.get("cf-connecting-ip") ?? "unknown";
      const allowed = await env.ACTION_LIMITER.limit({ key });
      if (!allowed.success) return json({ error: "Even heroes need a rest. Try again in a minute." }, 429);

      if (aiRequested) {
        // Fail closed: never silently expose an AI endpoint without a passcode and global budget.
        if (!aiConfigured) return json({ error: "AI playtest setup is incomplete (secret or D1 database missing)." }, 503);
        const provided = request.headers.get("x-dungeon-playtest-code") ?? "";
        if (provided !== env.PLAYTEST_CODE) return json({ error: "The Dungeon Master requires your private playtest code." }, 401);
      }

      let body: ActionRequest;
      try {
        const text = await request.text();
        if (text.length > 6000) return json({ error: "Request too large." }, 413);
        body = JSON.parse(text) as ActionRequest;
        if (!body || typeof body !== "object") throw new Error("Bad body");
      } catch { return json({ error: "Invalid JSON." }, 400); }

      const daily = getDailyGame();
      if (body.day !== daily.day) return json({ error: "A new dungeon has begun. Refresh to continue." }, 409);
      if (!Number.isInteger(body.roomIndex) || Number(body.roomIndex) < 0 || Number(body.roomIndex) > 2) {
        return json({ error: "Invalid room." }, 400);
      }
      if (typeof body.action !== "string" || body.action.trim().length < 4 || body.action.length > 280) {
        return json({ error: "Use between 4 and 280 characters." }, 400);
      }

      const room = daily.dungeon.rooms[Number(body.roomIndex)];
      const inventory = normaliseInventory(body.inventory);
      const die = crypto.getRandomValues(new Uint32Array(1))[0] % 20 + 1;
      let outcome = resolveAction(room, body.action, inventory, die);

      if (aiRequested) {
        try {
          if (!(await reserveDailyBudget(env, daily.day))) {
            return json({ error: "Today's AI playtest budget is exhausted. Come back tomorrow or disable AI." }, 429);
          }
        } catch (error) {
          console.error("AI budget unavailable", error instanceof Error ? error.message : "unknown");
          return json({ error: "The AI budget gate is unavailable. No model call was made." }, 503);
        }
        const judgment = await judgeWithAI(env.AI, room.scene, room.character, room.challenge, body.action);
        if (judgment) {
          outcome = resolveAction(room, body.action, inventory, die, judgment.creativity);
          outcome.narration = outcome.success ? judgment.success : judgment.failure;
          outcome.mode = "ai";
        }
      }
      return json(outcome);
    }

    if (url.pathname.startsWith("/api/")) return json({ error: "Not found." }, 404);
    return env.ASSETS.fetch(request);
  }
};
